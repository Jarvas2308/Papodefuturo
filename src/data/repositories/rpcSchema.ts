import type { SupabaseClient } from '@supabase/supabase-js'

export type RpcJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: RpcJson | undefined }
  | RpcJson[]

export type RpcDatabase = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: {
      replace_allocation_targets: {
        Args: { targets: RpcJson }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type RpcSupabaseClient = SupabaseClient<RpcDatabase>
