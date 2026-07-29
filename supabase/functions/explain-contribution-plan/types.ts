export type TechnicalDossierPositionInput = {
  assetId: string
  ticker: string
  name: string
  category: string
  currency: string
  quantity: number
  currentMinorInBrl: number
  resultPercentage: number
}

export type TechnicalDossierStrategyAssetInput = {
  assetId: string
  ticker: string
  name: string
  globalTargetInBasisPoints: number
}

export type TechnicalDossierStrategyCategoryInput = {
  id: string
  name: string
  targetInBasisPoints: number
  assets: TechnicalDossierStrategyAssetInput[]
}

export type TechnicalDossierPlanItemInput = {
  assetId: string
  ticker: string
  name: string
  suggestedQuantity: number
  unitPriceMinorInBrl: number
  allocatedMinorInBrl: number
  differenceBeforeInBasisPoints: number
  differenceAfterInBasisPoints: number
}

export type TechnicalDossierLimitationInput = {
  code: string
  description: string
}

export type TechnicalDossierInput = {
  schemaVersion: string
  generatedAt: string
  portfolio: {
    baseCurrency: string
    totalInvestedMinorInBrl: number
    totalCurrentMinorInBrl: number
    totalResultMinorInBrl: number
    totalResultPercentage: number
    positions: TechnicalDossierPositionInput[]
  }
  strategy: {
    categories: TechnicalDossierStrategyCategoryInput[]
  }
  technicalPlan: {
    contributionAmountMinorInBrl: number
    totalAllocatedMinorInBrl: number
    unallocatedMinorInBrl: number
    stopReason: string
    items: TechnicalDossierPlanItemInput[]
  }
  deviations: {
    totalBeforeInBasisPoints: number
    totalAfterInBasisPoints: number
    totalReductionInBasisPoints: number
  }
  limitations: TechnicalDossierLimitationInput[]
}

export const AI_EXPLANATION_V1_SCHEMA_VERSION = 'ai-explanation.v1'

export type AiExplanationConvictionLevel = 'low' | 'medium' | 'high'

export type AiExplanationOutput = {
  schemaVersion: typeof AI_EXPLANATION_V1_SCHEMA_VERSION
  generatedAt: string
  facts: string[]
  interpretation: string
  convictionLevel: AiExplanationConvictionLevel
  technicalPlanSummary: string
  comparativeExplanation: string
}
