// Parser do arquivo .xls (binario legado, nao .xlsx) publicado por Robert
// Shiller (Yale) com o historico de CAPE do S&P 500 - DEC-084. Unico
// parser do projeto que depende de uma biblioteca externa (`xlsx`/SheetJS)
// em vez de parser proprio: formato binario OLE2/BIFF nao e' viavel de
// reimplementar a mao no orcamento desta fatia, decisao aprovada
// explicitamente pelo usuario nesta sessao.
import * as XLSX from 'xlsx'

const DATA_SHEET_NAME = 'Data'
// A aba "Data" tem 6 linhas de cabecalho em varios niveis (titulo, autor,
// rotulos compostos) antes da linha de nomes de coluna de fato - confirmado
// contra o arquivo real (ie_data.xls): linha de indice 7 (0-based) e' a
// unica com "Date" na coluna A e "CAPE" em alguma coluna da mesma linha.
function isHeaderRow(row: unknown[]): boolean {
  return (
    row[0] === 'Date' && row.some((cell) => typeof cell === 'string' && cell.trim() === 'CAPE')
  )
}

export type ShillerCapeXlsRow = {
  rawDateValue: number
  rawCapeValue: number
  year: number
  month: number
  cape: number
}

/**
 * O campo Date do Shiller codifica ano+mes como um float `AAAA.MM` (ex.:
 * 2020.09), sem zero a esquerda garantido no mes: outubro aparece como
 * `2020.1`, nao `2020.10` (colapsa por ser o mesmo valor em ponto
 * flutuante) - confirmado contra uma serie real completa de 12 meses.
 * `Math.round` absorve o erro de precisao de ponto flutuante inerente ao
 * formato (ex.: 2020.1 armazenado como 2020.0999999999999).
 */
function decodeShillerDate(rawDate: number): { year: number; month: number } {
  const year = Math.floor(rawDate)
  const month = Math.round((rawDate - year) * 100)
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    throw new Error(`Invalid Shiller CAPE date encoding: ${rawDate}`)
  }
  return { year, month }
}

export function parseShillerCapeXls(
  buffer: ArrayBuffer
): { sheetName: string; rows: ShillerCapeXlsRow[] } {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[DATA_SHEET_NAME]
  if (!sheet) {
    throw new Error(
      `Missing Shiller CAPE "${DATA_SHEET_NAME}" sheet in workbook`
    )
  }

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  })

  const headerIndex = grid.findIndex(isHeaderRow)
  if (headerIndex === -1) {
    throw new Error('Missing Shiller CAPE header row (Date/CAPE columns)')
  }
  const header = grid[headerIndex]!
  const dateColumnIndex = 0
  const capeColumnIndex = header.findIndex(
    (cell) => typeof cell === 'string' && cell.trim() === 'CAPE'
  )
  if (capeColumnIndex === -1) {
    throw new Error('Missing Shiller CAPE column')
  }

  const rows: ShillerCapeXlsRow[] = []
  for (const row of grid.slice(headerIndex + 1)) {
    const rawDateValue = row[dateColumnIndex]
    const rawCapeValue = row[capeColumnIndex]
    if (typeof rawDateValue !== 'number' || typeof rawCapeValue !== 'number') {
      continue
    }
    if (!Number.isFinite(rawCapeValue) || rawCapeValue <= 0) {
      continue
    }
    const { year, month } = decodeShillerDate(rawDateValue)
    rows.push({ rawDateValue, rawCapeValue, year, month, cape: rawCapeValue })
  }

  return { sheetName: DATA_SHEET_NAME, rows }
}
