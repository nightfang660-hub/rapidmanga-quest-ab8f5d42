-- Allow Hosts to DELETE their own rooms (Fixes "End Party" button)
CREATE POLICY "Hosts can delete their rooms" ON public.reading_rooms
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (auth.uid() = host_id);