import { buildFundamentalFactsV1 } from '../../../../domain/fundamentals'
import { buildFundamentalDerivedFactsV1 } from '../../../../domain/fundamentals/derived'
import {
  assertFundamentalsRuntimeClockMonotonicV1,
  readFundamentalsRuntimeClockV1,
} from './clock'
import {
  FUNDAMENTALS_RUNTIME_V1_VERSION,
  type CreateFundamentalsRuntimeV1Input,
  type FundamentalsDossierV1,
  type FundamentalsRuntimeAccessStateV1,
  type FundamentalsRuntimeCapabilityV1,
  type FundamentalsRuntimeErrorV1,
  type FundamentalsRuntimeOperationResultV1,
  type FundamentalsRuntimeV1,
} from './types'

function runtimeError(
  code: FundamentalsRuntimeErrorV1['code'],
  message: string
): FundamentalsRuntimeErrorV1 {
  return { code, message }
}

/**
 * As tres repositories de leitura de fundamentos (supabaseFundamentalSnapshots.ts,
 * supabaseRealEstateFundSnapshots.ts, supabaseInternationalEtfSnapshots.ts) e o
 * AssetRepository lancam Error/RangeError simples, sem preservar o codigo
 * Postgrest original (diferente do repository de eventos oficiais). Por isso,
 * ao contrario do runtime de eventos, este runtime nao distingue
 * "schema-unavailable" de "repository-unavailable": qualquer falha de leitura
 * ou de contrato do dominio vira 'failed'/'unexpected-failure' ou
 * 'contract-violation' quando a causa e' um erro de validacao do dominio
 * (buildFundamentalFactsV1/buildFundamentalDerivedFactsV1).
 */
function classifyError(error: unknown): {
  status: 'failed'
  error: FundamentalsRuntimeErrorV1
} {
  if (error instanceof RangeError || error instanceof Error) {
    return {
      status: 'failed',
      error: runtimeError(
        'contract-violation',
        'Fundamentals runtime received invalid data from a repository'
      ),
    }
  }
  return {
    status: 'failed',
    error: runtimeError(
      'unexpected-failure',
      'Fundamentals runtime operation failed'
    ),
  }
}

function capability(
  mode: 'disabled' | 'read-only',
  accessState: FundamentalsRuntimeAccessStateV1 | null
): FundamentalsRuntimeCapabilityV1 {
  const reason =
    mode === 'disabled'
      ? 'disabled'
      : accessState === 'authenticated'
        ? 'available'
        : accessState === 'unauthenticated'
          ? 'authentication-required'
          : 'not-ready'
  return {
    runtimeVersion: FUNDAMENTALS_RUNTIME_V1_VERSION,
    mode,
    accessState,
    canRead: reason === 'available',
    reason,
  }
}

export function createFundamentalsRuntimeV1(
  input: CreateFundamentalsRuntimeV1Input
): FundamentalsRuntimeV1 {
  let knownAccessState: FundamentalsRuntimeAccessStateV1 | null =
    input.mode === 'disabled' ? null : 'unresolved'

  async function execute(
    operation: () => Promise<FundamentalsDossierV1>
  ): Promise<FundamentalsRuntimeOperationResultV1<FundamentalsDossierV1>> {
    const started = readFundamentalsRuntimeClockV1(input.now)
    let outcome:
      | { status: 'succeeded'; data: FundamentalsDossierV1; error: null }
      | {
          status: 'disabled' | 'authentication-required'
          data: null
          error: null
        }
      | {
          status: 'not-ready' | 'failed'
          data: null
          error: FundamentalsRuntimeErrorV1
        }
      | undefined

    if (input.mode === 'disabled') {
      outcome = { status: 'disabled', data: null, error: null }
    } else {
      let accessState: unknown
      try {
        accessState = await input.getAccessState()
      } catch {
        knownAccessState = 'unresolved'
        outcome = {
          status: 'not-ready',
          data: null,
          error: runtimeError(
            'access-state-unavailable',
            'Fundamentals access state is unavailable'
          ),
        }
      }
      if (outcome === undefined) {
        if (
          accessState !== 'authenticated' &&
          accessState !== 'unauthenticated' &&
          accessState !== 'unresolved'
        ) {
          knownAccessState = 'unresolved'
          outcome = {
            status: 'not-ready',
            data: null,
            error: runtimeError(
              'access-state-invalid',
              'Fundamentals access state is invalid'
            ),
          }
        } else {
          knownAccessState = accessState
          if (accessState === 'unauthenticated') {
            outcome = {
              status: 'authentication-required',
              data: null,
              error: null,
            }
          } else if (accessState === 'unresolved') {
            outcome = {
              status: 'not-ready',
              data: null,
              error: runtimeError(
                'access-state-unavailable',
                'Fundamentals access state is not resolved'
              ),
            }
          } else {
            try {
              outcome = {
                status: 'succeeded',
                data: await operation(),
                error: null,
              }
            } catch (error) {
              const classified = classifyError(error)
              outcome = { ...classified, data: null }
            }
          }
        }
      }
    }

    const completed = readFundamentalsRuntimeClockV1(input.now)
    assertFundamentalsRuntimeClockMonotonicV1(started.order, completed.order)
    if (outcome === undefined) {
      throw new Error('Fundamentals runtime outcome was not resolved')
    }
    return {
      runtimeVersion: FUNDAMENTALS_RUNTIME_V1_VERSION,
      startedAt: started.value,
      completedAt: completed.value,
      ...outcome,
    } as FundamentalsRuntimeOperationResultV1<FundamentalsDossierV1>
  }

  return {
    getCapability() {
      return capability(input.mode, knownAccessState)
    },
    getDossier() {
      return execute(async () => {
        if (input.mode === 'disabled') {
          throw new Error('Disabled runtime does not execute operations')
        }
        const { repository } = input
        const assets = await repository.listAssets()
        const [stocks, realEstateFunds, internationalEtfs] = await Promise.all([
          repository.listBrazilianStockSnapshots(assets),
          repository.listRealEstateFundSnapshots(assets),
          repository.listInternationalEtfSnapshots(assets),
        ])
        const generatedAt = readFundamentalsRuntimeClockV1(input.now).value
        const facts = buildFundamentalFactsV1({
          generatedAt,
          assets,
          snapshots: [...stocks, ...realEstateFunds, ...internationalEtfs],
        })
        const derived = buildFundamentalDerivedFactsV1(facts)
        return { facts, derived }
      })
    },
  }
}
