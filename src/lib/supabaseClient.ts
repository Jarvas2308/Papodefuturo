import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseEnvironmentConfig } from './env'

export type SupabaseBrowserClient = SupabaseClient

export type SupabaseClientFactory = (
  url: string,
  anonKey: string
) => SupabaseBrowserClient

export function createSupabaseBrowserClient(
  config: SupabaseEnvironmentConfig,
  createClientImplementation: SupabaseClientFactory = createClient
): SupabaseBrowserClient | null {
  if (!config.isConfigured) {
    return null
  }

  return createClientImplementation(config.url, config.anonKey)
}
