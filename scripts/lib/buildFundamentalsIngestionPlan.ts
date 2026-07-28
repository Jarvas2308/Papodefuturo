// Funcao pura e testavel que converte argumentos de linha de comando em um
// plano de ingestao real de fundamentos, para exatamente um provider por
// execucao (mesma disciplina de scripts/lib/buildOfficialEventsBackfillPlan.ts).
//
// Nao faz rede, nao le env, nao escreve nada. Todo I/O fica no script chamador.

export type FundamentalsIngestionProviderV1 =
  'cvm-stocks' | 'cvm-fii' | 'sec-nport'

export type FundamentalsIngestionPlanV1 =
  | { provider: 'cvm-stocks'; source: 'DFP' | 'ITR'; year: number }
  | { provider: 'cvm-fii'; year: number }
  | { provider: 'sec-nport' }

const SUPPORTED_PROVIDERS: readonly FundamentalsIngestionProviderV1[] = [
  'cvm-stocks',
  'cvm-fii',
  'sec-nport',
]

const SUPPORTED_CVM_SOURCES: readonly ('DFP' | 'ITR')[] = ['DFP', 'ITR']

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
): value is FundamentalsIngestionProviderV1 {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value)
}

function isSupportedCvmSource(value: string): value is 'DFP' | 'ITR' {
  return (SUPPORTED_CVM_SOURCES as readonly string[]).includes(value)
}

/**
 * Constroi o plano a partir de argv (sem "node"/script na frente, apenas os
 * argumentos do usuario, ex.: process.argv.slice(2)). Recusa qualquer argv que
 * nao descreva exatamente um provider: a ingestao real e sempre um provider
 * por execucao.
 */
export function buildFundamentalsIngestionPlanV1(
  argv: readonly string[]
): FundamentalsIngestionPlanV1 {
  const flags = parseFlags(argv)
  const providerRaw = requireFlag(flags, 'provider')
  if (!isSupportedProvider(providerRaw))
    throw new Error(
      `Unsupported --provider. Use one of: ${SUPPORTED_PROVIDERS.join(', ')}`
    )

  if (providerRaw === 'cvm-stocks') {
    const sourceRaw = requireFlag(flags, 'source')
    if (!isSupportedCvmSource(sourceRaw))
      throw new Error(
        `Unsupported --source. Use one of: ${SUPPORTED_CVM_SOURCES.join(', ')}`
      )
    const year = requireIntegerFlag(flags, 'year')
    return { provider: 'cvm-stocks', source: sourceRaw, year }
  }

  if (providerRaw === 'cvm-fii') {
    const year = requireIntegerFlag(flags, 'year')
    return { provider: 'cvm-fii', year }
  }

  return { provider: 'sec-nport' }
}
