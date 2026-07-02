import type {
  HistoryCategory,
  HistoryMovementStatus,
  HistoryMovementType,
} from '../types'

export const historyCategoryLabels: Record<HistoryCategory, string> = {
  'brazilian-stocks': 'Ações brasileiras',
  'real-estate-funds': 'Fundos imobiliários',
  international: 'Internacional',
  cash: 'Caixa',
}

export const historyTypeLabels: Record<HistoryMovementType, string> = {
  purchase: 'Compra',
  sale: 'Venda',
  dividend: 'Dividendo',
  income: 'Rendimento',
  contribution: 'Aporte',
}

export const historyStatusLabels: Record<HistoryMovementStatus, string> = {
  completed: 'Concluído',
  pending: 'Pendente',
  cancelled: 'Cancelado',
}
