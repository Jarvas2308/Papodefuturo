import { describe, expect, it } from 'vitest'
import type { ExactDecimalQuantity, FundamentalFactsAsset } from '../types'
import {
  buildBrazilianStockScoreV1,
  type StockClosePriceHistoryPointV1,
} from './buildBrazilianStockScoreV1'
import type { ProventoDeclarationPointV1 } from './computeProventoTrailingTwelveMonthValueV1'
import { DEFAULT_STOCK_SIGNAL_RULES } from './defaultStockSignalRules'

const NOW = '2026-08-06T00:00:00.000Z'

type Money = { amountInMinorUnits: number; currency: 'BRL' } | null

function stockSnapshot(
  referenceDate: string,
  facts: {
    netIncome?: Money
    totalEquity?: Money
    financialDebtCurrent?: Money
    financialDebtNonCurrent?: Money
    cashAndEquivalents?: Money
    ebit?: Money
    depreciationAndAmortization?: Money
    issuedShares?: ExactDecimalQuantity | null
    period?: 'annual' | 'quarterly'
  } = {}
): FundamentalFactsAsset['snapshots'][number] {
  const period = facts.period ?? 'annual'
  return {
    assetId: 'asset-bbas3',
    kind: 'brazilian-stock',
    referenceDate,
    period,
    source: period === 'annual' ? 'cvm-dfp' : 'cvm-itr',
    sourceDocumentId: `cvm-dfp-bbas3-${referenceDate}`,
    facts: {
      totalRevenue: null,
      netIncome: facts.netIncome ?? null,
      totalAssets: null,
      totalEquity: facts.totalEquity ?? null,
      operatingCashFlow: null,
      issuedShares: facts.issuedShares ?? null,
      financialDebtCurrent: facts.financialDebtCurrent ?? null,
      financialDebtNonCurrent: facts.financialDebtNonCurrent ?? null,
      cashAndEquivalents: facts.cashAndEquivalents ?? null,
      ebit: facts.ebit ?? null,
      depreciationAndAmortization: facts.depreciationAndAmortization ?? null,
    },
  }
}

function buildAsset(
  snapshots: FundamentalFactsAsset['snapshots']
): FundamentalFactsAsset {
  return {
    assetId: 'asset-bbas3',
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    category: 'brazilian-stock',
    snapshots,
  }
}

const money = (amountInMinorUnits: number): Money => ({
  amountInMinorUnits,
  currency: 'BRL',
})

// Insumos de netDebt/EBITDA de um caso saudável (net debt 10, EBITDA 20 ->
// 0,5x -> +1), usados nos testes de ROE que não são sobre este sinal, pra
// não deixá-lo undefined-por-omissão e poluir a asserção com missing-input.
function healthyLeverageFacts() {
  return {
    financialDebtCurrent: money(600_000),
    financialDebtNonCurrent: money(500_000),
    cashAndEquivalents: money(100_000),
    ebit: money(1_500_000),
    depreciationAndAmortization: money(500_000),
  }
}

describe('buildBrazilianStockScoreV1 - ROE', () => {
  it('scores ROE as applied and +2 for a high-return bank', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(2_000_000),
        totalEquity: money(10_000_000), // 20% -> +2
        ...healthyLeverageFacts(),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'stock_roe',
      status: 'applied',
      observedValue: 200_000,
      points: 2,
    })
    // banco: dívida/EBITDA é sempre wrong-regime, mesmo com insumos presentes.
    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
    expect(score.totalPoints).toBe(2)
  })

  it('scores ROE as 0 within the neutral band', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(1_000_000),
        totalEquity: money(10_000_000), // 10% -> 0
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: 0 })
  })

  it('scores ROE as -1 below the lower band', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(500_000),
        totalEquity: money(10_000_000), // 5% -> -1
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'seguradora',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: -1 })
  })

  it('marks ROE unavailable for a pure holding regime, but keeps net debt/EBITDA scoring normally', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(2_000_000),
        totalEquity: money(10_000_000),
        ...healthyLeverageFacts(),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'holding',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'stock_roe',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
    expect(score.signals[1]).toMatchObject({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'applied',
    })
    expect(score.totalPoints).toBe(
      score.signals[1]!.status === 'applied' ? score.signals[1]!.points : 0
    )
  })

  it('marks ROE unavailable when no stock snapshot exists yet', () => {
    const asset = buildAsset([])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'stock_roe',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks ROE unavailable when total equity is missing', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', { netIncome: money(2_000_000) }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks ROE unavailable when total equity is non-positive', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(2_000_000),
        totalEquity: money(0),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks ROE stale when the reference date is past the threshold', () => {
    const asset = buildAsset([
      stockSnapshot('2025-01-01', {
        netIncome: money(2_000_000),
        totalEquity: money(10_000_000),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'stock_roe',
      status: 'stale',
      observedValue: 200_000,
      referenceDate: '2025-01-01',
      staleAfterDays: 180,
    })
  })

  it('uses the most recent stock snapshot when several exist', () => {
    const asset = buildAsset([
      stockSnapshot('2026-03-31', {
        netIncome: money(500_000),
        totalEquity: money(10_000_000),
      }),
      stockSnapshot('2026-06-30', {
        netIncome: money(2_000_000),
        totalEquity: money(10_000_000),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({
      observedValue: 200_000,
      points: 2,
    })
  })
})

describe('buildBrazilianStockScoreV1 - net debt / EBITDA', () => {
  it('scores +1 for a healthy net cash / low leverage position (< 1x)', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', healthyLeverageFacts()),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    // netDebt = 600_000+500_000-100_000 = 1_000_000; EBITDA = 1_500_000+500_000 = 2_000_000
    // ratio = 1_000_000/2_000_000 = 0.5x -> 500_000 scaled -> +1
    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'applied',
      observedValue: 500_000,
      points: 1,
    })
  })

  it('scores 0 within the neutral 1x-3x band', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        financialDebtCurrent: money(1_000_000),
        financialDebtNonCurrent: money(1_000_000),
        cashAndEquivalents: money(0),
        ebit: money(1_000_000),
        depreciationAndAmortization: money(0),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    // netDebt = 2_000_000, EBITDA = 1_000_000 -> 2x -> 0
    expect(score.signals[1]).toMatchObject({
      observedValue: 2_000_000,
      points: 0,
    })
  })

  it('scores -1 for high leverage (> 3x)', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        financialDebtCurrent: money(3_000_000),
        financialDebtNonCurrent: money(2_000_000),
        cashAndEquivalents: money(0),
        ebit: money(1_000_000),
        depreciationAndAmortization: money(0),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'seguradora',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    // netDebt = 5_000_000, EBITDA = 1_000_000 -> 5x -> -1
    expect(score.signals[1]).toMatchObject({
      observedValue: 5_000_000,
      points: -1,
    })
  })

  it('scores +1 for a net cash position (negative net debt)', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        financialDebtCurrent: money(100_000),
        financialDebtNonCurrent: money(100_000),
        cashAndEquivalents: money(1_000_000),
        ebit: money(500_000),
        depreciationAndAmortization: money(100_000),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    // netDebt = -800_000 (net cash) -> below 1x threshold -> +1
    expect(score.signals[1]).toMatchObject({ points: 1 })
    expect(
      (score.signals[1] as { observedValue: number }).observedValue
    ).toBeLessThan(0)
  })

  it('marks unavailable for banco regardless of inputs (wrong-regime)', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', healthyLeverageFacts()),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
  })

  it('marks unavailable when any input is missing', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        financialDebtCurrent: money(100_000),
        financialDebtNonCurrent: money(100_000),
        // cashAndEquivalents ausente
        ebit: money(500_000),
        depreciationAndAmortization: money(100_000),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks unavailable when no stock snapshot exists yet', () => {
    const asset = buildAsset([])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('degrades non-positive EBITDA to unavailable instead of throwing', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        financialDebtCurrent: money(100_000),
        financialDebtNonCurrent: money(100_000),
        cashAndEquivalents: money(0),
        ebit: money(-500_000),
        depreciationAndAmortization: money(100_000),
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks stale when the reference date is past the threshold', () => {
    const asset = buildAsset([
      stockSnapshot('2025-01-01', healthyLeverageFacts()),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'stock_net_debt_to_ebitda',
      status: 'stale',
      observedValue: 500_000,
      referenceDate: '2025-01-01',
      staleAfterDays: 180,
    })
  })
})

describe('buildBrazilianStockScoreV1 - payout YoY', () => {
  const declaration = (
    protocol: string,
    grossValuePerShare: ExactDecimalQuantity,
    paymentDate: string
  ): ProventoDeclarationPointV1 => ({
    protocol,
    version: 1,
    grossValuePerShare,
    paymentDate,
  })

  it('scores a >10pp payout drop as -2 (applied)', () => {
    const asset = buildAsset([
      stockSnapshot('2025-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2026-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])
    const proventoDeclarations: ProventoDeclarationPointV1[] = [
      // Prior 12m (window ending 2025-06-30): R$1.00/share x 1000 = R$1,000 -> payout 50%
      declaration('p-prior', { unscaledValue: 100, scale: 2 }, '2025-01-15'),
      // Current 12m (window ending 2026-06-30): R$0.50/share x 1000 = R$500 -> payout 25%
      declaration('p-current', { unscaledValue: 50, scale: 2 }, '2026-01-15'),
    ]

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toEqual({
      signalKey: 'stock_payout_yoy_change',
      status: 'applied',
      observedValue: -25,
      points: -2,
    })
  })

  it('scores a payout increase outside both bands as applied with 0 points', () => {
    const asset = buildAsset([
      stockSnapshot('2025-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2026-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])
    const proventoDeclarations: ProventoDeclarationPointV1[] = [
      declaration('p-prior', { unscaledValue: 100, scale: 2 }, '2025-01-15'),
      declaration('p-current', { unscaledValue: 150, scale: 2 }, '2026-01-15'),
    ]

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toEqual({
      signalKey: 'stock_payout_yoy_change',
      status: 'applied',
      observedValue: 25,
      points: 0,
    })
  })

  it('is unavailable when no provento data was resolved for this ticker', () => {
    const asset = buildAsset([
      stockSnapshot('2025-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2026-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toEqual({
      signalKey: 'stock_payout_yoy_change',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('is unavailable with only one annual snapshot (no prior year to compare)', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])
    const proventoDeclarations: ProventoDeclarationPointV1[] = [
      declaration('p-current', { unscaledValue: 150, scale: 2 }, '2026-01-15'),
    ]

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toEqual({
      signalKey: 'stock_payout_yoy_change',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('ignores quarterly (ITR) snapshots for the year-over-year comparison', () => {
    const asset = buildAsset([
      stockSnapshot('2025-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2026-03-31', {
        netIncome: money(9_999_999),
        issuedShares: { unscaledValue: 1000, scale: 0 },
        period: 'quarterly',
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: [
        declaration('p-prior', { unscaledValue: 100, scale: 2 }, '2025-01-15'),
      ],
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    // Only 1 real annual snapshot after filtering out the quarterly one.
    expect(score.signals[2]).toEqual({
      signalKey: 'stock_payout_yoy_change',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })
})

describe('buildBrazilianStockScoreV1 - P/L vs própria série histórica', () => {
  // 5 exercícios anuais, lucro líquido e ações emitidas constantes -
  // varia só o preço de fechamento, do mais caro (2021) pro mais barato
  // (2025, exercício mais recente): P/L cai de 100x pra 30x. Quartil
  // inferior (rank 2 de 5) = 70x -> exercício mais recente (30x) fica
  // estritamente abaixo -> +1.
  // Exercício mais recente em 2026-06-30 (dentro do limiar de frescor de
  // 180 dias contado de NOW = 2026-08-06, mesmo padrão dos demais testes
  // "applied" deste arquivo).
  function fiveYearAnnualFacts(): FundamentalFactsAsset['snapshots'] {
    const issuedShares: ExactDecimalQuantity = { unscaledValue: 1000, scale: 0 }
    return [
      stockSnapshot('2022-06-30', { netIncome: money(200_000), issuedShares }),
      stockSnapshot('2023-06-30', { netIncome: money(200_000), issuedShares }),
      stockSnapshot('2024-06-30', { netIncome: money(200_000), issuedShares }),
      stockSnapshot('2025-06-30', { netIncome: money(200_000), issuedShares }),
      stockSnapshot('2026-06-30', { netIncome: money(200_000), issuedShares }),
    ]
  }

  function fiveYearClosePriceHistory(): StockClosePriceHistoryPointV1[] {
    return [
      { referenceDate: '2022-06-30', closePriceInMinorUnits: 20_000 }, // PL 100x
      { referenceDate: '2023-06-30', closePriceInMinorUnits: 18_000 }, // PL 90x
      { referenceDate: '2024-06-30', closePriceInMinorUnits: 16_000 }, // PL 80x
      { referenceDate: '2025-06-30', closePriceInMinorUnits: 14_000 }, // PL 70x
      { referenceDate: '2026-06-30', closePriceInMinorUnits: 6_000 }, // PL 30x
    ]
  }

  it('scores +1 when the most recent P/L sits below the own lower quartile', () => {
    const asset = buildAsset(fiveYearAnnualFacts())

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory: fiveYearClosePriceHistory(),
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'applied',
      observedValue: -40_000_000,
      points: 1,
    })
  })

  it('scores 0 when the most recent P/L sits at or above the own lower quartile', () => {
    const asset = buildAsset(fiveYearAnnualFacts())
    // Inverte a ordem dos preços: exercício mais recente vira o mais caro.
    const invertedPrices = [...fiveYearClosePriceHistory()].reverse()
    const closePriceHistory = fiveYearAnnualFacts().map((snapshot, index) => ({
      referenceDate: snapshot.referenceDate,
      closePriceInMinorUnits: invertedPrices[index]!.closePriceInMinorUnits,
    }))

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toMatchObject({
      signalKey: 'stock_pl_vs_history',
      status: 'applied',
      points: 0,
    })
  })

  it('is unavailable for banco regardless of inputs (wrong-regime)', () => {
    const asset = buildAsset(fiveYearAnnualFacts())

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      proventoDeclarations: null,
      closePriceHistory: fiveYearClosePriceHistory(),
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
  })

  it('is unavailable for seguradora regardless of inputs (wrong-regime)', () => {
    const asset = buildAsset(fiveYearAnnualFacts())

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'seguradora',
      proventoDeclarations: null,
      closePriceHistory: fiveYearClosePriceHistory(),
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
  })

  it('is unavailable when no close price history was resolved', () => {
    const asset = buildAsset(fiveYearAnnualFacts())

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory: null,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('is unavailable with fewer than the minimum sample size — production reality today (only 2 DFP years ingested)', () => {
    const asset = buildAsset([
      stockSnapshot('2025-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2026-06-30', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])
    const closePriceHistory: StockClosePriceHistoryPointV1[] = [
      { referenceDate: '2025-06-30', closePriceInMinorUnits: 14_000 },
      { referenceDate: '2026-06-30', closePriceInMinorUnits: 6_000 },
    ]

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('drops a fiscal year with no matching close price and still degrades to unavailable below the minimum', () => {
    const asset = buildAsset(fiveYearAnnualFacts())
    // Falta o preço de 2022 - só 4 exercícios casados, abaixo do mínimo.
    const closePriceHistory = fiveYearClosePriceHistory().filter(
      (point) => point.referenceDate !== '2022-06-30'
    )

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks stale when the most recent matched fiscal year is past the threshold', () => {
    const asset = buildAsset([
      stockSnapshot('2020-12-31', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2021-12-31', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2022-12-31', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2023-12-31', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
      stockSnapshot('2024-01-01', {
        netIncome: money(200_000),
        issuedShares: { unscaledValue: 1000, scale: 0 },
      }),
    ])
    const closePriceHistory: StockClosePriceHistoryPointV1[] = [
      { referenceDate: '2020-12-31', closePriceInMinorUnits: 20_000 },
      { referenceDate: '2021-12-31', closePriceInMinorUnits: 18_000 },
      { referenceDate: '2022-12-31', closePriceInMinorUnits: 16_000 },
      { referenceDate: '2023-12-31', closePriceInMinorUnits: 14_000 },
      { referenceDate: '2024-01-01', closePriceInMinorUnits: 6_000 },
    ]

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      proventoDeclarations: null,
      closePriceHistory,
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'stock_pl_vs_history',
      status: 'stale',
      observedValue: -40_000_000,
      referenceDate: '2024-01-01',
      staleAfterDays: 180,
    })
  })
})
