import { CLOSED_ASSET_UNIVERSE } from '../../data/assetUniverse'
import type {
  AllocationTarget,
  Asset,
  AssetCategory,
  AssetPrice,
  CurrencyCode,
  Purchase,
} from '../../domain/models'
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

function formatMoney(amountInMinorUnits: number, currency: CurrencyCode): string {
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

function getAssetCurrency(asset: Asset): CurrencyCode {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (item) => item.ticker.toUpperCase() === asset.ticker.toUpperCase()
  )

  if (!definition) {
    throw new Error(`Unsupported asset outside closed universe: ${asset.ticker}`)
  }

  return definition.currency
}

function getLatestPriceByAsset(prices: readonly AssetPrice[]) {
  const latestByAsset = new Map<string, AssetPrice>()

  for (const price of prices) {
    const current = latestByAsset.get(price.assetId)

    if (!current || price.pricedAt > current.pricedAt) {
      latestByAsset.set(price.assetId, price)
    }
  }

  return latestByAsset
}

function getCategoryTarget(
  targets: readonly AllocationTarget[],
  category: AssetCategory
): number {
  return (
    targets.find(
      (target) => target.scope === 'category' && target.category === category
    )?.targetInBasisPoints ?? 0
  )
}

type CalculatedPosition = {
  asset: Asset
  currency: CurrencyCode
  quantity: number
  investedMinor: number
  averagePriceMinor: number
  currentPriceMinor: number
  currentMinor: number
  resultMinor: number
  resultPercentage: number
}

function calculatePositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[]
): CalculatedPosition[] {
  const latestPriceByAsset = getLatestPriceByAsset(prices)

  return assets.flatMap((asset) => {
    const confirmedPurchases = purchases.filter(
      (purchase) =>
        purchase.assetId === asset.id && purchase.status === 'confirmed'
    )

    if (confirmedPurchases.length === 0) {
      return []
    }

    const currency = getAssetCurrency(asset)

    if (
      confirmedPurchases.some(
        (purchase) =>
          purchase.totalAmount.currency !== currency ||
          purchase.unitPrice.currency !== currency
      )
    ) {
      throw new Error(`Purchase currency mismatch for ${asset.ticker}`)
    }

    const quantity = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.quantity,
      0
    )
    const investedMinor = confirmedPurchases.reduce(
      (total, purchase) => total + purchase.totalAmount.amountInMinorUnits,
      0
    )

    if (quantity <= 0) {
      return []
    }

    const averagePriceMinor = Math.round(investedMinor / quantity)
    const latestPrice = latestPriceByAsset.get(asset.id)

    if (latestPrice && latestPrice.price.currency !== currency) {
      throw new Error(`Asset price currency mismatch for ${asset.ticker}`)
    }

    const currentPriceMinor =
      latestPrice?.price.amountInMinorUnits ?? averagePriceMinor
    const currentMinor = Math.round(quantity * currentPriceMinor)
    const resultMinor = currentMinor - investedMinor
    const resultPercentage =
      investedMinor === 0 ? 0 : (resultMinor / investedMinor) * 100

    return [
      {
        asset,
        currency,
        quantity,
        investedMinor,
        averagePriceMinor,
        currentPriceMinor,
        currentMinor,
        resultMinor,
        resultPercentage,
      },
    ]
  })
}

function buildPositionItems(
  positions: readonly CalculatedPosition[],
  canAggregate: boolean,
  totalCurrentMinor: number
): PortfolioPosition[] {
  return positions.flatMap((position) => {
    const category = CATEGORY_CONFIG[position.asset.category]

    if (!category) {
      return []
    }

    const participation =
      canAggregate && totalCurrentMinor > 0
        ? (position.currentMinor / totalCurrentMinor) * 100
        : null

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
          position.averagePriceMinor,
          position.currency
        ),
        currentQuote: formatMoney(
          position.currentPriceMinor,
          position.currency
        ),
        investedValue: formatMoney(position.investedMinor, position.currency),
        currentValue: formatMoney(position.currentMinor, position.currency),
        participation:
          participation === null ? '—' : formatPercentage(participation),
        resultValue: formatMoney(position.resultMinor, position.currency),
        resultPercentage: formatPercentage(position.resultPercentage, true),
        tone: position.resultMinor >= 0 ? 'positive' : 'negative',
      },
    ]
  })
}

function buildAllocationItems(
  positions: readonly CalculatedPosition[],
  targets: readonly AllocationTarget[],
  canAggregate: boolean,
  totalCurrentMinor: number,
  aggregateCurrency: CurrencyCode
): PortfolioAllocationItem[] {
  return Object.entries(CATEGORY_CONFIG).flatMap(([category, config]) => {
    if (!config) {
      return []
    }

    const typedCategory = category as AssetCategory
    const currentMinor = positions
      .filter((position) => position.asset.category === typedCategory)
      .reduce((total, position) => total + position.currentMinor, 0)
    const current =
      canAggregate && totalCurrentMinor > 0
        ? (currentMinor / totalCurrentMinor) * 100
        : 0
    const target = getCategoryTarget(targets, typedCategory) / 100
    const difference = current - target

    return [
      {
        id: config.id,
        category: config.label,
        current,
        currentLabel: canAggregate
          ? formatPercentage(current)
          : 'Conversão pendente',
        currentValue: canAggregate
          ? formatMoney(currentMinor, aggregateCurrency)
          : 'Múltiplas moedas',
        target,
        targetLabel: formatPercentage(target),
        differenceLabel: canAggregate
          ? `${difference >= 0 ? '+' : ''}${difference
              .toFixed(1)
              .replace('.', ',')} p.p. ${
              difference >= 0 ? 'acima da meta' : 'abaixo da meta'
            }`
          : 'Conversão cambial pendente',
        tone: canAggregate && difference > 0.5 ? 'alert' : 'neutral',
      },
    ]
  })
}

export function buildPortfolioView(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[],
  targets: readonly AllocationTarget[]
): PortfolioMock {
  const calculatedPositions = calculatePositions(assets, purchases, prices)
  const currencies = new Set(
    calculatedPositions.map((position) => position.currency)
  )
  const canAggregate = currencies.size <= 1
  const aggregateCurrency = calculatedPositions[0]?.currency ?? 'BRL'
  const totalInvestedMinor = calculatedPositions.reduce(
    (total, position) => total + position.investedMinor,
    0
  )
  const totalCurrentMinor = calculatedPositions.reduce(
    (total, position) => total + position.currentMinor,
    0
  )
  const totalResultMinor = totalCurrentMinor - totalInvestedMinor
  const totalResultPercentage =
    totalInvestedMinor === 0 ? 0 : (totalResultMinor / totalInvestedMinor) * 100

  return {
    disclaimer: 'Dados reais da sua conta',
    header: {
      title: 'Minha Carteira',
      description: 'Visualize suas posições, compras e resultados consolidados.',
      actionLabel: 'Planejar novo aporte',
      actionTo: '/novo-aporte',
    },
    summary: [
      {
        id: 'monitored-equity',
        label: 'Patrimônio monitorado',
        value: canAggregate
          ? formatMoney(totalCurrentMinor, aggregateCurrency)
          : 'Múltiplas moedas',
        helper: canAggregate
          ? 'Valor atual calculado pelas últimas cotações disponíveis'
          : 'Conversão cambial ainda não disponível',
        icon: 'wallet',
      },
      {
        id: 'total-invested',
        label: 'Total investido',
        value: canAggregate
          ? formatMoney(totalInvestedMinor, aggregateCurrency)
          : 'Múltiplas moedas',
        helper: canAggregate
          ? 'Capital acumulado em compras confirmadas'
          : 'Conversão cambial ainda não disponível',
        icon: 'landmark',
      },
      {
        id: 'accumulated-return',
        label: 'Rentabilidade acumulada',
        value: canAggregate
          ? formatMoney(totalResultMinor, aggregateCurrency)
          : 'Múltiplas moedas',
        helper: canAggregate
          ? 'Resultado calculado sobre compras confirmadas'
          : 'Conversão cambial ainda não disponível',
        icon: 'trending-up',
        tone: totalResultMinor >= 0 ? 'positive' : undefined,
        badge: canAggregate
          ? formatPercentage(totalResultPercentage, true)
          : undefined,
      },
      {
        id: 'positions-count',
        label: 'Ativos com posição',
        value: String(calculatedPositions.length),
        helper: 'Ativos com compras confirmadas',
        icon: 'layers',
      },
    ],
    allocation: {
      title: 'Distribuição da carteira',
      description:
        'Compare a participação atual das categorias acompanhadas com suas metas.',
      note: canAggregate
        ? 'Valores sem cotação usam o preço médio da posição como fallback.'
        : 'Participações agregadas aguardam uma fonte de conversão cambial.',
      items: buildAllocationItems(
        calculatedPositions,
        targets,
        canAggregate,
        totalCurrentMinor,
        aggregateCurrency
      ),
    },
    positions: {
      title: 'Posições',
      description: 'Ativos consolidados a partir das compras confirmadas da conta.',
      filters: [
        { id: 'all', label: 'Todos' },
        ...Object.values(CATEGORY_CONFIG).flatMap((config) =>
          config ? [{ id: config.id, label: config.filterLabel }] : []
        ),
      ],
      items: buildPositionItems(
        calculatedPositions,
        canAggregate,
        totalCurrentMinor
      ),
    },
  }
}
