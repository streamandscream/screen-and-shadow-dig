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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ingestion_runs: {
        Row: {
          classify_errors: number
          error: string | null
          http_status: number | null
          id: string
          items_fetched: number
          items_inserted: number
          items_skipped: number
          latency_ms: number
          ok: boolean
          parse_errors: number
          ran_at: string
          source_name: string
          source_url: string
        }
        Insert: {
          classify_errors?: number
          error?: string | null
          http_status?: number | null
          id?: string
          items_fetched?: number
          items_inserted?: number
          items_skipped?: number
          latency_ms?: number
          ok: boolean
          parse_errors?: number
          ran_at?: string
          source_name: string
          source_url: string
        }
        Update: {
          classify_errors?: number
          error?: string | null
          http_status?: number | null
          id?: string
          items_fetched?: number
          items_inserted?: number
          items_skipped?: number
          latency_ms?: number
          ok?: boolean
          parse_errors?: number
          ran_at?: string
          source_name?: string
          source_url?: string
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_affiliate: boolean
          link_text: string | null
          merchant_id: string | null
          original_url: string | null
          source_path: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_affiliate?: boolean
          link_text?: string | null
          merchant_id?: string | null
          original_url?: string | null
          source_path?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_affiliate?: boolean
          link_text?: string | null
          merchant_id?: string | null
          original_url?: string | null
          source_path?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body: string
          cover_alt: string | null
          cover_url: string | null
          created_at: string
          excerpt: string
          id: string
          justwatch_country: string
          justwatch_slug: string | null
          justwatch_type: string
          meta_description: string | null
          next_binge: string[]
          publish_at: string | null
          published: boolean
          published_at: string | null
          rating: number | null
          section: Database["public"]["Enums"]["post_section"]
          slug: string
          streamer: string | null
          tags: string[]
          title: string
          updated_at: string
          vibe: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          cover_alt?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt: string
          id?: string
          justwatch_country?: string
          justwatch_slug?: string | null
          justwatch_type?: string
          meta_description?: string | null
          next_binge?: string[]
          publish_at?: string | null
          published?: boolean
          published_at?: string | null
          rating?: number | null
          section: Database["public"]["Enums"]["post_section"]
          slug: string
          streamer?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          vibe?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          cover_alt?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          justwatch_country?: string
          justwatch_slug?: string | null
          justwatch_type?: string
          meta_description?: string | null
          next_binge?: string[]
          publish_at?: string | null
          published?: boolean
          published_at?: string | null
          rating?: number | null
          section?: Database["public"]["Enums"]["post_section"]
          slug?: string
          streamer?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          vibe?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tv_news: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          network: string | null
          published_at: string
          show_title: string | null
          source_name: string
          source_url: string
          status: Database["public"]["Enums"]["tv_news_status"]
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          network?: string | null
          published_at?: string
          show_title?: string | null
          source_name: string
          source_url: string
          status?: Database["public"]["Enums"]["tv_news_status"]
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          network?: string | null
          published_at?: string
          show_title?: string | null
          source_name?: string
          source_url?: string
          status?: Database["public"]["Enums"]["tv_news_status"]
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_tag: { Args: { _name: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rename_tag: { Args: { _new: string; _old: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "author"
      post_section: "tv" | "true_crime"
      tv_news_status: "renewed" | "cancelled" | "ended" | "other"
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
    Enums: {
      app_role: ["admin", "author"],
      post_section: ["tv", "true_crime"],
      tv_news_status: ["renewed", "cancelled", "ended", "other"],
    },
  },
} as const
