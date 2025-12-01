import { useState } from "react";
import { useReviews } from "@/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ReviewSectionProps {
  mangaId: string;
  mangaTitle: string;
  mangaThumb: string;
}

export const ReviewSection = ({ mangaId, mangaTitle, mangaThumb }: ReviewSectionProps) => {
  const { reviews, userReview, addReview, deleteReview, getAverageRating } = useReviews(mangaId);
  const { user } = useAuth();
  const [rating, setRating] = useState(userReview?.rating || 5);
  const [reviewText, setReviewText] = useState(userReview?.review_text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await addReview({
      mangaId,
      mangaTitle,
      mangaThumb,
      rating,
      reviewText,
    });
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (userReview) {
      await deleteReview(userReview.id);
      setRating(5);
      setReviewText("");
    }
  };

  const avgRating = getAverageRating();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reviews</span>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span>{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Your Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {userReview ? "Update Review" : "Submit Review"}
              </Button>
              {userReview && (
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reviews.filter(r => r.user_id !== user?.id).map((review) => (
            <div key={review.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.review_text && (
                <p className="text-sm">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No reviews yet. Be the first to review!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
