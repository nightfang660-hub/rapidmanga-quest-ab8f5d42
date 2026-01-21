export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          bookmarked_at: string
          id: string
          manga_genres: string[] | null
          manga_id: string
          manga_thumb: string | null
          manga_title: string
          user_id: string
        }
        Insert: {
          bookmarked_at?: string
          id?: string
          manga_genres?: string[] | null
          manga_id: string
          manga_thumb?: string | null
          manga_title: string
          user_id: string
        }
        Update: {
          bookmarked_at?: string
          id?: string
          manga_genres?: string[] | null
          manga_id?: string
          manga_thumb?: string | null
          manga_title?: string
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          api_id: string
          chapter_number: number
          created_at: string | null
          id: string
          manga_id: string | null
          pages: Json | null
          release_date: string | null
          title: string | null
        }
        Insert: {
          api_id: string
          chapter_number: number
          created_at?: string | null
          id?: string
          manga_id?: string | null
          pages?: Json | null
          release_date?: string | null
          title?: string | null
        }
        Update: {
          api_id?: string
          chapter_number?: number
          created_at?: string | null
          id?: string
          manga_id?: string | null
          pages?: Json | null
          release_date?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      downloaded_chapters: {
        Row: {
          chapter_data: Json
          chapter_id: string
          chapter_title: string
          downloaded_at: string
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          chapter_data: Json
          chapter_id: string
          chapter_title: string
          downloaded_at?: string
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          chapter_data?: Json
          chapter_id?: string
          chapter_title?: string
          downloaded_at?: string
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: []
      }
      manga_reviews: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          manga_thumb: string | null
          manga_title: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          manga_thumb?: string | null
          manga_title: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          manga_thumb?: string | null
          manga_title?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mangas: {
        Row: {
          alt_titles: Json | null
          api_id: string
          artists: Json | null
          authors: Json | null
          content_rating: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          last_fetched_at: string | null
          latest_chapter_number: number | null
          mangadex_description: string | null
          mangadex_id: string | null
          mangadex_last_synced_at: string | null
          normalized_title: string | null
          original_language: string | null
          publication_demographic: string | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alt_titles?: Json | null
          api_id: string
          artists?: Json | null
          authors?: Json | null
          content_rating?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_fetched_at?: string | null
          latest_chapter_number?: number | null
          mangadex_description?: string | null
          mangadex_id?: string | null
          mangadex_last_synced_at?: string | null
          normalized_title?: string | null
          original_language?: string | null
          publication_demographic?: string | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alt_titles?: Json | null
          api_id?: string
          artists?: Json | null
          authors?: Json | null
          content_rating?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_fetched_at?: string | null
          latest_chapter_number?: number | null
          mangadex_description?: string | null
          mangadex_id?: string | null
          mangadex_last_synced_at?: string | null
          normalized_title?: string | null
          original_language?: string | null
          publication_demographic?: string | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          chat_background_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_read_date: string | null
          notification_preferences: Json | null
          reading_preferences: Json | null
          reading_streak: number | null
          total_chapters_read: number | null
          total_manga_read: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          chat_background_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_read_date?: string | null
          notification_preferences?: Json | null
          reading_preferences?: Json | null
          reading_streak?: number | null
          total_chapters_read?: number | null
          total_manga_read?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          chat_background_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_read_date?: string | null
          notification_preferences?: Json | null
          reading_preferences?: Json | null
          reading_streak?: number | null
          total_chapters_read?: number | null
          total_manga_read?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string
          current_progress: number
          end_date: string | null
          goal_type: string
          id: string
          start_date: string
          target_chapters: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_progress?: number
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          target_chapters?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_progress?: number
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          target_chapters?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          chapter_id: string
          chapter_number: string | null
          chapter_title: string
          id: string
          last_read_at: string
          manga_id: string
          manga_thumb: string | null
          manga_title: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          chapter_number?: string | null
          chapter_title: string
          id?: string
          last_read_at?: string
          manga_id: string
          manga_thumb?: string | null
          manga_title: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          chapter_number?: string | null
          chapter_title?: string
          id?: string
          last_read_at?: string
          manga_id?: string
          manga_thumb?: string | null
          manga_title?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          current_chapter_id: string
          current_chapter_number: string | null
          current_chapter_title: string
          id: string
          manga_id: string
          manga_thumb: string | null
          manga_title: string
          progress_percentage: number | null
          started_at: string
          status: string | null
          total_chapters: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_chapter_id: string
          current_chapter_number?: string | null
          current_chapter_title: string
          id?: string
          manga_id: string
          manga_thumb?: string | null
          manga_title: string
          progress_percentage?: number | null
          started_at?: string
          status?: string | null
          total_chapters?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_chapter_id?: string
          current_chapter_number?: string | null
          current_chapter_title?: string
          id?: string
          manga_id?: string
          manga_thumb?: string | null
          manga_title?: string
          progress_percentage?: number | null
          started_at?: string
          status?: string | null
          total_chapters?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_rooms: {
        Row: {
          code: string | null
          created_at: string
          current_chapter_id: string | null
          current_page_index: number | null
          host_id: string
          id: string
          is_active: boolean | null
          manga_cover: string | null
          manga_id: string
          manga_title: string | null
          mode: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          current_chapter_id?: string | null
          current_page_index?: number | null
          host_id: string
          id?: string
          is_active?: boolean | null
          manga_cover?: string | null
          manga_id: string
          manga_title?: string | null
          mode?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          current_chapter_id?: string | null
          current_page_index?: number | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          manga_cover?: string | null
          manga_id?: string
          manga_title?: string | null
          mode?: string | null
        }
        Relationships: []
      }
      room_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "reading_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_recommendations: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          manga_id: string
          manga_thumb: string | null
          manga_title: string
          recommendation_text: string | null
          shared_with_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          manga_id: string
          manga_thumb?: string | null
          manga_title: string
          recommendation_text?: string | null
          shared_with_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          manga_id?: string
          manga_thumb?: string | null
          manga_title?: string
          recommendation_text?: string | null
          shared_with_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          chapter_count: number | null
          completed_at: string | null
          error_message: string | null
          id: string
          manga_count: number | null
          started_at: string | null
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          chapter_count?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          manga_count?: number | null
          started_at?: string | null
          status?: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          chapter_count?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          manga_count?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      sync_settings: {
        Row: {
          cron_enabled: boolean | null
          cron_interval_minutes: number | null
          id: string
          last_cron_run: string | null
          updated_at: string | null
        }
        Insert: {
          cron_enabled?: boolean | null
          cron_interval_minutes?: number | null
          id?: string
          last_cron_run?: string | null
          updated_at?: string | null
        }
        Update: {
          cron_enabled?: boolean | null
          cron_interval_minutes?: number | null
          id?: string
          last_cron_run?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          chat_partner_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_partner_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_partner_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_next_chapter: boolean
          compact_sidebar: boolean
          dm_notifications: boolean
          follower_notifications: boolean
          page_display: string
          reading_direction: string
          recommendation_notifications: boolean
          theme: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_next_chapter?: boolean
          compact_sidebar?: boolean
          dm_notifications?: boolean
          follower_notifications?: boolean
          page_display?: string
          reading_direction?: string
          recommendation_notifications?: boolean
          theme?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_next_chapter?: boolean
          compact_sidebar?: boolean
          dm_notifications?: boolean
          follower_notifications?: boolean
          page_display?: string
          reading_direction?: string
          recommendation_notifications?: boolean
          theme?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      normalize_manga_title: { Args: { title: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
