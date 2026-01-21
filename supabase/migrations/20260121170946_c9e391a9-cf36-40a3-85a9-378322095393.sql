-- 1. Create the Reading Rooms Table
CREATE TABLE IF NOT EXISTS public.reading_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL,
    manga_id TEXT NOT NULL,
    manga_title TEXT,
    manga_cover TEXT,
    current_chapter_id TEXT,
    current_page_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    mode TEXT DEFAULT 'free' CHECK (mode IN ('leader', 'free')),
    code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Participants Table
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- 3. Enable Security Policies (RLS)
ALTER TABLE public.reading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms viewable" ON public.reading_rooms FOR SELECT USING (true);
CREATE POLICY "Hosts create rooms" ON public.reading_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts update rooms" ON public.reading_rooms FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Participants viewable" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Users join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave or kick" ON public.room_participants FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.reading_rooms WHERE id = room_participants.room_id AND host_id = auth.uid())
);

-- 4. Enable Realtime Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;