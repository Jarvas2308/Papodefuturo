import type {
  RealEstateFundFundamentalFacts,
  ExactDecimalQuantity,
} from '../../../../domain/fundamentals'
import type { CvmArchiveFetcher } from '../types'

export type CvmRealEstateFundTicker = 'KNRI11' | 'VISC11' | 'XPLG11' | 'HGRU11'

export type CvmRealEstateFund = {
  ticker: CvmRealEstateFundTicker
  officialName: string
  cnpj: string
  isin: string
  category: 'real-estate-fund'
  market: 'BR'
}

export type CvmFiiMonthlyDocumentType = 'general' | 'complement'

export type CvmFiiMonthlyDocument = {
  fileName: string
  type: CvmFiiMonthlyDocumentType
  content: string
}

export type CvmFiiGeneralRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  deliveryDate: string
  officialName: string
  isin: string
  issuedShares: string
}

export type CvmFiiComplementRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  shareholderInformationDate: string
  shareholderCount: string
  netAssetValue: string
  issuedShares: string
}

export type CvmFiiRawFieldProvenance = {
  fileName: string
  column: string
  rawValue: string
}

export type CvmFiiExactDecimalProvenance = CvmFiiRawFieldProvenance & {
  normalizedValue: string | null
  unscaledValue: ExactDecimalQuantity['unscaledValue'] | null
  scale: ExactDecimalQuantity['scale'] | null
  referenceDate: string
  filingVersion: number
  archiveId: string
}

export type CvmRealEstateFundFundamentalRecord = {
  ticker: CvmRealEstateFundTicker
  fundIdentity: {
    officialName: string
    cnpj: string
    isin: string
  }
  category: 'real-estate-fund'
  market: 'BR'
  kind: 'real-estate-fund'
  referenceDate: string
  period: 'monthly'
  source: 'cvm-fii-inf-mensal'
  sourceDocumentId: string
  sourceArchive: string
  filingVersion: number
  exerciseOrder: null
  facts: RealEstateFundFundamentalFacts
  provenance: {
    dataset: 'FII: Documentos: Informe Mensal Estruturado'
    archiveId: string
    identity: {
      cnpj: CvmFiiRawFieldProvenance
      officialName: CvmFiiRawFieldProvenance
      isin: CvmFiiRawFieldProvenance
      complementCnpj: CvmFiiRawFieldProvenance
    }
    referenceDate: CvmFiiRawFieldProvenance
    version: CvmFiiRawFieldProvenance
    netAssetValue: CvmFiiRawFieldProvenance
    issuedShares: CvmFiiExactDecimalProvenance
    shareholderCount: CvmFiiRawFieldProvenance
  }
}

export type CvmFiiArchiveFetcher = CvmArchiveFetcher
