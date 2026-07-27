import { describe, expect, it } from 'vitest'
import {
  toOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventSupabaseRowV1,
} from '../storage'
import {
  OFFICIAL_ASSET_EVENT_GET_RPC_V1,
  createInMemoryOfficialAssetEventReadRepositoryV1,
  createSupabaseOfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventsReadRpcClientV1,
} from './index'
import {
  compareOfficialAssetEventReadSortKeysV1,
  compareOfficialAssetEventsForReadV1,
  getOfficialAssetEventReadSortKeyV1,
} from './ordering'
import { createReadTimeline } from './testFixtures'

const events = createReadTimeline()

function createSupabaseConformanceRepository(): OfficialAssetEventReadRepositoryV1 {
  const client: OfficialAssetEventsReadRpcClientV1 = {
    async rpc(functionName, args) {
      if (functionName === OFFICIAL_ASSET_EVENT_GET_RPC_V1) {
        if (!('input_event_id' in args))
          throw new Error('Invalid test RPC args')
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
      if (!('input_query' in args)) throw new Error('Invalid test RPC args')
      const query = args.input_query
      const filtered = events
        .filter(
          (event) =>
            query.asset_regulatory_identity_keys === null ||
            query.asset_regulatory_identity_keys.includes(
              event.assetIdentity.regulatoryIdentityKey
            )
        )
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
            query.event_types === null ||
            query.event_types.includes(event.eventType)
        )
        .filter(
          (event) =>
            query.statuses === null || query.statuses.includes(event.status)
        )
        .filter((event) => {
          const publishedDate =
            getOfficialAssetEventReadSortKeyV1(event).publishedCalendarDate
          return (
            (query.published_from === null ||
              publishedDate >= query.published_from) &&
            (query.published_to === null || publishedDate <= query.published_to)
          )
        })
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
      const returned = filtered.slice(0, query.limit)
      const last = returned.at(-1)
      const key =
        last === undefined ? null : getOfficialAssetEventReadSortKeyV1(last)
      return {
        data: {
          items: returned.map((event) =>
            toOfficialAssetEventSupabaseRowV1(
              toOfficialAssetEventStorageRecordV1(event)
            )
          ),
          returned: returned.length,
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
    ['supabase-rpc', createSupabaseConformanceRepository],
  ]

describe.each(factories)(
  '%s repository conformance',
  (_name, createRepository) => {
    it('gets present and absent identities with the same domain shape', async () => {
      const repository = createRepository()
      await expect(repository.getByEventId(events[0].eventId)).resolves.toEqual(
        events[0]
      )
      await expect(repository.getByEventId('missing-event')).resolves.toBeNull()
    })

    it('returns defensive copies and rejects invalid queries before reading', async () => {
      const repository = createRepository()
      const first = await repository.getByEventId(events[0].eventId)
      if (first === null) throw new Error('Expected event')
      first.provenance.rawFields.row = 999
      await expect(repository.getByEventId(events[0].eventId)).resolves.toEqual(
        events[0]
      )
      await expect(repository.listPage({ limit: 0 })).rejects.toMatchObject({
        kind: 'invalid-query',
      })
    })

    it('returns the same bounded global timeline contract', async () => {
      const page = await createRepository().listPage({ limit: 3 })
      expect(page.repositoryVersion).toBe(
        'official-asset-event-read-repository.v1'
      )
      expect(page.items).toEqual(events.slice(0, 3))
      expect(page).toMatchObject({ returned: 3, limit: 3, hasMore: true })
      expect(page.nextCursor).toEqual(expect.any(String))
    })

    it('applies source and ticker filters identically', async () => {
      const page = await createRepository().listPage({
        sources: ['cvm-fund-delivery'],
        tickers: ['KNRI11'],
        limit: 10,
      })
      expect(
        page.items.every((event) => event.source === 'cvm-fund-delivery')
      ).toBe(true)
      expect(
        page.items.every((event) => event.assetIdentity.ticker === 'KNRI11')
      ).toBe(true)
    })

    it('applies every structured filter identically', async () => {
      const event = events[1]
      const page = await createRepository().listPage({
        assetRegulatoryIdentityKeys: [
          event.assetIdentity.regulatoryIdentityKey,
        ],
        tickers: [event.assetIdentity.ticker],
        sources: [event.source],
        eventTypes: [event.eventType],
        statuses: [event.status],
        publishedFrom: '2026-07-19',
        publishedTo: '2026-07-19',
        limit: 10,
      })
      expect(page.items.map((item) => item.eventId)).toEqual([event.eventId])
    })

    it('paginates the complete timeline without overlap', async () => {
      const repository = createRepository()
      const first = await repository.listPage({ limit: 2 })
      const second = await repository.listPage({
        limit: 2,
        cursor: first.nextCursor,
      })
      const third = await repository.listPage({
        limit: 2,
        cursor: second.nextCursor,
      })
      const ids = [...first.items, ...second.items, ...third.items].map(
        (event) => event.eventId
      )
      expect(ids).toHaveLength(5)
      expect(new Set(ids).size).toBe(5)
      expect(third.nextCursor).toBeNull()
    })
  }
)
