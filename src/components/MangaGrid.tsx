import { Manga } from "@/services/mangaApi";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  manga: Manga[];
  isLoading?: boolean;
}

export const MangaGrid = ({ manga, isLoading }: MangaGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted aspect-[3/4] rounded-lg mb-2" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (manga.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No manga found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {manga.map((item) => (
        <MangaCard key={item.id} manga={item} />
      ))}
    </div>
  );
};
