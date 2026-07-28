import { describe, expect, it } from 'vitest'
import { createSupabaseFundamentalsRuntimeV1 } from './supabase'
import { createRuntimeClock } from './testFixtures'

describe('createSupabaseFundamentalsRuntimeV1', () => {
  it('creates disabled mode without a client or access provider', async () => {
    const runtime = createSupabaseFundamentalsRuntimeV1({
      mode: 'disabled',
      now: createRuntimeClock(),
    })

    expect(runtime.getCapability().mode).toBe('disabled')
    await expect(runtime.getDossier()).resolves.toMatchObject({
      status: 'disabled',
    })
  })
})
