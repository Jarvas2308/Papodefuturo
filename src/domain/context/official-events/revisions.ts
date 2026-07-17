import { buildOfficialEventAssetIdentityKey } from './assetIdentities'
import { assertOfficialAssetEventV1 } from './eventValidation'
import type {
  OfficialAssetEventV1,
  OfficialEventResolvedRevisionRelationV1,
  OfficialEventRevisionAnalysisV1,
} from './types'

export function analyzeOfficialEventRevisionGraphV1(
  events: readonly OfficialAssetEventV1[]
): OfficialEventRevisionAnalysisV1 {
  const eventsById = new Map<string, OfficialAssetEventV1>()
  for (const event of events) {
    assertOfficialAssetEventV1(event)
    if (eventsById.has(event.eventId)) {
      throw new Error(`Duplicate eventId in revision graph: ${event.eventId}`)
    }
    eventsById.set(event.eventId, event)
  }

  const resolvedRelations: OfficialEventResolvedRevisionRelationV1[] = []
  const unresolvedRelations: OfficialEventResolvedRevisionRelationV1[] = []
  const roots: string[] = []

  for (const event of events) {
    if (event.status === 'original') {
      roots.push(event.eventId)
      continue
    }
    const supersedesEventId = event.supersedesEventId
    if (!supersedesEventId)
      throw new Error('Revision event is missing supersedesEventId')
    if (supersedesEventId === event.eventId)
      throw new Error('Event cannot supersede itself')
    const relation = {
      eventId: event.eventId,
      supersedesEventId,
      status: event.status,
    }
    const previous = eventsById.get(supersedesEventId)
    if (!previous) {
      unresolvedRelations.push(relation)
      roots.push(event.eventId)
      continue
    }
    if (
      buildOfficialEventAssetIdentityKey(previous.assetIdentity) !==
      buildOfficialEventAssetIdentityKey(event.assetIdentity)
    ) {
      throw new Error('Revision relation crosses asset identities')
    }
    if (previous.source !== event.source) {
      throw new Error('Revision relation crosses official sources')
    }
    resolvedRelations.push(relation)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (eventId: string): void => {
    if (visiting.has(eventId))
      throw new Error('Cycle detected in official event revisions')
    if (visited.has(eventId)) return
    visiting.add(eventId)
    const event = eventsById.get(eventId)
    if (event?.supersedesEventId && eventsById.has(event.supersedesEventId)) {
      visit(event.supersedesEventId)
    }
    visiting.delete(eventId)
    visited.add(eventId)
  }
  for (const event of events) visit(event.eventId)

  return {
    resolvedRelations: resolvedRelations.map((relation) => ({ ...relation })),
    unresolvedRelations: unresolvedRelations.map((relation) => ({
      ...relation,
    })),
    roots: [...roots],
  }
}
