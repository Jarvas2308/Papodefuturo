import type {
  OfficialAssetEventV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
} from '../../../../domain/context/official-events'
import { createStorageTestEvent } from '../storage/testFixtures'

export function createReadTestEvent(
  input: {
    ticker?: 'BBAS3' | 'KNRI11' | 'VOO'
    source?: OfficialEventSourceV1
    documentId?: string
    publishedAt?:
      | { precision: 'date'; value: string }
      | { precision: 'minute'; value: string }
      | { precision: 'second'; value: string }
    status?: OfficialEventStatusV1
    supersedesEventId?: string | null
  } = {}
): OfficialAssetEventV1 {
  return createStorageTestEvent({
    ticker: input.ticker,
    source: input.source,
    documentId: input.documentId,
    publishedAt: input.publishedAt,
    status: input.status,
    supersedesEventId: input.supersedesEventId,
  })
}

export function createReadTimeline(): OfficialAssetEventV1[] {
  return [
    createReadTestEvent({
      documentId: 'cvm-ipe:second-new',
      publishedAt: { precision: 'second', value: '2026-07-19T18:00:00Z' },
    }),
    createReadTestEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
      documentId: 'fund:minute',
      publishedAt: { precision: 'minute', value: '2026-07-19T18:00Z' },
    }),
    createReadTestEvent({
      ticker: 'VOO',
      source: 'sec-edgar',
      documentId: '0000036405-26-000010',
      publishedAt: { precision: 'date', value: '2026-07-19' },
    }),
    createReadTestEvent({
      documentId: 'cvm-ipe:older',
      publishedAt: { precision: 'second', value: '2026-07-18T23:59:59Z' },
    }),
    createReadTestEvent({
      ticker: 'KNRI11',
      source: 'cvm-fund-delivery',
      documentId: 'fund:oldest',
      publishedAt: { precision: 'date', value: '2024-02-29' },
    }),
  ]
}
