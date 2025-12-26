import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ");
}

function parseTimedTextXml(xml: string): string {
  const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];

  for (const match of textMatches) {
    let text = match[1] ?? "";
    text = decodeHtmlEntities(text);
    if (text.trim()) texts.push(text.trim());
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}

// Parse JSON3 format
function parseJson3Transcript(json: any): string {
  try {
    const events = json?.events || [];
    const texts: string[] = [];
    
    for (const event of events) {
      if (event.segs) {
        for (const seg of event.segs) {
          if (seg.utf8 && seg.utf8.trim() && seg.utf8 !== "\n") {
            texts.push(seg.utf8.trim());
          }
        }
      }
    }
    
    return texts.join(" ").replace(/\s+/g, " ").trim();
  } catch (e) {
    console.log("JSON3 parse error:", e);
    return "";
  }
}

// Use YouTube's innertube API to get video info (more reliable, less rate-limiting)
async function fetchViaInnertube(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Trying innertube API for:", videoId);
  
  const innertubeUrl = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
  
  try {
    const response = await fetch(innertubeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "en",
            gl: "US",
            clientName: "WEB",
            clientVersion: "2.20231219.04.00",
          },
        },
        videoId: videoId,
      }),
    });

    if (!response.ok) {
      console.log("Innertube request failed:", response.status);
      return { transcript: "", language: "" };
    }

    const data = await response.json();
    const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      console.log("No caption tracks from innertube");
      return { transcript: "", language: "" };
    }

    console.log("Found", captionTracks.length, "tracks via innertube");
    
    // Find best track
    let selectedTrack = captionTracks.find((t: any) => 
      (t.languageCode === "en" || t.languageCode?.startsWith("en-")) && t.kind !== "asr"
    ) || captionTracks.find((t: any) => 
      t.languageCode === "en" || t.languageCode?.startsWith("en-")
    ) || captionTracks.find((t: any) => 
      t.kind !== "asr"
    ) || captionTracks[0];

    const baseUrl = selectedTrack?.baseUrl;
    const language = selectedTrack?.languageCode || "unknown";

    if (!baseUrl) {
      return { transcript: "", language };
    }

    // Fetch transcript
    const json3Url = baseUrl + "&fmt=json3";
    const captionRes = await fetch(json3Url);
    
    if (captionRes.ok) {
      const jsonData = await captionRes.json();
      const transcript = parseJson3Transcript(jsonData);
      if (transcript) {
        console.log("Got transcript via innertube, length:", transcript.length);
        return { transcript, language };
      }
    }

    // Try XML fallback
    const xmlRes = await fetch(baseUrl);
    if (xmlRes.ok) {
      const xml = await xmlRes.text();
      const transcript = parseTimedTextXml(xml);
      if (transcript) {
        return { transcript, language };
      }
    }

    return { transcript: "", language };
  } catch (e) {
    console.log("Innertube error:", e);
    return { transcript: "", language: "" };
  }
}

// Fallback: Try fetching via embed page (lighter than full watch page)
async function fetchViaEmbed(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Trying embed page for:", videoId);
  
  try {
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });

    if (!response.ok) {
      console.log("Embed fetch failed:", response.status);
      return { transcript: "", language: "" };
    }

    const html = await response.text();
    
    // Extract captions from embed page
    const captionMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionMatch) {
      console.log("No captions in embed page");
      return { transcript: "", language: "" };
    }

    // Try to find caption URL in the page
    const urlMatch = html.match(/https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/g);
    if (urlMatch && urlMatch.length > 0) {
      const captionUrl = urlMatch[0].replace(/\\u0026/g, "&");
      console.log("Found caption URL in embed");
      
      const captionRes = await fetch(captionUrl);
      if (captionRes.ok) {
        const text = await captionRes.text();
        const transcript = parseTimedTextXml(text);
        if (transcript) {
          return { transcript, language: "en" };
        }
      }
    }

    return { transcript: "", language: "" };
  } catch (e) {
    console.log("Embed error:", e);
    return { transcript: "", language: "" };
  }
}

// Third fallback: Try the timedtext API directly
async function fetchViaTimedText(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Trying timedtext API for:", videoId);
  
  const languages = ["en", "en-US", "en-GB", "hi", "es", "fr", "de", "pt", "ja", "ko", "zh"];
  
  for (const lang of languages) {
    try {
      // Try auto-generated captions
      const aUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&kind=asr`;
      const aRes = await fetch(aUrl);
      if (aRes.ok) {
        const xml = await aRes.text();
        if (xml.includes("<text")) {
          const transcript = parseTimedTextXml(xml);
          if (transcript && transcript.length > 50) {
            console.log("Got auto captions via timedtext API, lang:", lang);
            return { transcript, language: lang };
          }
        }
      }

      // Try manual captions
      const mUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
      const mRes = await fetch(mUrl);
      if (mRes.ok) {
        const xml = await mRes.text();
        if (xml.includes("<text")) {
          const transcript = parseTimedTextXml(xml);
          if (transcript && transcript.length > 50) {
            console.log("Got manual captions via timedtext API, lang:", lang);
            return { transcript, language: lang };
          }
        }
      }
    } catch (e) {
      // Continue to next language
    }
  }

  return { transcript: "", language: "" };
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Fetching transcript for video:", videoId);
  
  // Try innertube API first (most reliable)
  let result = await fetchViaInnertube(videoId);
  if (result.transcript) return result;
  
  // Try timedtext API (direct, less rate-limited)
  result = await fetchViaTimedText(videoId);
  if (result.transcript) return result;
  
  // Try embed page as last resort
  result = await fetchViaEmbed(videoId);
  if (result.transcript) return result;

  console.log("All methods failed to get transcript");
  return { transcript: "", language: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Video URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing video:", videoId);

    // Fetch title via oEmbed (reliable and fast)
    let title = `YouTube Video ${videoId}`;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
        console.log("Video title:", title);
      }
    } catch (e) {
      console.log("Could not fetch video title:", e);
    }

    // Fetch transcript using multiple methods
    const { transcript, language } = await fetchTranscript(videoId);

    console.log("Final result - transcript length:", transcript.length, "language:", language);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        title,
        transcript,
        language,
        hasTranscript: transcript.length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("YouTube transcript error:", error);
    return new Response(
      JSON.stringify({
        success: true,
        videoId: "",
        title: "Unknown Video",
        transcript: "",
        language: "",
        hasTranscript: false,
        error: error instanceof Error ? error.message : "Failed to fetch transcript",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
