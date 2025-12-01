import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { mangaApi, ChapterImage } from "@/services/mangaApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useReadingGoals } from "@/hooks/useReadingGoals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

const ChapterReader = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateProgress } = useReadingProgress();
  const { getActiveGoal, updateProgress: updateGoalProgress } = useReadingGoals();
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      loadChapterImages();
      trackReadingHistory();
    }
  }, [chapterId]);

  const loadChapterImages = async () => {
    setIsLoading(true);
    try {
      const response = await mangaApi.fetchChapterImages(chapterId!);
      setImages(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chapter images",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackReadingHistory = async () => {
    if (!user) return;
    
    const mangaId = searchParams.get("mangaId");
    const mangaTitle = searchParams.get("mangaTitle");
    const mangaThumb = searchParams.get("mangaThumb");
    const chapterTitle = searchParams.get("chapterTitle");
    const chapterNumber = searchParams.get("chapterNumber");
    const totalChapters = searchParams.get("totalChapters");

    if (!mangaId || !mangaTitle) return;

    try {
      await supabase.from("reading_history").upsert({
        user_id: user.id,
        manga_id: mangaId,
        manga_title: mangaTitle,
        manga_thumb: mangaThumb || "",
        chapter_id: chapterId!,
        chapter_title: chapterTitle || `Chapter ${chapterNumber}`,
        chapter_number: chapterNumber || "",
      });

      if (chapterNumber && totalChapters) {
        await updateProgress({
          mangaId,
          mangaTitle,
          mangaThumb: mangaThumb || "",
          chapterId: chapterId!,
          chapterTitle: chapterTitle || `Chapter ${chapterNumber}`,
          chapterNumber,
          totalChapters: parseInt(totalChapters),
        });

        // Update reading goal progress
        const activeGoal = getActiveGoal();
        if (activeGoal) {
          await updateGoalProgress(activeGoal.id, 1);
        }
      }
    } catch (error) {
      console.error("Failed to track reading:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white">Loading chapter...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur z-10 p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </header>

      <main className="pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.link}
              alt={`Page ${index + 1}`}
              className="w-full mb-1"
              loading="lazy"
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ChapterReader;
