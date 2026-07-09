import { describe, expect, it } from 'vitest'
import {
  readSupabaseEnvironment,
  SUPABASE_ANON_KEY_ENV_KEY,
  SUPABASE_URL_ENV_KEY,
} from './env'

describe('Supabase environment configuration', () => {
  it('returns configured values when public Supabase variables are present', () => {
    expect(
      readSupabaseEnvironment({
        [SUPABASE_URL_ENV_KEY]: ' https://example.supabase.co ',
        [SUPABASE_ANON_KEY_ENV_KEY]: ' public-anon-key ',
      })
    ).toEqual({
      isConfigured: true,
      url: 'https://example.supabase.co',
      anonKey: 'public-anon-key',
    })
  })

  it('reports both variables as missing when they are absent', () => {
    expect(readSupabaseEnvironment({})).toEqual({
      isConfigured: false,
      missingKeys: [SUPABASE_URL_ENV_KEY, SUPABASE_ANON_KEY_ENV_KEY],
    })
  })

  it('treats blank values as missing', () => {
    expect(
      readSupabaseEnvironment({
        [SUPABASE_URL_ENV_KEY]: '   ',
        [SUPABASE_ANON_KEY_ENV_KEY]: 'public-anon-key',
      })
    ).toEqual({
      isConfigured: false,
      missingKeys: [SUPABASE_URL_ENV_KEY],
    })
  })
})
