import { assertOfficialEventAssetIdentity } from './assetIdentities'
import { assertNonEmptyString } from './internal'
import {
  OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION,
  type OfficialAssetEventV1,
} from './types'

export function assertOfficialAssetEventV1(event: OfficialAssetEventV1): void {
  if (event.schemaVersion !== OFFICIAL_ASSET_EVENT_V1_SCHEMA_VERSION) {
    throw new Error('Invalid OfficialAssetEventV1 schemaVersion')
  }
  assertNonEmptyString(event.eventId, 'eventId')
  assertNonEmptyString(event.deduplicationKey, 'deduplicationKey')
  assertNonEmptyString(event.provenance.sourcePayloadHash, 'sourcePayloadHash')
  assertOfficialEventAssetIdentity(event.assetIdentity)
  if (event.status === 'original' && event.supersedesEventId !== null) {
    throw new Error('Original event must not supersede another event')
  }
  if (event.status !== 'original' && !event.supersedesEventId) {
    throw new Error('Revision event must supersede another event')
  }
}
