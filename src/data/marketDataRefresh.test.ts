import { describe, expect, it, vi } from 'vitest'
import type { MarketDataRepository } from './repositories/contracts'
import {
  MARKET_DATA_REFRESH_WARNING,
  refreshMarketDataBestEffort,
} from './marketDataRefresh'

const successfulResult = {
  refreshedAt: '2026-07-14T16:00:00.000Z',
  updatedPrices: 2,
  skippedFreshPrices: 10,
  updatedExchangeRates: 1,
  skippedFreshExchangeRates: 0,
  warnings: [],
}

describe('refreshMarketDataBestEffort', () => {
  it('returns a successful structured refresh result', async () => {
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockResolvedValue(successfulResult),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: successfulResult,
      warning: null,
    })
  })

  it('turns an invoke failure into a non-destructive warning', async () => {
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockRejectedValue(new Error('function unavailable')),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: null,
      warning: MARKET_DATA_REFRESH_WARNING,
    })
  })

  it('does not warn when every warning is a stale quote (DEC-066)', async () => {
    // stale-quote é o estado normal quando os precos ja estao em dia: o
    // provider respondeu, mas nada mais recente havia para gravar. Antes
    // desta correcao, o banner aparecia em toda consulta com cotacao
    // atualizada - o caso comum do dia a dia, nao uma falha.
    const staleResult = {
      ...successfulResult,
      warnings: [
        {
          provider: 'b3-cotahist' as const,
          kind: 'stale-quote' as const,
          ticker: 'BBAS3',
          message: 'A cotação automática de BBAS3 não é mais recente.',
        },
      ],
    }
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockResolvedValue(staleResult),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: staleResult,
      warning: null,
    })
  })

  it('warns when at least one warning reflects real degradation', async () => {
    const degradedResult = {
      ...successfulResult,
      warnings: [
        {
          provider: 'b3-cotahist' as const,
          kind: 'stale-quote' as const,
          ticker: 'BBAS3',
          message: 'A cotação automática de BBAS3 não é mais recente.',
        },
        {
          provider: 'twelve-data' as const,
          kind: 'provider-failed' as const,
          ticker: 'VOO',
          message: 'Não foi possível atualizar a cotação automática de VOO.',
        },
      ],
    }
    const repository: MarketDataRepository = {
      refresh: vi.fn().mockResolvedValue(degradedResult),
    }

    await expect(refreshMarketDataBestEffort(repository)).resolves.toEqual({
      result: degradedResult,
      warning: MARKET_DATA_REFRESH_WARNING,
    })
  })
})
