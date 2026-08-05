import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseShillerCapeXls } from './xls'

function buildWorkbookBuffer(dataSheetRows: unknown[][]): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(dataSheetRows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Data')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xls' })
  return buffer as ArrayBuffer
}

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

describe('parseShillerCapeXls', () => {
  it('parses rows after the header, skipping the preamble', () => {
    const buffer = buildWorkbookBuffer([
      ['Shiller Online Data'],
      ['Author: Robert Shiller'],
      [],
      [],
      [],
      [],
      HEADER_ROW,
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.1234],
      [2020.02, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.5],
    ])

    const { sheetName, rows } = parseShillerCapeXls(buffer)

    expect(sheetName).toBe('Data')
    expect(rows).toEqual([
      { rawDateValue: 2020.01, rawCapeValue: 30.1234, year: 2020, month: 1, cape: 30.1234 },
      { rawDateValue: 2020.02, rawCapeValue: 30.5, year: 2020, month: 2, cape: 30.5 },
    ])
  })

  it('decodes October as the collapsed float 2020.1 (not 2020.10)', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 28.9],
    ])

    const { rows } = parseShillerCapeXls(buffer)

    expect(rows).toEqual([
      { rawDateValue: 2020.1, rawCapeValue: 28.9, year: 2020, month: 10, cape: 28.9 },
    ])
  })

  it('skips rows where CAPE is the string "NA"', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'NA'],
      [2020.02, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.5],
    ])

    const { rows } = parseShillerCapeXls(buffer)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.month).toBe(2)
  })

  it('skips blank rows with no date or CAPE value', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [],
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.1234],
    ])

    const { rows } = parseShillerCapeXls(buffer)

    expect(rows).toHaveLength(1)
  })

  it('skips rows with a non-positive CAPE value', () => {
    const buffer = buildWorkbookBuffer([
      HEADER_ROW,
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [2020.02, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.5],
    ])

    const { rows } = parseShillerCapeXls(buffer)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.month).toBe(2)
  })

  it('throws when the Data sheet is missing', () => {
    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.aoa_to_sheet([['nothing here']])
    XLSX.utils.book_append_sheet(workbook, sheet, 'NotData')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xls' }) as ArrayBuffer

    expect(() => parseShillerCapeXls(buffer)).toThrow(
      'Missing Shiller CAPE "Data" sheet in workbook'
    )
  })

  it('throws when no header row with Date/CAPE columns is found', () => {
    const buffer = buildWorkbookBuffer([
      ['not', 'a', 'header'],
      [2020.01, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30.1234],
    ])

    expect(() => parseShillerCapeXls(buffer)).toThrow(
      'Missing Shiller CAPE header row (Date/CAPE columns)'
    )
  })

  it('throws on an invalid encoded month', () => {
    const buffer = buildWorkbookBuffer([HEADER_ROW, [2020.99, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30]])

    expect(() => parseShillerCapeXls(buffer)).toThrow('Invalid Shiller CAPE date encoding')
  })
})
