import { Flame, Target, Trophy, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import { cn } from "@/lib/utils";

export function StreakWidget() {
  const { currentStreak, longestStreak, goalProgress, todayCompletedMinutes, todayGoalMinutes, loading } = useStudyStreak();

  if (loading) {
    return (
      <div className="pastel-card p-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    );
  }

  const isStreakActive = currentStreak > 0;
  const goalMet = goalProgress >= 100;

  return (
    <div className="pastel-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Study Progress
        </h3>
        {isStreakActive && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-pastel-orange text-foreground">
            🔥 On Fire!
          </span>
        )}
      </div>

      {/* Streak Display */}
      <div className="flex items-center gap-4">
        <div className={cn(
          "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
          isStreakActive 
            ? "study-gradient shadow-glow" 
            : "bg-muted"
        )}>
          <Flame className={cn(
            "w-8 h-8 transition-colors",
            isStreakActive ? "text-white" : "text-muted-foreground"
          )} />
          {isStreakActive && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pastel-yellow rounded-full flex items-center justify-center text-xs font-bold text-foreground animate-bounce-in">
              {currentStreak}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">
            {currentStreak} <span className="text-sm font-normal text-muted-foreground">day streak</span>
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3 text-pastel-yellow" />
              Best: {longestStreak} days
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            Today's Goal
          </span>
          <span className={cn(
            "font-medium",
            goalMet ? "text-pastel-green" : "text-foreground"
          )}>
            {todayCompletedMinutes}/{todayGoalMinutes} min
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={goalProgress} 
            className="h-3 bg-muted"
          />
          {goalMet && (
            <div className="absolute right-0 -top-1 animate-bounce-in">
              <span className="text-lg">✨</span>
            </div>
          )}
        </div>
        
        {goalMet ? (
          <p className="text-xs text-center text-pastel-green font-medium animate-fade-in">
            🎉 Goal achieved! Keep it up!
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            {todayGoalMinutes - todayCompletedMinutes} min left to reach your goal
          </p>
        )}
      </div>
    </div>
  );
}
