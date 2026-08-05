import { normalizeCvmCnpj } from '../cnpj'
import {
  CVM_REAL_ESTATE_FUNDS,
  matchCvmFiiOfficialNameAlias,
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
} from '../fii'
import type { CvmRealEstateFund } from '../fii/types'
import {
  MATURITY_FAIXA_COLUMNS,
  parseCvmFiiTrimestralComplementCsv,
  parseCvmFiiTrimestralGeneralCsv,
  parseCvmFiiTrimestralPropertyCsv,
  parseCvmFiiTrimestralResultCsv,
  parseCvmFiiTrimestralTenantCsv,
} from './csv'
import {
  computeTenantConcentration,
  computeWaleInMonths,
  computeWeightedAverageVacancyInBasisPoints,
  MATURITY_FAIXA_MIDPOINT_MONTHS_X100,
  toBasisPoints,
} from './numbers'
import type {
  CvmFiiTrimestralComplementRow,
  CvmFiiTrimestralDocument,
  CvmFiiTrimestralGeneralRow,
  CvmFiiTrimestralMaturityFaixa,
  CvmFiiTrimestralPropertyProvenance,
  CvmFiiTrimestralPropertyRow,
  CvmFiiTrimestralResultRow,
  CvmFiiTrimestralTenantRow,
  CvmFiiTrimestralWaleFaixaProvenance,
  CvmRealEstateFundVacancyRecord,
} from './types'

const DATASET = 'FII: Documentos: Informe Trimestral Estruturado' as const

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
    throw new Error(
      `Invalid CVM FII trimestral version for ${ticker}: ${value}`
    )
  }

  const version = Number(trimmed)
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new Error(
      `Invalid CVM FII trimestral version for ${ticker}: ${value}`
    )
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
    throw new Error(
      `Missing official CVM FII trimestral ${documentLabel} for ${ticker}`
    )
  }

  const candidates = rows.map((row) => {
    if (!isValidCivilDate(row.referenceDate)) {
      throw new Error(
        `Invalid CVM FII trimestral reference date for ${ticker}: ${row.referenceDate}`
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
      `Ambiguous CVM FII trimestral ${documentLabel} for ${ticker} at ${referenceDate} version ${version}`
    )
  }

  return selected[0]!
}

function selectGeneralRows(
  rows: readonly CvmFiiTrimestralGeneralRow[],
  fund: CvmRealEstateFund
): CvmFiiTrimestralGeneralRow[] {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)

  const fundRows = rows.filter(
    (row) => compactCnpjForLookup(row.cnpj) === expectedCnpj
  )
  for (const row of fundRows) {
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII trimestral CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
  }

  return fundRows
}

function assertSelectedGeneralIdentity(
  row: CvmFiiTrimestralGeneralRow,
  fund: CvmRealEstateFund
) {
  const matchedNameAlias = matchCvmFiiOfficialNameAlias(
    fund.ticker,
    row.officialName,
    fund.officialName
  )
  if (matchedNameAlias === null) {
    throw new Error(
      `Unexpected official CVM FII trimestral name for ${fund.ticker}: ${row.officialName}`
    )
  }
  if (row.isin.trim().toUpperCase() !== fund.isin) {
    throw new Error(
      `Unexpected official CVM FII trimestral ISIN for ${fund.ticker}: ${row.isin}`
    )
  }
}

function selectMatchingPropertyRows(
  rows: readonly CvmFiiTrimestralPropertyRow[],
  fund: CvmRealEstateFund,
  referenceDate: string,
  version: number
): CvmFiiTrimestralPropertyRow[] {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)

  return rows.filter((row) => {
    if (compactCnpjForLookup(row.cnpj) !== expectedCnpj) {
      return false
    }
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII trimestral CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
    return (
      row.referenceDate === referenceDate &&
      parsePositiveVersion(row.version, fund.ticker) === version
    )
  })
}

function selectMatchingComplementRow(
  rows: readonly CvmFiiTrimestralComplementRow[],
  fund: CvmRealEstateFund,
  referenceDate: string,
  version: number
): CvmFiiTrimestralComplementRow | null {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)

  const matching = rows.filter((row) => {
    if (compactCnpjForLookup(row.cnpj) !== expectedCnpj) {
      return false
    }
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII trimestral CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
    return (
      row.referenceDate === referenceDate &&
      parsePositiveVersion(row.version, fund.ticker) === version
    )
  })

  if (matching.length === 0) {
    return null
  }
  if (matching.length > 1) {
    throw new Error(
      `Ambiguous CVM FII trimestral complement row for ${fund.ticker} at ${referenceDate} version ${version}`
    )
  }
  return matching[0]!
}

function selectMatchingTenantRows(
  rows: readonly CvmFiiTrimestralTenantRow[],
  fund: CvmRealEstateFund,
  referenceDate: string,
  version: number
): CvmFiiTrimestralTenantRow[] {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)

  return rows.filter((row) => {
    if (compactCnpjForLookup(row.cnpj) !== expectedCnpj) {
      return false
    }
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII trimestral CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
    return (
      row.referenceDate === referenceDate &&
      parsePositiveVersion(row.version, fund.ticker) === version
    )
  })
}

function selectMatchingResultRow(
  rows: readonly CvmFiiTrimestralResultRow[],
  fund: CvmRealEstateFund,
  referenceDate: string,
  version: number
): CvmFiiTrimestralResultRow | null {
  const expectedCnpj = normalizeCvmCnpj(fund.cnpj)

  const matching = rows.filter((row) => {
    if (compactCnpjForLookup(row.cnpj) !== expectedCnpj) {
      return false
    }
    if (normalizeCvmCnpj(row.cnpj) !== expectedCnpj) {
      throw new Error(
        `Unexpected official CVM FII trimestral CNPJ for ${fund.ticker}: ${row.cnpj}`
      )
    }
    return (
      row.referenceDate === referenceDate &&
      parsePositiveVersion(row.version, fund.ticker) === version
    )
  })

  if (matching.length === 0) {
    return null
  }
  if (matching.length > 1) {
    throw new Error(
      `Ambiguous CVM FII trimestral result row for ${fund.ticker} at ${referenceDate} version ${version}`
    )
  }
  return matching[0]!
}

function buildSourceDocumentId(
  archiveId: string,
  cnpj: string,
  referenceDate: string,
  version: number
): string {
  return [
    'cvm-fii-inf-trimestral',
    archiveId.trim(),
    normalizeCvmCnpj(cnpj),
    referenceDate,
    `v${version}`,
  ].join(':')
}

function buildRecord(
  fund: CvmRealEstateFund,
  archiveId: string,
  generalRows: readonly CvmFiiTrimestralGeneralRow[],
  propertyRows: readonly CvmFiiTrimestralPropertyRow[],
  complementRows: readonly CvmFiiTrimestralComplementRow[],
  tenantRows: readonly CvmFiiTrimestralTenantRow[],
  resultRows: readonly CvmFiiTrimestralResultRow[]
): CvmRealEstateFundVacancyRecord {
  const general = selectLatestRow(
    selectGeneralRows(generalRows, fund),
    fund.ticker,
    'general row'
  )
  assertSelectedGeneralIdentity(general.row, fund)

  const matchingProperties = selectMatchingPropertyRows(
    propertyRows,
    fund,
    general.row.referenceDate,
    general.version
  )

  const pairs: {
    vacancy: ReturnType<typeof parseNullableCvmFiiExactDecimalQuantity>
    weight: ReturnType<typeof parseNullableCvmFiiExactDecimalQuantity>
    provenance: CvmFiiTrimestralPropertyProvenance
  }[] = matchingProperties.map((row) => {
    const vacancy = parseNullableCvmFiiExactDecimalQuantity(
      row.vacancy,
      `vacancy for ${row.propertyName}`
    )
    const weight = parseNullableCvmFiiExactDecimalQuantity(
      row.revenueShare,
      `revenue share for ${row.propertyName}`
    )
    return {
      vacancy,
      weight,
      provenance: {
        fileName: row.fileName,
        propertyName: row.propertyName,
        vacancyColumn: 'Percentual_Vacancia',
        vacancyRawValue: row.vacancy,
        revenueShareColumn: 'Percentual_Receitas_FII',
        revenueShareRawValue: row.revenueShare,
      },
    }
  })

  const usablePairs = pairs.filter(
    (
      pair
    ): pair is typeof pair & {
      vacancy: NonNullable<(typeof pair)['vacancy']>
      weight: NonNullable<(typeof pair)['weight']>
    } => pair.vacancy !== null && pair.weight !== null
  )

  const { basisPoints, weightSum } = computeWeightedAverageVacancyInBasisPoints(
    usablePairs.map((pair) => ({ vacancy: pair.vacancy, weight: pair.weight }))
  )

  const complement = selectMatchingComplementRow(
    complementRows,
    fund,
    general.row.referenceDate,
    general.version
  )
  const ipcaShare = complement
    ? parseNullableCvmFiiExactDecimalQuantity(
        complement.ipcaRevenueShare,
        'IPCA revenue share'
      )
    : null
  const igpmShare = complement
    ? parseNullableCvmFiiExactDecimalQuantity(
        complement.igpmRevenueShare,
        'IGP-M revenue share'
      )
    : null
  const inpcShare = complement
    ? parseNullableCvmFiiExactDecimalQuantity(
        complement.inpcRevenueShare,
        'INPC revenue share'
      )
    : null
  const inccShare = complement
    ? parseNullableCvmFiiExactDecimalQuantity(
        complement.inccRevenueShare,
        'INCC revenue share'
      )
    : null

  const waleFaixaEntries: {
    faixa: CvmFiiTrimestralMaturityFaixa
    midpointMonthsX100: number
    weight: NonNullable<
      ReturnType<typeof parseNullableCvmFiiExactDecimalQuantity>
    >
    provenance: CvmFiiTrimestralWaleFaixaProvenance
  }[] = complement
    ? (
        Object.entries(MATURITY_FAIXA_MIDPOINT_MONTHS_X100) as [
          CvmFiiTrimestralMaturityFaixa,
          number,
        ][]
      )
        .map(([faixa, midpointMonthsX100]) => {
          const rawValue = complement.maturityRevenueShare[faixa]
          const weight = parseNullableCvmFiiExactDecimalQuantity(
            rawValue,
            `maturity revenue share for ${faixa}`
          )
          return { faixa, midpointMonthsX100, weight, rawValue }
        })
        .filter(
          (
            entry
          ): entry is typeof entry & {
            weight: NonNullable<typeof entry.weight>
          } => entry.weight !== null
        )
        .map((entry) => ({
          faixa: entry.faixa,
          midpointMonthsX100: entry.midpointMonthsX100,
          weight: entry.weight,
          provenance: {
            faixa: entry.faixa,
            column: MATURITY_FAIXA_COLUMNS[entry.faixa],
            rawValue: entry.rawValue,
            midpointMonths: entry.midpointMonthsX100 / 100,
          },
        }))
    : []
  const { monthsScaledBy100, weightSum: waleWeightSum } = computeWaleInMonths(
    waleFaixaEntries.map((entry) => ({
      midpointMonthsX100: entry.midpointMonthsX100,
      weight: entry.weight,
    }))
  )

  const matchingTenants = selectMatchingTenantRows(
    tenantRows,
    fund,
    general.row.referenceDate,
    general.version
  )
  const tenantSharePairs = matchingTenants
    .map((row) => ({
      sector: row.sector.trim(),
      share: parseNullableCvmFiiExactDecimalQuantity(
        row.revenueShare,
        `tenant revenue share for ${row.propertyName}/${row.sector}`
      ),
    }))
    .filter(
      (
        pair
      ): pair is { sector: string; share: NonNullable<typeof pair.share> } =>
        pair.share !== null
    )
  const tenantConcentration = computeTenantConcentration(tenantSharePairs)

  const result = selectMatchingResultRow(
    resultRows,
    fund,
    general.row.referenceDate,
    general.version
  )
  const quarterlyNetFinancialResult = result
    ? parseNullableCvmFiiMoney(
        result.quarterlyNetResult,
        'quarterly net financial result'
      )
    : null

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
    period: 'quarterly',
    source: 'cvm-fii-inf-trimestral',
    sourceDocumentId: buildSourceDocumentId(
      archiveId,
      fund.cnpj,
      general.row.referenceDate,
      general.version
    ),
    sourceArchive: archiveId,
    filingVersion: general.version,
    exerciseOrder: null,
    facts: {
      netAssetValue: null,
      issuedShares: null,
      shareholderCount: null,
      vacancyInBasisPoints: basisPoints,
      ipcaRevenueShareInBasisPoints: toBasisPoints(ipcaShare),
      igpmRevenueShareInBasisPoints: toBasisPoints(igpmShare),
      inpcRevenueShareInBasisPoints: toBasisPoints(inpcShare),
      inccRevenueShareInBasisPoints: toBasisPoints(inccShare),
      tenantConcentrationInBasisPoints: tenantConcentration.basisPoints,
      quarterlyNetFinancialResult,
      waleInMonthsScaledBy100: monthsScaledBy100,
    },
    provenance: {
      dataset: DATASET,
      archiveId,
      identity: {
        cnpj: {
          fileName: general.row.fileName,
          column: 'CNPJ_Fundo_Classe',
          rawValue: general.row.cnpj,
        },
        officialName: {
          fileName: general.row.fileName,
          column: 'Nome_Fundo_Classe',
          rawValue: general.row.officialName,
        },
        isin: {
          fileName: general.row.fileName,
          column: 'Codigo_ISIN',
          rawValue: general.row.isin,
        },
      },
      referenceDate: {
        fileName: general.row.fileName,
        column: 'Data_Referencia',
        rawValue: general.row.referenceDate,
      },
      version: {
        fileName: general.row.fileName,
        column: 'Versao',
        rawValue: general.row.version,
      },
      vacancy:
        usablePairs.length === 0
          ? null
          : {
              method: 'weighted-average-by-revenue-share',
              propertyCount: usablePairs.length,
              weightSumUnscaledValue: weightSum.unscaledValue,
              weightSumScale: weightSum.scale,
              properties: usablePairs.map((pair) => pair.provenance),
            },
      indexador:
        complement === null
          ? null
          : {
              ipca: {
                fileName: complement.fileName,
                column: 'Percentual_Indexador_Receita_FII_IPCA',
                rawValue: complement.ipcaRevenueShare,
              },
              igpm: {
                fileName: complement.fileName,
                column: 'Percentual_Indexador_Receita_FII_IGPM',
                rawValue: complement.igpmRevenueShare,
              },
              inpc: {
                fileName: complement.fileName,
                column: 'Percentual_Indexador_Receita_FII_INPC',
                rawValue: complement.inpcRevenueShare,
              },
              incc: {
                fileName: complement.fileName,
                column: 'Percentual_Indexador_Receita_FII_INCC',
                rawValue: complement.inccRevenueShare,
              },
            },
      tenantConcentration:
        tenantConcentration.dominantSector === null
          ? null
          : {
              method: 'max-revenue-share-by-tenant-sector',
              dominantSector: tenantConcentration.dominantSector,
              sectorCount: tenantConcentration.sectors.length,
              sectors: tenantConcentration.sectors.map((sector) => ({
                sector: sector.sector,
                revenueShareSumUnscaledValue: sector.sum.unscaledValue,
                revenueShareSumScale: sector.sum.scale,
                rowCount: sector.rowCount,
              })),
            },
      quarterlyNetFinancialResult:
        result === null
          ? null
          : {
              fileName: result.fileName,
              column: 'Resultado_Trimestral_Liquido_Financeiro',
              rawValue: result.quarterlyNetResult,
            },
      wale:
        waleFaixaEntries.length === 0
          ? null
          : {
              method: 'weighted-average-by-revenue-share-maturity-midpoint',
              weightSumUnscaledValue: waleWeightSum.unscaledValue,
              weightSumScale: waleWeightSum.scale,
              faixas: waleFaixaEntries.map((entry) => entry.provenance),
            },
    },
  }
}

export function extractCvmRealEstateFundVacancy(input: {
  archiveId: string
  documents: readonly CvmFiiTrimestralDocument[]
}): CvmRealEstateFundVacancyRecord[] {
  if (!input.archiveId.trim()) {
    throw new Error('CVM FII trimestral archiveId must be a non-empty string')
  }

  const generalDocuments = input.documents.filter(
    (document) => document.type === 'general'
  )
  const propertyDocuments = input.documents.filter(
    (document) => document.type === 'property'
  )
  const complementDocuments = input.documents.filter(
    (document) => document.type === 'complement'
  )
  const tenantDocuments = input.documents.filter(
    (document) => document.type === 'tenant'
  )
  const resultDocuments = input.documents.filter(
    (document) => document.type === 'result'
  )
  if (
    generalDocuments.length !== 1 ||
    propertyDocuments.length !== 1 ||
    complementDocuments.length !== 1 ||
    tenantDocuments.length !== 1 ||
    resultDocuments.length !== 1
  ) {
    throw new Error(
      'CVM FII trimestral extraction requires exactly one general, one property, one complement, one tenant and one result document'
    )
  }

  const generalRows = parseCvmFiiTrimestralGeneralCsv(generalDocuments[0]!)
  const propertyRows = parseCvmFiiTrimestralPropertyCsv(propertyDocuments[0]!)
  const complementRows = parseCvmFiiTrimestralComplementCsv(
    complementDocuments[0]!
  )
  const tenantRows = parseCvmFiiTrimestralTenantCsv(tenantDocuments[0]!)
  const resultRows = parseCvmFiiTrimestralResultCsv(resultDocuments[0]!)

  return CVM_REAL_ESTATE_FUNDS.map((fund) =>
    buildRecord(
      fund,
      input.archiveId,
      generalRows,
      propertyRows,
      complementRows,
      tenantRows,
      resultRows
    )
  )
}
