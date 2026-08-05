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

// 'stale' (Sprint 16, Fase 9, DEC-089): dado existe mas a referenceDate do
// snapshot de origem passou do limiar de frescor por fonte (DEC-068 - nao e'
// um numero global, cada fonte tem seu proprio ritmo de publicacao).
// Contribui 0 pontos, igual 'unavailable' - dado velho nao pontua, mas o
// valor observado continua exposto pra transparencia (dossie pode mostrar
// "sinal desatualizado", nao so omitir).
export type AssetScoreSignal =
  | {
      signalKey: string
      status: 'applied'
      observedValue: number
      points: number
    }
  | {
      signalKey: string
      status: 'stale'
      observedValue: number
      referenceDate: string
      staleAfterDays: number
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
