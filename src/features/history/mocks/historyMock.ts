import { portfolioMock } from '../../../mocks/portfolio'
import type {
  HistoryCategory,
  HistoryCurrency,
  HistoryMovement,
  HistoryMovementStatus,
  HistoryMovementType,
} from '../types'

type MovementSeed = {
  id: string
  date: string
  type: HistoryMovementType
  assetId: string
  quantity: number
  unitPriceInCents: number
  totalValueInCents: number
  currency: HistoryCurrency
  status: HistoryMovementStatus
}

const movementSeeds: MovementSeed[] = [
  {
    id: 'mov-001',
    date: '2026-06-18',
    type: 'purchase',
    assetId: 'bbas3',
    quantity: 40,
    unitPriceInCents: 3300,
    totalValueInCents: 132000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-002',
    date: '2026-06-12',
    type: 'income',
    assetId: 'knri11',
    quantity: 75,
    unitPriceInCents: 100,
    totalValueInCents: 7500,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-003',
    date: '2026-06-05',
    type: 'purchase',
    assetId: 'voo',
    quantity: 1,
    unitPriceInCents: 48750,
    totalValueInCents: 48750,
    currency: 'USD',
    status: 'pending',
  },
  {
    id: 'mov-004',
    date: '2026-05-29',
    type: 'dividend',
    assetId: 'itsa4',
    quantity: 900,
    unitPriceInCents: 30,
    totalValueInCents: 27000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-005',
    date: '2026-05-20',
    type: 'sale',
    assetId: 'pssa3',
    quantity: 20,
    unitPriceInCents: 3100,
    totalValueInCents: 62000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-006',
    date: '2026-05-08',
    type: 'purchase',
    assetId: 'visc11',
    quantity: 10,
    unitPriceInCents: 10500,
    totalValueInCents: 105000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-007',
    date: '2026-04-25',
    type: 'contribution',
    assetId: 'cash-brl',
    quantity: 1,
    unitPriceInCents: 250000,
    totalValueInCents: 250000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-008',
    date: '2026-04-15',
    type: 'income',
    assetId: 'hgru11',
    quantity: 50,
    unitPriceInCents: 95,
    totalValueInCents: 4750,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-009',
    date: '2026-04-03',
    type: 'purchase',
    assetId: 'vea',
    quantity: 3,
    unitPriceInCents: 5328,
    totalValueInCents: 15984,
    currency: 'USD',
    status: 'completed',
  },
  {
    id: 'mov-010',
    date: '2026-03-27',
    type: 'sale',
    assetId: 'weg3',
    quantity: 15,
    unitPriceInCents: 4375,
    totalValueInCents: 65625,
    currency: 'BRL',
    status: 'cancelled',
  },
  {
    id: 'mov-011',
    date: '2026-03-18',
    type: 'dividend',
    assetId: 'bbas3',
    quantity: 400,
    unitPriceInCents: 45,
    totalValueInCents: 18000,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-012',
    date: '2026-03-06',
    type: 'purchase',
    assetId: 'xplg11',
    quantity: 8,
    unitPriceInCents: 10200,
    totalValueInCents: 81600,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-013',
    date: '2026-02-21',
    type: 'income',
    assetId: 'visc11',
    quantity: 100,
    unitPriceInCents: 82,
    totalValueInCents: 8200,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-014',
    date: '2026-02-10',
    type: 'purchase',
    assetId: 'taee11',
    quantity: 25,
    unitPriceInCents: 3721,
    totalValueInCents: 93025,
    currency: 'BRL',
    status: 'completed',
  },
  {
    id: 'mov-015',
    date: '2026-01-23',
    type: 'purchase',
    assetId: 'vnq',
    quantity: 2,
    unitPriceInCents: 8700,
    totalValueInCents: 17400,
    currency: 'USD',
    status: 'completed',
  },
  {
    id: 'mov-016',
    date: '2026-01-09',
    type: 'contribution',
    assetId: 'cash-brl',
    quantity: 1,
    unitPriceInCents: 300000,
    totalValueInCents: 300000,
    currency: 'BRL',
    status: 'completed',
  },
]

const assetsById = new Map(
  portfolioMock.positions.items.map((position) => [position.id, position])
)

export const historyMovements: HistoryMovement[] = movementSeeds.map((seed) => {
  const asset = assetsById.get(seed.assetId)

  if (!asset && seed.assetId !== 'cash-brl') {
    throw new Error(`Ativo demonstrativo não encontrado: ${seed.assetId}`)
  }

  return {
    ...seed,
    ticker: asset?.ticker ?? 'APORTE',
    assetName: asset?.name ?? 'Entrada de recursos',
    category: (asset?.category ?? 'cash') as HistoryCategory,
  }
})
