export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contributions: {
        Row: {
          id: string
          user_id: string
          amount: number
          first_name: string
          last_name: string
          email: string
          address: string
          city: string
          postal_code: string
          gennervogt_id: string
          paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          first_name: string
          last_name: string
          email: string
          address: string
          city: string
          postal_code: string
          gennervogt_id: string
          paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          first_name?: string
          last_name?: string
          email?: string
          address?: string
          city?: string
          postal_code?: string
          gennervogt_id?: string
          paid?: boolean
          created_at?: string
        }
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
  }
}