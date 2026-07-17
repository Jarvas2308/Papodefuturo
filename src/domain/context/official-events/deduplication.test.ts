import { describe, expect, it } from 'vitest'
import { deduplicateOfficialAssetEventsV1 } from './deduplication'
import { createDocumentIdentifiers, createOfficialEvent } from './testFixtures'

describe('deduplicateOfficialAssetEventsV1', () => {
  it('reports an exact duplicate and preserves the first event', () => {
    const first = createOfficialEvent()
    const duplicate = structuredClone(first)
    const result = deduplicateOfficialAssetEventsV1([first, duplicate])
    expect(result.uniqueEvents).toEqual([first])
    expect(result.duplicates).toEqual([
      {
        deduplicationKey: first.deduplicationKey,
        keptInputIndex: 0,
        duplicateInputIndex: 1,
      },
    ])
    expect(result.conflicts).toEqual([])
  })

  it('records multiple duplicate indexes against the first occurrence', () => {
    const first = createOfficialEvent()
    const result = deduplicateOfficialAssetEventsV1([
      first,
      structuredClone(first),
      structuredClone(first),
    ])
    expect(
      result.duplicates.map(({ keptInputIndex, duplicateInputIndex }) => [
        keptInputIndex,
        duplicateInputIndex,
      ])
    ).toEqual([
      [0, 1],
      [0, 2],
    ])
  })

  it('reports a payload conflict without silently replacing the first event', () => {
    const first = createOfficialEvent()
    const conflicting = structuredClone(first)
    conflicting.provenance.sourcePayloadHash = 'sha256:different'
    const result = deduplicateOfficialAssetEventsV1([first, conflicting])
    expect(result.uniqueEvents).toEqual([first])
    expect(result.conflicts).toEqual([
      {
        deduplicationKey: first.deduplicationKey,
        inputIndexes: [0, 1],
        sourcePayloadHashes: ['sha256:payload-1', 'sha256:different'],
      },
    ])
  })

  it('aggregates conflict indexes and distinct hashes deterministically', () => {
    const first = createOfficialEvent()
    const second = structuredClone(first)
    const third = structuredClone(first)
    second.provenance.sourcePayloadHash = 'hash-2'
    third.provenance.sourcePayloadHash = 'hash-2'
    expect(
      deduplicateOfficialAssetEventsV1([first, second, third]).conflicts[0]
    ).toEqual({
      deduplicationKey: first.deduplicationKey,
      inputIndexes: [0, 1, 2],
      sourcePayloadHashes: ['sha256:payload-1', 'hash-2'],
    })
  })

  it('preserves every conflicting hash in first-seen order', () => {
    const first = createOfficialEvent()
    const second = structuredClone(first)
    const third = structuredClone(first)
    second.provenance.sourcePayloadHash = 'hash-z'
    third.provenance.sourcePayloadHash = 'hash-a'
    expect(
      deduplicateOfficialAssetEventsV1([first, second, third]).conflicts[0]
        .sourcePayloadHashes
    ).toEqual(['sha256:payload-1', 'hash-z', 'hash-a'])
  })

  it('does not also classify a conflict as a duplicate', () => {
    const first = createOfficialEvent()
    const conflict = structuredClone(first)
    conflict.provenance.sourcePayloadHash = 'other-hash'
    const result = deduplicateOfficialAssetEventsV1([first, conflict])
    expect(result.duplicates).toEqual([])
    expect(result.conflicts).toHaveLength(1)
  })

  it('preserves unique input order', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-2',
      }),
    })
    expect(
      deduplicateOfficialAssetEventsV1([second, first]).uniqueEvents.map(
        ({ eventId }) => eventId
      )
    ).toEqual([second.eventId, first.eventId])
  })

  it('preserves revisions with their own documents', () => {
    const original = createOfficialEvent()
    const amendment = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-amendment',
      }),
      status: 'amendment',
      supersedesEventId: original.eventId,
    })
    expect(
      deduplicateOfficialAssetEventsV1([original, amendment]).uniqueEvents
    ).toHaveLength(2)
  })

  it('does not mutate input events', () => {
    const events = [
      createOfficialEvent(),
      createOfficialEvent({
        documentIdentifiers: createDocumentIdentifiers({
          sourceDocumentId: 'document-2',
        }),
      }),
    ]
    const snapshot = structuredClone(events)
    deduplicateOfficialAssetEventsV1(events)
    expect(events).toEqual(snapshot)
  })

  it('returns defensive event copies', () => {
    const input = createOfficialEvent()
    const result = deduplicateOfficialAssetEventsV1([input])
    result.uniqueEvents[0].assetIdentity.officialName = 'changed'
    result.uniqueEvents[0].provenance.rawFields.protocol = 'changed'
    expect(input.assetIdentity.officialName).not.toBe('changed')
    expect(input.provenance.rawFields.protocol).toBe('123')
  })

  it('returns deeply independent conflict metadata', () => {
    const first = createOfficialEvent()
    const conflict = structuredClone(first)
    conflict.provenance.sourcePayloadHash = 'other-hash'
    const result = deduplicateOfficialAssetEventsV1([first, conflict])
    result.conflicts[0].inputIndexes.push(99)
    result.conflicts[0].sourcePayloadHashes[0] = 'changed'
    const repeated = deduplicateOfficialAssetEventsV1([first, conflict])
    expect(repeated.conflicts[0].inputIndexes).toEqual([0, 1])
    expect(repeated.conflicts[0].sourcePayloadHashes[0]).toBe(
      'sha256:payload-1'
    )
  })

  it('is deeply deterministic', () => {
    const first = createOfficialEvent()
    const second = structuredClone(first)
    expect(deduplicateOfficialAssetEventsV1([first, second])).toEqual(
      deduplicateOfficialAssetEventsV1([first, second])
    )
  })

  it('rejects an invalid event schema', () => {
    const event = createOfficialEvent()
    Object.assign(event, { schemaVersion: 'invalid.v1' })
    expect(() => deduplicateOfficialAssetEventsV1([event])).toThrow(
      /schemaVersion/
    )
  })
})
