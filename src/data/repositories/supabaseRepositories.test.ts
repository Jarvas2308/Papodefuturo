import { describe, expect, it, vi } from 'vitest'
import type { Tables } from '../../lib/database.types'
import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import {
  calculatePurchaseTotalInMinorUnits,
  createSupabasePurchaseRepository,
} from './supabaseRepositories'

const basePurchaseRow: Tables<'purchases'> = {
  id: 'purchase-1',
  user_id: 'user-1',
  asset_id: 'asset-1',
  quantity: 2.5,
  unit_price_minor: 1_537,
  total_amount_minor: 3_843,
  currency: 'BRL',
  purchased_at: '2026-07-13',
  status: 'confirmed',
  notes: 'Aporte mensal',
  created_at: '2026-07-13T00:00:00.000Z',
  updated_at: '2026-07-13T00:00:00.000Z',
}

function createPurchaseClient(row: Tables<'purchases'>) {
  const single = vi.fn().mockResolvedValue({ data: row, error: null })
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn()
  eq.mockReturnValue({ eq, select })
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))

  return {
    client: { from } as unknown as SupabaseBrowserClient,
    from,
    update,
    eq,
  }
}

function createPurchaseBatchClient(rows: Tables<'purchases'>[]) {
  const select = vi.fn().mockResolvedValue({ data: rows, error: null })
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))

  return {
    client: { from } as unknown as SupabaseBrowserClient,
    from,
    insert,
    select,
  }
}

describe('Supabase purchase repository', () => {
  it('creates several confirmed purchases with one multi-row insert', async () => {
    const secondPurchaseRow: Tables<'purchases'> = {
      ...basePurchaseRow,
      id: 'purchase-2',
      asset_id: 'asset-2',
      quantity: 1,
      unit_price_minor: 2_000,
      total_amount_minor: 2_000,
      currency: 'USD',
      notes: null,
    }
    const fake = createPurchaseBatchClient([basePurchaseRow, secondPurchaseRow])
    const ids = ['purchase-1', 'purchase-2']
    const repository = createSupabasePurchaseRepository(
      fake.client,
      () => ids.shift() ?? 'unexpected-id'
    )

    const purchases = await repository.createMany({
      userId: 'authenticated-user',
      purchases: [
        {
          assetId: 'asset-1',
          quantity: 2.5,
          unitPriceInMinorUnits: 1_537,
          currency: 'BRL',
          purchasedAt: '2026-07-13',
          notes: '  Aporte mensal  ',
        },
        {
          assetId: 'asset-2',
          quantity: 1,
          unitPriceInMinorUnits: 2_000,
          currency: 'USD',
          purchasedAt: '2026-07-13',
        },
      ],
    })

    expect(fake.from).toHaveBeenCalledTimes(1)
    expect(fake.from).toHaveBeenCalledWith('purchases')
    expect(fake.insert).toHaveBeenCalledTimes(1)
    expect(fake.insert).toHaveBeenCalledWith([
      {
        id: 'purchase-1',
        user_id: 'authenticated-user',
        status: 'confirmed',
        asset_id: 'asset-1',
        quantity: 2.5,
        unit_price_minor: 1_537,
        total_amount_minor: 3_843,
        currency: 'BRL',
        purchased_at: '2026-07-13',
        notes: 'Aporte mensal',
      },
      {
        id: 'purchase-2',
        user_id: 'authenticated-user',
        status: 'confirmed',
        asset_id: 'asset-2',
        quantity: 1,
        unit_price_minor: 2_000,
        total_amount_minor: 2_000,
        currency: 'USD',
        purchased_at: '2026-07-13',
        notes: null,
      },
    ])
    expect(purchases).toHaveLength(2)
    expect(purchases.map((purchase) => purchase.id)).toEqual([
      'purchase-1',
      'purchase-2',
    ])
    expect(purchases.every((purchase) => purchase.status === 'confirmed')).toBe(
      true
    )
  })

  it('rejects an empty purchase batch before inserting rows', async () => {
    const fake = createPurchaseBatchClient([])
    const repository = createSupabasePurchaseRepository(fake.client)

    await expect(
      repository.createMany({ userId: 'authenticated-user', purchases: [] })
    ).rejects.toThrow('At least one purchase is required')
    expect(fake.insert).not.toHaveBeenCalled()
  })

  it('updates editable purchase facts and recalculates the stored total', async () => {
    const fake = createPurchaseClient(basePurchaseRow)
    const repository = createSupabasePurchaseRepository(fake.client)

    const purchase = await repository.update({
      purchaseId: 'purchase-1',
      assetId: 'asset-1',
      quantity: 2.5,
      unitPriceInMinorUnits: 1_537,
      currency: 'BRL',
      purchasedAt: '2026-07-13',
      notes: '  Aporte mensal  ',
    })

    expect(fake.from).toHaveBeenCalledWith('purchases')
    expect(fake.update).toHaveBeenCalledWith({
      asset_id: 'asset-1',
      quantity: 2.5,
      unit_price_minor: 1_537,
      total_amount_minor: 3_843,
      currency: 'BRL',
      purchased_at: '2026-07-13',
      notes: 'Aporte mensal',
    })
    expect(fake.eq).toHaveBeenNthCalledWith(1, 'id', 'purchase-1')
    expect(fake.eq).toHaveBeenNthCalledWith(2, 'status', 'confirmed')
    expect(purchase.totalAmount.amountInMinorUnits).toBe(3_843)
    expect(purchase.notes).toBe('Aporte mensal')
  })

  it('persists cancellation through status update without deleting the purchase', async () => {
    const fake = createPurchaseClient({
      ...basePurchaseRow,
      status: 'cancelled',
    })
    const repository = createSupabasePurchaseRepository(fake.client)

    const purchase = await repository.cancel('purchase-1')

    expect(fake.update).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(fake.eq).toHaveBeenNthCalledWith(1, 'id', 'purchase-1')
    expect(fake.eq).toHaveBeenNthCalledWith(2, 'status', 'confirmed')
    expect(purchase.status).toBe('cancelled')
  })

  it('keeps quantity and minor-unit validation at the repository boundary', () => {
    expect(calculatePurchaseTotalInMinorUnits(2.5, 1_537)).toBe(3_843)
    expect(() => calculatePurchaseTotalInMinorUnits(0, 100)).toThrow(RangeError)
    expect(() => calculatePurchaseTotalInMinorUnits(1, 10.5)).toThrow(
      RangeError
    )
  })
})
