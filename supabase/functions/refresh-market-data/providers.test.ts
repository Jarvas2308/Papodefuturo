import { describe, expect, it } from 'vitest'
import {
  parseHgBrasilAssetQuote,
  parseHgBrasilUsdBrlQuote,
} from './hgBrasilProvider.ts'
import { parseTwelveDataQuote } from './twelveDataProvider.ts'

const hgAssetPayload = {
  results: [
    {
      ticker: 'B3:BBAS3',
      currency: 'BRL',
      quote: {
        value: '38.17',
        updated_at: '2026-07-14T15:30:00.000Z',
      },
    },
  ],
}

const twelveDataPayload = {
  symbol: 'VOO',
  currency: 'USD',
  close: '520.45',
  datetime: '2026-07-14 15:30:00',
}

describe('HG Brasil adapter', () => {
  it('maps the expected B3 symbol', () => {
    expect(parseHgBrasilAssetQuote(hgAssetPayload, 'BBAS3').ticker).toBe(
      'BBAS3'
    )
  })

  it('preserves BRL currency', () => {
    expect(parseHgBrasilAssetQuote(hgAssetPayload, 'BBAS3').currency).toBe(
      'BRL'
    )
  })

  it('uses quote.value as the price', () => {
    expect(
      parseHgBrasilAssetQuote(hgAssetPayload, 'BBAS3').priceInMinorUnits
    ).toBe(3_817)
  })

  it('uses quote.updated_at as the timestamp', () => {
    expect(parseHgBrasilAssetQuote(hgAssetPayload, 'BBAS3').pricedAt).toBe(
      '2026-07-14T15:30:00.000Z'
    )
  })

  it('rejects an unexpected symbol', () => {
    expect(() => parseHgBrasilAssetQuote(hgAssetPayload, 'ITSA4')).toThrow(
      'Símbolo inesperado'
    )
  })

  it('rejects an unexpected currency', () => {
    expect(() =>
      parseHgBrasilAssetQuote(
        {
          results: [{ ...hgAssetPayload.results[0], currency: 'USD' }],
        },
        'BBAS3'
      )
    ).toThrow('Moeda inesperada')
  })

  it('rejects an invalid price', () => {
    expect(() =>
      parseHgBrasilAssetQuote(
        {
          results: [
            {
              ...hgAssetPayload.results[0],
              quote: { ...hgAssetPayload.results[0].quote, value: '0' },
            },
          ],
        },
        'BBAS3'
      )
    ).toThrow(RangeError)
  })

  it('maps FOREX:USDBRL to the direct USD/BRL pair', () => {
    const result = parseHgBrasilUsdBrlQuote({
      results: [
        {
          ticker: 'FOREX:USDBRL',
          currency: 'BRL',
          quote: {
            value: '5.432100',
            updated_at: '2026-07-14T15:30:00.000Z',
          },
        },
      ],
    })

    expect(result).toMatchObject({
      ticker: 'USDBRL',
      baseCurrency: 'USD',
      quoteCurrency: 'BRL',
    })
  })

  it('produces the scaled exchange rate', () => {
    const result = parseHgBrasilUsdBrlQuote({
      results: {
        USDBRL: {
          symbol: 'FOREX:USDBRL',
          quote: {
            value: '5.432100',
            updated_at: '2026-07-14T15:30:00.000Z',
          },
        },
      },
    })

    expect(result.rateScaled).toBe(5_432_100)
  })
})

describe('Twelve Data adapter', () => {
  it('maps VOO', () => {
    expect(parseTwelveDataQuote(twelveDataPayload, 'VOO').ticker).toBe('VOO')
  })

  it('preserves USD currency', () => {
    expect(parseTwelveDataQuote(twelveDataPayload, 'VOO').currency).toBe('USD')
  })

  it('extracts the close from the quote contract', () => {
    expect(
      parseTwelveDataQuote(twelveDataPayload, 'VOO').priceInMinorUnits
    ).toBe(52_045)
  })

  it('normalizes the provider datetime', () => {
    expect(parseTwelveDataQuote(twelveDataPayload, 'VOO').pricedAt).toBe(
      '2026-07-14T15:30:00.000Z'
    )
  })

  it('rejects an unexpected symbol', () => {
    expect(() => parseTwelveDataQuote(twelveDataPayload, 'VNQ')).toThrow(
      'Símbolo inesperado'
    )
  })

  it('rejects an unexpected provided currency', () => {
    expect(() =>
      parseTwelveDataQuote({ ...twelveDataPayload, currency: 'BRL' }, 'VOO')
    ).toThrow('Moeda inesperada')
  })

  it('rejects an invalid price', () => {
    expect(() =>
      parseTwelveDataQuote({ ...twelveDataPayload, close: 'invalid' }, 'VOO')
    ).toThrow(RangeError)
  })

  it('rejects an invalid timestamp', () => {
    expect(() =>
      parseTwelveDataQuote(
        { ...twelveDataPayload, datetime: 'not-a-date' },
        'VOO'
      )
    ).toThrow(RangeError)
  })
})
