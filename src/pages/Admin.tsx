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
import { RefreshCw, Database, Clock, CheckCircle2, XCircle, Loader2, Play, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
}

const Admin = () => {
  const queryClient = useQueryClient();
  const [syncingLatest, setSyncingLatest] = useState(false);

  // Fetch cache statistics
  const { data: cacheStats, isLoading: loadingStats } = useQuery<CacheStats>({
    queryKey: ["admin-cache-stats"],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const [mangaResult, chaptersResult, recentResult] = await Promise.all([
        supabase.from("mangas").select("id", { count: "exact", head: true }),
        supabase.from("chapters").select("id", { count: "exact", head: true }),
        supabase.from("mangas").select("id", { count: "exact", head: true }).gte("last_fetched_at", oneHourAgo),
      ]);

      return {
        totalManga: mangaResult.count || 0,
        totalChapters: chaptersResult.count || 0,
        recentlyUpdated: recentResult.count || 0,
      };
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage manga sync and cache status</p>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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
    </div>
  );
};

export default Admin;