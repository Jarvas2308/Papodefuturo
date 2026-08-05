import type {
  CvmFiiTrimestralComplementRow,
  CvmFiiTrimestralDocument,
  CvmFiiTrimestralGeneralRow,
  CvmFiiTrimestralMaturityFaixa,
  CvmFiiTrimestralPropertyRow,
  CvmFiiTrimestralResultRow,
  CvmFiiTrimestralTenantRow,
} from './types'

export const MATURITY_FAIXA_COLUMNS: Record<
  CvmFiiTrimestralMaturityFaixa,
  string
> = {
  ate3Meses: 'Percentual_Vencimento_Receita_FII_Faixa_Ate_3Meses',
  '3a6Meses': 'Percentual_Vencimento_Receita_FII_Faixa_3a6Meses',
  '6a9Meses': 'Percentual_Vencimento_Receita_FII_Faixa_6a9Meses',
  '9a12Meses': 'Percentual_Vencimento_Receita_FII_Faixa_9a12Meses',
  '12a15Meses': 'Percentual_Vencimento_Receita_FII_Faixa_12a15Meses',
  '15a18Meses': 'Percentual_Vencimento_Receita_FII_Faixa_15a18Meses',
  '18a21Meses': 'Percentual_Vencimento_Receita_FII_Faixa_18a21Meses',
  '21a24Meses': 'Percentual_Vencimento_Receita_FII_Faixa_21a24Meses',
  '24a27Meses': 'Percentual_Vencimento_Receita_FII_Faixa_24a27Meses',
  '27a30Meses': 'Percentual_Vencimento_Receita_FII_Faixa_27a30Meses',
  '30a33Meses': 'Percentual_Vencimento_Receita_FII_Faixa_30a33Meses',
  '33a36Meses': 'Percentual_Vencimento_Receita_FII_Faixa_33a36Meses',
  acima36Meses: 'Percentual_Vencimento_Receita_FII_Faixa_Acima_36Meses',
  indeterminado: 'Percentual_Vencimento_Receita_FII_Faixa_Indeterminado',
}

const GENERAL_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Nome_Fundo_Classe',
  'Codigo_ISIN',
] as const

const PROPERTY_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Nome_Imovel',
  'Percentual_Vacancia',
  'Percentual_Receitas_FII',
] as const

const COMPLEMENT_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Percentual_Indexador_Receita_FII_IPCA',
  'Percentual_Indexador_Receita_FII_IGPM',
  'Percentual_Indexador_Receita_FII_INPC',
  'Percentual_Indexador_Receita_FII_INCC',
  ...Object.values(MATURITY_FAIXA_COLUMNS),
] as const

const TENANT_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Nome_Imovel',
  'Setor_Atuacao',
  'Percentual_Receitas_FII',
] as const

const RESULT_REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Resultado_Trimestral_Liquido_Financeiro',
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
    throw new Error('Invalid CVM FII trimestral CSV: unterminated quoted field')
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  return rows
}

function buildHeaderIndexes(
  document: CvmFiiTrimestralDocument,
  requiredHeaders: readonly string[]
): { rows: string[][]; indexes: Map<string, number> } {
  const [headers, ...rows] = parseDelimitedRows(document.content)
  if (!headers) {
    throw new Error(
      `Empty CVM FII trimestral CSV document: ${document.fileName}`
    )
  }

  const bomPattern = new RegExp(`^${String.fromCharCode(0xfeff)}`)
  const normalizedHeaders = headers.map((header) =>
    header.replace(bomPattern, '').trim()
  )
  const indexes = new Map(
    normalizedHeaders.map((header, index) => [header, index])
  )

  for (const header of requiredHeaders) {
    if (!indexes.has(header)) {
      throw new Error(
        `Missing CVM FII trimestral CSV header ${header}: ${document.fileName}`
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
    throw new Error(`Missing CVM FII trimestral CSV header: ${header}`)
  }
  return values[index] ?? ''
}

export function parseCvmFiiTrimestralGeneralCsv(
  document: CvmFiiTrimestralDocument
): CvmFiiTrimestralGeneralRow[] {
  if (document.type !== 'general') {
    throw new Error(
      `Expected CVM FII trimestral general document: ${document.fileName}`
    )
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
    officialName: readField(values, indexes, 'Nome_Fundo_Classe'),
    isin: readField(values, indexes, 'Codigo_ISIN'),
  }))
}

export function parseCvmFiiTrimestralPropertyCsv(
  document: CvmFiiTrimestralDocument
): CvmFiiTrimestralPropertyRow[] {
  if (document.type !== 'property') {
    throw new Error(
      `Expected CVM FII trimestral property document: ${document.fileName}`
    )
  }
  const { rows, indexes } = buildHeaderIndexes(
    document,
    PROPERTY_REQUIRED_HEADERS
  )

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_Fundo_Classe'),
    referenceDate: readField(values, indexes, 'Data_Referencia'),
    version: readField(values, indexes, 'Versao'),
    propertyName: readField(values, indexes, 'Nome_Imovel'),
    vacancy: readField(values, indexes, 'Percentual_Vacancia'),
    revenueShare: readField(values, indexes, 'Percentual_Receitas_FII'),
  }))
}

export function parseCvmFiiTrimestralComplementCsv(
  document: CvmFiiTrimestralDocument
): CvmFiiTrimestralComplementRow[] {
  if (document.type !== 'complement') {
    throw new Error(
      `Expected CVM FII trimestral complement document: ${document.fileName}`
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
    ipcaRevenueShare: readField(
      values,
      indexes,
      'Percentual_Indexador_Receita_FII_IPCA'
    ),
    igpmRevenueShare: readField(
      values,
      indexes,
      'Percentual_Indexador_Receita_FII_IGPM'
    ),
    inpcRevenueShare: readField(
      values,
      indexes,
      'Percentual_Indexador_Receita_FII_INPC'
    ),
    inccRevenueShare: readField(
      values,
      indexes,
      'Percentual_Indexador_Receita_FII_INCC'
    ),
    maturityRevenueShare: Object.fromEntries(
      (
        Object.entries(MATURITY_FAIXA_COLUMNS) as [
          CvmFiiTrimestralMaturityFaixa,
          string,
        ][]
      ).map(([faixa, column]) => [faixa, readField(values, indexes, column)])
    ) as Record<CvmFiiTrimestralMaturityFaixa, string>,
  }))
}

export function parseCvmFiiTrimestralTenantCsv(
  document: CvmFiiTrimestralDocument
): CvmFiiTrimestralTenantRow[] {
  if (document.type !== 'tenant') {
    throw new Error(
      `Expected CVM FII trimestral tenant document: ${document.fileName}`
    )
  }
  const { rows, indexes } = buildHeaderIndexes(
    document,
    TENANT_REQUIRED_HEADERS
  )

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_Fundo_Classe'),
    referenceDate: readField(values, indexes, 'Data_Referencia'),
    version: readField(values, indexes, 'Versao'),
    propertyName: readField(values, indexes, 'Nome_Imovel'),
    sector: readField(values, indexes, 'Setor_Atuacao'),
    revenueShare: readField(values, indexes, 'Percentual_Receitas_FII'),
  }))
}

export function parseCvmFiiTrimestralResultCsv(
  document: CvmFiiTrimestralDocument
): CvmFiiTrimestralResultRow[] {
  if (document.type !== 'result') {
    throw new Error(
      `Expected CVM FII trimestral result document: ${document.fileName}`
    )
  }
  const { rows, indexes } = buildHeaderIndexes(
    document,
    RESULT_REQUIRED_HEADERS
  )

  return rows.map((values) => ({
    fileName: document.fileName,
    cnpj: readField(values, indexes, 'CNPJ_Fundo_Classe'),
    referenceDate: readField(values, indexes, 'Data_Referencia'),
    version: readField(values, indexes, 'Versao'),
    quarterlyNetResult: readField(
      values,
      indexes,
      'Resultado_Trimestral_Liquido_Financeiro'
    ),
  }))
}
