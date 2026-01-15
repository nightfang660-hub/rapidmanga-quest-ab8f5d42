import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mangaApi } from "@/services/mangaApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Database, Clock, CheckCircle2, XCircle, Loader2, Play, Settings, Activity, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  manga_count: number;
  chapter_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
}

interface SyncSettings {
  id: string;
  cron_enabled: boolean;
  cron_interval_minutes: number;
  last_cron_run: string | null;
  updated_at: string;
}

interface CacheStats {
  totalManga: number;
  totalChapters: number;
  recentlyUpdated: number;
  enrichedManga: number;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  config: {
    api_key: boolean;
    supabase_url: boolean;
    supabase_service_key: boolean;
  };
  database: {
    manga_count: number;
    chapter_count: number;
  };
  sync: {
    cron_enabled: boolean;
    cron_interval_minutes: number;
    last_cron_run: string | null;
    last_sync_status: string;
    last_sync_time: string | null;
    last_sync_age_minutes: number | null;
  };
  recent_syncs: Array<{
    id: string;
    type: string;
    status: string;
    manga_count: number;
    chapter_count: number;
    started_at: string;
    completed_at: string;
    error: string | null;
  }>;
}

interface MangaDexHealth {
  status: string;
  timestamp: string;
  stats: {
    total_manga: number;
    enriched: number;
    pending: number;
    coverage: string;
  };
}

const Admin = () => {
  const queryClient = useQueryClient();
  const [syncingLatest, setSyncingLatest] = useState(false);
  const [enrichingBatch, setEnrichingBatch] = useState(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const cronEndpoint = `${SUPABASE_URL}/functions/v1/manga-sync`;

  // Fetch health status
  const { data: healthStatus, isLoading: loadingHealth, refetch: refetchHealth } = useQuery<HealthStatus>({
    queryKey: ["admin-health-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manga-sync", {
        body: { action: "health" },
      });
      if (error) throw error;
      return data as HealthStatus;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cache statistics with MangaDex enrichment count
  const { data: cacheStats, isLoading: loadingStats, refetch: refetchStats } = useQuery<CacheStats>({
    queryKey: ["admin-cache-stats"],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const [mangaResult, chaptersResult, recentResult, enrichedResult] = await Promise.all([
        supabase.from("mangas").select("id", { count: "exact", head: true }),
        supabase.from("chapters").select("id", { count: "exact", head: true }),
        supabase.from("mangas").select("id", { count: "exact", head: true }).gte("last_fetched_at", oneHourAgo),
        supabase.from("mangas").select("id", { count: "exact", head: true }).not("mangadex_id", "is", null),
      ]);

      return {
        totalManga: mangaResult.count || 0,
        totalChapters: chaptersResult.count || 0,
        recentlyUpdated: recentResult.count || 0,
        enrichedManga: enrichedResult.count || 0,
      };
    },
  });

  // Fetch MangaDex sync health
  const { data: mangadexHealth, isLoading: loadingMangadex, refetch: refetchMangadex } = useQuery<MangaDexHealth>({
    queryKey: ["admin-mangadex-health"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("mangadex-sync", {
        body: { action: "health" },
      });
      if (error) throw error;
      return data as MangaDexHealth;
    },
  });

  // Fetch sync logs
  const { data: syncLogs, isLoading: loadingLogs } = useQuery<SyncLog[]>({
    queryKey: ["admin-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Fetch sync settings
  const { data: syncSettings, isLoading: loadingSettings } = useQuery<SyncSettings>({
    queryKey: ["admin-sync-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_settings")
        .select("*")
        .eq("id", "default")
        .single();

      if (error) throw error;
      return data as SyncSettings;
    },
  });

  // Update sync settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("sync_settings")
        .update({ 
          cron_enabled: enabled, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", "default");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sync-settings"] });
      toast.success("Sync settings updated");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Manual sync mutation
  const syncLatestMutation = useMutation({
    mutationFn: async () => {
      setSyncingLatest(true);
      const result = await mangaApi.syncLatestManga(1);
      return result;
    },
    onSuccess: (data) => {
      setSyncingLatest(false);
      queryClient.invalidateQueries({ queryKey: ["admin-cache-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
      toast.success(`Synced ${data.synced} manga successfully`);
    },
    onError: (error) => {
      setSyncingLatest(false);
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  // Trigger cron sync
  const triggerCronMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manga-sync", {
        body: { action: "cronSync" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cache-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sync-settings"] });
      toast.success(`Cron sync completed: ${data.synced} manga synced`);
    },
    onError: (error) => {
      toast.error(`Cron sync failed: ${error.message}`);
    },
  });

  // MangaDex batch enrichment mutation
  const enrichBatchMutation = useMutation({
    mutationFn: async () => {
      setEnrichingBatch(true);
      const { data, error } = await supabase.functions.invoke("mangadex-sync", {
        body: { action: "enrichBatch", params: { limit: 20 } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setEnrichingBatch(false);
      queryClient.invalidateQueries({ queryKey: ["admin-cache-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-mangadex-health"] });
      refetchStats();
      refetchMangadex();
      toast.success(`MangaDex enrichment: ${data.matched}/${data.processed} matched`);
    },
    onError: (error) => {
      setEnrichingBatch(false);
      toast.error(`MangaDex enrichment failed: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage manga sync, health status, and automation</p>
        </div>
        <Button variant="outline" onClick={() => refetchHealth()} disabled={loadingHealth}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingHealth ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Health Status Banner */}
      {healthStatus && (
        <Alert variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
          {healthStatus.status === 'healthy' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle className="flex items-center gap-2">
            System Status: {healthStatus.status.toUpperCase()}
          </AlertTitle>
          <AlertDescription>
            Last sync: {healthStatus.sync.last_sync_time 
              ? formatDistanceToNow(new Date(healthStatus.sync.last_sync_time), { addSuffix: true })
              : 'Never'
            }
            {healthStatus.sync.last_sync_age_minutes !== null && (
              <span> ({healthStatus.sync.last_sync_age_minutes} minutes ago)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync Controls</TabsTrigger>
          <TabsTrigger value="mangadex">MangaDex Enrichment</TabsTrigger>
          <TabsTrigger value="cron">External Cron Setup</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Cache Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cached Manga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? "..." : cacheStats?.totalManga || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total manga in database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cached Chapters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? "..." : cacheStats?.totalChapters || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total chapters in database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recently Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? "..." : cacheStats?.recentlyUpdated || 0}
                </div>
                <p className="text-xs text-muted-foreground">Updated in last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Config Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {healthStatus?.config.api_key ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span>API Key</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {healthStatus?.config.supabase_service_key ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span>Service Key</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          {/* Sync Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Manual Sync
                </CardTitle>
                <CardDescription>
                  Trigger a manual sync of the latest manga from the API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => syncLatestMutation.mutate()}
                  disabled={syncingLatest}
                  className="w-full"
                >
                  {syncingLatest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Latest Manga
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Scheduled Sync
                </CardTitle>
                <CardDescription>
                  Configure automatic syncing every hour
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cron-enabled" className="flex flex-col gap-1">
                    <span>Enable Hourly Sync</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Automatically sync manga every hour
                    </span>
                  </Label>
                  <Switch
                    id="cron-enabled"
                    checked={syncSettings?.cron_enabled || false}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate(checked)}
                    disabled={loadingSettings}
                  />
                </div>
                
                {syncSettings?.last_cron_run && (
                  <p className="text-sm text-muted-foreground">
                    Last cron run: {formatDistanceToNow(new Date(syncSettings.last_cron_run), { addSuffix: true })}
                  </p>
                )}

                <Button
                  variant="outline"
                  onClick={() => triggerCronMutation.mutate()}
                  disabled={triggerCronMutation.isPending}
                  className="w-full"
                >
                  {triggerCronMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Trigger Cron Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mangadex" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  MangaDex Metadata Enrichment
                </CardTitle>
                <CardDescription>
                  Enrich manga with metadata from MangaDex (authors, tags, alt titles)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Enriched:</span>
                    <span className="ml-2 font-medium">{mangadexHealth?.stats.enriched || cacheStats?.enrichedManga || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="ml-2 font-medium">{mangadexHealth?.stats.pending || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coverage:</span>
                    <span className="ml-2 font-medium">{mangadexHealth?.stats.coverage || '0%'}</span>
                  </div>
                </div>
                <Button
                  onClick={() => enrichBatchMutation.mutate()}
                  disabled={enrichingBatch}
                  className="w-full"
                >
                  {enrichingBatch ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Enrich Next 20 Manga
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>MangaVerse</strong> = Content provider (chapters, images)</p>
                <p><strong>MangaDex</strong> = Metadata provider (authors, tags, descriptions)</p>
                <p>Manga is matched by normalized title comparison with 60%+ similarity threshold.</p>
                <p>Enrichment happens automatically when new manga is synced, or manually here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cron" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                External Cron Setup
              </CardTitle>
              <CardDescription>
                Lovable Cloud doesn't have native pg_cron. Use an external scheduler to trigger syncs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">Option 1: cron-job.org (Free)</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">cron-job.org</a> and create a free account</li>
                  <li>Create a new cron job with these settings:</li>
                </ol>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">URL (POST)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                        {cronEndpoint}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(cronEndpoint)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-background p-2 rounded border">
                        {`{"action": "cronSync"}`}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard('{"action": "cronSync"}')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Headers</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-background p-2 rounded border">
                        Content-Type: application/json
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard('Content-Type: application/json')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Schedule</Label>
                    <p className="text-xs text-muted-foreground mt-1">Every hour: <code className="bg-background px-1 rounded">0 * * * *</code></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Option 2: GitHub Actions (Free)</h4>
                <p className="text-sm text-muted-foreground">Add this workflow to your GitHub repo:</p>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto">{`# .github/workflows/manga-sync.yml
name: Manga Sync
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST "${cronEndpoint}" \\
            -H "Content-Type: application/json" \\
            -d '{"action": "cronSync"}'`}</pre>
                </div>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertTitle>Health Endpoint</AlertTitle>
                <AlertDescription>
                  Monitor your sync status at: <code className="text-xs bg-muted px-1 rounded">{cronEndpoint}</code> with <code className="text-xs bg-muted px-1 rounded">{`{"action": "health"}`}</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Sync History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync History
              </CardTitle>
              <CardDescription>Recent sync operations</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : syncLogs && syncLogs.length > 0 ? (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{log.sync_type}</span>
                            {getStatusBadge(log.status)}
                            <Badge variant="outline" className="text-xs">
                              {log.triggered_by}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                            {log.manga_count > 0 && ` • ${log.manga_count} manga`}
                            {log.chapter_count > 0 && ` • ${log.chapter_count} chapters`}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No sync history yet. Run a sync to see logs here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;