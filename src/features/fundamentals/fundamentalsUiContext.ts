import { createContext, useContext } from 'react'
import type { FundamentalsUiDependenciesV1 } from './types'

export const FundamentalsUiContext =
  createContext<FundamentalsUiDependenciesV1 | null>(null)

export function useFundamentalsUiDependenciesV1() {
  const dependencies = useContext(FundamentalsUiContext)
  if (dependencies === null) {
    throw new Error('Fundamentals UI dependencies were not provided')
  }
  return dependencies
}
