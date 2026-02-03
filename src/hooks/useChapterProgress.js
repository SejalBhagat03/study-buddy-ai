import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useChapterProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chapter_progress")
        .select("chapter_id, completed, completed_at")
        .eq("user_id", user.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleChapterComplete = useCallback(
    async (chapterId) => {
      if (!user) return;

      const existing = progress.find((p) => p.chapter_id === chapterId);
      const newCompleted = !existing?.completed;

      try {
        if (existing) {
          const { error } = await supabase
            .from("chapter_progress")
            .update({
              completed: newCompleted,
              completed_at: newCompleted ? new Date().toISOString() : null,
            })
            .eq("user_id", user.id)
            .eq("chapter_id", chapterId);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("chapter_progress").insert({
            user_id: user.id,
            chapter_id: chapterId,
            completed: true,
            completed_at: new Date().toISOString(),
          });

          if (error) throw error;
        }

        await fetchProgress();
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    },
    [user, progress, fetchProgress]
  );

  const isChapterComplete = useCallback(
    (chapterId) => {
      return progress.find((p) => p.chapter_id === chapterId)?.completed || false;
    },
    [progress]
  );

  const completedCount = progress.filter((p) => p.completed).length;
  const totalChapters = progress.length || 0;

  return {
    progress,
    loading,
    toggleChapterComplete,
    isChapterComplete,
    completedCount,
    totalChapters,
    refetch: fetchProgress,
  };
}
