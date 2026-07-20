import type { OfficialEventsServerJobV1 } from './types'

const UTC_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/
const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function isRealDate(year: number, month: number, day: number): boolean {
  const value = new Date(Date.UTC(year, month - 1, day))
  return (
    value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day
  )
}

export function assertCivilDate(value: string, field: string): void {
  const match = CIVIL_DATE_PATTERN.exec(value)
  if (
    !match ||
    !isRealDate(Number(match[1]), Number(match[2]), Number(match[3]))
  )
    throw new Error(`${field} must be a valid civil date`)
}

export function getUtcTimestampOrder(value: string): bigint {
  const match = UTC_TIMESTAMP_PATTERN.exec(value)
  if (!match) throw new Error('Clock must return a canonical UTC timestamp')
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number)
  if (hour > 23 || minute > 59 || second > 59 || !isRealDate(year, month, day))
    throw new Error('Clock must return a canonical UTC timestamp')
  const seconds = Date.UTC(year, month - 1, day, hour, minute, second) / 1_000
  return (
    BigInt(seconds) * 1_000_000_000n +
    BigInt((match[7] ?? '').padEnd(9, '0') || '0')
  )
}

function assertExactKeys(
  job: Record<string, unknown>,
  expected: readonly string[]
): void {
  const keys = Object.keys(job)
  if (
    keys.length !== expected.length ||
    !keys.every((key) => expected.includes(key))
  )
    throw new Error('Job contains unsupported fields')
}

function assertYear(value: unknown, minimum: number): asserts value is number {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > 9999
  )
    throw new Error('Job year is invalid')
}

export function assertOfficialEventsServerJobsV1(
  jobs: readonly unknown[]
): asserts jobs is readonly OfficialEventsServerJobV1[] {
  if (!Array.isArray(jobs)) throw new Error('Jobs must be an array')
  const ids = new Set<string>()
  for (let index = 0; index < jobs.length; index += 1) {
    if (!(index in jobs)) throw new Error('Jobs must be dense')
    const job = jobs[index]
    if (!job || typeof job !== 'object' || Array.isArray(job))
      throw new Error('Job must be an object')
    const record = job as Record<string, unknown>
    if (
      typeof record.jobId !== 'string' ||
      record.jobId.trim() !== record.jobId ||
      !record.jobId
    )
      throw new Error('jobId must be non-empty and unpadded')
    if (ids.has(record.jobId)) throw new Error('jobId must be unique')
    ids.add(record.jobId)
    if (record.provider === 'cvm-ipe') {
      assertExactKeys(record, ['jobId', 'provider', 'year'])
      assertYear(record.year, 2003)
    } else if (record.provider === 'cvm-fund-delivery') {
      assertExactKeys(record, ['jobId', 'provider', 'year', 'month'])
      assertYear(record.year, 2021)
      if (
        !Number.isSafeInteger(record.month) ||
        Number(record.month) < 1 ||
        Number(record.month) > 12
      )
        throw new Error('Job month is invalid')
    } else if (record.provider === 'sec-edgar') {
      assertExactKeys(record, ['jobId', 'provider', 'fromDate', 'toDate'])
      if (
        typeof record.fromDate !== 'string' ||
        typeof record.toDate !== 'string'
      )
        throw new Error('SEC job dates must be strings')
      assertCivilDate(record.fromDate, 'fromDate')
      assertCivilDate(record.toDate, 'toDate')
      if (record.fromDate < '1994-01-01')
        throw new Error('fromDate is earlier than SEC EDGAR availability')
      if (record.fromDate > record.toDate)
        throw new Error('fromDate must not be after toDate')
    } else {
      throw new Error('Job provider is unsupported')
    }
  }
}
