-- Add MangaDex metadata columns to mangas table for hybrid architecture
-- MangaVerse = content source (chapters, images)
-- MangaDex = metadata source (alt titles, authors, tags, description enrichment)

-- Add provider-specific ID columns
ALTER TABLE public.mangas 
ADD COLUMN IF NOT EXISTS mangadex_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS normalized_title text DEFAULT NULL;

-- Add MangaDex metadata columns (stored as JSONB for flexibility)
ALTER TABLE public.mangas 
ADD COLUMN IF NOT EXISTS alt_titles jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS authors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS artists jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS original_language text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS publication_demographic text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS content_rating text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mangadex_description text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mangadex_last_synced_at timestamp with time zone DEFAULT NULL;

-- Create index on normalized_title for efficient matching
CREATE INDEX IF NOT EXISTS idx_mangas_normalized_title ON public.mangas (normalized_title);

-- Create index on mangadex_id for lookups
CREATE INDEX IF NOT EXISTS idx_mangas_mangadex_id ON public.mangas (mangadex_id);

-- Create a function to normalize manga titles for matching
CREATE OR REPLACE FUNCTION normalize_manga_title(title text)
RETURNS text AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          COALESCE(title, ''),
          '[^a-zA-Z0-9\s]', '', 'g'  -- Remove special characters
        ),
        '\s+', ' ', 'g'  -- Normalize whitespace
      ),
      '^\s+|\s+$', '', 'g'  -- Trim
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Add trigger to auto-normalize titles on insert/update
CREATE OR REPLACE FUNCTION update_normalized_title()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_title := normalize_manga_title(NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_normalize_manga_title ON public.mangas;
CREATE TRIGGER trigger_normalize_manga_title
  BEFORE INSERT OR UPDATE OF title ON public.mangas
  FOR EACH ROW
  EXECUTE FUNCTION update_normalized_title();

-- Update existing records with normalized titles
UPDATE public.mangas SET normalized_title = normalize_manga_title(title) WHERE normalized_title IS NULL;