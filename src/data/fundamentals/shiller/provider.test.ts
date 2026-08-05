import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { extractShillerCapeRecord } from './provider'

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
