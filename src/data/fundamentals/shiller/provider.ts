import { parseShillerCapeXls } from './xls'
import type { ShillerCapeRecord } from './types'

const VALUE_SCALE = 1_000_000

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

/**
 * Referencia mensal (sem dia no dado original) - usa o dia 1 do mes por
 * convencao explicita, documentada aqui em vez de inferida em silencio.
 */
function buildReferenceDate(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`
}

export function extractShillerCapeRecord(
  archiveBuffer: ArrayBuffer
): ShillerCapeRecord {
  const { sheetName, rows } = parseShillerCapeXls(archiveBuffer)
  if (rows.length === 0) {
    throw new Error('Shiller CAPE workbook has no usable data rows')
  }

  const latest = rows.reduce((best, row) =>
    row.year > best.year || (row.year === best.year && row.month > best.month)
      ? row
      : best
  )

  const valueScaled = Math.round(latest.cape * VALUE_SCALE)
  if (!Number.isSafeInteger(valueScaled) || valueScaled <= 0) {
    throw new RangeError(
      `Shiller CAPE value is outside the safe integer range: ${latest.cape}`
    )
  }

  return {
    series: 'shiller-cape-sp500',
    source: 'shiller-yale',
    referenceDate: buildReferenceDate(latest.year, latest.month),
    valueScaled,
    valueScale: VALUE_SCALE,
    provenance: {
      dataset: 'Shiller Online Data - U.S. Stock Markets 1871-Present',
      sheetName,
      dateColumn: {
        sheetName,
        column: 'Date',
        rawValue: latest.rawDateValue,
      },
      capeColumn: {
        sheetName,
        column: 'CAPE',
        rawValue: latest.rawCapeValue,
      },
    },
  }
}
