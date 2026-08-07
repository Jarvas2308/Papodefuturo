import { describe, expect, it } from 'vitest'
import {
  normalizeCotahistTradingDateToCivilDate,
  parseCotahistAnnualCloseSeriesV1,
  parseCotahistPriceInMinorUnits,
} from './b3CotahistAnnualCloseSeriesV1'

function buildRecord({
  ticker = 'BBAS3',
  tradingDate = '20251230',
  bdiCode = '02',
  marketType = '010',
  lastPrice = '0000000002192',
}: {
  ticker?: string
  tradingDate?: string
  bdiCode?: string
  marketType?: string
  lastPrice?: string
} = {}): string {
  const record = Array<string>(245).fill(' ')

  function write(offset: number, value: string) {
    value.split('').forEach((character, index) => {
      record[offset + index] = character
    })
  }

  write(0, '01')
  write(2, tradingDate)
  write(10, bdiCode)
  write(12, ticker.padEnd(12, ' '))
  write(24, marketType)
  write(108, lastPrice)

  return record.join('')
}

describe('parseCotahistPriceInMinorUnits', () => {
  it('parses 13-digit PREULT into minor units', () => {
    expect(parseCotahistPriceInMinorUnits('0000000002192')).toBe(2_192)
  })

  it('rejects malformed values', () => {
    expect(() => parseCotahistPriceInMinorUnits('abc')).toThrow(/13 digits/)
  })
})

describe('normalizeCotahistTradingDateToCivilDate', () => {
  it('normalizes YYYYMMDD to YYYY-MM-DD', () => {
    expect(normalizeCotahistTradingDateToCivilDate('20251230')).toBe(
      '2025-12-30'
    )
  })

  it('rejects an invalid calendar date', () => {
    expect(() => normalizeCotahistTradingDateToCivilDate('20250230')).toThrow(
      /invalid/
    )
  })
})

describe('parseCotahistAnnualCloseSeriesV1', () => {
  it('ignores header and trailer records', () => {
    const content = [`00${' '.repeat(243)}`, `99${' '.repeat(243)}`].join('\n')
    expect(parseCotahistAnnualCloseSeriesV1(content, ['BBAS3']).size).toBe(0)
  })

  it('builds the full ascending series per requested ticker, ignoring others', () => {
    const content = [
      buildRecord({
        ticker: 'BBAS3',
        tradingDate: '20251229',
        lastPrice: '0000000002100',
      }),
      buildRecord({
        ticker: 'BBAS3',
        tradingDate: '20251230',
        lastPrice: '0000000002192',
      }),
      buildRecord({
        ticker: 'WEGE3',
        tradingDate: '20251230',
        lastPrice: '0000000005000',
      }),
    ].join('\n')

    const series = parseCotahistAnnualCloseSeriesV1(content, ['BBAS3'])

    expect(series.size).toBe(1)
    expect(series.get('BBAS3')).toEqual([
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-29',
        closePriceInMinorUnits: 2_100,
      },
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-30',
        closePriceInMinorUnits: 2_192,
      },
    ])
  })

  it('ignores unsupported BDI codes and market types', () => {
    const content = [
      buildRecord({ bdiCode: '99' }),
      buildRecord({ marketType: '020' }),
    ].join('\n')

    expect(parseCotahistAnnualCloseSeriesV1(content, ['BBAS3']).size).toBe(0)
  })

  it('ignores malformed lines instead of throwing', () => {
    const content = ['too-short-line', buildRecord()].join('\n')

    const series = parseCotahistAnnualCloseSeriesV1(content, ['BBAS3'])
    expect(series.get('BBAS3')).toHaveLength(1)
  })
})
