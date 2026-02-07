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

// Parse JSON3 format
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
    console.log("JSON3 parse error:", e);
    return "";
  }
}

// Parse XML format
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

// Method 1: Direct timedtext API with signature bypass
async function fetchViaTimedTextDirect(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 1: Direct timedtext API for:", videoId);
  
  const languages = ["en", "en-US", "en-GB", "hi", "es", "fr", "de", "pt", "ja", "ko", "zh"];
  
  for (const lang of languages) {
    try {
      // Try with different parameters
      const urls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&kind=asr&fmt=json3`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&kind=asr`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
      ];
      
      for (const url of urls) {
        const res = await fetch(url, {
          headers: {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 100) {
            if (text.includes('"events"')) {
              const json = JSON.parse(text);
              const transcript = parseJson3Transcript(json);
              if (transcript && transcript.length > 50) {
                console.log("Method 1 success, lang:", lang, "length:", transcript.length);
                return { transcript, language: lang };
              }
            } else if (text.includes("<text")) {
              const transcript = parseTimedTextXml(text);
              if (transcript && transcript.length > 50) {
                console.log("Method 1 success (XML), lang:", lang, "length:", transcript.length);
                return { transcript, language: lang };
              }
            }
          }
        }
      }
    } catch (e) {
      // Continue to next language
    }
  }
  
  console.log("Method 1 failed");
  return { transcript: "", language: "" };
}

// Method 2: Innertube player API
async function fetchViaInnertube(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 2: Innertube API for:", videoId);
  
  try {
    const innertubeUrl = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
    
    const response = await fetch(innertubeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "en",
            gl: "US",
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
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

    console.log("Found", captionTracks.length, "caption tracks");
    
    // Prefer English, non-auto-generated first
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
      console.log("No baseUrl in selected track");
      return { transcript: "", language };
    }

    // Try JSON3 format
    const json3Url = baseUrl + "&fmt=json3";
    const captionRes = await fetch(json3Url);
    
    if (captionRes.ok) {
      const jsonData = await captionRes.json();
      const transcript = parseJson3Transcript(jsonData);
      if (transcript) {
        console.log("Method 2 success, length:", transcript.length);
        return { transcript, language };
      }
    }

    // Try XML
    const xmlRes = await fetch(baseUrl);
    if (xmlRes.ok) {
      const xml = await xmlRes.text();
      const transcript = parseTimedTextXml(xml);
      if (transcript) {
        console.log("Method 2 success (XML), length:", transcript.length);
        return { transcript, language };
      }
    }

    return { transcript: "", language };
  } catch (e) {
    console.log("Method 2 error:", e);
    return { transcript: "", language: "" };
  }
}

// Method 3: Get transcript list first, then fetch
async function fetchViaTranscriptList(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 3: Transcript list for:", videoId);
  
  try {
    // First, get list of available transcripts
    const listUrl = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
    const listRes = await fetch(listUrl);
    
    if (!listRes.ok) {
      console.log("Transcript list request failed");
      return { transcript: "", language: "" };
    }
    
    const listXml = await listRes.text();
    console.log("Transcript list response:", listXml.substring(0, 200));
    
    // Parse track info from list
    const trackMatch = listXml.match(/lang_code="([^"]+)"/);
    if (!trackMatch) {
      console.log("No tracks found in list");
      return { transcript: "", language: "" };
    }
    
    const lang = trackMatch[1];
    
    // Check if it's auto-generated
    const isAsr = listXml.includes('kind="asr"');
    
    // Fetch the transcript
    const transcriptUrl = isAsr 
      ? `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&kind=asr&fmt=json3`
      : `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    
    const transcriptRes = await fetch(transcriptUrl);
    
    if (transcriptRes.ok) {
      const text = await transcriptRes.text();
      if (text && text.includes('"events"')) {
        const json = JSON.parse(text);
        const transcript = parseJson3Transcript(json);
        if (transcript && transcript.length > 50) {
          console.log("Method 3 success, lang:", lang, "length:", transcript.length);
          return { transcript, language: lang };
        }
      }
    }
    
    return { transcript: "", language: "" };
  } catch (e) {
    console.log("Method 3 error:", e);
    return { transcript: "", language: "" };
  }
}

// Method 4: Try watch page scraping for caption URL
async function fetchViaWatchPage(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Method 4: Watch page for:", videoId);
  
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(watchUrl, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.log("Watch page fetch failed:", response.status);
      return { transcript: "", language: "" };
    }

    const html = await response.text();
    
    // Try to find caption tracks in the page
    const captionMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
    if (!captionMatch) {
      console.log("No captionTracks in watch page");
      return { transcript: "", language: "" };
    }
    
    let tracksJson = captionMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const tracks = JSON.parse(tracksJson);
    
    if (!tracks || tracks.length === 0) {
      console.log("Empty caption tracks");
      return { transcript: "", language: "" };
    }
    
    console.log("Found", tracks.length, "tracks in watch page");
    
    // Select best track
    const track = tracks.find((t: any) => t.languageCode?.startsWith("en")) || tracks[0];
    let baseUrl = track.baseUrl.replace(/\\u0026/g, "&");
    const language = track.languageCode || "unknown";
    
    // Fetch transcript
    const json3Url = baseUrl + "&fmt=json3";
    const captionRes = await fetch(json3Url);
    
    if (captionRes.ok) {
      const jsonData = await captionRes.json();
      const transcript = parseJson3Transcript(jsonData);
      if (transcript) {
        console.log("Method 4 success, length:", transcript.length);
        return { transcript, language };
      }
    }
    
    return { transcript: "", language: "" };
  } catch (e) {
    console.log("Method 4 error:", e);
    return { transcript: "", language: "" };
  }
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("=== Fetching transcript for video:", videoId, "===");
  
  // Try all methods
  let result = await fetchViaTranscriptList(videoId);
  if (result.transcript) return result;
  
  result = await fetchViaTimedTextDirect(videoId);
  if (result.transcript) return result;
  
  result = await fetchViaInnertube(videoId);
  if (result.transcript) return result;
  
  result = await fetchViaWatchPage(videoId);
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
