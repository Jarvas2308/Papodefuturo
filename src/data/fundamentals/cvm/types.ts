import type { BrazilianStockFundamentalFacts } from '../../../domain/fundamentals'

export type CvmArchiveSource = 'DFP' | 'ITR'

export type CvmStatement = 'BPA' | 'BPP' | 'DRE' | 'DFC_MD' | 'DFC_MI'

// Qual quantidade de `composicao_capital` representa o ticker negociado
// (DEC-081). BBAS3/WEGE3/PSSA3 tem so classe ON; ITSA4 negocia a PN;
// TAEE11 e' unit (combina ON+PN), entao usa o total.
export type CvmBrazilianStockShareClass = 'ON' | 'PN' | 'unit-total'

export type CvmCapitalCompositionRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  companyName: string
  ordinaryShares: string
  preferredShares: string
  totalShares: string
}

export type CvmCapitalCompositionProvenance = {
  fileName: string
  column: string
  rawValue: string
  referenceDate: string
  version: number
}

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
  shareClass: CvmBrazilianStockShareClass
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
    issuedShares: CvmCapitalCompositionProvenance | null
    // Null exatamente quando o fato correspondente é null (banco, regime
    // errado - ver `BrazilianStockFundamentalFacts` em
    // `src/domain/fundamentals/types.ts`).
    financialDebtCurrent: CvmFactProvenance | null
    financialDebtNonCurrent: CvmFactProvenance | null
    cashAndEquivalents: CvmFactProvenance | null
    ebit: CvmFactProvenance | null
    depreciationAndAmortization: CvmFactProvenance | null
  }
}

export type CvmArchiveFetcher = (
  url: string
) => Promise<Pick<Response, 'ok' | 'status' | 'arrayBuffer'>>
