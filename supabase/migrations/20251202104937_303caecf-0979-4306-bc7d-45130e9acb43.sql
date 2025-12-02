-- Enhance profiles table with more user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS total_manga_read integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chapters_read integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_read_date timestamp with time zone;

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON public.reading_history(user_id, last_read_at DESC);

-- Update the profiles RLS policy to allow users to update their own stats
CREATE POLICY "Users can update own profile stats" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);