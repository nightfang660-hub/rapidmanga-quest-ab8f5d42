import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";

// Simple in-memory cache + request de-duplication.
// NOTE: This only persists for the lifetime of a warm function instance.
const CACHE_TTL_MS = 60_000; // 60s
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getRetryAfterMs = (res: Response) => {
  const ra = res.headers.get("retry-after");
  if (!ra) return 0;
  const seconds = Number(ra);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  return 0;
};

async function fetchWithCache(url: string, headers: Record<string, string>) {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > now) return cached.data;

  const existing = inflight.get(url);
  if (existing) return existing;

  const p = (async () => {
    // Retry policy:
    // - Retry 429 a couple of times honoring Retry-After when present.
    // - Also retry transient 5xx once.
    const attempts = 3;
    let lastStatus = 0;

    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url, { headers });
      lastStatus = res.status;

      if (res.ok) {
        const data = await res.json();
        responseCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, data });
        return data;
      }

      if (res.status === 429) {
        const wait = getRetryAfterMs(res) || (500 * Math.pow(2, i));
        console.warn(`Upstream rate-limited (429). Waiting ${wait}ms then retrying...`);
        await sleep(wait);
        continue;
      }

      if (res.status >= 500 && res.status < 600 && i < attempts - 1) {
        const wait = 300 * Math.pow(2, i);
        console.warn(`Upstream error ${res.status}. Waiting ${wait}ms then retrying...`);
        await sleep(wait);
        continue;
      }

      // Non-retryable error
      let msg = res.statusText;
      try {
        const maybeJson = await res.json();
        msg = (maybeJson && (maybeJson.error || maybeJson.message)) || msg;
      } catch {
        // ignore
      }
      throw { status: res.status, message: msg };
    }

    throw { status: lastStatus || 502, message: "Upstream request failed" };
  })();

  inflight.set(url, p);
  try {
    return await p;
  } finally {
    inflight.delete(url);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST is supported for this proxy
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const API_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!API_KEY) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body safely
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params } = body ?? {};
    console.log(`Manga proxy request: action=${action}`, params);

    const headers = {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "mangaverse-api.p.rapidapi.com",
    };

    let endpoint = '';
    const queryParams = new URLSearchParams();

    switch (action) {
      case 'fetch':
        endpoint = '/manga/fetch';
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.genres) queryParams.set('genres', params.genres);
        queryParams.set('nsfw', (params?.nsfw || false).toString());
        queryParams.set('type', params?.type || 'all');
        break;
      case 'latest':
        endpoint = '/manga/latest';
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.genres) queryParams.set('genres', params.genres);
        queryParams.set('nsfw', (params?.nsfw || false).toString());
        queryParams.set('type', params?.type || 'all');
        break;
      case 'search':
        endpoint = '/manga/search';
        queryParams.set('text', params?.text || '');
        queryParams.set('nsfw', (params?.nsfw || false).toString());
        queryParams.set('type', params?.type || 'all');
        break;
      case 'getManga':
        endpoint = '/manga';
        if (!params?.id) {
          return new Response(JSON.stringify({ error: 'Missing id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        queryParams.set('id', params.id);
        break;
      case 'fetchChapters':
        endpoint = '/manga/chapter';
        if (!params?.id) {
          return new Response(JSON.stringify({ error: 'Missing id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        queryParams.set('id', params.id);
        break;
      case 'fetchChapterImages':
        endpoint = '/manga/image';
        if (!params?.id) {
          return new Response(JSON.stringify({ error: 'Missing id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        queryParams.set('id', params.id);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
    console.log(`Fetching: ${url}`);

    try {
      const data = await fetchWithCache(url, headers);
      console.log(`Successfully fetched ${action}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      const status = e?.status || 502;
      const message = e?.message || 'Upstream error';

      // Preserve 429 so the client can fall back to cached DB data.
      console.error(`API error: ${status} ${message}`);
      return new Response(JSON.stringify({ error: `API error: ${message}` }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in manga-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
