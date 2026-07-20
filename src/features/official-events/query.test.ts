import { describe, expect, it } from 'vitest'
import {
  buildOfficialEventsTimelineQuery,
  OFFICIAL_EVENTS_PAGE_SIZE,
} from './query'
import { EMPTY_OFFICIAL_EVENTS_FILTERS } from './presentation'

describe('buildOfficialEventsTimelineQuery', () => {
  it('uses the runtime query contract without count or numeric pagination', () => {
    expect(
      buildOfficialEventsTimelineQuery(EMPTY_OFFICIAL_EVENTS_FILTERS, null)
    ).toEqual({
      limit: OFFICIAL_EVENTS_PAGE_SIZE,
      cursor: null,
    })
  })

  it('copies closed filters and forwards the opaque cursor unchanged', () => {
    const query = buildOfficialEventsTimelineQuery(
      {
        tickers: ['BBAS3', 'VOO'],
        sources: ['cvm-ipe', 'sec-edgar'],
        eventTypes: ['material-fact'],
        statuses: ['original'],
        publishedFrom: '2026-01-01',
        publishedTo: '2026-07-20',
      },
      'opaque-runtime-cursor'
    )
    expect(query).toEqual({
      tickers: ['BBAS3', 'VOO'],
      sources: ['cvm-ipe', 'sec-edgar'],
      eventTypes: ['material-fact'],
      statuses: ['original'],
      publishedFrom: '2026-01-01',
      publishedTo: '2026-07-20',
      limit: OFFICIAL_EVENTS_PAGE_SIZE,
      cursor: 'opaque-runtime-cursor',
    })
    expect(Object.hasOwn(query, 'count')).toBe(false)
    expect(Object.hasOwn(query, 'page')).toBe(false)
  })
})
