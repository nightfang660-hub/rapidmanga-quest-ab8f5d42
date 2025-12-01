import { useRecommendations } from "@/hooks/useRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const RecommendationsSection = () => {
  const { recommendedGenres } = useRecommendations();

  if (recommendedGenres.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended Genres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Based on your reading history, you might enjoy:
        </p>
        <div className="flex flex-wrap gap-2">
          {recommendedGenres.map((genre) => (
            <Link key={genre} to={`/search?genres=${encodeURIComponent(genre)}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                {genre}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
