import { describe, expect, it } from 'vitest'
import {
  normalizeCotahistTradingDate,
  parseCotahistPriceInMinorUnits,
  parseCotahistQuotes,
  parseCotahistRecord,
} from './b3CotahistParser.ts'

function buildRecord({
  ticker = 'BBAS3',
  tradingDate = '20260714',
  bdiCode = '02',
  marketType = '010',
  lastPrice = '0000000003817',
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

describe('COTAHIST fixed-width parser', () => {
  it('ignores the header record', () => {
    expect(parseCotahistRecord(`00${' '.repeat(243)}`)).toBeNull()
  })

  it('ignores the trailer record', () => {
    expect(parseCotahistRecord(`99${' '.repeat(243)}`)).toBeNull()
  })

  it('extracts the official quote fields and trims CODNEG', () => {
    expect(parseCotahistRecord(buildRecord())).toEqual({
      recordType: '01',
      tradingDate: '20260714',
      bdiCode: '02',
      ticker: 'BBAS3',
      marketType: '010',
      priceInMinorUnits: 3_817,
      pricedAt: '2026-07-14T21:00:00.000Z',
    })
  })

  it('converts PREULT directly to minor units', () => {
    expect(parseCotahistPriceInMinorUnits('0000000003817')).toBe(3_817)
  })

  it('rejects malformed PREULT', () => {
    expect(() => parseCotahistPriceInMinorUnits('00000000A3817')).toThrow(
      RangeError
    )
  })

  it('rejects zero PREULT', () => {
    expect(() => parseCotahistPriceInMinorUnits('0000000000000')).toThrow(
      RangeError
    )
  })

  it('normalizes DATAPRE to the fixed UTC convention', () => {
    expect(normalizeCotahistTradingDate('20260714')).toBe(
      '2026-07-14T21:00:00.000Z'
    )
  })

  it('rejects invalid calendar dates', () => {
    expect(() => normalizeCotahistTradingDate('20260230')).toThrow(RangeError)
  })

  it('ignores non-cash markets', () => {
    expect(parseCotahistRecord(buildRecord({ marketType: '070' }))).toBeNull()
  })

  it('ignores unsupported BDI classifications', () => {
    expect(parseCotahistRecord(buildRecord({ bdiCode: '78' }))).toBeNull()
  })

  it('finds a Brazilian stock from the requested universe', () => {
    expect(parseCotahistQuotes(buildRecord(), ['BBAS3'])).toHaveLength(1)
  })

  it('finds a real-estate fund using its official BDI code', () => {
    const quote = parseCotahistQuotes(
      buildRecord({ ticker: 'KNRI11', bdiCode: '12' }),
      ['KNRI11']
    )
    expect(quote[0]?.ticker).toBe('KNRI11')
  })

  it('selects the newest trading date for each ticker', () => {
    const content = [
      buildRecord({ tradingDate: '20260711', lastPrice: '0000000003700' }),
      buildRecord({ tradingDate: '20260714', lastPrice: '0000000003817' }),
    ].join('\n')
    expect(parseCotahistQuotes(content, ['BBAS3'])[0]).toMatchObject({
      priceInMinorUnits: 3_817,
      pricedAt: '2026-07-14T21:00:00.000Z',
    })
  })

  it('does not depend on record order', () => {
    const older = buildRecord({
      tradingDate: '20260711',
      lastPrice: '0000000003700',
    })
    const newer = buildRecord({
      tradingDate: '20260714',
      lastPrice: '0000000003817',
    })
    expect(parseCotahistQuotes(`${older}\n${newer}`, ['BBAS3'])).toEqual(
      parseCotahistQuotes(`${newer}\n${older}`, ['BBAS3'])
    )
  })

  it('does not create a quote for a missing ticker', () => {
    expect(parseCotahistQuotes(buildRecord(), ['ITSA4'])).toEqual([])
  })
})
