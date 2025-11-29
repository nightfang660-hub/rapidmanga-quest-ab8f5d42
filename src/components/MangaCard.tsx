import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Manga } from "@/services/mangaApi";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface MangaCardProps {
  manga: Manga;
}

export const MangaCard = ({ manga }: MangaCardProps) => {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = isBookmarked(manga.id);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (bookmarked) {
      removeBookmark(manga.id);
    } else {
      addBookmark(manga);
    }
  };

  return (
    <Link to={`/manga/${manga.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full border-border/50 hover:border-primary/50">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={manga.thumb}
            alt={manga.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={handleBookmark}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          {manga.nsfw && (
            <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
              18+
            </Badge>
          )}
          {manga.status && (
            <Badge className="absolute bottom-2 left-2 bg-primary/90 shadow-lg">
              {manga.status}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {manga.title}
          </h3>
          {manga.genres && manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {manga.genres.slice(0, 2).map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
              {manga.genres.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{manga.genres.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
