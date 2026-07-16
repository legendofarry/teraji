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
      appointments: {
        Row: {
          client_id: string
          counselor_id: string
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          location: string | null
          modality: string
          notes: string | null
          org_id: string
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          counselor_id: string
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          location?: string | null
          modality?: string
          notes?: string | null
          org_id: string
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          counselor_id?: string
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          location?: string | null
          modality?: string
          notes?: string | null
          org_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          answers: Json
          assessment_id: string
          client_id: string
          id: string
          org_id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          score: number | null
          submitted_at: string
        }
        Insert: {
          answers: Json
          assessment_id: string
          client_id: string
          id?: string
          org_id: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          score?: number | null
          submitted_at?: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          client_id?: string
          id?: string
          org_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          score?: number | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          active: boolean
          created_at: string
          definition: Json
          id: string
          key: string
          org_id: string | null
          scoring: Json
          title: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          definition: Json
          id?: string
          key: string
          org_id?: string | null
          scoring?: Json
          title: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          definition?: Json
          id?: string
          key?: string
          org_id?: string | null
          scoring?: Json
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          id: string
          mime: string
          org_id: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          uploaded_by: string
          virus_scan_status: Database["public"]["Enums"]["attachment_scan"]
        }
        Insert: {
          created_at?: string
          id?: string
          mime: string
          org_id: string
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
          virus_scan_status?: Database["public"]["Enums"]["attachment_scan"]
        }
        Update: {
          created_at?: string
          id?: string
          mime?: string
          org_id?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
          virus_scan_status?: Database["public"]["Enums"]["attachment_scan"]
        }
        Relationships: [
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      availability_slots: {
        Row: {
          counselor_id: string
          created_at: string
          end_at: string
          id: string
          org_id: string
          rrule: string | null
          start_at: string
          timezone: string
        }
        Insert: {
          counselor_id: string
          created_at?: string
          end_at: string
          id?: string
          org_id: string
          rrule?: string | null
          start_at: string
          timezone?: string
        }
        Update: {
          counselor_id?: string
          created_at?: string
          end_at?: string
          id?: string
          org_id?: string
          rrule?: string | null
          start_at?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          metadata: Json
          org_id: string
          provider: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          org_id: string
          provider?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          org_id?: string
          provider?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_emergency_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          org_id: string
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          org_id: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          org_id?: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_emergency_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_emergency_contacts_org_id_fkey"
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
      consent_documents: {
        Row: {
          body: string
          effective_at: string
          id: string
          org_id: string
          title: string
          version: number
        }
        Insert: {
          body: string
          effective_at?: string
          id?: string
          org_id: string
          title: string
          version: number
        }
        Update: {
          body?: string
          effective_at?: string
          id?: string
          org_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "consent_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string
          client_id: string
          document_id: string
          id: string
          org_id: string
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string
          client_id: string
          document_id: string
          id?: string
          org_id: string
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string
          client_id?: string
          document_id?: string
          id?: string
          org_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "consent_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          counselor_id: string
          created_at: string
          id: string
          last_message_at: string | null
          org_id: string
        }
        Insert: {
          client_id: string
          counselor_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          org_id: string
        }
        Update: {
          client_id?: string
          counselor_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
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
      escalations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          opened_by: string | null
          org_id: string
          resolved_at: string | null
          safety_plan_id: string | null
          severity: Database["public"]["Enums"]["escalation_severity"]
          status: Database["public"]["Enums"]["escalation_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          opened_by?: string | null
          org_id: string
          resolved_at?: string | null
          safety_plan_id?: string | null
          severity?: Database["public"]["Enums"]["escalation_severity"]
          status?: Database["public"]["Enums"]["escalation_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          opened_by?: string | null
          org_id?: string
          resolved_at?: string | null
          safety_plan_id?: string | null
          severity?: Database["public"]["Enums"]["escalation_severity"]
          status?: Database["public"]["Enums"]["escalation_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_safety_plan_id_fkey"
            columns: ["safety_plan_id"]
            isOneToOne: false
            referencedRelation: "safety_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          id: string
          key: string
          org_id: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          org_id?: string | null
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          org_id?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_id: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          org_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_id?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          org_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_id?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          org_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notif_channel"]
          enabled: boolean
          template_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notif_channel"]
          enabled?: boolean
          template_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notif_channel"]
          enabled?: boolean
          template_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at: string
          id: string
          org_id: string | null
          payload: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["notif_status"]
          template_key: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          org_id?: string | null
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notif_status"]
          template_key: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          org_id?: string | null
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notif_status"]
          template_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
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
      safety_plans: {
        Row: {
          client_id: string
          content: Json
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          published_at: string | null
          version: number
        }
        Insert: {
          client_id: string
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          published_at?: string | null
          version?: number
        }
        Update: {
          client_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          published_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "safety_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_media: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          org_id: string
          provider: Database["public"]["Enums"]["media_provider"]
          recording_uri: string | null
          room_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          org_id: string
          provider?: Database["public"]["Enums"]["media_provider"]
          recording_uri?: string | null
          room_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          org_id?: string
          provider?: Database["public"]["Enums"]["media_provider"]
          recording_uri?: string | null
          room_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_media_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes_private: {
        Row: {
          body: string
          counselor_id: string
          created_at: string
          id: string
          org_id: string
          session_id: string
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          counselor_id: string
          created_at?: string
          id?: string
          org_id: string
          session_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          counselor_id?: string
          created_at?: string
          id?: string
          org_id?: string
          session_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_private_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_private_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_private_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries_shared: {
        Row: {
          body: string
          client_id: string
          counselor_id: string
          created_at: string
          id: string
          org_id: string
          published_at: string | null
          session_id: string
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          client_id: string
          counselor_id: string
          created_at?: string
          id?: string
          org_id: string
          published_at?: string | null
          session_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          client_id?: string
          counselor_id?: string
          created_at?: string
          id?: string
          org_id?: string
          published_at?: string | null
          session_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_shared_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_shared_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_shared_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_shared_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          appointment_id: string
          client_id: string
          counselor_id: string
          created_at: string
          ended_at: string | null
          id: string
          org_id: string
          outcome: Database["public"]["Enums"]["session_outcome"] | null
          started_at: string | null
        }
        Insert: {
          appointment_id: string
          client_id: string
          counselor_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          org_id: string
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          started_at?: string | null
        }
        Update: {
          appointment_id?: string
          client_id?: string
          counselor_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          org_id?: string
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assignee_id: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          overdue_streak: number
          reminder_policy: Json
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assignee_id: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          overdue_streak?: number
          reminder_policy?: Json
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assignee_id?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          overdue_streak?: number
          reminder_policy?: Json
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
