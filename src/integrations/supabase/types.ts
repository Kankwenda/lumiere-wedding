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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      dress_codes: {
        Row: {
          description: string
          id: string
          invitation_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string
          id?: string
          invitation_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          invitation_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dress_codes_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_options: {
        Row: {
          active: boolean
          alcoholic: boolean
          id: string
          invitation_id: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          alcoholic?: boolean
          id?: string
          invitation_id: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          alcoholic?: boolean
          id?: string
          invitation_id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "drink_options_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_selections: {
        Row: {
          guest_id: string
          option_id: string
        }
        Insert: {
          guest_id: string
          option_id: string
        }
        Update: {
          guest_id?: string
          option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_selections_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_selections_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "drink_options"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook_messages: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          invitation_id: string
          message: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          invitation_id: string
          message: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          invitation_id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guestbook_messages_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          category: string
          checked_in_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          invitation_id: string
          party_size: number
          phone: string | null
          rsvp_at: string | null
          rsvp_status: string
          token: string
        }
        Insert: {
          category?: string
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          invitation_id: string
          party_size?: number
          phone?: string | null
          rsvp_at?: string | null
          rsvp_status?: string
          token: string
        }
        Update: {
          category?: string
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          invitation_id?: string
          party_size?: number
          phone?: string | null
          rsvp_at?: string | null
          rsvp_status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          bride_first_name: string
          couple_photo_url: string | null
          created_at: string
          design: Json
          drink_limit: number
          family_name: string
          groom_first_name: string
          id: string
          location: string
          owner_id: string | null
          telegram_chat_id: string | null
          share_message: string
          default_country_code: string
          template: string
          wedding_date: string
          wedding_time: string
          welcome_message: string
        }
        Insert: {
          bride_first_name?: string
          couple_photo_url?: string | null
          created_at?: string
          design?: Json
          drink_limit?: number
          family_name?: string
          groom_first_name?: string
          id?: string
          location?: string
          owner_id?: string | null
          telegram_chat_id?: string | null
          share_message?: string
          default_country_code?: string
          template?: string
          wedding_date?: string
          wedding_time?: string
          welcome_message?: string
        }
        Update: {
          bride_first_name?: string
          couple_photo_url?: string | null
          created_at?: string
          design?: Json
          drink_limit?: number
          family_name?: string
          groom_first_name?: string
          id?: string
          location?: string
          owner_id?: string | null
          telegram_chat_id?: string | null
          share_message?: string
          default_country_code?: string
          template?: string
          wedding_date?: string
          wedding_time?: string
          welcome_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      program_events: {
        Row: {
          address: string | null
          details: string
          event_date: string | null
          event_time: string
          id: string
          invitation_id: string
          sort_order: number
          title: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          details?: string
          event_date?: string | null
          event_time: string
          id?: string
          invitation_id: string
          sort_order?: number
          title: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          details?: string
          event_date?: string | null
          event_time?: string
          id?: string
          invitation_id?: string
          sort_order?: number
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
