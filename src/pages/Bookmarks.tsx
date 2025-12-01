import { useBookmarks } from "@/hooks/useBookmarks";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bookmark, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Bookmarks = () => {
  const { bookmarks, isLoading } = useBookmarks();
  const { progressList, getProgressForManga } = useReadingProgress();

  // Categorize bookmarks based on reading progress
  const categorizedBookmarks = bookmarks.reduce((acc, bookmark) => {
    const progress = getProgressForManga(bookmark.manga_id);
    
    if (progress) {
      if (progress.status === "reading") {
        acc.reading.push({ ...bookmark, progress });
      } else if (progress.status === "completed") {
        acc.completed.push({ ...bookmark, progress });
      } else if (progress.status === "plan_to_read") {
        acc.planToRead.push({ ...bookmark, progress });
      }
    } else {
      // If no progress, add to plan to read
      acc.planToRead.push({ ...bookmark, progress: null });
    }
    
    return acc;
  }, {
    reading: [] as any[],
    completed: [] as any[],
    planToRead: [] as any[]
  });

  const BookmarkCard = ({ item }: { item: any }) => (
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
              {item.manga_genres && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.manga_genres.slice(0, 3).map((genre: string, idx: number) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {item.progress && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">
                    Chapter {item.progress.current_chapter_number}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.progress.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.progress.progress_percentage}%
                    </span>
                  </div>
                </div>
              )}
              {!item.progress && (
                <Button size="sm" variant="outline" className="mt-2" asChild>
                  <Link to={`/manga/${item.manga_id}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Reading
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Bookmarks</h1>
              <p className="text-muted-foreground">
                {bookmarks.length} manga bookmarked
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">All ({bookmarks.length})</TabsTrigger>
            <TabsTrigger value="reading">Reading ({categorizedBookmarks.reading.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({categorizedBookmarks.completed.length})</TabsTrigger>
            <TabsTrigger value="plan">Plan ({categorizedBookmarks.planToRead.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {bookmarks.length > 0 ? (
                bookmarks.map((item) => {
                  const progress = getProgressForManga(item.manga_id);
                  return <BookmarkCard key={item.id} item={{ ...item, progress }} />;
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No bookmarks yet. Start bookmarking manga you like!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reading" className="mt-6">
            <div className="grid gap-4">
              {categorizedBookmarks.reading.length > 0 ? (
                categorizedBookmarks.reading.map((item) => (
                  <BookmarkCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No manga currently reading. Start a manga to see it here!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4">
              {categorizedBookmarks.completed.length > 0 ? (
                categorizedBookmarks.completed.map((item) => (
                  <BookmarkCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No completed manga yet. Keep reading!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plan" className="mt-6">
            <div className="grid gap-4">
              {categorizedBookmarks.planToRead.length > 0 ? (
                categorizedBookmarks.planToRead.map((item) => (
                  <BookmarkCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No planned manga. Bookmark some to read later!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Bookmarks;
