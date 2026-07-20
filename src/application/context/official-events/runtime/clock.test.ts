import { describe, expect, it } from 'vitest'
import {
  OfficialEventsRuntimeClockErrorV1,
  createOfficialEventsRuntimeV1,
} from './index'
import { createClock } from './testFixtures'

describe('OfficialEventsRuntimeV1 clock', () => {
  it.each([
    '2026-07-20T12:00:00Z',
    '2026-07-20T12:00:00.1Z',
    '2026-07-20T12:00:00.123Z',
    '2026-07-20T12:00:00.123456Z',
    '2026-07-20T12:00:00.123456789Z',
  ])('accepts canonical UTC timestamp %s', async (timestamp) => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock([timestamp, timestamp]),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      startedAt: timestamp,
      completedAt: timestamp,
    })
  })

  it('accepts a later completion with nanosecond precision', async () => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock([
        '2026-07-20T12:00:00.000000001Z',
        '2026-07-20T12:00:00.000000002Z',
      ]),
    })
    await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
      status: 'disabled',
    })
  })

  it('rejects a regressive clock', async () => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock(['2026-07-20T12:00:00.2Z', '2026-07-20T12:00:00.1Z']),
    })
    await expect(runtime.listTimeline({ limit: 1 })).rejects.toMatchObject({
      code: 'clock-regressed',
    })
  })

  it.each([
    '2026-02-30T12:00:00Z',
    '2026-07-20T24:00:00Z',
    '2026-07-20T12:60:00Z',
    '2026-07-20T12:00:60Z',
    '2026-07-20T12:00:00.1234567890Z',
    '2026-07-20T12:00:00.Z',
    '2026-07-20T12:00:00-03:00',
    '2026-07-20 12:00:00Z',
  ])('rejects invalid clock value %s', async (value) => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: createClock([value]),
    })
    await expect(runtime.listTimeline({ limit: 1 })).rejects.toBeInstanceOf(
      OfficialEventsRuntimeClockErrorV1
    )
  })

  it('sanitizes a throwing clock', async () => {
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: {
        now() {
          throw new Error('clock secret')
        },
      },
    })
    try {
      await runtime.listTimeline({ limit: 1 })
      throw new Error('Expected clock failure')
    } catch (error) {
      expect(error).toMatchObject({ code: 'clock-unavailable' })
      expect(String(error)).not.toContain('secret')
    }
  })

  it('uses exactly two clock reads for a completed operation', async () => {
    const clock = createClock()
    const runtime = createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: clock,
    })
    await runtime.listTimeline({ limit: 1 })
    expect(clock.calls()).toBe(2)
  })

  it('does not depend on the Date global', async () => {
    const originalDate = globalThis.Date
    class ForbiddenDate extends originalDate {
      constructor() {
        super(0)
        throw new Error('Date constructor must not be called')
      }

      static now(): number {
        throw new Error('Date.now must not be called')
      }
    }
    Object.defineProperty(globalThis, 'Date', {
      configurable: true,
      value: ForbiddenDate,
    })
    try {
      const runtime = createOfficialEventsRuntimeV1({
        mode: 'disabled',
        now: createClock(),
      })
      await expect(runtime.listTimeline({ limit: 1 })).resolves.toMatchObject({
        status: 'disabled',
      })
    } finally {
      Object.defineProperty(globalThis, 'Date', {
        configurable: true,
        value: originalDate,
      })
    }
  })
})
