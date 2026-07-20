import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION,
  createInMemoryOfficialAssetEventReadRepositoryV1,
} from './index'
import {
  decodeOfficialAssetEventReadCursorV1,
  encodeOfficialAssetEventReadCursorV1,
} from './cursor'
import { getOfficialAssetEventReadSortKeyV1 } from './ordering'
import { createReadTestEvent, createReadTimeline } from './testFixtures'

function rawCursor(components: readonly string[]): string {
  return components
    .map((component) => {
      const encoded = encodeURIComponent(component)
      return `${encoded.length}:${encoded}`
    })
    .join('|')
}

describe('timeline global em memória', () => {
  it('orders date, precision, instant and eventId deterministically', async () => {
    const events = createReadTimeline()
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [...events].reverse(),
    })
    const page = await repository.listPage({ limit: 100 })

    expect(page.items.map((event) => event.publishedAt.precision)).toEqual([
      'second',
      'minute',
      'date',
      'second',
      'date',
    ])
    expect(page.items.map((event) => event.source)).toEqual([
      'cvm-ipe',
      'cvm-fund-delivery',
      'sec-edgar',
      'cvm-ipe',
      'cvm-fund-delivery',
    ])
  })

  it('is independent from input order', async () => {
    const events = createReadTimeline()
    const first = createInMemoryOfficialAssetEventReadRepositoryV1({ events })
    const second = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [events[2], events[4], events[0], events[3], events[1]],
    })
    expect(await first.listPage({ limit: 100 })).toEqual(
      await second.listPage({ limit: 100 })
    )
  })

  it('uses descending eventId as the final tie breaker', async () => {
    const events = ['a', 'z', 'm'].map((documentId) =>
      createReadTestEvent({
        documentId: `cvm-ipe:${documentId}`,
        publishedAt: { precision: 'date', value: '2026-07-19' },
      })
    )
    const page = await createInMemoryOfficialAssetEventReadRepositoryV1({
      events,
    }).listPage({ limit: 10 })
    const expected = events
      .map((event) => event.eventId)
      .sort()
      .reverse()
    expect(page.items.map((event) => event.eventId)).toEqual(expected)
  })

  it('does not invent midnight for a civil date', () => {
    const event = createReadTestEvent({
      publishedAt: { precision: 'date', value: '2026-07-19' },
    })
    expect(getOfficialAssetEventReadSortKeyV1(event)).toEqual({
      publishedCalendarDate: '2026-07-19',
      publishedPrecisionRank: 0,
      publishedInstantSortKey: '',
      eventId: event.eventId,
    })
  })

  it('uses the UTC day of an instant including source-offset rollover', () => {
    const event = createReadTestEvent({
      publishedAt: { precision: 'minute', value: '2026-07-19T23:30-03:00' },
    })
    expect(getOfficialAssetEventReadSortKeyV1(event)).toMatchObject({
      publishedCalendarDate: '2026-07-20',
      publishedInstantSortKey: '2026-07-20T02:30:00.000Z',
    })
  })

  it('filters all supported dimensions and inclusive calendar dates', async () => {
    const events = createReadTimeline()
    const event = events[1]
    const page = await createInMemoryOfficialAssetEventReadRepositoryV1({
      events,
    }).listPage({
      assetRegulatoryIdentityKeys: [event.assetIdentity.regulatoryIdentityKey],
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

  it('returns defensive copies from get and list', async () => {
    const event = createReadTestEvent()
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [event],
    })
    const byId = await repository.getByEventId(event.eventId)
    const page = await repository.listPage({ limit: 1 })
    if (byId === null) throw new Error('Expected event')
    byId.provenance.rawFields.row = 999
    page.items[0].associationEvidence[0] = {
      reason: 'exact-cnpj',
      observedCnpj: '00000000000191',
    }
    expect(
      (await repository.getByEventId(event.eventId))?.provenance.rawFields.row
    ).toBe(7)
  })

  it('accepts validated storage records as input', async () => {
    const { toOfficialAssetEventStorageRecordV1 } = await import('../storage')
    const event = createReadTestEvent()
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      records: [toOfficialAssetEventStorageRecordV1(event)],
    })
    await expect(repository.getByEventId(event.eventId)).resolves.toEqual(event)
  })

  it('rejects duplicate eventId and conflicting deduplicationKey', () => {
    const event = createReadTestEvent()
    expect(() =>
      createInMemoryOfficialAssetEventReadRepositoryV1({
        events: [event, event],
      })
    ).toThrow(/Duplicate eventId/)
    const conflict = structuredClone(event)
    conflict.eventId = `${event.eventId}:different`
    expect(() =>
      createInMemoryOfficialAssetEventReadRepositoryV1({
        events: [event, conflict],
      })
    ).toThrow(/deduplicationKey/)
  })
})

describe('cursor determinístico de leitura', () => {
  it('pages without gaps, overlap or duplicates', async () => {
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: createReadTimeline(),
    })
    const collected: string[] = []
    let cursor: string | null = null
    let pages = 0
    do {
      const page = await repository.listPage({ limit: 2, cursor })
      collected.push(...page.items.map((event) => event.eventId))
      cursor = page.nextCursor
      pages += 1
    } while (cursor !== null)
    expect(pages).toBe(3)
    expect(collected).toHaveLength(5)
    expect(new Set(collected).size).toBe(5)
  })

  it('returns cursor only for an intermediate full page', async () => {
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: createReadTimeline().slice(0, 3),
    })
    const first = await repository.listPage({ limit: 2 })
    const last = await repository.listPage({
      limit: 2,
      cursor: first.nextCursor,
    })
    const empty = await createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [],
    }).listPage({ limit: 2 })
    expect(first).toMatchObject({ returned: 2, hasMore: true })
    expect(first.nextCursor).not.toBeNull()
    expect(last).toMatchObject({
      returned: 1,
      hasMore: false,
      nextCursor: null,
    })
    expect(empty).toMatchObject({
      returned: 0,
      hasMore: false,
      nextCursor: null,
    })
  })

  it('produces the same cursor for the same query and data', async () => {
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: createReadTimeline(),
    })
    const first = await repository.listPage({ limit: 2 })
    const second = await repository.listPage({ limit: 2 })
    expect(first.nextCursor).toBe(second.nextCursor)
  })

  it('rejects cursor reused with another query', async () => {
    const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: createReadTimeline(),
    })
    const first = await repository.listPage({ limit: 2 })
    await expect(
      repository.listPage({ limit: 3, cursor: first.nextCursor })
    ).rejects.toMatchObject({ kind: 'cursor-query-mismatch' })
  })

  it.each(['truncated', 'tampered', 'extra'])(
    'rejects malformed cursor variant %s',
    async (variant) => {
      const repository = createInMemoryOfficialAssetEventReadRepositoryV1({
        events: createReadTimeline(),
      })
      const page = await repository.listPage({ limit: 2 })
      if (page.nextCursor === null) throw new Error('Expected cursor')
      const malformed =
        variant === 'truncated'
          ? page.nextCursor.slice(0, -1)
          : variant === 'tampered'
            ? `${page.nextCursor}x`
            : `${page.nextCursor}|1:x`
      await expect(
        repository.listPage({ limit: 2, cursor: malformed })
      ).rejects.toMatchObject({ kind: 'invalid-cursor' })
    }
  )

  it('rejects invalid version, hash, date, rank, instant and event id components', () => {
    const base = {
      queryHash: 'fnv1a64:0123456789abcdef',
      sortKey: {
        publishedCalendarDate: '2026-07-19',
        publishedPrecisionRank: 2 as const,
        publishedInstantSortKey: '2026-07-19T18:00:00.000Z',
        eventId: 'event-1',
      },
    }
    const valid = encodeOfficialAssetEventReadCursorV1(base)
    expect(
      decodeOfficialAssetEventReadCursorV1({
        cursor: valid,
        expectedQueryHash: base.queryHash,
      }).cursorVersion
    ).toBe(OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION)
    const components = [
      OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION,
      base.queryHash,
      base.sortKey.publishedCalendarDate,
      '2',
      base.sortKey.publishedInstantSortKey,
      base.sortKey.eventId,
    ]
    for (const cursor of [
      rawCursor(['old-version', ...components.slice(1)]),
      rawCursor([components[0], 'invalid-hash', ...components.slice(2)]),
      rawCursor([
        components[0],
        components[1],
        '2026-02-30',
        ...components.slice(3),
      ]),
      rawCursor([...components.slice(0, 3), '3', ...components.slice(4)]),
      rawCursor([
        ...components.slice(0, 4),
        '2026-07-19T24:00:00.000Z',
        components[5],
      ]),
      rawCursor([...components.slice(0, 5), '']),
      rawCursor([...components.slice(0, 5), 'event\nid']),
      rawCursor([...components, 'extra']),
    ]) {
      expect(() =>
        decodeOfficialAssetEventReadCursorV1({
          cursor,
          expectedQueryHash: base.queryHash,
        })
      ).toThrow(/cursor/i)
    }
  })

  it('documents keyset rather than snapshot behavior under insertion', async () => {
    const initial = createReadTimeline()
    const firstRepository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: initial,
    })
    const first = await firstRepository.listPage({ limit: 2 })
    const insertedAfterCursor = createReadTestEvent({
      documentId: 'cvm-ipe:inserted-after-cursor',
      publishedAt: { precision: 'date', value: '2026-07-19' },
    })
    const changedRepository = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [...initial, insertedAfterCursor],
    })
    const second = await changedRepository.listPage({
      limit: 2,
      cursor: first.nextCursor,
    })
    expect(
      second.items.some(
        (event) => event.eventId === insertedAfterCursor.eventId
      )
    ).toBe(true)
  })
})
