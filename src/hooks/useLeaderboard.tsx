import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_manga_read: number;
  total_chapters_read: number;
  reading_streak: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_manga_read, total_chapters_read, reading_streak")
        .order("total_chapters_read", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopByChapters = () => {
    return [...leaderboard].sort((a, b) => (b.total_chapters_read || 0) - (a.total_chapters_read || 0));
  };

  const getTopByManga = () => {
    return [...leaderboard].sort((a, b) => (b.total_manga_read || 0) - (a.total_manga_read || 0));
  };

  const getTopByStreak = () => {
    return [...leaderboard].sort((a, b) => (b.reading_streak || 0) - (a.reading_streak || 0));
  };

  return {
    leaderboard,
    isLoading,
    getTopByChapters,
    getTopByManga,
    getTopByStreak,
    reloadLeaderboard: loadLeaderboard,
  };
};
