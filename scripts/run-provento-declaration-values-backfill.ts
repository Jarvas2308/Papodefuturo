// Runner manual e pontual para popular provento_declaration_values a
// partir dos official_asset_events de categoria dividend-or-distribution
// ja backfillados (DEC-097). Para cada evento com canonical_url, baixa o
// PDF "Provento" da CVM, extrai as linhas por ISIN
// (buildProventoDeclarationValueRowsV1) e faz upsert via
// upsert_provento_declaration_values_v1 (idempotente, chave (event_id,
// isin)).
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e
// agendado. Um job por execucao (todos os eventos dividend-or-
// distribution), preview sempre primeiro, escrita real somente com
// --confirm.
//
// Falha fechada por documento: um documento que nao parece um
// formulario "Provento", ou que tem linhas de valor mas nenhuma
// identidade de declaracao (Protocolo Provento), e reportado como
// pulado/falho no resumo final - nunca grava dado parcial ou
// inventado. Um documento com problema nao aborta o job inteiro.
//
// Variaveis de ambiente obrigatorias em --confirm (nunca commitar; use
// um arquivo local coberto por .gitignore, ex.: .env.server.local):
//   SUPABASE_URL                URL do projeto real (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY   service_role key do projeto real
//
// Uso (modo preview, lista os eventos e quantos tem canonical_url, sem
// baixar PDF nem escrever):
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-provento-declaration-values-backfill.ts
//
// Para executar de verdade:
//   node --env-file=.env.server.local --import tsx \
//     scripts/run-provento-declaration-values-backfill.ts --confirm

import { createClient } from '@supabase/supabase-js'
import { createSupabaseOfficialAssetEventReadRepositoryV1 } from '../src/data/context/official-events'
import { buildProventoDeclarationValueRowsV1 } from '../src/data/fundamentals/provento/buildProventoDeclarationValueRowsV1'
import { fetchProventoDocumentText } from '../src/data/fundamentals/provento/fetchProventoDocumentText'
import type { ProventoDeclarationValueRowV1 } from '../src/data/fundamentals/provento/toProventoDeclarationValueRowV1'

const UPSERT_RPC_NAME = 'upsert_provento_declaration_values_v1'
const UPSERT_BATCH_SIZE = 100
const LIST_PAGE_LIMIT = 100

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

type EventSummary = {
  eventId: string
  ticker: string
  canonicalUrl: string
}

async function listDividendEvents(
  repository: ReturnType<
    typeof createSupabaseOfficialAssetEventReadRepositoryV1
  >
): Promise<EventSummary[]> {
  const events: EventSummary[] = []
  let cursor: string | null | undefined
  for (;;) {
    const page = await repository.listPage({
      eventTypes: ['dividend-or-distribution'],
      limit: LIST_PAGE_LIMIT,
      cursor: cursor ?? undefined,
    })
    for (const event of page.items) {
      if (event.canonicalUrl !== null) {
        events.push({
          eventId: event.eventId,
          ticker: event.assetIdentity.ticker,
          canonicalUrl: event.canonicalUrl,
        })
      }
    }
    if (!page.hasMore) break
    cursor = page.nextCursor
  }
  return events
}

async function main(): Promise<void> {
  const confirmed = process.argv.slice(2).includes('--confirm')

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const readRepository = createSupabaseOfficialAssetEventReadRepositoryV1({
    client,
  })

  console.log('=== Provento declaration values backfill: preview ===')
  const events = await listDividendEvents(readRepository)
  console.log(
    `Eventos dividend-or-distribution com canonical_url: ${events.length}`
  )

  if (!confirmed) {
    console.log(
      '\nModo preview (nenhum PDF baixado, nenhuma escrita). ' +
        'Passe --confirm para executar de verdade contra producao.'
    )
    return
  }

  console.log(
    '\n--confirm recebido. Baixando documentos reais e escrevendo em producao.'
  )

  let rows: ProventoDeclarationValueRowV1[] = []
  const skipped: { eventId: string; ticker: string; reason: string }[] = []
  const failed: { eventId: string; ticker: string; error: string }[] = []

  for (const event of events) {
    try {
      const documentText = await fetchProventoDocumentText(event.canonicalUrl)
      const eventRows = buildProventoDeclarationValueRowsV1({
        eventId: event.eventId,
        documentText,
      })
      if (eventRows === null) {
        skipped.push({
          eventId: event.eventId,
          ticker: event.ticker,
          reason: 'not a Provento form document',
        })
        continue
      }
      if (eventRows.length === 0) {
        skipped.push({
          eventId: event.eventId,
          ticker: event.ticker,
          reason: 'Provento form header found but no row matched',
        })
        continue
      }
      rows.push(...eventRows)
    } catch (error) {
      failed.push({
        eventId: event.eventId,
        ticker: event.ticker,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(
    `\nExtraidos ${rows.length} linhas de ${events.length} eventos ` +
      `(${skipped.length} pulados, ${failed.length} com falha).`
  )
// Dedup por (event_id, isin) — mesmo que chave be (event_id, isin)
// unique, upsert da RPC falha se mesma chave aparece 2x no payload
const seenKeys = new Set<string>()
const uniqueRows: ProventoDeclarationValueRowV1[] = []
for (const row of rows) {
  const key = `${row.event_id}|${row.isin}`
  if (seenKeys.has(key)) {
    console.log(`Skipping duplicate (event_id, isin): ${key}`)
    continue
  }
  seenKeys.add(key)
  uniqueRows.push(row)
}
rows = uniqueRows
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

  console.log('\n=== Provento declaration values backfill: result ===')
  console.log(
    JSON.stringify(
      {
        events: events.length,
        rowsExtracted: rows.length,
        rowsUpserted: upserted,
        skipped,
        failed,
      },
      null,
      2
    )
  )
}

main().catch((error: unknown) => {
  console.error('Provento declaration values backfill failed:', error)
  process.exitCode = 1
})
