import { supabase } from "@/integrations/supabase/client";

export interface Manga {
  id: string;
  title: string;
  thumb: string;
  summary?: string;
  genres?: string[];
  type?: string;
  nsfw?: boolean;
  author?: string;
  status?: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber?: string;
  createdAt?: string;
}

export interface ChapterImage {
  link: string;
}

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

const callMangaProxy = async (action: string, params: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('manga-proxy', {
    body: { action, params },
  });

  if (error) {
    console.error('Manga proxy error:', error);
    throw new Error(error.message || 'Failed to fetch from manga API');
  }

  return data;
};

const callMangaSync = async (action: string, params: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('manga-sync', {
    body: { action, params },
  });

  if (error) {
    console.error('Manga sync error:', error);
    throw new Error(error.message || 'Failed to sync manga data');
  }

  return data;
};

// Check if cached data is still fresh
const isCacheFresh = (lastFetchedAt: string | null): boolean => {
  if (!lastFetchedAt) return false;
  const lastFetched = new Date(lastFetchedAt).getTime();
  return Date.now() - lastFetched < CACHE_DURATION;
};

export const mangaApi = {
  async fetchManga(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    // For paginated lists, always fetch from API (caching individual pages is complex)
    return callMangaProxy('fetch', { page, genres, nsfw, type });
  },

  async fetchLatest(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    // Try to get from cache for first page only
    if (page === 1 && !genres) {
      try {
        const { data: cachedManga, error } = await supabase
          .from('mangas')
          .select('api_id, title, description, cover_url, status, last_fetched_at')
          .order('last_fetched_at', { ascending: false })
          .limit(20);

        if (!error && cachedManga && cachedManga.length > 0) {
          const firstManga = cachedManga[0];
          if (isCacheFresh(firstManga.last_fetched_at)) {
            console.log('Using cached manga data');
            return {
              data: cachedManga.map(m => ({
                id: m.api_id,
                title: m.title,
                summary: m.description,
                thumb: m.cover_url,
                status: m.status,
              }))
            };
          }
        }
      } catch (cacheError) {
        console.log('Cache check failed, falling back to API:', cacheError);
      }
    }

    // Fetch from API
    const data = await callMangaProxy('latest', { page, genres, nsfw, type });
    
    // Trigger background sync for first page
    if (page === 1 && !genres) {
      callMangaSync('syncLatest', { page: 1 }).catch(err => 
        console.log('Background sync failed:', err)
      );
    }

    return data;
  },

  async searchManga(text: string, nsfw: boolean = false, type: string = "all") {
    // Search is always real-time from API
    return callMangaProxy('search', { text, nsfw, type });
  },

  async getManga(id: string) {
    // Try cache first
    try {
      const { data: cachedManga, error } = await supabase
        .from('mangas')
        .select('*')
        .eq('api_id', id)
        .single();

      if (!error && cachedManga && isCacheFresh(cachedManga.last_fetched_at)) {
        console.log('Using cached manga details for:', id);
        return {
          data: {
            id: cachedManga.api_id,
            title: cachedManga.title,
            summary: cachedManga.description,
            thumb: cachedManga.cover_url,
            status: cachedManga.status,
          }
        };
      }
    } catch (cacheError) {
      console.log('Cache check failed for manga:', cacheError);
    }

    // Fetch from API
    const data = await callMangaProxy('getManga', { id });
    
    // Trigger background sync
    callMangaSync('syncMangaChapters', { mangaId: id }).catch(err => 
      console.log('Background chapter sync failed:', err)
    );

    return data;
  },

  async fetchChapters(id: string) {
    // Try cache first
    try {
      const { data: manga } = await supabase
        .from('mangas')
        .select('id, last_fetched_at')
        .eq('api_id', id)
        .single();

      if (manga && isCacheFresh(manga.last_fetched_at)) {
        const { data: cachedChapters, error } = await supabase
          .from('chapters')
          .select('api_id, chapter_number, title, release_date')
          .eq('manga_id', manga.id)
          .order('chapter_number', { ascending: false });

        if (!error && cachedChapters && cachedChapters.length > 0) {
          console.log('Using cached chapters for manga:', id);
          return {
            data: cachedChapters.map(c => ({
              id: c.api_id,
              title: c.title,
              chapterNumber: c.chapter_number.toString(),
              createdAt: c.release_date,
            }))
          };
        }
      }
    } catch (cacheError) {
      console.log('Cache check failed for chapters:', cacheError);
    }

    // Fetch from API
    const data = await callMangaProxy('fetchChapters', { id });
    
    // Trigger background sync
    callMangaSync('syncMangaChapters', { mangaId: id }).catch(err => 
      console.log('Background chapter sync failed:', err)
    );

    return data;
  },

  async fetchChapterImages(id: string) {
    // Try cache first
    try {
      const { data: cachedChapter, error } = await supabase
        .from('chapters')
        .select('pages')
        .eq('api_id', id)
        .single();

      if (!error && cachedChapter?.pages && Array.isArray(cachedChapter.pages) && cachedChapter.pages.length > 0) {
        console.log('Using cached chapter images for:', id);
        return { data: cachedChapter.pages };
      }
    } catch (cacheError) {
      console.log('Cache check failed for chapter images:', cacheError);
    }

    // Fetch from API
    const data = await callMangaProxy('fetchChapterImages', { id });
    
    // Trigger background sync to cache images
    callMangaSync('syncChapterImages', { chapterId: id }).catch(err => 
      console.log('Background image sync failed:', err)
    );

    return data;
  },

  // Manual sync methods for admin use
  async syncLatestManga(page: number = 1) {
    return callMangaSync('syncLatest', { page });
  },

  async syncMangaChapters(mangaId: string) {
    return callMangaSync('syncMangaChapters', { mangaId });
  },

  async syncChapterImages(chapterId: string) {
    return callMangaSync('syncChapterImages', { chapterId });
  },
};
