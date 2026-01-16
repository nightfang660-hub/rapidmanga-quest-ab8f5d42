import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { action, params } = await req.json();
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
      return new Response(JSON.stringify({ error: `API error: ${response.statusText}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log(`Successfully fetched ${action}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
