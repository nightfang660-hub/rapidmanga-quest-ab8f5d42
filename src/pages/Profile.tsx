import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { ReadingGoals } from "@/components/ReadingGoals";
import { RecommendationsSection } from "@/components/RecommendationsSection";
import { ReadingHistoryTimeline } from "@/components/ReadingHistoryTimeline";
import { useEffect } from "react";

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, updateReadingStats } = useProfile();
  const { progressList, isLoading } = useReadingProgress();
  const { followers, following } = useSocialFeatures();

  useEffect(() => {
    if (user) {
      updateReadingStats();
    }
  }, [user]);

  const readingManga = progressList.filter((p) => p.status === "reading");
  const completedManga = progressList.filter((p) => p.status === "completed");
  const planToRead = progressList.filter((p) => p.status === "plan_to_read");

  const ProgressCard = ({ item }: { item: any }) => (
    <Link to={`/manga/${item.manga_id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img
              src={item.manga_thumb}
              alt={item.manga_title}
              className="w-20 h-28 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 mb-2">{item.manga_title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Chapter {item.current_chapter_number}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.progress_percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.progress_percentage}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Instagram-like Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-8 mb-6">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Button variant="outline" size="sm">Edit Profile</Button>
              </div>

              {/* Stats Row */}
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{profile?.total_manga_read || 0}</p>
                  <p className="text-sm text-muted-foreground">manga</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{followers.length}</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{following.length}</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>

              {/* User Info */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-sm">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reading Goals Section */}
        <div className="mb-8">
          <ReadingGoals />
        </div>

        {/* Reading History Section */}
        <div className="mb-8">
          <ReadingHistoryTimeline />
        </div>

        {/* Social Recommendations Section */}
        <div className="mb-8">
          <RecommendationsSection />
        </div>

        {/* Reading Stats Tabs - Based on Reading History */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold mb-4">Reading Stats</h2>
          <Tabs defaultValue="reading" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="reading">
                Reading ({readingManga.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedManga.length})
              </TabsTrigger>
              <TabsTrigger value="plan">
                Plan to Read ({planToRead.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reading" className="mt-6">
              <div className="grid gap-4">
                {readingManga.length > 0 ? (
                  readingManga.map((item) => <ProgressCard key={item.id} item={item} />)
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No manga in reading list. Start reading to see them here!
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-4">
                {completedManga.length > 0 ? (
                  completedManga.map((item) => <ProgressCard key={item.id} item={item} />)
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No completed manga yet. Keep reading!
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plan" className="mt-6">
              <div className="grid gap-4">
                {planToRead.length > 0 ? (
                  planToRead.map((item) => <ProgressCard key={item.id} item={item} />)
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No manga in your plan to read list.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;