import type { Asset, AssetCategory } from '../models'

export const FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION =
  'fundamental-facts.v1' as const

export type FundamentalAssetKind = Extract<
  AssetCategory,
  'brazilian-stock' | 'real-estate-fund' | 'international-etf'
>

export type SignedMonetaryFact = {
  amountInMinorUnits: number
  currency: 'BRL' | 'USD'
}

export type ExactDecimalQuantity = {
  unscaledValue: number
  scale: number
}

export type BrazilianStockFundamentalFacts = {
  totalRevenue: SignedMonetaryFact | null
  netIncome: SignedMonetaryFact | null
  totalAssets: SignedMonetaryFact | null
  totalEquity: SignedMonetaryFact | null
  operatingCashFlow: SignedMonetaryFact | null
  // Cotas emitidas da classe negociada pelo ticker (DEC-081), fonte
  // `dfp_cia_aberta_composicao_capital`/`itr_cia_aberta_composicao_capital`.
  // ON puro (BBAS3/WEGE3/PSSA3), PN puro (ITSA4) ou total ON+PN para units
  // (TAEE11) - ver `CvmBrazilianStockCompany.shareClass`. Insumo de LPA e
  // P/L, ainda nao calculados (Fase 5).
  issuedShares: ExactDecimalQuantity | null
  // Insumos de dívida líquida/EBITDA (docs/reference/ACOES_BR_SETORES_E_METRICAS.md,
  // seção 3.5), confirmados com dado real do DFP 2025 (Sprint 16, Fase 5).
  // Null para banco (BBAS3): a linha existe no CVM sob o mesmo código de
  // conta, mas com descrição estruturalmente diferente ("Depósitos" em vez
  // de "Empréstimos e Financiamentos", "Caixa" em vez de "Caixa e
  // Equivalentes de Caixa") - regime errado, não dado ausente.
  // BPP `2.01.04`/`2.02.01` "Empréstimos e Financiamentos" (circulante e
  // não circulante) - mantidos separados, a soma fica a cargo do motor de
  // score, não deste contrato de fatos.
  financialDebtCurrent: SignedMonetaryFact | null
  financialDebtNonCurrent: SignedMonetaryFact | null
  // BPA `1.01.01` "Caixa e Equivalentes de Caixa".
  cashAndEquivalents: SignedMonetaryFact | null
  // DRE `3.05` "Resultado Antes do Resultado Financeiro e dos Tributos"
  // (EBIT) - código e descrição confirmados idênticos entre ITSA4, TAEE11,
  // WEGE3 e PSSA3 com dado real, mesmo padrão de universalidade já
  // confirmado para `3.11` (lucro líquido).
  ebit: SignedMonetaryFact | null
  // DFC (método indireto) - linha de "Depreciação, Amortização e
  // Exaustão"/"Depreciação e Amortização"/"Depreciações" na reconciliação
  // do lucro antes dos impostos, adicionada de volta ao caixa operacional.
  // Código de conta varia por empresa (6.01.01.02/.03/.06) - só a
  // descrição é estável, allowlist fechada (mesmo padrão de
  // NET_INCOME_DESCRIPTIONS). Sempre positivo (magnitude, não sinal
  // contábil da despesa).
  depreciationAndAmortization: SignedMonetaryFact | null
}

export type BrazilianStockFundamentalSnapshotInput = {
  assetId: string
  kind: 'brazilian-stock'
  referenceDate: string
  period: 'annual' | 'quarterly'
  source: 'cvm-dfp' | 'cvm-itr'
  sourceDocumentId: string
  facts: BrazilianStockFundamentalFacts
}

export type RealEstateFundFundamentalFacts = {
  netAssetValue: SignedMonetaryFact | null
  issuedShares: ExactDecimalQuantity | null
  shareholderCount: number | null
  // So populado por 'cvm-fii-inf-trimestral' - o Informe Mensal nao tem
  // esse dado. Media ponderada por receita entre os imoveis do fundo no
  // trimestre mais recente (docs/reference/FII_SEGMENTOS_E_METRICAS.md,
  // secao 7.1). Escala 0-10000 (pontos-base), mesmo padrao de BasisPoints
  // usado no resto do dominio.
  vacancyInBasisPoints: number | null
  // So populado por 'cvm-fii-inf-trimestral'. Participacao do maior
  // inquilino na receita do imovel dominante, escala 0-10000 (pontos-base).
  tenantConcentrationInBasisPoints: number | null
  // So populado por 'cvm-fii-inf-trimestral'. Prazo medio ponderado de
  // vencimento dos contratos, em meses, escala x100 (2 casas decimais
  // implicitas) - mesmo padrao das demais quantidades escaladas do
  // dominio. Usado no motor de score (Fase 5) como proxy de "receita
  // vencendo no curto prazo" do rascunho de pontuacao.
  waleMonthsScaledBy100: number | null
}

export type RealEstateFundFundamentalSnapshotInput = {
  assetId: string
  kind: 'real-estate-fund'
  referenceDate: string
  period: 'monthly' | 'quarterly'
  source: 'cvm-fii-inf-mensal' | 'cvm-fii-inf-trimestral'
  sourceDocumentId: string
  facts: RealEstateFundFundamentalFacts
}

export type InternationalEtfFundamentalFacts = {
  totalAssets: SignedMonetaryFact | null
  totalLiabilities: SignedMonetaryFact | null
  netAssets: SignedMonetaryFact | null
}

export type InternationalEtfFundamentalSnapshotInput = {
  assetId: string
  kind: 'international-etf'
  referenceDate: string
  period: 'monthly'
  source: 'sec-nport'
  sourceDocumentId: string
  facts: InternationalEtfFundamentalFacts
}

export type FundamentalSnapshotInput =
  | BrazilianStockFundamentalSnapshotInput
  | RealEstateFundFundamentalSnapshotInput
  | InternationalEtfFundamentalSnapshotInput

export type FundamentalFactsAsset = {
  assetId: string
  ticker: string
  name: string
  category: FundamentalAssetKind
  snapshots: FundamentalSnapshotInput[]
}

export type FundamentalFactsDataCoverage = {
  eligibleAssetCount: number
  assetWithFactsCount: number
  missingFundamentalAssetIds: string[]
  totalSnapshotCount: number
  brazilianStockSnapshotCount: number
  realEstateFundSnapshotCount: number
  internationalEtfSnapshotCount: number
}

export type FundamentalFactsLimitationCode =
  | 'normalized-facts-only'
  | 'not-persisted'
  | 'providers-not-integrated-v1'
  | 'no-derived-fundamental-ratios'
  | 'no-fundamental-score'
  | 'no-technical-plan-modification'

export type FundamentalFactsLimitation = {
  code: FundamentalFactsLimitationCode
  description: string
}

export type FundamentalFactsV1 = {
  schemaVersion: typeof FUNDAMENTAL_FACTS_V1_SCHEMA_VERSION
  generatedAt: string
  assets: FundamentalFactsAsset[]
  dataCoverage: FundamentalFactsDataCoverage
  limitations: FundamentalFactsLimitation[]
}

export type BuildFundamentalFactsV1Input = {
  generatedAt: string
  assets: readonly Asset[]
  snapshots: readonly FundamentalSnapshotInput[]
}
