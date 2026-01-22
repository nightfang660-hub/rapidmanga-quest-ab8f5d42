-- 1. Create the Chat Messages Table
CREATE TABLE IF NOT EXISTS public.party_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT party_messages_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES reading_rooms (id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;

-- 3. Security Rule: SEND Messages (Authenticated users only, own messages)
CREATE POLICY "Users can send messages" 
ON public.party_messages
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Security Rule: READ Messages (Only if you are a participant in the room)
CREATE POLICY "Participants can read messages" 
ON public.party_messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.room_participants
        WHERE room_id = party_messages.room_id
        AND user_id = auth.uid()
    )
);

-- 5. Enable Realtime (CRITICAL for Chat to work live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_messages;