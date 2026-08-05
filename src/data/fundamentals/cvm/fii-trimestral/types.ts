import type { SignedMonetaryFact } from '../../../../domain/fundamentals'
import type { CvmArchiveFetcher } from '../types'
import type {
  CvmFiiRawFieldProvenance,
  CvmRealEstateFundTicker,
} from '../fii/types'

export type CvmFiiTrimestralDocumentType =
  'general' | 'property' | 'complement' | 'tenant' | 'result'

export type CvmFiiTrimestralDocument = {
  fileName: string
  type: CvmFiiTrimestralDocumentType
  content: string
}

export type CvmFiiTrimestralGeneralRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  officialName: string
  isin: string
}

export type CvmFiiTrimestralPropertyRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  propertyName: string
  vacancy: string
  revenueShare: string
}

export type CvmFiiTrimestralPropertyProvenance = {
  fileName: string
  propertyName: string
  vacancyColumn: string
  vacancyRawValue: string
  revenueShareColumn: string
  revenueShareRawValue: string
}

// As 13 faixas de vencimento de receita usadas no calculo de WALE
// (DEC-080) - mesma tabela `complemento` do indexador, colunas
// `Percentual_Vencimento_Receita_FII_Faixa_*`.
export type CvmFiiTrimestralMaturityFaixa =
  | 'ate3Meses'
  | '3a6Meses'
  | '6a9Meses'
  | '9a12Meses'
  | '12a15Meses'
  | '15a18Meses'
  | '18a21Meses'
  | '21a24Meses'
  | '24a27Meses'
  | '27a30Meses'
  | '30a33Meses'
  | '33a36Meses'
  | 'acima36Meses'
  | 'indeterminado'

export type CvmFiiTrimestralComplementRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  ipcaRevenueShare: string
  igpmRevenueShare: string
  inpcRevenueShare: string
  inccRevenueShare: string
  maturityRevenueShare: Record<CvmFiiTrimestralMaturityFaixa, string>
}

export type CvmFiiTrimestralTenantRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  propertyName: string
  sector: string
  revenueShare: string
}

export type CvmFiiTrimestralTenantSectorProvenance = {
  sector: string
  revenueShareSumUnscaledValue: number
  revenueShareSumScale: number
  rowCount: number
}

export type CvmFiiTrimestralResultRow = {
  fileName: string
  cnpj: string
  referenceDate: string
  version: string
  quarterlyNetResult: string
}

export type CvmFiiTrimestralWaleFaixaProvenance = {
  faixa: CvmFiiTrimestralMaturityFaixa
  column: string
  rawValue: string
  midpointMonths: number
}

// Nome do type preservado por historico (a fatia inicial so cobria
// vacancia) - agora carrega qualquer fato derivado do Informe Trimestral,
// nao so vacancia. Indexador da carteira (ver DEC-077): participacao da
// receita contratual por indice de reajuste (IPCA/IGP-M/INPC/INCC), direto
// da tabela `complemento` - sem agregacao ponderada, 1 linha/fundo/trimestre.
export type CvmRealEstateFundVacancyFacts = {
  netAssetValue: null
  issuedShares: null
  shareholderCount: null
  vacancyInBasisPoints: number | null
  ipcaRevenueShareInBasisPoints: number | null
  igpmRevenueShareInBasisPoints: number | null
  inpcRevenueShareInBasisPoints: number | null
  inccRevenueShareInBasisPoints: number | null
  // Concentracao por setor de inquilino (DEC-078): maior participacao de
  // receita de um unico setor de atuacao (`Setor_Atuacao`), somada entre
  // imoveis do fundo - CVM nao divulga inquilino nomeado, so setor. Nome
  // do setor dominante fica so na provenance (texto livre variavel).
  tenantConcentrationInBasisPoints: number | null
  // Resultado financeiro liquido do trimestre (DEC-079), equivalente
  // brasileiro de FFO - `Resultado_Trimestral_Liquido_Financeiro` da
  // tabela `resultado_contabil_financeiro`. Valor absoluto (nao percentual
  // como os demais campos desta fatia), pode ser negativo (deficit).
  quarterlyNetFinancialResult: SignedMonetaryFact | null
  // WALE - prazo medio ponderado de vencimento dos contratos, em meses
  // (DEC-080), escala x100 (2 casas decimais, ex.: 3587 = 35,87 meses).
  // Media ponderada por receita usando o ponto medio de cada uma das 13
  // faixas de vencimento da tabela `complemento`. "Acima_36Meses" usa piso
  // conservador de 36 meses (subestima o WALE real, nao superestima) e
  // "Indeterminado" fica fora do calculo (sem informacao de prazo) - ambas
  // sao aproximacoes documentadas, nao dado exato da CVM.
  waleInMonthsScaledBy100: number | null
}

export type CvmRealEstateFundVacancyRecord = {
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
  period: 'quarterly'
  source: 'cvm-fii-inf-trimestral'
  sourceDocumentId: string
  sourceArchive: string
  filingVersion: number
  exerciseOrder: null
  facts: CvmRealEstateFundVacancyFacts
  provenance: {
    dataset: 'FII: Documentos: Informe Trimestral Estruturado'
    archiveId: string
    identity: {
      cnpj: CvmFiiRawFieldProvenance
      officialName: CvmFiiRawFieldProvenance
      isin: CvmFiiRawFieldProvenance
    }
    referenceDate: CvmFiiRawFieldProvenance
    version: CvmFiiRawFieldProvenance
    vacancy: {
      method: 'weighted-average-by-revenue-share'
      propertyCount: number
      weightSumUnscaledValue: number
      weightSumScale: number
      properties: readonly CvmFiiTrimestralPropertyProvenance[]
    } | null
    indexador: {
      ipca: CvmFiiRawFieldProvenance
      igpm: CvmFiiRawFieldProvenance
      inpc: CvmFiiRawFieldProvenance
      incc: CvmFiiRawFieldProvenance
    } | null
    tenantConcentration: {
      method: 'max-revenue-share-by-tenant-sector'
      dominantSector: string
      sectorCount: number
      sectors: readonly CvmFiiTrimestralTenantSectorProvenance[]
    } | null
    quarterlyNetFinancialResult: CvmFiiRawFieldProvenance | null
    wale: {
      method: 'weighted-average-by-revenue-share-maturity-midpoint'
      weightSumUnscaledValue: number
      weightSumScale: number
      faixas: readonly CvmFiiTrimestralWaleFaixaProvenance[]
    } | null
  }
}

export type CvmFiiTrimestralArchiveFetcher = CvmArchiveFetcher
