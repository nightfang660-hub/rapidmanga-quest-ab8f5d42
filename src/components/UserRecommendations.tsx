import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface SuggestedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_manga_read: number | null;
}

export const UserRecommendations = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { following, followUser, isFollowing } = useSocialFeatures();

  useEffect(() => {
    if (user) {
      loadSuggestedUsers();
    }
  }, [user, following]);

  const loadSuggestedUsers = async () => {
    try {
      const followingIds = following.map(f => f.following_id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_manga_read")
        .neq("id", user?.id || "")
        .order("total_manga_read", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const filtered = (data || []).filter(u => !followingIds.includes(u.id));
      setSuggestedUsers(filtered.slice(0, 5));
    } catch (error) {
      console.error("Error loading suggested users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || suggestedUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestedUsers.map((suggestedUser) => {
          const displayName = suggestedUser.display_name || suggestedUser.username || "User";
          const initials = displayName.slice(0, 2).toUpperCase();
          
          return (
            <div key={suggestedUser.id} className="flex items-center gap-3">
              <Link to={`/user/${suggestedUser.id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={suggestedUser.avatar_url || ""} alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${suggestedUser.id}`} className="hover:underline">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {suggestedUser.total_manga_read || 0} manga read
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => followUser(suggestedUser.id)}
                disabled={isFollowing(suggestedUser.id)}
              >
                {isFollowing(suggestedUser.id) ? "Following" : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
