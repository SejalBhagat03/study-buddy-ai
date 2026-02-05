 import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useChapters } from "@/hooks/useChapters";
 import { useChapterProgress } from "@/hooks/useChapterProgress";
 
 export function ProgressTracker() {
   const { chapters, loading: chaptersLoading } = useChapters();
   const { isChapterComplete, toggleChapterComplete, loading: progressLoading } = useChapterProgress();
 
   const loading = chaptersLoading || progressLoading;
   const completedCount = chapters.filter((c) => isChapterComplete(c.id)).length;
   const totalCount = chapters.length;
   const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
 
   if (loading) {
     return (
       <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
         <div className="animate-pulse space-y-4">
           <div className="h-6 bg-muted rounded w-1/3"></div>
           <div className="h-2 bg-muted rounded"></div>
           <div className="space-y-2">
             <div className="h-10 bg-muted rounded"></div>
             <div className="h-10 bg-muted rounded"></div>
           </div>
         </div>
       </div>
     );
   }
 
   if (chapters.length === 0) {
     return (
       <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
         <div className="flex items-center gap-2 mb-4">
           <TrendingUp className="w-5 h-5 text-primary" />
           <h3 className="font-semibold text-foreground">Progress Tracker</h3>
         </div>
         <p className="text-sm text-muted-foreground">
           No chapters yet. Add some study materials to track your progress!
         </p>
       </div>
     );
   }
 
   return (
     <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
           <TrendingUp className="w-5 h-5 text-primary" />
           <h3 className="font-semibold text-foreground">Progress Tracker</h3>
         </div>
         <span className="text-sm font-medium text-primary">{progressPercent}%</span>
       </div>
 
       <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
         <div
           className="h-full study-gradient transition-all duration-500 rounded-full"
           style={{ width: `${progressPercent}%` }}
         />
       </div>
 
       <p className="text-sm text-muted-foreground mb-4">
         {completedCount} of {totalCount} chapters completed
       </p>
 
       <div className="space-y-2 max-h-48 overflow-y-auto">
         {chapters.map((chapter) => {
           const completed = isChapterComplete(chapter.id);
           return (
             <button
               key={chapter.id}
               onClick={() => toggleChapterComplete(chapter.id)}
               className={cn(
                 "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                 completed
                   ? "bg-primary/10 hover:bg-primary/15"
                   : "bg-muted/50 hover:bg-muted"
               )}
             >
               {completed ? (
                 <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
               ) : (
                 <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
               )}
               <span
                 className={cn(
                   "text-sm truncate",
                   completed ? "text-foreground" : "text-muted-foreground"
                 )}
               >
                 {chapter.title}
               </span>
             </button>
           );
         })}
       </div>
     </div>
   );
 }