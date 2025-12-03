import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const createNotification = async (params: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    relatedUserId?: string;
  }) => {
    try {
      await supabase.from("notifications").insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message || null,
        related_user_id: params.relatedUserId || null,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    reloadNotifications: loadNotifications,
  };
};
