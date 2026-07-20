import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_ASSET_EVENT_GET_RPC_V1,
  createInMemoryOfficialAssetEventReadRepositoryV1,
  createSupabaseOfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventsReadRpcClientV1,
} from '../../../../data/context/official-events/repository'
import {
  compareOfficialAssetEventReadSortKeysV1,
  compareOfficialAssetEventsForReadV1,
  getOfficialAssetEventReadSortKeyV1,
} from '../../../../data/context/official-events/repository/ordering'
import { createReadTimeline } from '../../../../data/context/official-events/repository/testFixtures'
import {
  toOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventSupabaseRowV1,
} from '../../../../data/context/official-events/storage'
import { createClock } from './testFixtures'
import { createOfficialEventsRuntimeV1 } from './index'

const events = createReadTimeline()

function createSupabaseRepository(): OfficialAssetEventReadRepositoryV1 {
  const client: OfficialAssetEventsReadRpcClientV1 = {
    async rpc(functionName, args) {
      if (functionName === OFFICIAL_ASSET_EVENT_GET_RPC_V1) {
        if (!('input_event_id' in args)) throw new Error('test args')
        const event = events.find(
          (item) => item.eventId === args.input_event_id
        )
        return {
          data:
            event === undefined
              ? null
              : toOfficialAssetEventSupabaseRowV1(
                  toOfficialAssetEventStorageRecordV1(event)
                ),
          error: null,
        }
      }
      if (!('input_query' in args)) throw new Error('test args')
      const query = args.input_query
      const filtered = events
        .filter(
          (event) =>
            query.sources === null || query.sources.includes(event.source)
        )
        .filter(
          (event) =>
            query.tickers === null ||
            query.tickers.includes(event.assetIdentity.ticker)
        )
        .filter(
          (event) =>
            query.cursor === null ||
            compareOfficialAssetEventReadSortKeysV1(
              getOfficialAssetEventReadSortKeyV1(event),
              {
                publishedCalendarDate: query.cursor.published_calendar_date,
                publishedPrecisionRank: query.cursor.published_precision_rank,
                publishedInstantSortKey:
                  query.cursor.published_instant_sort_key,
                eventId: query.cursor.event_id,
              }
            ) > 0
        )
        .sort(compareOfficialAssetEventsForReadV1)
      const hasMore = filtered.length > query.limit
      const pageItems = filtered.slice(0, query.limit)
      const last = pageItems.at(-1)
      const key =
        last === undefined ? null : getOfficialAssetEventReadSortKeyV1(last)
      return {
        data: {
          items: pageItems.map((event) =>
            toOfficialAssetEventSupabaseRowV1(
              toOfficialAssetEventStorageRecordV1(event)
            )
          ),
          returned: pageItems.length,
          limit: query.limit,
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
        },
        error: null,
      }
    },
  }
  return createSupabaseOfficialAssetEventReadRepositoryV1({ client })
}

const factories: readonly [string, () => OfficialAssetEventReadRepositoryV1][] =
  [
    [
      'in-memory',
      () => createInMemoryOfficialAssetEventReadRepositoryV1({ events }),
    ],
    ['supabase-rpc', createSupabaseRepository],
  ]

describe.each(factories)(
  '%s runtime conformance',
  (_name, createRepository) => {
    function runtime() {
      return createOfficialEventsRuntimeV1({
        mode: 'read-only',
        repository: createRepository(),
        getAccessState: () => 'authenticated',
        now: createClock([
          '2026-07-20T12:00:00Z',
          '2026-07-20T12:00:00Z',
          '2026-07-20T12:00:01Z',
          '2026-07-20T12:00:01Z',
          '2026-07-20T12:00:02Z',
          '2026-07-20T12:00:02Z',
        ]),
      })
    }

    it('returns the same found and not-found states', async () => {
      const subject = runtime()
      await expect(
        subject.getEventById({ eventId: events[0].eventId })
      ).resolves.toMatchObject({ status: 'succeeded', data: events[0] })
      await expect(
        subject.getEventById({ eventId: 'missing-event' })
      ).resolves.toMatchObject({ status: 'succeeded', data: null })
    })

    it('returns identical pagination and opaque cursors', async () => {
      const subject = runtime()
      const first = await subject.listTimeline({ limit: 2 })
      if (first.status !== 'succeeded') throw new Error('first page')
      const second = await subject.listTimeline({
        limit: 2,
        cursor: first.data.nextCursor,
      })
      if (second.status !== 'succeeded') throw new Error('second page')
      expect(first.data.items).toEqual(events.slice(0, 2))
      expect(first.data.nextCursor).toEqual(expect.any(String))
      expect(second.data.items).toEqual(events.slice(2, 4))
    })

    it('preserves filters and defensive copies', async () => {
      const result = await runtime().listTimeline({
        sources: ['cvm-fund-delivery'],
        tickers: ['KNRI11'],
        limit: 10,
      })
      if (result.status !== 'succeeded') throw new Error('timeline')
      expect(
        result.data.items.every((item) => item.source === 'cvm-fund-delivery')
      ).toBe(true)
      expect(result.data.items[0]).not.toBe(events[1])
    })

    it('fails invalid input before repository execution', async () => {
      await expect(runtime().listTimeline({ limit: 0 })).resolves.toMatchObject(
        {
          status: 'failed',
          error: { code: 'invalid-input' },
        }
      )
    })

    it.each([
      ['unauthenticated', 'authentication-required'],
      ['unresolved', 'not-ready'],
    ] as const)(
      'returns the same %s access state',
      async (accessState, status) => {
        const subject = createOfficialEventsRuntimeV1({
          mode: 'read-only',
          repository: createRepository(),
          getAccessState: () => accessState,
          now: createClock(),
        })
        await expect(subject.listTimeline({ limit: 1 })).resolves.toMatchObject(
          { status, data: null }
        )
      }
    )

    it('classifies an invalid cursor without returning an empty page', async () => {
      await expect(
        runtime().listTimeline({ limit: 2, cursor: 'not-a-valid-cursor' })
      ).resolves.toMatchObject({
        status: 'failed',
        data: null,
        error: { code: 'invalid-cursor' },
      })
    })
  }
)
