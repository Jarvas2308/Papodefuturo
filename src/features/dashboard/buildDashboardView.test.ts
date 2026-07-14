import { describe, expect, it } from 'vitest'
import { getClosedAssetCurrency } from '../../data/assetUniverse'
import {
  EXCHANGE_RATE_SCALE,
  type AllocationTarget,
  type Asset,
  type AssetPrice,
  type ExchangeRate,
  type Purchase,
} from '../../domain/models'
import { buildPortfolioSnapshot } from '../../domain/portfolioSnapshot'
import { buildPortfolioView } from '../portfolio/buildPortfolioView'
import {
  buildDashboardView,
  buildInvestmentChartPoints,
  buildInvestmentSeries,
  getAuthenticatedGreeting,
  selectLatestConfirmedPurchase,
  sortPurchasesByTradeDate,
} from './buildDashboardView'

const assets: Asset[] = [
  {
    id: 'asset-bbas3',
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    category: 'brazilian-stock',
    market: 'BR',
    status: 'active',
  },
  {
    id: 'asset-voo',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'international-etf',
    market: 'US',
    status: 'active',
  },
]

const purchases: Purchase[] = [
  {
    id: 'purchase-old',
    assetId: 'asset-bbas3',
    quantity: 2,
    unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
    totalAmount: { amountInMinorUnits: 2_000, currency: 'BRL' },
    tradeDate: '2026-02-10',
    status: 'confirmed',
  },
  {
    id: 'purchase-usd',
    assetId: 'asset-voo',
    quantity: 1,
    unitPrice: { amountInMinorUnits: 1_000, currency: 'USD' },
    totalAmount: { amountInMinorUnits: 1_000, currency: 'USD' },
    tradeDate: '2026-05-15',
    status: 'confirmed',
  },
  {
    id: 'purchase-cancelled',
    assetId: 'asset-bbas3',
    quantity: 3,
    unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
    totalAmount: { amountInMinorUnits: 3_000, currency: 'BRL' },
    tradeDate: '2026-06-20',
    status: 'cancelled',
  },
  {
    id: 'purchase-planned',
    assetId: 'asset-bbas3',
    quantity: 4,
    unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
    totalAmount: { amountInMinorUnits: 4_000, currency: 'BRL' },
    tradeDate: '2026-07-01',
    status: 'planned',
  },
]

const prices: AssetPrice[] = [
  {
    id: 'price-brl',
    assetId: 'asset-bbas3',
    price: { amountInMinorUnits: 1_500, currency: 'BRL' },
    pricedAt: '2026-07-10T00:00:00.000Z',
    source: 'manual',
  },
]

const targets: AllocationTarget[] = [
  {
    id: 'target-brl',
    scope: 'category',
    category: 'brazilian-stock',
    targetInBasisPoints: 4_000,
  },
  {
    id: 'target-usd',
    scope: 'category',
    category: 'international-etf',
    targetInBasisPoints: 6_000,
  },
]

const rate: ExchangeRate = {
  id: 'rate',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_000_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-10T00:00:00.000Z',
  source: 'manual',
}

function getSnapshot() {
  const result = buildPortfolioSnapshot({
    assets,
    purchases,
    prices,
    targets,
    rates: [rate],
    resolveAssetCurrency: getClosedAssetCurrency,
  })

  expect(result.snapshot).not.toBeNull()
  return result.snapshot!
}

function build() {
  return buildDashboardView({
    assets,
    purchases,
    snapshot: getSnapshot(),
    userMetadata: { full_name: '  Maria Silva  ' },
    now: new Date('2026-07-14T12:00:00.000Z'),
  })
}

describe('Dashboard real view', () => {
  it('uses only explicit nonblank profile metadata in the greeting', () => {
    expect(getAuthenticatedGreeting({ full_name: ' Ana ' })).toBe('Olá, Ana')
    expect(getAuthenticatedGreeting({ full_name: ' ', name: 'Bia' })).toBe(
      'Olá, Bia'
    )
    expect(getAuthenticatedGreeting({ email: 'pessoa@example.com' })).toBe(
      'Olá'
    )
    expect(getAuthenticatedGreeting(null)).toBe('Olá')
  })

  it('uses the same normalized financial snapshot as Portfolio', () => {
    const dashboard = build()
    const portfolio = buildPortfolioView(assets, purchases, prices, targets, [
      rate,
    ]).data

    expect(dashboard.summary[0].value).toBe(portfolio?.summary[0].value)
    expect(dashboard.summary[1].value).toBe(portfolio?.summary[1].value)
    expect(dashboard.summary[2].value).toBe(portfolio?.summary[2].value)
    expect(dashboard.allocation.items[0].currentLabel).toBe(
      portfolio?.allocation.items[0].currentLabel
    )
  })

  it('renders a BRL-only Dashboard from real financial facts', () => {
    const result = buildPortfolioSnapshot({
      assets: [assets[0]],
      purchases: [purchases[0]],
      prices,
      targets,
      rates: [],
      resolveAssetCurrency: getClosedAssetCurrency,
    })
    const dashboard = buildDashboardView({
      assets: [assets[0]],
      purchases: [purchases[0]],
      snapshot: result.snapshot!,
      userMetadata: null,
      now: new Date('2026-07-14T00:00:00.000Z'),
    })

    expect(dashboard.summary.slice(0, 3).map((item) => item.value)).toEqual([
      'R$\u00a030,00',
      'R$\u00a020,00',
      'R$\u00a010,00',
    ])
  })

  it('shows the latest confirmed purchase in native currency', () => {
    const latest = selectLatestConfirmedPurchase(purchases)
    const card = build().summary.find((item) => item.id === 'last-purchase')

    expect(latest?.id).toBe('purchase-usd')
    expect(card).toEqual(
      expect.objectContaining({
        value: 'US$\u00a010,00',
        detail: expect.stringContaining('VOO'),
      })
    )
  })

  it('selects the latest confirmed purchase independently of repository order', () => {
    expect(selectLatestConfirmedPurchase([...purchases].reverse())?.id).toBe(
      'purchase-usd'
    )
  })

  it('shows an honest empty state when there is no confirmed purchase', () => {
    const dashboard = buildDashboardView({
      assets,
      purchases: purchases.filter(
        (purchase) => purchase.status !== 'confirmed'
      ),
      snapshot: getSnapshot(),
      userMetadata: null,
      now: new Date('2026-07-14T00:00:00.000Z'),
    })
    const card = dashboard.summary.find((item) => item.id === 'last-purchase')

    expect(card).toEqual(
      expect.objectContaining({
        value: 'Nenhuma',
        helper: 'Registre sua primeira compra confirmada.',
      })
    )
  })

  it('breaks equal-date purchase ties by descending id', () => {
    const tied = [
      { ...purchases[0], id: 'a', tradeDate: '2026-07-01' },
      { ...purchases[0], id: 'b', tradeDate: '2026-07-01' },
    ]

    expect(sortPurchasesByTradeDate(tied).map((item) => item.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('lists at most four movements with honest status labels', () => {
    const movements = build().recentMovements.items

    expect(movements).toHaveLength(4)
    expect(movements.map((item) => item.type)).toEqual([
      'Compra planejada',
      'Compra cancelada',
      'Compra',
      'Compra',
    ])
    expect(movements[2].amount).toBe('US$\u00a010,00')
  })

  it('builds six cumulative months from confirmed purchases only', () => {
    const series = buildInvestmentSeries(
      purchases,
      rate,
      new Date('2026-07-14T00:00:00.000Z')
    )

    expect(series).toHaveLength(6)
    expect(series.map((point) => point.valueInBrlMinorUnits)).toEqual([
      2_000, 2_000, 2_000, 7_000, 7_000, 7_000,
    ])
  })

  it('describes the investment series without claiming historical quotes', () => {
    const evolution = build().investmentEvolution

    expect(evolution.title).toBe('Capital investido acumulado')
    expect(evolution.description).toContain(
      'não representam cotação cambial histórica'
    )
    expect(evolution.changeLabel).toBe('+R$\u00a050,00 no período')
  })

  it('keeps an empty investment chart finite and on the baseline', () => {
    const points = buildInvestmentChartPoints(
      Array.from({ length: 6 }, (_, index) => ({
        month: String(index),
        valueInBrlMinorUnits: 0,
      }))
    )

    expect(points.every((point) => point.y === 176)).toBe(true)
    expect(points.every((point) => Number.isFinite(point.x))).toBe(true)
  })

  it('derives allocation target and difference from basis points', () => {
    const allocation = build().allocation.items
    const brazilian = allocation.find((item) => item.id === 'brazilian-stocks')
    const international = allocation.find((item) => item.id === 'international')

    expect(brazilian).toBeDefined()
    expect(international).toBeDefined()
    expect(brazilian?.targetLabel).toBe('40,00%')
    expect(international?.targetLabel).toBe('60,00%')
    expect(
      (brazilian?.current ?? 0) + (international?.current ?? 0)
    ).toBeCloseTo(100)
  })

  it('reports position price coverage without counting assets without positions', () => {
    const status = build().informationStatus.items

    expect(status.find((item) => item.id === 'positions-count')?.label).toBe(
      '2 ativos com posição'
    )
    expect(status.find((item) => item.id === 'price-coverage')?.label).toBe(
      '1 de 2 posições com cotação'
    )
  })

  it('uses an explicit real-data disclaimer', () => {
    const dashboard = build()

    expect(dashboard.disclaimer).toBe('Dados reais da sua conta')
    expect(dashboard.welcome.title).toBe('Olá, Maria Silva')
  })
})
