import type { SupabaseClient } from '@supabase/supabase-js'

export type ExchangeRateDatabase = {
  public: {
    Tables: {
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          priced_at: string
          quote_currency: string
          rate_scale: number
          rate_scaled: number
          source: string
          user_id: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          id: string
          priced_at: string
          quote_currency: string
          rate_scale?: number
          rate_scaled: number
          source?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          priced_at?: string
          quote_currency?: string
          rate_scale?: number
          rate_scaled?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type ExchangeRateSupabaseClient = SupabaseClient<ExchangeRateDatabase>
