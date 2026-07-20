import {
  assertOfficialAssetEventV1,
  type OfficialAssetEventV1,
} from '../../../../domain/context/official-events'
import {
  OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION,
  OfficialAssetEventReadRepositoryErrorV1,
  type OfficialAssetEventReadPageV1,
  type OfficialAssetEventReadQueryV1,
} from '../../../../data/context/official-events/repository'
import {
  compareOfficialAssetEventReadSortKeysV1,
  getOfficialAssetEventReadSortKeyV1,
} from '../../../../data/context/official-events/repository/ordering'
import {
  cloneOfficialAssetEventForReadV1,
  matchesOfficialAssetEventReadQueryV1,
} from '../../../../data/context/official-events/repository/shared'
import {
  assertOfficialAssetEventIdV1,
  isPlainObject,
  validateOfficialAssetEventReadQueryV1,
} from '../../../../data/context/official-events/repository/validation'
import {
  assertOfficialEventsRuntimeClockMonotonicV1,
  readOfficialEventsRuntimeClockV1,
} from './clock'
import {
  OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
  type CreateOfficialEventsRuntimeV1Input,
  type OfficialEventsRuntimeAccessStateV1,
  type OfficialEventsRuntimeCapabilityV1,
  type OfficialEventsRuntimeErrorV1,
  type OfficialEventsRuntimeOperationResultV1,
  type OfficialEventsRuntimeV1,
} from './types'

const SCHEMA_UNAVAILABLE_CODES = new Set(['42P01', '42883', 'PGRST202'])

function cloneQuery(
  query: OfficialAssetEventReadQueryV1
): OfficialAssetEventReadQueryV1 {
  return {
    ...(query.assetRegulatoryIdentityKeys === undefined
      ? {}
      : {
          assetRegulatoryIdentityKeys: [...query.assetRegulatoryIdentityKeys],
        }),
    ...(query.tickers === undefined ? {} : { tickers: [...query.tickers] }),
    ...(query.sources === undefined ? {} : { sources: [...query.sources] }),
    ...(query.eventTypes === undefined
      ? {}
      : { eventTypes: [...query.eventTypes] }),
    ...(query.statuses === undefined ? {} : { statuses: [...query.statuses] }),
    ...(query.publishedFrom === undefined
      ? {}
      : { publishedFrom: query.publishedFrom }),
    ...(query.publishedTo === undefined
      ? {}
      : { publishedTo: query.publishedTo }),
    limit: query.limit,
    ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
  }
}

function runtimeError(
  code: OfficialEventsRuntimeErrorV1['code'],
  message: string
): OfficialEventsRuntimeErrorV1 {
  return { code, message }
}

function classifyError(error: unknown): {
  status: 'unavailable' | 'failed'
  error: OfficialEventsRuntimeErrorV1
} {
  if (error instanceof OfficialAssetEventReadRepositoryErrorV1) {
    if (error.kind === 'transport') {
      const schemaUnavailable =
        error.upstreamCode !== null &&
        SCHEMA_UNAVAILABLE_CODES.has(error.upstreamCode)
      return {
        status: 'unavailable',
        error: runtimeError(
          schemaUnavailable ? 'schema-unavailable' : 'repository-unavailable',
          schemaUnavailable
            ? 'Official events schema or read RPC is unavailable'
            : 'Official events repository is unavailable'
        ),
      }
    }
    const code =
      error.kind === 'invalid-query'
        ? 'invalid-input'
        : error.kind === 'invalid-cursor'
          ? 'invalid-cursor'
          : error.kind === 'cursor-query-mismatch'
            ? 'cursor-query-mismatch'
            : error.kind === 'malformed-response'
              ? 'malformed-response'
              : 'contract-violation'
    return {
      status: 'failed',
      error: runtimeError(code, 'Official events read contract failed'),
    }
  }
  return {
    status: 'failed',
    error: runtimeError(
      'unexpected-failure',
      'Official events runtime operation failed'
    ),
  }
}

function validateGetInput(input: { eventId: string }): string {
  if (
    !isPlainObject(input) ||
    Reflect.ownKeys(input).length !== 1 ||
    !Object.hasOwn(input, 'eventId')
  ) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'invalid-query',
      message: 'Official events runtime get input is invalid',
      operation: 'get-by-event-id',
    })
  }
  const descriptor = Object.getOwnPropertyDescriptor(input, 'eventId')
  if (!descriptor || !('value' in descriptor)) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'invalid-query',
      message: 'Official events runtime get input must use plain fields',
      operation: 'get-by-event-id',
    })
  }
  assertOfficialAssetEventIdV1(descriptor.value)
  return descriptor.value
}

function validateEventResult(
  value: OfficialAssetEventV1 | null,
  eventId: string
): OfficialAssetEventV1 | null {
  if (value === null) return null
  try {
    assertOfficialAssetEventV1(value)
  } catch {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'contract-violation',
      message: 'Official events runtime received an invalid event',
      operation: 'get-by-event-id',
      itemCount: 1,
    })
  }
  if (value.eventId !== eventId) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'contract-violation',
      message: 'Official events runtime received another event identity',
      operation: 'get-by-event-id',
      itemCount: 1,
    })
  }
  return cloneOfficialAssetEventForReadV1(value)
}

function validatePageResult(
  page: OfficialAssetEventReadPageV1,
  query: OfficialAssetEventReadQueryV1
): OfficialAssetEventReadPageV1 {
  const canonicalQuery = validateOfficialAssetEventReadQueryV1(query)
  if (
    !isPlainObject(page) ||
    Reflect.ownKeys(page).length !== 6 ||
    ![
      'repositoryVersion',
      'items',
      'returned',
      'limit',
      'hasMore',
      'nextCursor',
    ].every((key) => Object.hasOwn(page, key)) ||
    page.repositoryVersion !==
      OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION ||
    !Array.isArray(page.items) ||
    Object.getPrototypeOf(page.items) !== Array.prototype ||
    !Number.isSafeInteger(page.returned) ||
    page.returned !== page.items.length ||
    page.items.length > query.limit ||
    page.limit !== query.limit ||
    typeof page.hasMore !== 'boolean' ||
    (page.nextCursor !== null &&
      (typeof page.nextCursor !== 'string' || page.nextCursor.length === 0)) ||
    page.hasMore !== (page.nextCursor !== null)
  ) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'malformed-response',
      message: 'Official events runtime received a malformed page',
      operation: 'list-page',
      limit: query.limit,
    })
  }
  for (let index = 0; index < page.items.length; index += 1) {
    if (!Object.hasOwn(page.items, index)) {
      throw new OfficialAssetEventReadRepositoryErrorV1({
        kind: 'malformed-response',
        message: 'Official events runtime received sparse timeline items',
        operation: 'list-page',
        limit: query.limit,
        itemCount: page.items.length,
      })
    }
  }
  const items = page.items.map((event) => {
    try {
      assertOfficialAssetEventV1(event)
    } catch {
      throw new OfficialAssetEventReadRepositoryErrorV1({
        kind: 'contract-violation',
        message: 'Official events runtime received an invalid timeline item',
        operation: 'list-page',
        limit: query.limit,
        itemCount: page.items.length,
      })
    }
    if (!matchesOfficialAssetEventReadQueryV1(event, canonicalQuery)) {
      throw new OfficialAssetEventReadRepositoryErrorV1({
        kind: 'contract-violation',
        message: 'Official events runtime received an item outside the query',
        operation: 'list-page',
        limit: query.limit,
        itemCount: page.items.length,
      })
    }
    return cloneOfficialAssetEventForReadV1(event)
  })
  const eventIds = new Set(items.map((event) => event.eventId))
  const deduplicationKeys = new Set(
    items.map((event) => event.deduplicationKey)
  )
  if (
    eventIds.size !== items.length ||
    deduplicationKeys.size !== items.length
  ) {
    throw new OfficialAssetEventReadRepositoryErrorV1({
      kind: 'contract-violation',
      message: 'Official events runtime received duplicate timeline identities',
      operation: 'list-page',
      limit: query.limit,
      itemCount: items.length,
    })
  }
  for (let index = 1; index < items.length; index += 1) {
    const previous = getOfficialAssetEventReadSortKeyV1(items[index - 1])
    const current = getOfficialAssetEventReadSortKeyV1(items[index])
    if (compareOfficialAssetEventReadSortKeysV1(previous, current) >= 0) {
      throw new OfficialAssetEventReadRepositoryErrorV1({
        kind: 'contract-violation',
        message: 'Official events runtime received an unordered timeline',
        operation: 'list-page',
        limit: query.limit,
        itemCount: items.length,
      })
    }
  }
  return {
    repositoryVersion: page.repositoryVersion,
    items,
    returned: page.returned,
    limit: page.limit,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  }
}

function capability(
  mode: 'disabled' | 'read-only',
  accessState: OfficialEventsRuntimeAccessStateV1 | null
): OfficialEventsRuntimeCapabilityV1 {
  const reason =
    mode === 'disabled'
      ? 'disabled'
      : accessState === 'authenticated'
        ? 'available'
        : accessState === 'unauthenticated'
          ? 'authentication-required'
          : 'not-ready'
  return {
    runtimeVersion: OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
    mode,
    accessState,
    canRead: reason === 'available',
    reason,
  }
}

export function createOfficialEventsRuntimeV1(
  input: CreateOfficialEventsRuntimeV1Input
): OfficialEventsRuntimeV1 {
  let knownAccessState: OfficialEventsRuntimeAccessStateV1 | null =
    input.mode === 'disabled' ? null : 'unresolved'

  async function execute<T, Prepared>(
    prepare: () => Prepared,
    operation: (prepared: Prepared) => Promise<T>
  ): Promise<OfficialEventsRuntimeOperationResultV1<T>> {
    let prepared: { value: Prepared } | null = null
    let preparationFailure: { error: unknown } | null = null
    if (input.mode === 'read-only') {
      try {
        prepared = { value: prepare() }
      } catch (error) {
        preparationFailure = { error }
      }
    }
    const started = readOfficialEventsRuntimeClockV1(input.now)
    let outcome:
      | { status: 'succeeded'; data: T; error: null }
      | {
          status: 'disabled' | 'authentication-required'
          data: null
          error: null
        }
      | {
          status: 'not-ready' | 'unavailable' | 'failed'
          data: null
          error: OfficialEventsRuntimeErrorV1
        }
      | undefined

    if (input.mode === 'disabled') {
      outcome = { status: 'disabled', data: null, error: null }
    } else if (preparationFailure !== null) {
      const classified = classifyError(preparationFailure.error)
      outcome = { ...classified, data: null }
    } else {
      let accessState: unknown
      try {
        accessState = await input.getAccessState()
      } catch {
        knownAccessState = 'unresolved'
        outcome = {
          status: 'not-ready',
          data: null,
          error: runtimeError(
            'access-state-unavailable',
            'Official events access state is unavailable'
          ),
        }
      }
      if (outcome === undefined) {
        if (
          accessState !== 'authenticated' &&
          accessState !== 'unauthenticated' &&
          accessState !== 'unresolved'
        ) {
          knownAccessState = 'unresolved'
          outcome = {
            status: 'not-ready',
            data: null,
            error: runtimeError(
              'access-state-invalid',
              'Official events access state is invalid'
            ),
          }
        } else {
          knownAccessState = accessState
          if (accessState === 'unauthenticated') {
            outcome = {
              status: 'authentication-required',
              data: null,
              error: null,
            }
          } else if (accessState === 'unresolved') {
            outcome = {
              status: 'not-ready',
              data: null,
              error: runtimeError(
                'access-state-unavailable',
                'Official events access state is not resolved'
              ),
            }
          } else {
            try {
              if (prepared === null) {
                throw new Error(
                  'Official events runtime input was not prepared'
                )
              }
              outcome = {
                status: 'succeeded',
                data: await operation(prepared.value),
                error: null,
              }
            } catch (error) {
              const classified = classifyError(error)
              outcome = { ...classified, data: null }
            }
          }
        }
      }
    }

    const completed = readOfficialEventsRuntimeClockV1(input.now)
    assertOfficialEventsRuntimeClockMonotonicV1(started.order, completed.order)
    if (outcome === undefined) {
      throw new Error('Official events runtime outcome was not resolved')
    }
    return {
      runtimeVersion: OFFICIAL_EVENTS_RUNTIME_V1_VERSION,
      startedAt: started.value,
      completedAt: completed.value,
      ...outcome,
    } as OfficialEventsRuntimeOperationResultV1<T>
  }

  return {
    getCapability() {
      return capability(input.mode, knownAccessState)
    },
    getEventById(getInput) {
      return execute(
        () => validateGetInput(getInput),
        async (eventId) => {
          if (input.mode === 'disabled') return null
          return validateEventResult(
            await input.repository.getByEventId(eventId),
            eventId
          )
        }
      )
    },
    listTimeline(queryInput) {
      return execute(
        () => {
          validateOfficialAssetEventReadQueryV1(queryInput)
          const query = cloneQuery(queryInput)
          return query
        },
        async (query) => {
          if (input.mode === 'disabled') {
            throw new Error('Disabled runtime does not execute operations')
          }
          return validatePageResult(
            await input.repository.listPage(query),
            query
          )
        }
      )
    },
  }
}
