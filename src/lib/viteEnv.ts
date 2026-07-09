import {
  readSupabaseEnvironment,
  SUPABASE_ANON_KEY_ENV_KEY,
  SUPABASE_URL_ENV_KEY,
  type SupabaseEnvironmentConfig,
} from './env'

type ViteSupabaseEnvSource = {
  readonly VITE_SUPABASE_URL?: unknown
  readonly VITE_SUPABASE_ANON_KEY?: unknown
}

export function readViteSupabaseEnvironment(
  env: ViteSupabaseEnvSource = import.meta.env
): SupabaseEnvironmentConfig {
  return readSupabaseEnvironment({
    [SUPABASE_URL_ENV_KEY]: env.VITE_SUPABASE_URL,
    [SUPABASE_ANON_KEY_ENV_KEY]: env.VITE_SUPABASE_ANON_KEY,
  })
}
