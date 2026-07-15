import type {
  CvmStatement,
  CvmStatementDocument,
  CvmStatementRow,
} from './types'

const REQUIRED_HEADERS = [
  'CNPJ_CIA',
  'DENOM_CIA',
  'CD_CVM',
  'GRUPO_DFP',
  'DT_REFER',
  'VERSAO',
  'MOEDA',
  'ESCALA_MOEDA',
  'ORDEM_EXERC',
  'DT_FIM_EXERC',
  'CD_CONTA',
  'DS_CONTA',
  'VL_CONTA',
] as const

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
    throw new Error('Invalid CVM CSV: unterminated quoted field')
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  return rows
}

function readField(
  values: readonly string[],
  headerIndexes: ReadonlyMap<string, number>,
  header: string
): string {
  const index = headerIndexes.get(header)
  if (index === undefined) {
    throw new Error(`Missing CVM CSV header: ${header}`)
  }
  return values[index] ?? ''
}

function toStatementRow(
  values: readonly string[],
  headerIndexes: ReadonlyMap<string, number>,
  statement: CvmStatement
): CvmStatementRow {
  return {
    companyName: readField(values, headerIndexes, 'DENOM_CIA'),
    companyCnpj: readField(values, headerIndexes, 'CNPJ_CIA'),
    cvmCode: readField(values, headerIndexes, 'CD_CVM'),
    referenceDate: readField(values, headerIndexes, 'DT_REFER'),
    version: readField(values, headerIndexes, 'VERSAO'),
    currency: readField(values, headerIndexes, 'MOEDA'),
    currencyScale: readField(values, headerIndexes, 'ESCALA_MOEDA'),
    exerciseOrder: readField(values, headerIndexes, 'ORDEM_EXERC'),
    exerciseStartDate: headerIndexes.has('DT_INI_EXERC')
      ? readField(values, headerIndexes, 'DT_INI_EXERC') || null
      : null,
    exerciseEndDate: readField(values, headerIndexes, 'DT_FIM_EXERC'),
    accountCode: readField(values, headerIndexes, 'CD_CONTA'),
    accountDescription: readField(values, headerIndexes, 'DS_CONTA'),
    accountValue: readField(values, headerIndexes, 'VL_CONTA'),
    statement,
  }
}

export function parseCvmStatementCsv(
  document: CvmStatementDocument
): CvmStatementRow[] {
  if (!/_con_\d{4}\.csv$/i.test(document.fileName)) {
    throw new Error(
      `Only consolidated CVM statements are supported: ${document.fileName}`
    )
  }

  const [headers, ...rows] = parseDelimitedRows(document.content)
  if (!headers) {
    throw new Error(`Empty CVM CSV document: ${document.fileName}`)
  }

  const normalizedHeaders = headers.map((header) =>
    header.replace(/^\uFEFF/, '').trim()
  )
  const headerIndexes = new Map(
    normalizedHeaders.map((header, index) => [header, index])
  )

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headerIndexes.has(requiredHeader)) {
      throw new Error(
        `Missing CVM CSV header ${requiredHeader}: ${document.fileName}`
      )
    }
  }

  return rows.map((values) =>
    toStatementRow(values, headerIndexes, document.statement)
  )
}
