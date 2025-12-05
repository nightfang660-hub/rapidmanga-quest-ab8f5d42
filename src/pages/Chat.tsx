import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useAuth } from "@/hooks/useAuth";
import { useChatBackground } from "@/hooks/useChatBackground";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Search, MessageCircle, ImagePlus, X } from "lucide-react";
import { format } from "date-fns";

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, messages, isLoading, loadMessages, sendMessage } = useChat();
  const { results, searchUsers, clearResults } = useUserSearch();
  const { backgroundUrl, isUploading, uploadBackground, removeBackground } = useChatBackground();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partnerId = searchParams.get("user");

  useEffect(() => {
    if (partnerId) {
      loadChatPartner(partnerId);
      loadMessages(partnerId);
    }
  }, [partnerId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatPartner = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", userId)
      .single();
    
    if (data) {
      setSelectedUser(data);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchUsers(query);
    } else {
      clearResults();
    }
  };

  const handleSelectUser = (userId: string) => {
    navigate(`/chat?user=${userId}`);
    clearResults();
    setSearchQuery("");
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    const success = await sendMessage(selectedUser.id, messageText);
    if (success) {
      setMessageText("");
      loadMessages(selectedUser.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadBackground(file);
      setShowBackgroundSettings(false);
    }
  };

  const getDisplayName = (item: any) => {
    return item.display_name || item.username || "User";
  };

  const getInitials = (item: any) => {
    const name = getDisplayName(item);
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] md:h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shrink-0">
        <div className="container mx-auto px-4 py-3">
          {selectedUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url || ""} />
                  <AvatarFallback>{getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{getDisplayName(selectedUser)}</h2>
                  <p className="text-xs text-muted-foreground">@{selectedUser.username || "user"}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
                title="Chat background"
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
          )}
        </div>
      </header>

      {/* Background Settings Panel */}
      {showBackgroundSettings && selectedUser && (
        <div className="bg-card border-b p-4 shrink-0">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">Chat Background</p>
                {backgroundUrl && (
                  <img 
                    src={backgroundUrl} 
                    alt="Current background" 
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
                {backgroundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeBackground}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {!selectedUser ? (
        // Conversation List View
        <div className="flex-1 overflow-auto container mx-auto px-4 py-4">
          {/* Search Users */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm text-muted-foreground">Search Results</p>
              {results.map((resultUser) => (
                <Card
                  key={resultUser.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectUser(resultUser.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={resultUser.avatar_url || ""} />
                        <AvatarFallback>{getInitials(resultUser)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getDisplayName(resultUser)}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{resultUser.username || "user"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Conversations */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Conversations</p>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <Card
                  key={conv.user_id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectUser(conv.user_id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.avatar_url || ""} />
                          <AvatarFallback>{getInitials(conv)}</AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{getDisplayName(conv)}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conv.last_message_time), "MMM d")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground">Search for users to start chatting!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Chat View
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Container with Background */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{
              backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="space-y-3 max-w-2xl mx-auto">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : backgroundUrl 
                            ? "bg-card/95 backdrop-blur-sm rounded-bl-md"
                            : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t bg-card p-4 shrink-0">
            <div className="max-w-2xl mx-auto flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;