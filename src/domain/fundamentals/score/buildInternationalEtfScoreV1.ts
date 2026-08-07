// Motor de score, ETF internacional - Sprint 16, Fase 5 (DEC-091) e Fase 4
// fatia ETF (DEC-092).
//
// Cobre os 3 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 4): CAPE vs propria media historica de 10 anos (aplicavel so a
// VOO, indice-amplo-us), premio/desconto sobre o NAV (aplicavel aos 3
// ETF - fonte e' o site do proprio emissor, nao o N-PORT, ver DEC-092) e
// spread de DY sobre a TIPS de 10 anos (aplicavel so a VNQ, reit-us -
// DY vem do N-CSR anual da SEC, taxa TIPS vem do FRED DFII10, DEC-093).
// Ativo fora dos 3 segmentos de ETF nunca recebe nenhum sinal - regime
// errado sempre gera 'wrong-regime'.
import {
  computeEtfCapeDeviationV1,
  type ShillerCapeHistoryPoint,
} from './computeEtfCapeDeviationV1'
import { computeEtfDyTipsSpreadV1 } from './computeEtfDyTipsSpreadV1'
import {
  FRED_DFII10_STALE_AFTER_DAYS,
  isReferenceDateStale,
  SEC_N_CSR_STALE_AFTER_DAYS,
  SHILLER_CAPE_STALE_AFTER_DAYS,
  VANGUARD_PREMIUM_DISCOUNT_STALE_AFTER_DAYS,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type { ExactDecimalQuantity } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type InternationalEtfSignalKey =
  | 'etf_cape_vs_10y_avg'
  | 'etf_premium_discount_vs_nav'
  | 'etf_dy_tips_spread'

// Uma linha da tabela "Financial Highlights" da classe ETF do fundo, no
// N-CSR anual da SEC (etf_distribution_values). Dado global por ticker,
// sem FK pra asset_id - mesmo padrao de market_etf_valuations.
export type EtfDistributionValuePoint = {
  ticker: string
  fiscalYearEndDate: string
  totalDistributionsPerShare: ExactDecimalQuantity
  netAssetValueEndOfPeriod: ExactDecimalQuantity
}

// Prêmio/desconto vem por ticker (market_etf_valuations, dado global sem
// FK pra asset_id - mesmo padrão de market_reference_rates/
// market_valuation_ratios), não por assetId.
export type EtfPremiumDiscountPoint = {
  ticker: string
  referenceDate: string
  premiumDiscountBasisPoints: number
}

const ETF_SEGMENTS: readonly AssetSegment[] = [
  'indice-amplo-us',
  'reit-us',
  'mercados-desenvolvidos-ex-us',
]

function findMatchingRule(
  rules: readonly SignalRuleV1[],
  signalKey: string,
  value: number
): SignalRuleV1 | null {
  return (
    rules.find(
      (rule) =>
        rule.signalKey === signalKey &&
        rule.enabled &&
        (rule.minValue === null || value >= rule.minValue) &&
        (rule.maxValue === null || value < rule.maxValue)
    ) ?? null
  )
}

function scoreCapeSignal(
  assetSegment: AssetSegment | null,
  capeHistory: readonly ShillerCapeHistoryPoint[],
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  if (assetSegment !== 'indice-amplo-us') {
    return {
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'unavailable',
      reason: 'wrong-regime',
    }
  }

  if (capeHistory.length === 0) {
    return {
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }

  const latestReferenceDate = capeHistory.reduce((best, point) =>
    point.referenceDate > best.referenceDate ? point : best
  ).referenceDate

  if (
    isReferenceDateStale(
      latestReferenceDate,
      now,
      SHILLER_CAPE_STALE_AFTER_DAYS
    )
  ) {
    const { deviationScaled } = computeEtfCapeDeviationV1({
      history: capeHistory,
    })
    return {
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'stale',
      observedValue: deviationScaled,
      referenceDate: latestReferenceDate,
      staleAfterDays: SHILLER_CAPE_STALE_AFTER_DAYS,
    }
  }

  const { deviationScaled } = computeEtfCapeDeviationV1({
    history: capeHistory,
  })
  const rule = findMatchingRule(rules, 'etf_cape_vs_10y_avg', deviationScaled)
  return {
    signalKey: 'etf_cape_vs_10y_avg',
    status: 'applied',
    observedValue: deviationScaled,
    points: rule?.points ?? 0,
  }
}

function scorePremiumDiscountSignal(
  ticker: string,
  etfValuations: readonly EtfPremiumDiscountPoint[],
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  const forTicker = etfValuations.filter((point) => point.ticker === ticker)

  if (forTicker.length === 0) {
    return {
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }

  const latest = forTicker.reduce((best, point) =>
    point.referenceDate > best.referenceDate ? point : best
  )

  if (
    isReferenceDateStale(
      latest.referenceDate,
      now,
      VANGUARD_PREMIUM_DISCOUNT_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'stale',
      observedValue: latest.premiumDiscountBasisPoints,
      referenceDate: latest.referenceDate,
      staleAfterDays: VANGUARD_PREMIUM_DISCOUNT_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(
    rules,
    'etf_premium_discount_vs_nav',
    latest.premiumDiscountBasisPoints
  )
  return {
    signalKey: 'etf_premium_discount_vs_nav',
    status: 'applied',
    observedValue: latest.premiumDiscountBasisPoints,
    points: rule?.points ?? 0,
  }
}

function scoreDyTipsSpreadSignal(
  ticker: string,
  assetSegment: AssetSegment | null,
  distributionValues: readonly EtfDistributionValuePoint[],
  tipsRate: { rateScaled: number; rateScale: number; pricedAt: string } | null,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  const signalKey = 'etf_dy_tips_spread'

  // O rascunho aplica este sinal so' ao ETF de REIT (VNQ). ETF de indice
  // amplo e de mercados desenvolvidos nao sao instrumentos de renda
  // comparaveis a uma TIPS - regime errado, nao dado faltando.
  if (assetSegment !== 'reit-us') {
    return { signalKey, status: 'unavailable', reason: 'wrong-regime' }
  }

  if (tipsRate === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const forTicker = distributionValues.filter(
    (point) => point.ticker === ticker
  )
  if (forTicker.length === 0) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const latest = forTicker.reduce((best, point) =>
    point.fiscalYearEndDate > best.fiscalYearEndDate ? point : best
  )

  const spread = computeEtfDyTipsSpreadV1({
    totalDistributionsPerShare: latest.totalDistributionsPerShare,
    netAssetValueEndOfPeriod: latest.netAssetValueEndOfPeriod,
    tipsRateScaled: tipsRate.rateScaled,
    tipsRateScale: tipsRate.rateScale,
  })

  // Duas fontes com ritmos de publicacao muito diferentes: a mais velha
  // das duas manda. N-CSR primeiro (anual), TIPS depois (diaria).
  if (
    isReferenceDateStale(
      latest.fiscalYearEndDate,
      now,
      SEC_N_CSR_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: spread,
      referenceDate: latest.fiscalYearEndDate,
      staleAfterDays: SEC_N_CSR_STALE_AFTER_DAYS,
    }
  }

  if (
    isReferenceDateStale(tipsRate.pricedAt, now, FRED_DFII10_STALE_AFTER_DAYS)
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: spread,
      referenceDate: tipsRate.pricedAt,
      staleAfterDays: FRED_DFII10_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(rules, signalKey, spread)
  return {
    signalKey,
    status: 'applied',
    observedValue: spread,
    points: rule?.points ?? 0,
  }
}

export function buildInternationalEtfScoreV1(input: {
  assetId: string
  ticker: string
  assetSegment: AssetSegment | null
  capeHistory: readonly ShillerCapeHistoryPoint[]
  etfValuations: readonly EtfPremiumDiscountPoint[]
  distributionValues?: readonly EtfDistributionValuePoint[]
  tipsRate?: { rateScaled: number; rateScale: number; pricedAt: string } | null
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const signalKeys: InternationalEtfSignalKey[] = [
    'etf_cape_vs_10y_avg',
    'etf_premium_discount_vs_nav',
    'etf_dy_tips_spread',
  ]

  const isEtfRegime =
    input.assetSegment !== null && ETF_SEGMENTS.includes(input.assetSegment)

  if (!isEtfRegime) {
    return {
      schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
      assetId: input.assetId,
      totalPoints: 0,
      signals: signalKeys.map((signalKey): AssetScoreSignal => ({
        signalKey,
        status: 'unavailable',
        reason: 'wrong-regime',
      })),
    }
  }

  const signals: AssetScoreSignal[] = [
    scoreCapeSignal(
      input.assetSegment,
      input.capeHistory,
      input.rules,
      input.now
    ),
    scorePremiumDiscountSignal(
      input.ticker,
      input.etfValuations,
      input.rules,
      input.now
    ),
    scoreDyTipsSpreadSignal(
      input.ticker,
      input.assetSegment,
      input.distributionValues ?? [],
      input.tipsRate ?? null,
      input.rules,
      input.now
    ),
  ]

  const totalPoints = signals.reduce(
    (sum, signal) => sum + (signal.status === 'applied' ? signal.points : 0),
    0
  )

  return {
    schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
    assetId: input.assetId,
    totalPoints,
    signals,
  }
}
