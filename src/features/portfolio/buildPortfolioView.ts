import { getClosedAssetCurrency } from '../../data/assetUniverse'
import type {
  AllocationTarget,
  Asset,
  AssetCategory,
  AssetPrice,
  CurrencyCode,
  ExchangeRate,
  Purchase,
} from '../../domain/models'
import {
  buildPortfolioSnapshot,
  type PortfolioSnapshotCategory,
  type PortfolioSnapshotPosition,
} from '../../domain/portfolioSnapshot'
import type {
  PortfolioAllocationItem,
  PortfolioCategory,
  PortfolioMock,
  PortfolioPosition,
} from './types'

const CATEGORY_CONFIG: Partial<
  Record<
    AssetCategory,
    { id: PortfolioCategory; label: string; filterLabel: string }
  >
> = {
  'brazilian-stock': {
    id: 'brazilian-stocks',
    label: 'Ações brasileiras',
    filterLabel: 'Ações brasileiras',
  },
  'real-estate-fund': {
    id: 'real-estate-funds',
    label: 'Fundos imobiliários',
    filterLabel: 'Fundos imobiliários',
  },
  'international-etf': {
    id: 'international',
    label: 'Internacional',
    filterLabel: 'Internacional',
  },
}

const MARKET_LABELS = {
  BR: 'B3',
  US: 'EUA',
  INTERNAL: 'Interno',
} as const

function formatMoney(
  amountInMinorUnits: number,
  currency: CurrencyCode
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amountInMinorUnits / 100)
}

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 8,
  }).format(quantity)
}

function formatPercentage(value: number, signed = false): string {
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(2).replace('.', ',')}%`
}

function buildPositionItems(
  positions: readonly PortfolioSnapshotPosition[],
  totalCurrentMinorInBrl: number
): PortfolioPosition[] {
  return positions.flatMap((position) => {
    const category = CATEGORY_CONFIG[position.asset.category]

    if (!category) {
      return []
    }

    const participation =
      totalCurrentMinorInBrl > 0
        ? (position.currentMinorInBrl / totalCurrentMinorInBrl) * 100
        : 0

    return [
      {
        id: position.asset.id,
        ticker: position.asset.ticker,
        name: position.asset.name,
        category: category.id,
        categoryLabel: category.label,
        market: MARKET_LABELS[position.asset.market],
        currency: position.currency,
        quantity: formatQuantity(position.quantity),
        averagePrice: formatMoney(
          position.averagePriceMinorNative,
          position.currency
        ),
        currentQuote: formatMoney(
          position.currentPriceMinorNative,
          position.currency
        ),
        investedValue: formatMoney(
          position.investedMinorNative,
          position.currency
        ),
        currentValue: formatMoney(
          position.currentMinorNative,
          position.currency
        ),
        participation: formatPercentage(participation),
        resultValue: formatMoney(position.resultMinorNative, position.currency),
        resultPercentage: formatPercentage(position.resultPercentage, true),
        tone: position.resultMinorNative >= 0 ? 'positive' : 'negative',
      },
    ]
  })
}

function buildAllocationItems(
  categories: readonly PortfolioSnapshotCategory[]
): PortfolioAllocationItem[] {
  return Object.entries(CATEGORY_CONFIG).flatMap(([category, config]) => {
    if (!config) {
      return []
    }

    const snapshot = categories.find(
      (item) => item.category === (category as AssetCategory)
    )
    const current = snapshot?.currentPercentage ?? 0
    const target = snapshot?.targetPercentage ?? 0
    const difference = snapshot?.differencePercentage ?? current - target

    return [
      {
        id: config.id,
        category: config.label,
        current,
        currentLabel: formatPercentage(current),
        currentValue: formatMoney(snapshot?.currentMinorInBrl ?? 0, 'BRL'),
        target,
        targetLabel: formatPercentage(target),
        differenceLabel: `${difference >= 0 ? '+' : ''}${difference
          .toFixed(1)
          .replace('.', ',')} p.p. ${
          difference >= 0 ? 'acima da meta' : 'abaixo da meta'
        }`,
        tone: difference > 0.5 ? 'alert' : 'neutral',
      },
    ]
  })
}

export type PortfolioViewResult = {
  data: PortfolioMock | null
  needsExchangeRate: boolean
  latestUsdBrlRate: ExchangeRate | null
}

export function buildPortfolioView(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  targets: readonly AllocationTarget[],
  rates: readonly ExchangeRate[]
): PortfolioViewResult {
  const snapshotResult = buildPortfolioSnapshot({
    assets,
    purchases,
    prices,
    targets,
    rates,
    resolveAssetCurrency: getClosedAssetCurrency,
  })

  if (!snapshotResult.snapshot) {
    return {
      data: null,
      needsExchangeRate: snapshotResult.needsExchangeRate,
      latestUsdBrlRate: snapshotResult.latestUsdBrlRate,
    }
  }

  const snapshot = snapshotResult.snapshot

  return {
    data: {
      disclaimer: 'Dados reais da sua conta',
      header: {
        title: 'Minha Carteira',
        description:
          'Visualize suas posições, compras e resultados consolidados.',
        actionLabel: 'Planejar novo aporte',
        actionTo: '/novo-aporte',
      },
      summary: [
        {
          id: 'monitored-equity',
          label: 'Patrimônio monitorado',
          value: formatMoney(snapshot.totalCurrentMinorInBrl, 'BRL'),
          helper: 'Valor atual calculado pelas últimas cotações disponíveis',
          icon: 'wallet',
        },
        {
          id: 'total-invested',
          label: 'Total investido',
          value: formatMoney(snapshot.totalInvestedMinorInBrl, 'BRL'),
          helper: 'Capital acumulado em compras confirmadas',
          icon: 'landmark',
        },
        {
          id: 'accumulated-return',
          label: 'Rentabilidade acumulada',
          value: formatMoney(snapshot.totalResultMinorInBrl, 'BRL'),
          helper: 'Resultado calculado sobre compras confirmadas',
          icon: 'trending-up',
          tone: snapshot.totalResultMinorInBrl >= 0 ? 'positive' : undefined,
          badge: formatPercentage(snapshot.totalResultPercentage, true),
        },
        {
          id: 'positions-count',
          label: 'Ativos com posição',
          value: String(snapshot.positions.length),
          helper: 'Ativos com compras confirmadas',
          icon: 'layers',
        },
      ],
      allocation: {
        title: 'Distribuição da carteira',
        description:
          'Compare a participação atual das categorias acompanhadas com suas metas.',
        note: snapshot.hasUsdPosition
          ? 'Posições internacionais são convertidas para BRL pela taxa USD/BRL salva. Valores sem cotação usam o preço médio da posição como fallback.'
          : 'Valores sem cotação usam o preço médio da posição como fallback.',
        items: buildAllocationItems(snapshot.categories),
      },
      positions: {
        title: 'Posições',
        description:
          'Ativos consolidados a partir das compras confirmadas da conta.',
        filters: [
          { id: 'all', label: 'Todos' },
          ...Object.values(CATEGORY_CONFIG).flatMap((config) =>
            config ? [{ id: config.id, label: config.filterLabel }] : []
          ),
        ],
        items: buildPositionItems(
          snapshot.positions,
          snapshot.totalCurrentMinorInBrl
        ),
      },
    },
    needsExchangeRate: false,
    latestUsdBrlRate: snapshot.latestUsdBrlRate,
  }
}
