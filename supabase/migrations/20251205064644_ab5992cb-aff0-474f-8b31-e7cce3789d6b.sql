-- Fix 1: Update handle_new_user function to use actual username instead of email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$;

-- Fix 2: Migrate existing email-based usernames to proper usernames
UPDATE profiles 
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username LIKE '%@%';

-- Fix 3: Drop the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Create a more restrictive notifications INSERT policy
-- Only allows creating notifications where the creator is the related_user_id
CREATE POLICY "Users can insert notifications for related actions"
ON notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = related_user_id
);