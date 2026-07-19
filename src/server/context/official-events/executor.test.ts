import { describe, expect, it, vi } from 'vitest'

import { createInMemoryOfficialAssetEventStorageV1 } from '../../../data/context/official-events/storage/inMemoryReference'
import { createStorageTestEvent } from '../../../data/context/official-events/storage/testFixtures'
import type { OfficialAssetEventStorageV1 } from '../../../data/context/official-events/storage'
import type { CvmFundDeliveryFiiEventsExtractionResultV1 } from '../../../data/context/official-events/cvm/fund-delivery'
import type { CvmIpeStockEventsExtractionResultV1 } from '../../../data/context/official-events/cvm/ipe'
import type { SecEdgarEtfEventResultV1 } from '../../../data/context/official-events/sec/edgar'
import { createOfficialEventsServerExecutorCoreV1 } from './executor'
import type {
  OfficialEventsProviderRunnersV1,
  OfficialEventsServerJobV1,
} from './types'

const TIMES = Array.from(
  { length: 20 },
  (_, index) => `2026-07-19T12:00:${String(index).padStart(2, '0')}.123456789Z`
)

function ipeResult(): CvmIpeStockEventsExtractionResultV1 {
  return {
    providerVersion: 'cvm-ipe-stock-events-provider.v1',
    source: 'cvm-ipe',
    year: 2026,
    archiveUrl: 'https://dados.cvm.gov.br/ipe.zip',
    archiveFileName: 'ipe.zip',
    csvFileName: 'ipe.csv',
    totalRows: 2,
    ignoredNonUniverseRows: 0,
    targetRows: 2,
    acceptedRows: 1,
    exactDuplicateRows: 0,
    conflictingPayloadRows: 0,
    events: [createStorageTestEvent()],
    duplicates: [],
    conflicts: [],
    rejectedRows: [
      {
        rowNumber: 2,
        cvmCode: '001023',
        ticker: 'BBAS3',
        protocolNumber: null,
        category: null,
        reason: 'unsupported-category',
        message: 'Categoria não suportada',
      },
    ],
  }
}

function fundResult(): CvmFundDeliveryFiiEventsExtractionResultV1 {
  return {
    providerVersion: 'cvm-fund-delivery-fii-events-provider.v1',
    source: 'cvm-fund-delivery',
    year: 2026,
    month: 7,
    referenceMonth: '2026-07',
    archiveUrl: 'https://dados.cvm.gov.br/fund.zip',
    archiveFileName: 'fund.zip',
    csvFileName: 'fund.csv',
    totalRows: 1,
    ignoredNonUniverseRows: 0,
    targetRows: 1,
    acceptedRows: 1,
    exactDuplicateRows: 0,
    conflictingPayloadRows: 0,
    events: [
      createStorageTestEvent({
        ticker: 'KNRI11',
        source: 'cvm-fund-delivery',
        documentId: 'cvm-fund-delivery:document-2',
      }),
    ],
    duplicates: [],
    conflicts: [],
    rejectedRows: [],
  }
}

function secResult(): SecEdgarEtfEventResultV1 {
  return {
    providerVersion: 'sec-edgar-etf-events-provider.v1',
    source: 'sec-edgar',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
    requestCount: 2,
    submissionsRequestCount: 1,
    detailRequestCount: 1,
    cacheHitCount: 0,
    totalFilings: 1,
    ignoredUnsupportedFormFilings: 0,
    candidateFilings: 1,
    ignoredNonTargetIdentityFilings: 0,
    matchedTargetFilings: 1,
    acceptedFilings: 1,
    exactDuplicateFilings: 0,
    conflictingPayloadFilings: 0,
    events: [
      createStorageTestEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        documentId: '0000036405-26-000001',
      }),
    ],
    duplicates: [],
    conflicts: [],
    rejectedFilings: [],
  }
}

function providers(): OfficialEventsProviderRunnersV1 {
  return {
    cvmIpe: vi.fn(async () => ipeResult()),
    cvmFundDelivery: vi.fn(async () => fundResult()),
    secEdgar: vi.fn(async () => secResult()),
  }
}

function clock() {
  let index = 0
  return () => TIMES[index++]
}

const JOBS: readonly OfficialEventsServerJobV1[] = [
  { jobId: 'ipe-2026', provider: 'cvm-ipe', year: 2026 },
  {
    jobId: 'fund-2026-07',
    provider: 'cvm-fund-delivery',
    year: 2026,
    month: 7,
  },
  {
    jobId: 'sec-2026',
    provider: 'sec-edgar',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  },
]

describe('official events server executor V1', () => {
  it('runs all providers in order and preserves counters and rejections', async () => {
    const executor = createOfficialEventsServerExecutorCoreV1({
      providers: providers(),
      storage: createInMemoryOfficialAssetEventStorageV1(),
      now: clock(),
    })
    const result = await executor.execute(JOBS)
    expect(result).toMatchObject({
      executionVersion: 'official-events-server-execution.v1',
      totalJobs: 3,
      succeededJobs: 3,
      failedJobs: 0,
      conflictJobs: 0,
      totalFetchedEvents: 3,
      totalPersistedAttempts: 3,
    })
    expect(result.jobs.map((job) => job.jobId)).toEqual(
      JOBS.map((job) => job.jobId)
    )
    expect(result.jobs[0]).toMatchObject({
      rejectedItemCount: 1,
      providerCounters: { provider: 'cvm-ipe', acceptedRows: 1 },
    })
  })

  it('uses the same injected job timestamp for ingestedAt and updatedAt', async () => {
    const runners = providers()
    const executor = createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage: createInMemoryOfficialAssetEventStorageV1(),
      now: clock(),
    })
    await executor.execute([JOBS[0]])
    expect(runners.cvmIpe).toHaveBeenCalledWith({
      year: 2026,
      ingestedAt: TIMES[1],
      updatedAt: TIMES[1],
    })
  })

  it('isolates provider failures and does not call storage for that job', async () => {
    const runners = providers()
    vi.mocked(runners.cvmIpe).mockRejectedValueOnce(new Error('secret payload'))
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const upsert = vi.spyOn(storage, 'upsertMany')
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage,
      now: clock(),
    }).execute(JOBS)
    expect(result.jobs.map((job) => job.status)).toEqual([
      'failed',
      'succeeded',
      'succeeded',
    ])
    expect(result.jobs[0].error).toEqual({
      category: 'provider',
      code: 'provider-failed',
      message: 'Official event provider failed',
    })
    expect(JSON.stringify(result)).not.toContain('secret payload')
    expect(upsert).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['cvm-fund-delivery', 1],
    ['sec-edgar', 2],
  ] as const)(
    'isolates a %s provider failure',
    async (provider, failedIndex) => {
      const runners = providers()
      if (provider === 'cvm-fund-delivery')
        vi.mocked(runners.cvmFundDelivery).mockRejectedValueOnce(
          new Error('private failure detail')
        )
      else
        vi.mocked(runners.secEdgar).mockRejectedValueOnce(
          new Error('private failure detail')
        )
      const result = await createOfficialEventsServerExecutorCoreV1({
        providers: runners,
        storage: createInMemoryOfficialAssetEventStorageV1(),
        now: clock(),
      }).execute(JOBS)
      expect(result.failedJobs).toBe(1)
      expect(result.jobs[failedIndex].status).toBe('failed')
      expect(
        result.jobs.filter((_, index) => index !== failedIndex)
      ).toHaveLength(2)
      expect(result.jobs.filter((_, index) => index !== failedIndex)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'succeeded' }),
        ])
      )
    }
  )

  it('isolates persistence failures and continues later jobs', async () => {
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const original = storage.upsertMany.bind(storage)
    let calls = 0
    storage.upsertMany = async (records) => {
      calls += 1
      if (calls === 1) throw new Error('database details')
      return original(records)
    }
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: providers(),
      storage,
      now: clock(),
    }).execute(JOBS)
    expect(result.jobs.map((job) => job.status)).toEqual([
      'failed',
      'succeeded',
      'succeeded',
    ])
    expect(result.jobs[0].error?.category).toBe('persistence')
  })

  it('reports canonical persistence conflicts without stopping', async () => {
    const conflictStorage: OfficialAssetEventStorageV1 = {
      async upsertMany(records) {
        return {
          attempted: records.length,
          inserted: 0,
          updated: 0,
          unchanged: 0,
          staleIgnored: 0,
          conflicts: records.length,
          items: records.map((record, inputIndex) => ({
            inputIndex,
            eventId: record.eventId,
            deduplicationKey: record.deduplicationKey,
            disposition: 'conflict' as const,
            previousUpdatedAt: record.updatedAt,
            storedUpdatedAt: record.updatedAt,
            conflictReason: 'same-version-payload-divergence' as const,
            duplicateOfInputIndex: null,
          })),
        }
      },
    }
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: providers(),
      storage: conflictStorage,
      now: clock(),
    }).execute(JOBS.slice(0, 2))
    expect(result.conflictJobs).toBe(2)
    expect(result.jobs.map((job) => job.status)).toEqual([
      'conflict',
      'conflict',
    ])
  })

  it('is idempotent through the canonical storage facade', async () => {
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const executor = createOfficialEventsServerExecutorCoreV1({
      providers: providers(),
      storage,
      now: clock(),
    })
    expect(
      (await executor.execute([JOBS[0]])).jobs[0].persistenceResult?.inserted
    ).toBe(1)
    expect(
      (await executor.execute([JOBS[0]])).jobs[0].persistenceResult?.unchanged
    ).toBe(1)
  })

  it('accepts an empty job list without side effects', async () => {
    const runners = providers()
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage: createInMemoryOfficialAssetEventStorageV1(),
      now: clock(),
    }).execute([])
    expect(result.totalJobs).toBe(0)
    expect(runners.cvmIpe).not.toHaveBeenCalled()
  })

  it('represents a successful provider result without events or storage calls', async () => {
    const runners = providers()
    vi.mocked(runners.cvmIpe).mockResolvedValueOnce({
      ...ipeResult(),
      totalRows: 0,
      targetRows: 0,
      acceptedRows: 0,
      events: [],
      rejectedRows: [],
    })
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const upsert = vi.spyOn(storage, 'upsertMany')
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage,
      now: clock(),
    }).execute([JOBS[0]])
    expect(result.jobs[0]).toMatchObject({
      status: 'succeeded',
      fetchedEventCount: 0,
      persistenceResult: { attempted: 0 },
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects malformed provider counters without persistence', async () => {
    const runners = providers()
    vi.mocked(runners.cvmIpe).mockResolvedValueOnce({
      ...ipeResult(),
      totalRows: -0,
    })
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const upsert = vi.spyOn(storage, 'upsertMany')
    const result = await createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage,
      now: clock(),
    }).execute([JOBS[0]])
    expect(result.jobs[0].error).toEqual({
      category: 'contract',
      code: 'provider-contract-invalid',
      message: 'Official event provider returned an invalid contract',
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it.each([
    [[{ jobId: '', provider: 'cvm-ipe', year: 2026 }], /jobId/],
    [[...JOBS, JOBS[0]], /unique/],
    [[{ jobId: 'x', provider: 'unknown', year: 2026 }], /unsupported/],
    [
      [
        {
          jobId: 'x',
          provider: 'cvm-ipe',
          year: 2026,
          url: 'https://evil.test',
        },
      ],
      /unsupported fields/,
    ],
    [
      [{ jobId: 'x', provider: 'cvm-fund-delivery', year: 2026, month: 13 }],
      /month/,
    ],
    [
      [
        {
          jobId: 'x',
          provider: 'sec-edgar',
          fromDate: '2026-02-30',
          toDate: '2026-03-01',
        },
      ],
      /civil date/,
    ],
    [
      [
        {
          jobId: 'x',
          provider: 'sec-edgar',
          fromDate: '2026-03-02',
          toDate: '2026-03-01',
        },
      ],
      /after/,
    ],
  ])('rejects malformed jobs before effects', async (jobs, expected) => {
    const runners = providers()
    const executor = createOfficialEventsServerExecutorCoreV1({
      providers: runners,
      storage: createInMemoryOfficialAssetEventStorageV1(),
      now: clock(),
    })
    await expect(
      executor.execute(jobs as readonly OfficialEventsServerJobV1[])
    ).rejects.toThrow(expected as RegExp)
    expect(runners.cvmIpe).not.toHaveBeenCalled()
  })

  it('rejects sparse jobs and invalid clock values', async () => {
    const sparse = Array<OfficialEventsServerJobV1>(1)
    const executor = createOfficialEventsServerExecutorCoreV1({
      providers: providers(),
      storage: createInMemoryOfficialAssetEventStorageV1(),
      now: () => '2026-07-19T24:00:00Z',
    })
    await expect(executor.execute(sparse)).rejects.toThrow(/dense/)
    await expect(executor.execute([])).rejects.toThrow(/canonical UTC/)
  })
})
