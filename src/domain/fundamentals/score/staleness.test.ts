import { describe, expect, it } from 'vitest'
import { isReferenceDateStale } from './staleness'

describe('isReferenceDateStale', () => {
  it('is not stale when the age is within the threshold', () => {
    expect(isReferenceDateStale('2026-01-01', '2026-06-01', 180)).toBe(false)
  })

  it('is not stale exactly at the threshold boundary', () => {
    // 2026-01-01 to 2026-06-30 is exactly 180 days
    expect(isReferenceDateStale('2026-01-01', '2026-06-30', 180)).toBe(false)
  })

  it('is stale one day past the threshold', () => {
    expect(isReferenceDateStale('2026-01-01', '2026-07-01', 180)).toBe(true)
  })

  it('is not stale when now equals the reference date', () => {
    expect(isReferenceDateStale('2026-06-30', '2026-06-30', 180)).toBe(false)
  })

  it('throws on an invalid reference date', () => {
    expect(() => isReferenceDateStale('not-a-date', '2026-06-30', 180)).toThrow(
      RangeError
    )
  })

  it('throws on an invalid now', () => {
    expect(() => isReferenceDateStale('2026-06-30', 'not-a-date', 180)).toThrow(
      RangeError
    )
  })
})
