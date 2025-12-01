import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  user_id: string;
  manga_id: string;
  manga_title: string;
  manga_thumb: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

export const useReviews = (mangaId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [mangaId, user]);

  const loadReviews = async () => {
    try {
      let query = supabase.from("manga_reviews").select("*").order("created_at", { ascending: false });
      
      if (mangaId) {
        query = query.eq("manga_id", mangaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReviews(data || []);
      
      if (user && mangaId) {
        const userReviewData = data?.find(r => r.user_id === user.id);
        setUserReview(userReviewData || null);
      }
    } catch (error: any) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addReview = async (params: {
    mangaId: string;
    mangaTitle: string;
    mangaThumb: string;
    rating: number;
    reviewText?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("manga_reviews").upsert({
        user_id: user.id,
        manga_id: params.mangaId,
        manga_title: params.mangaTitle,
        manga_thumb: params.mangaThumb,
        rating: params.rating,
        review_text: params.reviewText || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Your review has been added",
      });

      await loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("manga_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed",
      });

      await loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  return {
    reviews,
    userReview,
    isLoading,
    addReview,
    deleteReview,
    getAverageRating,
    reloadReviews: loadReviews,
  };
};
