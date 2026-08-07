// Runner manual e pontual para popular fii_monthly_dividend_yield a
// partir do documento "complemento" do Informe Mensal Estruturado da
// CVM (inf_mensal_fii_complemento_<year>.csv), coluna
// Percentual_Dividend_Yield_Mes - campo real, no mesmo arquivo já
// baixado pelo pipeline de fundamental_snapshots, nunca extraído até
// agora (DEC-097, sinal de spread DY sobre NTN-B).
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e
// agendado. Um ano por execucao, preview sempre primeiro, escrita real
// somente com --confirm. Precisa rodar pra pelo menos os ultimos ~13
// meses (2 anos-calendario se o mes atual for cedo no ano) pra ter uma
// janela trailing-12-meses completa.
//
// Variaveis de ambiente obrigatorias em --confirm (nunca commitar; use
// um arquivo local coberto por .gitignore, ex.: .env.server.local):
//   SUPABASE_URL                URL do projeto real (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY   service_role key do projeto real
//
// Uso (modo preview, baixa e extrai mas nao escreve):
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-fii-monthly-dividend-yield-backfill.ts --year=2025
//
// Para executar de verdade:
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-fii-monthly-dividend-yield-backfill.ts --year=2025 --confirm

import { createClient } from '@supabase/supabase-js'
import {
  downloadOfficialCvmFiiArchive,
  readCvmFiiMonthlyDocuments,
} from '../src/data/fundamentals/cvm/fii/archive'
import { buildFiiMonthlyDividendYieldRowsV1 } from '../src/data/fundamentals/cvm/fii/buildFiiMonthlyDividendYieldRowsV1'

const UPSERT_RPC_NAME = 'upsert_fii_monthly_dividend_yield_v1'
const UPSERT_BATCH_SIZE = 100

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
    throw new Error('Missing required --year=<YYYY> argument')
  }
  const year = Number(arg.slice('--year='.length))
  if (!Number.isSafeInteger(year) || year < 2016 || year > 9999) {
    throw new Error(`Invalid --year value: ${arg}`)
  }
  return year
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const confirmed = argv.includes('--confirm')
  const year = parseYearArg()
  const archiveName = `inf_mensal_fii_${year}.zip`

  console.log('=== FII monthly dividend yield backfill: preview ===')
  console.log(JSON.stringify({ year, archiveName }, null, 2))

  const archiveBytes = await downloadOfficialCvmFiiArchive(year)
  const documents = readCvmFiiMonthlyDocuments(archiveBytes)
  const complementDocument = documents.find((doc) => doc.type === 'complement')!

  const rows = buildFiiMonthlyDividendYieldRowsV1({
    document: complementDocument,
    sourceArchive: archiveName,
  })

  console.log(
    `Linhas extraidas dos fundos rastreados: ${rows.length} (esperado ate 4 fundos x 12 meses = 48)`
  )

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

  console.log('\n=== FII monthly dividend yield backfill: result ===')
  console.log(
    JSON.stringify(
      { year, rowsExtracted: rows.length, rowsUpserted: upserted },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error('FII monthly dividend yield backfill failed:', error)
  process.exitCode = 1
})
