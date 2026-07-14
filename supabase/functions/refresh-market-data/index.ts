import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import { refreshMarketData, type MarketDataStorage } from './core.ts'
import { createHgBrasilProvider } from './hgBrasilProvider.ts'
import { createTwelveDataProvider } from './twelveDataProvider.ts'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Promise<Response> | Response): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

function requireEnvironment(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required function environment: ${name}`)
  }

  return value
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Método não permitido.' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ message: 'Autenticação obrigatória.' }, 401)
  }

  try {
    const client = createClient(
      requireEnvironment('SUPABASE_URL'),
      requireEnvironment('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authorization } } }
    )
    const { data: authData, error: authError } = await client.auth.getUser()

    if (authError || !authData.user) {
      return jsonResponse({ message: 'Sessão autenticada inválida.' }, 401)
    }

    const storage: MarketDataStorage = {
      async listActiveAssets() {
        const { data, error } = await client
          .from('assets')
          .select('id,ticker,status')
          .eq('status', 'active')

        if (error) throw error
        return data ?? []
      },
      async listMarketPrices() {
        const { data, error } = await client
          .from('asset_prices')
          .select('asset_id,priced_at,source')
          .eq('source', 'market-provider')

        if (error) throw error
        return (data ?? []).map((row) => ({
          assetId: row.asset_id,
          pricedAt: row.priced_at,
          source: row.source,
        }))
      },
      async listMarketExchangeRates() {
        const { data, error } = await client
          .from('exchange_rates')
          .select('base_currency,quote_currency,priced_at,source')
          .eq('source', 'market-provider')
          .or(
            'and(base_currency.eq.USD,quote_currency.eq.BRL),and(base_currency.eq.BRL,quote_currency.eq.USD)'
          )

        if (error) throw error
        return (data ?? []).map((row) => ({
          baseCurrency: row.base_currency,
          quoteCurrency: row.quote_currency,
          pricedAt: row.priced_at,
          source: row.source,
        }))
      },
      async insertMarketPrices(rows) {
        const { error } = await client.from('asset_prices').insert(rows)
        if (error) throw error
      },
      async insertMarketExchangeRate(row) {
        const { error } = await client.from('exchange_rates').insert(row)
        if (error) throw error
      },
    }
    const hgKey = Deno.env.get('HG_BRASIL_API_KEY')?.trim()
    const twelveDataKey = Deno.env.get('TWELVE_DATA_API_KEY')?.trim()
    const result = await refreshMarketData({
      userId: authData.user.id,
      storage,
      hgBrasil: hgKey ? createHgBrasilProvider(hgKey) : null,
      twelveData: twelveDataKey
        ? createTwelveDataProvider(twelveDataKey)
        : null,
    })

    return jsonResponse(result)
  } catch {
    return jsonResponse(
      { message: 'Não foi possível atualizar os dados de mercado.' },
      500
    )
  }
})
