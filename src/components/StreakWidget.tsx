import { Flame, Target, Trophy, Zap, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import { cn } from "@/lib/utils";

export function StreakWidget() {
  const { currentStreak, longestStreak, goalProgress, todayCompletedMinutes, todayGoalMinutes, loading } = useStudyStreak();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const isStreakActive = currentStreak > 0;
  const goalMet = goalProgress >= 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Streak Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
        <div className="absolute inset-0 study-gradient opacity-5 group-hover:opacity-10 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              isStreakActive 
                ? "study-gradient shadow-glow" 
                : "bg-muted"
            )}>
              <Flame className={cn(
                "w-6 h-6",
                isStreakActive ? "text-primary-foreground" : "text-muted-foreground"
              )} />
            </div>
            {isStreakActive && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground border border-accent/30">
                🔥 Active
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {currentStreak}
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Day Streak
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-pastel-yellow" />
            <span className="text-xs text-muted-foreground">
              Personal best: <span className="font-semibold text-foreground">{longestStreak} days</span>
            </span>
          </div>
        </div>
      </div>

      {/* Daily Goal Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
        <div className="absolute inset-0 bg-pastel-green/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-pastel-green/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-foreground" />
            </div>
            {goalMet && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-pastel-green/20 text-foreground border border-pastel-green/30">
                ✓ Complete
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {todayCompletedMinutes}<span className="text-lg text-muted-foreground font-normal">/{todayGoalMinutes}</span>
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Minutes Today
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Progress 
              value={goalProgress} 
              className="h-2 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {goalMet ? (
                <span className="text-foreground font-medium">🎉 Daily goal achieved!</span>
              ) : (
                <span>{Math.round(goalProgress)}% complete</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
        <div className="absolute inset-0 bg-pastel-purple/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-pastel-purple/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex items-center gap-1 text-xs text-pastel-green font-medium">
              <Zap className="w-3 h-3" />
              +12%
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {Math.round((currentStreak / 7) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Weekly Consistency
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex justify-between text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-5 h-5 rounded-md transition-colors",
                    i < currentStreak % 7 ? "bg-primary" : "bg-muted"
                  )} />
                  <span className="text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
