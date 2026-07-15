import { getLatestAssetPricesByAsset } from '../latestAssetPrices'
import {
  getLatestUsdBrlRate,
  TOTAL_ALLOCATION_BASIS_POINTS,
  type Asset,
  type AssetCategory,
  type ExchangeRate,
} from '../models'
import { MAX_PLAN_ASSETS } from '../../features/contribution/strategies/targetAllocationStrategy'
import type { ContributionAssetTarget } from '../../features/contribution/types'
import type { StrategyCategory } from '../../features/strategy/types'
import {
  TECHNICAL_DOSSIER_V1_SCHEMA_VERSION,
  type BuildTechnicalDossierV1Input,
  type TechnicalDossierLimitation,
  type TechnicalDossierPortfolio,
  type TechnicalDossierStrategy,
  type TechnicalDossierTechnicalPlan,
  type TechnicalDossierV1,
} from './types'

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/

const ELIGIBLE_MARKET_CATEGORIES = new Set<AssetCategory>([
  'brazilian-stock',
  'real-estate-fund',
  'international-etf',
])

const LIMITATIONS: readonly TechnicalDossierLimitation[] = [
  {
    code: 'simulation-only',
    description:
      'O plano é uma simulação e não representa execução automática de ordem.',
  },
  {
    code: 'not-persisted',
    description:
      'O dossiê é derivado em memória e não possui histórico persistido neste ciclo.',
  },
  {
    code: 'greedy-whole-units-max-three',
    description:
      'O Motor V2 é guloso, incremental, usa unidades inteiras e limita o plano a até três ativos.',
  },
  {
    code: 'technical-ranking-not-exposed-v1',
    description:
      'O Motor V2 atual não expõe o ranking completo nem o histórico dos candidatos avaliados em cada iteração; o dossiê não inventa essa informação.',
  },
  {
    code: 'market-refresh-best-effort',
    description:
      'O refresh de mercado é best-effort e o dossiê consolida os últimos fatos persistidos disponibilizados ao fluxo.',
  },
]

function assertValidGeneratedAt(generatedAt: string) {
  const match = ISO_DATE_TIME_PATTERN.exec(generatedAt)
  const year = Number(match?.[1])
  const month = Number(match?.[2])
  const day = Number(match?.[3])
  const hour = Number(match?.[4])
  const minute = Number(match?.[5])
  const second = Number(match?.[6])
  const timezone = match?.[7]
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  const offsetHours = Number(timezone?.slice(1, 3))
  const offsetMinutes = Number(timezone?.slice(4, 6))
  const hasValidTimezone =
    timezone === 'Z' || (offsetHours <= 23 && offsetMinutes <= 59)

  if (
    !match ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (daysInMonth[month - 1] ?? 0) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    !hasValidTimezone ||
    Number.isNaN(Date.parse(generatedAt))
  ) {
    throw new RangeError('generatedAt must be a valid ISO date-time')
  }
}

function assertSafeNonNegativeInteger(value: number, description: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${description} must be a non-negative safe integer`)
  }
}

function assertSafeInteger(value: number, description: string) {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${description} must be a safe integer`)
  }
}

function addSafeInteger(total: number, value: number, description: string) {
  const result = total + value
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${description} exceeds the safe integer range`)
  }
  return result
}

function buildAssetMap(assets: readonly Asset[]): Map<string, Asset> {
  const assetById = new Map<string, Asset>()

  for (const asset of assets) {
    if (!asset.id.trim() || assetById.has(asset.id)) {
      throw new Error(`Invalid or duplicate asset id: ${asset.id}`)
    }
    assetById.set(asset.id, asset)
  }

  return assetById
}

function buildPortfolio(
  snapshot: BuildTechnicalDossierV1Input['portfolioSnapshot']
): TechnicalDossierPortfolio {
  return {
    baseCurrency: 'BRL',
    totalInvestedMinorInBrl: snapshot.totalInvestedMinorInBrl,
    totalCurrentMinorInBrl: snapshot.totalCurrentMinorInBrl,
    totalResultMinorInBrl: snapshot.totalResultMinorInBrl,
    totalResultPercentage: snapshot.totalResultPercentage,
    positions: snapshot.positions.map((position) => ({
      assetId: position.asset.id,
      ticker: position.asset.ticker,
      name: position.asset.name,
      category: position.asset.category,
      currency: position.currency,
      quantity: position.quantity,
      investedMinorNative: position.investedMinorNative,
      averagePriceMinorNative: position.averagePriceMinorNative,
      currentPriceMinorNative: position.currentPriceMinorNative,
      currentMinorNative: position.currentMinorNative,
      resultMinorNative: position.resultMinorNative,
      resultPercentage: position.resultPercentage,
      investedMinorInBrl: position.investedMinorInBrl,
      currentMinorInBrl: position.currentMinorInBrl,
      resultMinorInBrl: position.resultMinorInBrl,
      hasCurrentPrice: position.hasCurrentPrice,
    })),
  }
}

function buildGlobalTargetMap(
  strategy: readonly StrategyCategory[],
  globalTargets: readonly ContributionAssetTarget[]
): Map<string, number> {
  const strategyAssetIds = new Set<string>()

  for (const category of strategy) {
    for (const asset of category.assets) {
      if (!asset.assetId.trim() || strategyAssetIds.has(asset.assetId)) {
        throw new Error(
          `Invalid or duplicate strategy asset id: ${asset.assetId}`
        )
      }
      strategyAssetIds.add(asset.assetId)
    }
  }

  const targetByAssetId = new Map<string, number>()
  let total = 0

  for (const target of globalTargets) {
    if (!target.assetId.trim() || targetByAssetId.has(target.assetId)) {
      throw new Error(`Invalid or duplicate global target: ${target.assetId}`)
    }
    if (
      !Number.isSafeInteger(target.targetInBasisPoints) ||
      target.targetInBasisPoints < 0 ||
      target.targetInBasisPoints > TOTAL_ALLOCATION_BASIS_POINTS
    ) {
      throw new RangeError(`Invalid global target: ${target.assetId}`)
    }
    if (!strategyAssetIds.has(target.assetId)) {
      throw new Error(
        `Global target points to an asset outside the strategy: ${target.assetId}`
      )
    }

    targetByAssetId.set(target.assetId, target.targetInBasisPoints)
    total = addSafeInteger(
      total,
      target.targetInBasisPoints,
      'Global target total'
    )
  }

  for (const assetId of strategyAssetIds) {
    if (!targetByAssetId.has(assetId)) {
      throw new Error(`Missing global target for strategy asset: ${assetId}`)
    }
  }

  if (total !== TOTAL_ALLOCATION_BASIS_POINTS) {
    throw new RangeError(
      `Global asset targets must total ${TOTAL_ALLOCATION_BASIS_POINTS} basis points`
    )
  }

  return targetByAssetId
}

function buildStrategy(
  strategy: readonly StrategyCategory[],
  globalTargets: readonly ContributionAssetTarget[]
): TechnicalDossierStrategy {
  const targetByAssetId = buildGlobalTargetMap(strategy, globalTargets)

  return {
    categories: strategy.map((category) => ({
      id: category.id,
      name: category.name,
      targetInBasisPoints: category.targetInBasisPoints,
      assets: category.assets.map((asset) => ({
        assetId: asset.assetId,
        ticker: asset.ticker,
        name: asset.assetName,
        targetWithinCategoryInBasisPoints:
          asset.targetWithinCategoryInBasisPoints,
        globalTargetInBasisPoints: targetByAssetId.get(asset.assetId)!,
      })),
    })),
    totalGlobalTargetInBasisPoints: TOTAL_ALLOCATION_BASIS_POINTS,
  }
}

function copyExchangeRate(rate: ExchangeRate | null): ExchangeRate | null {
  return rate ? { ...rate } : null
}

function buildTechnicalPlan(
  contributionAmountInCents: number,
  technicalPlan: BuildTechnicalDossierV1Input['technicalPlan'],
  assetById: ReadonlyMap<string, Asset>
): TechnicalDossierTechnicalPlan {
  if (technicalPlan.strategy !== 'target-allocation') {
    throw new Error('Technical dossier requires a target-allocation plan')
  }

  assertSafeNonNegativeInteger(
    technicalPlan.totalDistribuidoEmCentavos,
    'Total allocated amount'
  )
  assertSafeNonNegativeInteger(
    technicalPlan.saldoNaoAlocadoEmCentavos,
    'Unallocated amount'
  )

  if (technicalPlan.distribuicao.length > MAX_PLAN_ASSETS) {
    throw new RangeError(
      `Technical plan cannot contain more than ${MAX_PLAN_ASSETS} assets`
    )
  }
  if (
    technicalPlan.technicalImpact.items.length !==
    technicalPlan.distribuicao.length
  ) {
    throw new Error('Technical impact items must match the plan distributions')
  }

  const distributionIds = new Set<string>()
  let distributionTotal = 0

  const items = technicalPlan.distribuicao.map((distribution, index) => {
    const technicalItem = technicalPlan.technicalImpact.items[index]
    const asset = assetById.get(distribution.assetId)

    if (!asset) {
      throw new Error(
        `Technical plan distribution references an unknown asset: ${distribution.assetId}`
      )
    }
    if (
      !distribution.assetId.trim() ||
      distributionIds.has(distribution.assetId)
    ) {
      throw new Error(
        `Invalid or duplicate technical plan distribution: ${distribution.assetId}`
      )
    }
    if (!technicalItem || technicalItem.assetId !== distribution.assetId) {
      throw new Error(
        'Technical impact items must preserve the distribution asset order'
      )
    }

    assertSafeNonNegativeInteger(
      distribution.valorEmCentavos,
      `Distribution value for ${distribution.assetId}`
    )
    assertSafeNonNegativeInteger(
      technicalItem.allocatedInCents,
      `Technical allocated value for ${distribution.assetId}`
    )
    assertSafeNonNegativeInteger(
      technicalItem.suggestedQuantity,
      `Suggested quantity for ${distribution.assetId}`
    )
    assertSafeNonNegativeInteger(
      technicalItem.unitPriceInCents,
      `Unit price for ${distribution.assetId}`
    )
    assertSafeInteger(
      technicalItem.differenceBeforeInBasisPoints,
      `Difference before for ${distribution.assetId}`
    )
    assertSafeInteger(
      technicalItem.differenceAfterInBasisPoints,
      `Difference after for ${distribution.assetId}`
    )

    if (distribution.valorEmCentavos !== technicalItem.allocatedInCents) {
      throw new Error(
        `Distribution and technical allocation diverge for ${distribution.assetId}`
      )
    }

    distributionIds.add(distribution.assetId)
    distributionTotal = addSafeInteger(
      distributionTotal,
      distribution.valorEmCentavos,
      'Distribution total'
    )

    return {
      assetId: distribution.assetId,
      ticker: asset.ticker,
      name: asset.name,
      category: asset.category,
      suggestedQuantity: technicalItem.suggestedQuantity,
      unitPriceMinorInBrl: technicalItem.unitPriceInCents,
      allocatedMinorInBrl: technicalItem.allocatedInCents,
      differenceBeforeInBasisPoints:
        technicalItem.differenceBeforeInBasisPoints,
      differenceAfterInBasisPoints: technicalItem.differenceAfterInBasisPoints,
    }
  })

  if (distributionTotal !== technicalPlan.totalDistribuidoEmCentavos) {
    throw new Error(
      'Distribution sum must match the technical plan allocated total'
    )
  }

  const accountedContribution = addSafeInteger(
    technicalPlan.totalDistribuidoEmCentavos,
    technicalPlan.saldoNaoAlocadoEmCentavos,
    'Accounted contribution'
  )
  if (accountedContribution !== contributionAmountInCents) {
    throw new Error(
      'Allocated and unallocated amounts must match the contribution amount'
    )
  }

  return {
    strategy: 'target-allocation',
    contributionAmountMinorInBrl: contributionAmountInCents,
    totalAllocatedMinorInBrl: technicalPlan.totalDistribuidoEmCentavos,
    unallocatedMinorInBrl: technicalPlan.saldoNaoAlocadoEmCentavos,
    stopReason: technicalPlan.technicalImpact.stopReason,
    items,
  }
}

export function buildTechnicalDossierV1({
  generatedAt,
  contributionAmountInCents,
  assets,
  portfolioSnapshot,
  strategy,
  globalAssetTargets,
  assetPrices,
  exchangeRates,
  technicalPlan,
}: BuildTechnicalDossierV1Input): TechnicalDossierV1 {
  assertValidGeneratedAt(generatedAt)
  assertSafeNonNegativeInteger(contributionAmountInCents, 'Contribution amount')

  const assetById = buildAssetMap(assets)
  const eligibleAssets = assets.filter(
    (asset) =>
      asset.status === 'active' &&
      ELIGIBLE_MARKET_CATEGORIES.has(asset.category)
  )
  const latestPriceByAsset = getLatestAssetPricesByAsset(assetPrices)
  const latestAssetPrices = eligibleAssets.flatMap((asset) => {
    const latestPrice = latestPriceByAsset.get(asset.id)
    return latestPrice
      ? [
          {
            assetId: asset.id,
            ticker: asset.ticker,
            price: { ...latestPrice.price },
            pricedAt: latestPrice.pricedAt,
            source: latestPrice.source,
          },
        ]
      : []
  })
  const missingLatestPriceAssetIds = eligibleAssets
    .filter((asset) => !latestPriceByAsset.has(asset.id))
    .map((asset) => asset.id)
  const latestUsdBrlRate = getLatestUsdBrlRate(exchangeRates)

  return {
    schemaVersion: TECHNICAL_DOSSIER_V1_SCHEMA_VERSION,
    generatedAt,
    portfolio: buildPortfolio(portfolioSnapshot),
    strategy: buildStrategy(strategy, globalAssetTargets),
    marketFacts: {
      latestAssetPrices,
      latestUsdBrlRate: copyExchangeRate(latestUsdBrlRate),
    },
    technicalPlan: buildTechnicalPlan(
      contributionAmountInCents,
      technicalPlan,
      assetById
    ),
    deviations: {
      totalBeforeInBasisPoints:
        technicalPlan.technicalImpact.totalDeviationBeforeInBasisPoints,
      totalAfterInBasisPoints:
        technicalPlan.technicalImpact.totalDeviationAfterInBasisPoints,
      totalReductionInBasisPoints:
        technicalPlan.technicalImpact.totalDeviationReductionInBasisPoints,
    },
    dataCoverage: {
      eligibleAssetCount: eligibleAssets.length,
      latestPriceFactCount: latestAssetPrices.length,
      missingLatestPriceAssetIds,
      manualLatestPriceCount: latestAssetPrices.filter(
        (price) => price.source === 'manual'
      ).length,
      marketProviderLatestPriceCount: latestAssetPrices.filter(
        (price) => price.source === 'market-provider'
      ).length,
      hasLatestUsdBrlRate: latestUsdBrlRate !== null,
    },
    limitations: LIMITATIONS.map((limitation) => ({ ...limitation })),
  }
}
