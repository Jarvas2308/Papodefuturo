import { describe, expect, it } from 'vitest'
import {
  getLatestAutomaticFact,
  isAutomaticFactFresh,
  isStrictlyNewerTimestamp,
} from './freshness.ts'

const now = new Date('2026-07-14T16:00:00.000Z')

describe('market data freshness', () => {
  it('treats an automatic price younger than 60 minutes as fresh', () => {
    expect(
      isAutomaticFactFresh(
        {
          pricedAt: '2026-07-14T15:30:00.000Z',
          source: 'market-provider',
        },
        now
      )
    ).toBe(true)
  })

  it('does not use a manual price as automatic cache', () => {
    expect(
      isAutomaticFactFresh(
        { pricedAt: '2026-07-14T15:59:00.000Z', source: 'manual' },
        now
      )
    ).toBe(false)
  })

  it('requires the provider for an old automatic price', () => {
    expect(
      isAutomaticFactFresh(
        {
          pricedAt: '2026-07-14T14:59:59.000Z',
          source: 'market-provider',
        },
        now
      )
    ).toBe(false)
  })

  it('uses a fresh automatic exchange rate as cache', () => {
    const latest = getLatestAutomaticFact([
      { pricedAt: '2026-07-14T15:15:00.000Z', source: 'market-provider' },
    ])
    expect(isAutomaticFactFresh(latest, now)).toBe(true)
  })

  it('does not let a manual exchange rate block automatic refresh', () => {
    const latest = getLatestAutomaticFact([
      { pricedAt: '2026-07-14T15:59:00.000Z', source: 'manual' },
    ])
    expect(latest).toBeNull()
    expect(isAutomaticFactFresh(latest, now)).toBe(false)
  })

  it('rejects a duplicate provider timestamp', () => {
    expect(
      isStrictlyNewerTimestamp('2026-07-14T15:00:00.000Z', {
        pricedAt: '2026-07-14T15:00:00.000Z',
        source: 'market-provider',
      })
    ).toBe(false)
  })

  it('rejects a provider timestamp older than the persisted fact', () => {
    expect(
      isStrictlyNewerTimestamp('2026-07-14T14:59:59.000Z', {
        pricedAt: '2026-07-14T15:00:00.000Z',
        source: 'market-provider',
      })
    ).toBe(false)
  })
})
