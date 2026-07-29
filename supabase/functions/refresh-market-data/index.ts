import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.110.2/cors'
import { refreshMarketData, type MarketDataStorage } from './core.ts'
import { createB3CotahistProvider } from './b3CotahistProvider.ts'
import { extractCotahistText } from './b3CotahistZip.ts'
import { createTwelveDataProvider } from './twelveDataProvider.ts'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Promise<Response> | Response): void
}

const responseHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders })
}

function requireEnvironment(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required function environment: ${name}`)
  }

  return value
}

// Precos e cambio sao dados globais desde DEC-052 (market_asset_prices,
// market_exchange_rates) - nao ha mais user_id para escrever, entao quem
// dispara a atualizacao deixou de precisar ser dono dos dados. Duas formas de
// chamada continuam autorizadas:
//   1. sessao de usuario autenticado real (Authorization: Bearer <JWT>) -
//      mesmo gate de acesso que ja existia, so que agora a identidade do
//      usuario nao e mais usada para nada alem de confirmar que ha sessao;
//   2. chamador de confianca server-side (Authorization: Bearer
//      <SUPABASE_SERVICE_ROLE_KEY>), usado por scheduler (pg_cron via
//      pg_net) ou scripts operacionais - sem sessao de usuario, entao
//      auth.getUser() e pulado.
// Em ambos os casos a escrita real usa um client proprio com service_role,
// nunca a sessao encaminhada pelo chamador - as duas RPCs
// (upsert_market_asset_prices_v1/upsert_market_exchange_rates_v1) sao a unica
// via de escrita, e so aceitam service_role.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Método não permitido.' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ message: 'Autenticação obrigatória.' }, 401)
  }

  try {
    const supabaseUrl = requireEnvironment('SUPABASE_URL')
    const serviceRoleKey = requireEnvironment('SUPABASE_SERVICE_ROLE_KEY')
    const bearerToken = authorization.replace(/^Bearer\s+/i, '').trim()
    const isTrustedServiceCaller = bearerToken === serviceRoleKey

    if (!isTrustedServiceCaller) {
      const sessionClient = createClient(
        supabaseUrl,
        requireEnvironment('SUPABASE_ANON_KEY'),
        { global: { headers: { Authorization: authorization } } }
      )
      const { data: authData, error: authError } =
        await sessionClient.auth.getUser()

      if (authError || !authData.user) {
        return jsonResponse({ message: 'Sessão autenticada inválida.' }, 401)
      }
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const storage: MarketDataStorage = {
      async listMarketPrices() {
        const { data, error } = await serviceClient
          .from('market_asset_prices')
          .select('ticker,priced_at,source')
          .eq('source', 'market-provider')

        if (error) throw error
        return (data ?? []).map((row) => ({
          ticker: row.ticker,
          pricedAt: row.priced_at,
          source: row.source,
        }))
      },
      async listMarketExchangeRates() {
        const { data, error } = await serviceClient
          .from('market_exchange_rates')
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
        const { error } = await serviceClient.rpc(
          'upsert_market_asset_prices_v1',
          { records: rows }
        )
        if (error) throw error
      },
      async insertMarketExchangeRate(row) {
        const { error } = await serviceClient.rpc(
          'upsert_market_exchange_rates_v1',
          { records: [row] }
        )
        if (error) throw error
      },
    }
    const twelveDataKey = Deno.env.get('TWELVE_DATA_API_KEY')?.trim()
    const result = await refreshMarketData({
      storage,
      b3Cotahist: createB3CotahistProvider({
        extractText: extractCotahistText,
      }),
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
