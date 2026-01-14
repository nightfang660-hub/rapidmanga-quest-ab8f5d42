-- 1. Create a table for Mangas
CREATE TABLE IF NOT EXISTS public.mangas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT,
    status VARCHAR(50),
    latest_chapter_number FLOAT DEFAULT 0,
    last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create a table for Chapters
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    api_id VARCHAR(255) UNIQUE NOT NULL,
    chapter_number FLOAT NOT NULL,
    title VARCHAR(255),
    release_date TIMESTAMP WITH TIME ZONE,
    pages JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON public.chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_mangas_api_id ON public.mangas(api_id);

-- 4. SECURITY: Enable Row Level Security (RLS)
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- 5. POLICY: Allow Public Read Access
CREATE POLICY "Public mangas are viewable by everyone" 
ON public.mangas FOR SELECT 
USING (true);

CREATE POLICY "Public chapters are viewable by everyone" 
ON public.chapters FOR SELECT 
USING (true);

-- 6. Create trigger to auto-update updated_at on mangas
CREATE TRIGGER update_mangas_updated_at
  BEFORE UPDATE ON public.mangas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();