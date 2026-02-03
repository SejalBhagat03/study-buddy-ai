import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useStudyStreak() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    todayGoalMinutes: 30,
    todayCompletedMinutes: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreakData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch streak data
      const { data: streakRow, error: streakError } = await supabase
        .from("study_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakError) throw streakError;

      // Fetch today's goal
      const today = new Date().toISOString().split("T")[0];
      const { data: goalRow, error: goalError } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("goal_date", today)
        .maybeSingle();

      if (goalError) throw goalError;

      setStreakData({
        currentStreak: streakRow?.current_streak ?? 0,
        longestStreak: streakRow?.longest_streak ?? 0,
        lastStudyDate: streakRow?.last_study_date ?? null,
        todayGoalMinutes: goalRow?.target_minutes ?? 30,
        todayCompletedMinutes: goalRow?.completed_minutes ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const logStudyActivity = useCallback(
    async (activityType, durationMinutes, chapterId) => {
      if (!user) return;

      try {
        // Log the activity
        await supabase.from("study_activities").insert({
          user_id: user.id,
          activity_type: activityType,
          duration_minutes: durationMinutes,
          chapter_id: chapterId || null,
        });

        const today = new Date().toISOString().split("T")[0];

        // Update or create daily goal
        const { data: existingGoal } = await supabase
          .from("daily_goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("goal_date", today)
          .maybeSingle();

        if (existingGoal) {
          await supabase
            .from("daily_goals")
            .update({
              completed_minutes: existingGoal.completed_minutes + durationMinutes,
            })
            .eq("id", existingGoal.id);
        } else {
          await supabase.from("daily_goals").insert({
            user_id: user.id,
            goal_date: today,
            completed_minutes: durationMinutes,
          });
        }

        // Update streak
        const { data: streak } = await supabase
          .from("study_streaks")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (streak) {
          const lastStudy = streak.last_study_date;
          let newStreak = streak.current_streak;

          if (lastStudy === today) {
            // Already studied today, no change
          } else if (lastStudy === yesterdayStr) {
            // Consecutive day
            newStreak += 1;
          } else {
            // Streak broken, start fresh
            newStreak = 1;
          }

          const newLongest = Math.max(streak.longest_streak, newStreak);

          await supabase
            .from("study_streaks")
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              last_study_date: today,
            })
            .eq("id", streak.id);
        } else {
          // First time studying
          await supabase.from("study_streaks").insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_study_date: today,
          });
        }

        // Refresh data
        await fetchStreakData();
        
        if (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0) {
          toast.success(`🔥 Amazing! ${streakData.currentStreak} day streak!`);
        }
      } catch (error) {
        console.error("Failed to log study activity:", error);
      }
    },
    [user, fetchStreakData, streakData.currentStreak]
  );

  const goalProgress = streakData.todayGoalMinutes > 0 
    ? Math.min(100, (streakData.todayCompletedMinutes / streakData.todayGoalMinutes) * 100)
    : 0;

  return {
    ...streakData,
    goalProgress,
    loading,
    logStudyActivity,
    refreshStreak: fetchStreakData,
  };
}
