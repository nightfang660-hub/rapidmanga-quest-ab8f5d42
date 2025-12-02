-- Create user_follows table for social features
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_follows
CREATE POLICY "Users can view all follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Create shared_recommendations table
CREATE TABLE IF NOT EXISTS public.shared_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manga_id TEXT NOT NULL,
  manga_title TEXT NOT NULL,
  manga_thumb TEXT,
  recommendation_text TEXT,
  shared_with_user_id UUID,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_recommendations
CREATE POLICY "Users can view public recommendations"
  ON public.shared_recommendations FOR SELECT
  USING (is_public = true OR user_id = auth.uid() OR shared_with_user_id = auth.uid());

CREATE POLICY "Users can create own recommendations"
  ON public.shared_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.shared_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON public.shared_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Create downloaded_chapters table for offline reading
CREATE TABLE IF NOT EXISTS public.downloaded_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manga_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  chapter_data JSONB NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Enable RLS
ALTER TABLE public.downloaded_chapters ENABLE ROW LEVEL SECURITY;

-- RLS policies for downloaded_chapters
CREATE POLICY "Users can view own downloads"
  ON public.downloaded_chapters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own downloads"
  ON public.downloaded_chapters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON public.downloaded_chapters FOR DELETE
  USING (auth.uid() = user_id);