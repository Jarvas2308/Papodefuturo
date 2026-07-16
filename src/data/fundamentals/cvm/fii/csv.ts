import type {
  CvmFiiComplementRow,
  CvmFiiGeneralRow,
  CvmFiiMonthlyDocument,
} from './types'

const GENERAL_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Data_Entrega',
  'Nome_Fundo_Classe',
  'Codigo_ISIN',
  'Quantidade_Cotas_Emitidas',
] as const

const COMPLEMENT_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Data_Informacao_Numero_Cotistas',
  'Total_Numero_Cotistas',
  'Patrimonio_Liquido',
  'Cotas_Emitidas',
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
    throw new Error('Invalid CVM FII CSV: unterminated quoted field')
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  return rows
}

function buildHeaderIndexes(
  document: CvmFiiMonthlyDocument,
  requiredHeaders: readonly string[]
): { rows: string[][]; indexes: Map<string, number> } {
  const [headers, ...rows] = parseDelimitedRows(document.content)
  if (!headers) {
    throw new Error(`Empty CVM FII CSV document: ${document.fileName}`)
  }

  const normalizedHeaders = headers.map((header) =>
    header.replace(/^\uFEFF/, '').trim()
  )
  const indexes = new Map(
    normalizedHeaders.map((header, index) => [header, index])
  )

  for (const header of requiredHeaders) {
    if (!indexes.has(header)) {
      throw new Error(
        `Missing CVM FII CSV header ${header}: ${document.fileName}`
      )
    }
  }

  return { rows, indexes }
}

function readField(
  values: readonly string[],
  indexes: ReadonlyMap<string, number>,
  header: string
): string {
  const index = indexes.get(header)
  if (index === undefined) {
    throw new Error(`Missing CVM FII CSV header: ${header}`)
  }
  return values[index] ?? ''
}

export function parseCvmFiiGeneralCsv(
  document: CvmFiiMonthlyDocument
): CvmFiiGeneralRow[] {
  if (document.type !== 'general') {
    throw new Error(`Expected CVM FII general document: ${document.fileName}`)
  }
  const { rows, indexes } = buildHeaderIndexes(
    document,
    GENERAL_REQUIRED_HEADERS
  )

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_Fundo_Classe'),
    referenceDate: readField(values, indexes, 'Data_Referencia'),
    version: readField(values, indexes, 'Versao'),
    deliveryDate: readField(values, indexes, 'Data_Entrega'),
    officialName: readField(values, indexes, 'Nome_Fundo_Classe'),
    isin: readField(values, indexes, 'Codigo_ISIN'),
    issuedShares: readField(values, indexes, 'Quantidade_Cotas_Emitidas'),
  }))
}

export function parseCvmFiiComplementCsv(
  document: CvmFiiMonthlyDocument
): CvmFiiComplementRow[] {
  if (document.type !== 'complement') {
    throw new Error(
      `Expected CVM FII complement document: ${document.fileName}`
    )
  }
  const { rows, indexes } = buildHeaderIndexes(
    document,
    COMPLEMENT_REQUIRED_HEADERS
  )

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_Fundo_Classe'),
    referenceDate: readField(values, indexes, 'Data_Referencia'),
    version: readField(values, indexes, 'Versao'),
    shareholderInformationDate: readField(
      values,
      indexes,
      'Data_Informacao_Numero_Cotistas'
    ),
    shareholderCount: readField(values, indexes, 'Total_Numero_Cotistas'),
    netAssetValue: readField(values, indexes, 'Patrimonio_Liquido'),
    issuedShares: readField(values, indexes, 'Cotas_Emitidas'),
  }))
}
