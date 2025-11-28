import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Manga } from "@/services/mangaApi";

interface MangaCardProps {
  manga: Manga;
}

export const MangaCard = ({ manga }: MangaCardProps) => {
  return (
    <Link to={`/manga/${manga.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={manga.thumb}
            alt={manga.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {manga.nsfw && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              18+
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2">{manga.title}</h3>
          {manga.genres && manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {manga.genres.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
