import type { OfficialEventTypeV1 } from '../../../../../domain/context/official-events'

import { SEC_EDGAR_ETF_FORM_MAPPING_V1_VERSION } from './constants'

const FORM_EVENT_TYPES: Readonly<Record<string, OfficialEventTypeV1>> = {
  'NPORT-P': 'periodic-report',
  'N-CEN': 'periodic-report',
  'N-CSR': 'periodic-report',
  'N-CSRS': 'periodic-report',
  'DEF 14A': 'shareholder-meeting',
  DEFA14A: 'shareholder-meeting',
}

export function mapSecEdgarFormToEventType(
  form: string
): OfficialEventTypeV1 | null {
  return FORM_EVENT_TYPES[form] ?? null
}

export { SEC_EDGAR_ETF_FORM_MAPPING_V1_VERSION }
