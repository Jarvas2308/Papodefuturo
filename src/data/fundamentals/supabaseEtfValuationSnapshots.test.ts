import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseEtfValuationRepository,
  type EtfValuationSupabaseClient,
} from './supabaseEtfValuationSnapshots'

function fakeClient(
  rows: Array<{
    ticker: string
    reference_date: string
    premium_discount_basis_points: number
  }>
) {
  const query = {
    select: vi.fn(),
    eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
  }
  query.select.mockReturnValue(query)
  const client = {
    from: vi.fn(() => query),
  } as unknown as EtfValuationSupabaseClient

  return { client, query }
}

describe('createSupabaseEtfValuationRepository', () => {
  it('maps snake_case rows to the domain shape, filtered by source', async () => {
    const { client, query } = fakeClient([
      {
        ticker: 'VOO',
        reference_date: '2026-08-05',
        premium_discount_basis_points: -2,
      },
      {
        ticker: 'VNQ',
        reference_date: '2026-08-05',
        premium_discount_basis_points: 12,
      },
    ])
    const repository = createSupabaseEtfValuationRepository(client)

    const valuations = await repository.listEtfValuations()

    expect(client.from).toHaveBeenCalledWith('market_etf_valuations')
    expect(query.eq).toHaveBeenCalledWith('source', 'vanguard-site')
    expect(valuations).toEqual([
      { ticker: 'VOO', referenceDate: '2026-08-05', premiumDiscountBasisPoints: -2 },
      { ticker: 'VNQ', referenceDate: '2026-08-05', premiumDiscountBasisPoints: 12 },
    ])
  })

  it('returns an empty array when there is no data yet', async () => {
    const { client } = fakeClient([])
    const repository = createSupabaseEtfValuationRepository(client)

    await expect(repository.listEtfValuations()).resolves.toEqual([])
  })

  it('wraps a query error with a descriptive message', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    }
    query.select.mockReturnValue(query)
    const client = {
      from: vi.fn(() => query),
    } as unknown as EtfValuationSupabaseClient
    const repository = createSupabaseEtfValuationRepository(client)

    await expect(repository.listEtfValuations()).rejects.toThrow(
      'Failed to load ETF valuations: boom'
    )
  })
})
