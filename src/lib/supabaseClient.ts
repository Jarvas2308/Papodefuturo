import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { SupabaseEnvironmentConfig } from './env'

export type SupabaseBrowserClient = SupabaseClient<Database>

export type SupabaseClientFactory = (
  url: string,
  anonKey: string
) => SupabaseBrowserClient

const createTypedSupabaseClient: SupabaseClientFactory = (url, anonKey) =>
  createClient<Database>(url, anonKey)

export function createSupabaseBrowserClient(
  config: SupabaseEnvironmentConfig,
  createClientImplementation: SupabaseClientFactory = createTypedSupabaseClient
): SupabaseBrowserClient | null {
  if (!config.isConfigured) {
    return null
  }

  return createClientImplementation(config.url, config.anonKey)
}
