import { describe, expect, it } from 'vitest'
import type { Asset } from '../models'
import { buildFundamentalFactsV1 } from './buildFundamentalFactsV1'
import type {
  BrazilianStockFundamentalSnapshotInput,
  BuildFundamentalFactsV1Input,
  FundamentalFactsV1,
  FundamentalSnapshotInput,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
  SignedMonetaryFact,
} from './types'

const BBAS3_ID = 'asset-bbas3'
const KNRI11_ID = 'asset-knri11'
const VOO_ID = 'asset-voo'
const INACTIVE_ID = 'asset-inactive'
const CASH_ID = 'asset-cash'
const FIXED_INCOME_ID = 'asset-fixed-income'

function createAssets(): Asset[] {
  return [
    {
      id: VOO_ID,
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
    },
    {
      id: BBAS3_ID,
      ticker: 'BBAS3',
      name: 'Banco do Brasil',
      category: 'brazilian-stock',
      market: 'BR',
      status: 'active',
    },
    {
      id: KNRI11_ID,
      ticker: 'KNRI11',
      name: 'Kinea Renda Imobiliária',
      category: 'real-estate-fund',
      market: 'BR',
      status: 'active',
    },
    {
      id: INACTIVE_ID,
      ticker: 'INACTIVE',
      name: 'Ativo inativo',
      category: 'brazilian-stock',
      market: 'BR',
      status: 'inactive',
    },
    {
      id: CASH_ID,
      ticker: 'CASH',
      name: 'Caixa',
      category: 'cash',
      market: 'INTERNAL',
      status: 'active',
    },
    {
      id: FIXED_INCOME_ID,
      ticker: 'FIXED',
      name: 'Renda fixa',
      category: 'fixed-income',
      market: 'INTERNAL',
      status: 'active',
    },
  ]
}

function brl(amountInMinorUnits: number): SignedMonetaryFact {
  return { amountInMinorUnits, currency: 'BRL' }
}

function usd(amountInMinorUnits: number): SignedMonetaryFact {
  return { amountInMinorUnits, currency: 'USD' }
}

function createAnnualStockSnapshot(): BrazilianStockFundamentalSnapshotInput {
  return {
    assetId: BBAS3_ID,
    kind: 'brazilian-stock',
    referenceDate: '2025-12-31',
    period: 'annual',
    source: 'cvm-dfp',
    sourceDocumentId: 'cvm-dfp-bbas3-2025',
    facts: {
      totalRevenue: brl(10_000_000),
      netIncome: brl(-500_000),
      totalAssets: brl(20_000_000),
      totalEquity: brl(-100_000),
      operatingCashFlow: brl(-250_000),
    },
  }
}

function createQuarterlyStockSnapshot(): BrazilianStockFundamentalSnapshotInput {
  return {
    assetId: BBAS3_ID,
    kind: 'brazilian-stock',
    referenceDate: '2026-03-31',
    period: 'quarterly',
    source: 'cvm-itr',
    sourceDocumentId: 'cvm-itr-bbas3-2026-q1',
    facts: {
      totalRevenue: brl(3_000_000),
      netIncome: brl(200_000),
      totalAssets: brl(21_000_000),
      totalEquity: brl(5_000_000),
      operatingCashFlow: brl(150_000),
    },
  }
}

function createFiiSnapshot(): RealEstateFundFundamentalSnapshotInput {
  return {
    assetId: KNRI11_ID,
    kind: 'real-estate-fund',
    referenceDate: '2026-06-30',
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: 'cvm-fii-knri11-2026-06',
    facts: {
      netAssetValue: brl(1_500_000_000),
      issuedShares: 10_000_000,
      shareholderCount: 250_000,
    },
  }
}

function createEtfSnapshot(): InternationalEtfFundamentalSnapshotInput {
  return {
    assetId: VOO_ID,
    kind: 'international-etf',
    referenceDate: '2026-06-30',
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId: 'sec-nport-voo-2026-06',
    facts: {
      totalAssets: usd(50_000_000_000),
      totalLiabilities: usd(1_000_000_000),
      netAssets: usd(49_000_000_000),
    },
  }
}

function createInput(): BuildFundamentalFactsV1Input {
  return {
    generatedAt: '2026-07-14T12:00:00.000Z',
    assets: createAssets(),
    snapshots: [
      createAnnualStockSnapshot(),
      createEtfSnapshot(),
      createFiiSnapshot(),
      createQuarterlyStockSnapshot(),
    ],
  }
}

function getOutputAsset(output: FundamentalFactsV1, assetId: string) {
  const asset = output.assets.find((candidate) => candidate.assetId === assetId)
  if (!asset) {
    throw new Error(`Missing output asset fixture: ${assetId}`)
  }
  return asset
}

function containsKey(value: unknown, key: string): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    return true
  }
  return Object.values(value).some((nested) => containsKey(nested, key))
}

describe('buildFundamentalFactsV1', () => {
  it('creates a complete FundamentalFactsV1', () => {
    expect(buildFundamentalFactsV1(createInput())).toEqual(
      expect.objectContaining({
        generatedAt: '2026-07-14T12:00:00.000Z',
        assets: expect.any(Array),
        dataCoverage: expect.any(Object),
        limitations: expect.any(Array),
      })
    )
  })

  it('uses the exact fundamental-facts.v1 schemaVersion', () => {
    expect(buildFundamentalFactsV1(createInput()).schemaVersion).toBe(
      'fundamental-facts.v1'
    )
  })

  it('produces deeply equal output for the same input', () => {
    const input = createInput()
    expect(buildFundamentalFactsV1(input)).toEqual(
      buildFundamentalFactsV1(input)
    )
  })

  it('does not mutate inputs', () => {
    const input = createInput()
    const before = structuredClone(input)

    buildFundamentalFactsV1(input)

    expect(input).toEqual(before)
  })

  it('does not share mutable monetary facts with input', () => {
    const input = createInput()
    const output = buildFundamentalFactsV1(input)
    const stockInput = input.snapshots[0]
    const stockOutput = getOutputAsset(output, BBAS3_ID).snapshots.find(
      (snapshot) => snapshot.source === 'cvm-dfp'
    )

    if (
      stockInput?.kind !== 'brazilian-stock' ||
      stockInput.facts.netIncome === null ||
      stockOutput?.kind !== 'brazilian-stock'
    ) {
      throw new Error('Invalid stock fixture')
    }
    stockInput.facts.netIncome.amountInMinorUnits = 999

    expect(stockOutput.facts.netIncome?.amountInMinorUnits).toBe(-500_000)
  })

  it.each(['invalid', '2026-07-14', '2026-02-30T12:00:00Z'])(
    'rejects invalid generatedAt %s',
    (generatedAt) => {
      const input = createInput()
      input.generatedAt = generatedAt
      expect(() => buildFundamentalFactsV1(input)).toThrow(RangeError)
    }
  )

  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2026-07'])(
    'rejects invalid referenceDate %s',
    (referenceDate) => {
      const input = createInput()
      input.snapshots[0]!.referenceDate = referenceDate
      expect(() => buildFundamentalFactsV1(input)).toThrow(RangeError)
    }
  )

  it('rejects an empty asset id', () => {
    const input = createInput()
    input.assets[0]!.id = '  '
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Asset id/)
  })

  it('rejects duplicate asset ids', () => {
    const input = createInput()
    input.assets[1]!.id = input.assets[0]!.id
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Duplicate asset/)
  })

  it('rejects a snapshot for an unknown asset', () => {
    const input = createInput()
    input.snapshots[0]!.assetId = 'asset-unknown'
    expect(() => buildFundamentalFactsV1(input)).toThrow(/unknown asset/)
  })

  it('rejects a snapshot for an inactive asset', () => {
    const input = createInput()
    input.snapshots = [{ ...createAnnualStockSnapshot(), assetId: INACTIVE_ID }]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/must be active/)
  })

  it('rejects a snapshot for cash', () => {
    const input = createInput()
    input.snapshots = [
      {
        ...createAnnualStockSnapshot(),
        assetId: CASH_ID,
        kind: 'brazilian-stock',
      },
    ]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/not monitored/)
  })

  it('rejects a snapshot for fixed income', () => {
    const input = createInput()
    input.snapshots = [
      {
        ...createAnnualStockSnapshot(),
        assetId: FIXED_INCOME_ID,
        kind: 'brazilian-stock',
      },
    ]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/not monitored/)
  })

  it('rejects a Brazilian stock kind mismatch', () => {
    const input = createInput()
    input.snapshots = [{ ...createEtfSnapshot(), assetId: BBAS3_ID }]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/kind does not match/)
  })

  it('rejects a real estate fund kind mismatch', () => {
    const input = createInput()
    input.snapshots = [{ ...createAnnualStockSnapshot(), assetId: KNRI11_ID }]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/kind does not match/)
  })

  it('rejects an international ETF kind mismatch', () => {
    const input = createInput()
    input.snapshots = [{ ...createFiiSnapshot(), assetId: VOO_ID }]
    expect(() => buildFundamentalFactsV1(input)).toThrow(/kind does not match/)
  })

  it('rejects an empty sourceDocumentId', () => {
    const input = createInput()
    input.snapshots[0]!.sourceDocumentId = '  '
    expect(() => buildFundamentalFactsV1(input)).toThrow(/sourceDocumentId/)
  })

  it('rejects an exact duplicate snapshot', () => {
    const input = createInput()
    input.snapshots = [createAnnualStockSnapshot(), createAnnualStockSnapshot()]
    expect(() => buildFundamentalFactsV1(input)).toThrow(
      /Duplicate fundamental/
    )
  })

  it('accepts positive revenue', () => {
    const snapshot = getOutputAsset(
      buildFundamentalFactsV1(createInput()),
      BBAS3_ID
    ).snapshots.find((item) => item.source === 'cvm-dfp')
    expect(
      snapshot?.kind === 'brazilian-stock'
        ? snapshot.facts.totalRevenue?.amountInMinorUnits
        : null
    ).toBe(10_000_000)
  })

  it('accepts negative net income', () => {
    const snapshot = getOutputAsset(
      buildFundamentalFactsV1(createInput()),
      BBAS3_ID
    ).snapshots.find((item) => item.source === 'cvm-dfp')
    expect(
      snapshot?.kind === 'brazilian-stock'
        ? snapshot.facts.netIncome?.amountInMinorUnits
        : null
    ).toBe(-500_000)
  })

  it('accepts negative total equity', () => {
    const snapshot = createAnnualStockSnapshot()
    expect(snapshot.facts.totalEquity?.amountInMinorUnits).toBe(-100_000)
    expect(
      buildFundamentalFactsV1({
        ...createInput(),
        snapshots: [snapshot],
      }).assets.find((asset) => asset.assetId === BBAS3_ID)?.snapshots[0]
    ).toBeDefined()
  })

  it('accepts negative operating cash flow', () => {
    const snapshot = createAnnualStockSnapshot()
    expect(snapshot.facts.operatingCashFlow?.amountInMinorUnits).toBe(-250_000)
    expect(() =>
      buildFundamentalFactsV1({ ...createInput(), snapshots: [snapshot] })
    ).not.toThrow()
  })

  it('rejects an unsafe signed monetary value', () => {
    const input = createInput()
    const snapshot = input.snapshots[0]
    if (snapshot?.kind !== 'brazilian-stock') throw new Error('Invalid fixture')
    snapshot.facts.netIncome = brl(Number.MAX_SAFE_INTEGER + 1)
    expect(() => buildFundamentalFactsV1(input)).toThrow(/signed safe/)
  })

  it('rejects USD in a Brazilian stock fact', () => {
    const input = createInput()
    const snapshot = input.snapshots[0]
    if (snapshot?.kind !== 'brazilian-stock') throw new Error('Invalid fixture')
    snapshot.facts.totalRevenue = usd(100)
    expect(() => buildFundamentalFactsV1(input)).toThrow(/must use BRL/)
  })

  it('rejects USD in a real estate fund fact', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'real-estate-fund'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.netAssetValue = usd(100)
    expect(() => buildFundamentalFactsV1(input)).toThrow(/must use BRL/)
  })

  it('rejects BRL in an international ETF fact', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'international-etf'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.totalAssets = brl(100)
    expect(() => buildFundamentalFactsV1(input)).toThrow(/must use USD/)
  })

  it('rejects negative issuedShares', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'real-estate-fund'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.issuedShares = -1
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Issued shares/)
  })

  it('rejects fractional issuedShares', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'real-estate-fund'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.issuedShares = 1.5
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Issued shares/)
  })

  it('rejects negative shareholderCount', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'real-estate-fund'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.shareholderCount = -1
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Shareholder count/)
  })

  it('rejects fractional shareholderCount', () => {
    const input = createInput()
    const snapshot = input.snapshots.find(
      (item) => item.kind === 'real-estate-fund'
    )
    if (!snapshot) throw new Error('Invalid fixture')
    snapshot.facts.shareholderCount = 1.5
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Shareholder count/)
  })

  it('preserves null facts', () => {
    const input = createInput()
    const snapshot = input.snapshots[0]
    if (snapshot?.kind !== 'brazilian-stock') throw new Error('Invalid fixture')
    snapshot.facts.netIncome = null
    const output = buildFundamentalFactsV1(input)
    const outputSnapshot = getOutputAsset(output, BBAS3_ID).snapshots.find(
      (item) => item.source === 'cvm-dfp'
    )
    expect(
      outputSnapshot?.kind === 'brazilian-stock'
        ? outputSnapshot.facts.netIncome
        : undefined
    ).toBeNull()
  })

  it('preserves input asset order', () => {
    expect(
      buildFundamentalFactsV1(createInput()).assets.map(
        (asset) => asset.assetId
      )
    ).toEqual([VOO_ID, BBAS3_ID, KNRI11_ID])
  })

  it('sorts snapshots by referenceDate descending', () => {
    expect(
      getOutputAsset(
        buildFundamentalFactsV1(createInput()),
        BBAS3_ID
      ).snapshots.map((snapshot) => snapshot.referenceDate)
    ).toEqual(['2026-03-31', '2025-12-31'])
  })

  it('uses sourceDocumentId ascending to break a date tie', () => {
    const input = createInput()
    const first = createQuarterlyStockSnapshot()
    const second = createQuarterlyStockSnapshot()
    first.sourceDocumentId = 'document-z'
    second.sourceDocumentId = 'document-a'
    input.snapshots = [first, second]

    expect(
      getOutputAsset(buildFundamentalFactsV1(input), BBAS3_ID).snapshots.map(
        (snapshot) => snapshot.sourceDocumentId
      )
    ).toEqual(['document-a', 'document-z'])
  })

  it('counts eligible assets', () => {
    expect(
      buildFundamentalFactsV1(createInput()).dataCoverage.eligibleAssetCount
    ).toBe(3)
  })

  it('identifies eligible assets without facts in input order', () => {
    const input = createInput()
    input.snapshots = [createEtfSnapshot()]
    expect(
      buildFundamentalFactsV1(input).dataCoverage.missingFundamentalAssetIds
    ).toEqual([BBAS3_ID, KNRI11_ID])
  })

  it('counts Brazilian stock snapshots', () => {
    expect(
      buildFundamentalFactsV1(createInput()).dataCoverage
        .brazilianStockSnapshotCount
    ).toBe(2)
  })

  it('counts real estate fund snapshots', () => {
    expect(
      buildFundamentalFactsV1(createInput()).dataCoverage
        .realEstateFundSnapshotCount
    ).toBe(1)
  })

  it('counts international ETF snapshots', () => {
    expect(
      buildFundamentalFactsV1(createInput()).dataCoverage
        .internationalEtfSnapshotCount
    ).toBe(1)
  })

  it('contains every required limitation code', () => {
    expect(
      buildFundamentalFactsV1(createInput()).limitations.map(
        (limitation) => limitation.code
      )
    ).toEqual([
      'normalized-facts-only',
      'not-persisted',
      'providers-not-integrated-v1',
      'no-derived-fundamental-ratios',
      'no-fundamental-score',
      'no-technical-plan-modification',
    ])
  })

  it('preserves the contractual limitations order', () => {
    const codes = buildFundamentalFactsV1(createInput()).limitations.map(
      (limitation) => limitation.code
    )
    expect(codes[0]).toBe('normalized-facts-only')
    expect(codes.at(-1)).toBe('no-technical-plan-modification')
  })

  it('does not produce a score field', () => {
    expect(containsKey(buildFundamentalFactsV1(createInput()), 'score')).toBe(
      false
    )
  })

  it('does not produce a recommendation field', () => {
    expect(
      containsKey(buildFundamentalFactsV1(createInput()), 'recommendation')
    ).toBe(false)
  })

  it('does not produce a technicalPlan field', () => {
    expect(
      containsKey(buildFundamentalFactsV1(createInput()), 'technicalPlan')
    ).toBe(false)
  })

  it('represents negative values with the local SignedMonetaryFact type', () => {
    const fact: SignedMonetaryFact = brl(-1)
    expect(fact).toEqual({ amountInMinorUnits: -1, currency: 'BRL' })
  })

  it('supports zero coverage when there are no snapshots', () => {
    const input = createInput()
    input.snapshots = []
    expect(buildFundamentalFactsV1(input).dataCoverage).toEqual({
      eligibleAssetCount: 3,
      assetWithFactsCount: 0,
      missingFundamentalAssetIds: [VOO_ID, BBAS3_ID, KNRI11_ID],
      totalSnapshotCount: 0,
      brazilianStockSnapshotCount: 0,
      realEstateFundSnapshotCount: 0,
      internationalEtfSnapshotCount: 0,
    })
  })

  it('rejects DFP with a quarterly period', () => {
    const snapshot = createAnnualStockSnapshot()
    snapshot.period = 'quarterly'
    expect(() =>
      buildFundamentalFactsV1({ ...createInput(), snapshots: [snapshot] })
    ).toThrow(/source and period/)
  })

  it('rejects ITR with an annual period', () => {
    const snapshot = createQuarterlyStockSnapshot()
    snapshot.period = 'annual'
    expect(() =>
      buildFundamentalFactsV1({ ...createInput(), snapshots: [snapshot] })
    ).toThrow(/source and period/)
  })

  it('preserves zero monetary value as a fact', () => {
    const input = createInput()
    const snapshot = input.snapshots[0]
    if (snapshot?.kind !== 'brazilian-stock') throw new Error('Invalid fixture')
    snapshot.facts.netIncome = brl(0)
    const outputSnapshot = getOutputAsset(
      buildFundamentalFactsV1(input),
      BBAS3_ID
    ).snapshots.find((item) => item.source === 'cvm-dfp')
    expect(
      outputSnapshot?.kind === 'brazilian-stock'
        ? outputSnapshot.facts.netIncome
        : null
    ).toEqual(brl(0))
  })

  it('does not convert null to a zero fact', () => {
    const snapshot = createAnnualStockSnapshot()
    snapshot.facts.netIncome = null
    const output = buildFundamentalFactsV1({
      ...createInput(),
      snapshots: [snapshot],
    })
    const outputSnapshot = getOutputAsset(output, BBAS3_ID).snapshots[0]
    expect(
      outputSnapshot?.kind === 'brazilian-stock'
        ? outputSnapshot.facts.netIncome
        : undefined
    ).toBeNull()
  })

  it('rejects a timestamp in referenceDate', () => {
    const input = createInput()
    input.snapshots[0]!.referenceDate = '2026-07-14T00:00:00Z'
    expect(() => buildFundamentalFactsV1(input)).toThrow(RangeError)
  })

  it('preserves sourceDocumentId exactly', () => {
    const input = createInput()
    input.snapshots[0]!.sourceDocumentId = '  document-with-spaces  '
    const snapshot = getOutputAsset(
      buildFundamentalFactsV1(input),
      BBAS3_ID
    ).snapshots.find((item) => item.source === 'cvm-dfp')
    expect(snapshot?.sourceDocumentId).toBe('  document-with-spaces  ')
  })

  it('does not share a snapshots array with input', () => {
    const input = createInput()
    const output = buildFundamentalFactsV1(input)
    expect(getOutputAsset(output, BBAS3_ID).snapshots).not.toBe(input.snapshots)
  })

  it('does not share a facts object with input', () => {
    const input = createInput()
    const output = buildFundamentalFactsV1(input)
    const outputSnapshot = getOutputAsset(output, BBAS3_ID).snapshots.find(
      (snapshot) => snapshot.source === 'cvm-dfp'
    )
    expect(outputSnapshot?.facts).not.toBe(input.snapshots[0]?.facts)
  })

  it('does not share any SignedMonetaryFact with input', () => {
    const input = createInput()
    const output = buildFundamentalFactsV1(input)
    const inputSnapshot = input.snapshots[0]
    const outputSnapshot = getOutputAsset(output, BBAS3_ID).snapshots.find(
      (snapshot) => snapshot.source === 'cvm-dfp'
    )
    if (
      inputSnapshot?.kind !== 'brazilian-stock' ||
      outputSnapshot?.kind !== 'brazilian-stock'
    ) {
      throw new Error('Invalid fixture')
    }
    expect(outputSnapshot.facts.totalRevenue).not.toBe(
      inputSnapshot.facts.totalRevenue
    )
  })

  it('accepts a valid leap-day referenceDate', () => {
    const snapshot = createQuarterlyStockSnapshot()
    snapshot.referenceDate = '2024-02-29'
    expect(() =>
      buildFundamentalFactsV1({ ...createInput(), snapshots: [snapshot] })
    ).not.toThrow()
  })

  it('rejects a non-leap-year February 29 referenceDate', () => {
    const snapshot = createQuarterlyStockSnapshot()
    snapshot.referenceDate = '2025-02-29'
    expect(() =>
      buildFundamentalFactsV1({ ...createInput(), snapshots: [snapshot] })
    ).toThrow(RangeError)
  })

  it('accepts generatedAt with an explicit timezone offset', () => {
    const input = createInput()
    input.generatedAt = '2026-07-14T09:00:00-03:00'
    expect(buildFundamentalFactsV1(input).generatedAt).toBe(
      '2026-07-14T09:00:00-03:00'
    )
  })

  it('excludes inactive, cash and fixed-income assets from output', () => {
    expect(
      buildFundamentalFactsV1(createInput()).assets.map(
        (asset) => asset.assetId
      )
    ).not.toEqual(
      expect.arrayContaining([INACTIVE_ID, CASH_ID, FIXED_INCOME_ID])
    )
  })

  it('counts total snapshots and assets with facts', () => {
    expect(buildFundamentalFactsV1(createInput()).dataCoverage).toEqual(
      expect.objectContaining({
        totalSnapshotCount: 4,
        assetWithFactsCount: 3,
      })
    )
  })

  it('rejects an empty snapshot assetId', () => {
    const input = createInput()
    input.snapshots[0]!.assetId = ' '
    expect(() => buildFundamentalFactsV1(input)).toThrow(/Snapshot assetId/)
  })

  it('preserves input snapshots instead of sorting them in place', () => {
    const input = createInput()
    const beforeOrder = input.snapshots.map(
      (snapshot) => snapshot.sourceDocumentId
    )
    buildFundamentalFactsV1(input)
    expect(
      input.snapshots.map((snapshot) => snapshot.sourceDocumentId)
    ).toEqual(beforeOrder)
  })

  it('rejects an unsupported runtime source for a Brazilian stock', () => {
    const snapshot = createAnnualStockSnapshot() as unknown as {
      source: string
    }
    snapshot.source = 'generic-source'
    expect(() =>
      buildFundamentalFactsV1({
        ...createInput(),
        snapshots: [snapshot as unknown as FundamentalSnapshotInput],
      })
    ).toThrow(/source and period/)
  })
})
