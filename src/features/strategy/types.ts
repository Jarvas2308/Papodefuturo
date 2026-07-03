import type { PortfolioCategory } from '../portfolio/types'

export type StrategyCategoryId = PortfolioCategory
export type StrategyAllocationStatus = 'below' | 'near' | 'above'

export type StrategyAssetTarget = {
  assetId: string
  ticker: string
  assetName: string
  targetWithinCategoryInBasisPoints: number
}

export type StrategyCategory = {
  id: StrategyCategoryId
  name: string
  targetInBasisPoints: number
  assets: StrategyAssetTarget[]
}

export type StrategyDraftAsset = {
  assetId: string
  targetPercentage: string
}

export type StrategyDraftCategory = {
  id: StrategyCategoryId
  targetPercentage: string
  assets: StrategyDraftAsset[]
}

export type StrategyDraft = {
  categories: StrategyDraftCategory[]
}

export type StrategyValidationIssue = {
  id: string
  message: string
}

export type StrategyValidation = {
  isValid: boolean
  categoryTotalInBasisPoints: number
  issues: StrategyValidationIssue[]
  invalidCategoryIds: StrategyCategoryId[]
}

export type StrategyAssetAllocation = StrategyAssetTarget & {
  currentValueInCents: number
  currentGlobalInBasisPoints: number
  globalTargetProduct: number
  deviationInBasisPoints: number
  status: StrategyAllocationStatus
}

export type StrategyCategoryAllocation = Omit<StrategyCategory, 'assets'> & {
  currentValueInCents: number
  currentInBasisPoints: number
  deviationInBasisPoints: number
  status: StrategyAllocationStatus
  internalTargetTotalInBasisPoints: number
  assets: StrategyAssetAllocation[]
}
