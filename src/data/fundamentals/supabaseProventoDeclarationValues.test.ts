import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseProventoDeclarationValueRepository,
  type ProventoDeclarationValueSupabaseClient,
} from './supabaseProventoDeclarationValues'

function fakeClient(
  rows: Array<{
    protocol: string
    version: number
    gross_value_per_share_unscaled: number
    gross_value_per_share_scale: number
    payment_date: string
  }>
) {
  const query = {
    select: vi.fn(),
    eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
  }
  query.select.mockReturnValue(query)
  const client = {
    from: vi.fn(() => query),
  } as unknown as ProventoDeclarationValueSupabaseClient

  return { client, query }
}

describe('createSupabaseProventoDeclarationValueRepository', () => {
  it('maps snake_case rows to the domain shape, filtered by isin', async () => {
    const { client, query } = fakeClient([
      {
        protocol: '1475856',
        version: 1,
        gross_value_per_share_unscaled: 242425,
        gross_value_per_share_scale: 7,
        payment_date: '2027-01-04',
      },
    ])
    const repository = createSupabaseProventoDeclarationValueRepository(client)

    const declarations =
      await repository.listProventoDeclarationsByIsin('BRITSAACNOR0')

    expect(client.from).toHaveBeenCalledWith('provento_declaration_values')
    expect(query.eq).toHaveBeenCalledWith('isin', 'BRITSAACNOR0')
    expect(declarations).toEqual([
      {
        protocol: '1475856',
        version: 1,
        grossValuePerShare: { unscaledValue: 242425, scale: 7 },
        paymentDate: '2027-01-04',
      },
    ])
  })

  it('returns an empty array when there is no data yet', async () => {
    const { client } = fakeClient([])
    const repository = createSupabaseProventoDeclarationValueRepository(client)

    await expect(
      repository.listProventoDeclarationsByIsin('BRITSAACNOR0')
    ).resolves.toEqual([])
  })

  it('wraps a query error with a descriptive message', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    }
    query.select.mockReturnValue(query)
    const client = {
      from: vi.fn(() => query),
    } as unknown as ProventoDeclarationValueSupabaseClient
    const repository = createSupabaseProventoDeclarationValueRepository(client)

    await expect(
      repository.listProventoDeclarationsByIsin('BRITSAACNOR0')
    ).rejects.toThrow('Failed to load provento declarations: boom')
  })
})
