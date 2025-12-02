import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, isToday, isYesterday, isThisWeek } from "date-fns";

interface HistoryItem {
  id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string | null;
  chapter_id: string;
  chapter_title: string;
  chapter_number: string | null;
  last_read_at: string;
}

export const ReadingHistoryTimeline = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, total: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("reading_history")
        .select("*")
        .order("last_read_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as HistoryItem[]);

      // Calculate stats
      const today = data?.filter((item) => isToday(parseISO(item.last_read_at))).length || 0;
      const thisWeek = data?.filter((item) => isThisWeek(parseISO(item.last_read_at))).length || 0;

      setStats({
        today,
        thisWeek,
        total: data?.length || 0,
      });
    } catch (error: any) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM d, yyyy");
  };

  const groupByDate = () => {
    const grouped: Record<string, HistoryItem[]> = {};
    history.forEach((item) => {
      const label = getDateLabel(item.last_read_at);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(item);
    });
    return grouped;
  };

  const groupedHistory = groupByDate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reading History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        <ScrollArea className="h-96">
          {Object.keys(groupedHistory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold mb-3 sticky top-0 bg-background py-1">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        to={`/manga/${item.manga_id}`}
                        className="block"
                      >
                        <div className="flex gap-3 p-2 rounded hover:bg-muted transition-colors">
                          <img
                            src={item.manga_thumb || ""}
                            alt={item.manga_title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">
                              {item.manga_title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.chapter_title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(item.last_read_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No reading history yet. Start reading to track your progress!
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
