import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Filter, X } from "lucide-react";

const Discovery = () => {
  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const navigate = useNavigate();
  const { toast } = useToast();

  const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
    "Sports", "Supernatural", "Thriller", "Shounen", "Shoujo"
  ];

  useEffect(() => {
    loadManga();
  }, [sortBy]);

  const loadManga = async () => {
    setIsLoading(true);
    try {
      const response =
        sortBy === "latest"
          ? await mangaApi.fetchLatest(1)
          : await mangaApi.fetchManga(1);
      
      let filteredManga = response.data || [];
      
      // Filter by selected genres
      if (selectedGenres.length > 0) {
        filteredManga = filteredManga.filter((m) =>
          m.genres?.some((g) => selectedGenres.includes(g))
        );
      }
      
      setManga(filteredManga);
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

  const handleSearch = (query: string) => {
    navigate(`/search?query=${encodeURIComponent(query)}`);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSortBy("latest");
  };

  useEffect(() => {
    if (selectedGenres.length > 0) {
      loadManga();
    }
  }, [selectedGenres]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center sm:text-left">Discover Manga</h1>
          <SearchBar onSearch={handleSearch} placeholder="Search thousands of manga..." />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            {(selectedGenres.length > 0 || sortBy !== "latest") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Releases</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedGenres.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing results for: {selectedGenres.join(", ")}
            </p>
          </div>
        )}

        <MangaGrid manga={manga} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default Discovery;
