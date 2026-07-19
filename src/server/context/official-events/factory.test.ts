import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'

import {
  createFixtureCsv,
  createFixtureRow,
  encodeWindows1252 as encodeIpe,
} from '../../../data/context/official-events/cvm/ipe/testFixtures'
import {
  createFundDeliveryFixtureCsv,
  createFundDeliveryFixtureRow,
  encodeWindows1252 as encodeFund,
} from '../../../data/context/official-events/cvm/fund-delivery/testFixtures'
import {
  createFilingDetailHtml,
  createSubmissionsJson,
  TEST_IDENTITIES,
} from '../../../data/context/official-events/sec/edgar/testFixtures'
import type { OfficialAssetEventsSupabaseRpcClientV1 } from '../../../data/context/official-events/storage'
import { createOfficialEventsServerExecutorV1 } from './factory'
import type {
  OfficialEventsFetchImplV1,
  OfficialEventsFetchResponseV1,
} from './safeFetch'

function bytesResponse(bytes: Uint8Array): OfficialEventsFetchResponseV1 {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
  }
}

function textResponse(text: string): OfficialEventsFetchResponseV1 {
  return bytesResponse(new TextEncoder().encode(text))
}

function rpcClient(): OfficialAssetEventsSupabaseRpcClientV1 {
  return {
    async rpc(_functionName, args) {
      const items = args.input_batch.map(({ inputIndex, record }) => ({
        inputIndex,
        eventId: record.event_id,
        deduplicationKey: record.deduplication_key,
        disposition: 'inserted',
        previousUpdatedAt: null,
        storedUpdatedAt: record.updated_at,
        conflictReason: null,
        duplicateOfInputIndex: null,
      }))
      return {
        data: {
          attempted: items.length,
          inserted: items.length,
          updated: 0,
          unchanged: 0,
          staleIgnored: 0,
          conflicts: 0,
          items,
        },
        error: null,
      }
    },
  }
}

describe('official events server factory', () => {
  it('composes all real providers, secure fetch and injected RPC adapter', async () => {
    const ipeArchive = zipSync({
      'ipe_cia_aberta_2026.csv': encodeIpe(
        createFixtureCsv([createFixtureRow()])
      ),
    })
    const fundArchive = zipSync({
      'fi_entrega_documento_202607.csv': encodeFund(
        createFundDeliveryFixtureCsv([createFundDeliveryFixtureRow()])
      ),
      'fi_entrega_documento_diario_202607.csv': encodeFund(
        createFundDeliveryFixtureCsv([createFundDeliveryFixtureRow()])
      ),
    })
    const fetchImpl: OfficialEventsFetchImplV1 = vi.fn(async (url, init) => {
      expect(init.redirect).toBe('manual')
      if (url.includes('ipe_cia_aberta_2026.zip'))
        return bytesResponse(ipeArchive)
      if (url.includes('fi_entrega_documento_202607.zip'))
        return bytesResponse(fundArchive)
      const submissionIndex = TEST_IDENTITIES.findIndex((identity) =>
        url.includes(`CIK${identity.cik}.json`)
      )
      if (submissionIndex >= 0)
        return textResponse(createSubmissionsJson(submissionIndex))
      const detailIndex = TEST_IDENTITIES.findIndex((identity) =>
        url.includes(identity.cik)
      )
      if (detailIndex >= 0) {
        const accession = `${TEST_IDENTITIES[detailIndex].cik}-26-000001`
        return textResponse(
          createFilingDetailHtml(
            accession,
            TEST_IDENTITIES[detailIndex].seriesId,
            TEST_IDENTITIES[detailIndex].classContractId
          )
        )
      }
      throw new Error('Unexpected fixture URL')
    })
    const client = rpcClient()
    const rpc = vi.spyOn(client, 'rpc')
    let second = 0
    const executor = createOfficialEventsServerExecutorV1({
      rpcClient: client,
      fetchImpl,
      secUserAgent: 'Papo de Futuro test@example.com',
      now: () =>
        `2026-07-19T12:00:${String(second++).padStart(2, '0')}.123456789Z`,
    })

    const result = await executor.execute([
      { jobId: 'ipe', provider: 'cvm-ipe', year: 2026 },
      {
        jobId: 'fund',
        provider: 'cvm-fund-delivery',
        year: 2026,
        month: 7,
      },
      {
        jobId: 'sec',
        provider: 'sec-edgar',
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
      },
    ])

    expect(result.jobs.map((job) => job.status)).toEqual([
      'succeeded',
      'succeeded',
      'succeeded',
    ])
    expect(result.jobs.map((job) => job.provider)).toEqual([
      'cvm-ipe',
      'cvm-fund-delivery',
      'sec-edgar',
    ])
    expect(result.totalFetchedEvents).toBe(5)
    expect(rpc).toHaveBeenCalledTimes(3)
    expect(fetchImpl).toHaveBeenCalledTimes(8)
  })

  it('rejects an invalid SEC User-Agent before any network or RPC', () => {
    const fetchImpl = vi.fn(async () => textResponse('{}'))
    const client = rpcClient()
    const rpc = vi.spyOn(client, 'rpc')
    expect(() =>
      createOfficialEventsServerExecutorV1({
        rpcClient: client,
        fetchImpl,
        secUserAgent: 'invalid',
        now: () => '2026-07-19T12:00:00Z',
      })
    ).toThrow(/User-Agent/)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
})
