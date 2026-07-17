import { describe, expect, it } from 'vitest'
import { analyzeOfficialEventRevisionGraphV1 } from './revisions'
import {
  createDocumentIdentifiers,
  createOfficialEvent,
  createOfficialEventInput,
} from './testFixtures'
import type { OfficialEventStatusV1 } from './types'

function createRevision(status: Exclude<OfficialEventStatusV1, 'original'>) {
  const original = createOfficialEvent()
  const revision = createOfficialEvent({
    documentIdentifiers: createDocumentIdentifiers({
      sourceDocumentId: `document-${status}`,
    }),
    status,
    supersedesEventId: original.eventId,
  })
  return { original, revision }
}

describe('official event status rules', () => {
  it('accepts an original without supersedesEventId', () => {
    expect(createOfficialEvent().status).toBe('original')
  })

  it.each(['amendment', 'correction', 'replacement', 'cancellation'] as const)(
    'accepts a %s with its own document and supersedesEventId',
    (status) => {
      const { original, revision } = createRevision(status)
      expect(revision).toMatchObject({
        status,
        supersedesEventId: original.eventId,
      })
      expect(revision.eventId).not.toBe(original.eventId)
    }
  )

  it('rejects an original with supersedesEventId', () => {
    expect(() =>
      createOfficialEvent({ supersedesEventId: 'previous-event' })
    ).toThrow(/Original event/)
  })

  it.each(['amendment', 'correction', 'replacement', 'cancellation'] as const)(
    'rejects a %s without supersedesEventId',
    (status) => {
      expect(() => createOfficialEvent({ status })).toThrow(/must supersede/)
    }
  )

  it('rejects self-reference in the builder', () => {
    const original = createOfficialEvent()
    expect(() =>
      createOfficialEvent({
        status: 'amendment',
        supersedesEventId: original.eventId,
      })
    ).toThrow(/itself/)
  })

  it('rejects padded revision identifiers instead of changing their semantics', () => {
    expect(() =>
      createOfficialEvent({
        status: 'amendment',
        supersedesEventId: ' previous-event ',
      })
    ).toThrow(/unpadded event identifier/)
  })
})

describe('analyzeOfficialEventRevisionGraphV1', () => {
  it('resolves a revision relation and identifies the original root', () => {
    const { original, revision } = createRevision('amendment')
    expect(analyzeOfficialEventRevisionGraphV1([original, revision])).toEqual({
      resolvedRelations: [
        {
          eventId: revision.eventId,
          supersedesEventId: original.eventId,
          status: 'amendment',
        },
      ],
      unresolvedRelations: [],
      roots: [original.eventId],
    })
  })

  it('preserves an unresolved external relation structurally', () => {
    const revision = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'external-revision',
      }),
      status: 'correction',
      supersedesEventId: 'event-not-in-this-batch',
    })
    expect(analyzeOfficialEventRevisionGraphV1([revision])).toEqual({
      resolvedRelations: [],
      unresolvedRelations: [
        {
          eventId: revision.eventId,
          supersedesEventId: 'event-not-in-this-batch',
          status: 'correction',
        },
      ],
      roots: [revision.eventId],
    })
  })

  it('rejects duplicate eventId', () => {
    const event = createOfficialEvent()
    expect(() =>
      analyzeOfficialEventRevisionGraphV1([event, structuredClone(event)])
    ).toThrow(/Duplicate eventId/)
  })

  it('rejects cross-asset revisions', () => {
    const original = createOfficialEvent()
    const revision = createOfficialEvent({
      ticker: 'WEGE3',
      associationEvidence: [
        { reason: 'exact-cnpj', observedCnpj: '84429695000111' },
      ],
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'wege-revision',
      }),
      status: 'amendment',
      supersedesEventId: original.eventId,
    })
    expect(() =>
      analyzeOfficialEventRevisionGraphV1([original, revision])
    ).toThrow(/crosses asset/)
  })

  it('rejects cross-source revisions', () => {
    const input = createOfficialEventInput({
      ticker: 'VOO',
      source: 'sec-edgar',
      eventType: 'periodic-report',
      associationEvidence: [
        {
          reason: 'exact-cik-series-class',
          observedRegistrantCik: '0000036405',
          observedSeriesId: 'S000002839',
          observedClassContractId: 'C000092055',
        },
      ],
      provenance: {
        ...createOfficialEventInput().provenance,
        sourceSystem: 'sec-edgar',
      },
    })
    const original = createOfficialEvent(input)
    const revision = createOfficialEvent({
      ...input,
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'sec-revision',
      }),
      status: 'amendment',
      supersedesEventId: original.eventId,
    })
    revision.source = 'cvm-ipe'
    expect(() =>
      analyzeOfficialEventRevisionGraphV1([original, revision])
    ).toThrow(/crosses official sources/)
  })

  it('rejects self-reference in graph input', () => {
    const event = createOfficialEvent()
    event.status = 'amendment'
    event.supersedesEventId = event.eventId
    expect(() => analyzeOfficialEventRevisionGraphV1([event])).toThrow(/itself/)
  })

  it('rejects a two-event cycle', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-2',
      }),
    })
    first.status = 'amendment'
    first.supersedesEventId = second.eventId
    second.status = 'correction'
    second.supersedesEventId = first.eventId
    expect(() => analyzeOfficialEventRevisionGraphV1([first, second])).toThrow(
      /Cycle/
    )
  })

  it('rejects a longer cycle', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-2',
      }),
    })
    const third = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-3',
      }),
    })
    first.status = 'amendment'
    first.supersedesEventId = third.eventId
    second.status = 'correction'
    second.supersedesEventId = first.eventId
    third.status = 'replacement'
    third.supersedesEventId = second.eventId
    expect(() =>
      analyzeOfficialEventRevisionGraphV1([first, second, third])
    ).toThrow(/Cycle/)
  })

  it('keeps deterministic roots in input order', () => {
    const first = createOfficialEvent()
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'document-2',
      }),
    })
    expect(analyzeOfficialEventRevisionGraphV1([second, first]).roots).toEqual([
      second.eventId,
      first.eventId,
    ])
  })

  it('analyzes multiple chains and an external parent with input out of order', () => {
    const firstRoot = createOfficialEvent()
    const firstRevision = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'chain-1-revision',
      }),
      status: 'amendment',
      supersedesEventId: firstRoot.eventId,
    })
    const secondRoot = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'chain-2-root',
      }),
    })
    const externalRevision = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'external-child',
      }),
      status: 'correction',
      supersedesEventId: 'external-parent',
    })
    const childOfExternalRevision = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'external-grandchild',
      }),
      status: 'replacement',
      supersedesEventId: externalRevision.eventId,
    })
    const result = analyzeOfficialEventRevisionGraphV1([
      childOfExternalRevision,
      firstRevision,
      secondRoot,
      externalRevision,
      firstRoot,
    ])
    expect(result.resolvedRelations.map(({ eventId }) => eventId)).toEqual([
      childOfExternalRevision.eventId,
      firstRevision.eventId,
    ])
    expect(result.unresolvedRelations.map(({ eventId }) => eventId)).toEqual([
      externalRevision.eventId,
    ])
    expect(result.roots).toEqual([
      secondRoot.eventId,
      externalRevision.eventId,
      firstRoot.eventId,
    ])
  })

  it('detects a cycle in a component separate from a valid root', () => {
    const root = createOfficialEvent()
    const first = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'cycle-a',
      }),
    })
    const second = createOfficialEvent({
      documentIdentifiers: createDocumentIdentifiers({
        sourceDocumentId: 'cycle-b',
      }),
    })
    first.status = 'amendment'
    first.supersedesEventId = second.eventId
    second.status = 'correction'
    second.supersedesEventId = first.eventId
    expect(() =>
      analyzeOfficialEventRevisionGraphV1([root, first, second])
    ).toThrow(/Cycle/)
  })

  it('returns revision metadata independently from future input mutations', () => {
    const { original, revision } = createRevision('amendment')
    const result = analyzeOfficialEventRevisionGraphV1([original, revision])
    revision.supersedesEventId = 'changed-after-analysis'
    expect(result.resolvedRelations[0].supersedesEventId).toBe(original.eventId)
    result.roots[0] = 'changed-output'
    expect(original.eventId).not.toBe('changed-output')
  })

  it('does not mutate the input', () => {
    const { original, revision } = createRevision('replacement')
    const events = [original, revision]
    const snapshot = structuredClone(events)
    analyzeOfficialEventRevisionGraphV1(events)
    expect(events).toEqual(snapshot)
  })

  it('is deterministic', () => {
    const { original, revision } = createRevision('cancellation')
    expect(analyzeOfficialEventRevisionGraphV1([original, revision])).toEqual(
      analyzeOfficialEventRevisionGraphV1([original, revision])
    )
  })
})
