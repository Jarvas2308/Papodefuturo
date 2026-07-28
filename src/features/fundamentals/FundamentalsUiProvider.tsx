import type { ReactNode } from 'react'
import { FundamentalsUiContext } from './fundamentalsUiContext'
import type { FundamentalsUiDependenciesV1 } from './types'

export function FundamentalsUiProvider({
  children,
  dependencies,
}: {
  children: ReactNode
  dependencies: FundamentalsUiDependenciesV1
}) {
  return (
    <FundamentalsUiContext.Provider value={dependencies}>
      {children}
    </FundamentalsUiContext.Provider>
  )
}
