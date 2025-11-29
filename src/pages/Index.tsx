import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mangaApi, Manga } from "@/services/mangaApi";
import { MangaGrid } from "@/components/MangaGrid";
import { SearchBar } from "@/components/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Discover Manga</h1>
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
