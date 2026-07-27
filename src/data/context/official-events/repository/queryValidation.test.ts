import { describe, expect, it } from 'vitest'
import { createInMemoryOfficialAssetEventReadRepositoryV1 } from './index'
import { createReadTestEvent } from './testFixtures'

function repository() {
  return createInMemoryOfficialAssetEventReadRepositoryV1({
    events: [createReadTestEvent()],
  })
}

describe('OfficialAssetEventReadQueryV1', () => {
  it('supports global bounded list and exact get', async () => {
    const event = createReadTestEvent()
    const repo = createInMemoryOfficialAssetEventReadRepositoryV1({
      events: [event],
    })
    await expect(repo.getByEventId(event.eventId)).resolves.toEqual(event)
    await expect(repo.getByEventId('missing-event')).resolves.toBeNull()
    await expect(repo.listPage({ limit: 1 })).resolves.toMatchObject({
      returned: 1,
      limit: 1,
      hasMore: false,
      nextCursor: null,
    })
  })

  it.each(['', ' padded ', 'event\nid', 'x'.repeat(2001)])(
    'rejects invalid event id %j',
    async (eventId) => {
      await expect(repository().getByEventId(eventId)).rejects.toMatchObject({
        kind: 'invalid-query',
        operation: 'get-by-event-id',
      })
    }
  )

  it.each([1, 100])('accepts boundary limit %s', async (limit) => {
    await expect(repository().listPage({ limit })).resolves.toMatchObject({
      limit,
    })
  })

  it.each([0, 101, -0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid limit %s',
    async (limit) => {
      await expect(repository().listPage({ limit })).rejects.toMatchObject({
        kind: 'invalid-query',
      })
    }
  )

  it('accepts every approved filter with civil range', async () => {
    await expect(
      repository().listPage({
        assetRegulatoryIdentityKeys: ['cvm:company:001023:00000000000191'],
        tickers: ['BBAS3'],
        sources: ['cvm-ipe'],
        eventTypes: ['material-fact'],
        statuses: ['original'],
        publishedFrom: '2026-07-18',
        publishedTo: '2026-07-18',
        limit: 5,
        cursor: null,
      })
    ).resolves.toMatchObject({ returned: 1 })
  })

  it('supports one or multiple identities and each standalone filter', async () => {
    const event = createReadTestEvent()
    const filters = [
      {
        assetRegulatoryIdentityKeys: [
          event.assetIdentity.regulatoryIdentityKey,
        ],
      },
      {
        assetRegulatoryIdentityKeys: [
          'another-identity',
          event.assetIdentity.regulatoryIdentityKey,
        ],
      },
      { tickers: [event.assetIdentity.ticker] },
      { sources: [event.source] },
      { eventTypes: [event.eventType] },
      { statuses: [event.status] },
      { publishedFrom: '2026-07-18' },
      { publishedTo: '2026-07-18' },
    ]
    for (const filter of filters) {
      await expect(
        repository().listPage({ limit: 10, ...filter })
      ).resolves.toMatchObject({ returned: 1 })
    }
  })

  it.each([
    ['tickers', []],
    ['sources', ['cvm-ipe', 'cvm-ipe']],
    ['eventTypes', ['unknown']],
    ['statuses', ['deleted']],
    ['tickers', ['bbas3']],
    ['assetRegulatoryIdentityKeys', [' padded ']],
  ])('rejects invalid %s filter', async (field, value) => {
    await expect(
      repository().listPage({ limit: 10, [field]: value })
    ).rejects.toMatchObject({ kind: 'invalid-query' })
  })

  it('rejects sparse filters', async () => {
    const tickers = ['BBAS3', 'VOO'] as ('BBAS3' | 'VOO')[]
    delete tickers[0]
    await expect(
      repository().listPage({ limit: 10, tickers })
    ).rejects.toMatchObject({ kind: 'invalid-query' })
  })

  it('rejects array extra fields and accessors', async () => {
    const withExtra = ['BBAS3'] as ('BBAS3' & { extra?: boolean })[]
    Object.defineProperty(withExtra, 'extra', { value: true })
    const withAccessor = ['BBAS3']
    Object.defineProperty(withAccessor, 0, { get: () => 'BBAS3' })
    for (const tickers of [withExtra, withAccessor]) {
      await expect(
        repository().listPage({ limit: 10, tickers: tickers as never })
      ).rejects.toMatchObject({ kind: 'invalid-query' })
    }
  })

  it('rejects filter maximum overflow', async () => {
    const identities = Array.from(
      { length: 13 },
      (_, index) => `identity-${index}`
    )
    await expect(
      repository().listPage({
        limit: 10,
        assetRegulatoryIdentityKeys: identities,
      })
    ).rejects.toMatchObject({ kind: 'invalid-query' })
  })

  it.each(['2026-02-30', '2026-7-01', 'not-a-date'])(
    'rejects impossible or malformed date %s',
    async (publishedFrom) => {
      await expect(
        repository().listPage({ limit: 10, publishedFrom })
      ).rejects.toMatchObject({ kind: 'invalid-query' })
    }
  )

  it('rejects inverted date range', async () => {
    await expect(
      repository().listPage({
        limit: 10,
        publishedFrom: '2026-07-20',
        publishedTo: '2026-07-19',
      })
    ).rejects.toMatchObject({ kind: 'invalid-query' })
  })

  it('accepts a real leap day', async () => {
    await expect(
      repository().listPage({ limit: 10, publishedFrom: '2024-02-29' })
    ).resolves.toBeDefined()
  })

  it('rejects extra query field and non-plain query', async () => {
    await expect(
      repository().listPage({ limit: 10, unexpected: true } as never)
    ).rejects.toMatchObject({ kind: 'invalid-query' })
    await expect(repository().listPage([] as never)).rejects.toMatchObject({
      kind: 'invalid-query',
    })
  })

  it('does not mutate filter arrays', async () => {
    const sources = ['sec-edgar', 'cvm-ipe'] as const
    const snapshot = [...sources]
    await repository().listPage({ limit: 10, sources: [...sources] })
    expect(sources).toEqual(snapshot)
  })
})
