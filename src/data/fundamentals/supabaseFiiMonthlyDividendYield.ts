import type { SupabaseClient } from '@supabase/supabase-js'
import type { FiiMonthlyDividendYieldPointV1 } from '../../domain/fundamentals/score/computeFiiTrailingTwelveMonthDividendYieldV1'
import type { Database } from '../../lib/database.types'

export type FiiMonthlyDividendYieldSupabaseClient = SupabaseClient<Database>

export type FiiMonthlyDividendYieldRepository = {
  listFiiMonthlyDividendYieldsByTicker(
    ticker: string
  ): Promise<FiiMonthlyDividendYieldPointV1[]>
}

// Read-only, global table (RLS grants select to authenticated, mesmo
// padrão de market_etf_valuations/provento_declaration_values). Escrita
// só via upsert_fii_monthly_dividend_yield_v1 (script de backfill).
export function createSupabaseFiiMonthlyDividendYieldRepository(
  client: FiiMonthlyDividendYieldSupabaseClient
): FiiMonthlyDividendYieldRepository {
  return {
    async listFiiMonthlyDividendYieldsByTicker(ticker) {
      const { data, error } = await client
        .from('fii_monthly_dividend_yield')
        .select(
          'reference_date, version, dividend_yield_unscaled, dividend_yield_scale'
        )
        .eq('ticker', ticker)

      if (error) {
        throw new Error(
          `Failed to load FII monthly dividend yields: ${error.message}`
        )
      }

      return (data ?? []).map((row) => ({
        referenceDate: row.reference_date,
        version: row.version,
        dividendYield: {
          unscaledValue: row.dividend_yield_unscaled,
          scale: row.dividend_yield_scale,
        },
      }))
    },
  }
}
