import { useState } from "react";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Share2, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const SocialFeatures = () => {
  const { followers, following, sharedRecommendations, shareRecommendation } = useSocialFeatures();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [recommendationText, setRecommendationText] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{followers.length}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{following.length}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-3 mt-4">
            {sharedRecommendations.length > 0 ? (
              sharedRecommendations.slice(0, 5).map((rec) => (
                <Link key={rec.id} to={`/manga/${rec.manga_id}`}>
                  <div className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <img
                      src={rec.manga_thumb || ""}
                      alt={rec.manga_title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{rec.manga_title}</p>
                      {rec.recommendation_text && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {rec.recommendation_text}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Heart className="h-3 w-3 text-muted-foreground" />
                        <Share2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                No recommendations yet
              </p>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-2 mt-4">
            {followers.length > 0 ? (
              followers.slice(0, 5).map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">User {follower.follower_id.slice(0, 8)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                No followers yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
