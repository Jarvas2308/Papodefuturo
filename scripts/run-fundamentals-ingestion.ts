// Runner manual e pontual para a ingestao real de fundamentos
// (docs/ROADMAP.md, secao Proximo, item 2).
//
// Os tres providers oficiais (CVM DFP/ITR para acoes, CVM Informe Mensal para
// FIIs, SEC N-PORT para ETFs internacionais) e os tres ingest*.ts em
// src/data/fundamentals/ existem e sao testados, mas nao havia runner
// executavel equivalente ao de eventos oficiais. Este script fecha essa
// lacuna, com a mesma disciplina: um provider por execucao, preview sempre
// primeiro, escrita real somente com --confirm.
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e agendado.
//
// Variaveis de ambiente obrigatorias em --confirm (nunca commitar; use um
// arquivo local coberto por .gitignore, ex.: .env.server.local):
//   SUPABASE_URL                    URL do projeto real (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY       service_role key do projeto real
//   FUNDAMENTALS_CONTACT_EMAIL      email de contato exigido no User-Agent SEC
//
// Uso (modo preview, nenhuma rede, nenhuma escrita):
//   npx tsx scripts/run-fundamentals-ingestion.ts --provider=cvm-fii --year=2026
//   npx tsx scripts/run-fundamentals-ingestion.ts --provider=cvm-stocks --source=DFP --year=2026
//   npx tsx scripts/run-fundamentals-ingestion.ts --provider=sec-nport
//
// Para executar de verdade, acrescente --confirm e carregue as credenciais:
//   node --env-file=.env.server.local --import tsx scripts/run-fundamentals-ingestion.ts \
//     --provider=cvm-fii --year=2026 --confirm
// (ou `npx tsx --env-file=.env.server.local scripts/run-fundamentals-ingestion.ts ...`,
// se o import direto falhar por causa do Git Credential Manager/ambiente local)
//
// O preview nunca chama os ingest*.ts: eles fazem rede e escrita numa unica
// chamada (upsertMany acontece dentro da funcao de ingestao). Por isso o
// preview apenas imprime o plano resolvido e declara que nenhuma rede foi
// tocada.
//
// Os tres ingest*.ts devolvem os records extraidos, nao as linhas
// persistidas — o resultado abaixo reporta a contagem extraida; confirme a
// contagem real por consulta somente leitura a fundamental_snapshots depois.

import { createClient } from '@supabase/supabase-js'
import type { CvmArchiveFetcher } from '../src/data/fundamentals/cvm/types'
import type { CvmFiiArchiveFetcher } from '../src/data/fundamentals/cvm/fii/types'
import type { SecNportFetcher } from '../src/data/fundamentals/sec/nport/types'
import { ingestCvmBrazilianStockFundamentals } from '../src/data/fundamentals/ingestCvmBrazilianStocks'
import { ingestCvmRealEstateFundFundamentals } from '../src/data/fundamentals/ingestCvmRealEstateFunds'
import { ingestSecInternationalEtfFundamentals } from '../src/data/fundamentals/ingestSecInternationalEtfs'
import { ingestShillerCapeFundamentals } from '../src/data/fundamentals/ingestShillerCape'
import { createSupabaseFundamentalSnapshotStorage } from '../src/data/fundamentals/supabaseFundamentalSnapshots'
import { createSupabaseRealEstateFundSnapshotStorage } from '../src/data/fundamentals/supabaseRealEstateFundSnapshots'
import { createSupabaseInternationalEtfSnapshotStorage } from '../src/data/fundamentals/supabaseInternationalEtfSnapshots'
import { createSupabaseShillerCapeSnapshotStorage } from '../src/data/fundamentals/supabaseShillerCapeSnapshots'
import { createOfficialEventsSafeFetchV1 } from '../src/server/context/official-events/safeFetch'
import { buildFundamentalsIngestionPlanV1 } from './lib/buildFundamentalsIngestionPlan'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const SAFE_FETCH_ALLOWED_HEADER_NAMES = new Set(['accept', 'user-agent'])

function toSecNportFetcher(
  safeFetch: ReturnType<typeof createOfficialEventsSafeFetchV1>
): SecNportFetcher {
  return async (url, init) => {
    // safeFetch.sec only forwards `accept`/`user-agent` (shared allowlist from
    // official-events); the SEC N-PORT module also asks for `Accept-Encoding`,
    // which is dropped here rather than widening the shared allowlist. This
    // only disables response compression negotiation, not correctness.
    const headers = Object.fromEntries(
      Object.entries(init.headers).filter(([name]) =>
        SAFE_FETCH_ALLOWED_HEADER_NAMES.has(name.toLowerCase())
      )
    )
    const response = await safeFetch.sec({ url, headers })
    return {
      ok: response.ok,
      status: response.status,
      async text() {
        const buffer = await response.arrayBuffer()
        return new TextDecoder('utf-8').decode(buffer)
      },
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const confirmed = argv.includes('--confirm')
  const planArgv = argv.filter((arg) => arg !== '--confirm')

  const plan = buildFundamentalsIngestionPlanV1(planArgv)

  const targetTable =
    plan.provider === 'shiller-cape' ? 'market_valuation_ratios' : 'fundamental_snapshots'

  console.log('=== Fundamentals ingestion: preview ===')
  console.log(
    JSON.stringify(
      {
        ...plan,
        targetTable,
      },
      null,
      2
    )
  )

  if (!confirmed) {
    console.log(
      '\nModo preview (nenhuma chamada de rede, nenhuma escrita). ' +
        'Passe --confirm para executar de verdade contra producao.'
    )
    return
  }

  console.log(
    '\n--confirm recebido. Executando contra producao (rede real ao provider, ' +
      'escrita real no Supabase real).'
  )

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const contactEmail = requireEnv('FUNDAMENTALS_CONTACT_EMAIL')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const safeFetch = createOfficialEventsSafeFetchV1({ fetchImpl: fetch })

  const records = await (async () => {
    if (plan.provider === 'cvm-stocks') {
      const storage = createSupabaseFundamentalSnapshotStorage(client)
      return ingestCvmBrazilianStockFundamentals({
        source: plan.source,
        year: plan.year,
        storage,
        fetcher: safeFetch.cvm as CvmArchiveFetcher,
      })
    }
    if (plan.provider === 'cvm-fii') {
      const storage = createSupabaseRealEstateFundSnapshotStorage(client)
      return ingestCvmRealEstateFundFundamentals({
        year: plan.year,
        storage,
        fetcher: safeFetch.cvm as CvmFiiArchiveFetcher,
      })
    }
    if (plan.provider === 'sec-nport') {
      const storage = createSupabaseInternationalEtfSnapshotStorage(client)
      return ingestSecInternationalEtfFundamentals({
        userAgent: `PapoDeFuturo/1.0 ${contactEmail}`,
        fetcher: toSecNportFetcher(safeFetch),
        storage,
      })
    }
    // Shiller CAPE fica fora do safeFetch de official-events: aquele allowlist
    // (OFFICIAL_EVENTS_ALLOWED_HOSTS_V1) e' HTTPS-only e nao inclui o host da
    // Yale (econ.yale.edu), que so' serve HTTP. Ver src/data/fundamentals/shiller/archive.ts.
    const storage = createSupabaseShillerCapeSnapshotStorage(client)
    return ingestShillerCapeFundamentals({ storage, fetcher: fetch })
  })()

  console.log('\n=== Fundamentals ingestion: result ===')
  console.log(
    JSON.stringify(
      {
        provider: plan.provider,
        extractedRecordCount: records.length,
      },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error('Fundamentals ingestion failed:', error)
  process.exitCode = 1
})
