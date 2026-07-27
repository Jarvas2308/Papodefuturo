import { createSupabaseOfficialAssetEventReadRepositoryV1 } from '../../../../data/context/official-events/repository'
import { createOfficialEventsRuntimeV1 } from './runtime'
import type {
  CreateSupabaseOfficialEventsRuntimeV1Input,
  OfficialEventsRuntimeV1,
} from './types'

export function createSupabaseOfficialEventsRuntimeV1(
  input: CreateSupabaseOfficialEventsRuntimeV1Input
): OfficialEventsRuntimeV1 {
  if (input.mode === 'disabled') {
    return createOfficialEventsRuntimeV1({
      mode: 'disabled',
      now: input.now,
    })
  }
  return createOfficialEventsRuntimeV1({
    mode: 'read-only',
    repository: createSupabaseOfficialAssetEventReadRepositoryV1({
      client: input.client,
    }),
    getAccessState: input.getAccessState,
    now: input.now,
  })
}
