// Runner manual e pontual para popular `stock_historical_close_prices` a
// partir do arquivo anual COTAHIST_A<ano>.ZIP da B3 - fechamento do último
// pregão do exercício, pra viabilizar o sinal de P/L vs própria série
// histórica das 5 ações do universo fechado
// (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, seção 3; DEC-104).
//
// Um arquivo anual cobre TODOS os tickers de um ano - diferente do
// backfill de distribuição de ETF (um filing por ticker), este script
// baixa um único arquivo por --year e extrai as 5 ações do universo de
// uma vez.
//
// Não é chamado por nenhum fluxo do app, não roda em CI e não é
// agendado. Preview sempre primeiro, escrita real somente com --confirm,
// falha fechada por ticker (ticker sem pregão casado dentro do próprio
// ano-calendário do arquivo é pulado, nunca vira linha inventada).
//
// Variáveis de ambiente (obrigatórias só em --confirm):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Uso (modo preview, baixa e extrai mas não escreve):
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-stock-close-price-history-backfill.ts --year=2025
//
// Para executar de verdade:
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-stock-close-price-history-backfill.ts --year=2025 --confirm
//
// Repita para cada ano de exercício anual já ingerido em
// fundamental_snapshots (hoje: 2024 e 2025 - ver docs/ROADMAP.md) e para
// anos adicionais que o usuário decidir ingerir via
// run-fundamentals-ingestion.ts --provider=cvm-stocks --source=DFP, pra
// aprofundar a série o suficiente para um quartil confiável
// (STOCK_PL_HISTORY_MIN_POINTS = 5 exercícios, ver
// src/domain/fundamentals/score/computeStockPlQuartilePositionV1.ts).

import { createClient } from '@supabase/supabase-js'
import { unzipSync } from 'fflate'
import { parseCotahistAnnualCloseSeriesV1 } from '../src/data/fundamentals/b3/b3CotahistAnnualCloseSeriesV1'
import { selectFiscalYearEndCloseV1 } from '../src/data/fundamentals/b3/selectFiscalYearEndCloseV1'

const COTAHIST_BASE_URL = 'https://bvmf.bmfbovespa.com.br/InstDados/SerHist/'
const UNIVERSE_TICKERS = ['BBAS3', 'ITSA4', 'TAEE11', 'WEGE3', 'PSSA3']
const UPSERT_RPC_NAME = 'upsert_stock_historical_close_prices_v1'

type ClosePriceRow = {
  ticker: string
  fiscal_year_end_date: string
  trading_date: string
  close_price_in_minor_units: number
  source_archive: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseYearArg(): number {
  const arg = process.argv.slice(2).find((value) => value.startsWith('--year='))
  if (!arg) {
    throw new Error(
      'Missing required --year=<YYYY> argument (one COTAHIST annual file per run).'
    )
  }
  const year = Number(arg.slice('--year='.length))
  if (!Number.isSafeInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`Invalid --year value: ${arg}`)
  }
  return year
}

function extractCotahistText(archive: Uint8Array): string {
  let files: Record<string, Uint8Array>

  try {
    files = unzipSync(archive)
  } catch {
    throw new Error('Arquivo ZIP COTAHIST inválido.')
  }

  const entry = Object.entries(files).find(([name]) =>
    name.toUpperCase().endsWith('.TXT')
  )

  if (!entry) {
    throw new Error('Arquivo ZIP COTAHIST não contém um TXT válido.')
  }

  return new TextDecoder('windows-1252').decode(entry[1])
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const confirmed = argv.includes('--confirm')
  const year = parseYearArg()
  const fiscalYearEndDate = `${year}-12-31`
  const fileName = `COTAHIST_A${year}.ZIP`
  const url = new URL(fileName, COTAHIST_BASE_URL)

  console.log('=== Stock historical close price backfill: preview ===')
  console.log(
    JSON.stringify({ year, fiscalYearEndDate, url: url.toString() }, null, 2)
  )

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Falha ao baixar ${url.toString()}: HTTP ${response.status}`
    )
  }

  const content = extractCotahistText(
    new Uint8Array(await response.arrayBuffer())
  )
  const seriesByTicker = parseCotahistAnnualCloseSeriesV1(
    content,
    UNIVERSE_TICKERS
  )

  const rows: ClosePriceRow[] = []
  for (const ticker of UNIVERSE_TICKERS) {
    const series = seriesByTicker.get(ticker) ?? []
    const selected = selectFiscalYearEndCloseV1({ series, fiscalYearEndDate })

    if (selected === null) {
      console.log(
        `[${ticker}] nenhum pregão encontrado em ${fileName} em ou antes de ${fiscalYearEndDate} - pulado.`
      )
      continue
    }

    const row: ClosePriceRow = {
      ticker,
      fiscal_year_end_date: fiscalYearEndDate,
      trading_date: selected.tradingDate,
      close_price_in_minor_units: selected.closePriceInMinorUnits,
      source_archive: fileName,
    }
    console.log(`[${ticker}] ${JSON.stringify(row, null, 2)}`)
    rows.push(row)
  }

  console.log(
    `\nLinhas extraídas: ${rows.length} (esperado até ${UNIVERSE_TICKERS.length})`
  )

  if (rows.length === 0) {
    console.log('Nada a escrever.')
    return
  }

  if (!confirmed) {
    console.log(
      '\nModo preview (nenhuma escrita). Passe --confirm para executar de verdade contra produção.'
    )
    return
  }

  console.log('\n--confirm recebido. Escrevendo em produção.')

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const response2 = await client.rpc(UPSERT_RPC_NAME, { records: rows })
  if (response2.error !== null) {
    throw new Error(`Upsert failed: ${JSON.stringify(response2.error)}`)
  }
  const data = response2.data as { attempted: number; upserted: number }

  console.log('\n=== Stock historical close price backfill: result ===')
  console.log(
    JSON.stringify(
      {
        rowsExtracted: rows.length,
        attempted: data.attempted,
        upserted: data.upserted,
      },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error('Stock historical close price backfill failed:', error)
  process.exitCode = 1
})
