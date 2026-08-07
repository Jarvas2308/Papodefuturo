import type { SupabaseClient } from '@supabase/supabase-js'
import type { EtfDistributionValuePoint } from '../../domain/fundamentals/score'
import type { Database } from '../../lib/database.types'

// Migration `20260807130000_create_etf_distribution_values.sql` aplicada
// em produção em 07/08/2026; `database.types.ts` regenerado pelo
// mecanismo oficial (Database já inclui `etf_distribution_values`).

export type EtfDistributionValueSupabaseClient = SupabaseClient<Database>

export type EtfDistributionValueRepository = {
  listEtfDistributionValues(): Promise<EtfDistributionValuePoint[]>
}

// Read-only, global table (RLS concede select a `authenticated`, mesmo
// padrão de market_etf_valuations/fii_monthly_dividend_yield). Escrita só
// via upsert_etf_distribution_values_v1 (script de backfill).
export function createSupabaseEtfDistributionValueRepository(
  client: EtfDistributionValueSupabaseClient
): EtfDistributionValueRepository {
  return {
    async listEtfDistributionValues() {
      const { data, error } = await client
        .from('etf_distribution_values')
        .select(
          'ticker, fiscal_year_end_date, total_distributions_per_share_unscaled, total_distributions_per_share_scale, net_asset_value_end_of_period_unscaled, net_asset_value_end_of_period_scale'
        )

      if (error) {
        throw new Error(
          `Failed to load ETF distribution values: ${error.message}`
        )
      }

      return (data ?? []).map((row) => ({
        ticker: row.ticker,
        fiscalYearEndDate: row.fiscal_year_end_date,
        totalDistributionsPerShare: {
          unscaledValue: row.total_distributions_per_share_unscaled,
          scale: row.total_distributions_per_share_scale,
        },
        netAssetValueEndOfPeriod: {
          unscaledValue: row.net_asset_value_end_of_period_unscaled,
          scale: row.net_asset_value_end_of_period_scale,
        },
      }))
    },
  }
}
