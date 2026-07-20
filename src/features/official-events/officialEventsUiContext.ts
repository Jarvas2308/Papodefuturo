import { createContext, useContext } from 'react'
import type { OfficialEventsUiDependenciesV1 } from './types'

export const OfficialEventsUiContext =
  createContext<OfficialEventsUiDependenciesV1 | null>(null)

export function useOfficialEventsUiDependenciesV1() {
  const dependencies = useContext(OfficialEventsUiContext)
  if (dependencies === null) {
    throw new Error('Official events UI dependencies were not provided')
  }
  return dependencies
}
