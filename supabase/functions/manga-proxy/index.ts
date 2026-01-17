// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('RAPIDAPI_KEY');
    const API_HOST = Deno.env.get('RAPIDAPI_HOST') || "mangaverse-api.p.rapidapi.com";

    if (!API_KEY) {
      console.error('RAPIDAPI_KEY is missing in Secrets');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let action: string | null = null;
    let params: Record<string, string> = {};

    if (req.method === 'GET') {
      const url = new URL(req.url);
      action = url.searchParams.get('action');
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'action') params[key] = value;
      }
    } else {
      try {
        const text = await req.text();
        if (text && text.length > 0) {
          const body = JSON.parse(text);
          action = body.action;
          params = body.params || {};
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Manga proxy request: action=${action}`, params);

    const headers = {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    };

    if (action === 'proxyImage') {
      if (!params.id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
      
      const infoUrl = `${API_BASE_URL}/manga?id=${params.id}`;
      const infoRes = await fetch(infoUrl, { headers });
      if (!infoRes.ok) throw new Error('Failed to fetch manga info');
      const infoData = await infoRes.json();
      const signedUrl = infoData.data?.thumb;

      if (!signedUrl) return new Response('Image not found', { status: 404, headers: corsHeaders });

      const imageRes = await fetch(signedUrl);
      if (!imageRes.ok) return new Response('Failed to fetch image', { status: 502, headers: corsHeaders });

      return new Response(imageRes.body, { 
        headers: { 
            ...corsHeaders, 
            'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        } 
      });
    }

    if (action === 'dexImage') {
        if (!params.url) {
            return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: corsHeaders });
        }
        // Fetch from MangaDex with correct Referer
        const imgRes = await fetch(params.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://mangadex.org"
            }
        });

        if (!imgRes.ok) {
            return new Response('Failed to fetch Dexter image', { status: 502, headers: corsHeaders });
        }
        
        return new Response(imgRes.body, {
            headers: {
                ...corsHeaders,
                'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400'
            }
        });
    }

    let endpoint = '';
    const queryParams = new URLSearchParams();

    switch (action) {
      case 'fetch':
        endpoint = '/manga/fetch';
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.genres) queryParams.set('genres', params.genres);
        queryParams.set('nsfw', (params.nsfw || false).toString());
        queryParams.set('type', params.type || 'all');
        break;
      case 'latest':
        endpoint = '/manga/latest';
        if (params.page) queryParams.set('page', params.page.toString());
        queryParams.set('nsfw', (params.nsfw || false).toString());
        queryParams.set('type', params.type || 'all');
        break;
      case 'search':
        endpoint = '/manga/search';
        queryParams.set('text', params.text || '');
        queryParams.set('nsfw', (params.nsfw || false).toString());
        break;
      case 'getManga':
        endpoint = '/manga';
        if (params.id) queryParams.set('id', params.id);
        break;
      case 'fetchChapters':
        endpoint = '/manga/chapter';
        if (params.id) queryParams.set('id', params.id);
        break;
      case 'fetchChapterImages':
        endpoint = '/manga/image';
        if (params.id) queryParams.set('id', params.id);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`Upstream API Error: ${response.status} ${response.statusText}`);
      let errorMessage = `API error: ${response.statusText}`;
      if (response.status === 401 || response.status === 403) errorMessage = "Invalid API Key";
      if (response.status === 429) errorMessage = "Rate Limited";

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Cache: 10 mins Browser, 1 hr CDN
    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=3600'
      },
    });
  } catch (error) {
    console.error('Error in manga-proxy:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
