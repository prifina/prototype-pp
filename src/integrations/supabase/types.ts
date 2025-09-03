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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          details: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          show_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          details?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          show_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          details?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          show_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          message_body: string
          message_sid: string | null
          message_type: string | null
          metadata: Json | null
          payload: Json | null
          phone_number: string
          seat_id: string | null
          status: string | null
          whatsapp_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          message_body: string
          message_sid?: string | null
          message_type?: string | null
          metadata?: Json | null
          payload?: Json | null
          phone_number: string
          seat_id?: string | null
          status?: string | null
          whatsapp_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          message_body?: string
          message_sid?: string | null
          message_type?: string | null
          metadata?: Json | null
          payload?: Json | null
          phone_number?: string
          seat_id?: string | null
          status?: string | null
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_log_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_notes: string | null
          age: number | null
          consent_data: Json | null
          created_at: string | null
          dietary_info: Json | null
          email: string | null
          first_name: string
          health_goals: Json | null
          id: string
          last_name: string
          phone_number: string
          show_id: string | null
          sleep_environment: Json | null
          tour_or_resident: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          age?: number | null
          consent_data?: Json | null
          created_at?: string | null
          dietary_info?: Json | null
          email?: string | null
          first_name: string
          health_goals?: Json | null
          id?: string
          last_name: string
          phone_number: string
          show_id?: string | null
          sleep_environment?: Json | null
          tour_or_resident?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          age?: number | null
          consent_data?: Json | null
          created_at?: string | null
          dietary_info?: Json | null
          email?: string | null
          first_name?: string
          health_goals?: Json | null
          id?: string
          last_name?: string
          phone_number?: string
          show_id?: string | null
          sleep_environment?: Json | null
          tour_or_resident?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          bound_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          phone_number: string | null
          profile_id: string | null
          profile_name: string | null
          seat_code: string
          show_id: string | null
          status: string | null
          twin_id: string | null
          updated_at: string | null
          whatsapp_id: string | null
        }
        Insert: {
          bound_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone_number?: string | null
          profile_id?: string | null
          profile_name?: string | null
          seat_code: string
          show_id?: string | null
          status?: string | null
          twin_id?: string | null
          updated_at?: string | null
          whatsapp_id?: string | null
        }
        Update: {
          bound_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone_number?: string | null
          profile_id?: string | null
          profile_name?: string | null
          seat_code?: string
          show_id?: string | null
          status?: string | null
          twin_id?: string | null
          updated_at?: string | null
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          duration_days: number | null
          id: string
          name: string
          passcode: string
          production_house: string | null
          seat_limit: number | null
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          name: string
          passcode: string
          production_house?: string | null
          seat_limit?: number | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          passcode?: string
          production_house?: string | null
          seat_limit?: number | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff"
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
      app_role: ["admin", "user", "staff"],
    },
  },
} as const
