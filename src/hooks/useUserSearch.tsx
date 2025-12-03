import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_manga_read: number | null;
}

export const useUserSearch = () => {
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, total_manga_read")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      console.error("Error searching users:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => setResults([]);

  return {
    results,
    isSearching,
    searchUsers,
    clearResults,
  };
};
