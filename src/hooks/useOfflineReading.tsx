import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { mangaApi } from "@/services/mangaApi";

interface DownloadedChapter {
  id: string;
  manga_id: string;
  chapter_id: string;
  chapter_title: string;
  chapter_data: any;
  downloaded_at: string;
}

export const useOfflineReading = () => {
  const [downloads, setDownloads] = useState<DownloadedChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadDownloads();
    }
  }, [user]);

  const loadDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from("downloaded_chapters")
        .select("*")
        .order("downloaded_at", { ascending: false });

      if (error) throw error;
      setDownloads(data || []);
    } catch (error: any) {
      console.error("Error loading downloads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChapter = async (
    mangaId: string,
    chapterId: string,
    chapterTitle: string
  ) => {
    if (!user) return;

    try {
      setDownloadProgress({ ...downloadProgress, [chapterId]: 0 });

      // Fetch chapter images
      const response = await mangaApi.fetchChapterImages(chapterId);
      const images = response.data || [];

      setDownloadProgress({ ...downloadProgress, [chapterId]: 50 });

      // Save to database
      const { error } = await supabase.from("downloaded_chapters").insert({
        user_id: user.id,
        manga_id: mangaId,
        chapter_id: chapterId,
        chapter_title: chapterTitle,
        chapter_data: { images },
      });

      if (error) throw error;

      setDownloadProgress({ ...downloadProgress, [chapterId]: 100 });

      toast({
        title: "Downloaded",
        description: `${chapterTitle} is now available offline`,
      });

      await loadDownloads();

      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[chapterId];
          return newProgress;
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download chapter",
        variant: "destructive",
      });
      setDownloadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[chapterId];
        return newProgress;
      });
    }
  };

  const deleteDownload = async (chapterId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("downloaded_chapters")
        .delete()
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Chapter removed from downloads",
      });

      await loadDownloads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isDownloaded = (chapterId: string) => {
    return downloads.some((d) => d.chapter_id === chapterId);
  };

  const getDownloadedChapter = (chapterId: string) => {
    return downloads.find((d) => d.chapter_id === chapterId);
  };

  return {
    downloads,
    isLoading,
    downloadProgress,
    downloadChapter,
    deleteDownload,
    isDownloaded,
    getDownloadedChapter,
    reloadDownloads: loadDownloads,
  };
};
