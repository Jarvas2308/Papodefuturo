import type { SupabaseClient } from '@supabase/supabase-js'
import type { EtfDistributionValuePoint } from '../../domain/fundamentals/score'

// `etf_distribution_values` migration
// (supabase/migrations/20260807130000_create_etf_distribution_values.sql)
// is versioned but NOT yet applied to production Supabase, so the table
// does not exist in the real generated `Database` type yet (AGENTS.md
// seção 11: não editar o type gerado manualmente para fingir que uma
// tabela existe). This row shape is defined locally, matching the
// migration's columns exactly, and the client is untyped for this
// repository. Once the migration is applied and types are regenerated
// for real, switch back to `SupabaseClient<Database>` and drop this
// local type, same discipline as every other pre-application table in
// this repo.
type EtfDistributionValueRow = {
  ticker: string
  fiscal_year_end_date: string
  total_distributions_per_share_unscaled: number
  total_distributions_per_share_scale: number
  net_asset_value_end_of_period_unscaled: number
  net_asset_value_end_of_period_scale: number
}

export type EtfDistributionValueSupabaseClient = SupabaseClient

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

      const rows = (data ?? []) as EtfDistributionValueRow[]

      return rows.map((row) => ({
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
