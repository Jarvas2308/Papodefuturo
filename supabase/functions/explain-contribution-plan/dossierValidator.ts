import type {
  TechnicalDossierInput,
  TechnicalDossierLimitationInput,
  TechnicalDossierPlanItemInput,
  TechnicalDossierPositionInput,
  TechnicalDossierStrategyAssetInput,
  TechnicalDossierStrategyCategoryInput,
} from './types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validatePosition(value: unknown): TechnicalDossierPositionInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.assetId) ||
    !isNonEmptyString(value.ticker) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.category) ||
    !isNonEmptyString(value.currency) ||
    !isFiniteNumber(value.quantity) ||
    !isFiniteNumber(value.currentMinorInBrl) ||
    !isFiniteNumber(value.resultPercentage)
  ) {
    throw new Error('Invalid technical dossier portfolio position')
  }

  return {
    assetId: value.assetId,
    ticker: value.ticker,
    name: value.name,
    category: value.category,
    currency: value.currency,
    quantity: value.quantity,
    currentMinorInBrl: value.currentMinorInBrl,
    resultPercentage: value.resultPercentage,
  }
}

function validateStrategyAsset(
  value: unknown
): TechnicalDossierStrategyAssetInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.assetId) ||
    !isNonEmptyString(value.ticker) ||
    !isNonEmptyString(value.name) ||
    !isFiniteNumber(value.globalTargetInBasisPoints)
  ) {
    throw new Error('Invalid technical dossier strategy asset')
  }

  return {
    assetId: value.assetId,
    ticker: value.ticker,
    name: value.name,
    globalTargetInBasisPoints: value.globalTargetInBasisPoints,
  }
}

function validateStrategyCategory(
  value: unknown
): TechnicalDossierStrategyCategoryInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isFiniteNumber(value.targetInBasisPoints) ||
    !Array.isArray(value.assets)
  ) {
    throw new Error('Invalid technical dossier strategy category')
  }

  return {
    id: value.id,
    name: value.name,
    targetInBasisPoints: value.targetInBasisPoints,
    assets: value.assets.map(validateStrategyAsset),
  }
}

function validatePlanItem(value: unknown): TechnicalDossierPlanItemInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.assetId) ||
    !isNonEmptyString(value.ticker) ||
    !isNonEmptyString(value.name) ||
    !isFiniteNumber(value.suggestedQuantity) ||
    !isFiniteNumber(value.unitPriceMinorInBrl) ||
    !isFiniteNumber(value.allocatedMinorInBrl) ||
    !isFiniteNumber(value.differenceBeforeInBasisPoints) ||
    !isFiniteNumber(value.differenceAfterInBasisPoints)
  ) {
    throw new Error('Invalid technical dossier plan item')
  }

  return {
    assetId: value.assetId,
    ticker: value.ticker,
    name: value.name,
    suggestedQuantity: value.suggestedQuantity,
    unitPriceMinorInBrl: value.unitPriceMinorInBrl,
    allocatedMinorInBrl: value.allocatedMinorInBrl,
    differenceBeforeInBasisPoints: value.differenceBeforeInBasisPoints,
    differenceAfterInBasisPoints: value.differenceAfterInBasisPoints,
  }
}

function validateLimitation(value: unknown): TechnicalDossierLimitationInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.description)
  ) {
    throw new Error('Invalid technical dossier limitation')
  }

  return { code: value.code, description: value.description }
}

export function validateTechnicalDossierInput(
  value: unknown
): TechnicalDossierInput {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.schemaVersion) ||
    !isNonEmptyString(value.generatedAt) ||
    Number.isNaN(Date.parse(value.generatedAt)) ||
    !isRecord(value.portfolio) ||
    !isRecord(value.strategy) ||
    !isRecord(value.technicalPlan) ||
    !isRecord(value.deviations) ||
    !Array.isArray(value.limitations)
  ) {
    throw new Error('Invalid technical dossier payload')
  }

  const portfolio = value.portfolio
  const strategy = value.strategy
  const technicalPlan = value.technicalPlan
  const deviations = value.deviations

  if (
    !isNonEmptyString(portfolio.baseCurrency) ||
    !isFiniteNumber(portfolio.totalInvestedMinorInBrl) ||
    !isFiniteNumber(portfolio.totalCurrentMinorInBrl) ||
    !isFiniteNumber(portfolio.totalResultMinorInBrl) ||
    !isFiniteNumber(portfolio.totalResultPercentage) ||
    !Array.isArray(portfolio.positions) ||
    !Array.isArray(strategy.categories) ||
    !isFiniteNumber(technicalPlan.contributionAmountMinorInBrl) ||
    !isFiniteNumber(technicalPlan.totalAllocatedMinorInBrl) ||
    !isFiniteNumber(technicalPlan.unallocatedMinorInBrl) ||
    !isNonEmptyString(technicalPlan.stopReason) ||
    !Array.isArray(technicalPlan.items) ||
    !isFiniteNumber(deviations.totalBeforeInBasisPoints) ||
    !isFiniteNumber(deviations.totalAfterInBasisPoints) ||
    !isFiniteNumber(deviations.totalReductionInBasisPoints)
  ) {
    throw new Error('Invalid technical dossier payload')
  }

  return {
    schemaVersion: value.schemaVersion,
    generatedAt: value.generatedAt,
    portfolio: {
      baseCurrency: portfolio.baseCurrency,
      totalInvestedMinorInBrl: portfolio.totalInvestedMinorInBrl,
      totalCurrentMinorInBrl: portfolio.totalCurrentMinorInBrl,
      totalResultMinorInBrl: portfolio.totalResultMinorInBrl,
      totalResultPercentage: portfolio.totalResultPercentage,
      positions: portfolio.positions.map(validatePosition),
    },
    strategy: {
      categories: strategy.categories.map(validateStrategyCategory),
    },
    technicalPlan: {
      contributionAmountMinorInBrl: technicalPlan.contributionAmountMinorInBrl,
      totalAllocatedMinorInBrl: technicalPlan.totalAllocatedMinorInBrl,
      unallocatedMinorInBrl: technicalPlan.unallocatedMinorInBrl,
      stopReason: technicalPlan.stopReason,
      items: technicalPlan.items.map(validatePlanItem),
    },
    deviations: {
      totalBeforeInBasisPoints: deviations.totalBeforeInBasisPoints,
      totalAfterInBasisPoints: deviations.totalAfterInBasisPoints,
      totalReductionInBasisPoints: deviations.totalReductionInBasisPoints,
    },
    limitations: value.limitations.map(validateLimitation),
  }
}
