import type { FundamentalsRuntimeClockV1 } from './types'
import { FundamentalsRuntimeClockErrorV1 } from './types'

const UTC_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function getUtcTimestampOrder(value: string): string {
  const match = UTC_TIMESTAMP_PATTERN.exec(value)
  if (!match) {
    throw new FundamentalsRuntimeClockErrorV1(
      'clock-invalid',
      'Fundamentals runtime clock must return canonical UTC timestamps'
    )
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new FundamentalsRuntimeClockErrorV1(
      'clock-invalid',
      'Fundamentals runtime clock returned an invalid civil instant'
    )
  }
  return `${value.slice(0, 19)}.${(match[7] ?? '').padEnd(9, '0')}`
}

export function readFundamentalsRuntimeClockV1(
  clock: FundamentalsRuntimeClockV1
): { value: string; order: string } {
  let value: unknown
  try {
    value = clock.now()
  } catch {
    throw new FundamentalsRuntimeClockErrorV1(
      'clock-unavailable',
      'Fundamentals runtime clock is unavailable'
    )
  }
  if (typeof value !== 'string') {
    throw new FundamentalsRuntimeClockErrorV1(
      'clock-invalid',
      'Fundamentals runtime clock must return a string'
    )
  }
  return { value, order: getUtcTimestampOrder(value) }
}

export function assertFundamentalsRuntimeClockMonotonicV1(
  startedOrder: string,
  completedOrder: string
): void {
  if (completedOrder < startedOrder) {
    throw new FundamentalsRuntimeClockErrorV1(
      'clock-regressed',
      'Fundamentals runtime clock must be monotonic'
    )
  }
}
