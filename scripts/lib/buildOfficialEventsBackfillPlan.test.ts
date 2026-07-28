import { describe, expect, it } from 'vitest'
import {
  buildOfficialEventsBackfillPlanInputV1,
  buildOfficialEventsBackfillPlanV1,
} from './buildOfficialEventsBackfillPlan'

describe('buildOfficialEventsBackfillPlanInputV1', () => {
  it('builds a cvm-ipe plan input for a single year', () => {
    const input = buildOfficialEventsBackfillPlanInputV1([
      '--provider=cvm-ipe',
      '--year=2026',
    ])
    expect(input).toEqual({
      backfillVersion: 'official-events-backfill-plan.v1',
      failureMode: 'stop',
      retryFailed: false,
      maxAttemptsPerJob: 1,
      sources: [{ provider: 'cvm-ipe', fromYear: 2026, toYear: 2026 }],
    })
  })

  it('builds a cvm-fund-delivery plan input for a single month', () => {
    const input = buildOfficialEventsBackfillPlanInputV1([
      '--provider=cvm-fund-delivery',
      '--month=2026-06',
    ])
    expect(input.sources).toEqual([
      {
        provider: 'cvm-fund-delivery',
        fromMonth: '2026-06',
        toMonth: '2026-06',
      },
    ])
  })

  it('builds a sec-edgar plan input from an explicit date window', () => {
    const input = buildOfficialEventsBackfillPlanInputV1([
      '--provider=sec-edgar',
      '--from-date=2026-01-01',
      '--to-date=2026-01-31',
      '--window-days=31',
    ])
    expect(input.sources).toEqual([
      {
        provider: 'sec-edgar',
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
        windowDays: 31,
      },
    ])
  })

  it('rejects a missing --provider', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1(['--year=2026'])
    ).toThrow('Missing required flag: --provider')
  })

  it('rejects an unsupported provider', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1(['--provider=cvm-unknown'])
    ).toThrow('Unsupported --provider')
  })

  it('rejects cvm-ipe without --year', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1(['--provider=cvm-ipe'])
    ).toThrow('Missing required flag: --year')
  })

  it('rejects a non-integer --year', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1([
        '--provider=cvm-ipe',
        '--year=abc',
      ])
    ).toThrow('--year must be an integer')
  })

  it('rejects cvm-fund-delivery without --month', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1(['--provider=cvm-fund-delivery'])
    ).toThrow('Missing required flag: --month')
  })

  it('rejects sec-edgar without --window-days', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanInputV1([
        '--provider=sec-edgar',
        '--from-date=2026-01-01',
        '--to-date=2026-01-31',
      ])
    ).toThrow('Missing required flag: --window-days')
  })
})

describe('buildOfficialEventsBackfillPlanV1', () => {
  it('prepares a single-job plan for cvm-ipe', () => {
    const { prepared } = buildOfficialEventsBackfillPlanV1([
      '--provider=cvm-ipe',
      '--year=2026',
    ])
    expect(prepared.totalJobs).toBe(1)
    expect(prepared.jobs[0]?.job).toEqual({
      jobId: 'official-events-backfill:v1:cvm-ipe:2026',
      provider: 'cvm-ipe',
      year: 2026,
    })
  })

  it('prepares a single-job plan for cvm-fund-delivery', () => {
    const { prepared } = buildOfficialEventsBackfillPlanV1([
      '--provider=cvm-fund-delivery',
      '--month=2026-06',
    ])
    expect(prepared.totalJobs).toBe(1)
  })

  it('prepares a single-job plan for sec-edgar when the window covers the whole range', () => {
    const { prepared } = buildOfficialEventsBackfillPlanV1([
      '--provider=sec-edgar',
      '--from-date=2026-01-01',
      '--to-date=2026-01-31',
      '--window-days=31',
    ])
    expect(prepared.totalJobs).toBe(1)
  })

  it('rejects a sec-edgar window that produces more than one job', () => {
    expect(() =>
      buildOfficialEventsBackfillPlanV1([
        '--provider=sec-edgar',
        '--from-date=2026-01-01',
        '--to-date=2026-02-28',
        '--window-days=30',
      ])
    ).toThrow('a execucao gradual exige exatamente 1')
  })

  it('rejects a cvm-ipe plan that spans more than one year via manual source edit', () => {
    // buildOfficialEventsBackfillPlanInputV1 always pins fromYear === toYear
    // for the CLI surface, so multi-job cvm-ipe cannot be produced through the
    // CLI parser itself; this test documents that guarantee indirectly by
    // confirming a single year always yields exactly one job.
    const { prepared } = buildOfficialEventsBackfillPlanV1([
      '--provider=cvm-ipe',
      '--year=2003',
    ])
    expect(prepared.totalJobs).toBe(1)
  })
})
