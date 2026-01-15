import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to trigger MangaDex metadata enrichment (non-blocking)
async function triggerMangaDexEnrichment(supabaseUrl: string, mangaApiId: string) {
  try {
    // Call the mangadex-sync function in background
    const response = await fetch(`${supabaseUrl}/functions/v1/mangadex-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        action: 'enrichSingle',
        params: { apiId: mangaApiId },
      }),
    });
    
    if (!response.ok) {
      console.log(`MangaDex enrichment triggered for ${mangaApiId} (status: ${response.status})`);
    }
  } catch (error) {
    // Non-blocking - log but don't throw
    console.log(`MangaDex enrichment failed for ${mangaApiId}:`, error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = "https://mangaverse-api.p.rapidapi.com";

// Helper to create sync log entry
async function createSyncLog(supabase: any, syncType: string, triggeredBy: string) {
  const { data, error } = await supabase
    .from('sync_logs')
    .insert({
      sync_type: syncType,
      status: 'running',
      triggered_by: triggeredBy,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create sync log:', error);
    return null;
  }
  return data.id;
}

// Helper to update sync log
async function updateSyncLog(supabase: any, logId: string, updates: any) {
  if (!logId) return;
  
  const { error } = await supabase
    .from('sync_logs')
    .update({
      ...updates,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
  
  if (error) {
    console.error('Failed to update sync log:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('RAPIDAPI_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Create Supabase client with service role for write access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request body - handle GET requests for health check
    let action = 'health';
    let params: any = {};
    
    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action || 'health';
      params = body.params || {};
    }
    
    // Handle URL query params for external cron services
    const url = new URL(req.url);
    if (url.searchParams.get('action')) {
      action = url.searchParams.get('action')!;
    }
    if (url.searchParams.get('secret')) {
      const cronSecret = Deno.env.get('CRON_SECRET');
      if (cronSecret && url.searchParams.get('secret') !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Invalid cron secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Manga sync request: action=${action}`, params);

    // Validate API key for actions that need external API
    const needsApiKey = ['cronSync', 'syncLatest', 'syncMangaChapters', 'syncChapterImages'].includes(action);
    if (needsApiKey && !API_KEY) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiHeaders: Record<string, string> = {
      "x-rapidapi-key": API_KEY || '',
      "x-rapidapi-host": "mangaverse-api.p.rapidapi.com",
    };

    switch (action) {
      case 'cronSync': {
        // Check if cron is enabled
        const { data: settings } = await supabase
          .from('sync_settings')
          .select('cron_enabled, cron_interval_minutes, last_cron_run')
          .eq('id', 'default')
          .single();

        // For manual cron trigger, we allow it even if cron_enabled is false
        // The settings check is mainly for automated scheduled runs
        
        const logId = await createSyncLog(supabase, 'latest', 'cron');

        try {
          // Fetch latest manga from API (first 2 pages for cron)
          let totalSynced = 0;
          
          for (let page = 1; page <= 2; page++) {
            const url = `${API_BASE_URL}/manga/latest?page=${page}&nsfw=false&type=all`;
            const response = await fetch(url, { headers: apiHeaders });
            
            if (!response.ok) {
              throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            const mangaList = data.data || [];

            for (const manga of mangaList) {
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

              if (!mangaError) totalSynced++;
            }
          }

          // Update last cron run time
          await supabase
            .from('sync_settings')
            .update({ 
              last_cron_run: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', 'default');

          await updateSyncLog(supabase, logId, {
            status: 'completed',
            manga_count: totalSynced,
          });

          return new Response(JSON.stringify({ 
            success: true, 
            synced: totalSynced,
            message: 'Cron sync completed'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateSyncLog(supabase, logId, {
            status: 'failed',
            error_message: errorMessage,
          });
          throw error;
        }
      }

      case 'syncLatest': {
        const page = params?.page || 1;
        const triggeredBy = params?.triggeredBy || 'manual';
        const logId = await createSyncLog(supabase, 'latest', triggeredBy);

        try {
          const url = `${API_BASE_URL}/manga/latest?page=${page}&nsfw=false&type=all`;
          const response = await fetch(url, { headers: apiHeaders });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const data = await response.json();
          const mangaList = data.data || [];
          let synced = 0;

          for (const manga of mangaList) {
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

            if (!mangaError) synced++;
          }

          await updateSyncLog(supabase, logId, {
            status: 'completed',
            manga_count: synced,
          });

          return new Response(JSON.stringify({ 
            success: true, 
            synced,
            total: mangaList.length 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateSyncLog(supabase, logId, {
            status: 'failed',
            error_message: errorMessage,
          });
          throw error;
        }
      }

      case 'syncMangaChapters': {
        const mangaApiId = params?.mangaId;
        if (!mangaApiId) {
          return new Response(JSON.stringify({ error: 'mangaId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const triggeredBy = params?.triggeredBy || 'background';
        const enrichWithMangaDex = params?.enrichWithMangaDex !== false; // Default true
        const logId = await createSyncLog(supabase, 'chapters', triggeredBy);

        try {
          // Get manga from database
          const { data: mangaData } = await supabase
            .from('mangas')
            .select('id, mangadex_id, mangadex_last_synced_at')
            .eq('api_id', mangaApiId)
            .single();

          let mangaUuid = mangaData?.id;
          let needsMangaDexEnrichment = false;

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
            needsMangaDexEnrichment = true;
          } else if (mangaData) {
            // Check if needs MangaDex enrichment
            needsMangaDexEnrichment = !mangaData.mangadex_id && !mangaData.mangadex_last_synced_at;
          }

          // Trigger MangaDex enrichment in background (non-blocking)
          if (enrichWithMangaDex && needsMangaDexEnrichment && SUPABASE_URL) {
            triggerMangaDexEnrichment(SUPABASE_URL, mangaApiId);
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

            if (!chapterError) syncedChapters++;
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

          await updateSyncLog(supabase, logId, {
            status: 'completed',
            manga_count: 1,
            chapter_count: syncedChapters,
          });

          return new Response(JSON.stringify({ 
            success: true, 
            mangaId: mangaUuid,
            syncedChapters,
            totalChapters: chapters.length,
            mangadexEnrichmentTriggered: needsMangaDexEnrichment,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateSyncLog(supabase, logId, {
            status: 'failed',
            error_message: errorMessage,
          });
          throw error;
        }
      }

      case 'syncChapterImages': {
        const chapterApiId = params?.chapterId;
        if (!chapterApiId) {
          return new Response(JSON.stringify({ error: 'chapterId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const triggeredBy = params?.triggeredBy || 'background';
        const logId = await createSyncLog(supabase, 'images', triggeredBy);

        try {
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

          await updateSyncLog(supabase, logId, {
            status: 'completed',
            chapter_count: 1,
          });

          return new Response(JSON.stringify({ 
            success: true, 
            chapterId: chapterApiId,
            pagesCount: images.length 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateSyncLog(supabase, logId, {
            status: 'failed',
            error_message: errorMessage,
          });
          throw error;
        }
      }

      case 'health': {
        // Health check endpoint for monitoring
        const configStatus = {
          api_key: !!API_KEY,
          supabase_url: !!SUPABASE_URL,
          supabase_service_key: !!SUPABASE_SERVICE_ROLE_KEY,
        };

        // Get sync statistics
        const { data: settings } = await supabase
          .from('sync_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        const { data: recentLogs } = await supabase
          .from('sync_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(5);

        const { count: mangaCount } = await supabase
          .from('mangas')
          .select('*', { count: 'exact', head: true });

        const { count: chapterCount } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true });

        // Calculate sync health
        const lastSync = recentLogs?.[0];
        const lastSyncAge = lastSync?.completed_at 
          ? Date.now() - new Date(lastSync.completed_at).getTime()
          : null;
        const isHealthy = lastSyncAge !== null && lastSyncAge < 2 * 60 * 60 * 1000; // 2 hours

        return new Response(JSON.stringify({
          status: isHealthy ? 'healthy' : 'warning',
          timestamp: new Date().toISOString(),
          config: configStatus,
          database: {
            manga_count: mangaCount || 0,
            chapter_count: chapterCount || 0,
          },
          sync: {
            cron_enabled: settings?.cron_enabled || false,
            cron_interval_minutes: settings?.cron_interval_minutes || 60,
            last_cron_run: settings?.last_cron_run || null,
            last_sync_status: lastSync?.status || 'never',
            last_sync_time: lastSync?.completed_at || null,
            last_sync_age_minutes: lastSyncAge ? Math.round(lastSyncAge / 60000) : null,
          },
          recent_syncs: recentLogs?.map(log => ({
            id: log.id,
            type: log.sync_type,
            status: log.status,
            manga_count: log.manga_count,
            chapter_count: log.chapter_count,
            started_at: log.started_at,
            completed_at: log.completed_at,
            error: log.error_message,
          })) || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action', available: ['health', 'cronSync', 'syncLatest', 'syncMangaChapters', 'syncChapterImages'] }), {
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
