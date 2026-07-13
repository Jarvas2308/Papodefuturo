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

describe('Supabase purchase repository', () => {
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
