import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ReadingGoal {
  id: string;
  user_id: string;
  goal_type: "daily" | "weekly" | "monthly" | "yearly";
  target_chapters: number;
  current_progress: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useReadingGoals = () => {
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("reading_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals((data || []) as ReadingGoal[]);
    } catch (error: any) {
      console.error("Error loading goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async (params: {
    goalType: "daily" | "weekly" | "monthly" | "yearly";
    targetChapters: number;
  }) => {
    if (!user) return;

    try {
      const endDate = new Date();
      switch (params.goalType) {
        case "daily":
          endDate.setDate(endDate.getDate() + 1);
          break;
        case "weekly":
          endDate.setDate(endDate.getDate() + 7);
          break;
        case "monthly":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case "yearly":
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const { error } = await supabase.from("reading_goals").insert({
        user_id: user.id,
        goal_type: params.goalType,
        target_chapters: params.targetChapters,
        current_progress: 0,
        end_date: endDate.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Goal created!",
        description: `Set a ${params.goalType} goal of ${params.targetChapters} chapters`,
      });

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProgress = async (goalId: string, increment: number = 1) => {
    if (!user) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const { error } = await supabase
        .from("reading_goals")
        .update({ current_progress: goal.current_progress + increment })
        .eq("id", goalId);

      if (error) throw error;
      await loadGoals();
    } catch (error: any) {
      console.error("Error updating goal progress:", error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("reading_goals")
        .delete()
        .eq("id", goalId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Goal deleted",
        description: "Your reading goal has been removed",
      });

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getActiveGoal = () => {
    return goals.find(goal => {
      if (!goal.end_date) return true;
      return new Date(goal.end_date) > new Date();
    });
  };

  return {
    goals,
    isLoading,
    createGoal,
    updateProgress,
    deleteGoal,
    getActiveGoal,
    reloadGoals: loadGoals,
  };
};
