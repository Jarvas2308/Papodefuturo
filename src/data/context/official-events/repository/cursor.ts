import {
  OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION,
  OfficialAssetEventReadRepositoryErrorV1,
  type OfficialAssetEventReadCursorV1,
  type OfficialAssetEventReadSortKeyV1,
} from './types'
import type { CanonicalOfficialAssetEventReadQueryV1 } from './validation'
import { hasControlCharacter } from './validation'

function serializeComponents(components: readonly string[]): string {
  return components
    .map((component) => {
      const encoded = encodeURIComponent(component)
      return `${encoded.length}:${encoded}`
    })
    .join('|')
}

function deserializeComponents(value: string): string[] {
  const components: string[] = []
  let offset = 0
  while (offset < value.length) {
    const colon = value.indexOf(':', offset)
    if (colon === -1) throw new Error('Missing cursor component length')
    const rawLength = value.slice(offset, colon)
    if (!/^(0|[1-9]\d*)$/.test(rawLength)) {
      throw new Error('Invalid cursor component length')
    }
    const length = Number(rawLength)
    if (!Number.isSafeInteger(length)) {
      throw new Error('Unsafe cursor component length')
    }
    const start = colon + 1
    const end = start + length
    if (end > value.length) throw new Error('Truncated cursor component')
    components.push(decodeURIComponent(value.slice(start, end)))
    offset = end
    if (offset < value.length) {
      if (value[offset] !== '|') throw new Error('Invalid cursor separator')
      offset += 1
      if (offset === value.length) throw new Error('Trailing cursor separator')
    }
  }
  return components
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

function addArray(
  components: string[],
  field: string,
  values: readonly string[] | null
): void {
  components.push(field, values === null ? 'null' : String(values.length))
  if (values !== null) components.push(...values)
}

export function buildOfficialAssetEventReadQueryHashV1(
  query: CanonicalOfficialAssetEventReadQueryV1
): string {
  const components: string[] = [OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION]
  addArray(
    components,
    'assetRegulatoryIdentityKeys',
    query.assetRegulatoryIdentityKeys
  )
  addArray(components, 'tickers', query.tickers)
  addArray(components, 'sources', query.sources)
  addArray(components, 'eventTypes', query.eventTypes)
  addArray(components, 'statuses', query.statuses)
  components.push(
    'publishedFrom',
    query.publishedFrom ?? 'null',
    'publishedTo',
    query.publishedTo ?? 'null',
    'limit',
    String(query.limit)
  )
  return `fnv1a64:${fnv1a64(serializeComponents(components))}`
}

function isRealCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isCanonicalUtcInstant(value: string, calendarDate: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(
    value
  )
  return (
    match !== null &&
    match[1] === calendarDate &&
    isRealCivilDate(match[1]) &&
    Number(match[2]) <= 23 &&
    Number(match[3]) <= 59 &&
    Number(match[4]) <= 59
  )
}

function invalidCursor(message: string): never {
  throw new OfficialAssetEventReadRepositoryErrorV1({
    kind: 'invalid-cursor',
    message,
    operation: 'list-page',
  })
}

export function encodeOfficialAssetEventReadCursorV1(input: {
  queryHash: string
  sortKey: OfficialAssetEventReadSortKeyV1
}): string {
  return serializeComponents([
    OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION,
    input.queryHash,
    input.sortKey.publishedCalendarDate,
    String(input.sortKey.publishedPrecisionRank),
    input.sortKey.publishedInstantSortKey,
    input.sortKey.eventId,
  ])
}

export function decodeOfficialAssetEventReadCursorV1(input: {
  cursor: string
  expectedQueryHash: string
}): OfficialAssetEventReadCursorV1 {
  if (input.cursor.length > 8192) {
    return invalidCursor('Official asset event cursor is too large')
  }
  let components: string[]
  try {
    components = deserializeComponents(input.cursor)
  } catch {
    return invalidCursor('Official asset event cursor is malformed')
  }
  if (serializeComponents(components) !== input.cursor) {
    return invalidCursor(
      'Official asset event cursor encoding is not canonical'
    )
  }
  if (components.length !== 6) {
    return invalidCursor('Official asset event cursor shape is invalid')
  }
  const [
    cursorVersion,
    queryHash,
    publishedCalendarDate,
    rankText,
    publishedInstantSortKey,
    eventId,
  ] = components
  if (cursorVersion !== OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION) {
    return invalidCursor('Official asset event cursor version is invalid')
  }
  if (!/^fnv1a64:[0-9a-f]{16}$/.test(queryHash)) {
    return invalidCursor('Official asset event cursor query hash is invalid')
  }
  if (queryHash !== input.expectedQueryHash) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'cursor-query-mismatch',
      message: 'Official asset event cursor belongs to another query',
      operation: 'list-page',
    })
  }
  if (!isRealCivilDate(publishedCalendarDate)) {
    return invalidCursor('Official asset event cursor date is invalid')
  }
  if (rankText !== '0' && rankText !== '1' && rankText !== '2') {
    return invalidCursor(
      'Official asset event cursor precision rank is invalid'
    )
  }
  const publishedPrecisionRank = rankText === '0' ? 0 : rankText === '1' ? 1 : 2
  if (
    (publishedPrecisionRank === 0 && publishedInstantSortKey !== '') ||
    (publishedPrecisionRank !== 0 &&
      !isCanonicalUtcInstant(publishedInstantSortKey, publishedCalendarDate))
  ) {
    return invalidCursor('Official asset event cursor instant is invalid')
  }
  if (
    eventId.length === 0 ||
    eventId !== eventId.trim() ||
    hasControlCharacter(eventId) ||
    eventId.length > 2000
  ) {
    return invalidCursor('Official asset event cursor event id is invalid')
  }
  return {
    cursorVersion: OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION,
    queryHash,
    publishedCalendarDate,
    publishedPrecisionRank,
    publishedInstantSortKey,
    eventId,
  }
}
