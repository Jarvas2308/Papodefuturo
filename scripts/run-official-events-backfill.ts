// Runner manual e pontual para o backfill gradual de eventos oficiais
// (docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md, secao 18).
//
// Generaliza scripts/run-official-events-backfill-canary.ts (preservado como
// evidencia de DEC-040, que cobria apenas CVM Fund Delivery de um mes fixo).
// Este runner aceita qualquer um dos tres providers oficiais via CLI, mas
// mantem a mesma disciplina do canario: um job por execucao, preview sempre
// primeiro, escrita real somente com --confirm.
//
// Nao e chamado por nenhum fluxo do app, nao roda em CI e nao e agendado.
//
// Variaveis de ambiente obrigatorias em --confirm (nunca commitar; use um
// arquivo local coberto por .gitignore, ex.: .env.server.local):
//   SUPABASE_URL                    URL do projeto real (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY       service_role key do projeto real
//   OFFICIAL_EVENTS_CONTACT_EMAIL   email de contato exigido no User-Agent SEC
//
// Uso (modo preview, nenhuma rede, nenhuma escrita):
//   npx tsx scripts/run-official-events-backfill.ts --provider=cvm-ipe --year=2026
//   npx tsx scripts/run-official-events-backfill.ts --provider=cvm-fund-delivery --month=2026-06
//   npx tsx scripts/run-official-events-backfill.ts --provider=sec-edgar \
//     --from-date=2026-01-01 --to-date=2026-01-31 --window-days=31
//
// Para executar de verdade, acrescente --confirm e carregue as credenciais:
//   node --env-file=.env.server.local --import tsx scripts/run-official-events-backfill.ts \
//     --provider=cvm-ipe --year=2026 --confirm
//
// Escopo fixo, nao configuravel por CLI (runbook secao 18): failureMode "stop",
// retryFailed false, maxAttemptsPerJob 1, maxJobs 1, lease de 300s. O plano em
// si e recusado se descrever mais de um job (ver scripts/lib/buildOfficialEventsBackfillPlan.ts).

import { createClient } from '@supabase/supabase-js'
import { runOfficialEventsBackfillStepV1 } from '../src/server/context/official-events/backfill'
import { createSupabaseOfficialEventsBackfillCheckpointStorageV1 } from '../src/server/context/official-events/backfill/supabaseCheckpoint'
import { createOfficialEventsServerExecutorV1 } from '../src/server/context/official-events/factory'
import { buildOfficialEventsBackfillPlanV1 } from './lib/buildOfficialEventsBackfillPlan'

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
  const argv = process.argv.slice(2)
  const confirmed = argv.includes('--confirm')
  const planArgv = argv.filter((arg) => arg !== '--confirm')

  const { planInput, prepared } = buildOfficialEventsBackfillPlanV1(planArgv)

  console.log('=== Official events gradual backfill: preview ===')
  console.log(
    JSON.stringify(
      {
        planId: prepared.planId,
        planHash: prepared.planHash,
        totalJobs: prepared.totalJobs,
        job: prepared.jobs[0]?.job,
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

  const workerId = `gradual-manual-${nowIso().replace(/[:.]/g, '-')}`

  const result = await runOfficialEventsBackfillStepV1({
    plan: planInput,
    workerId,
    maxJobs: 1,
    leaseDurationSeconds: 300,
    dependencies: {
      checkpointStorage,
      executor,
      now: nowIso,
    },
  })

  console.log('\n=== Official events gradual backfill: result ===')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error: unknown) => {
  console.error('Official events gradual backfill failed:', error)
  process.exitCode = 1
})
