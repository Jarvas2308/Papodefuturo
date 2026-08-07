import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/database.types'

export type MarketReferenceRateSupabaseClient = SupabaseClient<Database>

// rateScale aqui é um divisor bruto (rate = rateScaled / rateScale), NÃO
// o `scale` de ExactDecimalQuantity (que é sempre expoente de base 10,
// unscaledValue / 10^scale) - as duas colunas do banco (rate_scaled,
// rate_scale) são um par próprio, não confundir os dois formatos
// mesmo quando o divisor observado na prática é uma potência de 10.
export type MarketReferenceRatePoint = {
  series: string
  pricedAt: string
  rateScaled: number
  rateScale: number
}

export type MarketReferenceRateRepository = {
  getLatestMarketReferenceRate(
    series: string
  ): Promise<MarketReferenceRatePoint | null>
}

// Read-only, global table (RLS grants select to authenticated). Escrita
// só via upsert_market_reference_rates_v1 (Edge Function
// refresh-market-data, tesouroTransparenteProvider.ts/fred).
export function createSupabaseMarketReferenceRateRepository(
  client: MarketReferenceRateSupabaseClient
): MarketReferenceRateRepository {
  return {
    async getLatestMarketReferenceRate(series) {
      const { data, error } = await client
        .from('market_reference_rates')
        .select('series, priced_at, rate_scaled, rate_scale')
        .eq('series', series)
        .order('priced_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error(
          `Failed to load market reference rate: ${error.message}`
        )
      }
      if (!data) {
        return null
      }

      return {
        series: data.series,
        pricedAt: data.priced_at,
        rateScaled: data.rate_scaled,
        rateScale: data.rate_scale,
      }
    },
  }
}
