import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useChatBackground = () => {
  const { user } = useAuth();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBackground();
    }
  }, [user]);

  const loadBackground = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("chat_background_url")
      .eq("id", user.id)
      .single();

    if (data?.chat_background_url) {
      setBackgroundUrl(data.chat_background_url);
    }
  };

  const uploadBackground = async (file: File) => {
    if (!user) return false;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-backgrounds")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-backgrounds")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ chat_background_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setBackgroundUrl(publicUrl);
      toast.success("Chat background updated!");
      return true;
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error("Failed to upload background");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const removeBackground = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ chat_background_url: null })
        .eq("id", user.id);

      if (error) throw error;

      setBackgroundUrl(null);
      toast.success("Chat background removed");
      return true;
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background");
      return false;
    }
  };

  return {
    backgroundUrl,
    isUploading,
    uploadBackground,
    removeBackground,
  };
};