import type { OfficialAssetEventReadRepositoryV1 } from '../../../../data/context/official-events/repository'
import { createReadTestEvent } from '../../../../data/context/official-events/repository/testFixtures'

export const runtimeEvent = createReadTestEvent()

export function createClock(
  values: readonly string[] = [
    '2026-07-20T12:00:00.123456789Z',
    '2026-07-20T12:00:00.123456789Z',
  ]
) {
  let index = 0
  return {
    calls: () => index,
    now() {
      const value = values[index]
      index += 1
      if (value === undefined) throw new Error('Test clock exhausted')
      return value
    },
  }
}

export function createRepositoryDouble(
  input: {
    getResult?: Awaited<
      ReturnType<OfficialAssetEventReadRepositoryV1['getByEventId']>
    >
    listResult?: Awaited<
      ReturnType<OfficialAssetEventReadRepositoryV1['listPage']>
    >
    error?: unknown
  } = {}
) {
  const calls: Array<{ operation: 'get' | 'list'; value: unknown }> = []
  const repository: OfficialAssetEventReadRepositoryV1 = {
    async getByEventId(eventId) {
      calls.push({ operation: 'get', value: eventId })
      if (input.error !== undefined) throw input.error
      return input.getResult === undefined ? runtimeEvent : input.getResult
    },
    async listPage(query) {
      calls.push({ operation: 'list', value: query })
      if (input.error !== undefined) throw input.error
      return (
        input.listResult ?? {
          repositoryVersion: 'official-asset-event-read-repository.v1',
          items: [runtimeEvent],
          returned: 1,
          limit: query.limit,
          hasMore: false,
          nextCursor: null,
        }
      )
    },
  }
  return { repository, calls }
}
