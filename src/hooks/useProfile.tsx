import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_manga_read: number;
  total_chapters_read: number;
  reading_streak: number;
  last_read_date: string | null;
  chat_background_url: string | null;
  notification_preferences: Json | null;
  reading_preferences: Json | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id || "")
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      await loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateReadingStats = async () => {
    if (!user) return;

    try {
      // Get total unique manga read from reading_history
      const { data: historyData } = await supabase
        .from("reading_history")
        .select("manga_id")
        .eq("user_id", user.id);

      const uniqueManga = new Set(historyData?.map(h => h.manga_id) || []);
      
      // Get total chapters read
      const totalChapters = historyData?.length || 0;

      // Calculate reading streak
      const { data: recentReads } = await supabase
        .from("reading_history")
        .select("last_read_at")
        .eq("user_id", user.id)
        .order("last_read_at", { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentReads && recentReads.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dates = recentReads.map(r => {
          const d = new Date(r.last_read_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        });
        
        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const expectedDate = today.getTime() - (i * 24 * 60 * 60 * 1000);
          if (uniqueDates[i] === expectedDate) {
            streak++;
          } else {
            break;
          }
        }
      }

      await supabase
        .from("profiles")
        .update({
          total_manga_read: uniqueManga.size,
          total_chapters_read: totalChapters,
          reading_streak: streak,
          last_read_date: recentReads?.[0]?.last_read_at || null,
        })
        .eq("id", user.id);

      await loadProfile();
    } catch (error: any) {
      console.error("Error updating reading stats:", error);
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    updateReadingStats,
    reloadProfile: loadProfile,
  };
};
