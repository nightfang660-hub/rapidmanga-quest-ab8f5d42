const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";
const API_KEY = "2b3a28e179msh0db6e211caebe38p19826fjsn99f949c56d24";
const API_HOST = "mangaverse-api.p.rapidapi.com";

const headers = {
  "x-rapidapi-key": API_KEY,
  "x-rapidapi-host": API_HOST,
};

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

export const mangaApi = {
  async fetchManga(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    const querystring = new URLSearchParams({
      page: page.toString(),
      ...(genres && { genres }),
      nsfw: nsfw.toString(),
      type,
    });

    const response = await fetch(`${API_BASE_URL}/manga/fetch?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch manga");
    }

    return response.json();
  },

  async fetchLatest(page: number = 1, genres?: string, nsfw: boolean = false, type: string = "all") {
    const querystring = new URLSearchParams({
      page: page.toString(),
      ...(genres && { genres }),
      nsfw: nsfw.toString(),
      type,
    });

    const response = await fetch(`${API_BASE_URL}/manga/latest?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch latest manga");
    }

    return response.json();
  },

  async searchManga(text: string, nsfw: boolean = false, type: string = "all") {
    const querystring = new URLSearchParams({
      text,
      nsfw: nsfw.toString(),
      type,
    });

    const response = await fetch(`${API_BASE_URL}/manga/search?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to search manga");
    }

    return response.json();
  },

  async getManga(id: string) {
    const querystring = new URLSearchParams({ id });

    const response = await fetch(`${API_BASE_URL}/manga?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to get manga details");
    }

    return response.json();
  },

  async fetchChapters(id: string) {
    const querystring = new URLSearchParams({ id });

    const response = await fetch(`${API_BASE_URL}/manga/chapter?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chapters");
    }

    return response.json();
  },

  async fetchChapterImages(id: string) {
    const querystring = new URLSearchParams({ id });

    const response = await fetch(`${API_BASE_URL}/manga/image?${querystring}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chapter images");
    }

    return response.json();
  },
};
