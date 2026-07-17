import type {
  OfficialEventTemporalInputV1,
  OfficialEventTemporalValueV1,
} from './types'

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MINUTE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/
const SECOND_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/

type CivilDateTime = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  fraction: string
  offset: string
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function assertCivilDate(year: number, month: number, day: number): void {
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error('Invalid civil date')
  }
}

export function assertCivilDateString(value: string, field = 'date'): void {
  const match = DATE_PATTERN.exec(value)
  if (!match) throw new Error(`${field} must use YYYY-MM-DD`)
  assertCivilDate(Number(match[1]), Number(match[2]), Number(match[3]))
}

function parseOffsetMinutes(offset: string): number {
  if (offset === 'Z') return 0
  const sign = offset[0] === '+' ? 1 : -1
  const hours = Number(offset.slice(1, 3))
  const minutes = Number(offset.slice(4, 6))
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) {
    throw new Error('Invalid timezone offset')
  }
  return sign * (hours * 60 + minutes)
}

function parseInstant(
  value: string,
  precision: 'minute' | 'second'
): CivilDateTime {
  const match = (precision === 'minute' ? MINUTE_PATTERN : SECOND_PATTERN).exec(
    value
  )
  if (!match) {
    throw new Error(
      `${precision} instant must include an explicit Z or numeric offset`
    )
  }

  const instant = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: precision === 'second' ? Number(match[6]) : 0,
    fraction: precision === 'second' ? (match[7] ?? '') : '',
    offset: match[precision === 'second' ? 8 : 6],
  }

  assertCivilDate(instant.year, instant.month, instant.day)
  if (instant.hour > 23 || instant.minute > 59 || instant.second > 59) {
    throw new Error('Invalid civil time')
  }
  parseOffsetMinutes(instant.offset)
  return instant
}

function toUtcInstant(instant: CivilDateTime): string {
  const milliseconds = Number(instant.fraction.padEnd(3, '0').slice(0, 3))
  const date = new Date(0)
  date.setUTCFullYear(instant.year, instant.month - 1, instant.day)
  date.setUTCHours(instant.hour, instant.minute, instant.second, milliseconds)
  const utcMilliseconds =
    date.getTime() - parseOffsetMinutes(instant.offset) * 60_000
  return new Date(utcMilliseconds).toISOString()
}

export function normalizeOfficialEventTemporalValueV1(
  input: OfficialEventTemporalInputV1
): OfficialEventTemporalValueV1 {
  if (input.precision === 'unknown') {
    if (input.raw !== null && typeof input.raw !== 'string') {
      throw new Error('unknown temporal raw value must be a string or null')
    }
    return { precision: 'unknown', raw: input.raw }
  }
  if (typeof input.value !== 'string') {
    throw new Error('Temporal value must be a string')
  }
  if (input.precision === 'date') {
    assertCivilDateString(input.value)
    return { precision: 'date', date: input.value, raw: input.value }
  }

  const parsed = parseInstant(input.value, input.precision)
  return {
    precision: input.precision,
    instantUtc: toUtcInstant(parsed),
    raw: input.value,
    sourceOffset: parsed.offset,
  }
}

export function assertStrictUtcTimestamp(value: string, field: string): bigint {
  const parsed = parseInstant(value, 'second')
  if (parsed.offset !== 'Z')
    throw new Error(`${field} must use the UTC Z suffix`)
  const milliseconds = new Date(toUtcInstant(parsed)).getTime()
  const fractionNanoseconds = BigInt(parsed.fraction.padEnd(9, '0') || '0')
  return (
    BigInt(Math.floor(milliseconds / 1000)) * 1_000_000_000n +
    fractionNanoseconds
  )
}
