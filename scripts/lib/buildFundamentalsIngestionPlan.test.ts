import { describe, expect, it } from 'vitest'
import { buildFundamentalsIngestionPlanV1 } from './buildFundamentalsIngestionPlan'

describe('buildFundamentalsIngestionPlanV1', () => {
  it('builds a cvm-stocks plan with source and year', () => {
    const plan = buildFundamentalsIngestionPlanV1([
      '--provider=cvm-stocks',
      '--source=DFP',
      '--year=2026',
    ])
    expect(plan).toEqual({ provider: 'cvm-stocks', source: 'DFP', year: 2026 })
  })

  it('accepts ITR as a cvm-stocks source', () => {
    const plan = buildFundamentalsIngestionPlanV1([
      '--provider=cvm-stocks',
      '--source=ITR',
      '--year=2025',
    ])
    expect(plan).toEqual({ provider: 'cvm-stocks', source: 'ITR', year: 2025 })
  })

  it('builds a cvm-fii plan with only a year', () => {
    const plan = buildFundamentalsIngestionPlanV1([
      '--provider=cvm-fii',
      '--year=2026',
    ])
    expect(plan).toEqual({ provider: 'cvm-fii', year: 2026 })
  })

  it('builds a sec-nport plan with no extra flags', () => {
    const plan = buildFundamentalsIngestionPlanV1(['--provider=sec-nport'])
    expect(plan).toEqual({ provider: 'sec-nport' })
  })

  it('ignores unrelated flags such as --confirm', () => {
    const plan = buildFundamentalsIngestionPlanV1([
      '--provider=sec-nport',
      '--confirm',
    ])
    expect(plan).toEqual({ provider: 'sec-nport' })
  })

  it('rejects a missing --provider', () => {
    expect(() => buildFundamentalsIngestionPlanV1(['--year=2026'])).toThrow(
      'Missing required flag: --provider'
    )
  })

  it('rejects an unsupported provider', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1(['--provider=cvm-ipe'])
    ).toThrow('Unsupported --provider')
  })

  it('rejects cvm-stocks without --source', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1(['--provider=cvm-stocks', '--year=2026'])
    ).toThrow('Missing required flag: --source')
  })

  it('rejects an unsupported cvm-stocks source', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1([
        '--provider=cvm-stocks',
        '--source=BPA',
        '--year=2026',
      ])
    ).toThrow('Unsupported --source')
  })

  it('rejects cvm-stocks without --year', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1([
        '--provider=cvm-stocks',
        '--source=DFP',
      ])
    ).toThrow('Missing required flag: --year')
  })

  it('rejects a non-integer --year', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1([
        '--provider=cvm-fii',
        '--year=not-a-year',
      ])
    ).toThrow('--year must be an integer')
  })

  it('rejects cvm-fii without --year', () => {
    expect(() =>
      buildFundamentalsIngestionPlanV1(['--provider=cvm-fii'])
    ).toThrow('Missing required flag: --year')
  })
})
