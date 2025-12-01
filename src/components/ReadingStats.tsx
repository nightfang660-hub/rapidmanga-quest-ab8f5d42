import { useReadingProgress } from "@/hooks/useReadingProgress";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Flame } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export const ReadingStats = () => {
  const { progressList } = useReadingProgress();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const completedManga = progressList.filter((p) => p.status === "completed").length;
  const readingManga = progressList.filter((p) => p.status === "reading").length;
  
  // Calculate reading streak (simplified - days with reading activity)
  const streak = Math.min(readingManga + completedManga, 7); // Simplified calculation

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10">
          <Flame className="h-4 w-4 text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <Card className="mx-4 mb-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold mb-3">Reading Stats</h3>
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total Read</p>
            <p className="text-lg font-bold">{completedManga}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Currently Reading</p>
            <p className="text-lg font-bold">{readingManga}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Day Streak</p>
            <p className="text-lg font-bold">{streak}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
