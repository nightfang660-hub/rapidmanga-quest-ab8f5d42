-- Fix security issues and add chat features

-- 1. Make username column UNIQUE (it should already exist, just add constraint)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Fix profiles table RLS - restrict to authenticated users only (instead of public)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Fix manga_reviews RLS - restrict to authenticated users
DROP POLICY IF EXISTS "Users can view all reviews" ON public.manga_reviews;
CREATE POLICY "Authenticated users can view reviews" 
ON public.manga_reviews 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Fix notifications INSERT policy - require user_id matches related_user_id target
DROP POLICY IF EXISTS "Users can insert notifications for related actions" ON public.notifications;
CREATE POLICY "Users can insert notifications for their own actions" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = related_user_id AND user_id IS NOT NULL);

-- 5. Add message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their messages"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can remove own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Add typing status table (for typing indicators)
CREATE TABLE public.typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_partner_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chat_partner_id)
);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status for their chats"
ON public.typing_status
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = chat_partner_id);

CREATE POLICY "Users can update own typing status"
ON public.typing_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update typing status"
ON public.typing_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own typing status"
ON public.typing_status
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"messages": true, "follows": true, "recommendations": true}'::jsonb;

-- 8. Add reading preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_preferences JSONB DEFAULT '{"readingDirection": "ltr", "pageMode": "single", "autoNextChapter": true}'::jsonb;

-- 9. Enable realtime for typing_status and message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;