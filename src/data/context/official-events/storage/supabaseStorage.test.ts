import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1,
  OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1,
  OfficialAssetEventStorageBatchConflictError,
  OfficialAssetEventsSupabaseAdapterErrorV1,
  createSupabaseOfficialAssetEventStorageV1,
  fromOfficialAssetEventSupabaseRowV1,
  persistOfficialAssetEventsV1,
  toOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventSupabaseRowV1,
  type OfficialAssetEventStorageConflictReasonV1,
  type OfficialAssetEventStorageDispositionV1,
  type OfficialAssetEventStorageRecordV1,
  type OfficialAssetEventsSupabaseRpcBatchItemV1,
  type OfficialAssetEventsSupabaseRpcClientV1,
} from './index'
import { createStorageTestEvent } from './testFixtures'

type RpcResponse = { data: unknown; error: unknown }
type RpcCall = {
  functionName: typeof OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1
  inputBatch: readonly OfficialAssetEventsSupabaseRpcBatchItemV1[]
}

function createClient(
  respond: (call: RpcCall) => RpcResponse | Promise<RpcResponse>
): {
  client: OfficialAssetEventsSupabaseRpcClientV1
  calls: RpcCall[]
} {
  const calls: RpcCall[] = []
  return {
    calls,
    client: {
      async rpc(functionName, args) {
        const call = { functionName, inputBatch: args.input_batch }
        calls.push(call)
        return respond(call)
      },
    },
  }
}

function createRecord(
  documentId = 'cvm-ipe:document-1'
): OfficialAssetEventStorageRecordV1 {
  return toOfficialAssetEventStorageRecordV1(
    createStorageTestEvent({ documentId })
  )
}

function createRpcItem(
  record: OfficialAssetEventStorageRecordV1,
  inputIndex: number,
  disposition: OfficialAssetEventStorageDispositionV1
) {
  const previousUpdatedAt =
    disposition === 'inserted'
      ? null
      : disposition === 'stale-ignored'
        ? '2026-07-18T15:00:00Z'
        : disposition === 'updated'
          ? '2026-07-18T13:00:00Z'
          : record.updatedAt
  const conflictReason: OfficialAssetEventStorageConflictReasonV1 | null =
    disposition === 'conflict' ? 'immutable-identity-change' : null
  return {
    inputIndex,
    eventId: record.eventId,
    deduplicationKey: record.deduplicationKey,
    disposition,
    previousUpdatedAt,
    storedUpdatedAt:
      disposition === 'inserted' || disposition === 'updated'
        ? record.updatedAt
        : previousUpdatedAt,
    conflictReason,
    duplicateOfInputIndex: null,
  }
}

function createRpcResult(
  records: readonly OfficialAssetEventStorageRecordV1[],
  dispositions: readonly OfficialAssetEventStorageDispositionV1[] = records.map(
    () => 'inserted'
  )
) {
  const items = records.map((record, index) =>
    createRpcItem(record, index, dispositions[index])
  )
  return {
    attempted: records.length,
    inserted: items.filter((item) => item.disposition === 'inserted').length,
    updated: items.filter((item) => item.disposition === 'updated').length,
    unchanged: items.filter((item) => item.disposition === 'unchanged').length,
    staleIgnored: items.filter((item) => item.disposition === 'stale-ignored')
      .length,
    conflicts: items.filter((item) => item.disposition === 'conflict').length,
    items,
  }
}

function containsUndefined(value: unknown): boolean {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object') return false
  return Object.values(value).some(containsUndefined)
}

async function expectMalformedResponse(
  data: unknown,
  records: readonly OfficialAssetEventStorageRecordV1[] = [createRecord()]
) {
  const { client } = createClient(() => ({ data, error: null }))
  const storage = createSupabaseOfficialAssetEventStorageV1({ client })
  await expect(storage.upsertMany(records)).rejects.toMatchObject({
    kind: 'malformed-response',
  })
}

describe('mapping Supabase de official_asset_events', () => {
  it('mapeia os 58 campos de ação, FII e ETF sem perda', () => {
    const records = [
      createRecord(),
      toOfficialAssetEventStorageRecordV1(
        createStorageTestEvent({
          ticker: 'KNRI11',
          source: 'cvm-fund-delivery',
          documentId: 'CVM:FII:123',
          occurredAt: { precision: 'minute', value: '2026-07-18T10:08-03:00' },
        })
      ),
      toOfficialAssetEventStorageRecordV1(
        createStorageTestEvent({
          ticker: 'VOO',
          source: 'sec-edgar',
          documentId: '0000036405-26-000001',
          occurredAt: {
            precision: 'second',
            value: '2026-07-18T13:08:55.123456789Z',
          },
        })
      ),
      toOfficialAssetEventStorageRecordV1(
        createStorageTestEvent({
          documentId: 'cvm-ipe:document-without-occurrence',
          occurredAt: null,
        })
      ),
    ]

    for (const record of records) {
      const row = toOfficialAssetEventSupabaseRowV1(record)
      expect(Object.keys(row)).toHaveLength(58)
      expect(fromOfficialAssetEventSupabaseRowV1(row)).toEqual(record)
      expect(containsUndefined(row)).toBe(false)
    }

    expect(records.map((record) => record.occurredAtPrecision)).toEqual([
      'date',
      'minute',
      'second',
      null,
    ])
    expect(records[2].publishedAtInstantUtc).toBe('2026-07-18T13:08:55.123Z')
    expect(records[2].publishedAtRaw).toBe('2026-07-18T13:08:55.123456789Z')
  })

  it('preserva nulls, JSONB e cópias defensivas nos dois sentidos', () => {
    const record = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        documentId: '0000036405-26-000001',
        occurredAt: null,
      })
    )
    const row = toOfficialAssetEventSupabaseRowV1(record)

    expect(row.cnpj).toBeNull()
    expect(row.occurred_at_precision).toBeNull()
    expect(row.association_evidence).not.toBe(record.associationEvidence)
    expect(row.association_evidence[0]).not.toBe(record.associationEvidence[0])
    expect(row.provenance_raw_fields).not.toBe(record.provenanceRawFields)

    record.provenanceRawFields.row = 99
    expect(row.provenance_raw_fields.row).toBe(7)
    const restored = fromOfficialAssetEventSupabaseRowV1(row)
    row.provenance_raw_fields.row = 101
    expect(restored.provenanceRawFields.row).toBe(7)
  })
})

describe('cliente RPC de official_asset_events', () => {
  it('usa somente a RPC injetada uma vez, com snake_case e índices ordenados', async () => {
    const records = [createRecord(), createRecord('cvm-ipe:document-2')]
    const { client, calls } = createClient(() => ({
      data: createRpcResult(records),
      error: null,
    }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    const result = await storage.upsertMany(records)

    expect(result.inserted).toBe(2)
    expect(calls).toHaveLength(1)
    expect(calls[0].functionName).toBe(OFFICIAL_ASSET_EVENTS_UPSERT_RPC_V1)
    expect(calls[0].inputBatch.map((item) => item.inputIndex)).toEqual([0, 1])
    expect(calls[0].inputBatch[0].record.event_id).toBe(records[0].eventId)
    expect(Object.hasOwn(calls[0].inputBatch[0].record, 'eventId')).toBe(false)
  })

  it('não chama a RPC para batch vazio', async () => {
    const { client, calls } = createClient(() => ({ data: null, error: null }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })
    await expect(storage.upsertMany([])).resolves.toEqual({
      attempted: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      staleIgnored: 0,
      conflicts: 0,
      items: [],
    })
    expect(calls).toHaveLength(0)
  })

  it('aceita exatamente 500 records em uma chamada atômica', async () => {
    const records = Array.from(
      { length: OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1 },
      (_, index) => createRecord(`cvm-ipe:document-${index}`)
    )
    const { client, calls } = createClient(() => ({
      data: createRpcResult(records),
      error: null,
    }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })
    await expect(storage.upsertMany(records)).resolves.toMatchObject({
      attempted: 500,
      inserted: 500,
    })
    expect(calls).toHaveLength(1)
  })

  it('rejeita batch acima do limite sem fracionar nem chamar a RPC', async () => {
    const record = createRecord()
    const records = Array.from(
      { length: OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1 + 1 },
      () => record
    )
    const { client, calls } = createClient(() => ({ data: null, error: null }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })
    await expect(storage.upsertMany(records)).rejects.toMatchObject({
      kind: 'batch-limit',
      itemCount: 501,
    })
    expect(calls).toHaveLength(0)
  })

  it('rejeita array esparso e record inválido antes da RPC', async () => {
    const sparse = [createRecord(), createRecord('cvm-ipe:document-2')]
    delete sparse[0]
    const invalid = createRecord()
    Object.defineProperty(invalid, 'eventId', { value: '' })
    const { client, calls } = createClient(() => ({ data: null, error: null }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    await expect(storage.upsertMany(sparse)).rejects.toMatchObject({
      kind: 'invalid-input',
    })
    await expect(storage.upsertMany([invalid])).rejects.toMatchObject({
      kind: 'invalid-input',
    })
    expect(calls).toHaveLength(0)
  })
})

describe('retorno da RPC de official_asset_events', () => {
  it('mapeia todas as disposições, contadores e timestamps na ordem', async () => {
    const dispositions: OfficialAssetEventStorageDispositionV1[] = [
      'inserted',
      'updated',
      'unchanged',
      'stale-ignored',
      'conflict',
    ]
    const records = dispositions.map((_, index) =>
      createRecord(`cvm-ipe:result-${index}`)
    )
    const expected = createRpcResult(records, dispositions)
    const { client } = createClient(() => ({ data: expected, error: null }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    await expect(storage.upsertMany(records)).resolves.toEqual(expected)
  })

  it('rejeita top-level nulo, não objeto, incompleto ou com campo extra', async () => {
    const valid = createRpcResult([createRecord()])
    for (const data of [
      null,
      [],
      { attempted: 1 },
      { ...valid, unexpected: true },
    ]) {
      await expectMalformedResponse(data)
    }
  })

  it('rejeita contadores incoerentes, negativos, -0, fracionários ou unsafe', async () => {
    const valid = createRpcResult([createRecord()])
    for (const inserted of [0, -1, -0, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expectMalformedResponse({ ...valid, inserted })
    }
  })

  it('rejeita item ausente, duplicado, extra, trocado ou fora da faixa', async () => {
    const records = [createRecord(), createRecord('cvm-ipe:document-2')]
    const valid = createRpcResult(records)
    const first = valid.items[0]
    const second = valid.items[1]
    for (const items of [
      [],
      [first, first],
      [first, second, second],
      [second, first],
      [{ ...first, inputIndex: 2 }, second],
    ]) {
      await expectMalformedResponse({ ...valid, items }, records)
    }
  })

  it('rejeita identidade, disposição, conflito e timestamps incoerentes', async () => {
    const record = createRecord()
    const valid = createRpcResult([record])
    const item = valid.items[0]
    const malformedItems = [
      { ...item, eventId: 'different-event' },
      { ...item, deduplicationKey: 'different-key' },
      { ...item, disposition: 'invalid' },
      { ...item, conflictReason: 'immutable-identity-change' },
      { ...item, storedUpdatedAt: 'not-a-timestamp' },
      { ...item, previousUpdatedAt: '2026-02-30T00:00:00Z' },
      { ...item, duplicateOfInputIndex: 0 },
      { ...item, unexpected: true },
    ]
    for (const malformedItem of malformedItems) {
      await expectMalformedResponse({ ...valid, items: [malformedItem] })
    }
  })
})

describe('erros e integração da persistência Supabase', () => {
  it('sanitiza erro Supabase com details, hint e payload sensível', async () => {
    const secret = 'service-role-secret-value'
    const { client } = createClient(() => ({
      data: null,
      error: {
        code: 'P0001',
        status: 400,
        message: secret,
        details: secret,
        hint: secret,
      },
    }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    try {
      await storage.upsertMany([createRecord()])
      throw new Error('Expected the RPC error to be rejected')
    } catch (error) {
      expect(error).toBeInstanceOf(OfficialAssetEventsSupabaseAdapterErrorV1)
      expect(error).toMatchObject({
        kind: 'rpc-error',
        code: 'P0001',
        status: 400,
      })
      expect(String(error)).not.toContain(secret)
      expect(JSON.stringify(error)).not.toContain(secret)
    }
  })

  it('aceita erro sem code e sanitiza code/status inválidos', async () => {
    for (const error of [
      { message: 'failure' },
      { code: 'secret with spaces', status: 999, details: 'credential' },
    ]) {
      const { client } = createClient(() => ({ data: null, error }))
      const storage = createSupabaseOfficialAssetEventStorageV1({ client })
      await expect(storage.upsertMany([createRecord()])).rejects.toMatchObject({
        kind: 'rpc-error',
        code: null,
        status: null,
      })
    }
  })

  it('sanitiza exceção de transporte sem preservar a causa', async () => {
    const secret = 'credential-from-transport'
    const { client } = createClient(() => {
      throw new Error(secret)
    })
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    try {
      await storage.upsertMany([createRecord()])
      throw new Error('Expected the transport error to be rejected')
    } catch (error) {
      expect(error).toMatchObject({ kind: 'transport' })
      expect(String(error)).not.toContain(secret)
      expect(JSON.stringify(error)).not.toContain(secret)
    }
  })

  it('integra a fachada, reduz duplicata exata e preserva índices originais', async () => {
    const first = createStorageTestEvent()
    const second = createStorageTestEvent({ documentId: 'cvm-ipe:document-2' })
    const uniqueRecords = [
      toOfficialAssetEventStorageRecordV1(first),
      toOfficialAssetEventStorageRecordV1(second),
    ]
    const { client, calls } = createClient(() => ({
      data: createRpcResult(uniqueRecords, ['inserted', 'stale-ignored']),
      error: null,
    }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    const result = await persistOfficialAssetEventsV1({
      storage,
      events: [first, first, second],
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].inputBatch).toHaveLength(2)
    expect(result.items.map((item) => item.inputIndex)).toEqual([0, 1, 2])
    expect(result.items.map((item) => item.disposition)).toEqual([
      'inserted',
      'unchanged',
      'stale-ignored',
    ])
    expect(result.items[1].duplicateOfInputIndex).toBe(0)
  })

  it('aborta conflito interno da fachada antes da RPC', async () => {
    const first = createStorageTestEvent()
    const conflicting = createStorageTestEvent({
      title: 'Payload divergente',
      sourcePayloadHash: 'sha256:different',
    })
    const { client, calls } = createClient(() => ({ data: null, error: null }))
    const storage = createSupabaseOfficialAssetEventStorageV1({ client })

    await expect(
      persistOfficialAssetEventsV1({
        storage,
        events: [first, conflicting],
      })
    ).rejects.toBeInstanceOf(OfficialAssetEventStorageBatchConflictError)
    expect(calls).toHaveLength(0)
  })
})
