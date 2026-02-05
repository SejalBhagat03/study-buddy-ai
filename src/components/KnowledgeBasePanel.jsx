 import { useState, useEffect } from "react";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Brain,
   FileText,
   Video,
   ChevronDown,
   ChevronUp,
   CheckCircle,
   AlertCircle,
   BookOpen,
 } from "lucide-react";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 export function KnowledgeBasePanel({ studyContent }) {
   const { user } = useAuth();
   const [isExpanded, setIsExpanded] = useState(false);
   const [items, setItems] = useState([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchKnowledgeBase = async () => {
       if (!user) return;
       setLoading(true);
 
       try {
         const { data: videos } = await supabase
           .from("videos")
           .select("id, title, transcript, created_at")
           .eq("user_id", user.id)
           .order("created_at", { ascending: false });
 
         const { data: chapters } = await supabase
           .from("chapters")
           .select("id, title, content, created_at")
           .eq("user_id", user.id)
           .order("created_at", { ascending: false });
 
         const knowledgeItems = [];
 
         if (videos) {
           videos.forEach((video) => {
             knowledgeItems.push({
               id: video.id,
               title: video.title,
               type: "video",
               hasContent: !!(video.transcript && video.transcript.trim().length > 0),
               contentLength: video.transcript?.length || 0,
               createdAt: video.created_at,
             });
           });
         }
 
         if (chapters) {
           chapters.forEach((chapter) => {
             knowledgeItems.push({
               id: chapter.id,
               title: chapter.title,
               type: "pdf",
               hasContent: !!(chapter.content && chapter.content.trim().length > 0),
               contentLength: chapter.content?.length || 0,
               createdAt: chapter.created_at,
             });
           });
         }
 
         setItems(knowledgeItems);
       } catch (error) {
         console.error("Error fetching knowledge base:", error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchKnowledgeBase();
   }, [user, studyContent]);
 
   const totalItems = items.length;
   const itemsWithContent = items.filter((i) => i.hasContent).length;
   const totalContentLength = studyContent.length;
 
   const formatBytes = (chars) => {
     if (chars < 1000) return `${chars} chars`;
     if (chars < 100000) return `${(chars / 1000).toFixed(1)}K chars`;
     return `${(chars / 1000000).toFixed(2)}M chars`;
   };
 
   return (
     <div className="bg-card rounded-xl border border-border overflow-hidden">
       <button
         onClick={() => setIsExpanded(!isExpanded)}
         className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
       >
         <div className="flex items-center gap-3">
           <div className="p-2 bg-primary/10 rounded-lg">
             <Brain className="w-4 h-4 text-primary" />
           </div>
           <div className="text-left">
             <h3 className="text-sm font-medium text-foreground">AI Knowledge Base</h3>
             <p className="text-xs text-muted-foreground">
               {loading
                 ? "Loading..."
                 : `${itemsWithContent} of ${totalItems} items active • ${formatBytes(totalContentLength)}`}
             </p>
           </div>
         </div>
         {isExpanded ? (
           <ChevronUp className="w-4 h-4 text-muted-foreground" />
         ) : (
           <ChevronDown className="w-4 h-4 text-muted-foreground" />
         )}
       </button>
 
       {isExpanded && (
         <div className="border-t border-border">
           <ScrollArea className="max-h-64">
             <div className="p-3 space-y-2">
               <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                 <div className="p-1.5 bg-accent/20 rounded">
                   <BookOpen className="w-3.5 h-3.5 text-accent" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-medium text-foreground truncate">
                     Base Economics Knowledge
                   </p>
                   <p className="text-xs text-muted-foreground">Built-in study material</p>
                 </div>
                 <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
               </div>
 
               {items.length === 0 && !loading && (
                 <p className="text-xs text-muted-foreground text-center py-4">
                   No custom content added yet. Upload PDFs or add YouTube videos to expand the AI's knowledge.
                 </p>
               )}
 
               {items.map((item) => (
                 <div
                   key={item.id}
                   className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg"
                 >
                   <div
                     className={`p-1.5 rounded ${
                       item.type === "video" ? "bg-red-500/20" : "bg-blue-500/20"
                     }`}
                   >
                     {item.type === "video" ? (
                       <Video className="w-3.5 h-3.5 text-red-500" />
                     ) : (
                       <FileText className="w-3.5 h-3.5 text-blue-500" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs font-medium text-foreground truncate">
                       {item.title}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {item.hasContent
                         ? formatBytes(item.contentLength || 0)
                         : "No content available"}
                     </p>
                   </div>
                   {item.hasContent ? (
                     <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                   ) : (
                     <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                   )}
                 </div>
               ))}
             </div>
           </ScrollArea>
 
           <div className="px-3 py-2 border-t border-border bg-secondary/20">
             <p className="text-xs text-muted-foreground">
               <span className="font-medium text-foreground">Tip:</span> The AI can only answer
               questions based on the content shown above. Add more materials for better answers.
             </p>
           </div>
         </div>
       )}
     </div>
   );
 }