import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('RAPIDAPI_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for write access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, params } = await req.json();
    console.log(`Manga sync request: action=${action}`, params);

    const apiHeaders = {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "mangaverse-api.p.rapidapi.com",
    };

    switch (action) {
      case 'syncLatest': {
        // Fetch latest manga from API
        const page = params?.page || 1;
        const url = `${API_BASE_URL}/manga/latest?page=${page}&nsfw=false&type=all`;
        const response = await fetch(url, { headers: apiHeaders });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const mangaList = data.data || [];
        let synced = 0;

        for (const manga of mangaList) {
          // Upsert manga into database
          const { error: mangaError } = await supabase
            .from('mangas')
            .upsert({
              api_id: manga.id,
              title: manga.title,
              description: manga.summary || null,
              cover_url: manga.thumb || null,
              status: manga.status || null,
              last_fetched_at: new Date().toISOString(),
            }, { onConflict: 'api_id' });

          if (mangaError) {
            console.error(`Error upserting manga ${manga.id}:`, mangaError);
            continue;
          }
          synced++;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          total: mangaList.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'syncMangaChapters': {
        const mangaApiId = params?.mangaId;
        if (!mangaApiId) {
          return new Response(JSON.stringify({ error: 'mangaId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get manga from database
        const { data: mangaData, error: mangaFetchError } = await supabase
          .from('mangas')
          .select('id')
          .eq('api_id', mangaApiId)
          .single();

        let mangaUuid = mangaData?.id;

        // If manga not in DB, fetch and insert it first
        if (!mangaUuid) {
          const mangaUrl = `${API_BASE_URL}/manga?id=${mangaApiId}`;
          const mangaResponse = await fetch(mangaUrl, { headers: apiHeaders });
          
          if (!mangaResponse.ok) {
            throw new Error(`Failed to fetch manga: ${mangaResponse.statusText}`);
          }

          const mangaInfo = await mangaResponse.json();
          const manga = mangaInfo.data;

          const { data: insertedManga, error: insertError } = await supabase
            .from('mangas')
            .upsert({
              api_id: manga.id,
              title: manga.title,
              description: manga.summary || null,
              cover_url: manga.thumb || null,
              status: manga.status || null,
              last_fetched_at: new Date().toISOString(),
            }, { onConflict: 'api_id' })
            .select('id')
            .single();

          if (insertError) {
            throw new Error(`Failed to insert manga: ${insertError.message}`);
          }
          mangaUuid = insertedManga.id;
        }

        // Fetch chapters from API
        const chaptersUrl = `${API_BASE_URL}/manga/chapter?id=${mangaApiId}`;
        const chaptersResponse = await fetch(chaptersUrl, { headers: apiHeaders });
        
        if (!chaptersResponse.ok) {
          throw new Error(`Failed to fetch chapters: ${chaptersResponse.statusText}`);
        }

        const chaptersData = await chaptersResponse.json();
        const chapters = chaptersData.data || [];
        let syncedChapters = 0;

        for (const chapter of chapters) {
          const chapterNumber = parseFloat(chapter.chapterNumber || chapter.chapter || '0');
          
          const { error: chapterError } = await supabase
            .from('chapters')
            .upsert({
              manga_id: mangaUuid,
              api_id: chapter.id,
              chapter_number: chapterNumber,
              title: chapter.title || `Chapter ${chapterNumber}`,
              release_date: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : null,
            }, { onConflict: 'api_id' });

          if (chapterError) {
            console.error(`Error upserting chapter ${chapter.id}:`, chapterError);
            continue;
          }
          syncedChapters++;
        }

        // Update manga's latest chapter number
        if (chapters.length > 0) {
          const latestChapterNum = Math.max(...chapters.map((c: any) => 
            parseFloat(c.chapterNumber || c.chapter || '0')
          ));
          
          await supabase
            .from('mangas')
            .update({ 
              latest_chapter_number: latestChapterNum,
              last_fetched_at: new Date().toISOString()
            })
            .eq('id', mangaUuid);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          mangaId: mangaUuid,
          syncedChapters,
          totalChapters: chapters.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'syncChapterImages': {
        const chapterApiId = params?.chapterId;
        if (!chapterApiId) {
          return new Response(JSON.stringify({ error: 'chapterId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch images from API
        const imagesUrl = `${API_BASE_URL}/manga/image?id=${chapterApiId}`;
        const imagesResponse = await fetch(imagesUrl, { headers: apiHeaders });
        
        if (!imagesResponse.ok) {
          throw new Error(`Failed to fetch images: ${imagesResponse.statusText}`);
        }

        const imagesData = await imagesResponse.json();
        const images = imagesData.data || [];

        // Update chapter with pages
        const { error: updateError } = await supabase
          .from('chapters')
          .update({ pages: images })
          .eq('api_id', chapterApiId);

        if (updateError) {
          throw new Error(`Failed to update chapter images: ${updateError.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          chapterId: chapterApiId,
          pagesCount: images.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in manga-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
