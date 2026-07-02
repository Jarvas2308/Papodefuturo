import type { PortfolioCategory } from '../portfolio/types'

export type ContributionStrategyType = 'proportional' | 'target-allocation'

export type ContributionPosition = {
  assetId: string
  category: PortfolioCategory
  currentValueInCents: number
}

export type AllocationTarget = {
  category: PortfolioCategory
  targetPercentage: number
}

export type ContributionInput = {
  valorAporteEmCentavos: number
  carteiraAtual: ContributionPosition[]
  metasAlocacao: AllocationTarget[]
  strategy: ContributionStrategyType
}

export type ContributionDistribution = {
  assetId: string
  valorEmCentavos: number
}

export type ContributionResult = {
  distribuicao: ContributionDistribution[]
  totalDistribuidoEmCentavos: number
}

export interface ContributionStrategy {
  execute(input: ContributionInput): ContributionResult
}
