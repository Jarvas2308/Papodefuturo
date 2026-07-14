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

export type ContributionInput = {
  valorAporteEmCentavos: number
  carteiraAtual: ContributionPosition[]
  metasAlocacao: AllocationTarget[]
  metasGlobaisPorAtivo: ContributionAssetTarget[]
  strategy: ContributionStrategyType
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
