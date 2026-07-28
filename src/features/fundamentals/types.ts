import type {
  FundamentalsDossierV1,
  FundamentalsRuntimeV1,
} from '../../application/context/fundamentals/runtime'

export type FundamentalsUiDependenciesV1 = {
  runtime: FundamentalsRuntimeV1
}

export type FundamentalsDossierStatusV1 =
  | 'idle'
  | 'loading'
  | 'disabled'
  | 'authentication-required'
  | 'not-ready'
  | 'failed'
  | 'succeeded'

export type FundamentalsDossierStateV1 =
  | {
      status: Exclude<FundamentalsDossierStatusV1, 'succeeded'>
      dossier: null
    }
  | { status: 'succeeded'; dossier: FundamentalsDossierV1 }
