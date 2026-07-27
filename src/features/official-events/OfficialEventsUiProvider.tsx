import type { ReactNode } from 'react'
import { OfficialEventsUiContext } from './officialEventsUiContext'
import type { OfficialEventsUiDependenciesV1 } from './types'

export function OfficialEventsUiProvider({
  children,
  dependencies,
}: {
  children: ReactNode
  dependencies: OfficialEventsUiDependenciesV1
}) {
  return (
    <OfficialEventsUiContext.Provider value={dependencies}>
      {children}
    </OfficialEventsUiContext.Provider>
  )
}
