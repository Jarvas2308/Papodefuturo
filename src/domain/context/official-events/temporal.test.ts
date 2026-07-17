import { describe, expect, it } from 'vitest'
import { normalizeOfficialEventTemporalValueV1 } from './temporal'

describe('official event temporal normalization', () => {
  it('keeps a valid civil date as a date', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'date',
        value: '2026-07-15',
      })
    ).toEqual({ precision: 'date', date: '2026-07-15', raw: '2026-07-15' })
  })

  it('accepts February 29 in a leap year', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'date',
        value: '2024-02-29',
      })
    ).toMatchObject({ date: '2024-02-29' })
  })

  it.each([
    ['1900-02-29', false],
    ['2000-02-29', true],
    ['2100-02-29', false],
  ] as const)('validates Gregorian leap-year rule for %s', (value, valid) => {
    const operation = () =>
      normalizeOfficialEventTemporalValueV1({ precision: 'date', value })
    if (valid) expect(operation).not.toThrow()
    else expect(operation).toThrow(/civil date/)
  })

  it('rejects February 29 outside a leap year', () => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({
        precision: 'date',
        value: '2025-02-29',
      })
    ).toThrow(/civil date/)
  })

  it.each(['2026-00-10', '2026-13-10'])('rejects invalid month %s', (value) => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({ precision: 'date', value })
    ).toThrow(/civil date/)
  })

  it.each(['2026-04-31', '2026-01-00'])('rejects invalid day %s', (value) => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({ precision: 'date', value })
    ).toThrow(/civil date/)
  })

  it('normalizes a minute with Z', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-07-15T14:30Z',
      })
    ).toEqual({
      precision: 'minute',
      instantUtc: '2026-07-15T14:30:00.000Z',
      raw: '2026-07-15T14:30Z',
      sourceOffset: 'Z',
    })
  })

  it('normalizes a minute with a positive offset', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-07-15T14:30+02:00',
      })
    ).toMatchObject({
      instantUtc: '2026-07-15T12:30:00.000Z',
      sourceOffset: '+02:00',
    })
  })

  it('normalizes a minute with a negative offset', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-07-15T14:30-03:00',
      })
    ).toMatchObject({
      instantUtc: '2026-07-15T17:30:00.000Z',
      sourceOffset: '-03:00',
    })
  })

  it('crosses a civil day after offset normalization', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-07-15T00:30+01:00',
      })
    ).toMatchObject({ instantUtc: '2026-07-14T23:30:00.000Z' })
  })

  it('crosses a civil year after offset normalization', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-01-01T00:30+01:00',
      })
    ).toMatchObject({ instantUtc: '2025-12-31T23:30:00.000Z' })
  })

  it('normalizes a second with Z', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'second',
        value: '2026-07-15T14:30:45Z',
      })
    ).toMatchObject({
      instantUtc: '2026-07-15T14:30:45.000Z',
      sourceOffset: 'Z',
    })
  })

  it('normalizes a second with an offset', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'second',
        value: '2026-07-15T14:30:45+01:30',
      })
    ).toMatchObject({
      instantUtc: '2026-07-15T13:00:45.000Z',
      sourceOffset: '+01:30',
    })
  })

  it('preserves fractional seconds in raw and emits canonical UTC', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'second',
        value: '2026-07-15T14:30:45.123456789Z',
      })
    ).toEqual({
      precision: 'second',
      instantUtc: '2026-07-15T14:30:45.123Z',
      raw: '2026-07-15T14:30:45.123456789Z',
      sourceOffset: 'Z',
    })
  })

  it.each([
    ['minute', '2026-07-15T14:30'],
    ['second', '2026-07-15T14:30:45'],
  ] as const)('rejects %s without timezone', (precision, value) => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({ precision, value })
    ).toThrow(/explicit Z or numeric offset/)
  })

  it.each(['+14:01', '+15:00', '-15:00', '+01:60'])(
    'rejects invalid offset %s',
    (offset) => {
      expect(() =>
        normalizeOfficialEventTemporalValueV1({
          precision: 'second',
          value: `2026-07-15T14:30:45${offset}`,
        })
      ).toThrow(/offset/)
    }
  )

  it.each([
    '2026-07-15T24:00:00Z',
    '2026-07-15T23:60:00Z',
    '2026-07-15T23:59:60Z',
  ])('rejects invalid civil time %s', (value) => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({ precision: 'second', value })
    ).toThrow(/civil time/)
  })

  it('rejects 24:00 at minute precision', () => {
    expect(() =>
      normalizeOfficialEventTemporalValueV1({
        precision: 'minute',
        value: '2026-12-31T24:00Z',
      })
    ).toThrow(/civil time/)
  })

  it('does not invent midnight for a civil date', () => {
    const result = normalizeOfficialEventTemporalValueV1({
      precision: 'date',
      value: '2026-07-15',
    })
    expect(JSON.stringify(result)).not.toContain('T00:00:00')
  })

  it('preserves unknown time without inference', () => {
    expect(
      normalizeOfficialEventTemporalValueV1({
        precision: 'unknown',
        raw: 'não informado',
      })
    ).toEqual({ precision: 'unknown', raw: 'não informado' })
  })

  it('rejects a non-scalar unknown raw value at runtime', () => {
    const input = { precision: 'unknown', raw: null } as const
    Object.assign(input, { raw: { invalid: true } })
    expect(() => normalizeOfficialEventTemporalValueV1(input)).toThrow(
      /string or null/
    )
  })

  it('is deterministic', () => {
    const input = {
      precision: 'second',
      value: '2026-07-15T14:30:45-03:00',
    } as const
    expect(normalizeOfficialEventTemporalValueV1(input)).toEqual(
      normalizeOfficialEventTemporalValueV1(input)
    )
  })
})
