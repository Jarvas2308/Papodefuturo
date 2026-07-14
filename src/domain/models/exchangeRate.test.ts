import { describe, expect, it } from 'vitest'
import {
  convertMoney,
  EXCHANGE_RATE_SCALE,
  getLatestUsdBrlRate,
  isValidExchangeRate,
  type ExchangeRate,
} from './exchangeRate'

const usdBrlRate: ExchangeRate = {
  id: 'usd-brl-rate',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_432_100,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

describe('exchange rate domain model', () => {
  it('validates a positive scaled rate between distinct currencies', () => {
    expect(isValidExchangeRate(usdBrlRate)).toBe(true)
    expect(isValidExchangeRate({ ...usdBrlRate, quoteCurrency: 'USD' })).toBe(
      false
    )
    expect(isValidExchangeRate({ ...usdBrlRate, rateScaled: 0 })).toBe(false)
  })

  it('converts USD minor units to BRL using integer scaled rate', () => {
    expect(
      convertMoney(
        { amountInMinorUnits: 10_000, currency: 'USD' },
        'BRL',
        usdBrlRate
      )
    ).toEqual({ amountInMinorUnits: 54_321, currency: 'BRL' })
  })

  it('supports the inverse BRL to USD conversion', () => {
    expect(
      convertMoney(
        { amountInMinorUnits: 54_321, currency: 'BRL' },
        'USD',
        usdBrlRate
      )
    ).toEqual({ amountInMinorUnits: 10_000, currency: 'USD' })
  })

  it('keeps money unchanged when it already uses the target currency', () => {
    const money = { amountInMinorUnits: 12_345, currency: 'BRL' } as const

    expect(convertMoney(money, 'BRL', usdBrlRate)).toBe(money)
  })

  it('rejects an invalid exchange rate', () => {
    expect(() =>
      convertMoney({ amountInMinorUnits: 10_000, currency: 'USD' }, 'BRL', {
        ...usdBrlRate,
        rateScaled: 0,
      })
    ).toThrow(RangeError)
  })

  it('rejects a rate that does not support the requested currency pair', () => {
    const unsupportedRate: ExchangeRate = {
      ...usdBrlRate,
      quoteCurrency: 'EUR' as ExchangeRate['quoteCurrency'],
    }

    expect(() =>
      convertMoney(
        { amountInMinorUnits: 10_000, currency: 'USD' },
        'BRL',
        unsupportedRate
      )
    ).toThrow(RangeError)
  })

  it('rejects a fractional amount in minor units', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: 10_000.5, currency: 'USD' },
        'BRL',
        usdBrlRate
      )
    ).toThrow(RangeError)
  })

  it('rejects a NaN amount in minor units', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: Number.NaN, currency: 'USD' },
        'BRL',
        usdBrlRate
      )
    ).toThrow(RangeError)
  })

  it('rejects an infinite amount in minor units', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: Number.POSITIVE_INFINITY, currency: 'USD' },
        'BRL',
        usdBrlRate
      )
    ).toThrow(RangeError)
  })

  it('rejects an unsafe amount before the same-currency early return', () => {
    expect(() =>
      convertMoney(
        {
          amountInMinorUnits: Number.MAX_SAFE_INTEGER + 1,
          currency: 'BRL',
        },
        'BRL',
        usdBrlRate
      )
    ).toThrow(RangeError)
  })

  it('rejects a negative amount in minor units', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: -1, currency: 'USD' },
        'BRL',
        usdBrlRate
      )
    ).toThrow(RangeError)
  })

  it('rounds down when the remainder is below half', () => {
    expect(
      convertMoney({ amountInMinorUnits: 1, currency: 'USD' }, 'BRL', {
        ...usdBrlRate,
        rateScaled: 499_999,
      })
    ).toEqual({ amountInMinorUnits: 0, currency: 'BRL' })
  })

  it('rounds up when the remainder is exactly half', () => {
    expect(
      convertMoney({ amountInMinorUnits: 1, currency: 'USD' }, 'BRL', {
        ...usdBrlRate,
        rateScaled: 500_000,
      })
    ).toEqual({ amountInMinorUnits: 1, currency: 'BRL' })
  })

  it('rounds up when the remainder is above half', () => {
    expect(
      convertMoney({ amountInMinorUnits: 1, currency: 'USD' }, 'BRL', {
        ...usdBrlRate,
        rateScaled: 500_001,
      })
    ).toEqual({ amountInMinorUnits: 1, currency: 'BRL' })
  })

  it('keeps direct conversion exact when the intermediate product is unsafe as a number', () => {
    const amountInMinorUnits = 9_007_199_254_728_646
    const rateScaled = 761

    expect(Number.isSafeInteger(amountInMinorUnits * rateScaled)).toBe(false)
    expect(
      convertMoney({ amountInMinorUnits, currency: 'USD' }, 'BRL', {
        ...usdBrlRate,
        rateScaled,
      })
    ).toEqual({ amountInMinorUnits: 6_854_478_632_848, currency: 'BRL' })
  })

  it('keeps inverse conversion exact when the intermediate product is unsafe as a number', () => {
    const amountInMinorUnits = 9_007_199_254_728_646
    const rateScaled = 1_000_001

    expect(Number.isSafeInteger(amountInMinorUnits * EXCHANGE_RATE_SCALE)).toBe(
      false
    )
    expect(
      convertMoney({ amountInMinorUnits, currency: 'BRL' }, 'USD', {
        ...usdBrlRate,
        rateScaled,
      })
    ).toEqual({ amountInMinorUnits: 9_007_190_247_538_398, currency: 'USD' })
  })

  it('rejects a converted result outside the safe integer range', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: Number.MAX_SAFE_INTEGER, currency: 'USD' },
        'BRL',
        { ...usdBrlRate, rateScaled: 2_000_000 }
      )
    ).toThrow(RangeError)
  })

  it('returns the converted amount as a number', () => {
    const converted = convertMoney(
      { amountInMinorUnits: 10_000, currency: 'USD' },
      'BRL',
      usdBrlRate
    )

    expect(typeof converted.amountInMinorUnits).toBe('number')
  })

  it('selects the latest USD/BRL rate by pricedAt from an out-of-order list', () => {
    const newestRate = {
      ...usdBrlRate,
      id: 'newest-rate',
      rateScaled: 5_500_000,
      pricedAt: '2026-07-14T12:00:00.000Z',
    }
    const oldestRate = {
      ...usdBrlRate,
      id: 'oldest-rate',
      rateScaled: 4_900_000,
      pricedAt: '2026-07-12T12:00:00.000Z',
    }

    expect(getLatestUsdBrlRate([usdBrlRate, newestRate, oldestRate])).toBe(
      newestRate
    )
  })

  it('accepts a direct USD/BRL pair', () => {
    expect(getLatestUsdBrlRate([usdBrlRate])).toBe(usdBrlRate)
  })

  it('accepts an inverse BRL/USD pair', () => {
    const inverseRate: ExchangeRate = {
      ...usdBrlRate,
      id: 'brl-usd-rate',
      baseCurrency: 'BRL',
      quoteCurrency: 'USD',
      rateScaled: 200_000,
    }

    expect(getLatestUsdBrlRate([inverseRate])).toBe(inverseRate)
  })

  it('ignores invalid, unrelated, and undated rates', () => {
    expect(
      getLatestUsdBrlRate([
        { ...usdBrlRate, rateScaled: 0 },
        { ...usdBrlRate, pricedAt: 'invalid-date' },
        {
          ...usdBrlRate,
          baseCurrency: 'BRL',
          quoteCurrency: 'BRL',
        },
      ])
    ).toBeNull()
  })
})
