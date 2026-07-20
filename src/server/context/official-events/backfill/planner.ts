import type { OfficialEventsServerJobV1 } from '../types'
import {
  assertCivilDate,
  assertOfficialEventsServerJobsV1,
} from '../validation'
import type {
  OfficialEventsBackfillPlanInputV1,
  OfficialEventsBackfillPlannedJobV1,
  OfficialEventsBackfillPreviewV1,
  OfficialEventsBackfillProviderV1,
  OfficialEventsBackfillSourceV1,
  PreparedOfficialEventsBackfillPlanV1,
} from './types'
import { OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION } from './types'
import {
  assertDenseArray,
  assertExactKeys,
  assertSafeCounter,
} from './validation'

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/
const DAY_MILLISECONDS = 86_400_000

function encodeComponent(value: string): string {
  return `${value.length}:${value}`
}

function hashCanonical(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

function canonicalSource(source: OfficialEventsBackfillSourceV1): string {
  if (source.provider === 'cvm-ipe')
    return ['cvm-ipe', String(source.fromYear), String(source.toYear)]
      .map(encodeComponent)
      .join('')
  if (source.provider === 'cvm-fund-delivery')
    return ['cvm-fund-delivery', source.fromMonth, source.toMonth]
      .map(encodeComponent)
      .join('')
  return [
    'sec-edgar',
    source.fromDate,
    source.toDate,
    String(source.windowDays),
  ]
    .map(encodeComponent)
    .join('')
}

function canonicalPlan(input: OfficialEventsBackfillPlanInputV1): string {
  return [
    input.backfillVersion,
    input.failureMode,
    String(input.retryFailed),
    String(input.maxAttemptsPerJob),
    String(input.sources.length),
    ...input.sources.map(canonicalSource),
  ]
    .map(encodeComponent)
    .join('')
}

function assertYear(value: unknown, minimum: number, name: string): number {
  const year = assertSafeCounter(value, name)
  if (year < minimum || year > 9999) throw new Error(`${name} is invalid`)
  return year
}

function monthIndex(value: unknown, name: string): number {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  const match = MONTH_PATTERN.exec(value)
  if (!match) throw new Error(`${name} must use YYYY-MM`)
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 2021 || year > 9999 || month < 1 || month > 12)
    throw new Error(`${name} is invalid`)
  return year * 12 + month - 1
}

function monthAt(index: number): string {
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

function dateMilliseconds(value: unknown, name: string): number {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  assertCivilDate(value, name)
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function dateAt(milliseconds: number): string {
  return new Date(milliseconds).toISOString().slice(0, 10)
}

function copySource(
  source: OfficialEventsBackfillSourceV1
): OfficialEventsBackfillSourceV1 {
  return { ...source }
}

function assertSource(value: unknown): OfficialEventsBackfillSourceV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('source must be an object')
  const source = value as Record<string, unknown>
  if (source.provider === 'cvm-ipe') {
    assertExactKeys(source, ['provider', 'fromYear', 'toYear'], 'source')
    const fromYear = assertYear(source.fromYear, 2003, 'fromYear')
    const toYear = assertYear(source.toYear, 2003, 'toYear')
    if (fromYear > toYear) throw new Error('fromYear must not be after toYear')
    if (toYear - fromYear + 1 > 10)
      throw new Error('CVM IPE interval exceeds 10 years')
    return { provider: source.provider, fromYear, toYear }
  }
  if (source.provider === 'cvm-fund-delivery') {
    assertExactKeys(source, ['provider', 'fromMonth', 'toMonth'], 'source')
    const fromIndex = monthIndex(source.fromMonth, 'fromMonth')
    const toIndex = monthIndex(source.toMonth, 'toMonth')
    if (fromIndex > toIndex)
      throw new Error('fromMonth must not be after toMonth')
    if (toIndex - fromIndex + 1 > 120)
      throw new Error('Fund Delivery interval exceeds 120 months')
    return {
      provider: source.provider,
      fromMonth: String(source.fromMonth),
      toMonth: String(source.toMonth),
    }
  }
  if (source.provider === 'sec-edgar') {
    assertExactKeys(
      source,
      ['provider', 'fromDate', 'toDate', 'windowDays'],
      'source'
    )
    const fromMilliseconds = dateMilliseconds(source.fromDate, 'fromDate')
    const toMilliseconds = dateMilliseconds(source.toDate, 'toDate')
    if (String(source.fromDate) < '1994-01-01')
      throw new Error('fromDate is earlier than SEC EDGAR availability')
    if (fromMilliseconds > toMilliseconds)
      throw new Error('fromDate must not be after toDate')
    const days = (toMilliseconds - fromMilliseconds) / DAY_MILLISECONDS + 1
    if (days > 730) throw new Error('SEC EDGAR interval exceeds 730 days')
    const windowDays = assertSafeCounter(source.windowDays, 'windowDays')
    if (windowDays < 1 || windowDays > 90)
      throw new Error('windowDays must be between 1 and 90')
    return {
      provider: source.provider,
      fromDate: String(source.fromDate),
      toDate: String(source.toDate),
      windowDays,
    }
  }
  throw new Error('source provider is unsupported')
}

function assertPlanInput(
  value: OfficialEventsBackfillPlanInputV1
): OfficialEventsBackfillPlanInputV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('plan must be an object')
  const input = value as Record<string, unknown>
  assertExactKeys(
    input,
    [
      'backfillVersion',
      'failureMode',
      'retryFailed',
      'maxAttemptsPerJob',
      'sources',
    ],
    'plan'
  )
  if (input.backfillVersion !== OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION)
    throw new Error('backfillVersion is unsupported')
  if (input.failureMode !== 'continue' && input.failureMode !== 'stop')
    throw new Error('failureMode is unsupported')
  if (typeof input.retryFailed !== 'boolean')
    throw new Error('retryFailed must be boolean')
  const maxAttemptsPerJob = assertSafeCounter(
    input.maxAttemptsPerJob,
    'maxAttemptsPerJob'
  )
  if (maxAttemptsPerJob < 1 || maxAttemptsPerJob > 10)
    throw new Error('maxAttemptsPerJob must be between 1 and 10')
  const sourceValues = assertDenseArray(input.sources, 'sources')
  if (sourceValues.length === 0) throw new Error('sources must not be empty')
  const sources = sourceValues.map(assertSource)
  const providers = new Set<OfficialEventsBackfillProviderV1>()
  for (const source of sources) {
    if (providers.has(source.provider))
      throw new Error('provider must occur at most once')
    providers.add(source.provider)
  }
  return {
    backfillVersion: input.backfillVersion,
    failureMode: input.failureMode,
    retryFailed: input.retryFailed,
    maxAttemptsPerJob,
    sources,
  }
}

function jobsForSource(
  source: OfficialEventsBackfillSourceV1
): OfficialEventsServerJobV1[] {
  if (source.provider === 'cvm-ipe') {
    const jobs: OfficialEventsServerJobV1[] = []
    for (let year = source.fromYear; year <= source.toYear; year += 1)
      jobs.push({
        jobId: `official-events-backfill:v1:cvm-ipe:${year}`,
        provider: source.provider,
        year,
      })
    return jobs
  }
  if (source.provider === 'cvm-fund-delivery') {
    const jobs: OfficialEventsServerJobV1[] = []
    const from = monthIndex(source.fromMonth, 'fromMonth')
    const to = monthIndex(source.toMonth, 'toMonth')
    for (let index = from; index <= to; index += 1) {
      const monthValue = monthAt(index)
      jobs.push({
        jobId: `official-events-backfill:v1:cvm-fund-delivery:${monthValue}`,
        provider: source.provider,
        year: Number(monthValue.slice(0, 4)),
        month: Number(monthValue.slice(5)),
      })
    }
    return jobs
  }
  const jobs: OfficialEventsServerJobV1[] = []
  const from = dateMilliseconds(source.fromDate, 'fromDate')
  const to = dateMilliseconds(source.toDate, 'toDate')
  const windowMilliseconds = source.windowDays * DAY_MILLISECONDS
  for (let start = from; start <= to; start += windowMilliseconds) {
    const end = Math.min(start + windowMilliseconds - DAY_MILLISECONDS, to)
    const fromDate = dateAt(start)
    const toDate = dateAt(end)
    jobs.push({
      jobId: `official-events-backfill:v1:sec-edgar:${fromDate}:${toDate}`,
      provider: source.provider,
      fromDate,
      toDate,
    })
  }
  return jobs
}

export function prepareOfficialEventsBackfillPlanV1(
  value: OfficialEventsBackfillPlanInputV1
): PreparedOfficialEventsBackfillPlanV1 {
  const input = assertPlanInput(value)
  const jobs = input.sources.flatMap(jobsForSource)
  if (jobs.length > 1_000) throw new Error('plan exceeds 1000 jobs')
  assertOfficialEventsServerJobsV1(jobs)
  const canonical = canonicalPlan(input)
  const hash = hashCanonical(canonical)
  const plannedJobs: OfficialEventsBackfillPlannedJobV1[] = jobs.map(
    (job, ordinal) => ({ ordinal, job: { ...job } })
  )
  return {
    backfillVersion: input.backfillVersion,
    planId: `official-events-backfill:v1:${hash}`,
    planHash: `fnv1a64:${hash}`,
    failureMode: input.failureMode,
    retryFailed: input.retryFailed,
    maxAttemptsPerJob: input.maxAttemptsPerJob,
    sources: input.sources.map(copySource),
    jobs: plannedJobs,
    totalJobs: plannedJobs.length,
  }
}

export function previewOfficialEventsBackfillV1(
  input: OfficialEventsBackfillPlanInputV1
): OfficialEventsBackfillPreviewV1 {
  const plan = prepareOfficialEventsBackfillPlanV1(input)
  const jobsByProvider: Record<OfficialEventsBackfillProviderV1, number> = {
    'cvm-ipe': 0,
    'cvm-fund-delivery': 0,
    'sec-edgar': 0,
  }
  for (const { job } of plan.jobs) jobsByProvider[job.provider] += 1
  const firstJob = plan.jobs[0]
  const lastJob = plan.jobs[plan.jobs.length - 1]
  if (!firstJob || !lastJob) throw new Error('plan must contain jobs')
  return {
    backfillVersion: plan.backfillVersion,
    planId: plan.planId,
    planHash: plan.planHash,
    totalJobs: plan.totalJobs,
    jobsByProvider,
    firstJob: { ordinal: firstJob.ordinal, job: { ...firstJob.job } },
    lastJob: { ordinal: lastJob.ordinal, job: { ...lastJob.job } },
    coveredSources: plan.sources.map(copySource),
    warnings: plan.sources.some((source) => source.provider === 'sec-edgar')
      ? [
          {
            code: 'sec-recent-filings-only',
            message:
              'O provider SEC EDGAR V1 cobre filings recentes e rejeita intervalos que exigem filings.files.',
          },
        ]
      : [],
    executed: false,
  }
}
