import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, BookOpen, Flame } from "lucide-react";
import { Link } from "react-router-dom";

export const Leaderboard = () => {
  const { getTopByChapters, getTopByManga, getTopByStreak, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-center text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  const LeaderboardList = ({ entries, valueKey, icon: Icon }: { entries: any[], valueKey: string, icon: any }) => (
    <div className="space-y-3">
      {entries.slice(0, 10).map((entry, index) => {
        const displayName = entry.display_name || entry.username || "Anonymous";
        const initials = displayName.slice(0, 2).toUpperCase();
        
        return (
          <Link
            key={entry.id}
            to={`/user/${entry.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
              index === 0 ? "bg-yellow-500 text-yellow-950" :
              index === 1 ? "bg-gray-400 text-gray-950" :
              index === 2 ? "bg-amber-600 text-amber-950" :
              "bg-muted text-muted-foreground"
            }`}>
              {index + 1}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{displayName}</p>
            </div>
            <div className="flex items-center gap-1 text-primary font-semibold">
              <Icon className="h-4 w-4" />
              <span>{entry[valueKey] || 0}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chapters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chapters" className="text-xs sm:text-sm">Chapters</TabsTrigger>
            <TabsTrigger value="manga" className="text-xs sm:text-sm">Manga</TabsTrigger>
            <TabsTrigger value="streak" className="text-xs sm:text-sm">Streak</TabsTrigger>
          </TabsList>
          <TabsContent value="chapters" className="mt-4">
            <LeaderboardList entries={getTopByChapters()} valueKey="total_chapters_read" icon={BookOpen} />
          </TabsContent>
          <TabsContent value="manga" className="mt-4">
            <LeaderboardList entries={getTopByManga()} valueKey="total_manga_read" icon={BookOpen} />
          </TabsContent>
          <TabsContent value="streak" className="mt-4">
            <LeaderboardList entries={getTopByStreak()} valueKey="reading_streak" icon={Flame} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
