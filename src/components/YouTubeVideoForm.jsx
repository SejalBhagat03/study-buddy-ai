import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Youtube, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function extractVideoId(url) {
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

export function YouTubeVideoForm({ chapterId, onSuccess }) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedWithoutTranscript, setSavedWithoutTranscript] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    setLoading(true);
    setSuccess(false);
    setSavedWithoutTranscript(false);

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      setLoading(false);
      return;
    }

    try {
      let title = `YouTube Video ${videoId}`;
      let transcript = "";
      let hasTranscript = false;

      // If user provided manual transcript, use that
      if (manualTranscript.trim()) {
        transcript = manualTranscript.trim();
        hasTranscript = true;
        
        // Still try to get the title
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          );
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            title = oembedData.title || title;
          }
        } catch {
          // ignore
        }
      } else {
        // Try automatic extraction
        const { data, error: fnError } = await supabase.functions.invoke("youtube-transcript", {
          body: { videoUrl: url },
        });

        if (!fnError && data && !data.error) {
          title = data.title || title;
          transcript = data.transcript || "";
          hasTranscript = !!transcript;
        }

        if (!hasTranscript) {
          try {
            const oembedRes = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            );
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              title = oembedData.title || title;
            }
          } catch {
            // ignore
          }
          transcript = "[No captions available for this video]";
        }
      }

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        chapter_id: chapterId || null,
        title,
        transcript,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setUrl("");
      setManualTranscript("");
      setShowManualInput(false);

      if (hasTranscript) {
        toast.success("Video transcript added successfully!");
      } else {
        setSavedWithoutTranscript(true);
        toast.warning("Video saved, but no captions were found. You can add a manual transcript.");
      }

      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
        setSavedWithoutTranscript(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Youtube className="w-4 h-4 text-red-500" />
        Add YouTube Video
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={!url.trim() || loading} size="sm">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            savedWithoutTranscript ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )
          ) : (
            "Add"
          )}
        </Button>
      </div>
      
      <button
        type="button"
        onClick={() => setShowManualInput(!showManualInput)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showManualInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showManualInput ? "Hide manual transcript" : "Add transcript manually (optional)"}
      </button>
      
      {showManualInput && (
        <div className="space-y-2">
          <Textarea
            value={manualTranscript}
            onChange={(e) => setManualTranscript(e.target.value)}
            placeholder="Paste the video transcript here. You can copy it from YouTube's transcript feature (click ... → Show transcript on YouTube)"
            className="min-h-[100px] text-sm"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: Open the YouTube video → Click ••• below the video → Select "Show transcript" → Copy the text
          </p>
        </div>
      )}
      
      {savedWithoutTranscript && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Video saved without transcript - try adding it manually
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Add related YouTube videos to enhance AI learning
      </p>
    </form>
  );
}
