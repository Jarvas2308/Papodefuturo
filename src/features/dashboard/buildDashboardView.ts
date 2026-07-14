import {
  convertMoney,
  type Asset,
  type ExchangeRate,
  type Purchase,
} from '../../domain/models'
import type { PortfolioSnapshot } from '../../domain/portfolioSnapshot'
import type {
  DashboardAllocationItem,
  DashboardChartPoint,
  DashboardMovementItem,
  DashboardStatusItem,
  DashboardSummaryItem,
  DashboardView,
} from './types'

const CATEGORY_CONFIG = {
  'brazilian-stock': {
    id: 'brazilian-stocks',
    label: 'Ações brasileiras',
  },
  'real-estate-fund': {
    id: 'real-estate-funds',
    label: 'Fundos imobiliários',
  },
  'international-etf': {
    id: 'international',
    label: 'Internacional',
  },
} as const

const MOVEMENT_STATUS = {
  confirmed: { label: 'Compra', tone: 'default' },
  cancelled: { label: 'Compra cancelada', tone: 'cancelled' },
  planned: { label: 'Compra planejada', tone: 'planned' },
} as const

const CHART_LEFT = 18
const CHART_RIGHT = 318
const CHART_TOP = 14
const CHART_BASELINE = 176

type UserMetadata = Record<string, unknown> | null | undefined

export type InvestmentSeriesPoint = {
  month: string
  valueInBrlMinorUnits: number
}

export type BuildDashboardViewInput = {
  assets: readonly Asset[]
  purchases: readonly Purchase[]
  snapshot: PortfolioSnapshot
  userMetadata: UserMetadata
  now?: Date
}

function formatMoney(amountInMinorUnits: number, currency: 'BRL' | 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amountInMinorUnits / 100)
}

function formatSignedMoney(amountInMinorUnits: number) {
  const prefix = amountInMinorUnits > 0 ? '+' : ''
  return `${prefix}${formatMoney(amountInMinorUnits, 'BRL')}`
}

function formatPercentage(value: number, signed = false) {
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(2).replace('.', ',')}%`
}

function formatQuantity(quantity: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 8,
  }).format(quantity)
}

function parseTradeDate(tradeDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tradeDate)

  if (!match) {
    throw new Error(`Invalid purchase trade date: ${tradeDate}`)
  }

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (date.toISOString().slice(0, 10) !== tradeDate) {
    throw new Error(`Invalid purchase trade date: ${tradeDate}`)
  }

  return date
}

function formatLongDate(tradeDate: string) {
  return parseTradeDate(tradeDate).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatShortDate(tradeDate: string) {
  return parseTradeDate(tradeDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatMonth(date: Date) {
  const label = date
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

export function getAuthenticatedGreeting(userMetadata: UserMetadata) {
  for (const field of ['full_name', 'name']) {
    const value = userMetadata?.[field]

    if (typeof value === 'string' && value.trim() !== '') {
      return `Olá, ${value.trim()}`
    }
  }

  return 'Olá'
}

export function sortPurchasesByTradeDate(
  purchases: readonly Purchase[]
): Purchase[] {
  return [...purchases].sort(
    (left, right) =>
      right.tradeDate.localeCompare(left.tradeDate) ||
      right.id.localeCompare(left.id)
  )
}

export function selectLatestConfirmedPurchase(
  purchases: readonly Purchase[]
): Purchase | null {
  return (
    sortPurchasesByTradeDate(
      purchases.filter((purchase) => purchase.status === 'confirmed')
    )[0] ?? null
  )
}

function normalizePurchaseTotalToBrl(
  purchase: Purchase,
  usdBrlRate: ExchangeRate | null
) {
  if (purchase.totalAmount.currency === 'BRL') {
    return purchase.totalAmount.amountInMinorUnits
  }

  if (!usdBrlRate) {
    throw new Error('USD/BRL exchange rate is required for USD purchases')
  }

  return convertMoney(purchase.totalAmount, 'BRL', usdBrlRate)
    .amountInMinorUnits
}

export function buildInvestmentSeries(
  purchases: readonly Purchase[],
  usdBrlRate: ExchangeRate | null,
  now: Date = new Date()
): InvestmentSeriesPoint[] {
  const confirmedPurchases = purchases.filter(
    (purchase) => purchase.status === 'confirmed'
  )
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()

  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(Date.UTC(currentYear, currentMonth - (5 - index), 1))
    const monthEnd = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)
    )
      .toISOString()
      .slice(0, 10)
    const valueInBrlMinorUnits = confirmedPurchases
      .filter((purchase) => purchase.tradeDate <= monthEnd)
      .reduce(
        (total, purchase) =>
          total + normalizePurchaseTotalToBrl(purchase, usdBrlRate),
        0
      )

    return {
      month: formatMonth(month),
      valueInBrlMinorUnits,
    }
  })
}

export function buildInvestmentChartPoints(
  series: readonly InvestmentSeriesPoint[]
): DashboardChartPoint[] {
  const maximum = Math.max(
    0,
    ...series.map((point) => point.valueInBrlMinorUnits)
  )
  const horizontalStep =
    series.length <= 1 ? 0 : (CHART_RIGHT - CHART_LEFT) / (series.length - 1)

  return series.map((point, index) => {
    const x = CHART_LEFT + horizontalStep * index
    const y =
      maximum === 0
        ? CHART_BASELINE
        : CHART_BASELINE -
          (point.valueInBrlMinorUnits / maximum) * (CHART_BASELINE - CHART_TOP)

    return {
      month: point.month,
      valueLabel: formatMoney(point.valueInBrlMinorUnits, 'BRL'),
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    }
  })
}

function buildInvestmentEvolution(
  purchases: readonly Purchase[],
  usdBrlRate: ExchangeRate | null,
  now: Date
): DashboardView['investmentEvolution'] {
  const series = buildInvestmentSeries(purchases, usdBrlRate, now)
  const points = buildInvestmentChartPoints(series)
  const firstValue = series[0]?.valueInBrlMinorUnits ?? 0
  const lastValue = series.at(-1)?.valueInBrlMinorUnits ?? 0
  const change = lastValue - firstValue
  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  const firstPoint = points[0]
  const lastPoint = points.at(-1)

  return {
    title: 'Capital investido acumulado',
    description:
      'A série mostra capital investido acumulado. Valores em USD são convertidos pela taxa cambial atualmente salva e não representam cotação cambial histórica.',
    changeLabel:
      change === 0
        ? 'Sem novos aportes no período'
        : `${formatSignedMoney(change)} no período`,
    chartAriaLabel: 'Gráfico de capital investido acumulado em seis meses',
    chartAriaDescription:
      firstPoint && lastPoint
        ? `Capital investido de ${firstPoint.valueLabel} em ${firstPoint.month} para ${lastPoint.valueLabel} em ${lastPoint.month}.`
        : 'Série de capital investido sem pontos disponíveis.',
    points,
    polylinePoints,
    areaPath:
      points.length === 0
        ? ''
        : `M ${polylinePoints.replaceAll(' ', ' L ')} L ${lastPoint?.x ?? CHART_RIGHT} ${CHART_BASELINE} L ${firstPoint?.x ?? CHART_LEFT} ${CHART_BASELINE} Z`,
  }
}

function getAssetByPurchase(
  purchase: Purchase,
  assetById: ReadonlyMap<string, Asset>
) {
  const asset = assetById.get(purchase.assetId)

  if (!asset) {
    throw new Error(`Asset not found for purchase: ${purchase.id}`)
  }

  return asset
}

export function buildDashboardSummary(
  snapshot: PortfolioSnapshot,
  purchases: readonly Purchase[],
  assets: readonly Asset[]
): DashboardSummaryItem[] {
  const latestPurchase = selectLatestConfirmedPurchase(purchases)
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const latestPurchaseAsset = latestPurchase
    ? getAssetByPurchase(latestPurchase, assetById)
    : null

  return [
    {
      id: 'monitored-equity',
      label: 'Patrimônio monitorado',
      value: formatMoney(snapshot.totalCurrentMinorInBrl, 'BRL'),
      helper: 'Valor atual das posições confirmadas',
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
      helper: 'Resultado atual sobre o capital investido',
      icon: 'trending-up',
      tone: snapshot.totalResultMinorInBrl >= 0 ? 'positive' : 'negative',
      badge: formatPercentage(snapshot.totalResultPercentage, true),
    },
    {
      id: 'last-purchase',
      label: 'Última compra confirmada',
      value: latestPurchase
        ? formatMoney(
            latestPurchase.totalAmount.amountInMinorUnits,
            latestPurchase.totalAmount.currency
          )
        : 'Nenhuma',
      helper: latestPurchase
        ? 'Compra confirmada mais recente'
        : 'Registre sua primeira compra confirmada.',
      icon: 'calendar',
      detail:
        latestPurchase && latestPurchaseAsset
          ? `${latestPurchaseAsset.ticker} • ${formatLongDate(
              latestPurchase.tradeDate
            )}`
          : undefined,
    },
  ]
}

export function buildDashboardAllocation(
  snapshot: PortfolioSnapshot
): DashboardView['allocation'] {
  const items: DashboardAllocationItem[] = Object.entries(CATEGORY_CONFIG).map(
    ([category, config]) => {
      const current = snapshot.categories.find(
        (item) => item.category === category
      )
      const currentPercentage = current?.currentPercentage ?? 0
      const targetPercentage = current?.targetPercentage ?? 0
      const difference = current?.differencePercentage ?? 0

      return {
        id: config.id,
        category: config.label,
        current: currentPercentage,
        currentLabel: formatPercentage(currentPercentage),
        target: targetPercentage,
        targetLabel: formatPercentage(targetPercentage),
        differenceLabel: `${difference >= 0 ? '+' : ''}${difference
          .toFixed(1)
          .replace('.', ',')} p.p. ${
          difference >= 0 ? 'acima da meta' : 'abaixo da meta'
        }`,
        tone: difference > 0.5 ? 'alert' : 'neutral',
      }
    }
  )

  return {
    title: 'Distribuição por categoria',
    description:
      'Compare a participação atual da carteira com a meta monitorada.',
    note: snapshot.hasUsdPosition
      ? 'Posições internacionais são convertidas para BRL pela taxa USD/BRL salva. Posições sem cotação usam o preço médio como fallback.'
      : 'Posições sem cotação usam o preço médio como fallback.',
    items,
  }
}

export function buildRecentMovements(
  purchases: readonly Purchase[],
  assets: readonly Asset[]
): DashboardView['recentMovements'] {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const items: DashboardMovementItem[] = sortPurchasesByTradeDate(purchases)
    .slice(0, 4)
    .map((purchase) => {
      const asset = getAssetByPurchase(purchase, assetById)
      const status = MOVEMENT_STATUS[purchase.status]

      return {
        id: purchase.id,
        date: formatShortDate(purchase.tradeDate),
        asset: asset.ticker,
        type: status.label,
        quantity: `${formatQuantity(purchase.quantity)} ${
          purchase.quantity === 1 ? 'unidade' : 'unidades'
        }`,
        amount: formatMoney(
          purchase.totalAmount.amountInMinorUnits,
          purchase.totalAmount.currency
        ),
        tone: status.tone,
      }
    })

  return {
    title: 'Últimas movimentações',
    description:
      'Compras registradas na conta, incluindo estados confirmados, cancelados e planejados.',
    actionLabel: 'Ver histórico completo',
    actionTo: '/historico',
    items,
  }
}

export function buildInformationStatus(
  snapshot: PortfolioSnapshot,
  assets: readonly Asset[]
): DashboardView['informationStatus'] {
  const activeAssets = assets.filter((asset) => asset.status === 'active')
  const monitoredCategories = new Set(
    activeAssets
      .map((asset) => asset.category)
      .filter((category) => category in CATEGORY_CONFIG)
  )
  const positionsWithPrice = snapshot.positions.filter(
    (position) => position.hasCurrentPrice
  ).length
  const items: DashboardStatusItem[] = [
    {
      id: 'categories-count',
      label: `${monitoredCategories.size} categorias monitoradas`,
      detail: 'Categorias ativas consideradas na visão consolidada.',
    },
    {
      id: 'active-assets-count',
      label: `${activeAssets.length} ativos acompanhados`,
      detail: 'Ativos do universo materializado com status ativo na sua conta.',
    },
    {
      id: 'positions-count',
      label: `${snapshot.positions.length} ativos com posição`,
      detail: 'Posições formadas exclusivamente por compras confirmadas.',
    },
    {
      id: 'price-coverage',
      label: `${positionsWithPrice} de ${snapshot.positions.length} posições com cotação`,
      detail: 'Posições sem cotação usam o preço médio como fallback.',
    },
  ]

  return {
    title: 'Status das informações',
    items,
  }
}

export function buildDashboardView({
  assets,
  purchases,
  snapshot,
  userMetadata,
  now = new Date(),
}: BuildDashboardViewInput): DashboardView {
  return {
    disclaimer: 'Dados reais da sua conta',
    welcome: {
      title: getAuthenticatedGreeting(userMetadata),
      description:
        'Acompanhe os fatos confirmados da carteira e planeje seu próximo aporte.',
      actionLabel: 'Planejar novo aporte',
      actionTo: '/novo-aporte',
    },
    summary: buildDashboardSummary(snapshot, purchases, assets),
    investmentEvolution: buildInvestmentEvolution(
      purchases,
      snapshot.latestUsdBrlRate,
      now
    ),
    allocation: buildDashboardAllocation(snapshot),
    nextStep: {
      title: 'Pronto para o próximo aporte?',
      description:
        'Use os dados atuais da carteira para simular como um novo valor pode contribuir para o equilíbrio das metas.',
      actionLabel: 'Planejar aporte',
      actionTo: '/novo-aporte',
    },
    recentMovements: buildRecentMovements(purchases, assets),
    informationStatus: buildInformationStatus(snapshot, assets),
  }
}
