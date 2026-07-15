import type { BrazilianStockFundamentalFacts } from '../../../domain/fundamentals'
import { CVM_BRAZILIAN_STOCK_COMPANIES } from './companies'
import { normalizeCvmCnpj } from './cnpj'
import { parseCvmStatementCsv } from './csv'
import { parseCvmMonetaryFact } from './money'
import { normalizeCvmDescription } from './normalizeDescription'
import type {
  CvmArchiveSource,
  CvmBrazilianStockCompany,
  CvmBrazilianStockFundamentalRecord,
  CvmFactProvenance,
  CvmStatement,
  CvmStatementDocument,
  CvmStatementRow,
} from './types'

const CURRENT_EXERCISE = normalizeCvmDescription('ÚLTIMO')

const NET_INCOME_DESCRIPTIONS = [
  'Lucro ou Prejuízo Líquido Consolidado do Período',
  'Lucro/Prejuízo Consolidado do Período',
] as const

const TOTAL_ASSETS_DESCRIPTIONS = ['Ativo Total'] as const

const TOTAL_EQUITY_DESCRIPTIONS = ['Patrimônio Líquido Consolidado'] as const

const OPERATING_CASH_FLOW_DESCRIPTIONS = [
  'Caixa Líquido das Atividades Operacionais',
  'Caixa Líquido Atividades Operacionais',
] as const

type FactSelection = {
  fact: ReturnType<typeof parseCvmMonetaryFact>
  provenance: CvmFactProvenance
}

type SelectFactInput = {
  rows: readonly CvmStatementRow[]
  metric: string
  statements: readonly CvmStatement[]
  descriptions: readonly string[]
  accountCode?: string
}

function parseCvmVersion(version: string): number | null {
  if (!/^\d+$/.test(version.trim())) {
    return null
  }

  const parsed = Number(version)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function isValidCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  )
}

function normalizeCvmCode(value: string): string {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) ? trimmed.padStart(6, '0') : trimmed
}

function selectLatestFilingRows(
  rows: readonly CvmStatementRow[],
  company: CvmBrazilianStockCompany
): { rows: CvmStatementRow[]; referenceDate: string; version: number } {
  const companyRows = rows
    .map((row) => ({ row, version: parseCvmVersion(row.version) }))
    .filter(
      (candidate): candidate is { row: CvmStatementRow; version: number } =>
        normalizeCvmCode(candidate.row.cvmCode) === company.cvmCode &&
        candidate.version !== null &&
        isValidCivilDate(candidate.row.referenceDate)
    )

  if (companyRows.length === 0) {
    throw new Error(`No valid CVM filing found for ${company.ticker}`)
  }

  const referenceDate = companyRows.reduce(
    (latest, candidate) =>
      candidate.row.referenceDate > latest
        ? candidate.row.referenceDate
        : latest,
    companyRows[0]!.row.referenceDate
  )
  const latestDateRows = companyRows.filter(
    (candidate) => candidate.row.referenceDate === referenceDate
  )
  const version = Math.max(
    ...latestDateRows.map((candidate) => candidate.version)
  )
  const filingRows = latestDateRows
    .filter((candidate) => candidate.version === version)
    .map((candidate) => candidate.row)
  const expectedCnpj = normalizeCvmCnpj(company.cnpj)

  for (const row of filingRows) {
    if (normalizeCvmCode(row.cvmCode) !== company.cvmCode) {
      throw new Error(
        `Unexpected official CVM code for ${company.ticker}: ${row.cvmCode}`
      )
    }
    if (
      normalizeCvmDescription(row.companyName) !==
      normalizeCvmDescription(company.officialName)
    ) {
      throw new Error(
        `Unexpected official company name for ${company.ticker}: ${row.companyName}`
      )
    }
    if (normalizeCvmCnpj(row.companyCnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official company CNPJ for ${company.ticker}: ${row.companyCnpj}`
      )
    }
  }

  return { rows: filingRows, referenceDate, version }
}

function selectCurrentExerciseRows(
  rows: readonly CvmStatementRow[]
): CvmStatementRow[] {
  return rows.filter(
    (row) => normalizeCvmDescription(row.exerciseOrder) === CURRENT_EXERCISE
  )
}

function selectFact({
  rows,
  metric,
  statements,
  descriptions,
  accountCode,
}: SelectFactInput): FactSelection {
  const normalizedDescriptions = new Set(
    descriptions.map(normalizeCvmDescription)
  )
  const statementRows = rows.filter(
    (row) =>
      statements.includes(row.statement) &&
      (accountCode === undefined || row.accountCode.trim() === accountCode)
  )
  const candidates = statementRows.filter((row) =>
    normalizedDescriptions.has(normalizeCvmDescription(row.accountDescription))
  )

  if (candidates.length === 0) {
    const descriptionsFound = statementRows
      .map((row) => row.accountDescription)
      .join(', ')
    throw new Error(
      `No valid ${metric} candidate found${
        descriptionsFound ? `; descriptions found: ${descriptionsFound}` : ''
      }`
    )
  }
  if (candidates.length > 1) {
    throw new Error(
      `Ambiguous ${metric}: ${candidates.length} candidates found`
    )
  }

  const row = candidates[0]!
  const version = parseCvmVersion(row.version)
  if (version === null) {
    throw new Error(
      `Invalid CVM version selected for ${metric}: ${row.version}`
    )
  }

  return {
    fact: parseCvmMonetaryFact(
      row.accountValue,
      row.currency,
      row.currencyScale
    ),
    provenance: {
      statement: row.statement,
      accountCode: row.accountCode,
      accountDescription: row.accountDescription,
      referenceDate: row.referenceDate,
      version,
      exerciseOrder: row.exerciseOrder,
    },
  }
}

function buildSourceDocumentId(
  source: CvmArchiveSource,
  archiveId: string,
  cvmCode: string,
  referenceDate: string,
  version: number
): string {
  return [
    source.toLowerCase(),
    archiveId.trim(),
    cvmCode,
    referenceDate,
    `v${version}`,
  ].join(':')
}

function buildRecord(
  company: CvmBrazilianStockCompany,
  source: CvmArchiveSource,
  archiveId: string,
  rows: readonly CvmStatementRow[]
): CvmBrazilianStockFundamentalRecord {
  const filing = selectLatestFilingRows(rows, company)
  const currentRows = selectCurrentExerciseRows(filing.rows)
  const netIncome = selectFact({
    rows: currentRows,
    metric: 'netIncome',
    statements: ['DRE'],
    accountCode: '3.11',
    descriptions: NET_INCOME_DESCRIPTIONS,
  })
  const totalAssets = selectFact({
    rows: currentRows,
    metric: 'totalAssets',
    statements: ['BPA'],
    accountCode: '1',
    descriptions: TOTAL_ASSETS_DESCRIPTIONS,
  })
  const totalEquity = selectFact({
    rows: currentRows,
    metric: 'totalEquity',
    statements: ['BPP'],
    descriptions: TOTAL_EQUITY_DESCRIPTIONS,
  })
  const operatingCashFlow = selectFact({
    rows: currentRows,
    metric: 'operatingCashFlow',
    statements: ['DFC_MI', 'DFC_MD'],
    accountCode: '6.01',
    descriptions: OPERATING_CASH_FLOW_DESCRIPTIONS,
  })
  const facts: BrazilianStockFundamentalFacts = {
    totalRevenue: null,
    netIncome: netIncome.fact,
    totalAssets: totalAssets.fact,
    totalEquity: totalEquity.fact,
    operatingCashFlow: operatingCashFlow.fact,
  }

  return {
    ticker: company.ticker,
    companyIdentity: {
      officialName: company.officialName,
      cvmCode: company.cvmCode,
      cnpj: company.cnpj,
    },
    category: 'brazilian-stock',
    market: 'BR',
    kind: 'brazilian-stock',
    referenceDate: filing.referenceDate,
    period: source === 'DFP' ? 'annual' : 'quarterly',
    source: source === 'DFP' ? 'cvm-dfp' : 'cvm-itr',
    sourceDocumentId: buildSourceDocumentId(
      source,
      archiveId,
      company.cvmCode,
      filing.referenceDate,
      filing.version
    ),
    sourceArchive: archiveId,
    filingVersion: filing.version,
    exerciseOrder: netIncome.provenance.exerciseOrder,
    facts,
    provenance: {
      totalRevenue: null,
      netIncome: netIncome.provenance,
      totalAssets: totalAssets.provenance,
      totalEquity: totalEquity.provenance,
      operatingCashFlow: operatingCashFlow.provenance,
    },
  }
}

export function extractCvmBrazilianStockFundamentals(input: {
  source: CvmArchiveSource
  archiveId: string
  documents: readonly CvmStatementDocument[]
}): CvmBrazilianStockFundamentalRecord[] {
  if (!input.archiveId.trim()) {
    throw new Error('CVM archiveId must be a non-empty string')
  }

  const rows = input.documents.flatMap(parseCvmStatementCsv)
  return CVM_BRAZILIAN_STOCK_COMPANIES.map((company) =>
    buildRecord(company, input.source, input.archiveId, rows)
  )
}

export const CVM_ACCOUNT_DESCRIPTION_ALLOWLISTS = {
  netIncome: NET_INCOME_DESCRIPTIONS,
  totalAssets: TOTAL_ASSETS_DESCRIPTIONS,
  totalEquity: TOTAL_EQUITY_DESCRIPTIONS,
  operatingCashFlow: OPERATING_CASH_FLOW_DESCRIPTIONS,
} as const
