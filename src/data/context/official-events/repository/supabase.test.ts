import { describe, expect, it } from 'vitest'
import {
  toOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventSupabaseRowV1,
} from '../storage'
import {
  OFFICIAL_ASSET_EVENT_GET_RPC_V1,
  OFFICIAL_ASSET_EVENT_LIST_RPC_V1,
  createSupabaseOfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventsReadRpcClientV1,
} from './index'
import { getOfficialAssetEventReadSortKeyV1 } from './ordering'
import { createReadTestEvent, createReadTimeline } from './testFixtures'

type RpcCall = {
  functionName: string
  args: unknown
}

function createClient(
  respond: (
    call: RpcCall
  ) =>
    | { data: unknown; error: unknown }
    | Promise<{ data: unknown; error: unknown }>
) {
  const calls: RpcCall[] = []
  const client: OfficialAssetEventsReadRpcClientV1 = {
    async rpc(functionName, args) {
      const call = { functionName, args }
      calls.push(call)
      return respond(call)
    },
  }
  return { client, calls }
}

function row(event = createReadTestEvent()) {
  return toOfficialAssetEventSupabaseRowV1(
    toOfficialAssetEventStorageRecordV1(event)
  )
}

function listEnvelope(
  events: ReturnType<typeof createReadTestEvent>[],
  hasMore = false,
  limit = 2
) {
  const last = events.at(-1)
  const key =
    last === undefined ? null : getOfficialAssetEventReadSortKeyV1(last)
  return {
    items: events.map(row),
    returned: events.length,
    limit,
    has_more: hasMore,
    last_item_cursor:
      hasMore && key !== null
        ? {
            published_calendar_date: key.publishedCalendarDate,
            published_precision_rank: key.publishedPrecisionRank,
            published_instant_sort_key: key.publishedInstantSortKey,
            event_id: key.eventId,
          }
        : null,
  }
}

describe('Supabase OfficialAssetEventReadRepositoryV1 get', () => {
  it('calls only the exact get RPC and maps the complete row', async () => {
    const event = createReadTestEvent()
    const { client, calls } = createClient(() => ({
      data: row(event),
      error: null,
    }))
    const repository = createSupabaseOfficialAssetEventReadRepositoryV1({
      client,
    })
    await expect(repository.getByEventId(event.eventId)).resolves.toEqual(event)
    expect(calls).toEqual([
      {
        functionName: OFFICIAL_ASSET_EVENT_GET_RPC_V1,
        args: { input_event_id: event.eventId },
      },
    ])
  })

  it('returns null for absence', async () => {
    const { client } = createClient(() => ({ data: null, error: null }))
    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).getByEventId(
        'missing-event'
      )
    ).resolves.toBeNull()
  })

  it('rejects invalid identity before calling the RPC', async () => {
    const { client, calls } = createClient(() => ({ data: null, error: null }))
    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).getByEventId(
        ' padded '
      )
    ).rejects.toMatchObject({ kind: 'invalid-query' })
    expect(calls).toHaveLength(0)
  })

  it('rejects another event identity and malformed rows', async () => {
    const requested = createReadTestEvent({ documentId: 'requested' })
    const other = createReadTestEvent({ documentId: 'other' })
    for (const data of [row(other), { event_id: requested.eventId }, null]) {
      const { client } = createClient(() => ({ data, error: null }))
      const promise = createSupabaseOfficialAssetEventReadRepositoryV1({
        client,
      }).getByEventId(requested.eventId)
      if (data === null) await expect(promise).resolves.toBeNull()
      else
        await expect(promise).rejects.toMatchObject({
          kind: 'contract-violation',
        })
    }
  })
})

describe('Supabase OfficialAssetEventReadRepositoryV1 list', () => {
  it('sends one snake_case RPC with every closed filter', async () => {
    const event = createReadTestEvent()
    const { client, calls } = createClient(() => ({
      data: listEnvelope([event], false, 10),
      error: null,
    }))
    const repository = createSupabaseOfficialAssetEventReadRepositoryV1({
      client,
    })
    await repository.listPage({
      assetRegulatoryIdentityKeys: [event.assetIdentity.regulatoryIdentityKey],
      tickers: [event.assetIdentity.ticker],
      sources: [event.source],
      eventTypes: [event.eventType],
      statuses: [event.status],
      publishedFrom: '2026-07-18',
      publishedTo: '2026-07-18',
      limit: 10,
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].functionName).toBe(OFFICIAL_ASSET_EVENT_LIST_RPC_V1)
    expect(calls[0].args).toEqual({
      input_query: {
        asset_regulatory_identity_keys: [
          event.assetIdentity.regulatoryIdentityKey,
        ],
        tickers: ['BBAS3'],
        sources: ['cvm-ipe'],
        event_types: ['material-fact'],
        statuses: ['original'],
        published_from: '2026-07-18',
        published_to: '2026-07-18',
        limit: 10,
        cursor: null,
      },
    })
  })

  it('maps a valid ordered page and creates the opaque public cursor', async () => {
    const events = createReadTimeline().slice(0, 2)
    const { client } = createClient(() => ({
      data: listEnvelope(events, true),
      error: null,
    }))
    const page = await createSupabaseOfficialAssetEventReadRepositoryV1({
      client,
    }).listPage({ limit: 2 })
    expect(page).toMatchObject({ returned: 2, limit: 2, hasMore: true })
    expect(page.items).toEqual(events)
    expect(page.nextCursor).toEqual(expect.any(String))
  })

  it('passes the decoded cursor tuple without exposing its hash to SQL', async () => {
    const events = createReadTimeline()
    const firstClient = createClient(() => ({
      data: listEnvelope(events.slice(0, 2), true),
      error: null,
    }))
    const first = await createSupabaseOfficialAssetEventReadRepositoryV1({
      client: firstClient.client,
    }).listPage({ limit: 2 })
    const secondClient = createClient(() => ({
      data: listEnvelope(events.slice(2, 4), false),
      error: null,
    }))
    await createSupabaseOfficialAssetEventReadRepositoryV1({
      client: secondClient.client,
    }).listPage({ limit: 2, cursor: first.nextCursor })
    expect(secondClient.calls[0].args).toMatchObject({
      input_query: {
        cursor: {
          event_id: events[1].eventId,
          published_calendar_date: '2026-07-19',
          published_precision_rank: 1,
        },
      },
    })
    expect(JSON.stringify(secondClient.calls[0].args)).not.toContain(
      'queryHash'
    )
  })

  it('rejects a cursor-query mismatch before calling the RPC', async () => {
    const events = createReadTimeline()
    const firstClient = createClient(() => ({
      data: listEnvelope(events.slice(0, 2), true),
      error: null,
    }))
    const first = await createSupabaseOfficialAssetEventReadRepositoryV1({
      client: firstClient.client,
    }).listPage({ limit: 2 })
    const secondClient = createClient(() => ({ data: null, error: null }))
    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({
        client: secondClient.client,
      }).listPage({ limit: 3, cursor: first.nextCursor })
    ).rejects.toMatchObject({ kind: 'cursor-query-mismatch' })
    expect(secondClient.calls).toHaveLength(0)
  })

  it.each([
    null,
    [],
    {},
    { items: [], has_more: false, last_item_cursor: null, extra: true },
    { items: [], has_more: 'false', last_item_cursor: null },
  ])('rejects malformed list envelope %#', async (data) => {
    const { client } = createClient(() => ({ data, error: null }))
    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
        limit: 2,
      })
    ).rejects.toMatchObject({ kind: 'malformed-response' })
  })

  it('rejects malformed, extra and invalid domain row fields', async () => {
    const valid = row()
    for (const malformed of [
      { ...valid, event_id: 1 },
      { ...valid, source: 'editorial' },
      { ...valid, unexpected: true },
      { ...valid, association_evidence: null },
    ]) {
      const { client } = createClient(() => ({
        data: {
          ...listEnvelope([]),
          items: [malformed],
          returned: 1,
        },
        error: null,
      }))
      await expect(
        createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
          limit: 2,
        })
      ).rejects.toMatchObject({ kind: 'contract-violation' })
    }
  })

  it('rejects out-of-order, duplicate identity and rows outside the query', async () => {
    const events = createReadTimeline()
    const cases = [[events[1], events[0]], [events[0], events[0]], [events[2]]]
    for (const items of cases) {
      const { client } = createClient(() => ({
        data: listEnvelope(items),
        error: null,
      }))
      await expect(
        createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
          limit: 2,
          sources: cases.indexOf(items) === 2 ? ['cvm-ipe'] : undefined,
        })
      ).rejects.toMatchObject({ kind: 'contract-violation' })
    }
  })

  it('rejects incoherent hasMore, item count and last cursor metadata', async () => {
    const event = createReadTestEvent()
    const key = getOfficialAssetEventReadSortKeyV1(event)
    for (const data of [
      listEnvelope([event], true),
      { ...listEnvelope([event]), last_item_cursor: key },
      {
        ...listEnvelope([event, event]),
        items: [row(event), row(event), row(event)],
      },
      {
        ...listEnvelope([event], true),
        last_item_cursor: {
          published_calendar_date: '2026-07-17',
          published_precision_rank: 0,
          published_instant_sort_key: '',
          event_id: event.eventId,
        },
      },
      { ...listEnvelope([event]), returned: 0 },
      { ...listEnvelope([event]), limit: 3 },
    ]) {
      const { client } = createClient(() => ({ data, error: null }))
      await expect(
        createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
          limit: 2,
        })
      ).rejects.toMatchObject({ kind: 'malformed-response' })
    }
  })
})

describe('safe read errors', () => {
  it('sanitizes transport exceptions and Supabase error payloads', async () => {
    const sensitiveDetail = 'sensitive-transport-detail'
    for (const responder of [
      () => {
        throw new Error(sensitiveDetail)
      },
      () => ({
        data: null,
        error: { message: sensitiveDetail, details: sensitiveDetail },
      }),
    ]) {
      const { client } = createClient(responder)
      try {
        await createSupabaseOfficialAssetEventReadRepositoryV1({
          client,
        }).listPage({
          limit: 1,
        })
        throw new Error('Expected transport failure')
      } catch (error) {
        expect(error).toMatchObject({
          kind: 'transport',
          code: 'official-asset-events.transport',
          operation: 'list-page',
          limit: 1,
        })
        expect(String(error)).not.toContain(sensitiveDetail)
        expect(JSON.stringify(error)).not.toContain(sensitiveDetail)
      }
    }
  })

  it('does not retry after a transport failure', async () => {
    const { client, calls } = createClient(() => {
      throw new Error('offline')
    })
    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
        limit: 1,
      })
    ).rejects.toMatchObject({ kind: 'transport' })
    expect(calls).toHaveLength(1)
  })

  it('preserves only safe upstream error metadata for runtime classification', async () => {
    const { client } = createClient(() => ({
      data: null,
      error: {
        code: 'PGRST202',
        status: 404,
        message: 'sensitive SQL detail',
      },
    }))

    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
        limit: 1,
      })
    ).rejects.toMatchObject({
      kind: 'transport',
      upstreamCode: 'PGRST202',
      upstreamStatus: 404,
    })
  })

  it('drops unsafe upstream metadata', async () => {
    const { client } = createClient(() => ({
      data: null,
      error: { code: 'PGRST202\ntoken', status: 999 },
    }))

    await expect(
      createSupabaseOfficialAssetEventReadRepositoryV1({ client }).listPage({
        limit: 1,
      })
    ).rejects.toMatchObject({
      upstreamCode: null,
      upstreamStatus: null,
    })
  })
})
