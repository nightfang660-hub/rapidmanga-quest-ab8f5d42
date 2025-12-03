import { useState } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSearch } from "@/hooks/useUserSearch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";

interface SearchWithTabsProps {
  onMangaSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchWithTabs = ({ onMangaSearch, placeholder = "Search..." }: SearchWithTabsProps) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"manga" | "accounts">("manga");
  const { results, isSearching, searchUsers, clearResults } = useUserSearch();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (searchType === "manga") {
      onMangaSearch(query.trim());
      setQuery("");
    } else {
      searchUsers(query.trim());
    }
  };

  const handleTabChange = (value: string) => {
    setSearchType(value as "manga" | "accounts");
    clearResults();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <Tabs value={searchType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2">
          <TabsTrigger value="manga" className="text-xs sm:text-sm">
            <Search className="h-4 w-4 mr-1" />
            Manga
          </TabsTrigger>
          <TabsTrigger value="accounts" className="text-xs sm:text-sm">
            <User className="h-4 w-4 mr-1" />
            Accounts
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={searchType === "manga" ? "Search manga..." : "Search users..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "..." : "Search"}
        </Button>
      </form>

      {searchType === "accounts" && results.length > 0 && (
        <div className="bg-card border rounded-lg shadow-lg divide-y">
          {results.map((user) => {
            const displayName = user.display_name || user.username || "User";
            const initials = displayName.slice(0, 2).toUpperCase();
            
            return (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ""} alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.total_manga_read || 0} manga
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
