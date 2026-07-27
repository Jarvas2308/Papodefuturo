import { describe, expect, it } from 'vitest'
import type {
  OfficialEventsRuntimeOperationResultV1,
  OfficialEventsRuntimeV1,
} from '../../application/context/official-events/runtime'
import type { OfficialAssetEventV1 } from '../../domain/context/official-events'
import type {
  OfficialAssetEventReadPageV1,
  OfficialAssetEventReadQueryV1,
} from '../../data/context/official-events/repository'
import { createStorageTestEvent } from '../../data/context/official-events/storage/testFixtures'
import {
  createOfficialEventDetailsControllerV1,
  createOfficialEventsTimelineControllerV1,
} from './controllers'
import { EMPTY_OFFICIAL_EVENTS_FILTERS } from './presentation'
import type { OfficialEventsTimelineStateV1 } from './types'

const operationTimes = {
  runtimeVersion: 'official-events-runtime.v1' as const,
  startedAt: '2026-07-20T12:00:00Z',
  completedAt: '2026-07-20T12:00:01Z',
}

function succeeded<T>(data: T): OfficialEventsRuntimeOperationResultV1<T> {
  return { ...operationTimes, status: 'succeeded', data, error: null }
}

function stopped<T>(
  status:
    | 'disabled'
    | 'authentication-required'
    | 'not-ready'
    | 'unavailable'
    | 'failed'
): OfficialEventsRuntimeOperationResultV1<T> {
  if (status === 'disabled' || status === 'authentication-required') {
    return { ...operationTimes, status, data: null, error: null }
  }
  return {
    ...operationTimes,
    status,
    data: null,
    error: {
      code:
        status === 'not-ready'
          ? 'access-state-unavailable'
          : status === 'unavailable'
            ? 'repository-unavailable'
            : 'unexpected-failure',
      message: 'sanitized',
    },
  }
}

function page(
  items: OfficialAssetEventV1[],
  nextCursor: string | null = null
): OfficialAssetEventReadPageV1 {
  return {
    repositoryVersion: 'official-asset-event-read-repository.v1',
    items,
    returned: items.length,
    limit: 20,
    hasMore: nextCursor !== null,
    nextCursor,
  }
}

function deferred<Value>() {
  let resolvePromise: ((value: Value) => void) | null = null
  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve
  })
  return {
    promise,
    resolve(value: Value) {
      if (resolvePromise === null) throw new Error('Deferred is not ready')
      resolvePromise(value)
    },
  }
}

function createRuntime(input: {
  mode?: 'disabled' | 'read-only'
  list?: (
    query: OfficialAssetEventReadQueryV1
  ) => Promise<
    OfficialEventsRuntimeOperationResultV1<OfficialAssetEventReadPageV1>
  >
  get?: (
    eventId: string
  ) => Promise<
    OfficialEventsRuntimeOperationResultV1<OfficialAssetEventV1 | null>
  >
}) {
  const calls: Array<{ operation: 'list' | 'get'; value: unknown }> = []
  const mode = input.mode ?? 'read-only'
  const runtime: OfficialEventsRuntimeV1 = {
    getCapability() {
      return {
        runtimeVersion: 'official-events-runtime.v1',
        mode,
        accessState: mode === 'disabled' ? null : 'authenticated',
        canRead: mode === 'read-only',
        reason: mode === 'disabled' ? 'disabled' : 'available',
      }
    },
    async listTimeline(query) {
      calls.push({ operation: 'list', value: query })
      return input.list ? input.list(query) : succeeded(page([]))
    },
    async getEventById({ eventId }) {
      calls.push({ operation: 'get', value: eventId })
      return input.get ? input.get(eventId) : succeeded(null)
    },
  }
  return { runtime, calls }
}

describe('official events timeline controller', () => {
  it('renders disabled without calling the runtime operation', async () => {
    const states: OfficialEventsTimelineStateV1[] = []
    const { runtime, calls } = createRuntime({ mode: 'disabled' })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: (state) => states.push(state),
    })

    await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)

    expect(states.at(-1)?.status).toBe('disabled')
    expect(calls).toEqual([])
  })

  it('preserves runtime order and forwards the first query with null cursor', async () => {
    const first = createStorageTestEvent({ documentId: 'first' })
    const second = createStorageTestEvent({
      ticker: 'VOO',
      source: 'sec-edgar',
      documentId: 'second',
    })
    const { runtime, calls } = createRuntime({
      list: async () => succeeded(page([second, first], 'next-opaque')),
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })

    await controller.load({
      ...EMPTY_OFFICIAL_EVENTS_FILTERS,
      tickers: ['VOO'],
    })

    expect(controller.getState().items).toEqual([second, first])
    expect(calls[0]).toMatchObject({
      operation: 'list',
      value: { tickers: ['VOO'], limit: 20, cursor: null },
    })
  })

  it('uses nextCursor, appends items and never constructs numeric pagination', async () => {
    const first = createStorageTestEvent({ documentId: 'first' })
    const second = createStorageTestEvent({ documentId: 'second' })
    let call = 0
    const { runtime, calls } = createRuntime({
      list: async () => {
        call += 1
        return call === 1
          ? succeeded(page([first], 'opaque-next'))
          : succeeded(page([second]))
      },
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })

    await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)
    await controller.loadMore()

    expect(controller.getState().items).toEqual([first, second])
    expect(calls[1]).toMatchObject({ value: { cursor: 'opaque-next' } })
    expect(Object.hasOwn(calls[1]?.value ?? {}, 'page')).toBe(false)
  })

  it('prevents duplicate simultaneous next-page requests', async () => {
    const first = createStorageTestEvent({ documentId: 'first' })
    const next =
      deferred<
        OfficialEventsRuntimeOperationResultV1<OfficialAssetEventReadPageV1>
      >()
    let call = 0
    const { runtime, calls } = createRuntime({
      list: async () => {
        call += 1
        return call === 1 ? succeeded(page([first], 'next')) : next.promise
      },
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })
    await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)

    const firstRequest = controller.loadMore()
    const secondRequest = controller.loadMore()
    next.resolve(succeeded(page([])))
    await Promise.all([firstRequest, secondRequest])

    expect(calls.filter(({ operation }) => operation === 'list')).toHaveLength(
      2
    )
  })

  it('rejects duplicated eventId between cursor pages without silent removal', async () => {
    const event = createStorageTestEvent({ documentId: 'same' })
    let call = 0
    const { runtime } = createRuntime({
      list: async () => {
        call += 1
        return succeeded(page([event], call === 1 ? 'next' : null))
      },
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })
    await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)
    await controller.loadMore()

    expect(controller.getState()).toMatchObject({
      status: 'succeeded',
      items: [event],
      nextCursor: 'next',
      loadMoreFailure: 'failed',
    })
  })

  it('preserves loaded events when the next page is unavailable', async () => {
    const event = createStorageTestEvent({ documentId: 'preserved' })
    let call = 0
    const { runtime } = createRuntime({
      list: async () => {
        call += 1
        return call === 1
          ? succeeded(page([event], 'next'))
          : stopped('unavailable')
      },
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })
    await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)
    await controller.loadMore()
    expect(controller.getState()).toMatchObject({
      status: 'succeeded',
      items: [event],
      nextCursor: 'next',
      loadMoreFailure: 'unavailable',
    })
  })

  it('ignores stale filter responses and keeps the latest query', async () => {
    const oldResponse =
      deferred<
        OfficialEventsRuntimeOperationResultV1<OfficialAssetEventReadPageV1>
      >()
    const current = createStorageTestEvent({ documentId: 'current' })
    let call = 0
    const { runtime } = createRuntime({
      list: async () => {
        call += 1
        return call === 1 ? oldResponse.promise : succeeded(page([current]))
      },
    })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: () => undefined,
    })

    const oldLoad = controller.load({
      ...EMPTY_OFFICIAL_EVENTS_FILTERS,
      tickers: ['BBAS3'],
    })
    await controller.load({
      ...EMPTY_OFFICIAL_EVENTS_FILTERS,
      tickers: ['VOO'],
    })
    oldResponse.resolve(succeeded(page([])))
    await oldLoad

    expect(controller.getState().items).toEqual([current])
  })

  it.each([
    'authentication-required',
    'not-ready',
    'unavailable',
    'failed',
  ] as const)(
    'preserves the runtime state %s instead of returning empty success',
    async (status) => {
      const { runtime } = createRuntime({ list: async () => stopped(status) })
      const controller = createOfficialEventsTimelineControllerV1({
        runtime,
        onChange: () => undefined,
      })
      await controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)
      expect(controller.getState().status).toBe(status)
    }
  )

  it('does not publish an async response after disposal', async () => {
    const response =
      deferred<
        OfficialEventsRuntimeOperationResultV1<OfficialAssetEventReadPageV1>
      >()
    const states: OfficialEventsTimelineStateV1[] = []
    const { runtime } = createRuntime({ list: async () => response.promise })
    const controller = createOfficialEventsTimelineControllerV1({
      runtime,
      onChange: (state) => states.push(state),
    })
    const loading = controller.load(EMPTY_OFFICIAL_EVENTS_FILTERS)
    controller.dispose()
    response.resolve(succeeded(page([createStorageTestEvent()])))
    await loading
    expect(states.at(-1)?.status).toBe('loading')
  })
})

describe('official event details controller', () => {
  it('loads one event once and then resolves its previous version independently', async () => {
    const previous = createStorageTestEvent({ documentId: 'previous' })
    const current = createStorageTestEvent({
      documentId: 'current',
      status: 'correction',
      supersedesEventId: previous.eventId,
    })
    const { runtime, calls } = createRuntime({
      get: async (eventId) =>
        succeeded(eventId === current.eventId ? current : previous),
    })
    const controller = createOfficialEventDetailsControllerV1({
      runtime,
      onChange: () => undefined,
    })

    await controller.open(current.eventId)
    await controller.loadPrevious()

    expect(calls).toEqual([
      { operation: 'get', value: current.eventId },
      { operation: 'get', value: previous.eventId },
    ])
    expect(controller.getState()).toMatchObject({
      status: 'succeeded',
      event: current,
      previousStatus: 'succeeded',
      previousEvent: previous,
    })
  })

  it('represents event and previous-version absence explicitly', async () => {
    const revision = createStorageTestEvent({
      documentId: 'revision',
      status: 'replacement',
      supersedesEventId: 'official-event:missing',
    })
    let call = 0
    const { runtime } = createRuntime({
      get: async () => {
        call += 1
        return succeeded(call === 1 ? revision : null)
      },
    })
    const controller = createOfficialEventDetailsControllerV1({
      runtime,
      onChange: () => undefined,
    })
    await controller.open(revision.eventId)
    await controller.loadPrevious()
    expect(controller.getState().previousStatus).toBe('not-found')

    const missing = createOfficialEventDetailsControllerV1({
      runtime: createRuntime({ get: async () => succeeded(null) }).runtime,
      onChange: () => undefined,
    })
    await missing.open('official-event:missing')
    expect(missing.getState().status).toBe('not-found')
  })

  it('invalidates pending details when closed', async () => {
    const response =
      deferred<
        OfficialEventsRuntimeOperationResultV1<OfficialAssetEventV1 | null>
      >()
    const { runtime } = createRuntime({ get: async () => response.promise })
    const controller = createOfficialEventDetailsControllerV1({
      runtime,
      onChange: () => undefined,
    })
    const opening = controller.open('official-event:pending')
    controller.close()
    response.resolve(succeeded(createStorageTestEvent()))
    await opening
    expect(controller.getState().status).toBe('closed')
  })
})
