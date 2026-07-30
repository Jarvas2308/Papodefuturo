import { createFundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import type { FundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import type { FundamentalsUiDependenciesV1 } from './types'

// Ativado em produção em 30/07/2026 (DEC-060), mesmo padrão de DEC-041/042
// para eventos oficiais, após fundamental_snapshots ter dado real (21 linhas).
export const FUNDAMENTALS_REAL_UI_MODE: 'disabled' | 'read-only' = 'read-only'

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
