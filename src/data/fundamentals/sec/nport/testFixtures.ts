import type {
  SecInternationalEtf,
  SecInternationalEtfTicker,
  SecNportFiling,
} from './types'
import { SEC_NPORT_XML_NAMESPACE } from './xml'

export const AUDITED_FILINGS: Record<
  SecInternationalEtfTicker,
  SecNportFiling
> = {
  VOO: {
    form: 'NPORT-P',
    accessionNumber: '0000036405-26-000325',
    filingDate: '2026-05-28',
    acceptedAt: '2026-05-28T16:39:55.000Z',
    reportDate: '2026-03-31',
    primaryDocument: 'primary_doc.xml',
  },
  VNQ: {
    form: 'NPORT-P',
    accessionNumber: '0000734383-25-000078',
    filingDate: '2025-09-25',
    acceptedAt: '2025-09-25T15:40:22.000Z',
    reportDate: '2025-07-31',
    primaryDocument: 'primary_doc.xml',
  },
  VEA: {
    form: 'NPORT-P',
    accessionNumber: '0000923202-26-000098',
    filingDate: '2026-05-28',
    acceptedAt: '2026-05-28T16:38:51.000Z',
    reportDate: '2026-03-31',
    primaryDocument: 'primary_doc.xml',
  },
}

export const AUDITED_CLASS_IDS: Record<
  SecInternationalEtfTicker,
  readonly string[]
> = {
  VOO: ['C000007773', 'C000007774', 'C000092055', 'C000170274'],
  VNQ: ['C000008010', 'C000008011', 'C000008012', 'C000032424'],
  VEA: ['C000012140', 'C000012141', 'C000051262', 'C000135477', 'C000135478'],
}

export function createMinimalNportXml(input: {
  fund: SecInternationalEtf
  filing: SecNportFiling
  namespace?: string
  form?: string
  registrantCik?: string
  registrantName?: string
  seriesId?: string
  headerSeriesId?: string
  seriesName?: string
  classIds?: readonly string[]
  seriesClassGroups?: readonly {
    seriesId: string
    classIds: readonly string[]
  }[]
  reportDate?: string
  totalAssets?: string | null
  totalLiabilities?: string | null
  netAssets?: string | null
}): string {
  const namespace = input.namespace ?? SEC_NPORT_XML_NAMESPACE
  const registrantCik = input.registrantCik ?? input.fund.registrantCik
  const seriesId = input.seriesId ?? input.fund.seriesId
  const classIds = input.classIds ?? AUDITED_CLASS_IDS[input.fund.ticker]!
  const seriesClassGroups =
    input.seriesClassGroups ??
    classIds.map((classId) => ({
      seriesId: input.headerSeriesId ?? seriesId,
      classIds: [classId],
    }))
  const fact = (tag: string, value: string | null | undefined) =>
    value === null ? '' : `<${tag}>${value}</${tag}>`
  const totalAssets =
    input.totalAssets ?? (input.totalAssets === null ? null : '1000.00')
  const totalLiabilities =
    input.totalLiabilities ?? (input.totalLiabilities === null ? null : '10.00')
  const netAssets =
    input.netAssets ?? (input.netAssets === null ? null : '990.00')

  return `<?xml version="1.0" encoding="UTF-8"?>
<edgarSubmission xmlns="${namespace}">
  <headerData>
    <submissionType>${input.form ?? input.filing.form}</submissionType>
    <filerInfo>
      <filer>
        <issuerCredentials><cik>${registrantCik}</cik></issuerCredentials>
        ${seriesClassGroups
          .map(
            (group) => `<seriesClassInfo>
          <seriesId>${group.seriesId}</seriesId>
          ${group.classIds.map((id) => `<classId>${id}</classId>`).join('')}
        </seriesClassInfo>`
          )
          .join('')}
      </filer>
    </filerInfo>
  </headerData>
  <formData>
    <genInfo>
      <regName>${input.registrantName ?? input.fund.registrantName}</regName>
      <regCik>${registrantCik}</regCik>
      <seriesName>${input.seriesName ?? input.fund.seriesName}</seriesName>
      <seriesId>${seriesId}</seriesId>
      <repPdDate>${input.reportDate ?? input.filing.reportDate}</repPdDate>
    </genInfo>
    <fundInfo>
      ${fact('totAssets', totalAssets)}
      ${fact('totLiabs', totalLiabilities)}
      ${fact('netAssets', netAssets)}
    </fundInfo>
  </formData>
</edgarSubmission>`
}

export function createSubmissionsJson(
  filings: readonly SecNportFiling[],
  historicalFiles: readonly string[] = []
): string {
  return JSON.stringify({
    filings: {
      recent: {
        form: filings.map((filing) => filing.form),
        accessionNumber: filings.map((filing) => filing.accessionNumber),
        filingDate: filings.map((filing) => filing.filingDate),
        acceptanceDateTime: filings.map((filing) => filing.acceptedAt),
        reportDate: filings.map((filing) => filing.reportDate),
        primaryDocument: filings.map((filing) => filing.primaryDocument),
      },
      files: historicalFiles.map((name) => ({ name })),
    },
  })
}

export function createHistoricalJson(
  filings: readonly SecNportFiling[]
): string {
  return JSON.stringify({
    form: filings.map((filing) => filing.form),
    accessionNumber: filings.map((filing) => filing.accessionNumber),
    filingDate: filings.map((filing) => filing.filingDate),
    acceptanceDateTime: filings.map((filing) => filing.acceptedAt),
    reportDate: filings.map((filing) => filing.reportDate),
    primaryDocument: filings.map((filing) => filing.primaryDocument),
  })
}
