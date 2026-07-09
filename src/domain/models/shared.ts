export type EntityId = string

export type CurrencyCode = 'BRL' | 'USD'

// Valores monetarios usam unidades menores inteiras: centavos para BRL e USD.
export type MoneyInMinorUnits = number

export type MoneyAmount = {
  amountInMinorUnits: MoneyInMinorUnits
  currency: CurrencyCode
}

// 10.000 pontos-base equivalem a 100,00%.
export type BasisPoints = number

export const TOTAL_ALLOCATION_BASIS_POINTS = 10_000

export function isNonEmptyEntityId(id: EntityId): boolean {
  return id.trim().length > 0
}

export function isValidMoneyInMinorUnits(value: MoneyInMinorUnits): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

export function isValidBasisPoints(value: BasisPoints): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= TOTAL_ALLOCATION_BASIS_POINTS
  )
}

export function sumBasisPoints(values: BasisPoints[]): BasisPoints {
  return values.reduce((total, value) => total + value, 0)
}

export function isCompleteAllocation(values: BasisPoints[]): boolean {
  return (
    values.every(isValidBasisPoints) &&
    sumBasisPoints(values) === TOTAL_ALLOCATION_BASIS_POINTS
  )
}
