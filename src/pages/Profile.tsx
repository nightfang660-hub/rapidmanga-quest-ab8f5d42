import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { ReadingGoals } from "@/components/ReadingGoals";
import { RecommendationsSection } from "@/components/RecommendationsSection";

const Profile = () => {
  const { user } = useAuth();
  const { progressList, isLoading } = useReadingProgress();

  const readingManga = progressList.filter((p) => p.status === "reading");
  const completedManga = progressList.filter((p) => p.status === "completed");
  const planToRead = progressList.filter((p) => p.status === "plan_to_read");

  const stats = [
    { label: "Reading", value: readingManga.length, icon: BookOpen, color: "text-primary" },
    { label: "Completed", value: completedManga.length, icon: CheckCircle2, color: "text-green-500" },
    { label: "Plan to Read", value: planToRead.length, icon: Clock, color: "text-yellow-500" },
  ];

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Your Profile</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-6 lg:grid-cols-2">
          <ReadingGoals />
          <RecommendationsSection />
        </div>

        <Tabs defaultValue="reading" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="plan">Plan to Read</TabsTrigger>
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
      </main>
    </div>
  );
};

export default Profile;