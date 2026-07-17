import type { OfficialEventTypeV1 } from '../../../../../domain/context'

export function getCvmFundDeliveryEventType(
  documentType: string
): OfficialEventTypeV1 | null {
  switch (documentType) {
    case 'INFORM MENSAL':
    case 'INFO TRIM FII':
      return 'periodic-report'
    default:
      return null
  }
}
