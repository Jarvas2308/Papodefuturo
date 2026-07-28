import { createOfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import type { OfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import type { OfficialEventsUiDependenciesV1 } from './types'

export const OFFICIAL_EVENTS_REAL_UI_MODE: 'disabled' | 'read-only' =
  'read-only'

function defaultDisabledRuntime(): OfficialEventsRuntimeV1 {
  return createOfficialEventsRuntimeV1({
    mode: 'disabled',
    now: {
      now: () => new Date().toISOString(),
    },
  })
}

export function createRealOfficialEventsUiDependenciesV1(
  runtime?: OfficialEventsRuntimeV1
): OfficialEventsUiDependenciesV1 {
  return {
    runtime: runtime ?? defaultDisabledRuntime(),
  }
}
