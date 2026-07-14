import { describe, expect, it, vi } from 'vitest'
import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import { createSupabaseMarketDataRepository } from './supabaseRepositories'

describe('Supabase market data repository', () => {
  it('invokes the refresh-market-data Edge Function', async () => {
    const result = {
      refreshedAt: '2026-07-14T16:00:00.000Z',
      updatedPrices: 1,
      skippedFreshPrices: 11,
      updatedExchangeRates: 1,
      skippedFreshExchangeRates: 0,
      warnings: [],
    }
    const invoke = vi.fn().mockResolvedValue({ data: result, error: null })
    const client = { functions: { invoke } } as unknown as SupabaseBrowserClient

    await expect(
      createSupabaseMarketDataRepository(client).refresh()
    ).resolves.toEqual(result)
    expect(invoke).toHaveBeenCalledWith('refresh-market-data')
  })

  it('rejects an invalid function response at the repository boundary', async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { raw: true }, error: null }),
      },
    } as unknown as SupabaseBrowserClient

    await expect(
      createSupabaseMarketDataRepository(client).refresh()
    ).rejects.toThrow('Invalid market data refresh response')
  })
})
