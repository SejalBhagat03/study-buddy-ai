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

// Parse JSON3 format (more reliable)
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

// Try multiple user agents to avoid blocks
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "User-Agent": userAgents[i % userAgents.length],
        },
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (e) {
      lastError = e;
      console.log(`Attempt ${i + 1} failed:`, e);
    }
    // Small delay before retry
    await new Promise(r => setTimeout(r, 500));
  }
  throw lastError;
}

async function fetchTranscript(videoId: string): Promise<{ transcript: string; language: string }> {
  console.log("Fetching transcript for video:", videoId);
  
  // Step 1: Fetch the watch page with multiple headers to appear more like a browser
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  let html = "";
  try {
    const watchRes = await fetchWithRetry(watchUrl, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.google.com/",
        "DNT": "1",
      },
    });
    html = await watchRes.text();
    console.log("Watch page fetched, length:", html.length);
  } catch (e) {
    console.log("Failed to fetch watch page:", e);
    return { transcript: "", language: "" };
  }

  // Step 2: Extract ytInitialPlayerResponse - try multiple patterns
  let playerResponse: any = null;
  
  const patterns = [
    /ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:\s*var|<\/script>|\s*if|\s*const)/s,
    /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s,
    /"playerResponse":\s*(\{.+?\})\s*,\s*"(?:videoDetails|playabilityStatus)"/s,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        playerResponse = JSON.parse(match[1]);
        console.log("Parsed player response with pattern");
        break;
      } catch (e) {
        console.log("Parse failed for pattern, trying next");
      }
    }
  }

  if (!playerResponse) {
    // Try extracting from embedded player config
    const configMatch = html.match(/ytcfg\.set\s*\(\s*(\{.+?\})\s*\)/s);
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1]);
        if (config.PLAYER_VARS?.embedded_player_response) {
          playerResponse = JSON.parse(config.PLAYER_VARS.embedded_player_response);
        }
      } catch (e) {
        console.log("Embedded config parse failed");
      }
    }
  }

  if (!playerResponse) {
    console.log("Could not find ytInitialPlayerResponse");
    return { transcript: "", language: "" };
  }

  // Step 3: Extract caption tracks
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    console.log("No caption tracks found in player response");
    // Check if captions are disabled
    const reason = playerResponse?.captions?.playerCaptionsTracklistRenderer?.reason;
    if (reason) {
      console.log("Caption unavailable reason:", reason);
    }
    return { transcript: "", language: "" };
  }

  console.log("Found", captionTracks.length, "caption tracks");
  console.log("Available languages:", captionTracks.map((t: any) => t.languageCode).join(", "));

  // Step 4: Find the best caption track - prioritize manual captions over auto-generated
  let selectedTrack = null;
  let selectedLanguage = "";

  // First try: English manual captions
  selectedTrack = captionTracks.find((t: any) => 
    (t.languageCode === "en" || t.languageCode?.startsWith("en-")) &&
    t.kind !== "asr"
  );
  
  // Second try: Any English (including auto-generated)
  if (!selectedTrack) {
    selectedTrack = captionTracks.find((t: any) => 
      t.languageCode === "en" || 
      t.languageCode?.startsWith("en-") ||
      t.vssId?.includes(".en") || 
      t.vssId?.includes("a.en")
    );
  }
  
  // Third try: Any non-auto captions
  if (!selectedTrack) {
    selectedTrack = captionTracks.find((t: any) => t.kind !== "asr");
  }
  
  // Fourth try: Any available captions
  if (!selectedTrack) {
    selectedTrack = captionTracks[0];
  }

  selectedLanguage = selectedTrack?.languageCode || selectedTrack?.name?.simpleText || "unknown";
  console.log("Selected track:", selectedLanguage, selectedTrack?.vssId, "kind:", selectedTrack?.kind);

  const baseUrl = selectedTrack?.baseUrl;
  if (!baseUrl) {
    console.log("No baseUrl in selected track");
    return { transcript: "", language: "" };
  }

  // Step 5: Fetch transcript in JSON3 format (more reliable)
  const json3Url = baseUrl + "&fmt=json3";
  console.log("Fetching JSON3 transcript...");
  
  try {
    const captionRes = await fetchWithRetry(json3Url, {
      headers: {
        "Accept": "application/json",
        "Referer": watchUrl,
      },
    });
    
    const jsonData = await captionRes.json();
    const transcript = parseJson3Transcript(jsonData);
    if (transcript) {
      console.log("JSON3 transcript fetched, length:", transcript.length);
      return { transcript, language: selectedLanguage };
    }
  } catch (e) {
    console.log("JSON3 fetch failed:", e);
  }

  // Fallback: try XML format
  console.log("Trying XML format...");
  try {
    const xmlRes = await fetchWithRetry(baseUrl, {
      headers: {
        "Accept": "text/xml",
        "Referer": watchUrl,
      },
    });
    
    const xml = await xmlRes.text();
    const transcript = parseTimedTextXml(xml);
    if (transcript) {
      console.log("XML transcript fetched, length:", transcript.length);
      return { transcript, language: selectedLanguage };
    }
  } catch (e) {
    console.log("XML fetch failed:", e);
  }

  return { transcript: "", language: selectedLanguage };
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

    // Always return success - let the client handle missing transcripts
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
