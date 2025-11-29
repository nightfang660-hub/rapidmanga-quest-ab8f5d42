import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { SearchBar } from "@/components/SearchBar";
import { useToast } from "@/hooks/use-toast";

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
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Search Results</h1>
          <SearchBar onSearch={handleSearch} placeholder="Search manga..." />
          {query && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing results for: <span className="font-semibold">{query}</span>
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MangaGrid manga={manga} isLoading={isLoading} />

        {!isLoading && manga.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No manga found for "{query}". Try searching with different keywords.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
