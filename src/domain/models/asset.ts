import type { EntityId } from './shared'

export type AssetCategory =
  | 'brazilian-stock'
  | 'real-estate-fund'
  | 'international-etf'
  | 'fixed-income'
  | 'cash'

export type AssetMarket = 'BR' | 'US' | 'INTERNAL'
export type AssetStatus = 'active' | 'inactive'

// So se aplica a FII. Aplicar metrica de tijolo (vacancia, WALE) num fundo
// de papel e o erro de categoria documentado em
// docs/reference/FII_SEGMENTOS_E_METRICAS.md - null para acao e ETF.
export type FiiAssetType = 'tijolo' | 'papel' | 'fof'

// Vocabulario depende da categoria do ativo (FII, acao por regime, ou ETF
// por indice replicado) - sem ambiguidade porque cada ativo pertence a uma
// categoria so. Ver docs/reference/*.md para a fonte de cada classificacao.
export type AssetSegment =
  | 'shopping'
  | 'lajes-corporativas'
  | 'logistica'
  | 'renda-urbana'
  | 'hibrido'
  | 'banco'
  | 'seguradora'
  | 'regulado'
  | 'holding'
  | 'industrial'
  | 'indice-amplo-us'
  | 'reit-us'
  | 'mercados-desenvolvidos-ex-us'

export type Asset = {
  id: EntityId
  ticker: string
  name: string
  category: AssetCategory
  market: AssetMarket
  status: AssetStatus
  // Opcionais de proposito: ausente (nao so null) em qualquer lugar que
  // ainda nao popula os dois - dezenas de fixture de teste no resto da
  // suite constroem Asset sem eles. Codigo real (mapAssetRow,
  // assetUniverse.ts) sempre preenche.
  assetType?: FiiAssetType | null
  assetSegment?: AssetSegment | null
}
