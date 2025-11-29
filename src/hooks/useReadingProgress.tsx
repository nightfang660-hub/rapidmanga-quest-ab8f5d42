import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReadingProgress {
  id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string;
  current_chapter_id: string;
  current_chapter_title: string;
  current_chapter_number: string;
  total_chapters: number;
  progress_percentage: number;
  status: "reading" | "completed" | "plan_to_read";
  started_at: string;
  updated_at: string;
}

export const useReadingProgress = () => {
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProgressList((data || []) as ReadingProgress[]);
    } catch (error: any) {
      console.error("Error loading progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (params: {
    mangaId: string;
    mangaTitle: string;
    mangaThumb: string;
    chapterId: string;
    chapterTitle: string;
    chapterNumber: string;
    totalChapters: number;
  }) => {
    if (!user) return;

    try {
      const progressPercentage = params.totalChapters > 0
        ? Math.round((parseInt(params.chapterNumber) / params.totalChapters) * 100)
        : 0;

      const { error } = await supabase.from("reading_progress").upsert({
        user_id: user.id,
        manga_id: params.mangaId,
        manga_title: params.mangaTitle,
        manga_thumb: params.mangaThumb,
        current_chapter_id: params.chapterId,
        current_chapter_title: params.chapterTitle,
        current_chapter_number: params.chapterNumber,
        total_chapters: params.totalChapters,
        progress_percentage: progressPercentage,
        status: progressPercentage >= 100 ? "completed" : "reading",
      });

      if (error) throw error;
      await loadProgress();
    } catch (error: any) {
      console.error("Error updating progress:", error);
    }
  };

  const getProgressForManga = (mangaId: string) => {
    return progressList.find((p) => p.manga_id === mangaId);
  };

  return {
    progressList,
    isLoading,
    updateProgress,
    getProgressForManga,
    reloadProgress: loadProgress,
  };
};