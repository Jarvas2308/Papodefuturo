import type { OfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import { buildOfficialEventsTimelineQuery } from './query'
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

const CLOSED_DETAILS_STATE: OfficialEventDetailsStateV1 = {
  status: 'closed',
  event: null,
  previousStatus: 'idle',
  previousEvent: null,
}

function cloneTimelineState(
  state: OfficialEventsTimelineStateV1
): OfficialEventsTimelineStateV1 {
  return { ...state, items: [...state.items] }
}

function cloneDetailsState(
  state: OfficialEventDetailsStateV1
): OfficialEventDetailsStateV1 {
  return { ...state }
}

export type OfficialEventsTimelineControllerV1 = {
  getState(): OfficialEventsTimelineStateV1
  load(filters: OfficialEventsFiltersV1): Promise<void>
  loadMore(): Promise<void>
  dispose(): void
}

export function createOfficialEventsTimelineControllerV1(input: {
  runtime: OfficialEventsRuntimeV1
  onChange: (state: OfficialEventsTimelineStateV1) => void
}): OfficialEventsTimelineControllerV1 {
  let state = cloneTimelineState(INITIAL_TIMELINE_STATE)
  let filters: OfficialEventsFiltersV1 | null = null
  let requestGeneration = 0
  let disposed = false

  function publish(nextState: OfficialEventsTimelineStateV1) {
    if (disposed) return
    state = cloneTimelineState(nextState)
    input.onChange(cloneTimelineState(state))
  }

  async function load(nextFilters: OfficialEventsFiltersV1) {
    const generation = ++requestGeneration
    filters = cloneOfficialEventsFilters(nextFilters)

    if (input.runtime.getCapability().mode === 'disabled') {
      publish({
        status: 'disabled',
        items: [],
        nextCursor: null,
        isLoadingMore: false,
        loadMoreFailure: null,
      })
      return
    }

    publish({
      status: 'loading',
      items: [],
      nextCursor: null,
      isLoadingMore: false,
      loadMoreFailure: null,
    })
    const result = await input.runtime.listTimeline(
      buildOfficialEventsTimelineQuery(filters, null)
    )
    if (disposed || generation !== requestGeneration) return

    if (result.status === 'succeeded') {
      publish({
        status: 'succeeded',
        items: [...result.data.items],
        nextCursor: result.data.nextCursor,
        isLoadingMore: false,
        loadMoreFailure: null,
      })
      return
    }
    publish({
      status: result.status,
      items: [],
      nextCursor: null,
      isLoadingMore: false,
      loadMoreFailure: null,
    })
  }

  async function loadMore() {
    if (
      disposed ||
      filters === null ||
      state.status !== 'succeeded' ||
      state.nextCursor === null ||
      state.isLoadingMore
    ) {
      return
    }

    const generation = requestGeneration
    const cursor = state.nextCursor
    const previousItems = [...state.items]
    publish({ ...state, isLoadingMore: true, loadMoreFailure: null })
    const result = await input.runtime.listTimeline(
      buildOfficialEventsTimelineQuery(filters, cursor)
    )
    if (disposed || generation !== requestGeneration) return

    if (result.status !== 'succeeded') {
      publish({
        status: 'succeeded',
        items: previousItems,
        nextCursor: cursor,
        isLoadingMore: false,
        loadMoreFailure:
          result.status === 'unavailable' ? 'unavailable' : 'failed',
      })
      return
    }

    const identities = new Set(previousItems.map((event) => event.eventId))
    if (result.data.items.some((event) => identities.has(event.eventId))) {
      publish({
        status: 'succeeded',
        items: previousItems,
        nextCursor: cursor,
        isLoadingMore: false,
        loadMoreFailure: 'failed',
      })
      return
    }

    publish({
      status: 'succeeded',
      items: [...previousItems, ...result.data.items],
      nextCursor: result.data.nextCursor,
      isLoadingMore: false,
      loadMoreFailure: null,
    })
  }

  return {
    getState: () => cloneTimelineState(state),
    load,
    loadMore,
    dispose() {
      disposed = true
      requestGeneration += 1
    },
  }
}

export type OfficialEventDetailsControllerV1 = {
  getState(): OfficialEventDetailsStateV1
  open(eventId: string): Promise<void>
  loadPrevious(): Promise<void>
  close(): void
  dispose(): void
}

export function createOfficialEventDetailsControllerV1(input: {
  runtime: OfficialEventsRuntimeV1
  onChange: (state: OfficialEventDetailsStateV1) => void
}): OfficialEventDetailsControllerV1 {
  let state = cloneDetailsState(CLOSED_DETAILS_STATE)
  let requestGeneration = 0
  let disposed = false

  function publish(nextState: OfficialEventDetailsStateV1) {
    if (disposed) return
    state = cloneDetailsState(nextState)
    input.onChange(cloneDetailsState(state))
  }

  async function open(eventId: string) {
    const generation = ++requestGeneration
    if (input.runtime.getCapability().mode === 'disabled') {
      publish({ ...CLOSED_DETAILS_STATE, status: 'disabled' })
      return
    }
    publish({ ...CLOSED_DETAILS_STATE, status: 'loading' })
    const result = await input.runtime.getEventById({ eventId })
    if (disposed || generation !== requestGeneration) return

    if (result.status === 'succeeded') {
      publish({
        status: result.data === null ? 'not-found' : 'succeeded',
        event: result.data,
        previousStatus: 'idle',
        previousEvent: null,
      })
      return
    }
    publish({ ...CLOSED_DETAILS_STATE, status: result.status })
  }

  async function loadPrevious() {
    const currentEvent = state.event
    if (
      state.status !== 'succeeded' ||
      currentEvent === null ||
      currentEvent.supersedesEventId === null ||
      state.previousStatus === 'loading'
    ) {
      return
    }
    const generation = requestGeneration
    const previousEventId = currentEvent.supersedesEventId
    publish({ ...state, previousStatus: 'loading', previousEvent: null })
    const result = await input.runtime.getEventById({
      eventId: previousEventId,
    })
    if (disposed || generation !== requestGeneration) return

    if (result.status === 'succeeded') {
      publish({
        ...state,
        event: currentEvent,
        previousStatus: result.data === null ? 'not-found' : 'succeeded',
        previousEvent: result.data,
      })
      return
    }
    publish({
      ...state,
      event: currentEvent,
      previousStatus: 'failed',
      previousEvent: null,
    })
  }

  return {
    getState: () => cloneDetailsState(state),
    open,
    loadPrevious,
    close() {
      requestGeneration += 1
      publish(CLOSED_DETAILS_STATE)
    },
    dispose() {
      disposed = true
      requestGeneration += 1
    },
  }
}
