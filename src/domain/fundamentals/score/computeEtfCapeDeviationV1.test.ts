import { describe, expect, it } from 'vitest'
import { computeEtfCapeDeviationV1 } from './computeEtfCapeDeviationV1'

describe('computeEtfCapeDeviationV1', () => {
  it('computes a negative deviation when the current value is below the average', () => {
    const result = computeEtfCapeDeviationV1({
      history: [
        { referenceDate: '2020-01-01', valueScaled: 20_000_000 },
        { referenceDate: '2020-02-01', valueScaled: 30_000_000 },
        { referenceDate: '2020-03-01', valueScaled: 10_000_000 },
      ],
    })

    // average = (20+30+10)/3 = 20; current (latest) = 10 -> deviation = -10
    expect(result).toEqual({
      currentScaled: 10_000_000,
      averageScaled: 20_000_000,
      deviationScaled: -10_000_000,
    })
  })

  it('computes a positive deviation when the current value is above the average', () => {
    const result = computeEtfCapeDeviationV1({
      history: [
        { referenceDate: '2020-01-01', valueScaled: 10_000_000 },
        { referenceDate: '2020-02-01', valueScaled: 30_000_000 },
      ],
    })

    expect(result.deviationScaled).toBe(10_000_000)
  })

  it('rounds the average half up on an inexact division', () => {
    const result = computeEtfCapeDeviationV1({
      history: [
        { referenceDate: '2020-01-01', valueScaled: 1 },
        { referenceDate: '2020-02-01', valueScaled: 1 },
        { referenceDate: '2020-03-01', valueScaled: 2 },
      ],
    })

    // (1+1+2)/3 = 1.33... -> rounds to 1
    expect(result.averageScaled).toBe(1)
  })

  it('excludes points older than the requested window', () => {
    const result = computeEtfCapeDeviationV1({
      history: [
        { referenceDate: '2005-01-01', valueScaled: 999_000_000 }, // outside 10y window
        { referenceDate: '2020-01-01', valueScaled: 10_000_000 },
        { referenceDate: '2020-06-01', valueScaled: 20_000_000 },
      ],
      windowYears: 10,
    })

    expect(result.averageScaled).toBe(15_000_000)
  })

  it('picks the chronologically latest point as current, not the last array entry', () => {
    const result = computeEtfCapeDeviationV1({
      history: [
        { referenceDate: '2020-06-01', valueScaled: 20_000_000 },
        { referenceDate: '2020-01-01', valueScaled: 10_000_000 },
      ],
    })

    expect(result.currentScaled).toBe(20_000_000)
  })

  it('throws when history is empty', () => {
    expect(() => computeEtfCapeDeviationV1({ history: [] })).toThrow(RangeError)
  })
})
