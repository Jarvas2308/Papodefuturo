export type PortfolioCategory =
  'brazilian-stocks' | 'real-estate-funds' | 'international'

export type PortfolioFilter = 'all' | PortfolioCategory

export type PortfolioSummaryItem = {
  id: string
  label: string
  value: string
  helper: string
  icon: 'wallet' | 'landmark' | 'trending-up' | 'layers'
  tone?: 'default' | 'positive'
  badge?: string
}

export type PortfolioAllocationItem = {
  id: string
  category: string
  current: number
  currentLabel: string
  currentValue: string
  target: number
  targetLabel: string
  differenceLabel: string
  tone: 'neutral' | 'alert'
}

export type PortfolioFilterOption = {
  id: PortfolioFilter
  label: string
}

export type PortfolioPosition = {
  id: string
  ticker: string
  name: string
  category: PortfolioCategory
  categoryLabel: string
  market: string
  currency: string
  quantity: string
  averagePrice: string
  currentQuote: string
  investedValue: string
  currentValue: string
  participation: string
  resultValue: string
  resultPercentage: string
  tone: 'positive' | 'negative'
}

export type PortfolioMock = {
  disclaimer: string
  header: {
    title: string
    description: string
    actionLabel: string
    actionTo: string
  }
  summary: PortfolioSummaryItem[]
  allocation: {
    title: string
    description: string
    note: string
    items: PortfolioAllocationItem[]
  }
  positions: {
    title: string
    description: string
    filters: PortfolioFilterOption[]
    items: PortfolioPosition[]
  }
}
