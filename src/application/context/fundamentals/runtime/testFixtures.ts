import type { Asset } from '../../../../domain/models'
import type {
  BrazilianStockFundamentalSnapshotInput,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
} from '../../../../domain/fundamentals'
import type { FundamentalsRuntimeRepositoryV1 } from './types'

export const BBAS3_ID = 'asset-bbas3'
export const KNRI11_ID = 'asset-knri11'
export const VOO_ID = 'asset-voo'

export function createRuntimeAssets(): Asset[] {
  return [
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
      id: VOO_ID,
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
    },
  ]
}

export function createRuntimeStockSnapshot(): BrazilianStockFundamentalSnapshotInput {
  return {
    assetId: BBAS3_ID,
    kind: 'brazilian-stock',
    referenceDate: '2025-12-31',
    period: 'annual',
    source: 'cvm-dfp',
    sourceDocumentId: 'cvm-dfp-bbas3-2025',
    facts: {
      totalRevenue: null,
      netIncome: { amountInMinorUnits: 200_000, currency: 'BRL' },
      totalAssets: { amountInMinorUnits: 21_000_000, currency: 'BRL' },
      totalEquity: { amountInMinorUnits: 5_000_000, currency: 'BRL' },
      operatingCashFlow: { amountInMinorUnits: 150_000, currency: 'BRL' },
      issuedShares: { unscaledValue: 5_730_834_040, scale: 0 },
    },
  }
}

export function createRuntimeFiiSnapshot(): RealEstateFundFundamentalSnapshotInput {
  return {
    assetId: KNRI11_ID,
    kind: 'real-estate-fund',
    referenceDate: '2026-06-30',
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: 'cvm-fii-knri11-2026-06',
    facts: {
      netAssetValue: { amountInMinorUnits: 1_500_000_000, currency: 'BRL' },
      issuedShares: { unscaledValue: 10_000_000, scale: 0 },
      shareholderCount: 250_000,
      vacancyInBasisPoints: null,
    },
  }
}

export function createRuntimeEtfSnapshot(): InternationalEtfFundamentalSnapshotInput {
  return {
    assetId: VOO_ID,
    kind: 'international-etf',
    referenceDate: '2026-06-30',
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId: 'sec-nport-voo-2026-06',
    facts: {
      totalAssets: { amountInMinorUnits: 50_000_000_000, currency: 'USD' },
      totalLiabilities: { amountInMinorUnits: 1_000_000_000, currency: 'USD' },
      netAssets: { amountInMinorUnits: 49_000_000_000, currency: 'USD' },
    },
  }
}

export function createRuntimeClock(
  values: readonly string[] = [
    '2026-07-28T12:00:00.000000000Z',
    '2026-07-28T12:00:00.000000000Z',
    '2026-07-28T12:00:00.000000000Z',
  ]
) {
  let index = 0
  return {
    calls: () => index,
    now() {
      const value = values[index]
      index += 1
      if (value === undefined) throw new Error('Test clock exhausted')
      return value
    },
  }
}

export function createRuntimeRepositoryDouble(
  input: {
    assets?: readonly Asset[]
    stocks?: readonly BrazilianStockFundamentalSnapshotInput[]
    realEstateFunds?: readonly RealEstateFundFundamentalSnapshotInput[]
    internationalEtfs?: readonly InternationalEtfFundamentalSnapshotInput[]
    error?: unknown
  } = {}
): { repository: FundamentalsRuntimeRepositoryV1; calls: string[] } {
  const calls: string[] = []
  const repository: FundamentalsRuntimeRepositoryV1 = {
    async listAssets() {
      calls.push('listAssets')
      if (input.error !== undefined) throw input.error
      return input.assets ?? createRuntimeAssets()
    },
    async listBrazilianStockSnapshots() {
      calls.push('listBrazilianStockSnapshots')
      if (input.error !== undefined) throw input.error
      return input.stocks ?? [createRuntimeStockSnapshot()]
    },
    async listRealEstateFundSnapshots() {
      calls.push('listRealEstateFundSnapshots')
      if (input.error !== undefined) throw input.error
      return input.realEstateFunds ?? [createRuntimeFiiSnapshot()]
    },
    async listInternationalEtfSnapshots() {
      calls.push('listInternationalEtfSnapshots')
      if (input.error !== undefined) throw input.error
      return input.internationalEtfs ?? [createRuntimeEtfSnapshot()]
    },
  }
  return { repository, calls }
}
