export type DashboardSummaryItem = {
  id: string
  label: string
  value: string
  helper: string
  icon: 'wallet' | 'landmark' | 'trending-up' | 'calendar'
  tone?: 'default' | 'positive'
  badge?: string
  detail?: string
}

export type DashboardChartPoint = {
  month: string
  valueLabel: string
  x: number
  y: number
}

export type DashboardAllocationItem = {
  id: string
  category: string
  current: number
  currentLabel: string
  target: number
  targetLabel: string
  differenceLabel: string
  tone: 'neutral' | 'alert'
}

export type DashboardMovementItem = {
  id: string
  date: string
  asset: string
  type: string
  quantity: string
  amount: string
}

export type DashboardStatusItem = {
  id: string
  label: string
  detail: string
}

export type DashboardMock = {
  disclaimer: string
  welcome: {
    title: string
    description: string
    actionLabel: string
    actionTo: string
  }
  summary: DashboardSummaryItem[]
  evolution: {
    title: string
    description: string
    changeLabel: string
    chartAriaLabel: string
    chartAriaDescription: string
    points: DashboardChartPoint[]
    polylinePoints: string
    areaPath: string
  }
  allocation: {
    title: string
    description: string
    note: string
    items: DashboardAllocationItem[]
  }
  nextStep: {
    title: string
    description: string
    actionLabel: string
    actionTo: string
  }
  recentMovements: {
    title: string
    description: string
    actionLabel: string
    actionTo: string
    items: DashboardMovementItem[]
  }
  informationStatus: {
    title: string
    items: DashboardStatusItem[]
  }
}
