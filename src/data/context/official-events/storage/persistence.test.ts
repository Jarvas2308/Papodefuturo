import { describe, expect, it, vi } from 'vitest'
import {
  MalformedOfficialAssetEventStorageResultError,
  OfficialAssetEventStorageBatchConflictError,
  persistOfficialAssetEventsV1,
  prepareOfficialAssetEventStorageBatchV1,
  toOfficialAssetEventStorageRecordV1,
  type OfficialAssetEventStorageV1,
  type OfficialAssetEventStorageWriteResultV1,
} from './index'
import { createInMemoryOfficialAssetEventStorageV1 } from './inMemoryReference'
import { createStorageTestEvent } from './testFixtures'

describe('preparação e fachada de persistência', () => {
  it('não chama o adapter para batch vazio', async () => {
    const storage = { upsertMany: vi.fn() }
    const result = await persistOfficialAssetEventsV1({ storage, events: [] })
    expect(storage.upsertMany).not.toHaveBeenCalled()
    expect(result).toEqual({
      attempted: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      staleIgnored: 0,
      conflicts: 0,
      items: [],
    })
  })

  it('reduz duplicata exata a uma escrita e preserva os índices originais', async () => {
    const event = createStorageTestEvent()
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const result = await persistOfficialAssetEventsV1({
      storage,
      events: [event, event],
    })
    expect(result.attempted).toBe(2)
    expect(result.inserted).toBe(1)
    expect(result.unchanged).toBe(1)
    expect(result.items.map((item) => item.inputIndex)).toEqual([0, 1])
    expect(result.items[1].duplicateOfInputIndex).toBe(0)
    expect(storage.getSnapshot()).toHaveLength(1)
  })

  it('aceita múltiplas fontes e categorias em ordem', async () => {
    const events = [
      createStorageTestEvent(),
      createStorageTestEvent({ ticker: 'KNRI11', source: 'cvm-fund-delivery' }),
      createStorageTestEvent({
        ticker: 'VOO',
        source: 'sec-edgar',
        documentId: '0000036405-26-000001',
      }),
    ]
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const result = await persistOfficialAssetEventsV1({ storage, events })
    expect(result.inserted).toBe(3)
    expect(storage.getSnapshot().map((record) => record.source)).toEqual([
      'cvm-ipe',
      'cvm-fund-delivery',
      'sec-edgar',
    ])
  })

  it('aborta conflito interno antes de chamar o adapter', async () => {
    const storage = { upsertMany: vi.fn() }
    const events = [
      createStorageTestEvent(),
      createStorageTestEvent({
        title: 'Payload divergente',
        sourcePayloadHash: 'sha256:other',
      }),
    ]
    await expect(
      persistOfficialAssetEventsV1({ storage, events })
    ).rejects.toBeInstanceOf(OfficialAssetEventStorageBatchConflictError)
    expect(storage.upsertMany).not.toHaveBeenCalled()
  })

  it('não considera mesmo hash com conteúdo divergente uma duplicata exata', () => {
    expect(() =>
      prepareOfficialAssetEventStorageBatchV1([
        createStorageTestEvent(),
        createStorageTestEvent({ title: 'Conteúdo divergente' }),
      ])
    ).toThrow(OfficialAssetEventStorageBatchConflictError)
  })
})

describe('storage em memória de referência', () => {
  it('insere e repete de forma idempotente', async () => {
    const storage = createInMemoryOfficialAssetEventStorageV1()
    const record = toOfficialAssetEventStorageRecordV1(createStorageTestEvent())
    expect((await storage.upsertMany([record])).items[0].disposition).toBe(
      'inserted'
    )
    expect((await storage.upsertMany([record])).items[0].disposition).toBe(
      'unchanged'
    )
  })

  it('atualiza hash posterior e preserva o menor ingestedAt', async () => {
    const initial = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    const storage = createInMemoryOfficialAssetEventStorageV1([initial])
    const incoming = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({
        title: 'Metadado corrigido',
        sourcePayloadHash: 'sha256:payload-2',
        ingestedAt: '2026-07-18T14:30:00Z',
        updatedAt: '2026-07-18T15:00:00Z',
      })
    )
    const result = await storage.upsertMany([incoming])
    expect(result.items[0].disposition).toBe('updated')
    expect(storage.getSnapshot()[0].ingestedAt).toBe(initial.ingestedAt)
    expect(storage.getSnapshot()[0].title).toBe('Metadado corrigido')
  })

  it('atualiza conteúdo mutável posterior mesmo quando o hash permanece igual', async () => {
    const initial = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    const storage = createInMemoryOfficialAssetEventStorageV1([initial])
    const incoming = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({
        title: 'Metadado remapeado',
        updatedAt: '2026-07-18T15:00:00Z',
      })
    )

    const result = await storage.upsertMany([incoming])

    expect(result.items[0].disposition).toBe('updated')
    expect(storage.getSnapshot()[0].title).toBe('Metadado remapeado')
  })

  it('ignora versão stale e conflita payload divergente no mesmo updatedAt', async () => {
    const initial = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    const stale = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({
        sourcePayloadHash: 'sha256:stale',
        ingestedAt: '2026-07-18T12:00:00Z',
        updatedAt: '2026-07-18T13:00:00Z',
      })
    )
    const sameVersion = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({ title: 'Divergente' })
    )
    const storage = createInMemoryOfficialAssetEventStorageV1([initial])
    expect((await storage.upsertMany([stale])).items[0].disposition).toBe(
      'stale-ignored'
    )
    const conflict = await storage.upsertMany([sameVersion])
    expect(conflict.items[0]).toMatchObject({
      disposition: 'conflict',
      conflictReason: 'same-version-payload-divergence',
    })
  })

  it('rejeita mudança de identidade imutável e mantém o batch atômico', async () => {
    const initial = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent()
    )
    const validInsert = toOfficialAssetEventStorageRecordV1(
      createStorageTestEvent({ documentId: 'cvm:ipe:document-2' })
    )
    const identityChange = {
      ...initial,
      status: 'correction' as const,
      supersedesEventId: 'another-event',
    }
    const storage = createInMemoryOfficialAssetEventStorageV1([initial])
    const result = await storage.upsertMany([validInsert, identityChange])
    expect(result.items[1]).toMatchObject({
      disposition: 'conflict',
      conflictReason: 'immutable-identity-change',
    })
    expect(storage.getSnapshot()).toEqual([initial])
  })

  it.each(['amendment', 'correction', 'replacement', 'cancellation'] as const)(
    'preserva %s como registro independente mesmo sem o original no storage',
    async (status) => {
      const original = createStorageTestEvent()
      const revision = createStorageTestEvent({
        documentId: `cvm:ipe:${status}`,
        status,
        supersedesEventId: original.eventId,
      })
      const storage = createInMemoryOfficialAssetEventStorageV1()
      const result = await storage.upsertMany([
        toOfficialAssetEventStorageRecordV1(revision),
      ])
      expect(result.inserted).toBe(1)
      expect(storage.getSnapshot()[0].supersedesEventId).toBe(original.eventId)
    }
  )

  it('devolve snapshots defensivos', async () => {
    const storage = createInMemoryOfficialAssetEventStorageV1()
    await storage.upsertMany([
      toOfficialAssetEventStorageRecordV1(createStorageTestEvent()),
    ])
    const snapshot = storage.getSnapshot()
    snapshot[0].provenanceRawFields.row = 999
    expect(storage.getSnapshot()[0].provenanceRawFields.row).toBe(7)
  })
})

describe('validação adversarial da resposta do adapter', () => {
  const event = createStorageTestEvent()

  function validResult(): OfficialAssetEventStorageWriteResultV1 {
    return {
      attempted: 1,
      inserted: 1,
      updated: 0,
      unchanged: 0,
      staleIgnored: 0,
      conflicts: 0,
      items: [
        {
          inputIndex: 0,
          eventId: event.eventId,
          deduplicationKey: event.deduplicationKey,
          disposition: 'inserted',
          previousUpdatedAt: null,
          storedUpdatedAt: event.updatedAt,
          conflictReason: null,
          duplicateOfInputIndex: null,
        },
      ],
    }
  }

  async function expectMalformed(
    mutate: (result: OfficialAssetEventStorageWriteResultV1) => void
  ) {
    const result = validResult()
    mutate(result)
    const storage: OfficialAssetEventStorageV1 = {
      async upsertMany() {
        return result
      },
    }
    await expect(
      persistOfficialAssetEventsV1({ storage, events: [event] })
    ).rejects.toBeInstanceOf(MalformedOfficialAssetEventStorageResultError)
  }

  it('rejeita contador incorreto, item ausente e índice fora da faixa', async () => {
    await expectMalformed((result) => {
      result.inserted = 0
    })
    await expectMalformed((result) => {
      result.items = []
    })
    await expectMalformed((result) => {
      result.items[0].inputIndex = 1
    })
  })

  it('rejeita identidade divergente, disposition inválida, -0 e ordem adulterada', async () => {
    await expectMalformed((result) => {
      result.items[0].eventId = 'outro'
    })
    await expectMalformed((result) => {
      result.items[0].disposition = 'invalid' as never
    })
    await expectMalformed((result) => {
      result.conflicts = -0
    })
    await expectMalformed((result) => {
      result.items.push({ ...result.items[0], inputIndex: 0 })
    })
  })
})
