import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from various YouTube URL formats
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Video URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching transcript for video:", videoId);

    // Try to fetch captions using YouTube's timedtext API
    const captionUrls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-GB&fmt=json3`,
    ];

    let transcript = "";
    let title = "";

    // First, try to get video info
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || `YouTube Video ${videoId}`;
      }
    } catch (e) {
      console.log("Could not fetch video title:", e);
      title = `YouTube Video ${videoId}`;
    }

    // Try each caption URL
    for (const captionUrl of captionUrls) {
      try {
        const response = await fetch(captionUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.events) {
            transcript = data.events
              .filter((event: any) => event.segs)
              .map((event: any) => 
                event.segs.map((seg: any) => seg.utf8).join("")
              )
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            
            if (transcript) {
              console.log("Successfully fetched transcript");
              break;
            }
          }
        }
      } catch (e) {
        console.log("Caption fetch failed:", e);
      }
    }

    // If no transcript found, try alternative method using innertube
    if (!transcript) {
      try {
        const watchPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await watchPageRes.text();
        
        // Extract caption track from page
        const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
        if (captionMatch) {
          const captionData = JSON.parse(`[${captionMatch[1]}]`);
          const englishCaption = captionData.find((c: any) => 
            c.languageCode === 'en' || c.languageCode?.startsWith('en')
          );
          
          if (englishCaption?.baseUrl) {
            const captionRes = await fetch(englishCaption.baseUrl + "&fmt=json3");
            if (captionRes.ok) {
              const data = await captionRes.json();
              if (data.events) {
                transcript = data.events
                  .filter((event: any) => event.segs)
                  .map((event: any) => 
                    event.segs.map((seg: any) => seg.utf8).join("")
                  )
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim();
              }
            }
          }
        }
      } catch (e) {
        console.log("Alternative caption fetch failed:", e);
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({ 
          error: "Could not fetch transcript. The video may not have captions available or captions may be disabled." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch transcript" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
