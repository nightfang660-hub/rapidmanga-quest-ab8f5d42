-- Create storage bucket for chat backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-backgrounds', 'chat-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to view any chat background
CREATE POLICY "Public chat backgrounds" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-backgrounds');

-- Create policy for users to upload their own chat backgrounds
CREATE POLICY "Users can upload own chat backgrounds" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own chat backgrounds
CREATE POLICY "Users can delete own chat backgrounds" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add chat_background_url column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS chat_background_url TEXT;