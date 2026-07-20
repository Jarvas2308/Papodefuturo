import type { OfficialAssetEventV1 } from '../../../../domain/context/official-events'
import {
  fromOfficialAssetEventStorageRecordV1,
  fromOfficialAssetEventSupabaseRowV1,
  type OfficialAssetEventSupabaseRowV1,
} from '../storage'
import {
  buildOfficialAssetEventReadQueryHashV1,
  decodeOfficialAssetEventReadCursorV1,
  encodeOfficialAssetEventReadCursorV1,
} from './cursor'
import {
  compareOfficialAssetEventReadSortKeysV1,
  getOfficialAssetEventReadSortKeyV1,
} from './ordering'
import {
  buildOfficialAssetEventReadPageV1,
  haveSameOfficialAssetEventReadSortKeyV1,
  matchesOfficialAssetEventReadQueryV1,
} from './shared'
import {
  OFFICIAL_ASSET_EVENT_GET_RPC_V1,
  OFFICIAL_ASSET_EVENT_LIST_RPC_V1,
  OfficialAssetEventReadRepositoryErrorV1,
  type OfficialAssetEventReadRepositoryV1,
  type OfficialAssetEventReadRpcQueryV1,
  type OfficialAssetEventReadSortKeyV1,
  type OfficialAssetEventsReadRpcClientV1,
} from './types'
import {
  assertOfficialAssetEventIdV1,
  isPlainObject,
  validateOfficialAssetEventReadQueryV1,
  type CanonicalOfficialAssetEventReadQueryV1,
} from './validation'

const ROW_KEYS = [
  'storage_schema_version',
  'domain_schema_version',
  'event_id',
  'deduplication_key',
  'asset_category',
  'asset_market',
  'asset_ticker',
  'asset_official_name',
  'asset_regulatory_identity_key',
  'cnpj',
  'cvm_code',
  'isin',
  'registrant_cik',
  'series_id',
  'class_contract_id',
  'event_type',
  'classification_justification',
  'source',
  'source_type',
  'language',
  'jurisdiction',
  'status',
  'supersedes_event_id',
  'document_identity_kind',
  'document_identity_value',
  'source_document_id',
  'regulatory_document_id',
  'accession_number',
  'protocol_number',
  'canonical_url',
  'fingerprint',
  'original_url',
  'occurred_at_precision',
  'occurred_at_date',
  'occurred_at_instant_utc',
  'occurred_at_raw',
  'occurred_at_source_offset',
  'published_at_precision',
  'published_at_date',
  'published_at_instant_utc',
  'published_at_raw',
  'published_at_source_offset',
  'title',
  'summary',
  'association_evidence',
  'related_documents',
  'provenance_raw_fields',
  'provenance_source_system',
  'provenance_source_type',
  'raw_document_type',
  'raw_document_category',
  'parser_version',
  'mapping_version',
  'terms_audited_at',
  'attribution',
  'source_payload_hash',
  'ingested_at',
  'updated_at',
] as const satisfies readonly (keyof OfficialAssetEventSupabaseRowV1)[]

const REQUIRED_STRING_ROW_KEYS = [
  'storage_schema_version',
  'domain_schema_version',
  'event_id',
  'deduplication_key',
  'asset_category',
  'asset_market',
  'asset_ticker',
  'asset_official_name',
  'asset_regulatory_identity_key',
  'event_type',
  'source',
  'source_type',
  'language',
  'jurisdiction',
  'status',
  'document_identity_kind',
  'document_identity_value',
  'published_at_precision',
  'published_at_raw',
  'title',
  'provenance_source_system',
  'provenance_source_type',
  'raw_document_type',
  'parser_version',
  'mapping_version',
  'terms_audited_at',
  'source_payload_hash',
  'ingested_at',
  'updated_at',
] as const satisfies readonly (keyof OfficialAssetEventSupabaseRowV1)[]

const NULLABLE_STRING_ROW_KEYS = [
  'cnpj',
  'cvm_code',
  'isin',
  'registrant_cik',
  'series_id',
  'class_contract_id',
  'classification_justification',
  'supersedes_event_id',
  'source_document_id',
  'regulatory_document_id',
  'accession_number',
  'protocol_number',
  'canonical_url',
  'fingerprint',
  'original_url',
  'occurred_at_precision',
  'occurred_at_date',
  'occurred_at_instant_utc',
  'occurred_at_raw',
  'occurred_at_source_offset',
  'published_at_date',
  'published_at_instant_utc',
  'published_at_source_offset',
  'summary',
  'raw_document_category',
  'attribution',
] as const satisfies readonly (keyof OfficialAssetEventSupabaseRowV1)[]

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  return (
    Reflect.ownKeys(value).every((key) => typeof key === 'string') &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  )
}

function assertPlainJsonValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>
): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' &&
      Number.isFinite(value) &&
      !Object.is(value, -0))
  ) {
    return
  }
  if (typeof value !== 'object' || seen.has(value)) {
    throw new Error(`${path} is not canonical JSON`)
  }
  seen.add(value)
  const expectedPrototype = Array.isArray(value)
    ? Array.prototype
    : Object.prototype
  if (Object.getPrototypeOf(value) !== expectedPrototype) {
    throw new Error(`${path} has a non-plain prototype`)
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new Error(`${path} is sparse`)
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') throw new Error(`${path} has a symbol key`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${path}.${key} is not a data field`)
    }
    if (key !== 'length') {
      assertPlainJsonValue(descriptor.value, `${path}.${key}`, seen)
    }
  }
}

function assertSupabaseRow(
  value: unknown
): asserts value is OfficialAssetEventSupabaseRowV1 {
  if (!isPlainObject(value) || !hasExactKeys(value, ROW_KEYS)) {
    throw new Error('row shape')
  }
  for (const key of ROW_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) throw new Error('row field')
  }
  for (const key of REQUIRED_STRING_ROW_KEYS) {
    if (typeof value[key] !== 'string') throw new Error('required row string')
  }
  for (const key of NULLABLE_STRING_ROW_KEYS) {
    if (value[key] !== null && typeof value[key] !== 'string') {
      throw new Error('nullable row string')
    }
  }
  if (
    !Array.isArray(value.association_evidence) ||
    !Array.isArray(value.related_documents) ||
    !isPlainObject(value.provenance_raw_fields)
  ) {
    throw new Error('row JSON shape')
  }
  assertPlainJsonValue(
    value.association_evidence,
    'association_evidence',
    new WeakSet()
  )
  assertPlainJsonValue(
    value.related_documents,
    'related_documents',
    new WeakSet()
  )
  assertPlainJsonValue(
    value.provenance_raw_fields,
    'provenance_raw_fields',
    new WeakSet()
  )
}

function repositoryError(input: {
  kind: 'transport' | 'malformed-response' | 'contract-violation'
  operation: 'get-by-event-id' | 'list-page'
  message: string
  limit?: number | null
  itemCount?: number | null
}): OfficialAssetEventReadRepositoryErrorV1 {
  return new OfficialAssetEventReadRepositoryErrorV1(input)
}

function mapSupabaseRow(
  value: unknown,
  operation: 'get-by-event-id' | 'list-page',
  limit: number | null,
  itemCount: number | null
): OfficialAssetEventV1 {
  try {
    assertSupabaseRow(value)
    return fromOfficialAssetEventStorageRecordV1(
      fromOfficialAssetEventSupabaseRowV1(value)
    )
  } catch {
    throw repositoryError({
      kind: 'contract-violation',
      operation,
      message: 'Official asset event row violates the read contract',
      limit,
      itemCount,
    })
  }
}

async function callRpc(input: {
  client: OfficialAssetEventsReadRpcClientV1
  functionName:
    | typeof OFFICIAL_ASSET_EVENT_GET_RPC_V1
    | typeof OFFICIAL_ASSET_EVENT_LIST_RPC_V1
  args:
    | { input_event_id: string }
    | { input_query: OfficialAssetEventReadRpcQueryV1 }
  operation: 'get-by-event-id' | 'list-page'
  limit?: number | null
}): Promise<unknown> {
  let response: unknown
  try {
    response = await input.client.rpc(input.functionName, input.args)
  } catch {
    throw repositoryError({
      kind: 'transport',
      operation: input.operation,
      message: 'Official asset event read transport failed',
      limit: input.limit,
    })
  }
  if (!isPlainObject(response) || !hasExactKeys(response, ['data', 'error'])) {
    throw repositoryError({
      kind: 'malformed-response',
      operation: input.operation,
      message: 'Official asset event read response envelope is malformed',
      limit: input.limit,
    })
  }
  if (response.error !== null) {
    throw repositoryError({
      kind: 'transport',
      operation: input.operation,
      message: 'Official asset event read RPC failed',
      limit: input.limit,
    })
  }
  return response.data
}

function toRpcQuery(
  query: CanonicalOfficialAssetEventReadQueryV1,
  cursor: OfficialAssetEventReadSortKeyV1 | null
): OfficialAssetEventReadRpcQueryV1 {
  return {
    asset_regulatory_identity_keys:
      query.assetRegulatoryIdentityKeys === null
        ? null
        : [...query.assetRegulatoryIdentityKeys],
    tickers: query.tickers === null ? null : [...query.tickers],
    sources: query.sources === null ? null : [...query.sources],
    event_types: query.eventTypes === null ? null : [...query.eventTypes],
    statuses: query.statuses === null ? null : [...query.statuses],
    published_from: query.publishedFrom,
    published_to: query.publishedTo,
    limit: query.limit,
    cursor:
      cursor === null
        ? null
        : {
            published_calendar_date: cursor.publishedCalendarDate,
            published_precision_rank: cursor.publishedPrecisionRank,
            published_instant_sort_key: cursor.publishedInstantSortKey,
            event_id: cursor.eventId,
          },
  }
}

function parseLastItemCursor(
  value: unknown,
  limit: number,
  itemCount: number
): OfficialAssetEventReadSortKeyV1 | null {
  if (value === null) return null
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, [
      'published_calendar_date',
      'published_precision_rank',
      'published_instant_sort_key',
      'event_id',
    ]) ||
    typeof value.published_calendar_date !== 'string' ||
    (value.published_precision_rank !== 0 &&
      value.published_precision_rank !== 1 &&
      value.published_precision_rank !== 2) ||
    typeof value.published_instant_sort_key !== 'string' ||
    typeof value.event_id !== 'string'
  ) {
    throw repositoryError({
      kind: 'malformed-response',
      operation: 'list-page',
      message: 'Official asset event list cursor metadata is malformed',
      limit,
      itemCount,
    })
  }
  return {
    publishedCalendarDate: value.published_calendar_date,
    publishedPrecisionRank: value.published_precision_rank,
    publishedInstantSortKey: value.published_instant_sort_key,
    eventId: value.event_id,
  }
}

function parseListResponse(input: {
  data: unknown
  query: CanonicalOfficialAssetEventReadQueryV1
  queryHash: string
  requestCursor: OfficialAssetEventReadSortKeyV1 | null
}) {
  const { data, query } = input
  if (
    !isPlainObject(data) ||
    !hasExactKeys(data, [
      'items',
      'returned',
      'limit',
      'has_more',
      'last_item_cursor',
    ]) ||
    !Array.isArray(data.items) ||
    typeof data.returned !== 'number' ||
    !Number.isSafeInteger(data.returned) ||
    data.returned !== data.items.length ||
    typeof data.limit !== 'number' ||
    !Number.isSafeInteger(data.limit) ||
    data.limit !== query.limit ||
    typeof data.has_more !== 'boolean' ||
    data.items.length > query.limit
  ) {
    throw repositoryError({
      kind: 'malformed-response',
      operation: 'list-page',
      message: 'Official asset event list response is malformed',
      limit: query.limit,
    })
  }
  const rawItems = data.items
  for (let index = 0; index < rawItems.length; index += 1) {
    if (!Object.hasOwn(rawItems, index)) {
      throw repositoryError({
        kind: 'malformed-response',
        operation: 'list-page',
        message: 'Official asset event list items must be dense',
        limit: query.limit,
        itemCount: rawItems.length,
      })
    }
  }
  const items = rawItems.map((row) =>
    mapSupabaseRow(row, 'list-page', query.limit, rawItems.length)
  )
  const eventIds = new Set<string>()
  const deduplicationKeys = new Set<string>()
  let previous: OfficialAssetEventReadSortKeyV1 | null = input.requestCursor
  for (const event of items) {
    const key = getOfficialAssetEventReadSortKeyV1(event)
    if (
      !matchesOfficialAssetEventReadQueryV1(event, query) ||
      (previous !== null &&
        compareOfficialAssetEventReadSortKeysV1(previous, key) >= 0) ||
      eventIds.has(event.eventId) ||
      deduplicationKeys.has(event.deduplicationKey)
    ) {
      throw repositoryError({
        kind: 'contract-violation',
        operation: 'list-page',
        message: 'Official asset event list violates filtering or ordering',
        limit: query.limit,
        itemCount: items.length,
      })
    }
    eventIds.add(event.eventId)
    deduplicationKeys.add(event.deduplicationKey)
    previous = key
  }
  const lastItemCursor = parseLastItemCursor(
    data.last_item_cursor,
    query.limit,
    items.length
  )
  const lastItem = items.at(-1)
  const expectedLastKey =
    lastItem === undefined ? null : getOfficialAssetEventReadSortKeyV1(lastItem)
  if (
    (data.has_more && items.length !== query.limit) ||
    (data.has_more && lastItemCursor === null) ||
    (!data.has_more && lastItemCursor !== null) ||
    (lastItemCursor !== null &&
      (expectedLastKey === null ||
        !haveSameOfficialAssetEventReadSortKeyV1(
          lastItemCursor,
          expectedLastKey
        )))
  ) {
    throw repositoryError({
      kind: 'malformed-response',
      operation: 'list-page',
      message: 'Official asset event list pagination metadata is incoherent',
      limit: query.limit,
      itemCount: items.length,
    })
  }
  return buildOfficialAssetEventReadPageV1({
    items,
    limit: query.limit,
    hasMore: data.has_more,
    nextCursor:
      data.has_more && lastItemCursor !== null
        ? encodeOfficialAssetEventReadCursorV1({
            queryHash: input.queryHash,
            sortKey: lastItemCursor,
          })
        : null,
  })
}

export function createSupabaseOfficialAssetEventReadRepositoryV1(input: {
  client: OfficialAssetEventsReadRpcClientV1
}): OfficialAssetEventReadRepositoryV1 {
  return {
    async getByEventId(eventId) {
      assertOfficialAssetEventIdV1(eventId)
      const data = await callRpc({
        client: input.client,
        functionName: OFFICIAL_ASSET_EVENT_GET_RPC_V1,
        args: { input_event_id: eventId },
        operation: 'get-by-event-id',
      })
      if (data === null) return null
      const event = mapSupabaseRow(data, 'get-by-event-id', null, 1)
      if (event.eventId !== eventId) {
        throw repositoryError({
          kind: 'contract-violation',
          operation: 'get-by-event-id',
          message: 'Official asset event get response has another identity',
          itemCount: 1,
        })
      }
      return event
    },
    async listPage(inputQuery) {
      const query = validateOfficialAssetEventReadQueryV1(inputQuery)
      const queryHash = buildOfficialAssetEventReadQueryHashV1(query)
      const requestCursor =
        query.cursor === null
          ? null
          : decodeOfficialAssetEventReadCursorV1({
              cursor: query.cursor,
              expectedQueryHash: queryHash,
            })
      const data = await callRpc({
        client: input.client,
        functionName: OFFICIAL_ASSET_EVENT_LIST_RPC_V1,
        args: { input_query: toRpcQuery(query, requestCursor) },
        operation: 'list-page',
        limit: query.limit,
      })
      return parseListResponse({ data, query, queryHash, requestCursor })
    },
  }
}
