// Parser da tabela `composicao_capital` do DFP/ITR (DEC-081) - insumo de
// cotas emitidas para LPA/P-L. Estruturalmente diferente das demonstracoes
// contabeis (BPA/BPP/DRE/DFC): nao tem CD_CVM (so CNPJ_CIA), nao tem
// CD_CONTA/DS_CONTA/VL_CONTA (colunas fixas de quantidade de acoes), e o
// nome do arquivo nao segue o padrao `_con_YYYY.csv` das demonstracoes.
import { normalizeExactDecimalQuantity } from '../../../domain/fundamentals'
import type { CvmCapitalCompositionRow } from './types'

const REQUIRED_HEADERS = [
  'CNPJ_CIA',
  'DT_REFER',
  'VERSAO',
  'DENOM_CIA',
  'QT_ACAO_ORDIN_CAP_INTEGR',
  'QT_ACAO_PREF_CAP_INTEGR',
  'QT_ACAO_TOTAL_CAP_INTEGR',
] as const

export type CvmCapitalCompositionDocument = {
  fileName: string
  content: string
}

function parseDelimitedRows(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]

    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }

    if (character === '"') {
      quoted = true
    } else if (character === ';') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      if (row.some((value) => value.length > 0)) {
        rows.push(row)
      }
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) {
    throw new Error(
      'Invalid CVM capital composition CSV: unterminated quoted field'
    )
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  return rows
}

function readField(
  values: readonly string[],
  indexes: ReadonlyMap<string, number>,
  header: string
): string {
  const index = indexes.get(header)
  if (index === undefined) {
    throw new Error(`Missing CVM capital composition CSV header: ${header}`)
  }
  return values[index] ?? ''
}

export function parseCvmCapitalCompositionCsv(
  document: CvmCapitalCompositionDocument
): CvmCapitalCompositionRow[] {
  const [headers, ...rows] = parseDelimitedRows(document.content)
  if (!headers) {
    throw new Error(
      `Empty CVM capital composition CSV document: ${document.fileName}`
    )
  }

  const bomPattern = new RegExp(`^${String.fromCharCode(0xfeff)}`)
  const normalizedHeaders = headers.map((header) =>
    header.replace(bomPattern, '').trim()
  )
  const indexes = new Map(
    normalizedHeaders.map((header, index) => [header, index])
  )

  for (const header of REQUIRED_HEADERS) {
    if (!indexes.has(header)) {
      throw new Error(
        `Missing CVM capital composition CSV header ${header}: ${document.fileName}`
      )
    }
  }

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_CIA'),
    referenceDate: readField(values, indexes, 'DT_REFER'),
    version: readField(values, indexes, 'VERSAO'),
    companyName: readField(values, indexes, 'DENOM_CIA'),
    ordinaryShares: readField(values, indexes, 'QT_ACAO_ORDIN_CAP_INTEGR'),
    preferredShares: readField(values, indexes, 'QT_ACAO_PREF_CAP_INTEGR'),
    totalShares: readField(values, indexes, 'QT_ACAO_TOTAL_CAP_INTEGR'),
  }))
}

const NON_NEGATIVE_INTEGER_PATTERN = /^\+?(\d+)$/

/**
 * Quantidade de acoes e' sempre inteira nos dados reais observados (sem
 * casas decimais) - scale sempre 0. Reaproveita `ExactDecimalQuantity`
 * (mesmo tipo usado por cotas de FII) por consistencia de dominio, nao
 * porque haja fracao aqui.
 */
export function parseCvmShareQuantity(
  value: string,
  description: string
): ReturnType<typeof normalizeExactDecimalQuantity> | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = NON_NEGATIVE_INTEGER_PATTERN.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid CVM ${description}: ${value}`)
  }

  const unscaledValue = Number(match[1])
  if (!Number.isSafeInteger(unscaledValue)) {
    throw new RangeError(`CVM ${description} is outside the safe integer range`)
  }

  return normalizeExactDecimalQuantity(
    { unscaledValue, scale: 0 },
    `CVM ${description}`
  )
}
