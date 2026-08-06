import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import {
  extractShillerCapeHistoryV1,
  extractShillerCapeRecord,
} from './provider'

const HEADER_ROW = [
  'Date',
  'S&P Comp.',
  'Dividend',
  'Earnings',
  'CPI',
  'Fraction',
  'Long Rate',
  'Real Price',
  'Real Dividend',
  'Real Earnings',
  'CAPE',
]

function buildWorkbookBuffer(dataSheetRows: unknown[][]): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(dataSheetRows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Data')
  return XLSX.write(workbook, { type: 'array', bookType: 'xls' }) as ArrayBuffer
}

describe('extractShillerCapeRecord', () => {
  it('picks the chronologically latest row and scales the CAPE value', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2019.12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 29.5],
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.123456],
    ])

    const record = extractShillerCapeRecord(buffer)

    expect(record).toEqual({
      series: 'shiller-cape-sp500',
      source: 'shiller-yale',
      referenceDate: '2020-01-01',
      valueScaled: 30_123_456,
      valueScale: 1_000_000,
      provenance: {
        dataset: 'Shiller Online Data - U.S. Stock Markets 1871-Present',
        sheetName: 'Data',
        dateColumn: { sheetName: 'Data', column: 'Date', rawValue: 2020.01 },
        capeColumn: { sheetName: 'Data', column: 'CAPE', rawValue: 30.123456 },
      },
    })
  })

  it('picks the latest month within the same year, not just the last row', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 31],
      [2020.06, 1, 1, 1, 1, 1, 1, 1, 1, 1, 29],
    ])

    const record = extractShillerCapeRecord(buffer)

    expect(record.referenceDate).toBe('2020-12-01')
    expect(record.valueScaled).toBe(31_000_000)
  })

  it('zero-pads single-digit months in referenceDate (October float quirk)', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 28],
    ])

    const record = extractShillerCapeRecord(buffer)

    expect(record.referenceDate).toBe('2020-10-01')
  })

  it('throws when the workbook has no usable data rows', () => {
    const buffer = buildWorkbookBuffer([HEADER_ROW])

    expect(() => extractShillerCapeRecord(buffer)).toThrow(
      'Shiller CAPE workbook has no usable data rows'
    )
  })

  it('throws a RangeError when the scaled value exceeds the safe integer range', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1e15],
    ])

    expect(() => extractShillerCapeRecord(buffer)).toThrow(
      'Shiller CAPE value is outside the safe integer range'
    )
  })
})

describe('extractShillerCapeHistoryV1', () => {
  it('keeps rows within the requested years of history and sorts chronologically', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2005.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 20], // too old, dropped (11y window from 2020-06)
      [2020.06, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30],
      [2015.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 25],
    ])

    const records = extractShillerCapeHistoryV1(buffer, 11)

    expect(records.map((record) => record.referenceDate)).toEqual([
      '2015-01-01',
      '2020-06-01',
    ])
  })

  it('defaults to 11 years of history', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2008.12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 20], // > 11y before 2020-06, dropped
      [2020.06, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30],
    ])

    const records = extractShillerCapeHistoryV1(buffer)

    expect(records).toHaveLength(1)
    expect(records[0]?.referenceDate).toBe('2020-06-01')
  })

  it('keeps the cutoff-year row when its month is at or after the latest month', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.06, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30], // latest
      [2009.06, 1, 1, 1, 1, 1, 1, 1, 1, 1, 18], // cutoff year (2020-11=2009), same month -> kept
      [2009.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 17], // cutoff year, earlier month -> dropped
    ])

    const records = extractShillerCapeHistoryV1(buffer, 11)

    expect(records.map((record) => record.referenceDate)).toEqual([
      '2009-06-01',
      '2020-06-01',
    ])
  })

  it('throws when the workbook has no usable data rows', () => {
    const buffer = buildWorkbookBuffer([HEADER_ROW])

    expect(() => extractShillerCapeHistoryV1(buffer)).toThrow(
      'Shiller CAPE workbook has no usable data rows'
    )
  })

  it('scales every returned record independently', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.123456],
      [2020.02, 1, 1, 1, 1, 1, 1, 1, 1, 1, 31.654321],
    ])

    const records = extractShillerCapeHistoryV1(buffer, 11)

    expect(records.map((record) => record.valueScaled)).toEqual([
      30_123_456, 31_654_321,
    ])
  })
})
