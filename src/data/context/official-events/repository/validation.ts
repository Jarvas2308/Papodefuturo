import {
  getOfficialEventAssetIdentityByTicker,
  getOfficialEventTaxonomyDefinitionsV1,
  type OfficialEventAssetTickerV1,
  type OfficialEventSourceV1,
  type OfficialEventStatusV1,
  type OfficialEventTypeV1,
} from '../../../../domain/context/official-events'
import {
  OfficialAssetEventReadRepositoryErrorV1,
  type OfficialAssetEventReadQueryV1,
} from './types'

export const OFFICIAL_ASSET_EVENT_READ_MAX_LIMIT_V1 = 100
export const OFFICIAL_ASSET_EVENT_READ_MAX_IDENTITY_FILTERS_V1 = 12

const QUERY_KEYS = [
  'assetRegulatoryIdentityKeys',
  'tickers',
  'sources',
  'eventTypes',
  'statuses',
  'publishedFrom',
  'publishedTo',
  'limit',
  'cursor',
] as const
const QUERY_KEY_SET: ReadonlySet<string> = new Set(QUERY_KEYS)

const EVENT_TYPE_DEFINITIONS = getOfficialEventTaxonomyDefinitionsV1()

export type CanonicalOfficialAssetEventReadQueryV1 = {
  assetRegulatoryIdentityKeys: string[] | null
  tickers: OfficialEventAssetTickerV1[] | null
  sources: OfficialEventSourceV1[] | null
  eventTypes: OfficialEventTypeV1[] | null
  statuses: OfficialEventStatusV1[] | null
  publishedFrom: string | null
  publishedTo: string | null
  limit: number
  cursor: string | null
}

function invalid(message: string): never {
  throw new OfficialAssetEventReadRepositoryErrorV1({
    kind: 'invalid-query',
    message,
    operation: 'list-page',
  })
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

export function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
  })
}

function assertExactOptionalKeys(value: Record<string, unknown>): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !QUERY_KEY_SET.has(key)) {
      invalid('Official asset event query has an unknown field')
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) {
      invalid('Official asset event query must use plain data fields')
    }
  }
  if (!Object.hasOwn(value, 'limit')) {
    invalid('Official asset event query limit is required')
  }
}

function assertCivilDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid(`${field} must use YYYY-MM-DD`)
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    invalid(`${field} must be a real civil date`)
  }
  return value
}

function readStringArray(input: {
  value: unknown
  field: string
  maximum: number
}): string[] | null {
  if (input.value === undefined) return null
  if (!Array.isArray(input.value) || input.value.length === 0) {
    invalid(`${input.field} must be a non-empty array`)
  }
  if (Object.getPrototypeOf(input.value) !== Array.prototype) {
    invalid(`${input.field} must use the standard array prototype`)
  }
  if (input.value.length > input.maximum) {
    invalid(`${input.field} exceeds its maximum size`)
  }
  const expectedKeys = new Set([
    'length',
    ...Array.from({ length: input.value.length }, (_, index) => String(index)),
  ])
  if (
    Reflect.ownKeys(input.value).some(
      (key) => typeof key !== 'string' || !expectedKeys.has(key)
    )
  ) {
    invalid(`${input.field} must not contain extra fields`)
  }
  const values: string[] = []
  for (let index = 0; index < input.value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input.value, index)
    if (!descriptor || !('value' in descriptor)) {
      invalid(`${input.field} must not be sparse`)
    }
    const value = descriptor.value
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value !== value.trim() ||
      value.length > 2000
    ) {
      invalid(`${input.field} contains an invalid value`)
    }
    try {
      encodeURIComponent(value)
    } catch {
      invalid(`${input.field} contains invalid Unicode`)
    }
    values.push(value)
  }
  if (new Set(values).size !== values.length) {
    invalid(`${input.field} must not contain duplicates`)
  }
  values.sort()
  return values
}

function readTickers(value: unknown): OfficialEventAssetTickerV1[] | null {
  const values = readStringArray({ value, field: 'tickers', maximum: 12 })
  if (values === null) return null
  try {
    return values.map(
      (ticker) => getOfficialEventAssetIdentityByTicker(ticker).ticker
    )
  } catch {
    return invalid('tickers contains an invalid value')
  }
}

function readSources(value: unknown): OfficialEventSourceV1[] | null {
  const values = readStringArray({ value, field: 'sources', maximum: 3 })
  if (values === null) return null
  return values.map((source) => {
    if (
      source === 'cvm-ipe' ||
      source === 'cvm-fund-delivery' ||
      source === 'sec-edgar'
    ) {
      return source
    }
    return invalid('sources contains an invalid value')
  })
}

function readEventTypes(value: unknown): OfficialEventTypeV1[] | null {
  const values = readStringArray({ value, field: 'eventTypes', maximum: 15 })
  if (values === null) return null
  return values.map((eventType) => {
    const definition = EVENT_TYPE_DEFINITIONS.find(
      (candidate) => candidate.type === eventType
    )
    return definition?.type ?? invalid('eventTypes contains an invalid value')
  })
}

function readStatuses(value: unknown): OfficialEventStatusV1[] | null {
  const values = readStringArray({ value, field: 'statuses', maximum: 5 })
  if (values === null) return null
  return values.map((status) => {
    if (
      status === 'original' ||
      status === 'amendment' ||
      status === 'correction' ||
      status === 'replacement' ||
      status === 'cancellation'
    ) {
      return status
    }
    return invalid('statuses contains an invalid value')
  })
}

export function assertOfficialAssetEventIdV1(
  value: unknown,
  operation: 'get-by-event-id' | 'list-page' = 'get-by-event-id'
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    hasControlCharacter(value) ||
    value.length > 2000
  ) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind:
        operation === 'get-by-event-id' ? 'invalid-query' : 'invalid-cursor',
      message: 'Official asset event id is invalid',
      operation,
    })
  }
}

export function validateOfficialAssetEventReadQueryV1(
  query: OfficialAssetEventReadQueryV1
): CanonicalOfficialAssetEventReadQueryV1 {
  if (!isPlainObject(query))
    invalid('Official asset event query must be an object')
  assertExactOptionalKeys(query)
  if (
    typeof query.limit !== 'number' ||
    !Number.isSafeInteger(query.limit) ||
    Object.is(query.limit, -0) ||
    query.limit < 1 ||
    query.limit > OFFICIAL_ASSET_EVENT_READ_MAX_LIMIT_V1
  ) {
    invalid('Official asset event query limit must be an integer from 1 to 100')
  }
  if (
    query.cursor !== undefined &&
    query.cursor !== null &&
    (typeof query.cursor !== 'string' || query.cursor.length === 0)
  ) {
    invalid(
      'Official asset event query cursor must be a non-empty string or null'
    )
  }
  const publishedFrom =
    query.publishedFrom === undefined
      ? null
      : assertCivilDate(query.publishedFrom, 'publishedFrom')
  const publishedTo =
    query.publishedTo === undefined
      ? null
      : assertCivilDate(query.publishedTo, 'publishedTo')
  if (
    publishedFrom !== null &&
    publishedTo !== null &&
    publishedFrom > publishedTo
  ) {
    invalid('publishedFrom must not be after publishedTo')
  }
  return {
    assetRegulatoryIdentityKeys: readStringArray({
      value: query.assetRegulatoryIdentityKeys,
      field: 'assetRegulatoryIdentityKeys',
      maximum: OFFICIAL_ASSET_EVENT_READ_MAX_IDENTITY_FILTERS_V1,
    }),
    tickers: readTickers(query.tickers),
    sources: readSources(query.sources),
    eventTypes: readEventTypes(query.eventTypes),
    statuses: readStatuses(query.statuses),
    publishedFrom,
    publishedTo,
    limit: query.limit,
    cursor: query.cursor ?? null,
  }
}
