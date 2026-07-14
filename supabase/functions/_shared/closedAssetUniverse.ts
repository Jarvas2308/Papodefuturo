export type ServerClosedAssetDefinition = {
  ticker: string
  market: 'BR' | 'US'
  currency: 'BRL' | 'USD'
}

export const SERVER_CLOSED_ASSET_UNIVERSE = [
  { ticker: 'BBAS3', market: 'BR', currency: 'BRL' },
  { ticker: 'ITSA4', market: 'BR', currency: 'BRL' },
  { ticker: 'TAEE11', market: 'BR', currency: 'BRL' },
  { ticker: 'WEGE3', market: 'BR', currency: 'BRL' },
  { ticker: 'PSSA3', market: 'BR', currency: 'BRL' },
  { ticker: 'KNRI11', market: 'BR', currency: 'BRL' },
  { ticker: 'VISC11', market: 'BR', currency: 'BRL' },
  { ticker: 'XPLG11', market: 'BR', currency: 'BRL' },
  { ticker: 'HGRU11', market: 'BR', currency: 'BRL' },
  { ticker: 'VOO', market: 'US', currency: 'USD' },
  { ticker: 'VNQ', market: 'US', currency: 'USD' },
  { ticker: 'VEA', market: 'US', currency: 'USD' },
] as const satisfies readonly ServerClosedAssetDefinition[]
