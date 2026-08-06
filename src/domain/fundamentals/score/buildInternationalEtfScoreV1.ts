// Motor de score, ETF internacional, fatia 1 (CAPE de VOO) - Sprint 16,
// Fase 5 (DEC-091).
//
// Cobre 1 dos 3 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 4): CAPE vs propria media historica de 10 anos, aplicavel so a
// VOO (indice-amplo-us). Spread de DY sobre TIPS (VNQ, precisa chave de
// API do FRED) e premio/desconto sobre NAV (todos os ETF, campo nao
// existe no N-PORT - DEC-083) ficam bloqueados, sem mudanca. VNQ e VEA
// nunca recebem este sinal - regime errado sempre gera 'wrong-regime'.
import {
  computeEtfCapeDeviationV1,
  type ShillerCapeHistoryPoint,
} from './computeEtfCapeDeviationV1'
import {
  isReferenceDateStale,
  SHILLER_CAPE_STALE_AFTER_DAYS,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type InternationalEtfSignalKey = 'etf_cape_vs_10y_avg'

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
  capeHistory: readonly ShillerCapeHistoryPoint[],
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
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

export function buildInternationalEtfScoreV1(input: {
  assetId: string
  assetSegment: AssetSegment | null
  capeHistory: readonly ShillerCapeHistoryPoint[]
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const signalKeys: InternationalEtfSignalKey[] = ['etf_cape_vs_10y_avg']

  if (input.assetSegment !== 'indice-amplo-us') {
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
    scoreCapeSignal(input.capeHistory, input.rules, input.now),
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
