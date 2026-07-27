import { describe, expect, it } from 'vitest'
import {
  prepareOfficialEventsBackfillPlanV1,
  previewOfficialEventsBackfillV1,
} from './planner'
import type { OfficialEventsBackfillPlanInputV1 } from './types'

const BASE_PLAN: OfficialEventsBackfillPlanInputV1 = {
  backfillVersion: 'official-events-backfill-plan.v1',
  failureMode: 'continue',
  retryFailed: true,
  maxAttemptsPerJob: 3,
  sources: [{ provider: 'cvm-ipe', fromYear: 2024, toYear: 2025 }],
}

function runtimePlan(
  value: Record<string, unknown>
): OfficialEventsBackfillPlanInputV1 {
  return value as OfficialEventsBackfillPlanInputV1
}

describe('official events backfill planner v1', () => {
  it('plans CVM IPE years in ascending order', () => {
    const plan = prepareOfficialEventsBackfillPlanV1(BASE_PLAN)
    expect(plan.jobs.map(({ job }) => job)).toEqual([
      {
        jobId: 'official-events-backfill:v1:cvm-ipe:2024',
        provider: 'cvm-ipe',
        year: 2024,
      },
      {
        jobId: 'official-events-backfill:v1:cvm-ipe:2025',
        provider: 'cvm-ipe',
        year: 2025,
      },
    ])
  })

  it('plans Fund Delivery months across a year boundary', () => {
    const plan = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      sources: [
        {
          provider: 'cvm-fund-delivery',
          fromMonth: '2025-12',
          toMonth: '2026-02',
        },
      ],
    })
    expect(plan.jobs.map(({ job }) => job)).toEqual([
      expect.objectContaining({ year: 2025, month: 12 }),
      expect.objectContaining({ year: 2026, month: 1 }),
      expect.objectContaining({ year: 2026, month: 2 }),
    ])
    expect(plan.jobs.map(({ job }) => job.jobId)).toEqual([
      'official-events-backfill:v1:cvm-fund-delivery:2025-12',
      'official-events-backfill:v1:cvm-fund-delivery:2026-01',
      'official-events-backfill:v1:cvm-fund-delivery:2026-02',
    ])
  })

  it('splits SEC dates into inclusive consecutive windows', () => {
    const plan = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      sources: [
        {
          provider: 'sec-edgar',
          fromDate: '2026-01-01',
          toDate: '2026-01-07',
          windowDays: 3,
        },
      ],
    })
    expect(plan.jobs.map(({ job }) => job)).toEqual([
      expect.objectContaining({ fromDate: '2026-01-01', toDate: '2026-01-03' }),
      expect.objectContaining({ fromDate: '2026-01-04', toDate: '2026-01-06' }),
      expect.objectContaining({ fromDate: '2026-01-07', toDate: '2026-01-07' }),
    ])
  })

  it('handles leap days without gaps or overlaps', () => {
    const plan = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      sources: [
        {
          provider: 'sec-edgar',
          fromDate: '2024-02-28',
          toDate: '2024-03-02',
          windowDays: 2,
        },
      ],
    })
    expect(plan.jobs.map(({ job }) => job)).toEqual([
      expect.objectContaining({ fromDate: '2024-02-28', toDate: '2024-02-29' }),
      expect.objectContaining({ fromDate: '2024-03-01', toDate: '2024-03-02' }),
    ])
  })

  it('preserves source order while each source remains chronological', () => {
    const plan = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      sources: [
        {
          provider: 'sec-edgar',
          fromDate: '2026-01-01',
          toDate: '2026-01-01',
          windowDays: 1,
        },
        { provider: 'cvm-ipe', fromYear: 2025, toYear: 2025 },
        {
          provider: 'cvm-fund-delivery',
          fromMonth: '2026-01',
          toMonth: '2026-01',
        },
      ],
    })
    expect(plan.jobs.map(({ job }) => job.provider)).toEqual([
      'sec-edgar',
      'cvm-ipe',
      'cvm-fund-delivery',
    ])
    expect(plan.jobs.map(({ ordinal }) => ordinal)).toEqual([0, 1, 2])
  })

  it('produces identical plans and IDs for identical input', () => {
    const first = prepareOfficialEventsBackfillPlanV1(BASE_PLAN)
    const second = prepareOfficialEventsBackfillPlanV1(BASE_PLAN)
    expect(second).toEqual(first)
    expect(first.planId).toMatch(/^official-events-backfill:v1:[0-9a-f]{16}$/)
    expect(first.planHash).toMatch(/^fnv1a64:[0-9a-f]{16}$/)
  })

  it('changes planId when a decision field changes', () => {
    const first = prepareOfficialEventsBackfillPlanV1(BASE_PLAN)
    const second = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      failureMode: 'stop',
    })
    expect(second.planId).not.toBe(first.planId)
  })

  it('does not mutate plan input', () => {
    const source = {
      provider: 'cvm-ipe' as const,
      fromYear: 2024,
      toYear: 2025,
    }
    const input = { ...BASE_PLAN, sources: [source] }
    const before = structuredClone(input)
    prepareOfficialEventsBackfillPlanV1(input)
    expect(input).toEqual(before)
  })

  it('previews without execution and includes the SEC coverage warning', () => {
    const preview = previewOfficialEventsBackfillV1({
      ...BASE_PLAN,
      sources: [
        {
          provider: 'sec-edgar',
          fromDate: '2026-01-01',
          toDate: '2026-01-02',
          windowDays: 1,
        },
      ],
    })
    expect(preview.executed).toBe(false)
    expect(preview.totalJobs).toBe(2)
    expect(preview.jobsByProvider).toEqual({
      'cvm-ipe': 0,
      'cvm-fund-delivery': 0,
      'sec-edgar': 2,
    })
    expect(preview.warnings).toHaveLength(1)
  })

  it.each([
    ['empty sources', { ...BASE_PLAN, sources: [] }],
    [
      'duplicate provider',
      {
        ...BASE_PLAN,
        sources: [
          { provider: 'cvm-ipe', fromYear: 2024, toYear: 2024 },
          { provider: 'cvm-ipe', fromYear: 2025, toYear: 2025 },
        ],
      },
    ],
    [
      'inverted year interval',
      {
        ...BASE_PLAN,
        sources: [{ provider: 'cvm-ipe', fromYear: 2025, toYear: 2024 }],
      },
    ],
    [
      'more than ten CVM years',
      {
        ...BASE_PLAN,
        sources: [{ provider: 'cvm-ipe', fromYear: 2015, toYear: 2025 }],
      },
    ],
    [
      'invalid month',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'cvm-fund-delivery',
            fromMonth: '2026-13',
            toMonth: '2026-13',
          },
        ],
      },
    ],
    [
      'more than 120 months',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'cvm-fund-delivery',
            fromMonth: '2021-01',
            toMonth: '2031-01',
          },
        ],
      },
    ],
    [
      'impossible date',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'sec-edgar',
            fromDate: '2026-02-30',
            toDate: '2026-03-01',
            windowDays: 1,
          },
        ],
      },
    ],
    [
      'inverted SEC interval',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'sec-edgar',
            fromDate: '2026-02-02',
            toDate: '2026-02-01',
            windowDays: 1,
          },
        ],
      },
    ],
    [
      'more than 730 SEC days',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'sec-edgar',
            fromDate: '2024-01-01',
            toDate: '2026-01-01',
            windowDays: 90,
          },
        ],
      },
    ],
    [
      'zero window',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'sec-edgar',
            fromDate: '2026-01-01',
            toDate: '2026-01-01',
            windowDays: 0,
          },
        ],
      },
    ],
    [
      'too large window',
      {
        ...BASE_PLAN,
        sources: [
          {
            provider: 'sec-edgar',
            fromDate: '2026-01-01',
            toDate: '2026-01-01',
            windowDays: 91,
          },
        ],
      },
    ],
    ['negative zero attempts', { ...BASE_PLAN, maxAttemptsPerJob: -0 }],
    ['too many attempts', { ...BASE_PLAN, maxAttemptsPerJob: 11 }],
  ])('rejects %s', (_name, input) => {
    expect(() =>
      prepareOfficialEventsBackfillPlanV1(
        input as OfficialEventsBackfillPlanInputV1
      )
    ).toThrow()
  })

  it('rejects a sparse source array', () => {
    const sources =
      Array<OfficialEventsBackfillPlanInputV1['sources'][number]>(1)
    expect(() =>
      prepareOfficialEventsBackfillPlanV1({ ...BASE_PLAN, sources })
    ).toThrow(/dense/)
  })

  it('rejects unknown plan fields', () => {
    expect(() =>
      prepareOfficialEventsBackfillPlanV1({
        ...BASE_PLAN,
        userId: 'forbidden',
      } as OfficialEventsBackfillPlanInputV1)
    ).toThrow(/unsupported fields/)
  })

  it('rejects unknown source fields and providers', () => {
    expect(() =>
      prepareOfficialEventsBackfillPlanV1(
        runtimePlan({
          ...BASE_PLAN,
          sources: [
            {
              provider: 'cvm-ipe',
              fromYear: 2025,
              toYear: 2025,
              ticker: 'BBAS3',
            },
          ],
        })
      )
    ).toThrow(/unsupported fields/)
    expect(() =>
      prepareOfficialEventsBackfillPlanV1(
        runtimePlan({
          ...BASE_PLAN,
          sources: [{ provider: 'unknown' }],
        })
      )
    ).toThrow(/unsupported/)
  })

  it('keeps the valid aggregate maximum below the 1000-job guard', () => {
    const plan = prepareOfficialEventsBackfillPlanV1({
      ...BASE_PLAN,
      sources: [
        { provider: 'cvm-ipe', fromYear: 2016, toYear: 2025 },
        {
          provider: 'cvm-fund-delivery',
          fromMonth: '2021-01',
          toMonth: '2030-12',
        },
        {
          provider: 'sec-edgar',
          fromDate: '2024-01-01',
          toDate: '2025-12-30',
          windowDays: 1,
        },
      ],
    })
    expect(plan.totalJobs).toBe(860)
  })
})
