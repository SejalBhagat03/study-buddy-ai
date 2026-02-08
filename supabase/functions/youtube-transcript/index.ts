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
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ");
}

// Parse JSON3 format from YouTube
function parseJson3Transcript(json: any): string {
  try {
    const events = json?.events || [];
    const texts: string[] = [];
    
    for (const event of events) {
      if (event.segs) {
        for (const seg of event.segs) {
          if (seg.utf8 && seg.utf8.trim() && seg.utf8 !== "\n") {
            texts.push(decodeHtmlEntities(seg.utf8.trim()));
          }
        }
      }
    }
    
    return texts.join(" ").replace(/\s+/g, " ").trim();
  } catch (e) {
    return "";
  }
}

// Parse timedtext XML format
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

// Method 1: Get player response from watch page and extract captions
async function fetchViaWatchPage(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 1: Watch page scraping for:", videoId);
  
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(watchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.log("Watch page fetch failed:", response.status);
      return { transcript: "", language: "" };
    }

    const html = await response.text();
    
    // Extract ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:\s*var|\s*<\/script>)/s);
    if (!playerResponseMatch) {
      console.log("No ytInitialPlayerResponse found");
      return { transcript: "", language: "" };
    }
    
    let playerResponse;
    try {
      playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch (e) {
      console.log("Failed to parse player response");
      return { transcript: "", language: "" };
    }
    
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      console.log("No caption tracks found in player response");
      return { transcript: "", language: "" };
    }
    
    console.log("Found", captionTracks.length, "caption tracks");
    
    // Select best track (prefer English, non-auto-generated)
    const selectedTrack = captionTracks.find((t: any) => 
      (t.languageCode === "en" || t.languageCode?.startsWith("en-")) && t.kind !== "asr"
    ) || captionTracks.find((t: any) => 
      t.languageCode === "en" || t.languageCode?.startsWith("en-")
    ) || captionTracks.find((t: any) => 
      t.kind !== "asr"
    ) || captionTracks[0];
    
    let baseUrl = selectedTrack?.baseUrl;
    const language = selectedTrack?.languageCode || "unknown";
    
    if (!baseUrl) {
      console.log("No baseUrl in selected track");
      return { transcript: "", language };
    }
    
    console.log("Caption URL base:", baseUrl.substring(0, 80) + "...");
    
    // Try XML format first (more reliable)
    try {
      console.log("Fetching captions (XML format)...");
      const xmlRes = await fetch(baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      
      if (xmlRes.ok) {
        const xml = await xmlRes.text();
        console.log("Got XML response, length:", xml.length);
        
        if (xml.includes("<text")) {
          const transcript = parseTimedTextXml(xml);
          if (transcript && transcript.length > 50) {
            console.log("Method 1 success (XML), length:", transcript.length);
            return { transcript, language };
          }
        }
      }
    } catch (e) {
      console.log("XML fetch error:", e);
    }
    
    // Try JSON3 format
    try {
      const json3Url = baseUrl + "&fmt=json3";
      console.log("Fetching captions (JSON3 format)...");
      
      const captionRes = await fetch(json3Url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      
      if (captionRes.ok) {
        const text = await captionRes.text();
        console.log("Got JSON3 response, length:", text.length);
        
        if (text && text.startsWith("{")) {
          const jsonData = JSON.parse(text);
          const transcript = parseJson3Transcript(jsonData);
          if (transcript && transcript.length > 50) {
            console.log("Method 1 success (JSON3), length:", transcript.length);
            return { transcript, language };
          }
        }
      }
    } catch (e) {
      console.log("JSON3 fetch error:", e);
    }
    
    return { transcript: "", language: "" };
  } catch (e) {
    console.log("Method 1 error:", e);
    return { transcript: "", language: "" };
  }
}

// Method 2: Innertube player API
async function fetchViaInnertube(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 2: Innertube API for:", videoId);
  
  try {
    const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "en",
            gl: "US",
            clientName: "WEB",
            clientVersion: "2.20240124.01.00",
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
    
    const selectedTrack = captionTracks.find((t: any) => 
      (t.languageCode === "en" || t.languageCode?.startsWith("en-")) && t.kind !== "asr"
    ) || captionTracks.find((t: any) => 
      t.languageCode === "en" || t.languageCode?.startsWith("en-")
    ) || captionTracks[0];

    const baseUrl = selectedTrack?.baseUrl;
    const language = selectedTrack?.languageCode || "unknown";

    if (!baseUrl) {
      return { transcript: "", language };
    }

    // Try XML first
    try {
      const xmlRes = await fetch(baseUrl);
      if (xmlRes.ok) {
        const xml = await xmlRes.text();
        if (xml.includes("<text")) {
          const transcript = parseTimedTextXml(xml);
          if (transcript && transcript.length > 50) {
            console.log("Method 2 success (XML), length:", transcript.length);
            return { transcript, language };
          }
        }
      }
    } catch (e) {
      console.log("XML fetch error:", e);
    }

    // Try JSON3
    try {
      const json3Url = baseUrl + "&fmt=json3";
      const captionRes = await fetch(json3Url);
      
      if (captionRes.ok) {
        const text = await captionRes.text();
        if (text && text.startsWith("{")) {
          const jsonData = JSON.parse(text);
          const transcript = parseJson3Transcript(jsonData);
          if (transcript) {
            console.log("Method 2 success (JSON3), length:", transcript.length);
            return { transcript, language };
          }
        }
      }
    } catch (e) {
      console.log("JSON3 fetch error:", e);
    }

    return { transcript: "", language };
  } catch (e) {
    console.log("Method 2 error:", e);
    return { transcript: "", language: "" };
  }
}

// Method 3: Direct timedtext API
async function fetchViaTimedText(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 3: Timedtext API for:", videoId);
  
  const languages = ["en", "en-US", "en-GB", "hi", "es", "fr", "de"];
  
  for (const lang of languages) {
    for (const kind of ["", "&kind=asr"]) {
      try {
        // Try XML format
        const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}${kind}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.includes("<text")) {
            const transcript = parseTimedTextXml(text);
            if (transcript && transcript.length > 50) {
              console.log("Method 3 success, lang:", lang, "length:", transcript.length);
              return { transcript, language: lang };
            }
          }
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  console.log("Method 3 failed");
  return { transcript: "", language: "" };
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("=== Fetching transcript for video:", videoId, "===");
  
  // Try watch page scraping first
  let result = await fetchViaWatchPage(videoId);
  if (result.transcript) return result;
  
  // Try innertube API
  result = await fetchViaInnertube(videoId);
  if (result.transcript) return result;
  
  // Try timedtext API
  result = await fetchViaTimedText(videoId);
  if (result.transcript) return result;

  console.log("=== All methods failed ===");
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

    // Fetch title via oEmbed
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

    // Fetch transcript
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
