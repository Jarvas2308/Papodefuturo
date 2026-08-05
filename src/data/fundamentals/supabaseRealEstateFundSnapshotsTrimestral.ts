// Escrita da vacancia trimestral de FII (Sprint 16, Fase 2, DEC-076).
//
// Modulo paralelo e deliberadamente separado de supabaseRealEstateFundSnapshots.ts
// (que cobre o Informe Mensal): a forma de provenance do Informe Trimestral
// (agregacao ponderada por imovel) e estruturalmente diferente da do Informe
// Mensal (2 documentos, PL/cotas/cotistas), entao generalizar o arquivo
// existente custaria mais legibilidade do que ganharia em reuso. Cobre apenas
// o caminho de escrita (ingestao) - a leitura de vacancia fica para quando o
// motor de score (Fase 5) precisar consumi-la; ate la,
// listRealEstateFundSnapshots (leitura usada pela tela /fundamentos real)
// continua filtrando source='cvm-fii-inf-mensal' e ignorando estas linhas.
import type {
  Json,
  TablesInsert,
} from '../../lib/database.types'
import { normalizeAssetTicker } from '../assetUniverse'
import type { RealEstateFundVacancySnapshotStorage } from './contracts'
import type { CvmRealEstateFundVacancyRecord } from './cvm/fii-trimestral/types'
import {
  upsertFundamentalSnapshotRowsV1,
  type FundamentalSnapshotsRpcClientV1,
} from './supabaseSnapshotsRpc'

export type RealEstateFundVacancySnapshotInsert =
  TablesInsert<'fundamental_snapshots'>

function assertPositiveFilingVersion(version: number): void {
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new Error(`Invalid CVM FII trimestral filing version: ${version}`)
  }
}

function assertBasisPointsInRange(value: number | null, field: string): void {
  if (value === null) {
    return
  }
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`Invalid ${field} basis points: ${value}`)
  }
}

function assertWaleMonthsInRange(value: number | null): void {
  if (value === null) {
    return
  }
  if (!Number.isSafeInteger(value) || value < 0 || value > 120_000) {
    throw new Error(`Invalid WALE months (x100): ${value}`)
  }
}

function assertNullableMoney(
  value: CvmRealEstateFundVacancyRecord['facts']['quarterlyNetFinancialResult']
): void {
  if (value === null) {
    return
  }
  if (!Number.isSafeInteger(value.amountInMinorUnits)) {
    throw new Error('Invalid quarterly net financial result')
  }
}

function provenanceToJson(
  provenance: CvmRealEstateFundVacancyRecord['provenance']
): Json {
  return {
    dataset: provenance.dataset,
    archiveId: provenance.archiveId,
    identity: {
      cnpj: { ...provenance.identity.cnpj },
      officialName: { ...provenance.identity.officialName },
      isin: { ...provenance.identity.isin },
    },
    referenceDate: { ...provenance.referenceDate },
    version: { ...provenance.version },
    vacancy:
      provenance.vacancy === null
        ? null
        : {
            method: provenance.vacancy.method,
            propertyCount: provenance.vacancy.propertyCount,
            weightSumUnscaledValue: provenance.vacancy.weightSumUnscaledValue,
            weightSumScale: provenance.vacancy.weightSumScale,
            properties: provenance.vacancy.properties.map((property) => ({
              ...property,
            })),
          },
    indexador:
      provenance.indexador === null
        ? null
        : {
            ipca: { ...provenance.indexador.ipca },
            igpm: { ...provenance.indexador.igpm },
            inpc: { ...provenance.indexador.inpc },
            incc: { ...provenance.indexador.incc },
          },
    tenantConcentration:
      provenance.tenantConcentration === null
        ? null
        : {
            method: provenance.tenantConcentration.method,
            dominantSector: provenance.tenantConcentration.dominantSector,
            sectorCount: provenance.tenantConcentration.sectorCount,
            sectors: provenance.tenantConcentration.sectors.map((sector) => ({
              ...sector,
            })),
          },
    quarterlyNetFinancialResult:
      provenance.quarterlyNetFinancialResult === null
        ? null
        : { ...provenance.quarterlyNetFinancialResult },
    wale:
      provenance.wale === null
        ? null
        : {
            method: provenance.wale.method,
            weightSumUnscaledValue: provenance.wale.weightSumUnscaledValue,
            weightSumScale: provenance.wale.weightSumScale,
            faixas: provenance.wale.faixas.map((faixa) => ({ ...faixa })),
          },
  }
}

function toInsertRow(
  record: CvmRealEstateFundVacancyRecord
): RealEstateFundVacancySnapshotInsert {
  assertPositiveFilingVersion(record.filingVersion)
  assertBasisPointsInRange(record.facts.vacancyInBasisPoints, 'vacancy')
  assertBasisPointsInRange(
    record.facts.ipcaRevenueShareInBasisPoints,
    'IPCA revenue share'
  )
  assertBasisPointsInRange(
    record.facts.igpmRevenueShareInBasisPoints,
    'IGP-M revenue share'
  )
  assertBasisPointsInRange(
    record.facts.inpcRevenueShareInBasisPoints,
    'INPC revenue share'
  )
  assertBasisPointsInRange(
    record.facts.inccRevenueShareInBasisPoints,
    'INCC revenue share'
  )
  assertBasisPointsInRange(
    record.facts.tenantConcentrationInBasisPoints,
    'tenant concentration'
  )
  assertNullableMoney(record.facts.quarterlyNetFinancialResult)
  assertWaleMonthsInRange(record.facts.waleInMonthsScaledBy100)
  if (record.source !== 'cvm-fii-inf-trimestral' || record.period !== 'quarterly') {
    throw new Error(
      `Invalid CVM FII trimestral record identity for ${record.ticker}`
    )
  }

  return {
    ticker: normalizeAssetTicker(record.ticker),
    category: 'real-estate-fund',
    market: 'BR',
    kind: 'real-estate-fund',
    period: 'quarterly',
    source: 'cvm-fii-inf-trimestral',
    reference_date: record.referenceDate,
    source_document_id: record.sourceDocumentId,
    source_archive: record.sourceArchive,
    filing_version: record.filingVersion,
    exercise_order: null,
    currency: 'BRL',
    net_asset_value_minor: null,
    issued_shares_unscaled: null,
    issued_shares_scale: null,
    shareholder_count: null,
    total_revenue_minor: null,
    net_income_minor: null,
    total_assets_minor: null,
    total_equity_minor: null,
    total_liabilities_minor: null,
    net_assets_minor: null,
    operating_cash_flow_minor: null,
    vacancy_basis_points: record.facts.vacancyInBasisPoints,
    ipca_revenue_share_basis_points:
      record.facts.ipcaRevenueShareInBasisPoints,
    igpm_revenue_share_basis_points:
      record.facts.igpmRevenueShareInBasisPoints,
    inpc_revenue_share_basis_points:
      record.facts.inpcRevenueShareInBasisPoints,
    incc_revenue_share_basis_points:
      record.facts.inccRevenueShareInBasisPoints,
    tenant_concentration_basis_points:
      record.facts.tenantConcentrationInBasisPoints,
    quarterly_net_financial_result_minor:
      record.facts.quarterlyNetFinancialResult?.amountInMinorUnits ?? null,
    wale_months_x100: record.facts.waleInMonthsScaledBy100,
    provenance: provenanceToJson(record.provenance),
  }
}

export function createSupabaseRealEstateFundVacancySnapshotStorage(
  privilegedClient: FundamentalSnapshotsRpcClientV1
): RealEstateFundVacancySnapshotStorage {
  return {
    async upsertMany(records) {
      await upsertFundamentalSnapshotRowsV1(
        privilegedClient,
        records.map(toInsertRow)
      )
    },
  }
}
