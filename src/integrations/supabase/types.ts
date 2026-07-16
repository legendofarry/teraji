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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: number
          ip: unknown
          org_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: number
          ip?: unknown
          org_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip?: unknown
          org_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          assigned_counselor_id: string | null
          case_status: Database["public"]["Enums"]["case_status"]
          created_at: string
          demographics: Json
          external_id: string | null
          id: string
          intake_completed_at: string | null
          last_activity_at: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          assigned_counselor_id?: string | null
          case_status?: Database["public"]["Enums"]["case_status"]
          created_at?: string
          demographics?: Json
          external_id?: string | null
          id?: string
          intake_completed_at?: string | null
          last_activity_at?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          assigned_counselor_id?: string | null
          case_status?: Database["public"]["Enums"]["case_status"]
          created_at?: string
          demographics?: Json
          external_id?: string | null
          id?: string
          intake_completed_at?: string | null
          last_activity_at?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_counselor_id_fkey"
            columns: ["assigned_counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      counselors: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          credentials: string | null
          id: string
          org_id: string
          specialties: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          credentials?: string | null
          id?: string
          org_id: string
          specialties?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          credentials?: string | null
          id?: string
          org_id?: string
          specialties?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          revoked_at: string | null
          revoked_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          org_id: string
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json
          created_at: string
          id: string
          locale: string
          name: string
          onboarding_config: Json
          region: string
          retention_days: number
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          id?: string
          locale?: string
          name: string
          onboarding_config?: Json
          region?: string
          retention_days?: number
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          id?: string
          locale?: string
          name?: string
          onboarding_config?: Json
          region?: string
          retention_days?: number
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          locale: string
          phone: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_org_invitation: { Args: { _token: string }; Returns: Json }
      assign_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      claim_platform_admin: { Args: never; Returns: Json }
      create_organization: {
        Args: { _admin_user_id?: string; _name: string; _slug: string }
        Returns: string
      }
      has_role: {
        Args: {
          _org_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_client_counselor: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_client_owner: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      peek_org_invitation: { Args: { _token: string }; Returns: Json }
      revoke_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      set_member_status: {
        Args: {
          _org_id: string
          _status: Database["public"]["Enums"]["member_status"]
          _user_id: string
        }
        Returns: Json
      }
      update_organization_settings: {
        Args: {
          _branding?: Json
          _locale?: string
          _name?: string
          _onboarding_config?: Json
          _org_id: string
          _retention_days?: number
          _timezone?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "platform_admin"
        | "org_admin"
        | "counselor"
        | "client"
        | "org_staff"
        | "clinical_supervisor"
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled"
      attachment_scan: "pending" | "clean" | "infected" | "skipped"
      case_status: "intake" | "active" | "on_hold" | "closed" | "archived"
      escalation_severity: "low" | "moderate" | "high" | "critical"
      escalation_status: "open" | "in_progress" | "resolved" | "reviewed"
      media_provider: "none" | "daily" | "twilio" | "agora"
      member_status: "pending" | "active" | "suspended" | "removed"
      notif_channel: "email" | "web_push" | "sms" | "whatsapp" | "in_app"
      notif_status: "queued" | "sent" | "delivered" | "failed" | "suppressed"
      org_status: "active" | "suspended" | "archived"
      risk_level: "none" | "low" | "moderate" | "high" | "severe"
      session_outcome: "completed" | "no_show" | "cancelled" | "interrupted"
      task_status: "open" | "in_progress" | "completed" | "cancelled"
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
      app_role: [
        "platform_admin",
        "org_admin",
        "counselor",
        "client",
        "org_staff",
        "clinical_supervisor",
      ],
      appointment_status: [
        "scheduled",
        "checked_in",
        "in_progress",
        "completed",
        "no_show",
        "cancelled",
      ],
      attachment_scan: ["pending", "clean", "infected", "skipped"],
      case_status: ["intake", "active", "on_hold", "closed", "archived"],
      escalation_severity: ["low", "moderate", "high", "critical"],
      escalation_status: ["open", "in_progress", "resolved", "reviewed"],
      media_provider: ["none", "daily", "twilio", "agora"],
      member_status: ["pending", "active", "suspended", "removed"],
      notif_channel: ["email", "web_push", "sms", "whatsapp", "in_app"],
      notif_status: ["queued", "sent", "delivered", "failed", "suppressed"],
      org_status: ["active", "suspended", "archived"],
      risk_level: ["none", "low", "moderate", "high", "severe"],
      session_outcome: ["completed", "no_show", "cancelled", "interrupted"],
      task_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const
