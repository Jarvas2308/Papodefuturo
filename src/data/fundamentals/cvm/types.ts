import type { BrazilianStockFundamentalFacts } from '../../../domain/fundamentals'

export type CvmArchiveSource = 'DFP' | 'ITR'

export type CvmStatement = 'BPA' | 'BPP' | 'DRE' | 'DFC_MD' | 'DFC_MI'

export type CvmStatementDocument = {
  fileName: string
  statement: CvmStatement
  content: string
}

export type CvmStatementRow = {
  companyName: string
  companyCnpj: string
  cvmCode: string
  referenceDate: string
  version: string
  currency: string
  currencyScale: string
  exerciseOrder: string
  exerciseStartDate: string | null
  exerciseEndDate: string
  accountCode: string
  accountDescription: string
  accountValue: string
  statement: CvmStatement
}

export type CvmBrazilianStockCompany = {
  ticker: CvmBrazilianStockTicker
  officialName: string
  cvmCode: string
  cnpj: string
}

export type CvmBrazilianStockTicker =
  'BBAS3' | 'ITSA4' | 'TAEE11' | 'WEGE3' | 'PSSA3'

export type CvmFactProvenance = {
  statement: CvmStatement
  accountCode: string
  accountDescription: string
  referenceDate: string
  version: number
  exerciseOrder: string
}

export type CvmBrazilianStockFundamentalRecord = {
  ticker: CvmBrazilianStockTicker
  companyIdentity: {
    officialName: string
    cvmCode: string
    cnpj: string
  }
  category: 'brazilian-stock'
  market: 'BR'
  kind: 'brazilian-stock'
  referenceDate: string
  period: 'annual' | 'quarterly'
  source: 'cvm-dfp' | 'cvm-itr'
  sourceDocumentId: string
  sourceArchive: string
  filingVersion: number
  exerciseOrder: string
  facts: BrazilianStockFundamentalFacts
  provenance: {
    totalRevenue: null
    netIncome: CvmFactProvenance
    totalAssets: CvmFactProvenance
    totalEquity: CvmFactProvenance
    operatingCashFlow: CvmFactProvenance
  }
}

export type CvmArchiveFetcher = (
  url: string
) => Promise<Pick<Response, 'ok' | 'status' | 'arrayBuffer'>>
