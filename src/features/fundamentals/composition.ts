import { createFundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import type { FundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import type { FundamentalsUiDependenciesV1 } from './types'

// Ativação em produção é decisão separada, como foi para eventos oficiais
// (DEC-041). Este PR entrega o runtime e a apresentação; permanece 'disabled'
// até autorização explícita própria.
export const FUNDAMENTALS_REAL_UI_MODE: 'disabled' | 'read-only' = 'disabled'

function defaultDisabledRuntime(): FundamentalsRuntimeV1 {
  return createFundamentalsRuntimeV1({
    mode: 'disabled',
    now: { now: () => new Date().toISOString() },
  })
}

export function createRealFundamentalsUiDependenciesV1(
  runtime?: FundamentalsRuntimeV1
): FundamentalsUiDependenciesV1 {
  return { runtime: runtime ?? defaultDisabledRuntime() }
}
