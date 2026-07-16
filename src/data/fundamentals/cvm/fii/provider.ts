import {
  formatExactDecimalQuantity,
  type ExactDecimalQuantity,
  type RealEstateFundFundamentalFacts,
} from '../../../../domain/fundamentals'
import { normalizeCvmCnpj } from '../cnpj'
import { normalizeCvmDescription } from '../normalizeDescription'
import { parseCvmFiiComplementCsv, parseCvmFiiGeneralCsv } from './csv'
import { CVM_REAL_ESTATE_FUNDS } from './funds'
import {
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
  parseNullableCvmFiiNonNegativeInteger,
} from './numbers'
import type {
  CvmFiiComplementRow,
  CvmFiiExactDecimalProvenance,
  CvmFiiGeneralRow,
  CvmFiiMonthlyDocument,
  CvmFiiRawFieldProvenance,
  CvmRealEstateFund,
  CvmRealEstateFundFundamentalRecord,
} from './types'

const DATASET = 'FII: Documentos: Informe Mensal Estruturado' as const

type FilingRow = {
  referenceDate: string
  version: string
}

function compactCnpjForLookup(value: string): string {
  return value.normalize('NFC').replace(/[\p{P}\s]+/gu, '')
}

function parsePositiveVersion(value: string, ticker: string): number {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid CVM FII version for ${ticker}: ${value}`)
  }

  const version = Number(trimmed)
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new Error(`Invalid CVM FII version for ${ticker}: ${value}`)
  }
  return version
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

function selectLatestRow<T extends FilingRow>(
  rows: readonly T[],
  ticker: string,
  documentLabel: string
): { row: T; version: number } {
  if (rows.length === 0) {
    throw new Error(`Missing official CVM FII ${documentLabel} for ${ticker}`)
  }

  const candidates = rows.map((row) => {
    if (!isValidCivilDate(row.referenceDate)) {
      throw new Error(
        `Invalid CVM FII reference date for ${ticker}: ${row.referenceDate}`
      )
    }
    return { row, version: parsePositiveVersion(row.version, ticker) }
  })
  const referenceDate = candidates.reduce(
    (latest, candidate) =>
      candidate.row.referenceDate > latest
        ? candidate.row.referenceDate
        : latest,
    candidates[0]!.row.referenceDate
  )
  const latestDateRows = candidates.filter(
    (candidate) => candidate.row.referenceDate === referenceDate
  )
  const version = Math.max(
    ...latestDateRows.map((candidate) => candidate.version)
  )
  const selected = latestDateRows.filter(
    (candidate) => candidate.version === version
  )

  if (selected.length !== 1) {
    throw new Error(
      `Ambiguous CVM FII ${documentLabel} for ${ticker} at ${referenceDate} version ${version}`
    )
  }

  return selected[0]!
}

function selectGeneralRows(
  rows: readonly CvmFiiGeneralRow[],
  fund: CvmRealEstateFund
): CvmFiiGeneralRow[] {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)
  const expectedName = normalizeCvmDescription(fund.officialName)

  for (const row of rows) {
    if (normalizeCvmDescription(row.officialName) === expectedName) {
      const rowCnpj = normalizeCvmCnpj(row.cnpj)
      if (rowCnpj !== expectedCnpj) {
        throw new Error(
          `Unexpected official CVM FII CNPJ for ${fund.ticker}: ${row.cnpj}`
        )
      }
    }
  }

  const fundRows = rows.filter(
    (row) => compactCnpjForLookup(row.cnpj) === expectedCnpj
  )
  for (const row of fundRows) {
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
  }

  return fundRows
}

function assertSelectedGeneralIdentity(
  row: CvmFiiGeneralRow,
  fund: CvmRealEstateFund
) {
  if (
    normalizeCvmDescription(row.officialName) !==
    normalizeCvmDescription(fund.officialName)
  ) {
    throw new Error(
      `Unexpected official CVM FII name for ${fund.ticker}: ${row.officialName}`
    )
  }
  if (row.isin.trim().toUpperCase() !== fund.isin) {
    throw new Error(
      `Unexpected official CVM FII ISIN for ${fund.ticker}: ${row.isin}`
    )
  }
}

function selectComplementRows(
  rows: readonly CvmFiiComplementRow[],
  fund: CvmRealEstateFund
): CvmFiiComplementRow[] {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)
  const fundRows = rows.filter(
    (row) => compactCnpjForLookup(row.cnpj) === expectedCnpj
  )

  for (const row of fundRows) {
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
  }

  return fundRows
}

function rawField(
  fileName: string,
  column: string,
  rawValue: string
): CvmFiiRawFieldProvenance {
  return { fileName, column, rawValue }
}

function exactDecimalProvenance(input: {
  fileName: string
  column: string
  rawValue: string
  value: ExactDecimalQuantity | null
  referenceDate: string
  filingVersion: number
  archiveId: string
}): CvmFiiExactDecimalProvenance {
  return {
    ...rawField(input.fileName, input.column, input.rawValue),
    normalizedValue:
      input.value === null ? null : formatExactDecimalQuantity(input.value),
    unscaledValue: input.value?.unscaledValue ?? null,
    scale: input.value?.scale ?? null,
    referenceDate: input.referenceDate,
    filingVersion: input.filingVersion,
    archiveId: input.archiveId,
  }
}

function buildSourceDocumentId(
  archiveId: string,
  cnpj: string,
  referenceDate: string,
  version: number
): string {
  return [
    'cvm-fii-inf-mensal',
    archiveId.trim(),
    normalizeCvmCnpj(cnpj),
    referenceDate,
    `v${version}`,
  ].join(':')
}

function buildRecord(
  fund: CvmRealEstateFund,
  archiveId: string,
  generalRows: readonly CvmFiiGeneralRow[],
  complementRows: readonly CvmFiiComplementRow[]
): CvmRealEstateFundFundamentalRecord {
  const general = selectLatestRow(
    selectGeneralRows(generalRows, fund),
    fund.ticker,
    'general row'
  )
  const complement = selectLatestRow(
    selectComplementRows(complementRows, fund),
    fund.ticker,
    'complement row'
  )
  assertSelectedGeneralIdentity(general.row, fund)

  if (
    general.row.referenceDate !== complement.row.referenceDate ||
    general.version !== complement.version
  ) {
    throw new Error(
      `Inconsistent latest CVM FII filing identity for ${fund.ticker}`
    )
  }

  const issuedShares = parseNullableCvmFiiExactDecimalQuantity(
    complement.row.issuedShares,
    'issued shares'
  )
  const facts: RealEstateFundFundamentalFacts = {
    netAssetValue: parseNullableCvmFiiMoney(
      complement.row.netAssetValue,
      'net asset value'
    ),
    issuedShares,
    shareholderCount: parseNullableCvmFiiNonNegativeInteger(
      complement.row.shareholderCount,
      'shareholder count'
    ),
  }

  return {
    ticker: fund.ticker,
    fundIdentity: {
      officialName: fund.officialName,
      cnpj: fund.cnpj,
      isin: fund.isin,
    },
    category: fund.category,
    market: fund.market,
    kind: 'real-estate-fund',
    referenceDate: general.row.referenceDate,
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: buildSourceDocumentId(
      archiveId,
      fund.cnpj,
      general.row.referenceDate,
      general.version
    ),
    sourceArchive: archiveId,
    filingVersion: general.version,
    exerciseOrder: null,
    facts,
    provenance: {
      dataset: DATASET,
      archiveId,
      identity: {
        cnpj: rawField(
          general.row.fileName,
          'CNPJ_Fundo_Classe',
          general.row.cnpj
        ),
        officialName: rawField(
          general.row.fileName,
          'Nome_Fundo_Classe',
          general.row.officialName
        ),
        isin: rawField(general.row.fileName, 'Codigo_ISIN', general.row.isin),
        complementCnpj: rawField(
          complement.row.fileName,
          'CNPJ_Fundo_Classe',
          complement.row.cnpj
        ),
      },
      referenceDate: rawField(
        complement.row.fileName,
        'Data_Referencia',
        complement.row.referenceDate
      ),
      version: rawField(
        complement.row.fileName,
        'Versao',
        complement.row.version
      ),
      netAssetValue: rawField(
        complement.row.fileName,
        'Patrimonio_Liquido',
        complement.row.netAssetValue
      ),
      issuedShares: exactDecimalProvenance({
        fileName: complement.row.fileName,
        column: 'Cotas_Emitidas',
        rawValue: complement.row.issuedShares,
        value: issuedShares,
        referenceDate: complement.row.referenceDate,
        filingVersion: complement.version,
        archiveId,
      }),
      shareholderCount: rawField(
        complement.row.fileName,
        'Total_Numero_Cotistas',
        complement.row.shareholderCount
      ),
    },
  }
}

export function extractCvmRealEstateFundFundamentals(input: {
  archiveId: string
  documents: readonly CvmFiiMonthlyDocument[]
}): CvmRealEstateFundFundamentalRecord[] {
  if (!input.archiveId.trim()) {
    throw new Error('CVM FII archiveId must be a non-empty string')
  }

  const generalDocuments = input.documents.filter(
    (document) => document.type === 'general'
  )
  const complementDocuments = input.documents.filter(
    (document) => document.type === 'complement'
  )
  if (generalDocuments.length !== 1 || complementDocuments.length !== 1) {
    throw new Error(
      'CVM FII extraction requires exactly one general and one complement document'
    )
  }

  const generalRows = parseCvmFiiGeneralCsv(generalDocuments[0]!)
  const complementRows = parseCvmFiiComplementCsv(complementDocuments[0]!)

  return CVM_REAL_ESTATE_FUNDS.map((fund) =>
    buildRecord(fund, input.archiveId, generalRows, complementRows)
  )
}
