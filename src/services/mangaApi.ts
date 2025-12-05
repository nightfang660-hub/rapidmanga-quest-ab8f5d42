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

export const mangaApi = {
  async fetchManga(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    return callMangaProxy('fetch', { page, genres, nsfw, type });
  },

  async fetchLatest(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    return callMangaProxy('latest', { page, genres, nsfw, type });
  },

  async searchManga(text: string, nsfw: boolean = false, type: string = "all") {
    return callMangaProxy('search', { text, nsfw, type });
  },

  async getManga(id: string) {
    return callMangaProxy('getManga', { id });
  },

  async fetchChapters(id: string) {
    return callMangaProxy('fetchChapters', { id });
  },

  async fetchChapterImages(id: string) {
    return callMangaProxy('fetchChapterImages', { id });
  },
};
