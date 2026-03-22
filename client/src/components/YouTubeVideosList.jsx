 import { useState, useEffect } from "react";
 import api from "@/api";

 import { useAuth } from "@/hooks/useAuth";
 import { Video, CheckCircle2, XCircle, Trash2, ExternalLink, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { toast } from "sonner";
 
 export function YouTubeVideosList({ onUpdate }) {
   const { user } = useAuth();
   const [videos, setVideos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [deletingId, setDeletingId] = useState(null);
 
   const fetchVideos = async () => {
    if (!user) return;
    try {
      const response = await api.get("/videos");
      setVideos(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };
 
   useEffect(() => {
     fetchVideos();
   }, [user]);
 
   const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/videos/${id}`);
      toast.success("Video deleted");
      setVideos(videos.filter((v) => (v._id || v.id) !== id));
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };
 
   const hasTranscript = (transcript) => {
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
             key={video._id || video.id}
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
               {video.url && (
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => window.open(video.url, "_blank")}
                 >
                   <ExternalLink className="w-4 h-4" />
                 </Button>
               )}
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-8 w-8 text-muted-foreground hover:text-destructive"
                 onClick={() => handleDelete(video._id || video.id)}
                 disabled={deletingId === (video._id || video.id)}
               >
                 {deletingId === (video._id || video.id) ? (
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