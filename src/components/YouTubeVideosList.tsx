import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Video, CheckCircle2, XCircle, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  transcript: string;
  video_url: string | null;
  created_at: string;
}

interface YouTubeVideosListProps {
  onUpdate?: () => void;
}

export function YouTubeVideosList({ onUpdate }: YouTubeVideosListProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, transcript, video_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete video");
    } else {
      toast.success("Video deleted");
      setVideos(videos.filter((v) => v.id !== id));
      onUpdate?.();
    }
    setDeletingId(null);
  };

  const hasTranscript = (transcript: string) => {
    return transcript && !transcript.includes("[No captions available");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No videos saved yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Video className="w-4 h-4" />
        Saved Videos ({videos.length})
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
          >
            {hasTranscript(video.transcript) ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {video.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasTranscript(video.transcript)
                  ? "Transcript available"
                  : "No captions found"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {video.video_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(video.video_url!, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(video.id)}
                disabled={deletingId === video.id}
              >
                {deletingId === video.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
