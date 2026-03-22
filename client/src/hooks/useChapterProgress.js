import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export function useChapterProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      setProgress([]);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleChapterComplete = useCallback(async (chapterId) => {
    // Phase 1: Placeholder
    return Promise.resolve();
  }, []);

  const isChapterComplete = useCallback(() => false, []);
  
  const completedCount = 0;
  const totalChapters = 0;

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
