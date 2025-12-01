-- Create manga_reviews table
CREATE TABLE IF NOT EXISTS public.manga_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manga_id TEXT NOT NULL,
  manga_title TEXT NOT NULL,
  manga_thumb TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Create reading_goals table
CREATE TABLE IF NOT EXISTS public.reading_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'monthly',
  target_chapters INTEGER NOT NULL DEFAULT 10,
  current_progress INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manga_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for manga_reviews
CREATE POLICY "Users can view all reviews"
ON public.manga_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create own reviews"
ON public.manga_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.manga_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.manga_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for reading_goals
CREATE POLICY "Users can view own goals"
ON public.reading_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
ON public.reading_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON public.reading_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON public.reading_goals FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_manga_reviews_updated_at
BEFORE UPDATE ON public.manga_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_goals_updated_at
BEFORE UPDATE ON public.reading_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();