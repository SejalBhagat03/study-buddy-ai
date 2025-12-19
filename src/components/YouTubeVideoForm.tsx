import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface YouTubeVideoFormProps {
  chapterId?: string;
  onSuccess?: () => void;
}

export function YouTubeVideoForm({ chapterId, onSuccess }: YouTubeVideoFormProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    setLoading(true);
    setSuccess(false);

    try {
      // Call the edge function to fetch transcript
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ videoUrl: url }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      // Save to database
      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        chapter_id: chapterId || null,
        title: data.title,
        transcript: data.transcript,
        video_url: `https://www.youtube.com/watch?v=${data.videoId}`,
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setUrl("");
      toast.success("Video transcript added successfully!");
      onSuccess?.();

      setTimeout(() => setSuccess(false), 3000);
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
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            "Add"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add related YouTube videos to enhance AI learning
      </p>
    </form>
  );
}
