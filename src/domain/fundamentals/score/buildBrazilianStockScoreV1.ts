// Motor de score, ação BR - Sprint 16, Fase 5 (DEC-090, dívida/EBITDA
// nesta entrada).
//
// Cobre 2 dos 4 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 3): ROE e dívida líquida/EBITDA. Payout (precisa valor de
// provento, mesmo bloqueio de FII - DEC-082) e P/L vs serie historica
// (precisa serie de precos historicos por periodo, nao so o mais recente)
// ficam para as proximas fatias. ROE nao se aplica a holding pura
// (ITSA4); dívida/EBITDA nao se aplica a banco (BBAS3, índice de Basileia
// e' a metrica de alavancagem correta la, nao esta) - cada sinal tem seu
// proprio regime, regime errado sempre gera 'wrong-regime', nunca um
// numero.
import { computeStockRoeScaledV1 } from './computeStockRoeScaledV1'
import { computeStockNetDebtToEbitdaScaledV1 } from './computeStockNetDebtToEbitdaScaledV1'
import {
  CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
  isReferenceDateStale,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type { FundamentalFactsAsset, SignedMonetaryFact } from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type BrazilianStockSignalKey = 'stock_roe' | 'stock_net_debt_to_ebitda'

function extractLatestStockFacts(asset: FundamentalFactsAsset): {
  netIncome: SignedMonetaryFact | null
  totalEquity: SignedMonetaryFact | null
  financialDebtCurrent: SignedMonetaryFact | null
  financialDebtNonCurrent: SignedMonetaryFact | null
  cashAndEquivalents: SignedMonetaryFact | null
  ebit: SignedMonetaryFact | null
  depreciationAndAmortization: SignedMonetaryFact | null
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
    return {
      netIncome: null,
      totalEquity: null,
      financialDebtCurrent: null,
      financialDebtNonCurrent: null,
      cashAndEquivalents: null,
      ebit: null,
      depreciationAndAmortization: null,
      referenceDate: null,
    }
  }

  return {
    netIncome: latest.facts.netIncome,
    totalEquity: latest.facts.totalEquity,
    financialDebtCurrent: latest.facts.financialDebtCurrent,
    financialDebtNonCurrent: latest.facts.financialDebtNonCurrent,
    cashAndEquivalents: latest.facts.cashAndEquivalents,
    ebit: latest.facts.ebit,
    depreciationAndAmortization: latest.facts.depreciationAndAmortization,
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

function scoreNetDebtToEbitdaSignal(
  assetSegment: AssetSegment | null,
  facts: ReturnType<typeof extractLatestStockFacts>,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  if (assetSegment === 'banco') {
    return {
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'wrong-regime',
    }
  }

  const {
    financialDebtCurrent,
    financialDebtNonCurrent,
    cashAndEquivalents,
    ebit,
    depreciationAndAmortization,
    referenceDate,
  } = facts

  if (
    financialDebtCurrent === null ||
    financialDebtNonCurrent === null ||
    cashAndEquivalents === null ||
    ebit === null ||
    depreciationAndAmortization === null ||
    referenceDate === null
  ) {
    return {
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'missing-input',
    }
  }

  // EBITDA nao positivo nao tem razao de alavancagem com sentido -
  // degrade pra 'unavailable' em vez de propagar a excecao de
  // computeStockNetDebtToEbitdaScaledV1 (mesmo espirito de
  // best-effort do resto do motor: dado real problematico nunca quebra
  // a simulacao de aporte).
  let ratioScaled: number
  try {
    ratioScaled = computeStockNetDebtToEbitdaScaledV1({
      financialDebtCurrent,
      financialDebtNonCurrent,
      cashAndEquivalents,
      ebit,
      depreciationAndAmortization,
    })
  } catch {
    return {
      signalKey: 'stock_net_debt_to_ebitda',
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
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'stale',
      observedValue: ratioScaled,
      referenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(rules, 'stock_net_debt_to_ebitda', ratioScaled)
  return {
    signalKey: 'stock_net_debt_to_ebitda',
    status: 'applied',
    observedValue: ratioScaled,
    points: rule?.points ?? 0,
  }
}

export function buildBrazilianStockScoreV1(input: {
  asset: FundamentalFactsAsset
  assetSegment: AssetSegment | null
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const facts = extractLatestStockFacts(input.asset)

  if (input.assetSegment === 'holding') {
    const signals: AssetScoreSignal[] = [
      {
        signalKey: 'stock_roe',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      scoreNetDebtToEbitdaSignal(
        input.assetSegment,
        facts,
        input.rules,
        input.now
      ),
    ]

    return {
      schemaVersion: ASSET_SCORE_V1_SCHEMA_VERSION,
      assetId: input.asset.assetId,
      totalPoints: signals.reduce(
        (sum, signal) =>
          sum + (signal.status === 'applied' ? signal.points : 0),
        0
      ),
      signals,
    }
  }

  const signals: AssetScoreSignal[] = [
    scoreRoeSignal(
      facts.netIncome,
      facts.totalEquity,
      facts.referenceDate,
      input.rules,
      input.now
    ),
    scoreNetDebtToEbitdaSignal(
      input.assetSegment,
      facts,
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
