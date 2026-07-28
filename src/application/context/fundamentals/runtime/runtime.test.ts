import { describe, expect, it } from 'vitest'
import { createFundamentalsRuntimeV1 } from './runtime'
import {
  createRuntimeClock,
  createRuntimeRepositoryDouble,
} from './testFixtures'

describe('createFundamentalsRuntimeV1', () => {
  it('reports disabled capability and never touches the repository in disabled mode', async () => {
    const runtime = createFundamentalsRuntimeV1({
      mode: 'disabled',
      now: createRuntimeClock(),
    })

    expect(runtime.getCapability()).toEqual({
      runtimeVersion: 'fundamentals-runtime.v1',
      mode: 'disabled',
      accessState: null,
      canRead: false,
      reason: 'disabled',
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('disabled')
    expect(result.data).toBeNull()
  })

  it('requires authentication before reading', async () => {
    const { repository, calls } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'unauthenticated',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('authentication-required')
    expect(calls).toEqual([])
    expect(runtime.getCapability().reason).toBe('authentication-required')
  })

  it('reports not-ready while access state is unresolved', async () => {
    const { repository, calls } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'unresolved',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('not-ready')
    expect(result.status === 'not-ready' && result.error.code).toBe(
      'access-state-unavailable'
    )
    expect(calls).toEqual([])
  })

  it('reports not-ready when the access state provider throws', async () => {
    const { repository } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => {
        throw new Error('boom')
      },
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('not-ready')
  })

  it('reports not-ready when the access state provider resolves an invalid value', async () => {
    const { repository } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      // @ts-expect-error deliberately invalid access state for the test
      getAccessState: () => 'bogus',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('not-ready')
    expect(result.status === 'not-ready' && result.error.code).toBe(
      'access-state-invalid'
    )
  })

  it('builds and returns the dossier when authenticated', async () => {
    const { repository, calls } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('succeeded')
    expect(calls).toEqual([
      'listAssets',
      'listBrazilianStockSnapshots',
      'listRealEstateFundSnapshots',
      'listInternationalEtfSnapshots',
    ])
    if (result.status !== 'succeeded') throw new Error('expected success')
    expect(result.data.facts.schemaVersion).toBe('fundamental-facts.v1')
    expect(result.data.derived.schemaVersion).toBe(
      'fundamental-derived-facts.v1'
    )
    expect(runtime.getCapability()).toEqual({
      runtimeVersion: 'fundamentals-runtime.v1',
      mode: 'read-only',
      accessState: 'authenticated',
      canRead: true,
      reason: 'available',
    })
  })

  it('classifies a repository failure as failed without throwing', async () => {
    const { repository } = createRuntimeRepositoryDouble({
      error: new Error('supabase unavailable'),
    })
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('failed')
    expect(result.status === 'failed' && result.error.code).toBe(
      'contract-violation'
    )
  })

  it('classifies a non-Error repository throw as unexpected-failure', async () => {
    const { repository } = createRuntimeRepositoryDouble({ error: 'boom' })
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createRuntimeClock(),
    })

    const result = await runtime.getDossier()
    expect(result.status).toBe('failed')
    expect(result.status === 'failed' && result.error.code).toBe(
      'unexpected-failure'
    )
  })

  it('stamps runtimeVersion and monotonic timestamps on every result', async () => {
    const { repository } = createRuntimeRepositoryDouble()
    const runtime = createFundamentalsRuntimeV1({
      mode: 'read-only',
      repository,
      getAccessState: () => 'authenticated',
      now: createRuntimeClock([
        '2026-07-28T12:00:00.000000000Z',
        '2026-07-28T12:00:01.000000000Z',
        '2026-07-28T12:00:02.000000000Z',
      ]),
    })

    const result = await runtime.getDossier()
    expect(result.runtimeVersion).toBe('fundamentals-runtime.v1')
    expect(result.startedAt <= result.completedAt).toBe(true)
  })
})
