import { describe, expect, it } from 'vitest'
import { allocateByWeights } from './allocateByWeights'

describe('allocateByWeights', () => {
  it('preserves the exact total across multiple weighted items', () => {
    const result = allocateByWeights(1000, [
      { id: 'a', weight: 3, originalOrder: 0 },
      { id: 'b', weight: 2, originalOrder: 1 },
      { id: 'c', weight: 1, originalOrder: 2 },
    ])

    expect(result).toEqual([
      { id: 'a', valueInCents: 500 },
      { id: 'b', valueInCents: 333 },
      { id: 'c', valueInCents: 167 },
    ])
  })

  it('assigns remainder ties by original order', () => {
    expect(
      allocateByWeights(2, [
        { id: 'first', weight: 1, originalOrder: 0 },
        { id: 'second', weight: 1, originalOrder: 1 },
        { id: 'third', weight: 1, originalOrder: 2 },
      ])
    ).toEqual([
      { id: 'first', valueInCents: 1 },
      { id: 'second', valueInCents: 1 },
      { id: 'third', valueInCents: 0 },
    ])
  })

  it('allocates one cent and keeps zero-weight items at zero', () => {
    expect(
      allocateByWeights(1, [
        { id: 'zero', weight: 0, originalOrder: 0 },
        { id: 'eligible', weight: 5, originalOrder: 1 },
      ])
    ).toEqual([
      { id: 'zero', valueInCents: 0 },
      { id: 'eligible', valueInCents: 1 },
    ])
  })

  it('returns integer zero allocations for a zero contribution', () => {
    expect(
      allocateByWeights(0, [
        { id: 'a', weight: 1, originalOrder: 0 },
        { id: 'b', weight: 1, originalOrder: 1 },
      ])
    ).toEqual([
      { id: 'a', valueInCents: 0 },
      { id: 'b', valueInCents: 0 },
    ])
  })

  it('is deterministic for repeated input', () => {
    const items = [
      { id: 'a', weight: 7, originalOrder: 0 },
      { id: 'b', weight: 11, originalOrder: 1 },
    ]
    expect(allocateByWeights(123_456, items)).toEqual(
      allocateByWeights(123_456, items)
    )
  })

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid total %s',
    (total) => {
      expect(() =>
        allocateByWeights(total, [{ id: 'a', weight: 1, originalOrder: 0 }])
      ).toThrow(RangeError)
    }
  )

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid weight %s',
    (weight) => {
      expect(() =>
        allocateByWeights(100, [{ id: 'a', weight, originalOrder: 0 }])
      ).toThrow(RangeError)
    }
  )
})
