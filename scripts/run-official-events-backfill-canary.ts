// Runner manual e pontual para o canário de backfill real de eventos oficiais
// (docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md, secao 17).
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e agendado. Existe
// apenas para uma execucao supervisionada e autorizada separadamente, contra o
// Supabase real, usando os providers e o orquestrador de backfill ja testados
// em src/server/context/official-events.
//
// Variaveis de ambiente obrigatorias (nunca commitar; use um arquivo local
// coberto por .gitignore, ex.: .env.server.local, com `node --env-file=`):
//   SUPABASE_URL                    URL do projeto real (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY       service_role key do projeto real
//   OFFICIAL_EVENTS_CONTACT_EMAIL   email de contato exigido no User-Agent SEC
//
// Variaveis opcionais:
//   OFFICIAL_EVENTS_CANARY_YEAR     ano do job (padrao 2026)
//   OFFICIAL_EVENTS_CANARY_MONTH    mes do job, 1-12 (padrao 7)
//
// Uso:
//   node --env-file=.env.server.local --import tsx scripts/run-official-events-backfill-canary.ts
// (ou `npx tsx --env-file=.env.server.local scripts/run-official-events-backfill-canary.ts`)
//
// Por padrao roda em modo preview (nenhuma escrita, nenhuma chamada a CVM).
// Passe --confirm para executar de verdade.
//
// Escopo do canario: failureMode "stop", retryFailed false, maxAttemptsPerJob 1,
// maxJobs 1, lease de 300s. O job cobre um unico mes do Informe Mensal CVM Fund
// Delivery, que reporta entregas de documentos para os quatro FIIs do universo
// fechado (KNRI11, VISC11, XPLG11, HGRU11) nesse mes — o job e por mes, nao por
// ativo individual; nao existe forma de restringir a um unico ticker no plano.

import { createClient } from '@supabase/supabase-js'
import {
  OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
  createSupabaseOfficialEventsBackfillCheckpointStorageV1,
  previewOfficialEventsBackfillV1,
  runOfficialEventsBackfillStepV1,
} from '../src/server/context/official-events/backfill'
import { createOfficialEventsServerExecutorV1 } from '../src/server/context/official-events/factory'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function nowIso(): string {
  return new Date().toISOString()
}

async function main(): Promise<void> {
  const confirmed = process.argv.includes('--confirm')

  const year = Number(process.env.OFFICIAL_EVENTS_CANARY_YEAR ?? '2026')
  const month = Number(process.env.OFFICIAL_EVENTS_CANARY_MONTH ?? '7')
  if (!Number.isSafeInteger(year) || !Number.isSafeInteger(month)) {
    throw new Error('OFFICIAL_EVENTS_CANARY_YEAR/MONTH must be integers')
  }
  const monthValue = `${year}-${String(month).padStart(2, '0')}`

  const plan = {
    backfillVersion: OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
    failureMode: 'stop' as const,
    retryFailed: false,
    maxAttemptsPerJob: 1,
    sources: [
      {
        provider: 'cvm-fund-delivery' as const,
        fromMonth: monthValue,
        toMonth: monthValue,
      },
    ],
  }

  const preview = previewOfficialEventsBackfillV1(plan)
  console.log('=== Official events backfill canary: preview ===')
  console.log(JSON.stringify(preview, null, 2))

  if (!confirmed) {
    console.log(
      '\nModo preview (nenhuma chamada de rede, nenhuma escrita). ' +
        'Passe --confirm para executar de verdade contra producao.'
    )
    return
  }

  console.log(
    '\n--confirm recebido. Executando contra producao (rede real a CVM, ' +
      'escrita real no Supabase real).'
  )

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const contactEmail = requireEnv('OFFICIAL_EVENTS_CONTACT_EMAIL')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const executor = createOfficialEventsServerExecutorV1({
    rpcClient: client,
    fetchImpl: fetch,
    secUserAgent: `PapoDeFuturo/1.0 (contact) ${contactEmail}`,
    now: nowIso,
  })

  const checkpointStorage =
    createSupabaseOfficialEventsBackfillCheckpointStorageV1({ client })

  const workerId = `canary-manual-${nowIso().replace(/[:.]/g, '-')}`

  const result = await runOfficialEventsBackfillStepV1({
    plan,
    workerId,
    maxJobs: 1,
    leaseDurationSeconds: 300,
    dependencies: {
      checkpointStorage,
      executor,
      now: nowIso,
    },
  })

  console.log('\n=== Official events backfill canary: result ===')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error: unknown) => {
  console.error('Official events backfill canary failed:', error)
  process.exitCode = 1
})
