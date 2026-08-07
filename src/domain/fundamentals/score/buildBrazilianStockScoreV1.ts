// Motor de score, ação BR - Sprint 16, Fase 5 (DEC-090, dívida/EBITDA
// nesta entrada; payout, DEC-097, nesta entrada; P/L vs série histórica,
// DEC-104 nesta entrada, fechando o item aberto sem prazo #3 do
// DEC-068/ROADMAP).
//
// Cobre os 4 sinais de docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md
// (secao 3): ROE, dívida líquida/EBITDA, payout (variação ano contra
// ano) e P/L vs própria série histórica. ROE nao se aplica a holding pura
// (ITSA4); dívida/EBITDA nao se aplica a banco (BBAS3, índice de
// Basileia e' a metrica de alavancagem correta la, nao esta); P/L nao se
// aplica a banco nem seguradora (BBAS3/PSSA3 - regra explícita do
// rascunho) - cada sinal tem seu proprio regime, regime errado sempre
// gera 'wrong-regime', nunca um numero. Payout se aplica a "Todos" por
// definicao do rascunho - sem restricao de regime.
import { computeStockRoeScaledV1 } from './computeStockRoeScaledV1'
import { computeStockNetDebtToEbitdaScaledV1 } from './computeStockNetDebtToEbitdaScaledV1'
import { computeStockPayoutRatioScaledV1 } from './computeStockPayoutRatioScaledV1'
import { computeStockPriceToEarningsScaledV1 } from './computeStockPriceToEarningsScaledV1'
import {
  computeStockPlQuartilePositionV1,
  STOCK_PL_HISTORY_MIN_POINTS,
  type StockPlHistoryPointV1,
} from './computeStockPlQuartilePositionV1'
import {
  computeProventoTrailingTwelveMonthValueV1,
  type ProventoDeclarationPointV1,
} from './computeProventoTrailingTwelveMonthValueV1'
import {
  CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
  isReferenceDateStale,
} from './staleness'
import type { AssetSegment } from '../../models/asset'
import type {
  ExactDecimalQuantity,
  FundamentalFactsAsset,
  SignedMonetaryFact,
} from '../types'
import type { AssetScoreSignal, AssetScoreV1, SignalRuleV1 } from './types'
import { ASSET_SCORE_V1_SCHEMA_VERSION } from './types'

export type BrazilianStockSignalKey =
  | 'stock_roe'
  | 'stock_net_debt_to_ebitda'
  | 'stock_payout_yoy_change'
  | 'stock_pl_vs_history'

// Fechamento histórico B3 (COTAHIST anual) por data de exercício do DFP
// (mesma referenceDate das demonstrações anuais) - insumo externo, não
// vem de `fundamental_snapshots`. `null` no mapa (chave ausente)
// significa "sem preço para esse exercício", tratado como ponto perdido,
// nunca como preço zero.
export type StockClosePriceHistoryPointV1 = {
  referenceDate: string
  closePriceInMinorUnits: number
}

// 1 ponto percentual = 0.01 em razão, ou 10_000 em unidades escaladas por
// FUNDAMENTAL_RATIO_SCALE (1e6) - divide o delta escalado por esse valor
// pra expressar o sinal (e as regras em signal_rules) diretamente em
// pontos percentuais, mais legível pra quem edita os limiares do que a
// unidade escalada crua.
const PERCENTAGE_POINT_SCALE_DIVISOR = 10_000

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

type AnnualStockFacts = {
  netIncome: SignedMonetaryFact | null
  issuedShares: ExactDecimalQuantity | null
  referenceDate: string
}

// As 2 demonstrações anuais mais recentes (DFP), mais novas primeiro -
// insumo pra variação ano contra ano do payout. Trimestrais (ITR) fora
// de proposito: o rascunho compara ano contra ano, nao trimestre contra
// trimestre, e ITR nao tem sempre o mesmo `issuedShares` da classe
// negociada preenchido.
function extractAnnualStockFacts(
  asset: FundamentalFactsAsset
): AnnualStockFacts[] {
  const facts: AnnualStockFacts[] = []
  for (const snapshot of asset.snapshots) {
    if (snapshot.kind !== 'brazilian-stock' || snapshot.period !== 'annual') {
      continue
    }
    facts.push({
      netIncome: snapshot.facts.netIncome,
      issuedShares: snapshot.facts.issuedShares,
      referenceDate: snapshot.referenceDate,
    })
  }
  return facts.sort((a, b) => (a.referenceDate < b.referenceDate ? 1 : -1))
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

// Payout, variação ano contra ano (docs/reference/ACOES_BR_SETORES_E_METRICAS.md,
// seção 3.6/3.7): compara o payout das 2 demonstrações anuais mais
// recentes - deliberadamente sem limiar fixo de nível (TAEE11 90-100%
// normal, WEGE3 baixo normal, régua única quebraria os dois). Aplica a
// "Todos" - sem restrição de regime, diferente de ROE/dívida-EBITDA.
function scorePayoutYoyChangeSignal(
  annualFacts: readonly AnnualStockFacts[],
  proventoDeclarations: readonly ProventoDeclarationPointV1[] | null,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  const signalKey = 'stock_payout_yoy_change'

  if (proventoDeclarations === null || annualFacts.length < 2) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const [current, prior] = annualFacts as [AnnualStockFacts, AnnualStockFacts]
  if (
    current.netIncome === null ||
    current.issuedShares === null ||
    prior.netIncome === null ||
    prior.issuedShares === null
  ) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const currentDividend = computeProventoTrailingTwelveMonthValueV1({
    declarations: proventoDeclarations,
    windowEndDate: current.referenceDate,
  })
  const priorDividend = computeProventoTrailingTwelveMonthValueV1({
    declarations: proventoDeclarations,
    windowEndDate: prior.referenceDate,
  })
  if (currentDividend === null || priorDividend === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  let currentPayoutScaled: number
  let priorPayoutScaled: number
  try {
    currentPayoutScaled = computeStockPayoutRatioScaledV1({
      trailingTwelveMonthDividendPerShare: currentDividend,
      issuedShares: current.issuedShares,
      netIncome: current.netIncome,
    })
    priorPayoutScaled = computeStockPayoutRatioScaledV1({
      trailingTwelveMonthDividendPerShare: priorDividend,
      issuedShares: prior.issuedShares,
      netIncome: prior.netIncome,
    })
  } catch {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const deltaInPercentagePoints =
    (currentPayoutScaled - priorPayoutScaled) / PERCENTAGE_POINT_SCALE_DIVISOR

  if (
    isReferenceDateStale(
      current.referenceDate,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: deltaInPercentagePoints,
      referenceDate: current.referenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(rules, signalKey, deltaInPercentagePoints)
  return {
    signalKey,
    status: 'applied',
    observedValue: deltaInPercentagePoints,
    points: rule?.points ?? 0,
  }
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

// P/L vs própria série histórica (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md,
// seção 3): "abaixo do próprio quartil inferior" pontua +1. Não se aplica
// a banco nem seguradora - regra explícita do rascunho, diferente de
// payout ("Todos"). Combina cada demonstração anual (lucro líquido +
// ações emitidas) com o fechamento B3 do mesmo exercício
// (`closePriceHistory`, casado por `referenceDate` exata); exercícios sem
// preço casado, sem lucro líquido positivo ou sem ações emitidas são
// descartados individualmente, nunca preenchidos com um valor
// inventado. Amostra resultante menor que `STOCK_PL_HISTORY_MIN_POINTS`
// fica `unavailable` (dado insuficiente pra um quartil confiável, nunca
// um número de amostra degenerada) - situação real da produção atual (só
// 2 exercícios de DFP ingeridos por empresa, ver docs/ROADMAP.md).
function scorePlVsHistorySignal(
  assetSegment: AssetSegment | null,
  annualFacts: readonly AnnualStockFacts[],
  closePriceHistory: readonly StockClosePriceHistoryPointV1[] | null,
  rules: readonly SignalRuleV1[],
  now: string
): AssetScoreSignal {
  const signalKey = 'stock_pl_vs_history'

  if (assetSegment === 'banco' || assetSegment === 'seguradora') {
    return { signalKey, status: 'unavailable', reason: 'wrong-regime' }
  }

  if (closePriceHistory === null || closePriceHistory.length === 0) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const closePriceByReferenceDate = new Map(
    closePriceHistory.map((point) => [
      point.referenceDate,
      point.closePriceInMinorUnits,
    ])
  )

  const plHistory: StockPlHistoryPointV1[] = []
  for (const facts of annualFacts) {
    const closePriceInMinorUnits = closePriceByReferenceDate.get(
      facts.referenceDate
    )
    if (
      closePriceInMinorUnits === undefined ||
      facts.netIncome === null ||
      facts.issuedShares === null
    ) {
      continue
    }
    if (facts.netIncome.amountInMinorUnits <= 0) {
      continue
    }

    let plScaled: number
    try {
      plScaled = computeStockPriceToEarningsScaledV1({
        closePriceInMinorUnits,
        issuedShares: facts.issuedShares,
        netIncome: facts.netIncome,
      })
    } catch {
      continue
    }

    plHistory.push({ referenceDate: facts.referenceDate, plScaled })
  }

  if (plHistory.length < STOCK_PL_HISTORY_MIN_POINTS) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  const position = computeStockPlQuartilePositionV1({ history: plHistory })
  if (position === null) {
    return { signalKey, status: 'unavailable', reason: 'missing-input' }
  }

  if (
    isReferenceDateStale(
      position.currentReferenceDate,
      now,
      CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS
    )
  ) {
    return {
      signalKey,
      status: 'stale',
      observedValue: position.deviationScaled,
      referenceDate: position.currentReferenceDate,
      staleAfterDays: CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS,
    }
  }

  const rule = findMatchingRule(rules, signalKey, position.deviationScaled)
  return {
    signalKey,
    status: 'applied',
    observedValue: position.deviationScaled,
    points: rule?.points ?? 0,
  }
}

export function buildBrazilianStockScoreV1(input: {
  asset: FundamentalFactsAsset
  assetSegment: AssetSegment | null
  proventoDeclarations: readonly ProventoDeclarationPointV1[] | null
  closePriceHistory?: readonly StockClosePriceHistoryPointV1[] | null
  rules: readonly SignalRuleV1[]
  now: string
}): AssetScoreV1 {
  const facts = extractLatestStockFacts(input.asset)
  const annualFacts = extractAnnualStockFacts(input.asset)

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
      scorePayoutYoyChangeSignal(
        annualFacts,
        input.proventoDeclarations,
        input.rules,
        input.now
      ),
      scorePlVsHistorySignal(
        input.assetSegment,
        annualFacts,
        input.closePriceHistory ?? null,
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
    scorePayoutYoyChangeSignal(
      annualFacts,
      input.proventoDeclarations,
      input.rules,
      input.now
    ),
    scorePlVsHistorySignal(
      input.assetSegment,
      annualFacts,
      input.closePriceHistory ?? null,
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
