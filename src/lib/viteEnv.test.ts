import { describe, expect, it } from 'vitest'
import {
  SUPABASE_ANON_KEY_ENV_KEY,
  SUPABASE_URL_ENV_KEY,
} from './env'
import { readViteSupabaseEnvironment } from './viteEnv'

describe('Vite Supabase environment bridge', () => {
  it('maps Vite public environment variables to the Supabase environment reader', () => {
    expect(
      readViteSupabaseEnvironment({
        VITE_SUPABASE_URL: ' https://example.supabase.co ',
        VITE_SUPABASE_ANON_KEY: ' public-anon-key ',
      })
    ).toEqual({
      isConfigured: true,
      url: 'https://example.supabase.co',
      anonKey: 'public-anon-key',
    })
  })

  it('reports missing Vite public environment variables', () => {
    expect(readViteSupabaseEnvironment({})).toEqual({
      isConfigured: false,
      missingKeys: [SUPABASE_URL_ENV_KEY, SUPABASE_ANON_KEY_ENV_KEY],
    })
  })
})
