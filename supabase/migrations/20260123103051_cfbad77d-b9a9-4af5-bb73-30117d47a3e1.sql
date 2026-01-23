-- Trigger: Auto-delete room when Host leaves
-- If the user leaving (deleted from room_participants) is the Host of that room, destroy the room.

CREATE OR REPLACE FUNCTION public.delete_room_if_host_leaves()
RETURNS TRIGGER AS $$
DECLARE
    is_host BOOLEAN;
BEGIN
    -- Check if the user leaving is the host of the room
    SELECT EXISTS (
        SELECT 1
        FROM public.reading_rooms
        WHERE id = OLD.room_id
        AND host_id = OLD.user_id
    ) INTO is_host;

    IF is_host THEN
        -- Delete the room (Cascade will handle participants/messages)
        DELETE FROM public.reading_rooms WHERE id = OLD.room_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists to avoid conflicts during dev iterations
DROP TRIGGER IF EXISTS check_host_left ON public.room_participants;

-- Create trigger that fires when a participant is deleted
CREATE TRIGGER check_host_left
AFTER DELETE ON public.room_participants
FOR EACH ROW
EXECUTE FUNCTION public.delete_room_if_host_leaves();