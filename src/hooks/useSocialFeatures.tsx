import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface SharedRecommendation {
  id: string;
  user_id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string | null;
  recommendation_text: string | null;
  shared_with_user_id: string | null;
  is_public: boolean;
  created_at: string;
}

export const useSocialFeatures = () => {
  const [followers, setFollowers] = useState<UserFollow[]>([]);
  const [following, setFollowing] = useState<UserFollow[]>([]);
  const [sharedRecommendations, setSharedRecommendations] = useState<SharedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSocialData();
    }
  }, [user]);

  const loadSocialData = async () => {
    try {
      const [followersData, followingData, recommendationsData] = await Promise.all([
        supabase.from("user_follows").select("*").eq("following_id", user?.id || ""),
        supabase.from("user_follows").select("*").eq("follower_id", user?.id || ""),
        supabase.from("shared_recommendations").select("*").order("created_at", { ascending: false })
      ]);

      setFollowers(followersData.data || []);
      setFollowing(followingData.data || []);
      setSharedRecommendations(recommendationsData.data || []);
    } catch (error: any) {
      console.error("Error loading social data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const followUser = async (followingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: followingId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You are now following this user",
      });

      await loadSocialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (followingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have unfollowed this user",
      });

      await loadSocialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const shareRecommendation = async (params: {
    mangaId: string;
    mangaTitle: string;
    mangaThumb: string;
    recommendationText?: string;
    sharedWithUserId?: string;
    isPublic?: boolean;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("shared_recommendations").insert({
        user_id: user.id,
        manga_id: params.mangaId,
        manga_title: params.mangaTitle,
        manga_thumb: params.mangaThumb,
        recommendation_text: params.recommendationText || null,
        shared_with_user_id: params.sharedWithUserId || null,
        is_public: params.isPublic || false,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recommendation shared successfully",
      });

      await loadSocialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isFollowing = (userId: string) => {
    return following.some((f) => f.following_id === userId);
  };

  return {
    followers,
    following,
    sharedRecommendations,
    isLoading,
    followUser,
    unfollowUser,
    shareRecommendation,
    isFollowing,
    reloadSocialData: loadSocialData,
  };
};
