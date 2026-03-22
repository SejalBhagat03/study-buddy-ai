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
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-100 rounded w-1/3"></div>
          <div className="h-2 bg-slate-100 rounded"></div>
          <div className="space-y-2 mt-4">
            <div className="h-9 bg-slate-50 rounded-lg"></div>
            <div className="h-9 bg-slate-50 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Progress Tracker</h3>
        </div>
        <p className="text-xs text-slate-500">
          No chapters yet. Add some study materials to track dashboard scores!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-1 border-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Progress</h3>
        </div>
        <span className="text-xs font-bold text-indigo-600">{progressPercent}%</span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full mb-3 overflow-hidden px-1">
        <div
          className="h-full bg-indigo-600 transition-all duration-500 rounded-full shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-xs text-slate-500 mb-4 px-1">
        {completedCount} of {totalCount} chapters completed
      </p>

      <div className="space-y-1.5 max-h-48 overflow-y-auto px-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
        {chapters.map((chapter) => {
          const completed = isChapterComplete(chapter.id);
          return (
            <button
              key={chapter.id}
              onClick={() => toggleChapterComplete(chapter.id)}
              className={cn(
                "w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left border",
                completed
                  ? "bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50"
                  : "bg-slate-50/50 border-slate-100/80 hover:bg-slate-50 hover:border-slate-200"
              )}
            >
              {completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs truncate font-medium max-w-[140px]",
                  completed ? "text-emerald-700" : "text-slate-600"
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