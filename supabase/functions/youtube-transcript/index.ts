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

function parseTimedTextXml(xml: string): string {
  const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];

  for (const match of textMatches) {
    let text = match[1] ?? "";

    // Decode common entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, " ");

    if (text.trim()) texts.push(text);
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}

async function tryTimedTextXml(videoId: string): Promise<string> {
  const urls = [
    // Manual captions
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en-GB&v=${videoId}`,

    // Auto-generated captions (ASR)
    `https://www.youtube.com/api/timedtext?lang=en&kind=asr&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en-US&kind=asr&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en-GB&kind=asr&v=${videoId}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const xml = await res.text();
      const transcript = parseTimedTextXml(xml);

      if (transcript) {
        console.log("Timedtext transcript fetched:", { url, length: transcript.length });
        return transcript;
      }
    } catch (e) {
      console.log("Timedtext fetch failed:", e);
    }
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

    console.log("Fetching transcript for video:", videoId);

    // Title
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

    // 1) Prefer timedtext API (manual or ASR)
    let transcript = await tryTimedTextXml(videoId);

    // 2) Fallback: parse captionTracks from watch page, then fetch baseUrl
    if (!transcript) {
      try {
        const watchPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        const html = await watchPageRes.text();
        console.log("Fetched watch page, length:", html.length);

        const playerResponseMatch = html.match(
          /ytInitialPlayerResponse\s*=\s*({.+?});(?:\s*var|<\/script>)/
        );

        if (playerResponseMatch) {
          try {
            const playerResponse = JSON.parse(playerResponseMatch[1]);
            const captionTracks =
              playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (captionTracks?.length) {
              console.log("Found caption tracks:", captionTracks.length);

              const englishTrack =
                captionTracks.find((t: any) =>
                  t?.languageCode === "en" ||
                  t?.languageCode?.startsWith("en-") ||
                  t?.vssId?.includes(".en")
                ) || captionTracks[0];

              const baseUrl: string | undefined = englishTrack?.baseUrl;
              if (baseUrl) {
                const captionRes = await fetch(baseUrl);
                if (captionRes.ok) {
                  const captionXml = await captionRes.text();
                  transcript = parseTimedTextXml(captionXml);
                  console.log("Parsed baseUrl transcript length:", transcript.length);
                }
              }
            }
          } catch (e) {
            console.log("Error parsing ytInitialPlayerResponse:", e);
          }
        }
      } catch (e) {
        console.log("Watch page fallback failed:", e);
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({
          error:
            "Could not fetch transcript. This video likely has captions disabled and no auto-generated captions are available.",
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
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to fetch transcript",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
