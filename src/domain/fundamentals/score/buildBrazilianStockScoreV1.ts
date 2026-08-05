// Motor de score, ação BR, fatia 1 (ROE) - Sprint 16, Fase 5 (DEC-090).
//
// Cobre 1 dos 4 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 3): ROE. Payout (precisa valor de provento, mesmo bloqueio de
// FII - DEC-082), divida liquida/EBITDA (precisa provider novo - debito
// financeiro e D&A nao sao extraidos ainda) e P/L vs serie historica
// (precisa serie de precos historicos por periodo, nao so o mais recente)
// ficam para as proximas fatias. ROE nao se aplica a holding pura
// (ITSA4) - regime errado sempre gera 'wrong-regime', nunca um numero.
import { computeStockRoeScaledV1 } from './computeStockRoeScaledV1'
import {
  CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
  isReferenceDateStale,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type { FundamentalFactsAsset } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type BrazilianStockSignalKey = 'stock_roe'

function extractLatestStockFacts(asset: FundamentalFactsAsset): {
  netIncome: { amountInMinorUnits: number; currency: 'BRL' | 'USD' } | null
  totalEquity: { amountInMinorUnits: number; currency: 'BRL' | 'USD' } | null
  referenceDate: string | null
} {
  const stockSnapshots = asset.snapshots.filter(
    (snapshot) => snapshot.kind === 'brazilian-stock'
  )
  const latest = stockSnapshots.reduce<(typeof stockSnapshots)[number] | null>(
    (best, snapshot) => {
      if (best === null || snapshot.referenceDate > best.referenceDate) {
        return snapshot
      }
      return best
    },
    null
  )

  if (latest === null || latest.kind !== 'brazilian-stock') {
    return { netIncome: null, totalEquity: null, referenceDate: null }
  }

  return {
    netIncome: latest.facts.netIncome,
    totalEquity: latest.facts.totalEquity,
    referenceDate: latest.referenceDate,
  }
}

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

function scoreRoeSignal(
  netIncome: { amountInMinorUnits: number; currency: 'BRL' | 'USD' } | null,
  totalEquity: { amountInMinorUnits: number; currency: 'BRL' | 'USD' } | null,
  referenceDate: string | null,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  if (netIncome === null || totalEquity === null || referenceDate === null) {
    return {
      signalKey: 'stock_roe',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }
  if (totalEquity.amountInMinorUnits <= 0) {
    return {
      signalKey: 'stock_roe',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }
  if (
    isReferenceDateStale(
      referenceDate,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey: 'stock_roe',
      status: 'stale',
      observedValue: computeStockRoeScaledV1({ netIncome, totalEquity }),
      referenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }
  const roeScaled = computeStockRoeScaledV1({ netIncome, totalEquity })
  const rule = findMatchingRule(rules, 'stock_roe', roeScaled)
  return {
    signalKey: 'stock_roe',
    status: 'applied',
    observedValue: roeScaled,
    points: rule?.points ?? 0,
  }
}

export function buildBrazilianStockScoreV1(input: {
  asset: FundamentalFactsAsset
  assetSegment: AssetSegment | null
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const signalKeys: BrazilianStockSignalKey[] = ['stock_roe']

  if (input.assetSegment === 'holding') {
    return {
      schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
      assetId: input.asset.assetId,
      totalPoints: 0,
      signals: signalKeys.map((signalKey): AssetScoreSignal => ({
        signalKey,
        status: 'unavailable',
        reason: 'wrong-regime',
      })),
    }
  }

  const facts = extractLatestStockFacts(input.asset)
  const signals: AssetScoreSignal[] = [
    scoreRoeSignal(
      facts.netIncome,
      facts.totalEquity,
      facts.referenceDate,
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
    assetId: input.asset.assetId,
    totalPoints,
    signals,
  }
}
