import { useEffect, useMemo, useState } from 'react'
import type { OfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import {
  createOfficialEventDetailsControllerV1,
  createOfficialEventsTimelineControllerV1,
} from './controllers'
import { cloneOfficialEventsFilters } from './presentation'
import type {
  OfficialEventDetailsStateV1,
  OfficialEventsFiltersV1,
  OfficialEventsTimelineStateV1,
} from './types'

const INITIAL_TIMELINE_STATE: OfficialEventsTimelineStateV1 = {
  status: 'idle',
  items: [],
  nextCursor: null,
  isLoadingMore: false,
  loadMoreFailure: null,
}

const INITIAL_DETAILS_STATE: OfficialEventDetailsStateV1 = {
  status: 'closed',
  event: null,
  previousStatus: 'idle',
  previousEvent: null,
}

function getFiltersKey(filters: OfficialEventsFiltersV1): string {
  return JSON.stringify(filters)
}

export function useOfficialEventsTimelineV1(
  runtime: OfficialEventsRuntimeV1,
  filters: OfficialEventsFiltersV1
) {
  const [state, setState] = useState(INITIAL_TIMELINE_STATE)
  const controller = useMemo(
    () =>
      createOfficialEventsTimelineControllerV1({
        runtime,
        onChange: setState,
      }),
    [runtime]
  )
  const filtersKey = getFiltersKey(filters)

  useEffect(() => {
    const currentFilters = cloneOfficialEventsFilters(filters)
    void controller.load(currentFilters)
  }, [controller, filtersKey, filters])

  useEffect(() => () => controller.dispose(), [controller])

  return {
    state,
    loadMore: () => controller.loadMore(),
    reload: () => controller.load(cloneOfficialEventsFilters(filters)),
  }
}

export function useOfficialEventDetailsV1(runtime: OfficialEventsRuntimeV1) {
  const [state, setState] = useState(INITIAL_DETAILS_STATE)
  const controller = useMemo(
    () =>
      createOfficialEventDetailsControllerV1({
        runtime,
        onChange: setState,
      }),
    [runtime]
  )

  useEffect(() => () => controller.dispose(), [controller])

  return {
    state,
    open: (eventId: string) => controller.open(eventId),
    close: () => controller.close(),
    loadPrevious: () => controller.loadPrevious(),
  }
}
