-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create reading_history table
CREATE TABLE public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL,
  manga_title TEXT NOT NULL,
  manga_thumb TEXT,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  chapter_number TEXT,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, chapter_id)
);

-- Enable RLS on reading_history
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Reading history policies
CREATE POLICY "Users can view own reading history"
  ON public.reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading history"
  ON public.reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading history"
  ON public.reading_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading history"
  ON public.reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL,
  manga_title TEXT NOT NULL,
  manga_thumb TEXT,
  manga_genres TEXT[],
  bookmarked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, manga_id)
);

-- Enable RLS on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create reading_progress table
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id TEXT NOT NULL,
  manga_title TEXT NOT NULL,
  manga_thumb TEXT,
  current_chapter_id TEXT NOT NULL,
  current_chapter_title TEXT NOT NULL,
  current_chapter_number TEXT,
  total_chapters INT DEFAULT 0,
  progress_percentage INT DEFAULT 0,
  status TEXT DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'plan_to_read')),
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, manga_id)
);

-- Enable RLS on reading_progress
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Reading progress policies
CREATE POLICY "Users can view own reading progress"
  ON public.reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress"
  ON public.reading_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for reading_progress updated_at
CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();