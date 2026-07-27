import { fetchCvmFundDeliveryFiiEvents } from '../../../data/context/official-events/cvm/fund-delivery'
import { fetchCvmIpeStockEvents } from '../../../data/context/official-events/cvm/ipe'
import { fetchSecEdgarEtfEvents } from '../../../data/context/official-events/sec/edgar'
import { assertSecUserAgent } from '../../../data/context/official-events/sec/edgar/validation'
import {
  createSupabaseOfficialAssetEventStorageV1,
  type OfficialAssetEventsSupabaseRpcClientV1,
} from '../../../data/context/official-events/storage'
import { createOfficialEventsServerExecutorCoreV1 } from './executor'
import {
  createOfficialEventsSafeFetchV1,
  type OfficialEventsFetchImplV1,
} from './safeFetch'
import type { OfficialEventsServerExecutorV1 } from './types'

export function createOfficialEventsServerExecutorV1(input: {
  rpcClient: OfficialAssetEventsSupabaseRpcClientV1
  fetchImpl: OfficialEventsFetchImplV1
  secUserAgent: string
  now: () => string
  timeoutMs?: number
}): OfficialEventsServerExecutorV1 {
  assertSecUserAgent(input.secUserAgent)
  const fetchers = createOfficialEventsSafeFetchV1({
    fetchImpl: input.fetchImpl,
    timeoutMs: input.timeoutMs,
  })
  const storage = createSupabaseOfficialAssetEventStorageV1({
    client: input.rpcClient,
  })
  return createOfficialEventsServerExecutorCoreV1({
    now: input.now,
    storage,
    providers: {
      cvmIpe: (providerInput) =>
        fetchCvmIpeStockEvents({ ...providerInput, fetcher: fetchers.cvm }),
      cvmFundDelivery: (providerInput) =>
        fetchCvmFundDeliveryFiiEvents({
          ...providerInput,
          fetcher: fetchers.cvm,
        }),
      secEdgar: (providerInput) =>
        fetchSecEdgarEtfEvents({
          ...providerInput,
          fetcher: fetchers.sec,
          userAgent: input.secUserAgent,
        }),
    },
  })
}
