import type {
  HistoryCurrency,
  HistoryFilters,
  HistoryMovement,
  HistorySummary,
} from '../types'

export const emptyHistoryFilters: HistoryFilters = {
  query: '',
  type: 'all',
  category: 'all',
  month: 'all',
  status: 'all',
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function filterHistoryMovements(
  movements: HistoryMovement[],
  filters: HistoryFilters
) {
  const query = normalizeSearch(filters.query)

  return movements.filter((movement) => {
    const matchesQuery =
      !query ||
      normalizeSearch(movement.ticker).includes(query) ||
      normalizeSearch(movement.assetName).includes(query)

    return (
      matchesQuery &&
      (filters.type === 'all' || movement.type === filters.type) &&
      (filters.category === 'all' || movement.category === filters.category) &&
      (filters.month === 'all' || movement.date.startsWith(filters.month)) &&
      (filters.status === 'all' || movement.status === filters.status)
    )
  })
}

export function calculateHistorySummary(
  movements: HistoryMovement[]
): HistorySummary {
  const tradedTypes = new Set<HistoryMovement['type']>([
    'purchase',
    'sale',
    'contribution',
  ])

  return movements.reduce<HistorySummary>(
    (summary, movement) => {
      summary.movementCount += 1

      if (movement.type === 'purchase') {
        summary.purchaseCount += 1
      }

      if (
        movement.currency === 'BRL' &&
        (movement.type === 'dividend' || movement.type === 'income') &&
        movement.status === 'completed'
      ) {
        summary.proceedsInCents += movement.totalValueInCents
      }

      if (tradedTypes.has(movement.type)) {
        if (movement.currency === 'BRL') {
          summary.brlVolumeInCents += movement.totalValueInCents
        } else {
          summary.usdVolumeInCents += movement.totalValueInCents
        }
      }

      return summary
    },
    {
      movementCount: 0,
      purchaseCount: 0,
      proceedsInCents: 0,
      brlVolumeInCents: 0,
      usdVolumeInCents: 0,
    }
  )
}

export function formatHistoryCurrency(
  valueInCents: number,
  currency: HistoryCurrency
) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(valueInCents / 100)
}

export function formatHistoryDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}

export function formatHistoryQuantity(quantity: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 4,
  }).format(quantity)
}
