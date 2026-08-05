// Verificação operacional pontual do job agendado de mercado (Sprint 12,
// DEC-071). Não é chamado por nenhum fluxo do app, não roda em CI e não é
// agendado — é para rodar manualmente quando quiser confirmar que
// refresh-market-data-hourly está vivo.
//
// Limite conhecido, documentado para não vender confiança que a checagem não
// tem: cron.job_run_details.status = 'succeeded' significa que o pg_net
// entregou a chamada HTTP e recebeu resposta — não que a lógica interna da
// Edge Function funcionou. Uma falha real vira log estruturado
// ('refresh-market-data-failed') dentro da própria função, não aqui. Este
// script cobre "o cron está rodando", não "o resultado de cada execução foi
// bom" — para isso, ver os logs da Edge Function no painel do Supabase.
//
// Variáveis de ambiente obrigatórias (nunca commitar; use um arquivo local
// coberto por .gitignore, ex.: .env.server.local):
//   SUPABASE_URL                URL do projeto real
//   SUPABASE_SERVICE_ROLE_KEY   service_role key — a função RPC só concede
//                                execute para service_role, de propósito
//
// Uso:
//   node --env-file=.env.server.local scripts/check-health.mjs
//   (ou npm run check:health, se as variáveis já estiverem no ambiente)

import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const MAX_MINUTES_SINCE_LAST_RUN = 90 // 60 min de agenda + 30 min de folga

function requireEnvironment(name) {
  const value = process.env[name]

  if (!value) {
    console.error(`Variável de ambiente obrigatória ausente: ${name}`)
    process.exit(1)
  }

  return value
}

async function main() {
  const supabaseUrl = requireEnvironment('SUPABASE_URL')
  const serviceRoleKey = requireEnvironment('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await client.rpc('check_market_data_health_v1')

  if (error) {
    console.error('Não foi possível consultar a saúde do job agendado.')
    console.error(error.message)
    process.exit(1)
  }

  const problems = []

  if (!data.job_exists) {
    problems.push(`Job '${data.job_name}' não existe no pg_cron.`)
  } else if (!data.job_active) {
    problems.push(`Job '${data.job_name}' existe mas está desativado.`)
  }

  if (data.runs_checked === 0) {
    problems.push('Nenhuma execução registrada ainda.')
  } else {
    if (
      data.minutes_since_last_run !== null &&
      data.minutes_since_last_run > MAX_MINUTES_SINCE_LAST_RUN
    ) {
      problems.push(
        `Última execução há ${data.minutes_since_last_run} minutos ` +
          `(esperado no máximo ${MAX_MINUTES_SINCE_LAST_RUN}). O cron parece ` +
          'ter parado de disparar.'
      )
    }

    if (data.failed_count > 0) {
      problems.push(
        `${data.failed_count} de ${data.runs_checked} execuções recentes ` +
          "não retornaram 'succeeded' no nível do pg_net."
      )
    }
  }

  console.log(JSON.stringify(data, null, 2))
  console.log(
    '\nLembrete: "succeeded" aqui é o pg_net, não a lógica interna da ' +
      'função — confira os logs da Edge Function para falha real.'
  )

  if (problems.length > 0) {
    console.error('\nProblemas encontrados:')
    for (const problem of problems) {
      console.error(`  - ${problem}`)
    }
    process.exit(1)
  }

  console.log('\nOK — job agendado rodando dentro do esperado.')
}

main().catch((error) => {
  console.error('Falha inesperada ao executar a checagem de saúde.')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
