export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_events: {
        Row: {
          booking_id: string | null
          device_id: string | null
          event_type: Database["public"]["Enums"]["access_event_type"]
          id: string
          metadata: Json
          occurred_at: string
          reason: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          device_id?: string | null
          event_type: Database["public"]["Enums"]["access_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          device_id?: string | null
          event_type?: Database["public"]["Enums"]["access_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          booking_id: string | null
          checked_in_at: string
          checked_in_by_device: string | null
          checked_out_at: string | null
          checked_out_by_device: string | null
          created_at: string
          id: string
          location_id: string
          override_by: string | null
          override_reason: string | null
          resource_id: string | null
          review_flags: Json
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          checked_in_at?: string
          checked_in_by_device?: string | null
          checked_out_at?: string | null
          checked_out_by_device?: string | null
          created_at?: string
          id?: string
          location_id: string
          override_by?: string | null
          override_reason?: string | null
          resource_id?: string | null
          review_flags?: Json
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          checked_in_at?: string
          checked_in_by_device?: string | null
          checked_out_at?: string | null
          checked_out_by_device?: string | null
          created_at?: string
          id?: string
          location_id?: string
          override_by?: string | null
          override_reason?: string | null
          resource_id?: string | null
          review_flags?: Json
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_checked_in_by_device_fkey"
            columns: ["checked_in_by_device"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_checked_out_by_device_fkey"
            columns: ["checked_out_by_device"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          occurred_at: string
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          occurred_at?: string
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_type?: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          occurred_at?: string
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      booking_guests: {
        Row: {
          booking_id: string
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_guests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          ends_at: string
          id: string
          idempotency_key: string | null
          member_id: string
          notes: string | null
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at: string
          id?: string
          idempotency_key?: string | null
          member_id: string
          notes?: string | null
          resource_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          idempotency_key?: string | null
          member_id?: string
          notes?: string | null
          resource_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_links: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          provider: Database["public"]["Enums"]["calendar_provider"]
          provider_calendar_id: string
          resource_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          id?: string
          provider?: Database["public"]["Enums"]["calendar_provider"]
          provider_calendar_id: string
          resource_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          provider?: Database["public"]["Enums"]["calendar_provider"]
          provider_calendar_id?: string
          resource_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_state: {
        Row: {
          booking_id: string
          calendar_link_id: string
          created_at: string
          external_updated_at: string | null
          last_error: string | null
          last_synced_at: string | null
          provider_etag: string | null
          provider_event_id: string | null
          status: Database["public"]["Enums"]["calendar_sync_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          calendar_link_id: string
          created_at?: string
          external_updated_at?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          provider_etag?: string | null
          provider_event_id?: string | null
          status?: Database["public"]["Enums"]["calendar_sync_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          calendar_link_id?: string
          created_at?: string
          external_updated_at?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          provider_etag?: string | null
          provider_event_id?: string | null
          status?: Database["public"]["Enums"]["calendar_sync_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_state_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_state_calendar_link_id_fkey"
            columns: ["calendar_link_id"]
            isOneToOne: false
            referencedRelation: "calendar_links"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_types: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      checkin_intents: {
        Row: {
          action: Database["public"]["Enums"]["checkin_action"]
          booking_id: string | null
          created_at: string
          expires_at: string
          id: string
          redeemed_at: string | null
          redeemed_by_device: string | null
          status: Database["public"]["Enums"]["checkin_intent_status"]
          token_hash: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["checkin_action"]
          booking_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_device?: string | null
          status?: Database["public"]["Enums"]["checkin_intent_status"]
          token_hash: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["checkin_action"]
          booking_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_device?: string | null
          status?: Database["public"]["Enums"]["checkin_intent_status"]
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_intents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_intents_redeemed_by_device_fkey"
            columns: ["redeemed_by_device"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_outbox: {
        Row: {
          action: Database["public"]["Enums"]["outbox_action"]
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          created_at: string
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["outbox_status"]
          updated_at: string
        }
        Insert: {
          action: Database["public"]["Enums"]["outbox_action"]
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number
          created_at?: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["outbox_action"]
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
          updated_at?: string
        }
        Relationships: []
      }
      kiosk_devices: {
        Row: {
          created_at: string
          enrolled_at: string | null
          enrolled_by: string | null
          id: string
          key_thumbprint: string | null
          last_seen_at: string | null
          location_id: string
          name: string
          public_key_jwk: Json | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["kiosk_device_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          key_thumbprint?: string | null
          last_seen_at?: string | null
          location_id: string
          name: string
          public_key_jwk?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["kiosk_device_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          key_thumbprint?: string | null
          last_seen_at?: string | null
          location_id?: string
          name?: string
          public_key_jwk?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["kiosk_device_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_enrollment_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          location_id: string
          name: string
          redeemed_at: string | null
          redeemed_device_id: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          location_id: string
          name: string
          redeemed_at?: string | null
          redeemed_device_id?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          location_id?: string
          name?: string
          redeemed_at?: string | null
          redeemed_device_id?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_enrollment_tokens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_enrollment_tokens_redeemed_device_id_fkey"
            columns: ["redeemed_device_id"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_request_nonces: {
        Row: {
          device_id: string
          expires_at: string
          nonce: string
          requested_at: string
        }
        Insert: {
          device_id: string
          expires_at: string
          nonce: string
          requested_at?: string
        }
        Update: {
          device_id?: string
          expires_at?: string
          nonce?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_request_nonces_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "kiosk_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_certifications: {
        Row: {
          certification_type_id: string
          created_at: string
          evidence_path: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string
          member_id: string
          notes: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["certification_status"]
          updated_at: string
        }
        Insert: {
          certification_type_id: string
          created_at?: string
          evidence_path?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by: string
          member_id: string
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["certification_status"]
          updated_at?: string
        }
        Update: {
          certification_type_id?: string
          created_at?: string
          evidence_path?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string
          member_id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["certification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_certifications_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_applications: {
        Row: {
          applicant_notes: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          id: string
          status: Database["public"]["Enums"]["membership_application_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applicant_notes?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          status?: Database["public"]["Enums"]["membership_application_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applicant_notes?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          status?: Database["public"]["Enums"]["membership_application_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          ends_at: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          suspended_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ends_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ends_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          emergency_contact: Json | null
          handle: string | null
          id: string
          is_public: boolean
          organization: string | null
          phone: string | null
          project_links: Json
          skills: string[]
          social_links: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          emergency_contact?: Json | null
          handle?: string | null
          id: string
          is_public?: boolean
          organization?: string | null
          phone?: string | null
          project_links?: Json
          skills?: string[]
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          emergency_contact?: Json | null
          handle?: string | null
          id?: string
          is_public?: boolean
          organization?: string | null
          phone?: string | null
          project_links?: Json
          skills?: string[]
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_deliveries: {
        Row: {
          attempt_count: number
          booking_id: string
          created_at: string
          delivered_at: string | null
          id: string
          last_error: string | null
          reminder_kind: string
          scheduled_for: string
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          booking_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          reminder_kind: string
          scheduled_for: string
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          booking_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          reminder_kind?: string
          scheduled_for?: string
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_deliveries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_blocks: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          kind: Database["public"]["Enums"]["resource_block_kind"]
          reason: string
          resource_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          kind: Database["public"]["Enums"]["resource_block_kind"]
          reason: string
          resource_id: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["resource_block_kind"]
          reason?: string
          resource_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_blocks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_blocks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_certification_requirements: {
        Row: {
          certification_type_id: string
          created_at: string
          resource_id: string
        }
        Insert: {
          certification_type_id: string
          created_at?: string
          resource_id: string
        }
        Update: {
          certification_type_id?: string
          created_at?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_certification_requirements_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_certification_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_certification_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_hours: {
        Row: {
          closes_at: string
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_until: string | null
          id: string
          opens_at: string
          resource_id: string
          updated_at: string
        }
        Insert: {
          closes_at: string
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          opens_at: string
          resource_id: string
          updated_at?: string
        }
        Update: {
          closes_at?: string
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          opens_at?: string
          resource_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_hours_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_hours_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_reservations: {
        Row: {
          block_id: string | null
          booking_id: string | null
          created_at: string
          ends_at: string
          id: string
          kind: Database["public"]["Enums"]["reservation_kind"]
          period: unknown
          released_at: string | null
          resource_id: string
          starts_at: string
        }
        Insert: {
          block_id?: string | null
          booking_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          kind: Database["public"]["Enums"]["reservation_kind"]
          period?: unknown
          released_at?: string | null
          resource_id: string
          starts_at: string
        }
        Update: {
          block_id?: string | null
          booking_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reservation_kind"]
          period?: unknown
          released_at?: string | null
          resource_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reservations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "resource_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_reservations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_reservations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_reservations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          active: boolean
          booking_horizon_days: number
          capacity: number
          checkin_early_minutes: number
          checkin_late_minutes: number
          checkout_grace_minutes: number
          created_at: string
          default_duration_minutes: number
          description: string
          guests_allowed: boolean
          id: string
          image_url: string | null
          increment_minutes: number
          kind: Database["public"]["Enums"]["resource_kind"]
          location_id: string
          max_duration_minutes: number
          max_guests: number
          metadata: Json
          name: string
          reservable: boolean
          risk: Database["public"]["Enums"]["resource_risk"]
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          booking_horizon_days?: number
          capacity?: number
          checkin_early_minutes?: number
          checkin_late_minutes?: number
          checkout_grace_minutes?: number
          created_at?: string
          default_duration_minutes?: number
          description?: string
          guests_allowed?: boolean
          id?: string
          image_url?: string | null
          increment_minutes?: number
          kind: Database["public"]["Enums"]["resource_kind"]
          location_id: string
          max_duration_minutes?: number
          max_guests?: number
          metadata?: Json
          name: string
          reservable?: boolean
          risk?: Database["public"]["Enums"]["resource_risk"]
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          booking_horizon_days?: number
          capacity?: number
          checkin_early_minutes?: number
          checkin_late_minutes?: number
          checkout_grace_minutes?: number
          created_at?: string
          default_duration_minutes?: number
          description?: string
          guests_allowed?: boolean
          id?: string
          image_url?: string | null
          increment_minutes?: number
          kind?: Database["public"]["Enums"]["resource_kind"]
          location_id?: string
          max_duration_minutes?: number
          max_guests?: number
          metadata?: Json
          name?: string
          reservable?: boolean
          risk?: Database["public"]["Enums"]["resource_risk"]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_member_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          handle: string | null
          id: string | null
          organization: string | null
          project_links: Json | null
          skills: string[] | null
          social_links: Json | null
        }
        Relationships: []
      }
      public_resource_certifications: {
        Row: {
          description: string | null
          name: string | null
          resource_id: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_certification_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_certification_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      public_resource_hours: {
        Row: {
          closes_at: string | null
          day_of_week: number | null
          effective_from: string | null
          effective_until: string | null
          opens_at: string | null
          resource_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_hours_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_hours_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      public_resources: {
        Row: {
          booking_horizon_days: number | null
          capacity: number | null
          default_duration_minutes: number | null
          description: string | null
          guests_allowed: boolean | null
          id: string | null
          image_url: string | null
          increment_minutes: number | null
          kind: Database["public"]["Enums"]["resource_kind"] | null
          location_name: string | null
          location_slug: string | null
          max_duration_minutes: number | null
          max_guests: number | null
          name: string | null
          reservable: boolean | null
          risk: Database["public"]["Enums"]["resource_risk"] | null
          slug: string | null
          timezone: string | null
          zone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: string
      }
      claim_due_reminders: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          booking_id: string
          created_at: string
          delivered_at: string | null
          id: string
          last_error: string | null
          reminder_kind: string
          scheduled_for: string
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reminder_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_integration_outbox: {
        Args: { p_limit?: number; p_worker: string }
        Returns: {
          action: Database["public"]["Enums"]["outbox_action"]
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          created_at: string
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["outbox_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "integration_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_integration_outbox: {
        Args: { p_id: string }
        Returns: undefined
      }
      complete_reminder: { Args: { p_id: string }; Returns: undefined }
      create_booking: {
        Args: {
          p_ends_at: string
          p_guest_names?: string[]
          p_idempotency_key?: string
          p_notes?: string
          p_resource_id: string
          p_starts_at: string
        }
        Returns: string
      }
      create_checkin_intent: {
        Args: {
          p_action?: Database["public"]["Enums"]["checkin_action"]
          p_booking_id?: string
        }
        Returns: Json
      }
      create_kiosk_enrollment: {
        Args: {
          p_created_by: string
          p_expires_at: string
          p_location_id: string
          p_name: string
          p_token_hash_hex: string
        }
        Returns: string
      }
      create_resource_block: {
        Args: {
          p_ends_at: string
          p_kind: Database["public"]["Enums"]["resource_block_kind"]
          p_reason: string
          p_resource_id: string
          p_starts_at: string
        }
        Returns: string
      }
      decide_membership: {
        Args: {
          p_application_id: string
          p_decision: Database["public"]["Enums"]["membership_application_status"]
          p_notes?: string
        }
        Returns: string
      }
      fail_integration_outbox: {
        Args: { p_error: string; p_id: string }
        Returns: undefined
      }
      fail_reminder: {
        Args: { p_error: string; p_id: string }
        Returns: undefined
      }
      has_staff_role: {
        Args: { p_roles?: Database["public"]["Enums"]["staff_role"][] }
        Returns: boolean
      }
      issue_certification: {
        Args: {
          p_certification_type_id: string
          p_evidence_path?: string
          p_expires_at?: string
          p_member_id: string
          p_notes?: string
        }
        Returns: string
      }
      list_availability: {
        Args: {
          p_duration_minutes?: number
          p_from: string
          p_resource_id: string
          p_to: string
        }
        Returns: {
          available: boolean
          ends_at: string
          reason: string
          starts_at: string
        }[]
      }
      redeem_checkin_intent: {
        Args: { p_device_id: string; p_token_hash_hex: string }
        Returns: Json
      }
      redeem_kiosk_enrollment: {
        Args: {
          p_key_thumbprint: string
          p_public_key_jwk: Json
          p_token_hash_hex: string
        }
        Returns: Json
      }
      reschedule_booking: {
        Args: {
          p_booking_id: string
          p_ends_at: string
          p_expected_updated_at?: string
          p_starts_at: string
        }
        Returns: string
      }
      run_attendance_maintenance: { Args: never; Returns: Json }
      set_resource_hours: {
        Args: {
          p_closes_at?: string
          p_day_of_week: number
          p_opens_at?: string
          p_resource_id: string
        }
        Returns: string
      }
      staff_override_attendance: {
        Args: {
          p_action: Database["public"]["Enums"]["checkin_action"]
          p_booking_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      staff_set_booking_status: {
        Args: {
          p_booking_id: string
          p_reason: string
          p_status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: string
      }
      submit_application: {
        Args: {
          p_applicant_notes?: string
          p_bio?: string
          p_display_name: string
          p_emergency_contact?: Json
          p_handle: string
          p_organization?: string
          p_phone?: string
          p_project_links?: Json
          p_skills?: string[]
          p_social_links?: Json
        }
        Returns: string
      }
    }
    Enums: {
      access_event_type:
        | "check_in"
        | "check_out"
        | "auto_close"
        | "denied"
        | "staff_override"
        | "kiosk_enrolled"
        | "kiosk_revoked"
      attendance_status: "active" | "closed" | "auto_closed" | "review"
      audit_actor_type: "member" | "staff" | "kiosk" | "system"
      booking_status:
        | "tentative"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      calendar_provider: "google"
      calendar_sync_status: "pending" | "synced" | "failed" | "deleted"
      certification_status: "active" | "revoked"
      checkin_action: "check_in" | "check_out"
      checkin_intent_status: "pending" | "redeemed" | "expired" | "cancelled"
      kiosk_device_status: "pending" | "active" | "revoked"
      membership_application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
      membership_status:
        | "pending"
        | "active"
        | "suspended"
        | "expired"
        | "cancelled"
      outbox_action: "create" | "update" | "cancel" | "remind"
      outbox_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "dead_letter"
      reminder_status: "pending" | "processing" | "sent" | "failed" | "skipped"
      reservation_kind: "booking" | "block"
      resource_block_kind: "maintenance" | "closure" | "staff_hold"
      resource_kind:
        | "workspace"
        | "equipment"
        | "room"
        | "compute"
        | "mobile_robot"
        | "sensor"
        | "other"
      resource_risk: "low" | "controlled" | "hazardous"
      staff_role: "operations" | "safety" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_event_type: [
        "check_in",
        "check_out",
        "auto_close",
        "denied",
        "staff_override",
        "kiosk_enrolled",
        "kiosk_revoked",
      ],
      attendance_status: ["active", "closed", "auto_closed", "review"],
      audit_actor_type: ["member", "staff", "kiosk", "system"],
      booking_status: [
        "tentative",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      calendar_provider: ["google"],
      calendar_sync_status: ["pending", "synced", "failed", "deleted"],
      certification_status: ["active", "revoked"],
      checkin_action: ["check_in", "check_out"],
      checkin_intent_status: ["pending", "redeemed", "expired", "cancelled"],
      kiosk_device_status: ["pending", "active", "revoked"],
      membership_application_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
      ],
      membership_status: [
        "pending",
        "active",
        "suspended",
        "expired",
        "cancelled",
      ],
      outbox_action: ["create", "update", "cancel", "remind"],
      outbox_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "dead_letter",
      ],
      reminder_status: ["pending", "processing", "sent", "failed", "skipped"],
      reservation_kind: ["booking", "block"],
      resource_block_kind: ["maintenance", "closure", "staff_hold"],
      resource_kind: [
        "workspace",
        "equipment",
        "room",
        "compute",
        "mobile_robot",
        "sensor",
        "other",
      ],
      resource_risk: ["low", "controlled", "hazardous"],
      staff_role: ["operations", "safety", "admin", "super_admin"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
