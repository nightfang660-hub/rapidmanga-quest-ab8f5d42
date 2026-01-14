-- Create sync_logs table to track sync history
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'latest', 'chapters', 'images'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  manga_count INTEGER DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  triggered_by TEXT DEFAULT 'manual' -- 'manual', 'cron', 'background'
);

-- Create sync_settings table for cron configuration
CREATE TABLE IF NOT EXISTS public.sync_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  cron_enabled BOOLEAN DEFAULT false,
  cron_interval_minutes INTEGER DEFAULT 60,
  last_cron_run TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.sync_settings (id, cron_enabled, cron_interval_minutes)
VALUES ('default', false, 60)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sync logs and settings
CREATE POLICY "Authenticated users can read sync logs"
  ON public.sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read sync settings"
  ON public.sync_settings FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update sync settings (for admin purposes)
CREATE POLICY "Authenticated users can update sync settings"
  ON public.sync_settings FOR UPDATE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);