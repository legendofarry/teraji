export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          at: string;
          diff: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: number;
          ip: unknown;
          org_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: number;
          ip?: unknown;
          org_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: number;
          ip?: unknown;
          org_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          archived_at: string | null;
          assigned_counselor_id: string | null;
          case_status: Database["public"]["Enums"]["case_status"];
          created_at: string;
          demographics: Json;
          external_id: string | null;
          id: string;
          intake_completed_at: string | null;
          last_activity_at: string;
          org_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          assigned_counselor_id?: string | null;
          case_status?: Database["public"]["Enums"]["case_status"];
          created_at?: string;
          demographics?: Json;
          external_id?: string | null;
          id?: string;
          intake_completed_at?: string | null;
          last_activity_at?: string;
          org_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          assigned_counselor_id?: string | null;
          case_status?: Database["public"]["Enums"]["case_status"];
          created_at?: string;
          demographics?: Json;
          external_id?: string | null;
          id?: string;
          intake_completed_at?: string | null;
          last_activity_at?: string;
          org_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_assigned_counselor_id_fkey";
            columns: ["assigned_counselor_id"];
            isOneToOne: false;
            referencedRelation: "counselors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      counselors: {
        Row: {
          active: boolean;
          availability_status:
            | Database["public"]["Enums"]["counselor_availability_status"]
            | null;
          bio: string | null;
          created_at: string;
          credentials: string | null;
          languages_spoken: string[];
          id: string;
          org_id: string;
          professional_title: string | null;
          specialties: string[];
          years_experience: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          availability_status?: Database["public"]["Enums"]["counselor_availability_status"];
          bio?: string | null;
          created_at?: string;
          credentials?: string | null;
          languages_spoken?: string[];
          id?: string;
          org_id: string;
          professional_title?: string | null;
          specialties?: string[];
          years_experience?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          availability_status?: Database["public"]["Enums"]["counselor_availability_status"];
          bio?: string | null;
          created_at?: string;
          credentials?: string | null;
          languages_spoken?: string[];
          id?: string;
          org_id?: string;
          professional_title?: string | null;
          specialties?: string[];
          years_experience?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counselors_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      client_administrative_profiles: {
        Row: {
          active_status: boolean;
          client_id: string;
          created_at: string;
          date_of_birth: string | null;
          department: string | null;
          email: string;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          org_id: string;
          phone: string | null;
          registration_number: string | null;
          updated_at: string;
          year_of_study: string | null;
        };
        Insert: {
          active_status?: boolean;
          client_id: string;
          created_at?: string;
          date_of_birth?: string | null;
          department?: string | null;
          email: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          org_id: string;
          phone?: string | null;
          registration_number?: string | null;
          updated_at?: string;
          year_of_study?: string | null;
        };
        Update: {
          active_status?: boolean;
          client_id?: string;
          created_at?: string;
          date_of_birth?: string | null;
          department?: string | null;
          email?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          org_id?: string;
          phone?: string | null;
          registration_number?: string | null;
          updated_at?: string;
          year_of_study?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_administrative_profiles_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_administrative_profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      client_clinical_profiles: {
        Row: {
          background: string | null;
          case_status: Database["public"]["Enums"]["case_status"];
          client_id: string;
          created_at: string;
          id: string;
          medical_history: string | null;
          medication: string | null;
          mental_health_history: string | null;
          org_id: string;
          presenting_issue: string | null;
          primary_counselor_id: string | null;
          risk_level: Database["public"]["Enums"]["risk_level"];
          updated_at: string;
        };
        Insert: {
          background?: string | null;
          case_status?: Database["public"]["Enums"]["case_status"];
          client_id: string;
          created_at?: string;
          id?: string;
          medical_history?: string | null;
          medication?: string | null;
          mental_health_history?: string | null;
          org_id: string;
          presenting_issue?: string | null;
          primary_counselor_id?: string | null;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          updated_at?: string;
        };
        Update: {
          background?: string | null;
          case_status?: Database["public"]["Enums"]["case_status"];
          client_id?: string;
          created_at?: string;
          id?: string;
          medical_history?: string | null;
          medication?: string | null;
          mental_health_history?: string | null;
          org_id?: string;
          presenting_issue?: string | null;
          primary_counselor_id?: string | null;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_clinical_profiles_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_clinical_profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_clinical_profiles_primary_counselor_id_fkey";
            columns: ["primary_counselor_id"];
            isOneToOne: false;
            referencedRelation: "counselors";
            referencedColumns: ["id"];
          },
        ];
      };
      client_consent_history: {
        Row: {
          accepted_at: string;
          accepted_ip: unknown;
          accepted_user_agent: string | null;
          client_id: string;
          consent_document_id: string;
          consent_text: string;
          consent_version: number;
          created_at: string;
          id: string;
          org_id: string;
        };
        Insert: {
          accepted_at?: string;
          accepted_ip?: unknown;
          accepted_user_agent?: string | null;
          client_id: string;
          consent_document_id: string;
          consent_text: string;
          consent_version: number;
          created_at?: string;
          id?: string;
          org_id: string;
        };
        Update: {
          accepted_at?: string;
          accepted_ip?: unknown;
          accepted_user_agent?: string | null;
          client_id?: string;
          consent_document_id?: string;
          consent_text?: string;
          consent_version?: number;
          created_at?: string;
          id?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_consent_history_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_consent_history_consent_document_id_fkey";
            columns: ["consent_document_id"];
            isOneToOne: false;
            referencedRelation: "consent_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_consent_history_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      client_intake_submissions: {
        Row: {
          client_id: string;
          created_at: string;
          gad7_score: number;
          id: string;
          org_id: string;
          phq9_score: number;
          responses: Json;
          submitted_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          gad7_score?: number;
          id?: string;
          org_id: string;
          phq9_score?: number;
          responses?: Json;
          submitted_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          gad7_score?: number;
          id?: string;
          org_id?: string;
          phq9_score?: number;
          responses?: Json;
          submitted_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "client_intake_submissions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_intake_submissions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      client_onboarding_progress: {
        Row: {
          active_at: string | null;
          assigned_at: string | null;
          client_id: string;
          consent_completed_at: string | null;
          created_at: string;
          email_verified_at: string | null;
          id: string;
          intake_completed_at: string | null;
          invited_at: string | null;
          org_id: string;
          ready_for_assignment_at: string | null;
          registered_at: string | null;
          updated_at: string;
        };
        Insert: {
          active_at?: string | null;
          assigned_at?: string | null;
          client_id: string;
          consent_completed_at?: string | null;
          created_at?: string;
          email_verified_at?: string | null;
          id?: string;
          intake_completed_at?: string | null;
          invited_at?: string | null;
          org_id: string;
          ready_for_assignment_at?: string | null;
          registered_at?: string | null;
          updated_at?: string;
        };
        Update: {
          active_at?: string | null;
          assigned_at?: string | null;
          client_id?: string;
          consent_completed_at?: string | null;
          created_at?: string;
          email_verified_at?: string | null;
          id?: string;
          intake_completed_at?: string | null;
          invited_at?: string | null;
          org_id?: string;
          ready_for_assignment_at?: string | null;
          registered_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_onboarding_progress_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_onboarding_progress_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          org_id: string;
          revoked_at: string | null;
          revoked_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          org_id: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          token: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          org_id?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      consent_documents: {
        Row: {
          body: string;
          created_at: string;
          effective_at: string;
          id: string;
          is_active: boolean;
          org_id: string;
          title: string;
          version: number;
        };
        Insert: {
          body: string;
          created_at?: string;
          effective_at?: string;
          id?: string;
          is_active?: boolean;
          org_id: string;
          title: string;
          version: number;
        };
        Update: {
          body?: string;
          created_at?: string;
          effective_at?: string;
          id?: string;
          is_active?: boolean;
          org_id?: string;
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "consent_documents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          org_id: string;
          status: Database["public"]["Enums"]["member_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          org_id: string;
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          org_id?: string;
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          branding: Json;
          created_at: string;
          id: string;
          locale: string;
          name: string;
          onboarding_config: Json;
          region: string;
          retention_days: number;
          slug: string;
          status: Database["public"]["Enums"]["org_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          branding?: Json;
          created_at?: string;
          id?: string;
          locale?: string;
          name: string;
          onboarding_config?: Json;
          region?: string;
          retention_days?: number;
          slug: string;
          status?: Database["public"]["Enums"]["org_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          branding?: Json;
          created_at?: string;
          id?: string;
          locale?: string;
          name?: string;
          onboarding_config?: Json;
          region?: string;
          retention_days?: number;
          slug?: string;
          status?: Database["public"]["Enums"]["org_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          locale: string;
          phone: string | null;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          locale?: string;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          locale?: string;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          id: string;
          org_id: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          org_id?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          org_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_org_invitation: { Args: { _token: string }; Returns: Json };
      assign_org_role: {
        Args: {
          _org_id: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: Json;
      };
      claim_platform_admin: { Args: never; Returns: Json };
      create_organization: {
        Args: { _admin_user_id?: string; _name: string; _slug: string };
        Returns: string;
      };
      has_role: {
        Args: {
          _org_id?: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_client_counselor: {
        Args: { _client_id: string; _user_id: string };
        Returns: boolean;
      };
      is_client_owner: {
        Args: { _client_id: string; _user_id: string };
        Returns: boolean;
      };
      is_org_admin: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      is_org_member: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean };
      peek_org_invitation: { Args: { _token: string }; Returns: Json };
      revoke_org_role: {
        Args: {
          _org_id: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: Json;
      };
      set_member_status: {
        Args: {
          _org_id: string;
          _status: Database["public"]["Enums"]["member_status"];
          _user_id: string;
        };
        Returns: Json;
      };
      update_organization_settings: {
        Args: {
          _branding?: Json;
          _locale?: string;
          _name?: string;
          _onboarding_config?: Json;
          _org_id: string;
          _retention_days?: number;
          _timezone?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role:
        | "platform_admin"
        | "org_admin"
        | "counselor"
        | "client"
        | "org_staff"
        | "clinical_supervisor";
      appointment_status:
        "scheduled" | "checked_in" | "in_progress" | "completed" | "no_show" | "cancelled";
      attachment_scan: "pending" | "clean" | "infected" | "skipped";
      case_status: "intake" | "active" | "on_hold" | "closed" | "archived";
      escalation_severity: "low" | "moderate" | "high" | "critical";
      escalation_status: "open" | "in_progress" | "resolved" | "reviewed";
      media_provider: "none" | "daily" | "twilio" | "agora";
      member_status: "pending" | "active" | "suspended" | "removed";
      notif_channel: "email" | "web_push" | "sms" | "whatsapp" | "in_app";
      notif_status: "queued" | "sent" | "delivered" | "failed" | "suppressed";
      org_status: "active" | "suspended" | "archived";
      risk_level: "none" | "low" | "moderate" | "high" | "severe";
      session_outcome: "completed" | "no_show" | "cancelled" | "interrupted";
      task_status: "open" | "in_progress" | "completed" | "cancelled";
      counselor_availability_status: "available" | "limited" | "unavailable";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
      counselor_availability_status: ["available", "limited", "unavailable"],
    },
  },
} as const;
