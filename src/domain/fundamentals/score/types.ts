export const ASSET_SCORE_V1_SCHEMA_VERSION = 'asset-score.v1' as const

// Regra de faixa de um sinal (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md).
// Espelha SignalRule (src/data/repositories/contracts.ts) - repetido aqui
// como tipo puro de dominio para nao acoplar o motor de score ao contrato
// de repositorio. minValue inclusivo, maxValue EXCLUSIVO (convencao de
// faixa, documentada para nao haver ambiguidade de fronteira).
export type SignalRuleV1 = {
  signalKey: string
  minValue: number | null
  maxValue: number | null
  points: number
  enabled: boolean
}

export type AssetScoreSignalUnavailableReason = 'missing-input' | 'wrong-regime'

export type AssetScoreSignal =
  | {
      signalKey: string
      status: 'applied'
      observedValue: number
      points: number
    }
  | {
      signalKey: string
      status: 'unavailable'
      reason: AssetScoreSignalUnavailableReason
    }

export type AssetScoreV1 = {
  schemaVersion: typeof ASSET_SCORE_V1_SCHEMA_VERSION
  assetId: string
  totalPoints: number
  signals: AssetScoreSignal[]
}
