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

  it('accepts B3 COTAHIST warnings from the server contract', async () => {
    const result = {
      refreshedAt: '2026-07-14T16:00:00.000Z',
      updatedPrices: 8,
      skippedFreshPrices: 0,
      updatedExchangeRates: 1,
      skippedFreshExchangeRates: 0,
      warnings: [
        {
          provider: 'b3-cotahist',
          kind: 'provider-failed',
          ticker: 'KNRI11',
          message: 'Cotação indisponível.',
        },
      ],
    }
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: result, error: null }),
      },
    } as unknown as SupabaseBrowserClient

    await expect(
      createSupabaseMarketDataRepository(client).refresh()
    ).resolves.toEqual(result)
  })

  it('accepts storage warnings from the server contract (DEC-062/DEC-066)', async () => {
    // 'storage' faltava na lista de providers válidos: qualquer aviso de
    // falha de escrita (DEC-062) derrubava a resposta inteira aqui, e o
    // motivo real virava o aviso genérico de refreshMarketDataBestEffort.
    const result = {
      refreshedAt: '2026-07-14T16:00:00.000Z',
      updatedPrices: 0,
      skippedFreshPrices: 0,
      updatedExchangeRates: 0,
      skippedFreshExchangeRates: 0,
      warnings: [
        {
          provider: 'storage',
          kind: 'storage-failed',
          message:
            'Não foi possível gravar as cotações de mercado nesta execução.',
        },
      ],
    }
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: result, error: null }),
      },
    } as unknown as SupabaseBrowserClient

    await expect(
      createSupabaseMarketDataRepository(client).refresh()
    ).resolves.toEqual(result)
  })

  it('rejects a warning with an unknown kind', async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: {
            refreshedAt: '2026-07-14T16:00:00.000Z',
            updatedPrices: 0,
            skippedFreshPrices: 0,
            updatedExchangeRates: 0,
            skippedFreshExchangeRates: 0,
            warnings: [
              {
                provider: 'b3-cotahist',
                kind: 'unknown-kind',
                message: 'Cotação indisponível.',
              },
            ],
          },
          error: null,
        }),
      },
    } as unknown as SupabaseBrowserClient

    await expect(
      createSupabaseMarketDataRepository(client).refresh()
    ).rejects.toThrow('Invalid market data refresh response')
  })
})
