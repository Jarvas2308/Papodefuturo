import type {
  Asset,
  AssetCategory,
  AssetMarket,
  AssetSegment,
  AssetStatus,
  CurrencyCode,
  EntityId,
  FiiAssetType,
} from '../domain/models'
import type { TablesInsert } from '../lib/database.types'

export type ClosedAssetDefinition = {
  ticker: string
  name: string
  category: AssetCategory
  market: AssetMarket
  currency: CurrencyCode
  status: AssetStatus
  // null para acao e ETF - so FII tem tijolo/papel/fof. Classificacao
  // verificada em fonte durante docs/reference/, nao adivinhada. Ver o
  // documento de referencia da categoria para a fonte de cada uma.
  assetType: FiiAssetType | null
  assetSegment: AssetSegment | null
}

export type AssetIdFactory = () => EntityId

type AssetSeedIdentity = Pick<Asset, 'ticker'>

export const CLOSED_ASSET_UNIVERSE = [
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: null,
    assetSegment: 'banco',
  },
  {
    ticker: 'ITSA4',
    name: 'Itaúsa',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: null,
    assetSegment: 'holding',
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: null,
    assetSegment: 'regulado',
  },
  {
    ticker: 'WEGE3',
    name: 'WEG',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: null,
    assetSegment: 'industrial',
  },
  {
    ticker: 'PSSA3',
    name: 'Porto',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: null,
    assetSegment: 'seguradora',
  },
  {
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    // Tijolo hibrido (lajes corporativas + logistica) - verificado em
    // fonte, nao e o mesmo fundo que KNCR11 (Kinea Rendimentos, papel).
    assetType: 'tijolo',
    assetSegment: 'hibrido',
  },
  {
    ticker: 'VISC11',
    name: 'Vinci Shopping Centers',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: 'tijolo',
    assetSegment: 'shopping',
  },
  {
    ticker: 'XPLG11',
    name: 'XP Log',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: 'tijolo',
    assetSegment: 'logistica',
  },
  {
    ticker: 'HGRU11',
    name: 'Pátria Renda Urbana',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
    assetType: 'tijolo',
    assetSegment: 'renda-urbana',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
    assetType: null,
    assetSegment: 'indice-amplo-us',
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
    assetType: null,
    assetSegment: 'reit-us',
  },
  {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
    assetType: null,
    assetSegment: 'mercados-desenvolvidos-ex-us',
  },
] as const satisfies readonly ClosedAssetDefinition[]

export function normalizeAssetTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export function getClosedAssetCurrency(asset: AssetSeedIdentity): CurrencyCode {
  const definition = CLOSED_ASSET_UNIVERSE.find(
    (candidate) =>
      normalizeAssetTicker(candidate.ticker) ===
      normalizeAssetTicker(asset.ticker)
  )

  if (!definition) {
    throw new Error(
      `Unsupported asset outside closed universe: ${asset.ticker}`
    )
  }

  return definition.currency
}

export function getMissingClosedAssetDefinitions(
  existingAssets: readonly AssetSeedIdentity[]
): ClosedAssetDefinition[] {
  const existingTickers = new Set(
    existingAssets.map((asset) => normalizeAssetTicker(asset.ticker))
  )

  return CLOSED_ASSET_UNIVERSE.filter(
    (asset) => !existingTickers.has(normalizeAssetTicker(asset.ticker))
  )
}

export function buildClosedAssetInsertRows(
  userId: EntityId,
  existingAssets: readonly AssetSeedIdentity[],
  createId: AssetIdFactory
): TablesInsert<'assets'>[] {
  return getMissingClosedAssetDefinitions(existingAssets).map((asset) => ({
    id: createId(),
    user_id: userId,
    ticker: asset.ticker,
    name: asset.name,
    category: asset.category,
    market: asset.market,
    currency: asset.currency,
    status: asset.status,
    asset_type: asset.assetType,
    asset_segment: asset.assetSegment,
  }))
}
