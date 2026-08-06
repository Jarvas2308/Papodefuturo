import { parseShillerCapeXls, type ShillerCapeXlsRow } from './xls'
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

function toRecord(
  sheetName: string,
  row: ShillerCapeXlsRow
): ShillerCapeRecord {
  const valueScaled = Math.round(row.cape * VALUE_SCALE)
  if (!Number.isSafeInteger(valueScaled) || valueScaled <= 0) {
    throw new RangeError(
      `Shiller CAPE value is outside the safe integer range: ${row.cape}`
    )
  }

  return {
    series: 'shiller-cape-sp500',
    source: 'shiller-yale',
    referenceDate: buildReferenceDate(row.year, row.month),
    valueScaled,
    valueScale: VALUE_SCALE,
    provenance: {
      dataset: 'Shiller Online Data - U.S. Stock Markets 1871-Present',
      sheetName,
      dateColumn: {
        sheetName,
        column: 'Date',
        rawValue: row.rawDateValue,
      },
      capeColumn: {
        sheetName,
        column: 'CAPE',
        rawValue: row.rawCapeValue,
      },
    },
  }
}

function findLatestRow(rows: readonly ShillerCapeXlsRow[]): ShillerCapeXlsRow {
  return rows.reduce((best, row) =>
    row.year > best.year || (row.year === best.year && row.month > best.month)
      ? row
      : best
  )
}

export function extractShillerCapeRecord(
  archiveBuffer: ArrayBuffer
): ShillerCapeRecord {
  const { sheetName, rows } = parseShillerCapeXls(archiveBuffer)
  if (rows.length === 0) {
    throw new Error('Shiller CAPE workbook has no usable data rows')
  }

  return toRecord(sheetName, findLatestRow(rows))
}

// Extrai N anos de historico (nao so o ponto mais recente) - Sprint 16,
// Fase 5 fatia ETF (DEC-091). O arquivo baixado ja contem a serie completa
// desde 1871; extractShillerCapeRecord descarta tudo exceto o ultimo ponto
// de proposito (Fase 4, DEC-084, so precisava do valor atual). Esta funcao
// existe para o sinal "CAPE vs propria media historica de 10 anos"
// (REGRAS_DE_PONTUACAO_RASCUNHO.md, secao 4), que precisa da serie, nao so
// do ponto atual. `yearsOfHistory` tem folga de 1 ano sobre a janela de 10
// anos usada no calculo da media, para garantir cobertura mesmo com meses
// faltantes na fonte.
export function extractShillerCapeHistoryV1(
  archiveBuffer: ArrayBuffer,
  yearsOfHistory = 11
): ShillerCapeRecord[] {
  const { sheetName, rows } = parseShillerCapeXls(archiveBuffer)
  if (rows.length === 0) {
    throw new Error('Shiller CAPE workbook has no usable data rows')
  }

  const latest = findLatestRow(rows)
  const cutoffYear = latest.year - yearsOfHistory

  return rows
    .filter(
      (row) =>
        row.year > cutoffYear ||
        (row.year === cutoffYear && row.month >= latest.month)
    )
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((row) => toRecord(sheetName, row))
}
