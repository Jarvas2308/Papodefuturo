import { describe, expect, it, vi } from 'vitest'
import {
  createTwelveDataProvider,
  parseTwelveDataQuote,
  parseTwelveDataUsdBrlQuote,
} from './twelveDataProvider.ts'

const assetPayload = {
  symbol: 'VOO',
  currency: 'USD',
  close: '520.45',
  datetime: '2026-07-14 15:30:00',
}

const fxPayload = {
  symbol: 'USD/BRL',
  currency: 'BRL',
  close: '5.432100',
  datetime: '2026-07-14 15:30:00',
}

describe('Twelve Data US adapter', () => {
  it.each(['VOO', 'VNQ', 'VEA'])(
    'maps the closed-universe ETF %s',
    (ticker) => {
      expect(
        parseTwelveDataQuote({ ...assetPayload, symbol: ticker }, ticker).ticker
      ).toBe(ticker)
    }
  )

  it('preserves USD currency', () => {
    expect(parseTwelveDataQuote(assetPayload, 'VOO').currency).toBe('USD')
  })

  it('converts close to cents with deterministic half-up rounding', () => {
    expect(
      parseTwelveDataQuote({ ...assetPayload, close: '520.455' }, 'VOO')
        .priceInMinorUnits
    ).toBe(52_046)
  })

  it('normalizes the provider datetime', () => {
    expect(parseTwelveDataQuote(assetPayload, 'VOO').pricedAt).toBe(
      '2026-07-14T15:30:00.000Z'
    )
  })

  it('rejects an unexpected symbol', () => {
    expect(() => parseTwelveDataQuote(assetPayload, 'VNQ')).toThrow(
      'Símbolo inesperado'
    )
  })

  it('rejects an unexpected provided currency', () => {
    expect(() =>
      parseTwelveDataQuote({ ...assetPayload, currency: 'BRL' }, 'VOO')
    ).toThrow('Moeda inesperada')
  })

  it('rejects an invalid price', () => {
    expect(() =>
      parseTwelveDataQuote({ ...assetPayload, close: 'invalid' }, 'VOO')
    ).toThrow(RangeError)
  })

  it('rejects an invalid timestamp', () => {
    expect(() =>
      parseTwelveDataQuote({ ...assetPayload, datetime: 'not-a-date' }, 'VOO')
    ).toThrow(RangeError)
  })
})

describe('Twelve Data USD/BRL adapter', () => {
  it('maps the expected pair and scaled rate', () => {
    expect(
      parseTwelveDataUsdBrlQuote(fxPayload, '2026-07-14T16:00:00.000Z')
    ).toEqual({
      ticker: 'USDBRL',
      baseCurrency: 'USD',
      quoteCurrency: 'BRL',
      rateScaled: 5_432_100,
      pricedAt: '2026-07-14T15:30:00.000Z',
    })
  })

  it('rejects an unexpected pair', () => {
    expect(() =>
      parseTwelveDataUsdBrlQuote(
        { ...fxPayload, symbol: 'EUR/BRL' },
        '2026-07-14T16:00:00.000Z'
      )
    ).toThrow('Par inesperado')
  })

  it('rejects an invalid rate', () => {
    expect(() =>
      parseTwelveDataUsdBrlQuote(
        { ...fxPayload, close: '0' },
        '2026-07-14T16:00:00.000Z'
      )
    ).toThrow(RangeError)
  })

  it('uses the Edge Function response instant when the provider omits a timestamp', () => {
    const withoutTimestamp = {
      symbol: fxPayload.symbol,
      currency: fxPayload.currency,
      close: fxPayload.close,
    }
    expect(
      parseTwelveDataUsdBrlQuote(withoutTimestamp, '2026-07-14T16:00:00.000Z')
        .pricedAt
    ).toBe('2026-07-14T16:00:00.000Z')
  })

  it('requests USD/BRL from the quote endpoint', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(fxPayload),
    })
    const provider = createTwelveDataProvider(
      'server-secret',
      fetchImplementation as unknown as typeof fetch,
      () => new Date('2026-07-14T16:00:00.000Z')
    )
    await provider.getUsdBrlQuote()
    const url = fetchImplementation.mock.calls[0]?.[0] as URL
    expect(url.pathname).toBe('/quote')
    expect(url.searchParams.get('symbol')).toBe('USD/BRL')
  })
})
