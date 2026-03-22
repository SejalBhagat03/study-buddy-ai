import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/api";

export function useStudyStreak() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: "",
    todayGoalMinutes: 30,
    todayCompletedMinutes: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStreakData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get("/user/streak");
      setStreakData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const logStudyActivity = useCallback(async () => {
    return Promise.resolve();
  }, []);

  const goalProgress = streakData.todayGoalMinutes > 0 
    ? (streakData.todayCompletedMinutes / streakData.todayGoalMinutes) * 100 
    : 0;


  return {
    ...streakData,
    goalProgress,
    loading,
    logStudyActivity,
    refreshStreak: fetchStreakData,
  };
}
