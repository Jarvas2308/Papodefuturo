import { describe, expect, it, vi } from 'vitest'
import { OfficialAssetEventReadRepositoryErrorV1 } from '../../../../data/context/official-events/repository'
import {
  OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
  createOfficialEventsRuntimeV1,
} from './index'
import {
  createClock,
  createRepositoryDouble,
  runtimeEvent,
} from './testFixtures'

describe('OfficialEventsRuntimeV1 disabled mode', () => {
  it('is explicitly disabled without repository or access provider', async () => {
    const clock = createClock()
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: clock,
    })

    await expect(runtime.getEventById({ eventId: 'ignored' })).resolves.toEqual(
      {
        runtimeVersion: OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
        status: 'disabled',
        startedAt: '2026-07-20T12:00:00.123456789Z',
        completedAt: '2026-07-20T12:00:00.123456789Z',
        data: null,
        error: null,
      }
    )
    expect(clock.calls()).toBe(2)
  })

  it('returns disabled for list without invoking an operation dependency', async () => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 10 })).resolves.toMatchObject({
      status: 'disabled',
      data: null,
      error: null,
    })
  })

  it('reports a local defensive capability without remote work', () => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock(),
    })
    const first = runtime.getCapability()
    const second = runtime.getCapability()
    expect(first).toEqual({
      runtimeVersion: OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
      mode: 'disabled',
      accessState: null,
      canRead: false,
      reason: 'disabled',
    })
    expect(second).toEqual(first)
    expect(second).not.toBe(first)
  })
})

describe('OfficialEventsRuntimeV1 access states', () => {
  it.each([
    ['unauthenticated', 'authentication-required'],
    ['unresolved', 'not-ready'],
  ] as const)('does not read for %s', async (accessState, status) => {
    const { repository, calls } = createRepositoryDouble()
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => accessState,
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status,
      data: null,
    })
    expect(calls).toHaveLength(0)
    expect(runtime.getCapability()).toMatchObject({
      accessState,
      canRead: false,
    })
  })

  it('calls one repository operation after async authenticated access', async () => {
    const { repository, calls } = createRepositoryDouble()
    const getAccessState = vi.fn(async () => 'authenticated' as const)
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState,
      now: createClock(),
    })
    await expect(
      runtime.getEventById({ eventId: runtimeEvent.eventId })
    ).resolves.toMatchObject({ status: 'succeeded' })
    expect(getAccessState).toHaveBeenCalledOnce()
    expect(calls).toHaveLength(1)
    expect(runtime.getCapability()).toEqual({
      runtimeVersion: OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
      mode: 'read-only',
      accessState: 'authenticated',
      canRead: true,
      reason: 'available',
    })
  })

  it.each([new Error('token-secret'), 'raw-token', null])(
    'sanitizes an access provider failure %#',
    async (thrown) => {
      const { repository, calls } = createRepositoryDouble()
      const runtime = createOfficialEventsRuntimeV1({
        mode: 'read-only',
        repository,
        getAccessState: () => {
          throw thrown
        },
        now: createClock(),
      })
      const result = await runtime.listTimeline({ limit: 1 })
      expect(result).toMatchObject({
        status: 'not-ready',
        error: { code: 'access-state-unavailable' },
      })
      expect(JSON.stringify(result)).not.toContain('token')
      expect(calls).toHaveLength(0)
    }
  )

  it('rejects an invalid access state without reading', async () => {
    const { repository, calls } = createRepositoryDouble()
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => Promise.resolve('admin' as 'authenticated'),
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status: 'not-ready',
      error: { code: 'access-state-invalid' },
    })
    expect(calls).toHaveLength(0)
  })

  it('does not probe access or repository from getCapability', () => {
    const { repository, calls } = createRepositoryDouble()
    const getAccessState = vi.fn(() => 'authenticated' as const)
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState,
      now: createClock(),
    })
    expect(runtime.getCapability()).toMatchObject({
      accessState: 'unresolved',
      canRead: false,
      reason: 'not-ready',
    })
    expect(getAccessState).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })
})

describe('OfficialEventsRuntimeV1 operations', () => {
  it('returns found and not-found get results as succeeded', async () => {
    for (const getResult of [runtimeEvent, null]) {
      const { repository, calls } = createRepositoryDouble({ getResult })
      const runtime = createOfficialEventsRuntimeV1({
        mode: 'read-only',
        repository,
        getAccessState: () => 'authenticated',
        now: createClock(),
      })
      const result = await runtime.getEventById({
        eventId: runtimeEvent.eventId,
      })
      expect(result).toMatchObject({ status: 'succeeded', data: getResult })
      expect(calls).toEqual([{ operation: 'get', value: runtimeEvent.eventId }])
    }
  })

  it('returns a genuinely empty page as succeeded', async () => {
    const { repository } = createRepositoryDouble({
      listResult: {
        repositoryVersion: 'official-asset-event-read-repository.v1',
        items: [],
        returned: 0,
        limit: 5,
        hasMore: false,
        nextCursor: null,
      },
    })
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 5 })).resolves.toMatchObject({
      status: 'succeeded',
      data: { items: [], returned: 0 },
      error: null,
    })
  })

  it('preserves every list filter, limit and cursor in one call', async () => {
    const { repository, calls } = createRepositoryDouble({
      listResult: {
        repositoryVersion: 'official-asset-event-read-repository.v1',
        items: [],
        returned: 0,
        limit: 7,
        hasMore: false,
        nextCursor: null,
      },
    })
    const query = {
      assetRegulatoryIdentityKeys: [
        runtimeEvent.assetIdentity.regulatoryIdentityKey,
      ],
      tickers: ['BBAS3' as const],
      sources: ['cvm-ipe' as const],
      eventTypes: [runtimeEvent.eventType],
      statuses: [runtimeEvent.status],
      publishedFrom: '2026-07-01',
      publishedTo: '2026-07-31',
      limit: 7,
      cursor: null,
    }
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await runtime.listTimeline(query)
    expect(calls).toEqual([{ operation: 'list', value: query }])
    expect(calls[0].value).not.toBe(query)
  })

  it.each([
    { eventId: ' padded ' },
    { eventId: runtimeEvent.eventId, extra: true },
  ])('fails invalid get input before repository access', async (input) => {
    const { repository, calls } = createRepositoryDouble()
    const getAccessState = vi.fn(() => 'authenticated' as const)
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState,
      now: createClock(),
    })
    const result = await runtime.getEventById(input)
    expect(result).toMatchObject({
      status: 'failed',
      error: { code: 'invalid-input' },
    })
    expect(calls).toHaveLength(0)
    expect(getAccessState).not.toHaveBeenCalled()
  })

  it('fails invalid list input before repository access', async () => {
    const { repository, calls } = createRepositoryDouble()
    const getAccessState = vi.fn(() => 'authenticated' as const)
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState,
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 0 })).resolves.toMatchObject({
      status: 'failed',
      error: { code: 'invalid-input' },
    })
    expect(calls).toHaveLength(0)
    expect(getAccessState).not.toHaveBeenCalled()
  })

  it('returns deep defensive copies from get and list', async () => {
    const { repository } = createRepositoryDouble()
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createClock([
        '2026-07-20T12:00:00Z',
        '2026-07-20T12:00:00Z',
        '2026-07-20T12:00:01Z',
        '2026-07-20T12:00:01Z',
      ]),
    })
    const get = await runtime.getEventById({ eventId: runtimeEvent.eventId })
    const list = await runtime.listTimeline({ limit: 1 })
    if (get.status !== 'succeeded' || get.data === null)
      throw new Error('event')
    if (list.status !== 'succeeded') throw new Error('page')
    expect(get.data).not.toBe(runtimeEvent)
    expect(get.data.assetIdentity).not.toBe(runtimeEvent.assetIdentity)
    expect(get.data.associationEvidence).not.toBe(
      runtimeEvent.associationEvidence
    )
    expect(get.data.documentIdentifiers).not.toBe(
      runtimeEvent.documentIdentifiers
    )
    expect(get.data.provenance).not.toBe(runtimeEvent.provenance)
    expect(get.data.provenance.rawFields).not.toBe(
      runtimeEvent.provenance.rawFields
    )
    expect(list.data.items[0]).not.toBe(runtimeEvent)
  })
})

describe('OfficialEventsRuntimeV1 error classification', () => {
  it.each([
    ['invalid-query', 'invalid-input'],
    ['invalid-cursor', 'invalid-cursor'],
    ['cursor-query-mismatch', 'cursor-query-mismatch'],
    ['malformed-response', 'malformed-response'],
    ['contract-violation', 'contract-violation'],
  ] as const)('maps repository %s to failed/%s', async (kind, code) => {
    const error = new OfficialAssetEventReadRepositoryErrorV1({
      kind,
      message: 'secret payload cursor token SQL',
      operation: 'list-page',
    })
    const { repository } = createRepositoryDouble({ error })
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    const result = await runtime.listTimeline({ limit: 1 })
    expect(result).toMatchObject({ status: 'failed', error: { code } })
    expect(JSON.stringify(result)).not.toMatch(/secret|payload|token|SQL/)
  })

  it.each(['PGRST202', '42883', '42P01'])(
    'maps proven missing schema code %s safely',
    async (upstreamCode) => {
      const { repository } = createRepositoryDouble({
        error: new OfficialAssetEventReadRepositoryErrorV1({
          kind: 'transport',
          message: 'raw SQL detail',
          operation: 'list-page',
          upstreamCode,
          upstreamStatus: 404,
        }),
      })
      const runtime = createOfficialEventsRuntimeV1({
        mode: 'read-only',
        repository,
        getAccessState: () => 'authenticated',
        now: createClock(),
      })
      await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
        status: 'unavailable',
        error: { code: 'schema-unavailable' },
      })
    }
  )

  it('maps generic transport to unavailable without retry', async () => {
    const { repository, calls } = createRepositoryDouble({
      error: new OfficialAssetEventReadRepositoryErrorV1({
        kind: 'transport',
        message: 'headers and token',
        operation: 'get-by-event-id',
      }),
    })
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(
      runtime.getEventById({ eventId: runtimeEvent.eventId })
    ).resolves.toMatchObject({
      status: 'unavailable',
      error: { code: 'repository-unavailable' },
    })
    expect(calls).toHaveLength(1)
  })

  it.each([new Error('rawFields'), 'token', null, { headers: 'secret' }])(
    'sanitizes unknown thrown values %#',
    async (error) => {
      const { repository } = createRepositoryDouble({ error })
      const runtime = createOfficialEventsRuntimeV1({
        mode: 'read-only',
        repository,
        getAccessState: () => 'authenticated',
        now: createClock(),
      })
      const result = await runtime.listTimeline({ limit: 1 })
      expect(result).toMatchObject({
        status: 'failed',
        data: null,
        error: { code: 'unexpected-failure' },
      })
      expect(JSON.stringify(result)).not.toMatch(
        /rawFields|token|headers|secret/
      )
    }
  )
})
