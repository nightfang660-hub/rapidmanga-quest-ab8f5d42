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
    
    // Debug: Log if API key exists (not the value)
    console.log(`API Key configured: ${!!API_KEY}, Length: ${API_KEY?.length || 0}`);
    
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
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": "mangaverse-api.p.rapidapi.com",
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
    
    // Debug: Log full response status
    console.log(`RapidAPI response: status=${response.status}, statusText=${response.statusText}`);
    
    if (!response.ok) {
      // Provide specific error messages for different status codes
      let errorMessage = `API error: ${response.statusText}`;
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API Key - Please verify your RAPIDAPI_KEY is correct and you are subscribed to the MangaVerse API';
        console.error(`AUTH ERROR (${response.status}): ${errorMessage}`);
      } else if (response.status === 429) {
        errorMessage = 'Rate Limited by RapidAPI - You have exceeded your API quota';
        console.error(`RATE LIMIT (429): ${errorMessage}`);
      } else {
        console.error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Try to get response body for more details
      try {
        const errorBody = await response.text();
        console.error(`Error body: ${errorBody}`);
      } catch (e) {
        // Ignore if we can't read body
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        status: response.status 
      }), {
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
