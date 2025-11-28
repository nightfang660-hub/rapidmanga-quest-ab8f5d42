import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft } from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const query = searchParams.get("query") || "";

  useEffect(() => {
    if (query) {
      searchManga(query);
    }
  }, [query]);

  const searchManga = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await mangaApi.searchManga(searchQuery);
      setManga(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      });
      setManga([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    navigate(`/search?query=${encodeURIComponent(newQuery)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={() => navigate("/")} size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <h1 className="text-2xl font-bold">MangaVerse</h1>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Search manga..." />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {query && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              Search Results for "{query}"
            </h2>
            <p className="text-muted-foreground">
              {!isLoading && manga.length > 0 && `Found ${manga.length} results`}
              {!isLoading && manga.length === 0 && "No results found"}
            </p>
          </div>
        )}

        <MangaGrid manga={manga} isLoading={isLoading} />

        {!isLoading && manga.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Try searching with different keywords
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
