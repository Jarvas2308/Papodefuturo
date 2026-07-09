import { describe, expect, it } from 'vitest'
import {
  isCompleteAllocation,
  isNonEmptyEntityId,
  isValidBasisPoints,
  isValidMoneyInMinorUnits,
  sumBasisPoints,
  TOTAL_ALLOCATION_BASIS_POINTS,
} from './shared'

describe('domain model primitives', () => {
  it('accepts non-empty entity ids only', () => {
    expect(isNonEmptyEntityId('asset-bbas3')).toBe(true)
    expect(isNonEmptyEntityId('   ')).toBe(false)
  })

  it('accepts safe non-negative money values in minor units', () => {
    expect(isValidMoneyInMinorUnits(0)).toBe(true)
    expect(isValidMoneyInMinorUnits(12_345)).toBe(true)
    expect(isValidMoneyInMinorUnits(-1)).toBe(false)
    expect(isValidMoneyInMinorUnits(1.5)).toBe(false)
    expect(isValidMoneyInMinorUnits(Number.MAX_SAFE_INTEGER + 1)).toBe(false)
  })

  it('validates basis points in the inclusive 0 to 10,000 range', () => {
    expect(isValidBasisPoints(0)).toBe(true)
    expect(isValidBasisPoints(TOTAL_ALLOCATION_BASIS_POINTS)).toBe(true)
    expect(isValidBasisPoints(-1)).toBe(false)
    expect(isValidBasisPoints(10_001)).toBe(false)
    expect(isValidBasisPoints(10.5)).toBe(false)
  })

  it('sums basis points without converting to floating point percentages', () => {
    expect(sumBasisPoints([3_000, 3_000, 2_500, 1_500])).toBe(
      TOTAL_ALLOCATION_BASIS_POINTS
    )
  })

  it('identifies complete allocations totaling exactly 10,000 basis points', () => {
    expect(isCompleteAllocation([3_000, 3_000, 2_500, 1_500])).toBe(true)
    expect(isCompleteAllocation([3_000, 3_000, 2_500])).toBe(false)
    expect(isCompleteAllocation([3_000, 3_000, 2_500, 1_501])).toBe(false)
    expect(isCompleteAllocation([3_000, 3_000, 2_500, -1])).toBe(false)
  })
})
