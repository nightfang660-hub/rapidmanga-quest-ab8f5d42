import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MANGADEX_API = "https://api.mangadex.org";

// Title normalization function (mirrors DB function)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two normalized titles
function calculateSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.split(' ').filter(w => w.length > 1));
  const words2 = new Set(title2.split(' ').filter(w => w.length > 1));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

// Search MangaDex for a manga by title
async function searchMangaDex(title: string): Promise<any | null> {
  const normalizedSearch = normalizeTitle(title);
  
  try {
    const params = new URLSearchParams({
      title: title,
      limit: '10',
      includes: 'author,artist,cover_art',
      order: 'relevance:desc',
    } as Record<string, string>);

    const response = await fetch(`${MANGADEX_API}/manga?${params}`, {
      headers: {
        'User-Agent': 'RapidMangaQuest/1.0 (contact@rapidmanga.app)',
      },
    });

    if (!response.ok) {
      console.error(`MangaDex search error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log(`No MangaDex results for: ${title}`);
      return null;
    }

    // Find best match using title similarity
    let bestMatch = null;
    let bestScore = 0;

    for (const manga of data.data) {
      const attributes = manga.attributes;
      
      // Check all available titles
      const titlesToCheck = [
        attributes.title?.en,
        attributes.title?.ja,
        attributes.title?.['ja-ro'],
        ...(attributes.altTitles || []).map((t: Record<string, string>) => Object.values(t)[0]),
      ].filter(Boolean);

      for (const candidateTitle of titlesToCheck) {
        const normalizedCandidate = normalizeTitle(candidateTitle);
        const similarity = calculateSimilarity(normalizedSearch, normalizedCandidate);
        
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = manga;
        }
      }
    }

    // Require at least 60% similarity for a match
    if (bestScore >= 0.6) {
      console.log(`Found MangaDex match for "${title}" with score ${bestScore.toFixed(2)}`);
      return bestMatch;
    }

    console.log(`No confident match for "${title}" (best score: ${bestScore.toFixed(2)})`);
    return null;
  } catch (error) {
    console.error('MangaDex search error:', error);
    return null;
  }
}

// Extract metadata from MangaDex manga object
function extractMetadata(mangadexManga: any): Record<string, any> {
  const attributes = mangadexManga.attributes;
  const relationships = mangadexManga.relationships || [];

  // Extract authors and artists
  const authors = relationships
    .filter((r: any) => r.type === 'author')
    .map((r: any) => r.attributes?.name || r.id);
  
  const artists = relationships
    .filter((r: any) => r.type === 'artist')
    .map((r: any) => r.attributes?.name || r.id);

  // Extract tags
  const tags = (attributes.tags || []).map((tag: any) => ({
    id: tag.id,
    name: tag.attributes?.name?.en || tag.attributes?.name?.ja || 'Unknown',
    group: tag.attributes?.group || 'unknown',
  }));

  // Extract alt titles
  const altTitles = (attributes.altTitles || []).map((t: Record<string, string>) => {
    const lang = Object.keys(t)[0];
    return { lang, title: t[lang] };
  });

  // Get description (prefer English)
  const description = attributes.description?.en || 
                      attributes.description?.ja ||
                      Object.values(attributes.description || {})[0] || null;

  return {
    mangadex_id: mangadexManga.id,
    alt_titles: altTitles,
    authors: authors,
    artists: artists,
    tags: tags,
    original_language: attributes.originalLanguage || null,
    publication_demographic: attributes.publicationDemographic || null,
    content_rating: attributes.contentRating || null,
    mangadex_description: description,
    mangadex_last_synced_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    let action = 'enrichSingle';
    let params: any = {};

    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action || 'enrichSingle';
      params = body.params || {};
    }

    // Handle URL query params
    const url = new URL(req.url);
    if (url.searchParams.get('action')) {
      action = url.searchParams.get('action')!;
    }

    console.log(`MangaDex sync: action=${action}`, params);

    switch (action) {
      case 'enrichSingle': {
        // Enrich a single manga by its internal ID or api_id
        const mangaId = params.mangaId;
        const apiId = params.apiId;
        
        if (!mangaId && !apiId) {
          return new Response(JSON.stringify({ error: 'mangaId or apiId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get manga from database
        let query = supabase.from('mangas').select('*');
        if (mangaId) {
          query = query.eq('id', mangaId);
        } else {
          query = query.eq('api_id', apiId);
        }
        
        const { data: manga, error: fetchError } = await query.single();

        if (fetchError || !manga) {
          return new Response(JSON.stringify({ error: 'Manga not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Skip if recently synced (within 24 hours)
        if (manga.mangadex_last_synced_at) {
          const lastSynced = new Date(manga.mangadex_last_synced_at).getTime();
          const hoursSinceSync = (Date.now() - lastSynced) / (1000 * 60 * 60);
          if (hoursSinceSync < 24) {
            return new Response(JSON.stringify({ 
              success: true, 
              skipped: true,
              reason: 'Recently synced',
              lastSynced: manga.mangadex_last_synced_at,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Search MangaDex
        const mangadexResult = await searchMangaDex(manga.title);
        
        if (!mangadexResult) {
          // Mark as synced even if no match to avoid repeated failed searches
          await supabase
            .from('mangas')
            .update({ mangadex_last_synced_at: new Date().toISOString() })
            .eq('id', manga.id);

          return new Response(JSON.stringify({ 
            success: true, 
            matched: false,
            reason: 'No match found on MangaDex',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract and update metadata
        const metadata = extractMetadata(mangadexResult);
        
        const { error: updateError } = await supabase
          .from('mangas')
          .update(metadata)
          .eq('id', manga.id);

        if (updateError) {
          throw new Error(`Failed to update manga: ${updateError.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          matched: true,
          mangadex_id: metadata.mangadex_id,
          metadata: {
            authors: metadata.authors,
            artists: metadata.artists,
            tags: metadata.tags.length,
            alt_titles: metadata.alt_titles.length,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'enrichBatch': {
        // Enrich multiple manga that haven't been synced yet
        const limit = params.limit || 20;
        const forceRefresh = params.forceRefresh || false;

        // Get manga needing enrichment
        let query = supabase
          .from('mangas')
          .select('id, title, api_id, mangadex_last_synced_at')
          .order('last_fetched_at', { ascending: false })
          .limit(limit);

        if (!forceRefresh) {
          query = query.or('mangadex_id.is.null,mangadex_last_synced_at.is.null');
        }

        const { data: mangaList, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(`Failed to fetch manga list: ${fetchError.message}`);
        }

        if (!mangaList || mangaList.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            processed: 0,
            message: 'No manga needing enrichment',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let matched = 0;
        let failed = 0;
        const results: any[] = [];

        for (const manga of mangaList) {
          try {
            // Rate limit: MangaDex allows 5 requests per second
            await new Promise(resolve => setTimeout(resolve, 250));

            const mangadexResult = await searchMangaDex(manga.title);
            
            if (mangadexResult) {
              const metadata = extractMetadata(mangadexResult);
              
              await supabase
                .from('mangas')
                .update(metadata)
                .eq('id', manga.id);

              matched++;
              results.push({ id: manga.id, title: manga.title, matched: true });
            } else {
              // Mark as synced to avoid retry
              await supabase
                .from('mangas')
                .update({ mangadex_last_synced_at: new Date().toISOString() })
                .eq('id', manga.id);

              results.push({ id: manga.id, title: manga.title, matched: false });
            }
          } catch (error) {
            console.error(`Error enriching ${manga.title}:`, error);
            failed++;
            results.push({ id: manga.id, title: manga.title, error: true });
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          processed: mangaList.length,
          matched,
          failed,
          results,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'health': {
        // Health check for MangaDex sync
        const { count: totalManga } = await supabase
          .from('mangas')
          .select('*', { count: 'exact', head: true });

        const { count: enrichedManga } = await supabase
          .from('mangas')
          .select('*', { count: 'exact', head: true })
          .not('mangadex_id', 'is', null);

        const { count: pendingEnrichment } = await supabase
          .from('mangas')
          .select('*', { count: 'exact', head: true })
          .is('mangadex_id', null)
          .is('mangadex_last_synced_at', null);

        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          stats: {
            total_manga: totalManga || 0,
            enriched: enrichedManga || 0,
            pending: pendingEnrichment || 0,
            coverage: totalManga ? ((enrichedManga || 0) / totalManga * 100).toFixed(1) + '%' : '0%',
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action', 
          available: ['enrichSingle', 'enrichBatch', 'health'] 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in mangadex-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});