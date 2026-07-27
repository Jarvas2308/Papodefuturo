import { describe, expect, it, vi } from 'vitest'
import {
  OFFICIAL_ASSET_EVENT_GET_RPC_V1,
  OFFICIAL_ASSET_EVENT_LIST_RPC_V1,
  type OfficialAssetEventsReadRpcClientV1,
} from '../../../../data/context/official-events/repository'
import {
  toOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventSupabaseRowV1,
} from '../../../../data/context/official-events/storage'
import { getOfficialAssetEventReadSortKeyV1 } from '../../../../data/context/official-events/repository/ordering'
import { createClock, runtimeEvent } from './testFixtures'
import { createSupabaseOfficialEventsRuntimeV1 } from './index'

function createClient() {
  const calls: Array<{ functionName: string; args: unknown }> = []
  const row = toOfficialAssetEventSupabaseRowV1(
    toOfficialAssetEventStorageRecordV1(runtimeEvent)
  )
  const client: OfficialAssetEventsReadRpcClientV1 = {
    async rpc(functionName, args) {
      calls.push({ functionName, args })
      if (functionName === OFFICIAL_ASSET_EVENT_GET_RPC_V1) {
        return { data: row, error: null }
      }
      const key = getOfficialAssetEventReadSortKeyV1(runtimeEvent)
      return {
        data: {
          items: [row],
          returned: 1,
          limit: 1,
          has_more: false,
          last_item_cursor: null,
          observed_key_for_test: key.eventId,
        },
        error: null,
      }
    },
  }
  return { client, calls }
}

describe('createSupabaseOfficialEventsRuntimeV1', () => {
  it('creates disabled mode without client or access provider', async () => {
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status: 'disabled',
    })
  })

  it('composes get through the existing read RPC repository', async () => {
    const { client, calls } = createClient()
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'read-only',
      client,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(
      runtime.getEventById({ eventId: runtimeEvent.eventId })
    ).resolves.toMatchObject({ status: 'succeeded', data: runtimeEvent })
    expect(calls).toEqual([
      {
        functionName: OFFICIAL_ASSET_EVENT_GET_RPC_V1,
        args: { input_event_id: runtimeEvent.eventId },
      },
    ])
  })

  it('composes list through the exact read RPC without table access', async () => {
    const { client } = createClient()
    const rpc = vi.spyOn(client, 'rpc').mockResolvedValue({
      data: {
        items: [],
        returned: 0,
        limit: 2,
        has_more: false,
        last_item_cursor: null,
      },
      error: null,
    })
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'read-only',
      client,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 2 })).resolves.toMatchObject({
      status: 'succeeded',
    })
    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc).toHaveBeenCalledWith(OFFICIAL_ASSET_EVENT_LIST_RPC_V1, {
      input_query: expect.objectContaining({ limit: 2 }),
    })
    expect(JSON.stringify(rpc.mock.calls)).not.toMatch(/upsert|backfill|from\(/)
  })

  it('does not call Supabase without authenticated access', async () => {
    const { client, calls } = createClient()
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'read-only',
      client,
      getAccessState: () => 'unauthenticated',
      now: createClock(),
    })
    await runtime.listTimeline({ limit: 1 })
    expect(calls).toHaveLength(0)
  })

  it('does not retry a Supabase RPC failure', async () => {
    const calls: string[] = []
    const client: OfficialAssetEventsReadRpcClientV1 = {
      async rpc(functionName) {
        calls.push(functionName)
        return { data: null, error: { code: 'PGRST000' } }
      },
    }
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'read-only',
      client,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status: 'unavailable',
      error: { code: 'repository-unavailable' },
    })
    expect(calls).toHaveLength(1)
  })

  it('classifies a safely exposed missing RPC without probing', async () => {
    const calls: string[] = []
    const client: OfficialAssetEventsReadRpcClientV1 = {
      async rpc(functionName) {
        calls.push(functionName)
        return { data: null, error: { code: 'PGRST202', status: 404 } }
      },
    }
    const runtime = createSupabaseOfficialEventsRuntimeV1({
      mode: 'read-only',
      client,
      getAccessState: () => 'authenticated',
      now: createClock(),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status: 'unavailable',
      error: { code: 'schema-unavailable' },
    })
    expect(calls).toEqual([OFFICIAL_ASSET_EVENT_LIST_RPC_V1])
  })
})
