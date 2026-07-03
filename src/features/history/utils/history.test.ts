import { describe, expect, it } from 'vitest'
import { historyMovements } from '../mocks/historyMock'
import {
  calculateHistorySummary,
  emptyHistoryFilters,
  filterHistoryMovements,
  formatHistoryCurrency,
  formatHistoryDate,
  formatHistoryQuantity,
} from './history'

describe('filterHistoryMovements', () => {
  it('filters by ticker without distinguishing case', () => {
    const result = filterHistoryMovements(historyMovements, {
      ...emptyHistoryFilters,
      query: 'bbas3',
    })

    expect(result).toHaveLength(2)
    expect(result.every((movement) => movement.ticker === 'BBAS3')).toBe(true)
  })

  it('normalizes accents when searching by asset name', () => {
    const result = filterHistoryMovements(historyMovements, {
      ...emptyHistoryFilters,
      query: 'itauSA',
    })

    expect(result.map((movement) => movement.assetId)).toEqual(['itsa4'])
  })

  it('combines movement, category and status filters', () => {
    const result = filterHistoryMovements(historyMovements, {
      ...emptyHistoryFilters,
      type: 'purchase',
      category: 'international',
      status: 'completed',
    })

    expect(result.map((movement) => movement.assetId)).toEqual(['vea', 'vnq'])
  })

  it('filters movements by month', () => {
    const result = filterHistoryMovements(historyMovements, {
      ...emptyHistoryFilters,
      month: '2026-04',
    })

    expect(result).toHaveLength(3)
    expect(
      result.every((movement) => movement.date.startsWith('2026-04'))
    ).toBe(true)
  })

  it('returns an empty state and restores all items with empty filters', () => {
    const emptyResult = filterHistoryMovements(historyMovements, {
      ...emptyHistoryFilters,
      query: 'ativo inexistente',
    })

    expect(emptyResult).toEqual([])
    expect(
      filterHistoryMovements(historyMovements, emptyHistoryFilters)
    ).toEqual(historyMovements)
  })
})

describe('calculateHistorySummary', () => {
  it('calculates the cards from the complete movement set', () => {
    expect(calculateHistorySummary(historyMovements)).toEqual({
      movementCount: 16,
      purchaseCount: 7,
      proceedsInCents: 65_450,
      brlVolumeInCents: 1_089_250,
      usdVolumeInCents: 82_134,
    })
  })
})

describe('history formatters', () => {
  it('formats BRL and USD with their currency identification', () => {
    expect(formatHistoryCurrency(123_456, 'BRL')).toContain('R$')
    expect(formatHistoryCurrency(12_345, 'USD')).toContain('US$')
  })

  it('formats dates and only shows necessary quantity decimals', () => {
    expect(formatHistoryDate('2026-06-18')).toBe('18/06/2026')
    expect(formatHistoryQuantity(40)).toBe('40')
    expect(formatHistoryQuantity(1.25)).toBe('1,25')
  })
})
