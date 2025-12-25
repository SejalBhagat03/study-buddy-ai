import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
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

async function fetchTranscript(videoId: string): Promise<string> {
  console.log("Fetching transcript for video:", videoId);
  
  // Step 1: Fetch the watch page to get caption tracks
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const watchRes = await fetch(watchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!watchRes.ok) {
    console.log("Failed to fetch watch page:", watchRes.status);
    return "";
  }

  const html = await watchRes.text();
  console.log("Watch page fetched, length:", html.length);

  // Step 2: Extract ytInitialPlayerResponse
  const playerResponseMatch = html.match(
    /ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:\s*var|<\/script>|\s*if)/
  );

  if (!playerResponseMatch) {
    console.log("Could not find ytInitialPlayerResponse");
    return "";
  }

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    console.log("Failed to parse ytInitialPlayerResponse:", e);
    return "";
  }

  // Step 3: Extract caption tracks
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    console.log("No caption tracks found in player response");
    return "";
  }

  console.log("Found", captionTracks.length, "caption tracks");

  // Step 4: Find the best caption track (prefer English, then any)
  let selectedTrack = captionTracks.find((t: any) => 
    t.languageCode === "en" || 
    t.languageCode?.startsWith("en-")
  );
  
  if (!selectedTrack) {
    // Try auto-generated English
    selectedTrack = captionTracks.find((t: any) => 
      t.vssId?.includes(".en") || 
      t.vssId?.includes("a.en")
    );
  }
  
  if (!selectedTrack) {
    // Use first available
    selectedTrack = captionTracks[0];
  }

  console.log("Selected track:", selectedTrack?.languageCode, selectedTrack?.vssId);

  const baseUrl = selectedTrack?.baseUrl;
  if (!baseUrl) {
    console.log("No baseUrl in selected track");
    return "";
  }

  // Step 5: Fetch transcript in JSON3 format (more reliable)
  const json3Url = baseUrl + "&fmt=json3";
  console.log("Fetching JSON3 transcript...");
  
  try {
    const captionRes = await fetch(json3Url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (captionRes.ok) {
      const jsonData = await captionRes.json();
      const transcript = parseJson3Transcript(jsonData);
      if (transcript) {
        console.log("JSON3 transcript fetched, length:", transcript.length);
        return transcript;
      }
    }
  } catch (e) {
    console.log("JSON3 fetch failed:", e);
  }

  // Fallback: try XML format
  console.log("Trying XML format...");
  try {
    const xmlRes = await fetch(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (xmlRes.ok) {
      const xml = await xmlRes.text();
      const transcript = parseTimedTextXml(xml);
      if (transcript) {
        console.log("XML transcript fetched, length:", transcript.length);
        return transcript;
      }
    }
  } catch (e) {
    console.log("XML fetch failed:", e);
  }

  return "";
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

    // Fetch title via oEmbed
    let title = `YouTube Video ${videoId}`;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
      }
    } catch (e) {
      console.log("Could not fetch video title:", e);
    }

    // Fetch transcript
    const transcript = await fetchTranscript(videoId);

    // Always return success - let the client handle missing transcripts
    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        title,
        transcript,
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
        error: error instanceof Error ? error.message : "Failed to fetch transcript",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
