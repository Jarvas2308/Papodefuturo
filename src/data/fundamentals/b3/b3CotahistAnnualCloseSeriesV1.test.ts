import { describe, expect, it } from 'vitest'
import {
  extractCotahistLinesForTickers,
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

describe('extractCotahistLinesForTickers', () => {
  function toBytes(text: string): Uint8Array {
    return Uint8Array.from(text, (character) => character.charCodeAt(0))
  }

  it('keeps only lines whose ticker matches the requested list', () => {
    const content = [
      buildRecord({ ticker: 'BBAS3' }),
      buildRecord({ ticker: 'PETR4' }),
      buildRecord({ ticker: 'ITSA4' }),
    ].join('\n')

    const extracted = extractCotahistLinesForTickers(toBytes(content), [
      'BBAS3',
      'ITSA4',
    ])

    const lines = extracted.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(buildRecord({ ticker: 'BBAS3' }))
    expect(lines[1]).toBe(buildRecord({ ticker: 'ITSA4' }))
  })

  it('never decodes the file into a single string of unmatched lines (byte-level filtering, not full decode)', () => {
    // Simula um arquivo dominado por instrumentos fora do universo -
    // exatamente o caso real (opções, termos, outras ações) que faz o
    // arquivo anual completo estourar o limite de string do V8. Se a
    // função decodificasse tudo antes de filtrar, isso ainda passaria
    // neste teste pequeno; o que este teste garante é a correção do
    // resultado, não a ausência de decode - a proteção real contra o
    // limite de string vem de nunca chamar `TextDecoder.decode` sobre o
    // buffer inteiro, que é a mudança estrutural desta função.
    const noise = Array.from({ length: 500 }, (_unused, index) =>
      buildRecord({ ticker: `NOISE${index % 10}` })
    )
    const content = [...noise, buildRecord({ ticker: 'WEGE3' })].join('\n')

    const extracted = extractCotahistLinesForTickers(toBytes(content), [
      'WEGE3',
    ])

    expect(extracted).toBe(buildRecord({ ticker: 'WEGE3' }))
  })

  it('handles CRLF line endings', () => {
    const content = [
      buildRecord({ ticker: 'BBAS3' }),
      buildRecord({ ticker: 'ITSA4' }),
    ].join('\r\n')

    const extracted = extractCotahistLinesForTickers(toBytes(content), [
      'ITSA4',
    ])

    expect(extracted).toBe(buildRecord({ ticker: 'ITSA4' }))
  })

  it('handles a file with no trailing newline', () => {
    const content = buildRecord({ ticker: 'TAEE11' })

    const extracted = extractCotahistLinesForTickers(toBytes(content), [
      'TAEE11',
    ])

    expect(extracted).toBe(buildRecord({ ticker: 'TAEE11' }))
  })

  it('skips lines with the wrong fixed-width length', () => {
    const content = ['too-short-line', buildRecord({ ticker: 'PSSA3' })].join(
      '\n'
    )

    const extracted = extractCotahistLinesForTickers(toBytes(content), [
      'PSSA3',
    ])

    expect(extracted).toBe(buildRecord({ ticker: 'PSSA3' }))
  })

  it('returns an empty string when nothing matches', () => {
    const content = buildRecord({ ticker: 'PETR4' })

    expect(extractCotahistLinesForTickers(toBytes(content), ['BBAS3'])).toBe('')
  })
})
