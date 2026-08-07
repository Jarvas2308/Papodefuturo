import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseEtfDistributionValueRepository,
  type EtfDistributionValueSupabaseClient,
} from './supabaseEtfDistributionValues'

function fakeClient(
  rows: Array<{
    ticker: string
    fiscal_year_end_date: string
    total_distributions_per_share_unscaled: number
    total_distributions_per_share_scale: number
    net_asset_value_end_of_period_unscaled: number
    net_asset_value_end_of_period_scale: number
  }> | null,
  error: { message: string } | null = null
) {
  const query = {
    select: vi.fn().mockResolvedValue({ data: rows, error }),
  }
  const client = {
    from: vi.fn(() => query),
  } as unknown as EtfDistributionValueSupabaseClient

  return { client, query }
}

describe('createSupabaseEtfDistributionValueRepository', () => {
  it('maps snake_case rows to the camelCase domain shape', async () => {
    const { client } = fakeClient([
      {
        ticker: 'VNQ',
        fiscal_year_end_date: '2026-01-31',
        total_distributions_per_share_unscaled: 3472,
        total_distributions_per_share_scale: 3,
        net_asset_value_end_of_period_unscaled: 9081,
        net_asset_value_end_of_period_scale: 2,
      },
    ])
    const repository = createSupabaseEtfDistributionValueRepository(client)

    const values = await repository.listEtfDistributionValues()

    expect(client.from).toHaveBeenCalledWith('etf_distribution_values')
    expect(values).toEqual([
      {
        ticker: 'VNQ',
        fiscalYearEndDate: '2026-01-31',
        totalDistributionsPerShare: { unscaledValue: 3472, scale: 3 },
        netAssetValueEndOfPeriod: { unscaledValue: 9081, scale: 2 },
      },
    ])
  })

  it('returns an empty array when nothing was backfilled yet', async () => {
    const { client } = fakeClient([])
    const repository = createSupabaseEtfDistributionValueRepository(client)

    await expect(repository.listEtfDistributionValues()).resolves.toEqual([])
  })

  it('wraps a query error with a descriptive message', async () => {
    const { client } = fakeClient(null, { message: 'boom' })
    const repository = createSupabaseEtfDistributionValueRepository(client)

    await expect(repository.listEtfDistributionValues()).rejects.toThrow(
      'Failed to load ETF distribution values: boom'
    )
  })
})
