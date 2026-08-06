// Motor de score, ETF internacional - Sprint 16, Fase 5 (DEC-091) e Fase 4
// fatia ETF (DEC-092).
//
// Cobre 2 dos 3 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 4): CAPE vs propria media historica de 10 anos (aplicavel so a
// VOO, indice-amplo-us) e premio/desconto sobre o NAV (aplicavel aos 3
// ETF - fonte e' o site do proprio emissor, nao o N-PORT, ver DEC-092).
// Spread de DY sobre TIPS (VNQ, precisa chave de API do FRED) segue
// bloqueado, sem mudanca. Ativo fora dos 3 segmentos de ETF nunca recebe
// nenhum sinal - regime errado sempre gera 'wrong-regime'.
import {
  computeEtfCapeDeviationV1,
  type ShillerCapeHistoryPoint,
} from './computeEtfCapeDeviationV1'
import {
  isReferenceDateStale,
  SHILLER_CAPE_STALE_AFTER_DAYS,
  VANGUARD_PREMIUM_DISCOUNT_STALE_AFTER_DAYS,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type InternationalEtfSignalKey =
  'etf_cape_vs_10y_avg' | 'etf_premium_discount_vs_nav'

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

export function buildInternationalEtfScoreV1(input: {
  assetId: string
  ticker: string
  assetSegment: AssetSegment | null
  capeHistory: readonly ShillerCapeHistoryPoint[]
  etfValuations: readonly EtfPremiumDiscountPoint[]
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const signalKeys: InternationalEtfSignalKey[] = [
    'etf_cape_vs_10y_avg',
    'etf_premium_discount_vs_nav',
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
