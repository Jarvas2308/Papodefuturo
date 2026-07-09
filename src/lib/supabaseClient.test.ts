import { describe, expect, it, vi } from 'vitest'
import { SUPABASE_ANON_KEY_ENV_KEY, SUPABASE_URL_ENV_KEY } from './env'
import {
  createSupabaseBrowserClient,
  type SupabaseBrowserClient,
  type SupabaseClientFactory,
} from './supabaseClient'

describe('Supabase client factory', () => {
  it('returns null when the Supabase environment is not configured', () => {
    const createClientMock: SupabaseClientFactory = vi.fn(
      () => ({}) as SupabaseBrowserClient
    )

    const client = createSupabaseBrowserClient(
      {
        isConfigured: false,
        missingKeys: [SUPABASE_URL_ENV_KEY, SUPABASE_ANON_KEY_ENV_KEY],
      },
      createClientMock
    )

    expect(client).toBeNull()
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('creates a Supabase client with the validated public environment', () => {
    const expectedClient = {} as SupabaseBrowserClient
    const createClientMock: SupabaseClientFactory = vi.fn(() => expectedClient)

    const client = createSupabaseBrowserClient(
      {
        isConfigured: true,
        url: 'https://example.supabase.co',
        anonKey: 'public-anon-key',
      },
      createClientMock
    )

    expect(client).toBe(expectedClient)
    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'public-anon-key'
    )
  })
})
