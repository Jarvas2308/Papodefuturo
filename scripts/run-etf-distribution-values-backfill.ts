// Runner manual e pontual para popular `etf_distribution_values` a partir
// do N-CSR anual (relatorio anual auditado) protocolado na SEC pelo trust
// de cada ETF do universo fechado - linhas "Total Distributions" e "Net
// Asset Value, End of Period" da tabela "Financial Highlights" da classe
// ETF do fundo (DEC-103, sinal de spread de DY sobre a TIPS de 10 anos).
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e
// agendado. Preview sempre primeiro, escrita real somente com --confirm,
// falha fechada por documento (filing que nao contem o bloco do fundo e
// pulado inteiro, nunca vira linha parcial).
//
// A SEC exige User-Agent identificavel com contato real (fair access).
// Sem SEC_USER_AGENT o script nao roda nem em preview.
//
// Variaveis de ambiente:
//   SEC_USER_AGENT              obrigatoria sempre, ex.: "PapoDeFuturo/1.0 (voce@exemplo.com)"
//   SUPABASE_URL                obrigatoria em --confirm
//   SUPABASE_SERVICE_ROLE_KEY   obrigatoria em --confirm
//
// Uso (modo preview, baixa e extrai mas nao escreve):
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-etf-distribution-values-backfill.ts --ticker=VNQ
//
// Para executar de verdade:
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-etf-distribution-values-backfill.ts --ticker=VNQ --confirm
//
// Sem --ticker, roda os tres ETFs do universo fechado (VOO, VNQ, VEA).

import { createClient } from '@supabase/supabase-js'
import {
  ETF_NCSR_FUND_IDENTITIES_V1,
  findEtfNcsrFundIdentityV1,
} from '../src/data/fundamentals/sec/ncsr/etfNcsrFundIdentityV1'
import { fetchEtfDistributionValueRowV1 } from '../src/data/fundamentals/sec/ncsr/fetchEtfDistributionValueRowV1'
import type { EtfDistributionValueRowV1 } from '../src/data/fundamentals/sec/ncsr/buildEtfDistributionValueRowV1'

const UPSERT_RPC_NAME = 'upsert_etf_distribution_values_v1'
const UPSERT_BATCH_SIZE = 20
const FAIR_ACCESS_DELAY_MS = 500

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseTickerArg(): string[] {
  const arg = process.argv
    .slice(2)
    .find((value) => value.startsWith('--ticker='))
  if (!arg) {
    return ETF_NCSR_FUND_IDENTITIES_V1.map((identity) => identity.ticker)
  }
  const ticker = arg.slice('--ticker='.length).toUpperCase()
  if (findEtfNcsrFundIdentityV1(ticker) === null) {
    throw new Error(`Ticker fora do universo de ETF suportado: ${ticker}`)
  }
  return [ticker]
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const confirmed = argv.includes('--confirm')
  const tickers = parseTickerArg()
  const userAgent = requireEnv('SEC_USER_AGENT')

  console.log('=== ETF distribution values backfill: preview ===')
  console.log(JSON.stringify({ tickers }, null, 2))

  const rows: EtfDistributionValueRowV1[] = []
  for (const ticker of tickers) {
    const identity = findEtfNcsrFundIdentityV1(ticker)!
    const row = await fetchEtfDistributionValueRowV1({
      identity,
      userAgent,
      onProgress: (message) => console.log(`[${ticker}] ${message}`),
      delay,
      fairAccessDelayMs: FAIR_ACCESS_DELAY_MS,
    })

    if (row === null) {
      console.log(
        `[${ticker}] nenhum N-CSR recente contem o bloco "${identity.fundName} / ${identity.shareClassLabel}" - pulado, nada sera escrito para este ticker.`
      )
      continue
    }

    console.log(`[${ticker}] ${JSON.stringify(row, null, 2)}`)
    rows.push(row)
  }

  console.log(
    `\nLinhas extraidas: ${rows.length} (esperado ate ${tickers.length})`
  )

  if (rows.length === 0) {
    console.log('Nada a escrever.')
    return
  }

  if (!confirmed) {
    console.log(
      '\nModo preview (nenhuma escrita). Passe --confirm para executar de verdade contra producao.'
    )
    return
  }

  console.log('\n--confirm recebido. Escrevendo em producao.')

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let upserted = 0
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE)
    const response = await client.rpc(UPSERT_RPC_NAME, { records: batch })
    if (response.error !== null) {
      throw new Error(
        `Upsert batch failed at offset ${index}: ${JSON.stringify(response.error)}`
      )
    }
    const data = response.data as { attempted: number; upserted: number }
    upserted += data.upserted
    console.log(
      `Batch ${index}-${index + batch.length}: attempted=${data.attempted} upserted=${data.upserted}`
    )
  }

  console.log('\n=== ETF distribution values backfill: result ===')
  console.log(
    JSON.stringify(
      { rowsExtracted: rows.length, rowsUpserted: upserted },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error('ETF distribution values backfill failed:', error)
  process.exitCode = 1
})
