import { createOfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import type { OfficialEventsUiDependenciesV1 } from './types'

export const OFFICIAL_EVENTS_REAL_UI_MODE = 'disabled' as const

export function createRealOfficialEventsUiDependenciesV1(): OfficialEventsUiDependenciesV1 {
  return {
    runtime: createOfficialEventsRuntimeV1({
      mode: OFFICIAL_EVENTS_REAL_UI_MODE,
      now: {
        now: () => new Date().toISOString(),
      },
    }),
  }
}
