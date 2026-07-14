import { CLOSED_ASSET_UNIVERSE } from '../../data/assetUniverse'
import {
  convertMoney,
  getLatestUsdBrlRate,
  type AllocationTarget,
  type Asset,
  type AssetCategory,
  type AssetPrice,
  type CurrencyCode,
  type ExchangeRate,
  type Purchase,
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

function getAssetCurrency(asset: Asset): CurrencyCode {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (item) => item.ticker.toUpperCase() === asset.ticker.toUpperCase()
  )

  if (!definition) {
    throw new Error(
      `Unsupported asset outside closed universe: ${asset.ticker}`
    )
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

type NativeCalculatedPosition = {
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

type CalculatedPosition = NativeCalculatedPosition & {
  investedMinorInBrl: number
  currentMinorInBrl: number
}

function calculateNativePositions(
  assets: readonly Asset[],
  purchases: readonly Purchase[],
  prices: readonly AssetPrice[]
): NativeCalculatedPosition[] {
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

function normalizeToBrl(
  amountInMinorUnits: number,
  currency: CurrencyCode,
  usdBrlRate: ExchangeRate | null
): number {
  if (currency === 'BRL') {
    return amountInMinorUnits
  }

  if (!usdBrlRate) {
    throw new Error('USD/BRL exchange rate is required for USD positions')
  }

  return convertMoney({ amountInMinorUnits, currency }, 'BRL', usdBrlRate)
    .amountInMinorUnits
}

function normalizePositions(
  positions: readonly NativeCalculatedPosition[],
  usdBrlRate: ExchangeRate | null
): CalculatedPosition[] {
  return positions.map((position) => ({
    ...position,
    investedMinorInBrl: normalizeToBrl(
      position.investedMinor,
      position.currency,
      usdBrlRate
    ),
    currentMinorInBrl: normalizeToBrl(
      position.currentMinor,
      position.currency,
      usdBrlRate
    ),
  }))
}

function buildPositionItems(
  positions: readonly CalculatedPosition[],
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
          position.averagePriceMinor,
          position.currency
        ),
        currentQuote: formatMoney(
          position.currentPriceMinor,
          position.currency
        ),
        investedValue: formatMoney(position.investedMinor, position.currency),
        currentValue: formatMoney(position.currentMinor, position.currency),
        participation: formatPercentage(participation),
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
  totalCurrentMinorInBrl: number
): PortfolioAllocationItem[] {
  return Object.entries(CATEGORY_CONFIG).flatMap(([category, config]) => {
    if (!config) {
      return []
    }

    const typedCategory = category as AssetCategory
    const currentMinorInBrl = positions
      .filter((position) => position.asset.category === typedCategory)
      .reduce((total, position) => total + position.currentMinorInBrl, 0)
    const current =
      totalCurrentMinorInBrl > 0
        ? (currentMinorInBrl / totalCurrentMinorInBrl) * 100
        : 0
    const target = getCategoryTarget(targets, typedCategory) / 100
    const difference = current - target

    return [
      {
        id: config.id,
        category: config.label,
        current,
        currentLabel: formatPercentage(current),
        currentValue: formatMoney(currentMinorInBrl, 'BRL'),
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
  const nativePositions = calculateNativePositions(assets, purchases, prices)
  const hasConfirmedUsdPosition = nativePositions.some(
    (position) => position.currency === 'USD'
  )
  const latestUsdBrlRate = getLatestUsdBrlRate(rates)

  if (hasConfirmedUsdPosition && !latestUsdBrlRate) {
    return {
      data: null,
      needsExchangeRate: true,
      latestUsdBrlRate: null,
    }
  }

  const calculatedPositions = normalizePositions(
    nativePositions,
    latestUsdBrlRate
  )
  const totalInvestedMinorInBrl = calculatedPositions.reduce(
    (total, position) => total + position.investedMinorInBrl,
    0
  )
  const totalCurrentMinorInBrl = calculatedPositions.reduce(
    (total, position) => total + position.currentMinorInBrl,
    0
  )
  const totalResultMinorInBrl = totalCurrentMinorInBrl - totalInvestedMinorInBrl
  const totalResultPercentage =
    totalInvestedMinorInBrl === 0
      ? 0
      : (totalResultMinorInBrl / totalInvestedMinorInBrl) * 100

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
          value: formatMoney(totalCurrentMinorInBrl, 'BRL'),
          helper: 'Valor atual calculado pelas últimas cotações disponíveis',
          icon: 'wallet',
        },
        {
          id: 'total-invested',
          label: 'Total investido',
          value: formatMoney(totalInvestedMinorInBrl, 'BRL'),
          helper: 'Capital acumulado em compras confirmadas',
          icon: 'landmark',
        },
        {
          id: 'accumulated-return',
          label: 'Rentabilidade acumulada',
          value: formatMoney(totalResultMinorInBrl, 'BRL'),
          helper: 'Resultado calculado sobre compras confirmadas',
          icon: 'trending-up',
          tone: totalResultMinorInBrl >= 0 ? 'positive' : undefined,
          badge: formatPercentage(totalResultPercentage, true),
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
        note: hasConfirmedUsdPosition
          ? 'Posições internacionais são convertidas para BRL pela taxa USD/BRL salva. Valores sem cotação usam o preço médio da posição como fallback.'
          : 'Valores sem cotação usam o preço médio da posição como fallback.',
        items: buildAllocationItems(
          calculatedPositions,
          targets,
          totalCurrentMinorInBrl
        ),
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
        items: buildPositionItems(calculatedPositions, totalCurrentMinorInBrl),
      },
    },
    needsExchangeRate: false,
    latestUsdBrlRate: hasConfirmedUsdPosition ? latestUsdBrlRate : null,
  }
}
