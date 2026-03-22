import { useState, useEffect, useCallback } from "react";
import api from "@/api";

export function useChapters() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/chapters");
      // Format response matches formatResponse: { success, message, data }
      setChapters(response.data.data || []);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return {
    chapters,
    loading,
    refetch: fetchChapters,
  };
}
