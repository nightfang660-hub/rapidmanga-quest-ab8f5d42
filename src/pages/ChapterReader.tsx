import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mangaApi, ChapterImage } from "@/services/mangaApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ChapterReader = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      loadChapterImages();
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
