import { useState, useEffect } from "react";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useBookmarks } from "@/hooks/useBookmarks";

export const useRecommendations = () => {
  const { progressList } = useReadingProgress();
  const { bookmarks } = useBookmarks();
  const [recommendedGenres, setRecommendedGenres] = useState<string[]>([]);

  useEffect(() => {
    calculateRecommendations();
  }, [progressList, bookmarks]);

  const calculateRecommendations = () => {
    // Get genres from completed and reading manga
    const genreCount: { [key: string]: number } = {};

    // Count genres from reading progress
    progressList
      .filter(p => p.status === "completed" || p.status === "reading")
      .forEach(progress => {
        // We don't have genres in reading_progress, so we'll use bookmarks
        const bookmark = bookmarks.find(b => b.manga_id === progress.manga_id);
        if (bookmark?.manga_genres) {
          bookmark.manga_genres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }
      });

    // Get top 5 genres
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    setRecommendedGenres(topGenres);
  };

  return {
    recommendedGenres,
  };
};
