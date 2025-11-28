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

  const handleSearch = (query: string) => {
    navigate(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MangaVerse</h1>
                <p className="text-xs text-muted-foreground">Your digital manga library</p>
              </div>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} placeholder="Search thousands of manga..." />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="latest" className="text-base">
              Latest Releases
            </TabsTrigger>
            <TabsTrigger value="popular" className="text-base">
              Popular Now
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <MangaGrid manga={manga} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default Index;
