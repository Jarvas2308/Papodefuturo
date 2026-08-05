// Escrita do CAPE (Shiller P/E) do S&P 500 - Sprint 16, Fase 4 (DEC-084).
// Tabela global nova (`market_valuation_ratios`), fora de
// `fundamental_snapshots` - CAPE nao e' um fato por-ativo, e' um dado de
// mercado agregado (mesma categoria de `market_reference_rates`,
// DEC-075), so que sem conceito de vencimento.
import type { ShillerCapeRecord } from './shiller/types'

export type ShillerCapeUpsertRowV1 = {
  series: 'shiller-cape-sp500'
  reference_date: string
  value_scaled: number
  value_scale: number
  source: 'shiller-yale'
}

export const UPSERT_MARKET_VALUATION_RATIOS_RPC_V1 =
  'upsert_market_valuation_ratios_v1' as const

export type MarketValuationRatiosRpcClientV1 = {
  rpc(
    functionName: typeof UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
    args: { records: readonly ShillerCapeUpsertRowV1[] }
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export type ShillerCapeSnapshotStorage = {
  upsertMany(records: readonly ShillerCapeRecord[]): Promise<void>
}

function toInsertRow(record: ShillerCapeRecord): ShillerCapeUpsertRowV1 {
  if (!Number.isSafeInteger(record.valueScaled) || record.valueScaled <= 0) {
    throw new RangeError(`Invalid Shiller CAPE scaled value: ${record.valueScaled}`)
  }
  if (record.valueScale !== 1_000_000) {
    throw new RangeError(`Invalid Shiller CAPE value scale: ${record.valueScale}`)
  }

  return {
    series: record.series,
    reference_date: record.referenceDate,
    value_scaled: record.valueScaled,
    value_scale: record.valueScale,
    source: record.source,
  }
}

export function createSupabaseShillerCapeSnapshotStorage(
  privilegedClient: MarketValuationRatiosRpcClientV1
): ShillerCapeSnapshotStorage {
  return {
    async upsertMany(records) {
      if (records.length === 0) {
        return
      }
      const { error } = await privilegedClient.rpc(
        UPSERT_MARKET_VALUATION_RATIOS_RPC_V1,
        { records: records.map(toInsertRow) }
      )
      if (error) {
        throw new Error(
          `Failed to upsert Shiller CAPE valuation ratios: ${error.message}`
        )
      }
    },
  }
}
