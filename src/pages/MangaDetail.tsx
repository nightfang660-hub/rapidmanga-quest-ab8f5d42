import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mangaApi, Chapter } from "@/services/mangaApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Book } from "lucide-react";

const MangaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMangaDetails();
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

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
            {manga.status && (
              <Badge className="mb-4">{manga.status}</Badge>
            )}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((genre: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
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
                onClick={() => navigate(`/chapter/${chapter.id}`)}
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
      </main>
    </div>
  );
};

export default MangaDetail;
