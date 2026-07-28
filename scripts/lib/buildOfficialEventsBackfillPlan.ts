// Funcao pura e testavel que converte argumentos de linha de comando em um plano
// de backfill de eventos oficiais valido, contendo exatamente um job.
//
// Runbook OFFICIAL_EVENTS_DEPLOYMENT_V1.md, secao 18: backfill gradual e "um job
// por execucao, com confirmacao manual entre providers". O orquestrador
// (runOfficialEventsBackfillStepV1) ja limita a execucao a maxJobs=1, mas o plano
// em si pode descrever um intervalo com varios jobs. Esta funcao fecha essa lacuna
// recusando qualquer combinacao de argumentos que produza mais de um job.
//
// Nao faz rede, nao le env, nao escreve nada. Todo I/O fica no script chamador.

import {
  OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
  prepareOfficialEventsBackfillPlanV1,
  type OfficialEventsBackfillPlanInputV1,
  type PreparedOfficialEventsBackfillPlanV1,
} from '../../src/server/context/official-events/backfill'

export type OfficialEventsBackfillCliProviderV1 =
  'cvm-ipe' | 'cvm-fund-delivery' | 'sec-edgar'

export type BuildOfficialEventsBackfillPlanResultV1 = {
  planInput: OfficialEventsBackfillPlanInputV1
  prepared: PreparedOfficialEventsBackfillPlanV1
}

const SUPPORTED_PROVIDERS: readonly OfficialEventsBackfillCliProviderV1[] = [
  'cvm-ipe',
  'cvm-fund-delivery',
  'sec-edgar',
]

function parseFlags(argv: readonly string[]): Map<string, string> {
  const flags = new Map<string, string>()
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const withoutPrefix = arg.slice(2)
    const equalsIndex = withoutPrefix.indexOf('=')
    if (equalsIndex === -1) {
      flags.set(withoutPrefix, 'true')
      continue
    }
    flags.set(
      withoutPrefix.slice(0, equalsIndex),
      withoutPrefix.slice(equalsIndex + 1)
    )
  }
  return flags
}

function requireFlag(flags: Map<string, string>, name: string): string {
  const value = flags.get(name)
  if (value === undefined || value.trim().length === 0)
    throw new Error(`Missing required flag: --${name}`)
  return value
}

function requireIntegerFlag(flags: Map<string, string>, name: string): number {
  const raw = requireFlag(flags, name)
  const value = Number(raw)
  if (!Number.isSafeInteger(value))
    throw new Error(`--${name} must be an integer`)
  return value
}

function isSupportedProvider(
  value: string
): value is OfficialEventsBackfillCliProviderV1 {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value)
}

/**
 * Constroi o input de plano a partir de argv (sem "node"/script na frente,
 * apenas os argumentos do usuario, ex.: process.argv.slice(2)).
 */
export function buildOfficialEventsBackfillPlanInputV1(
  argv: readonly string[]
): OfficialEventsBackfillPlanInputV1 {
  const flags = parseFlags(argv)
  const providerRaw = requireFlag(flags, 'provider')
  if (!isSupportedProvider(providerRaw))
    throw new Error(
      `Unsupported --provider. Use one of: ${SUPPORTED_PROVIDERS.join(', ')}`
    )

  if (providerRaw === 'cvm-ipe') {
    const year = requireIntegerFlag(flags, 'year')
    return {
      backfillVersion: OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
      failureMode: 'stop',
      retryFailed: false,
      maxAttemptsPerJob: 1,
      sources: [{ provider: 'cvm-ipe', fromYear: year, toYear: year }],
    }
  }

  if (providerRaw === 'cvm-fund-delivery') {
    const month = requireFlag(flags, 'month')
    return {
      backfillVersion: OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
      failureMode: 'stop',
      retryFailed: false,
      maxAttemptsPerJob: 1,
      sources: [
        { provider: 'cvm-fund-delivery', fromMonth: month, toMonth: month },
      ],
    }
  }

  const fromDate = requireFlag(flags, 'from-date')
  const toDate = requireFlag(flags, 'to-date')
  const windowDays = requireIntegerFlag(flags, 'window-days')
  return {
    backfillVersion: OFFICIAL_EVENTS_BACKFILL_PLAN_V1_VERSION,
    failureMode: 'stop',
    retryFailed: false,
    maxAttemptsPerJob: 1,
    sources: [{ provider: 'sec-edgar', fromDate, toDate, windowDays }],
  }
}

/**
 * Constroi e prepara o plano, recusando qualquer argv que descreva mais de um
 * job. Runbook secao 18 exige um job por execucao; o orquestrador ja limita
 * maxJobs=1, mas o plano precisa declarar exatamente um job para que o operador
 * saiba, no preview, exatamente o que sera executado.
 */
export function buildOfficialEventsBackfillPlanV1(
  argv: readonly string[]
): BuildOfficialEventsBackfillPlanResultV1 {
  const planInput = buildOfficialEventsBackfillPlanInputV1(argv)
  const prepared = prepareOfficialEventsBackfillPlanV1(planInput)
  if (prepared.totalJobs !== 1)
    throw new Error(
      `O plano descreve ${prepared.totalJobs} jobs; a execucao gradual exige exatamente 1. ` +
        'Restrinja o intervalo (ano, mes ou janela de datas) para produzir um unico job.'
    )
  return { planInput, prepared }
}
