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

// Parse transcript from timedtext XML format
function parseTimedTextXml(xml: string): string {
  const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    let text = match[1];
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, ' ');
    texts.push(text);
  }
  
  return texts.join(' ').replace(/\s+/g, ' ').trim();
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

    let transcript = "";
    let title = "";

    // Fetch video title using oembed
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

    // Fetch the video page to extract caption tracks
    try {
      const watchPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      const html = await watchPageRes.text();
      console.log("Fetched watch page, length:", html.length);
      
      // Try to extract caption tracks from ytInitialPlayerResponse
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:\s*var|<\/script>)/);
      
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(playerResponseMatch[1]);
          const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          
          if (captionTracks && captionTracks.length > 0) {
            console.log("Found caption tracks:", captionTracks.length);
            
            // Prefer English captions
            const englishTrack = captionTracks.find((track: any) => 
              track.languageCode === 'en' || 
              track.languageCode?.startsWith('en-') ||
              track.vssId?.includes('.en')
            ) || captionTracks[0];
            
            if (englishTrack?.baseUrl) {
              console.log("Using caption track:", englishTrack.languageCode);
              
              // Fetch the captions in XML format (more reliable)
              const captionRes = await fetch(englishTrack.baseUrl);
              if (captionRes.ok) {
                const captionXml = await captionRes.text();
                transcript = parseTimedTextXml(captionXml);
                console.log("Parsed transcript length:", transcript.length);
              }
            }
          }
        } catch (parseError) {
          console.log("Error parsing player response:", parseError);
        }
      }
      
      // Fallback: try to find captions in a different format
      if (!transcript) {
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (captionMatch) {
          try {
            const captionData = JSON.parse(captionMatch[1]);
            const englishCaption = captionData.find((c: any) => 
              c.languageCode === 'en' || c.languageCode?.startsWith('en')
            ) || captionData[0];
            
            if (englishCaption?.baseUrl) {
              const captionRes = await fetch(englishCaption.baseUrl);
              if (captionRes.ok) {
                const captionXml = await captionRes.text();
                transcript = parseTimedTextXml(captionXml);
              }
            }
          } catch (e) {
            console.log("Fallback caption parsing failed:", e);
          }
        }
      }
    } catch (e) {
      console.log("Error fetching watch page:", e);
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({ 
          error: "Could not fetch transcript. The video may not have captions available, or captions may be auto-generated only. Please try a different video with manual captions." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully fetched transcript, length:", transcript.length);

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
