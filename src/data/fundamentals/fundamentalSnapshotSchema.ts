import type { SupabaseClient } from '@supabase/supabase-js'

export type FundamentalSnapshotJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: FundamentalSnapshotJson | undefined }
  | FundamentalSnapshotJson[]

export type FundamentalSnapshotRow = {
  category: string
  created_at: string
  currency: string
  exercise_order: string
  filing_version: number
  id: number
  kind: string
  market: string
  net_income_minor: number | null
  operating_cash_flow_minor: number | null
  period: string
  provenance: FundamentalSnapshotJson
  reference_date: string
  source: string
  source_archive: string
  source_document_id: string
  ticker: string
  total_assets_minor: number | null
  total_equity_minor: number | null
  total_revenue_minor: number | null
  updated_at: string
}

export type FundamentalSnapshotInsert = Omit<
  FundamentalSnapshotRow,
  'created_at' | 'id' | 'updated_at'
> & {
  created_at?: string
  id?: number
  updated_at?: string
}

export type FundamentalSnapshotDatabase = {
  public: {
    Tables: {
      fundamental_snapshots: {
        Row: FundamentalSnapshotRow
        Insert: FundamentalSnapshotInsert
        Update: Partial<FundamentalSnapshotInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type FundamentalSnapshotSupabaseClient =
  SupabaseClient<FundamentalSnapshotDatabase>
