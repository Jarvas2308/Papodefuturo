import { describe, expect, it } from 'vitest'
import type {
  BrazilianStockFundamentalSnapshotInput,
  FundamentalFactsAsset,
  FundamentalFactsV1,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
  SignedMonetaryFact,
} from '../types'
import { buildFundamentalDerivedFactsV1 } from './buildFundamentalDerivedFactsV1'
import {
  FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION,
  FUNDAMENTAL_RATIO_SCALE,
  type BrazilianStockDerivedSnapshotV1,
  type FundamentalDerivedFactsV1,
  type InternationalEtfDerivedSnapshotV1,
  type RealEstateFundDerivedSnapshotV1,
} from './types'

const STOCK_ID = 'asset-bbas3'
const FII_ID = 'asset-knri11'
const ETF_ID = 'asset-voo'
const FICTITIOUS_FII_NET_ASSET_VALUE_IN_MINOR_UNITS = 1_000_000_000_000

function brl(amountInMinorUnits: number): SignedMonetaryFact {
  return { amountInMinorUnits, currency: 'BRL' }
}

function usd(amountInMinorUnits: number): SignedMonetaryFact {
  return { amountInMinorUnits, currency: 'USD' }
}

function createStockSnapshot(
  overrides: Partial<BrazilianStockFundamentalSnapshotInput> = {}
): BrazilianStockFundamentalSnapshotInput {
  return {
    assetId: STOCK_ID,
    kind: 'brazilian-stock',
    referenceDate: '2026-03-31',
    period: 'quarterly',
    source: 'cvm-itr',
    sourceDocumentId: 'cvm-itr-bbas3-2026-q1',
    facts: {
      totalRevenue: brl(90_000),
      netIncome: brl(12_000),
      totalAssets: brl(100_000),
      totalEquity: brl(25_000),
      operatingCashFlow: brl(15_000),
    },
    ...overrides,
  }
}

function createFiiSnapshot(
  overrides: Partial<RealEstateFundFundamentalSnapshotInput> = {}
): RealEstateFundFundamentalSnapshotInput {
  return {
    assetId: FII_ID,
    kind: 'real-estate-fund',
    referenceDate: '2026-05-31',
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: 'cvm-fii-knri11-2026-05',
    facts: {
      netAssetValue: brl(10_000),
      issuedShares: { unscaledValue: 4, scale: 0 },
      shareholderCount: 321_000,
    },
    ...overrides,
  }
}

function createEtfSnapshot(
  overrides: Partial<InternationalEtfFundamentalSnapshotInput> = {}
): InternationalEtfFundamentalSnapshotInput {
  return {
    assetId: ETF_ID,
    kind: 'international-etf',
    referenceDate: '2026-04-30',
    period: 'monthly',
    source: 'sec-nport',
    sourceDocumentId: 'sec-nport-voo-2026-04',
    facts: {
      totalAssets: usd(100_000),
      totalLiabilities: usd(10_000),
      netAssets: usd(90_000),
    },
    ...overrides,
  }
}

function createAsset(
  category: FundamentalFactsAsset['category'],
  snapshot:
    | BrazilianStockFundamentalSnapshotInput
    | RealEstateFundFundamentalSnapshotInput
    | InternationalEtfFundamentalSnapshotInput
): FundamentalFactsAsset {
  const metadata = {
    'brazilian-stock': { ticker: 'BBAS3', name: 'Banco do Brasil' },
    'real-estate-fund': { ticker: 'KNRI11', name: 'Kinea Renda Imobiliária' },
    'international-etf': { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  }[category]

  return {
    assetId: snapshot.assetId,
    ticker: metadata.ticker,
    name: metadata.name,
    category,
    snapshots: [snapshot],
  }
}

function createInput(): FundamentalFactsV1 {
  return {
    schemaVersion: 'fundamental-facts.v1',
    generatedAt: '2026-07-16T12:00:00.123456Z',
    assets: [
      createAsset('international-etf', createEtfSnapshot()),
      createAsset('brazilian-stock', createStockSnapshot()),
      createAsset('real-estate-fund', createFiiSnapshot()),
    ],
    dataCoverage: {
      eligibleAssetCount: 3,
      assetWithFactsCount: 3,
      missingFundamentalAssetIds: [],
      totalSnapshotCount: 3,
      brazilianStockSnapshotCount: 1,
      realEstateFundSnapshotCount: 1,
      internationalEtfSnapshotCount: 1,
    },
    limitations: [],
  }
}

function createSingleAssetInput(
  asset: FundamentalFactsAsset
): FundamentalFactsV1 {
  const input = createInput()
  return {
    ...input,
    assets: [asset],
    dataCoverage: {
      ...input.dataCoverage,
      eligibleAssetCount: 1,
      assetWithFactsCount: asset.snapshots.length > 0 ? 1 : 0,
      totalSnapshotCount: asset.snapshots.length,
    },
  }
}

function getStockSnapshot(
  output: FundamentalDerivedFactsV1
): BrazilianStockDerivedSnapshotV1 {
  const snapshot = output.assets[0]?.snapshots[0]
  if (!snapshot || snapshot.kind !== 'brazilian-stock') {
    throw new Error('Expected a Brazilian stock derived snapshot')
  }
  return snapshot
}

function getFiiSnapshot(
  output: FundamentalDerivedFactsV1
): RealEstateFundDerivedSnapshotV1 {
  const snapshot = output.assets[0]?.snapshots[0]
  if (!snapshot || snapshot.kind !== 'real-estate-fund') {
    throw new Error('Expected a real estate fund derived snapshot')
  }
  return snapshot
}

function getEtfSnapshot(
  output: FundamentalDerivedFactsV1
): InternationalEtfDerivedSnapshotV1 {
  const snapshot = output.assets[0]?.snapshots[0]
  if (!snapshot || snapshot.kind !== 'international-etf') {
    throw new Error('Expected an international ETF derived snapshot')
  }
  return snapshot
}

function buildStock(
  snapshot = createStockSnapshot()
): BrazilianStockDerivedSnapshotV1 {
  return getStockSnapshot(
    buildFundamentalDerivedFactsV1(
      createSingleAssetInput(createAsset('brazilian-stock', snapshot))
    )
  )
}

function buildFii(
  snapshot = createFiiSnapshot()
): RealEstateFundDerivedSnapshotV1 {
  return getFiiSnapshot(
    buildFundamentalDerivedFactsV1(
      createSingleAssetInput(createAsset('real-estate-fund', snapshot))
    )
  )
}

function buildEtf(
  snapshot = createEtfSnapshot()
): InternationalEtfDerivedSnapshotV1 {
  return getEtfSnapshot(
    buildFundamentalDerivedFactsV1(
      createSingleAssetInput(createAsset('international-etf', snapshot))
    )
  )
}

describe('buildFundamentalDerivedFactsV1', () => {
  describe('contrato geral', () => {
    it('cria o contrato completo com schema version estável', () => {
      const output = buildFundamentalDerivedFactsV1(createInput())

      expect(output.schemaVersion).toBe(
        FUNDAMENTAL_DERIVED_FACTS_V1_SCHEMA_VERSION
      )
      expect(output.assets).toHaveLength(3)
      expect(output.dataCoverage.totalDerivedSnapshotCount).toBe(3)
    })

    it('produz saída profundamente igual para o mesmo input', () => {
      const input = createInput()

      expect(buildFundamentalDerivedFactsV1(input)).toEqual(
        buildFundamentalDerivedFactsV1(input)
      )
    })

    it('não muta o input', () => {
      const input = createInput()
      const before = structuredClone(input)

      buildFundamentalDerivedFactsV1(input)

      expect(input).toEqual(before)
    })

    it('mantém a saída isolada de mutações profundas posteriores no input', () => {
      const input = createSingleAssetInput(
        createAsset('real-estate-fund', createFiiSnapshot())
      )
      const output = buildFundamentalDerivedFactsV1(input)
      const before = structuredClone(output)
      const sourceAsset = input.assets[0]!
      const sourceSnapshot = sourceAsset.snapshots[0]!
      if (sourceSnapshot.kind !== 'real-estate-fund') {
        throw new Error('Expected a real estate fund source snapshot')
      }

      sourceAsset.name = 'Nome alterado'
      sourceSnapshot.referenceDate = '2020-01-01'
      sourceSnapshot.facts.netAssetValue!.amountInMinorUnits = 1
      sourceSnapshot.facts.issuedShares!.unscaledValue = 1
      input.limitations.push({
        code: 'not-persisted',
        description: 'Limitação adicionada depois do builder',
      })

      expect(output).toEqual(before)
    })

    it('mantém o input isolado de mutações profundas posteriores na saída', () => {
      const input = createSingleAssetInput(
        createAsset('real-estate-fund', createFiiSnapshot())
      )
      const before = structuredClone(input)
      const output = buildFundamentalDerivedFactsV1(input)
      const outputSnapshot = getFiiSnapshot(output)
      const metric = outputSnapshot.metrics.netAssetValuePerIssuedShare

      output.assets[0]!.name = 'Nome derivado alterado'
      outputSnapshot.referenceDate = '2020-01-01'
      metric.inputs.netAssetValue!.amountInMinorUnits = 1
      metric.inputs.issuedShares!.unscaledValue = 1
      output.limitations[0]!.description = 'Limitação derivada alterada'

      expect(input).toEqual(before)
      expect(
        buildFundamentalDerivedFactsV1(input).limitations[0]!.description
      ).not.toBe('Limitação derivada alterada')
    })

    it('preserva generatedAt exatamente', () => {
      const input = createInput()

      expect(buildFundamentalDerivedFactsV1(input).generatedAt).toBe(
        input.generatedAt
      )
    })

    it('rejeita generatedAt inválido', () => {
      const input = createInput()
      input.generatedAt = '2026-02-30T12:00:00Z'

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'generatedAt must be a valid ISO date-time'
      )
    })

    it('rejeita schema factual incompatível', () => {
      const input = createInput()
      Reflect.set(input, 'schemaVersion', 'fundamental-facts.v2')

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'Unsupported fundamental facts schema version'
      )
    })

    it('preserva a ordem dos ativos', () => {
      const output = buildFundamentalDerivedFactsV1(createInput())

      expect(output.assets.map((asset) => asset.assetId)).toEqual([
        ETF_ID,
        STOCK_ID,
        FII_ID,
      ])
    })

    it('ordena snapshots por data decrescente e documento crescente', () => {
      const older = createStockSnapshot({
        referenceDate: '2025-12-31',
        period: 'annual',
        source: 'cvm-dfp',
        sourceDocumentId: 'z-document',
      })
      const sameDateSecond = createStockSnapshot({
        sourceDocumentId: 'b-document',
      })
      const sameDateFirst = createStockSnapshot({
        sourceDocumentId: 'a-document',
      })
      const asset = createAsset('brazilian-stock', older)
      asset.snapshots = [older, sameDateSecond, sameDateFirst]

      const output = buildFundamentalDerivedFactsV1(
        createSingleAssetInput(asset)
      )

      expect(
        output.assets[0]?.snapshots.map((snapshot) => snapshot.sourceDocumentId)
      ).toEqual(['a-document', 'b-document', 'z-document'])
    })

    it('mantém ativo elegível sem snapshots', () => {
      const asset = createAsset('brazilian-stock', createStockSnapshot())
      asset.snapshots = []

      const output = buildFundamentalDerivedFactsV1(
        createSingleAssetInput(asset)
      )

      expect(output.assets[0]?.snapshots).toEqual([])
      expect(output.dataCoverage.assetWithDerivedSnapshotsCount).toBe(0)
    })

    it('rejeita assetId duplicado', () => {
      const input = createInput()
      input.assets.push({ ...input.assets[0]!, snapshots: [] })

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        `Duplicate asset id: ${ETF_ID}`
      )
    })

    it('rejeita assetId vazio', () => {
      const input = createInput()
      input.assets[0]!.assetId = ' '

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'Asset id must be a non-empty string'
      )
    })

    it('rejeita categoria fora da fronteira fundamentalista', () => {
      const input = createInput()
      Reflect.set(input.assets[0]!, 'category', 'cash')

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'Unsupported fundamental asset category: cash'
      )
    })

    it('rejeita snapshot ligado a outro assetId', () => {
      const input = createInput()
      input.assets[0]!.snapshots[0]!.assetId = STOCK_ID

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        `Snapshot assetId does not match asset: ${ETF_ID}`
      )
    })

    it('rejeita snapshot duplicado', () => {
      const input = createInput()
      input.assets[0]!.snapshots.push(
        structuredClone(input.assets[0]!.snapshots[0]!)
      )

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        `Duplicate fundamental snapshot: ${ETF_ID}`
      )
    })

    it('rejeita referenceDate civil impossível', () => {
      const input = createInput()
      input.assets[0]!.snapshots[0]!.referenceDate = '2026-02-30'

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'referenceDate must be a valid YYYY-MM-DD date'
      )
    })

    it('rejeita sourceDocumentId vazio', () => {
      const input = createInput()
      input.assets[0]!.snapshots[0]!.sourceDocumentId = ''

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        'sourceDocumentId must be a non-empty string'
      )
    })

    it('rejeita kind divergente da categoria', () => {
      const input = createInput()
      Reflect.set(input.assets[0]!.snapshots[0]!, 'kind', 'brazilian-stock')

      expect(() => buildFundamentalDerivedFactsV1(input)).toThrow(
        `Snapshot kind does not match asset: ${ETF_ID}`
      )
    })

    it('rejeita source e period inconsistentes de ação', () => {
      const snapshot = createStockSnapshot()
      Reflect.set(snapshot, 'period', 'annual')

      expect(() => buildStock(snapshot)).toThrow(
        'Brazilian stock source and period are inconsistent'
      )
    })

    it('rejeita source e period inconsistentes de FII', () => {
      const snapshot = createFiiSnapshot()
      Reflect.set(snapshot, 'source', 'sec-nport')

      expect(() => buildFii(snapshot)).toThrow(
        'Real estate fund source and period are inconsistent'
      )
    })

    it('rejeita source e period inconsistentes de ETF', () => {
      const snapshot = createEtfSnapshot()
      Reflect.set(snapshot, 'period', 'annual')

      expect(() => buildEtf(snapshot)).toThrow(
        'International ETF source and period are inconsistent'
      )
    })

    it('rejeita fato monetário que não usa inteiro seguro', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalRevenue = brl(Number.MAX_VALUE)

      expect(() => buildStock(snapshot)).toThrow(
        'Total revenue must use signed safe minor units'
      )
    })

    it('rejeita coeficiente de cotas que não usa inteiro seguro', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.issuedShares = {
        unscaledValue: Number.MAX_VALUE,
        scale: 0,
      }

      expect(() => buildFii(snapshot)).toThrow(
        'Issued shares must use a safe integer coefficient'
      )
    })

    it('rejeita quantidade decimal não normalizada', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.issuedShares = { unscaledValue: 400, scale: 2 }

      expect(() => buildFii(snapshot)).toThrow(
        'Issued shares must use normalized decimal form'
      )
    })

    it('calcula a cobertura de snapshots e métricas', () => {
      const output = buildFundamentalDerivedFactsV1(createInput())

      expect(output.dataCoverage).toEqual({
        eligibleAssetCount: 3,
        assetWithDerivedSnapshotsCount: 3,
        totalDerivedSnapshotCount: 3,
        availableMetricCount: 5,
        unavailableMetricCount: 0,
        availableStockMetricCount: 1,
        availableRealEstateFundMetricCount: 1,
        availableInternationalEtfMetricCount: 3,
      })
    })

    it('conta ativo com snapshot mesmo quando a métrica está indisponível', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = null
      snapshot.facts.issuedShares = null
      const output = buildFundamentalDerivedFactsV1(
        createSingleAssetInput(createAsset('real-estate-fund', snapshot))
      )

      expect(output.dataCoverage).toMatchObject({
        eligibleAssetCount: 1,
        assetWithDerivedSnapshotsCount: 1,
        totalDerivedSnapshotCount: 1,
        availableMetricCount: 0,
        unavailableMetricCount: 1,
        availableRealEstateFundMetricCount: 0,
      })
    })

    it('preserva a identidade factual em relação um-para-um', () => {
      const input = createInput()
      const output = buildFundamentalDerivedFactsV1(input)

      expect(
        output.assets.flatMap((asset) =>
          asset.snapshots.map((snapshot) => ({
            assetId: snapshot.assetId,
            kind: snapshot.kind,
            referenceDate: snapshot.referenceDate,
            period: snapshot.period,
            source: snapshot.source,
            sourceDocumentId: snapshot.sourceDocumentId,
          }))
        )
      ).toEqual(
        input.assets.flatMap((asset) =>
          asset.snapshots.map((snapshot) => ({
            assetId: snapshot.assetId,
            kind: snapshot.kind,
            referenceDate: snapshot.referenceDate,
            period: snapshot.period,
            source: snapshot.source,
            sourceDocumentId: snapshot.sourceDocumentId,
          }))
        )
      )
    })

    it('declara todas as limitações na ordem fixa do contrato', () => {
      const output = buildFundamentalDerivedFactsV1(createInput())

      expect(output.limitations.map((limitation) => limitation.code)).toEqual([
        'no-market-price-derivatives',
        'no-growth-derivatives',
        'no-profitability-flow-ratios',
        'no-score',
        'no-ranking',
        'no-recommendation',
        'no-technical-plan-modification',
        'not-persisted',
        'not-integrated-runtime',
      ])
    })

    it('copia defensivamente os fatos usados nas métricas', () => {
      const input = createSingleAssetInput(
        createAsset('brazilian-stock', createStockSnapshot())
      )
      const sourceSnapshot = input.assets[0]!.snapshots[0]
      const output = buildFundamentalDerivedFactsV1(input)
      const metric = getStockSnapshot(output).metrics.equityToAssets

      if (sourceSnapshot.kind !== 'brazilian-stock') {
        throw new Error('Expected a Brazilian stock source snapshot')
      }
      expect(metric.inputs.totalEquity).not.toBe(
        sourceSnapshot.facts.totalEquity
      )
      expect(metric.inputs.totalAssets).not.toBe(
        sourceSnapshot.facts.totalAssets
      )
    })
  })

  describe('ações brasileiras', () => {
    it('calcula patrimônio líquido sobre ativos', () => {
      const metric = buildStock().metrics.equityToAssets

      expect(metric).toMatchObject({
        status: 'available',
        formulaId: 'stock-equity-to-assets.v1',
        value: {
          scaledValue: 250_000,
          scale: FUNDAMENTAL_RATIO_SCALE,
          rounding: 'half-away-from-zero',
        },
      })
    })

    it('preserva patrimônio líquido negativo', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalEquity = brl(-25_000)

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'available',
        value: { scaledValue: -250_000 },
      })
    })

    it('marca patrimônio ausente como missing-input', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalEquity = null

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
    })

    it('marca ativos ausentes como missing-input', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalAssets = null

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
    })

    it('marca denominador zero como non-positive-denominator', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalAssets = brl(0)

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'non-positive-denominator',
      })
    })

    it('marca denominador negativo como non-positive-denominator', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalAssets = brl(-1)

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'non-positive-denominator',
      })
    })

    it('marca moeda divergente como currency-mismatch', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalEquity = usd(25_000)

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'currency-mismatch',
      })
    })

    it('marca resultado fora do inteiro seguro como unsafe-arithmetic', () => {
      const snapshot = createStockSnapshot()
      snapshot.facts.totalEquity = brl(Number.MAX_SAFE_INTEGER)
      snapshot.facts.totalAssets = brl(1)

      expect(buildStock(snapshot).metrics.equityToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'unsafe-arithmetic',
      })
    })
  })

  describe('fundos imobiliários', () => {
    it('calcula valor patrimonial por cota inteira', () => {
      expect(buildFii().metrics.netAssetValuePerIssuedShare).toMatchObject({
        status: 'available',
        formulaId: 'fii-net-asset-value-per-issued-share.v1',
        value: {
          scaledAmountInMinorUnitsPerUnit: 2_500_000_000,
          currency: 'BRL',
          scale: FUNDAMENTAL_RATIO_SCALE,
        },
      })
    })

    it('preserva patrimônio negativo no valor por cota', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(-10_000)

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'available',
        value: { scaledAmountInMinorUnitsPerUnit: -2_500_000_000 },
      })
    })

    it('preserva exatamente as cotas fracionárias oficiais de VISC11', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(
        FICTITIOUS_FII_NET_ASSET_VALUE_IN_MINOR_UNITS
      )
      snapshot.facts.issuedShares = {
        unscaledValue: 288_286_400_000_073,
        scale: 7,
      }

      const metric = buildFii(snapshot).metrics.netAssetValuePerIssuedShare

      expect(metric.inputs.issuedShares).toEqual({
        unscaledValue: 288_286_400_000_073,
        scale: 7,
      })
      expect(metric).toMatchObject({
        status: 'available',
        value: { scaledAmountInMinorUnitsPerUnit: 34_687_727_205 },
      })
    })

    it('preserva exatamente as cotas fracionárias oficiais de XPLG11', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(
        FICTITIOUS_FII_NET_ASSET_VALUE_IN_MINOR_UNITS
      )
      snapshot.facts.issuedShares = {
        unscaledValue: 513_900_978_938_388,
        scale: 7,
      }

      const metric = buildFii(snapshot).metrics.netAssetValuePerIssuedShare

      expect(metric.inputs.issuedShares).toEqual({
        unscaledValue: 513_900_978_938_388,
        scale: 7,
      })
      expect(metric).toMatchObject({
        status: 'available',
        value: { scaledAmountInMinorUnitsPerUnit: 19_459_001_656 },
      })
    })

    it('marca patrimônio ausente como missing-input', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = null

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
    })

    it('marca quantidade de cotas ausente como missing-input', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.issuedShares = null

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
    })

    it('marca zero cotas como non-positive-denominator', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.issuedShares = { unscaledValue: 0, scale: 0 }

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'unavailable',
        reason: 'non-positive-denominator',
      })
    })

    it('rejeita quantidade negativa como estrutura inválida', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.issuedShares = { unscaledValue: -1, scale: 0 }

      expect(() => buildFii(snapshot)).toThrow(
        'Issued shares coefficient must be non-negative'
      )
    })

    it('marca moeda divergente como currency-mismatch', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = usd(10_000)

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'unavailable',
        reason: 'currency-mismatch',
      })
    })

    it('retorna zero sem exponenciar uma escala extrema', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(0)
      snapshot.facts.issuedShares = { unscaledValue: 1, scale: 32_767 }

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'available',
        value: { scaledAmountInMinorUnitsPerUnit: 0 },
      })
    })

    it('detecta escala extrema insegura antes da exponenciação', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(1)
      snapshot.facts.issuedShares = { unscaledValue: 1, scale: 32_767 }

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'unavailable',
        reason: 'unsafe-arithmetic',
      })
    })

    it('aceita escala alta quando a magnitude final ainda é segura', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(1)
      snapshot.facts.issuedShares = {
        unscaledValue: Number.MAX_SAFE_INTEGER,
        scale: 16,
      }

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'available',
        value: { scaledAmountInMinorUnitsPerUnit: 1_110_223 },
      })
    })

    it('copia defensivamente patrimônio e quantidade de cotas', () => {
      const snapshot = createFiiSnapshot()
      const metric = buildFii(snapshot).metrics.netAssetValuePerIssuedShare

      expect(metric.inputs.netAssetValue).not.toBe(snapshot.facts.netAssetValue)
      expect(metric.inputs.issuedShares).not.toBe(snapshot.facts.issuedShares)
    })

    it('arredonda o valor por cota pela regra half-away-from-zero', () => {
      const snapshot = createFiiSnapshot()
      snapshot.facts.netAssetValue = brl(1)
      snapshot.facts.issuedShares = { unscaledValue: 6, scale: 0 }

      expect(
        buildFii(snapshot).metrics.netAssetValuePerIssuedShare
      ).toMatchObject({
        status: 'available',
        value: {
          scaledAmountInMinorUnitsPerUnit: 166_667,
          rounding: 'half-away-from-zero',
        },
      })
    })
  })

  describe('ETFs internacionais', () => {
    it('calcula passivos sobre ativos', () => {
      expect(buildEtf().metrics.liabilitiesToAssets).toMatchObject({
        status: 'available',
        formulaId: 'etf-liabilities-to-assets.v1',
        value: { scaledValue: 100_000 },
      })
    })

    it('calcula patrimônio líquido sobre ativos', () => {
      expect(buildEtf().metrics.netAssetsToAssets).toMatchObject({
        status: 'available',
        formulaId: 'etf-net-assets-to-assets.v1',
        value: { scaledValue: 900_000 },
      })
    })

    it('calcula reconciliação exata igual a zero', () => {
      expect(buildEtf().metrics.balanceReconciliationDelta).toMatchObject({
        status: 'available',
        formulaId: 'etf-balance-reconciliation-delta.v1',
        value: { amountInMinorUnits: 0, currency: 'USD' },
      })
    })

    it('preserva delta de reconciliação assinado', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.netAssets = usd(90_001)

      expect(
        buildEtf(snapshot).metrics.balanceReconciliationDelta
      ).toMatchObject({
        status: 'available',
        value: { amountInMinorUnits: -1, currency: 'USD' },
      })
    })

    it('marca passivos ausentes como missing-input no ratio', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalLiabilities = null

      const metrics = buildEtf(snapshot).metrics

      expect(metrics.liabilitiesToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
      expect(metrics.netAssetsToAssets).toMatchObject({
        status: 'available',
        value: { scaledValue: 900_000 },
      })
      expect(metrics.balanceReconciliationDelta).toMatchObject({
        status: 'unavailable',
        reason: 'missing-input',
      })
    })

    it('marca ativos ausentes nas três métricas', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalAssets = null

      const metrics = buildEtf(snapshot).metrics

      expect(metrics.liabilitiesToAssets).toMatchObject({
        reason: 'missing-input',
      })
      expect(metrics.netAssetsToAssets).toMatchObject({
        reason: 'missing-input',
      })
      expect(metrics.balanceReconciliationDelta).toMatchObject({
        reason: 'missing-input',
      })
    })

    it('marca ativos zero como denominador não positivo nos ratios', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalAssets = usd(0)

      const metrics = buildEtf(snapshot).metrics

      expect(metrics.liabilitiesToAssets).toMatchObject({
        reason: 'non-positive-denominator',
      })
      expect(metrics.netAssetsToAssets).toMatchObject({
        reason: 'non-positive-denominator',
      })
    })

    it('marca moeda divergente como currency-mismatch', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalAssets = brl(100_000)

      const metrics = buildEtf(snapshot).metrics

      expect(metrics.liabilitiesToAssets).toMatchObject({
        reason: 'currency-mismatch',
      })
      expect(metrics.balanceReconciliationDelta).toMatchObject({
        reason: 'currency-mismatch',
      })
    })

    it('marca ratio fora do inteiro seguro como unsafe-arithmetic', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalLiabilities = usd(Number.MAX_SAFE_INTEGER)
      snapshot.facts.totalAssets = usd(1)

      expect(buildEtf(snapshot).metrics.liabilitiesToAssets).toMatchObject({
        status: 'unavailable',
        reason: 'unsafe-arithmetic',
      })
    })

    it('marca delta fora do inteiro seguro como unsafe-arithmetic', () => {
      const snapshot = createEtfSnapshot()
      snapshot.facts.totalAssets = usd(Number.MAX_SAFE_INTEGER)
      snapshot.facts.totalLiabilities = usd(Number.MIN_SAFE_INTEGER)
      snapshot.facts.netAssets = usd(0)

      expect(
        buildEtf(snapshot).metrics.balanceReconciliationDelta
      ).toMatchObject({
        status: 'unavailable',
        reason: 'unsafe-arithmetic',
      })
    })

    it('mantém cópias independentes dos inputs de cada métrica', () => {
      const snapshot = createEtfSnapshot()
      const metrics = buildEtf(snapshot).metrics

      expect(metrics.liabilitiesToAssets.inputs.totalAssets).not.toBe(
        metrics.netAssetsToAssets.inputs.totalAssets
      )
      expect(metrics.balanceReconciliationDelta.inputs.totalAssets).not.toBe(
        snapshot.facts.totalAssets
      )
    })
  })
})
