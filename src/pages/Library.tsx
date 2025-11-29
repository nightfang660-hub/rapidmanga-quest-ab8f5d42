import { useState, useEffect } from "react";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Filter, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Isekai", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports"
];

const Library = () => {
  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    loadManga();
  }, [activeTab, selectedGenres, currentPage]);

  const loadManga = async () => {
    if (activeTab === "bookmarked") {
      return;
    }

    setIsLoading(true);
    try {
      const genresQuery = selectedGenres.length > 0 ? selectedGenres.join(",") : undefined;
      const response = await mangaApi.fetchManga(currentPage, genresQuery);
      setManga(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load manga. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setCurrentPage(1);
  };

  const displayedManga = activeTab === "bookmarked"
    ? bookmarks.map(b => ({
        id: b.manga_id,
        title: b.manga_title,
        thumb: b.manga_thumb,
        genres: b.manga_genres,
        nsfw: false,
        status: "",
      }))
    : manga;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Library</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 bg-card rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Genres</h3>
                {selectedGenres.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">All Manga</TabsTrigger>
              <TabsTrigger value="bookmarked">My Bookmarks</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MangaGrid manga={displayedManga} isLoading={isLoading} />

        {!isLoading && manga.length > 0 && activeTab !== "bookmarked" && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {[...Array(5)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;