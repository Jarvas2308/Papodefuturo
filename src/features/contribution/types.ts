import type { PortfolioCategory } from '../portfolio/types'

export type ContributionStrategyType = 'proportional' | 'target-allocation'

export type ContributionPosition = {
  assetId: string
  category: PortfolioCategory
  currentValueInCents: number
  unitPriceInCents: number | null
}

export type AllocationTarget = {
  category: PortfolioCategory
  targetPercentage: number
}

export type ContributionAssetTarget = {
  assetId: string
  targetInBasisPoints: number
}

// Score do motor de recomendacao (Sprint 16, Fase 5, DEC-068/DEC-085) por
// ativo elegivel. Opcional: quando ausente, o laco guloso se comporta
// exatamente como antes da Fase 5 (sem reordenar por score).
export type ContributionAssetScore = {
  assetId: string
  points: number
}

export type ContributionInput = {
  valorAporteEmCentavos: number
  carteiraAtual: ContributionPosition[]
  metasAlocacao: AllocationTarget[]
  metasGlobaisPorAtivo: ContributionAssetTarget[]
  strategy: ContributionStrategyType
  // desvioAjustado = desvioCandidato - (score * scoreWeightInBasisPoints),
  // aplicado so entre candidatos que ja melhoram o desvio (trava de
  // seguranca: nunca aprova uma compra que piora ou nao muda a carteira).
  assetScores?: ContributionAssetScore[]
  scoreWeightInBasisPoints?: number
}

export type ContributionDistribution = {
  assetId: string
  valorEmCentavos: number
}

export type ContributionStopReason =
  | 'zero-contribution'
  | 'budget-exhausted'
  | 'no-affordable-unit'
  | 'no-improving-purchase'

export type ContributionTechnicalImpactItem = {
  assetId: string
  suggestedQuantity: number
  unitPriceInCents: number
  allocatedInCents: number
  differenceBeforeInBasisPoints: number
  differenceAfterInBasisPoints: number
}

export type ContributionTechnicalImpact = {
  totalDeviationBeforeInBasisPoints: number
  totalDeviationAfterInBasisPoints: number
  totalDeviationReductionInBasisPoints: number
  stopReason: ContributionStopReason
  items: ContributionTechnicalImpactItem[]
}

type ContributionResultBase = {
  distribuicao: ContributionDistribution[]
  totalDistribuidoEmCentavos: number
  saldoNaoAlocadoEmCentavos: number
}

export type ProportionalContributionResult = ContributionResultBase & {
  strategy: 'proportional'
}

export type TargetAllocationContributionResult = ContributionResultBase & {
  strategy: 'target-allocation'
  technicalImpact: ContributionTechnicalImpact
}

export type ContributionResult =
  ProportionalContributionResult | TargetAllocationContributionResult

export interface ContributionStrategy {
  execute(input: ContributionInput): ContributionResult
}
