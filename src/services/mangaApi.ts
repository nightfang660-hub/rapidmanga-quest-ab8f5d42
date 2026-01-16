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
  // MangaDex enriched metadata
  mangadexId?: string;
  altTitles?: Array<{ lang: string; title: string }>;
  authors?: string[];
  artists?: string[];
  tags?: Array<{ id: string; name: string; group: string }>;
  originalLanguage?: string;
  publicationDemographic?: string;
  contentRating?: string;
  mangadexDescription?: string;
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
    // Check if it's a rate limit error (429)
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new Error('RATE_LIMITED');
    }
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

const callMangaDexSync = async (action: string, params: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('mangadex-sync', {
    body: { action, params },
  });

  if (error) {
    console.error('MangaDex sync error:', error);
    // Don't throw - MangaDex is optional metadata enrichment
    return null;
  }

  return data;
};

// Transform cached manga data to include MangaDex metadata
const transformCachedManga = (m: any): Manga => ({
  id: m.api_id,
  title: m.title,
  summary: m.mangadex_description || m.description,
  thumb: m.cover_url,
  status: m.status,
  mangadexId: m.mangadex_id,
  altTitles: m.alt_titles,
  authors: m.authors,
  artists: m.artists,
  tags: m.tags,
  originalLanguage: m.original_language,
  publicationDemographic: m.publication_demographic,
  contentRating: m.content_rating,
  mangadexDescription: m.mangadex_description,
});

// Check if cached data is still fresh
const isCacheFresh = (lastFetchedAt: string | null): boolean => {
  if (!lastFetchedAt) return false;
  const lastFetched = new Date(lastFetchedAt).getTime();
  return Date.now() - lastFetched < CACHE_DURATION;
};

export const mangaApi = {
  async fetchManga(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    // Try cache first for all pages
    try {
      const offset = (page - 1) * 20;
      const { data: cachedManga, error } = await supabase
        .from('mangas')
        .select('api_id, title, description, cover_url, status, last_fetched_at, mangadex_id, alt_titles, authors, artists, tags, original_language, publication_demographic, content_rating, mangadex_description')
        .order('last_fetched_at', { ascending: false })
        .range(offset, offset + 19);

      if (!error && cachedManga && cachedManga.length > 0) {
        console.log('Using cached manga data for page:', page);
        return {
          data: cachedManga.map(transformCachedManga)
        };
      }
    } catch (cacheError) {
      console.log('Cache check failed:', cacheError);
    }

    // Fallback to API
    try {
      return await callMangaProxy('fetch', { page, genres, nsfw, type });
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited, returning empty data');
        return { data: [] };
      }
      throw error;
    }
  },

  async fetchLatest(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    // Always try cache first
    try {
      const offset = (page - 1) * 20;
      const { data: cachedManga, error } = await supabase
        .from('mangas')
        .select('api_id, title, description, cover_url, status, last_fetched_at, mangadex_id, alt_titles, authors, artists, tags, original_language, publication_demographic, content_rating, mangadex_description')
        .order('last_fetched_at', { ascending: false })
        .range(offset, offset + 19);

      if (!error && cachedManga && cachedManga.length > 0) {
        console.log('Using cached manga data with MangaDex enrichment, page:', page);
        return {
          data: cachedManga.map(transformCachedManga)
        };
      }
    } catch (cacheError) {
      console.log('Cache check failed, falling back to API:', cacheError);
    }

    // Fetch from API only if cache is empty
    try {
      const data = await callMangaProxy('latest', { page, genres, nsfw, type });
      
      // Trigger background sync for first page
      if (page === 1 && !genres) {
        callMangaSync('syncLatest', { page: 1 }).catch(err => 
          console.log('Background sync failed:', err)
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited, returning empty data');
        return { data: [] };
      }
      throw error;
    }
  },

  async searchManga(text: string, nsfw: boolean = false, type: string = "all") {
    // Try local search first
    try {
      const { data: cachedResults, error } = await supabase
        .from('mangas')
        .select('api_id, title, description, cover_url, status, last_fetched_at, mangadex_id, alt_titles, authors, artists, tags, original_language, publication_demographic, content_rating, mangadex_description')
        .ilike('title', `%${text}%`)
        .limit(20);

      if (!error && cachedResults && cachedResults.length > 0) {
        console.log('Using cached search results for:', text);
        return {
          data: cachedResults.map(transformCachedManga)
        };
      }
    } catch (cacheError) {
      console.log('Local search failed:', cacheError);
    }

    // Fallback to API
    try {
      return await callMangaProxy('search', { text, nsfw, type });
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited on search');
        return { data: [] };
      }
      throw error;
    }
  },

  async getManga(id: string) {
    // Try cache first with enriched metadata (use cache even if stale to avoid rate limits)
    try {
      const { data: cachedManga, error } = await supabase
        .from('mangas')
        .select('api_id, title, description, cover_url, status, last_fetched_at, mangadex_id, alt_titles, authors, artists, tags, original_language, publication_demographic, content_rating, mangadex_description')
        .eq('api_id', id)
        .single();

      if (!error && cachedManga) {
        console.log('Using cached manga details for:', id);
        // Trigger background refresh if stale
        if (!isCacheFresh(cachedManga.last_fetched_at)) {
          callMangaSync('syncMangaChapters', { mangaId: id, enrichWithMangaDex: true }).catch(err => 
            console.log('Background chapter sync failed:', err)
          );
        }
        return {
          data: transformCachedManga(cachedManga)
        };
      }
    } catch (cacheError) {
      console.log('Cache check failed for manga:', cacheError);
    }

    // Fetch from API only if not in cache
    try {
      const data = await callMangaProxy('getManga', { id });
      
      // Trigger background sync (includes MangaDex enrichment)
      callMangaSync('syncMangaChapters', { mangaId: id, enrichWithMangaDex: true }).catch(err => 
        console.log('Background chapter sync failed:', err)
      );

      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited on getManga');
        return { data: null };
      }
      throw error;
    }
  },

  async fetchChapters(id: string) {
    // Try cache first (always prefer cache to avoid rate limits)
    try {
      const { data: manga } = await supabase
        .from('mangas')
        .select('id, last_fetched_at')
        .eq('api_id', id)
        .single();

      if (manga) {
        const { data: cachedChapters, error } = await supabase
          .from('chapters')
          .select('api_id, chapter_number, title, release_date')
          .eq('manga_id', manga.id)
          .order('chapter_number', { ascending: false });

        if (!error && cachedChapters && cachedChapters.length > 0) {
          console.log('Using cached chapters for manga:', id);
          // Trigger background refresh if stale
          if (!isCacheFresh(manga.last_fetched_at)) {
            callMangaSync('syncMangaChapters', { mangaId: id }).catch(err => 
              console.log('Background chapter sync failed:', err)
            );
          }
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

    // Fetch from API only if no cache
    try {
      const data = await callMangaProxy('fetchChapters', { id });
      
      // Trigger background sync
      callMangaSync('syncMangaChapters', { mangaId: id }).catch(err => 
        console.log('Background chapter sync failed:', err)
      );

      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited on fetchChapters');
        return { data: [] };
      }
      throw error;
    }
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
    try {
      const data = await callMangaProxy('fetchChapterImages', { id });
      
      // Trigger background sync to cache images
      callMangaSync('syncChapterImages', { chapterId: id }).catch(err => 
        console.log('Background image sync failed:', err)
      );

      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('Rate limited on fetchChapterImages');
        return { data: [] };
      }
      throw error;
    }
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

  // MangaDex metadata enrichment methods
  async enrichMangaMetadata(mangaId: string) {
    return callMangaDexSync('enrichSingle', { apiId: mangaId });
  },

  async enrichBatchMetadata(limit: number = 20) {
    return callMangaDexSync('enrichBatch', { limit });
  },

  async getMangaDexSyncHealth() {
    return callMangaDexSync('health', {});
  },
};
