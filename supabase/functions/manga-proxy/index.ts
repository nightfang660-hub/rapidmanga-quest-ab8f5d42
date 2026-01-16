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
    const API_HOST = "mangaverse-api.p.rapidapi.com";
    
    if (!API_KEY) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params } = await req.json();
    console.log(`Manga proxy request: action=${action}`, params);

    const headers = {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    };

    // Handle image proxy with long cache
    if (action === 'proxyImage') {
      if (!params?.id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const infoUrl = `${API_BASE_URL}/manga?id=${params.id}`;
      const infoRes = await fetch(infoUrl, { headers });
      if (!infoRes.ok) throw new Error('Failed to fetch manga info');
      const infoData = await infoRes.json();
      const signedUrl = infoData.data?.thumb;
      if (!signedUrl) {
        return new Response(JSON.stringify({ error: 'Image not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      const imageRes = await fetch(signedUrl);
      if (!imageRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch image' }), { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      return new Response(imageRes.body, { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg',
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
        if (params.genres) queryParams.set('genres', params.genres);
        queryParams.set('nsfw', (params.nsfw || false).toString());
        queryParams.set('type', params.type || 'all');
        break;
      case 'search':
        endpoint = '/manga/search';
        queryParams.set('text', params.text || '');
        queryParams.set('nsfw', (params.nsfw || false).toString());
        queryParams.set('type', params.type || 'all');
        break;
      case 'getManga':
        endpoint = '/manga';
        queryParams.set('id', params.id);
        break;
      case 'fetchChapters':
        endpoint = '/manga/chapter';
        queryParams.set('id', params.id);
        break;
      case 'fetchChapterImages':
        endpoint = '/manga/image';
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

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      let errorMessage = `API error: ${response.statusText}`;
      if (response.status === 401 || response.status === 403) errorMessage = "Invalid API Key";
      if (response.status === 429) errorMessage = "Rate Limited - please try again later";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Successfully fetched ${action}`);

    // Cache responses: 10 min browser, 1 hr CDN to reduce API calls
    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=3600'
      },
    });
  } catch (error) {
    console.error('Error in manga-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
