export const SUPABASE_URL_ENV_KEY = 'VITE_SUPABASE_URL'
export const SUPABASE_ANON_KEY_ENV_KEY = 'VITE_SUPABASE_ANON_KEY'

export type SupabasePublicEnvKey =
  | typeof SUPABASE_URL_ENV_KEY
  | typeof SUPABASE_ANON_KEY_ENV_KEY

export type SupabasePublicEnvSource = Partial<
  Record<SupabasePublicEnvKey, unknown>
>

export type SupabaseEnvironmentConfig =
  | {
      isConfigured: true
      url: string
      anonKey: string
    }
  | {
      isConfigured: false
      missingKeys: SupabasePublicEnvKey[]
    }

function cleanEnvValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : undefined
}

export function readSupabaseEnvironment(
  env: SupabasePublicEnvSource
): SupabaseEnvironmentConfig {
  const url = cleanEnvValue(env[SUPABASE_URL_ENV_KEY])
  const anonKey = cleanEnvValue(env[SUPABASE_ANON_KEY_ENV_KEY])
  const missingKeys: SupabasePublicEnvKey[] = []

  if (!url) {
    missingKeys.push(SUPABASE_URL_ENV_KEY)
  }

  if (!anonKey) {
    missingKeys.push(SUPABASE_ANON_KEY_ENV_KEY)
  }

  if (missingKeys.length > 0) {
    return {
      isConfigured: false,
      missingKeys,
    }
  }

  return {
    isConfigured: true,
    url,
    anonKey,
  }
}
