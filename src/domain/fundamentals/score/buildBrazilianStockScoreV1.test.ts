import { describe, expect, it } from 'vitest'
import type { FundamentalFactsAsset } from '../types'
import { buildBrazilianStockScoreV1 } from './buildBrazilianStockScoreV1'
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
  } = {}
): FundamentalFactsAsset['snapshots'][number] {
  return {
    assetId: 'asset-bbas3',
    kind: 'brazilian-stock',
    referenceDate,
    period: 'annual',
    source: 'cvm-dfp',
    sourceDocumentId: `cvm-dfp-bbas3-${referenceDate}`,
    facts: {
      totalRevenue: null,
      netIncome: facts.netIncome ?? null,
      totalAssets: null,
      totalEquity: facts.totalEquity ?? null,
      operatingCashFlow: null,
      issuedShares: null,
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
