import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mangaApi, Chapter, Manga } from "@/services/mangaApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { ReviewSection } from "@/components/ReviewSection";
import { ArrowLeft, Book, Bookmark, BookmarkCheck, Play } from "lucide-react";

const MangaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { getProgressForManga } = useReadingProgress();
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Manga[]>([]);

  const bookmarked = manga ? isBookmarked(manga.id) : false;
  const progress = manga ? getProgressForManga(manga.id) : null;

  useEffect(() => {
    if (id) {
      loadMangaDetails();
      loadRecommendations();
    }
  }, [id]);

  const loadMangaDetails = async () => {
    setIsLoading(true);
    try {
      const [mangaResponse, chaptersResponse] = await Promise.all([
        mangaApi.getManga(id!),
        mangaApi.fetchChapters(id!),
      ]);
      setManga(mangaResponse.data);
      setChapters(chaptersResponse.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load manga details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await mangaApi.fetchManga(1);
      setRecommendations((response.data || []).slice(0, 6));
    } catch (error) {
      console.error("Failed to load recommendations");
    }
  };

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(manga.id);
    } else {
      addBookmark(manga);
    }
  };

  const handleStartReading = () => {
    if (chapters.length > 0) {
      navigate(`/chapter/${chapters[0].id}`);
    }
  };

  const handleContinueReading = () => {
    if (progress) {
      navigate(`/chapter/${progress.current_chapter_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Manga not found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-8">
          <div>
            <img
              src={manga.thumb}
              alt={manga.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-4">{manga.title}</h1>
            {manga.author && (
              <p className="text-muted-foreground mb-2">Author: {manga.author}</p>
            )}
            <div className="flex items-center gap-2 mb-4">
              {manga.status && <Badge>{manga.status}</Badge>}
              {progress && (
                <Badge variant="secondary">
                  {progress.progress_percentage}% Complete
                </Badge>
              )}
            </div>
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((genre: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-3 mb-4">
              {progress ? (
                <Button onClick={handleContinueReading} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Continue Reading
                </Button>
              ) : (
                <Button onClick={handleStartReading} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Reading
                </Button>
              )}
              <Button
                onClick={handleBookmark}
                variant={bookmarked ? "default" : "outline"}
                size="lg"
                className="gap-2"
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Bookmark
                  </>
                )}
              </Button>
            </div>
            {manga.summary && (
              <p className="text-muted-foreground leading-relaxed">{manga.summary}</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Book className="h-6 w-6" />
            Chapters
          </h2>
          <div className="grid gap-2">
            {chapters.map((chapter) => (
              <Card
                key={chapter.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  const params = new URLSearchParams({
                    mangaId: manga.id,
                    mangaTitle: manga.title,
                    mangaThumb: manga.thumb,
                    chapterTitle: chapter.title,
                    chapterNumber: chapter.chapterNumber || "",
                    totalChapters: chapters.length.toString(),
                  });
                  navigate(`/chapter/${chapter.id}?${params.toString()}`);
                }}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold">{chapter.title}</h3>
                  {chapter.chapterNumber && (
                    <p className="text-sm text-muted-foreground">
                      Chapter {chapter.chapterNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <ReviewSection
            mangaId={manga.id}
            mangaTitle={manga.title}
            mangaThumb={manga.thumb}
          />
        </div>

        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/manga/${rec.id}`)}
                >
                  <div className="aspect-[2/3] overflow-hidden">
                    <img
                      src={rec.thumb}
                      alt={rec.title}
                      className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium line-clamp-2">{rec.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MangaDetail;
