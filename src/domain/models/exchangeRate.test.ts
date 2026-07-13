import { describe, expect, it } from 'vitest'
import {
  convertMoney,
  EXCHANGE_RATE_SCALE,
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
    expect(
      isValidExchangeRate({ ...usdBrlRate, quoteCurrency: 'USD' })
    ).toBe(false)
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

  it('rejects a rate that does not support the requested currency pair', () => {
    expect(() =>
      convertMoney(
        { amountInMinorUnits: 10_000, currency: 'USD' },
        'BRL',
        { ...usdBrlRate, baseCurrency: 'BRL', quoteCurrency: 'USD' }
      )
    ).not.toThrow()

    expect(() =>
      convertMoney(
        { amountInMinorUnits: 10_000, currency: 'USD' },
        'BRL',
        { ...usdBrlRate, rateScaled: 0 }
      )
    ).toThrow(RangeError)
  })
})
