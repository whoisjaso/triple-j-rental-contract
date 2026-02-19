export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      agreements: {
        Row: {
          id: string
          agreement_number: string
          status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'expired'
          data: Json
          token: string | null
          token_expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agreement_number?: string
          status?: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'expired'
          data?: Json
          token?: string | null
          token_expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agreement_number?: string
          status?: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'expired'
          data?: Json
          token?: string | null
          token_expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          agreement_id: string | null
          action: 'created' | 'updated' | 'sent' | 'viewed' | 'signed' | 'pdf_generated' | 'downloaded' | 'expired'
          actor_type: 'admin' | 'client' | 'system'
          actor_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: number
          agreement_id?: string | null
          action: 'created' | 'updated' | 'sent' | 'viewed' | 'signed' | 'pdf_generated' | 'downloaded' | 'expired'
          actor_type?: 'admin' | 'client' | 'system'
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: number
          agreement_id?: string | null
          action?: 'created' | 'updated' | 'sent' | 'viewed' | 'signed' | 'pdf_generated' | 'downloaded' | 'expired'
          actor_type?: 'admin' | 'client' | 'system'
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
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
