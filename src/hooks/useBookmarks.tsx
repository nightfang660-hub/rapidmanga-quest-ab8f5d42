import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Bookmark {
  id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string;
  manga_genres: string[];
  bookmarked_at: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("bookmarked_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isBookmarked = (mangaId: string) => {
    return bookmarks.some((b) => b.manga_id === mangaId);
  };

  const addBookmark = async (manga: {
    id: string;
    title: string;
    thumb: string;
    genres?: string[];
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        manga_id: manga.id,
        manga_title: manga.title,
        manga_thumb: manga.thumb,
        manga_genres: manga.genres || [],
      });

      if (error) throw error;

      toast({
        title: "Bookmarked!",
        description: `${manga.title} added to your library`,
      });

      await loadBookmarks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeBookmark = async (mangaId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("manga_id", mangaId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Bookmark removed from your library",
      });

      await loadBookmarks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    addBookmark,
    removeBookmark,
    reloadBookmarks: loadBookmarks,
  };
};