export type {
  FundamentalSnapshotRepository,
  FundamentalSnapshotStorage,
  RealEstateFundFundamentalSnapshotStorage,
} from './contracts'
export {
  buildOfficialCvmArchiveUrl,
  downloadOfficialCvmArchive,
  readCvmConsolidatedDocuments,
} from './cvm/archive'
export {
  CVM_BRAZILIAN_STOCK_COMPANIES,
  getCvmBrazilianStockCompany,
} from './cvm/companies'
export { normalizeCvmCnpj } from './cvm/cnpj'
export { parseCvmStatementCsv } from './cvm/csv'
export { parseCvmMonetaryFact } from './cvm/money'
export { normalizeCvmDescription } from './cvm/normalizeDescription'
export * from './cvm/fii'
export {
  CVM_ACCOUNT_DESCRIPTION_ALLOWLISTS,
  extractCvmBrazilianStockFundamentals,
} from './cvm/provider'
export type {
  CvmArchiveFetcher,
  CvmArchiveSource,
  CvmBrazilianStockCompany,
  CvmBrazilianStockFundamentalRecord,
  CvmBrazilianStockTicker,
  CvmFactProvenance,
  CvmStatement,
  CvmStatementDocument,
  CvmStatementRow,
} from './cvm/types'
export { ingestCvmBrazilianStockFundamentals } from './ingestCvmBrazilianStocks'
export { ingestCvmRealEstateFundFundamentals } from './ingestCvmRealEstateFunds'
export {
  createSupabaseFundamentalSnapshotRepository,
  createSupabaseFundamentalSnapshotStorage,
  mapFundamentalSnapshotRow,
} from './supabaseFundamentalSnapshots'
