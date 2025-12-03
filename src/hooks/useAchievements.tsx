import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  earned_at: string;
}

const ACHIEVEMENT_DEFINITIONS = [
  { type: "first_manga", name: "First Steps", description: "Complete your first manga", requirement: { manga_completed: 1 } },
  { type: "manga_10", name: "Bookworm", description: "Complete 10 manga", requirement: { manga_completed: 10 } },
  { type: "manga_50", name: "Manga Master", description: "Complete 50 manga", requirement: { manga_completed: 50 } },
  { type: "chapters_100", name: "Century Reader", description: "Read 100 chapters", requirement: { chapters_read: 100 } },
  { type: "chapters_500", name: "Chapter Champion", description: "Read 500 chapters", requirement: { chapters_read: 500 } },
  { type: "streak_7", name: "Week Warrior", description: "Maintain a 7-day reading streak", requirement: { streak: 7 } },
  { type: "streak_30", name: "Monthly Master", description: "Maintain a 30-day reading streak", requirement: { streak: 30 } },
  { type: "first_follower", name: "Social Starter", description: "Get your first follower", requirement: { followers: 1 } },
  { type: "followers_10", name: "Rising Star", description: "Get 10 followers", requirement: { followers: 10 } },
];

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndAwardAchievements = async (stats: {
    manga_completed?: number;
    chapters_read?: number;
    streak?: number;
    followers?: number;
  }) => {
    if (!user) return;

    const earnedTypes = achievements.map(a => a.achievement_type);

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (earnedTypes.includes(def.type)) continue;

      let earned = false;
      if (def.requirement.manga_completed && stats.manga_completed && stats.manga_completed >= def.requirement.manga_completed) {
        earned = true;
      }
      if (def.requirement.chapters_read && stats.chapters_read && stats.chapters_read >= def.requirement.chapters_read) {
        earned = true;
      }
      if (def.requirement.streak && stats.streak && stats.streak >= def.requirement.streak) {
        earned = true;
      }
      if (def.requirement.followers && stats.followers && stats.followers >= def.requirement.followers) {
        earned = true;
      }

      if (earned) {
        try {
          const { error } = await supabase.from("achievements").insert({
            user_id: user.id,
            achievement_type: def.type,
            achievement_name: def.name,
            achievement_description: def.description,
          });

          if (!error) {
            toast({
              title: "🏆 Achievement Unlocked!",
              description: `${def.name}: ${def.description}`,
            });
          }
        } catch (error) {
          console.error("Error awarding achievement:", error);
        }
      }
    }

    await loadAchievements();
  };

  const getAchievementDefinitions = () => ACHIEVEMENT_DEFINITIONS;

  return {
    achievements,
    isLoading,
    checkAndAwardAchievements,
    getAchievementDefinitions,
    reloadAchievements: loadAchievements,
  };
};
