import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

const Index = () => {
  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("latest");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadManga();
  }, [activeTab]);

  const loadManga = async () => {
    setIsLoading(true);
    try {
      const response =
        activeTab === "latest"
          ? await mangaApi.fetchLatest(1)
          : await mangaApi.fetchManga(1);
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

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await mangaApi.searchManga(query);
      setManga(response.data || []);
      setActiveTab("search");
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <h1 className="text-2xl font-bold">MangaVerse</h1>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>
        </Tabs>

        <MangaGrid manga={manga} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default Index;
