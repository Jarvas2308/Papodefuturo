import type {
  FundamentalAssetKind,
  SignedMonetaryFact,
} from '../../domain/fundamentals'
import { FUNDAMENTAL_RATIO_SCALE } from '../../domain/fundamentals'

export const FUNDAMENTAL_ASSET_KIND_LABELS: Record<
  FundamentalAssetKind,
  string
> = {
  'brazilian-stock': 'Ação brasileira',
  'real-estate-fund': 'Fundo imobiliário',
  'international-etf': 'ETF internacional',
}

const SOURCE_LABELS: Record<string, string> = {
  'cvm-dfp': 'CVM — DFP',
  'cvm-itr': 'CVM — ITR',
  'cvm-fii-inf-mensal': 'CVM — Informe Mensal de FII',
  'sec-nport': 'SEC — N-PORT',
}

export function formatFundamentalSource(source: string): string {
  return SOURCE_LABELS[source] ?? source
}

export function formatFundamentalsMoney(
  fact: SignedMonetaryFact | null
): string {
  if (fact === null) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: fact.currency,
  }).format(fact.amountInMinorUnits / 100)
}

export function formatFundamentalsDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}

export function formatFundamentalsRatioPercent(scaledValue: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(scaledValue / FUNDAMENTAL_RATIO_SCALE)
}

export function formatFundamentalsMoneyPerUnit(
  scaledAmountInMinorUnitsPerUnit: number
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 4,
  }).format(scaledAmountInMinorUnitsPerUnit / FUNDAMENTAL_RATIO_SCALE / 100)
}
