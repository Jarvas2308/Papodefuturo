import { useEffect, useState } from 'react'
import type { FundamentalsRuntimeV1 } from '../../application/context/fundamentals/runtime'
import type { FundamentalsDossierStateV1 } from './types'

const INITIAL_STATE: FundamentalsDossierStateV1 = {
  status: 'idle',
  dossier: null,
}

function loadFundamentalsDossier(
  runtime: FundamentalsRuntimeV1,
  setState: (state: FundamentalsDossierStateV1) => void
): () => void {
  let active = true
  setState({ status: 'loading', dossier: null })
  void runtime.getDossier().then((result) => {
    if (!active) return
    if (result.status === 'succeeded') {
      setState({ status: 'succeeded', dossier: result.data })
    } else {
      setState({ status: result.status, dossier: null })
    }
  })
  return () => {
    active = false
  }
}

export function useFundamentalsDossierV1(runtime: FundamentalsRuntimeV1) {
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => loadFundamentalsDossier(runtime, setState), [runtime])

  return {
    state,
    reload: () => loadFundamentalsDossier(runtime, setState),
  }
}
