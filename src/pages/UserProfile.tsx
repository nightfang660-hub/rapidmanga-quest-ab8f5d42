import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, BookOpen, Award, Flame } from "lucide-react";

interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_manga_read: number | null;
  total_chapters_read: number | null;
  reading_streak: number | null;
}

interface Achievement {
  id: string;
  achievement_name: string;
  achievement_description: string | null;
  earned_at: string;
}

interface SharedRecommendation {
  id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string | null;
  recommendation_text: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { followUser, unfollowUser, isFollowing, followers, following } = useSocialFeatures();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = useState<SharedRecommendation[]>([]);
  const [userFollowers, setUserFollowers] = useState<number>(0);
  const [userFollowing, setUserFollowing] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, achievementsRes, recommendationsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("achievements").select("*").eq("user_id", userId).order("earned_at", { ascending: false }),
        supabase.from("shared_recommendations").select("*").eq("user_id", userId).eq("is_public", true).order("created_at", { ascending: false }),
        supabase.from("user_follows").select("id").eq("following_id", userId),
        supabase.from("user_follows").select("id").eq("follower_id", userId),
      ]);

      setProfile(profileRes.data);
      setAchievements(achievementsRes.data || []);
      setRecommendations(recommendationsRes.data || []);
      setUserFollowers(followersRes.data?.length || 0);
      setUserFollowing(followingRes.data?.length || 0);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">User not found</div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold">{displayName}</h1>
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing(userId || "") ? "outline" : "default"}
                    size="sm"
                    onClick={() => isFollowing(userId || "") ? unfollowUser(userId || "") : followUser(userId || "")}
                  >
                    {isFollowing(userId || "") ? (
                      <><UserMinus className="h-4 w-4 mr-1" /> Unfollow</>
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                    )}
                  </Button>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex justify-center sm:justify-start gap-6 sm:gap-8 mb-4">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold">{profile.total_manga_read || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">manga</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold">{userFollowers}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold">{userFollowing}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">following</p>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center p-3">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{profile.total_chapters_read || 0}</p>
              <p className="text-xs text-muted-foreground">Chapters</p>
            </Card>
            <Card className="text-center p-3">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold">{profile.reading_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </Card>
            <Card className="text-center p-3">
              <Award className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold">{achievements.length}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </Card>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-4">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="p-3 text-center bg-primary/5">
                    <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{achievement.achievement_name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.achievement_description}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No achievements yet</p>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            {recommendations.length > 0 ? (
              <div className="grid gap-4">
                {recommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardContent className="p-4 flex gap-4">
                      {rec.manga_thumb && (
                        <img
                          src={rec.manga_thumb}
                          alt={rec.manga_title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{rec.manga_title}</h3>
                        {rec.recommendation_text && (
                          <p className="text-sm text-muted-foreground mt-1">{rec.recommendation_text}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recommendations shared</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
