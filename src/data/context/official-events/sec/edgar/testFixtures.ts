import type {
  SecEdgarFilingDetailV1,
  SecEdgarRecentFilingV1,
  SecEdgarSubmissionsV1,
} from './types'

export const TEST_IDENTITIES = [
  {
    ticker: 'VOO',
    cik: '0000036405',
    seriesId: 'S000002839',
    classContractId: 'C000092055',
  },
  {
    ticker: 'VNQ',
    cik: '0000734383',
    seriesId: 'S000002924',
    classContractId: 'C000032424',
  },
  {
    ticker: 'VEA',
    cik: '0000923202',
    seriesId: 'S000004386',
    classContractId: 'C000051262',
  },
] as const

export function createRecentFiling(
  overrides: Partial<SecEdgarRecentFilingV1> = {}
): SecEdgarRecentFilingV1 {
  return {
    sourceIndex: 0,
    accessionNumber: '0000036405-26-000001',
    filingDate: '2026-05-28',
    reportDate: '2026-04-30',
    acceptanceDateTime: '2026-05-28T16:39:55.123Z',
    act: '40',
    form: 'NPORT-P',
    fileNumber: '811-02652',
    filmNumber: '261234567',
    items: '',
    coreType: 'NPORT-P',
    size: 12_345,
    isXbrl: 1,
    isInlineXbrl: 0,
    isXbrlNumeric: null,
    primaryDocument: 'primary.htm',
    primaryDocDescription: 'FORM NPORT-P',
    ...overrides,
  }
}

export function createSubmissions(
  identityIndex: number,
  filings: readonly SecEdgarRecentFilingV1[] = [
    createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[identityIndex].cik}-26-000001`,
    }),
  ]
): SecEdgarSubmissionsV1 {
  return {
    registrantCik: TEST_IDENTITIES[identityIndex].cik,
    registrantName: `REGISTRANT ${identityIndex + 1}`,
    recentFilings: filings.map((filing) => ({ ...filing })),
    historicalFiles: [],
  }
}

export function createSubmissionsJson(
  identityIndex = 0,
  filings: readonly SecEdgarRecentFilingV1[] = [
    createRecentFiling({
      accessionNumber: `${TEST_IDENTITIES[identityIndex].cik}-26-000001`,
    }),
  ],
  files: readonly Record<string, unknown>[] = []
): string {
  const recent = {
    accessionNumber: filings.map((item) => item.accessionNumber),
    filingDate: filings.map((item) => item.filingDate),
    reportDate: filings.map((item) => item.reportDate),
    acceptanceDateTime: filings.map((item) => item.acceptanceDateTime),
    act: filings.map((item) => item.act),
    form: filings.map((item) => item.form),
    fileNumber: filings.map((item) => item.fileNumber),
    filmNumber: filings.map((item) => item.filmNumber),
    items: filings.map((item) => item.items),
    core_type: filings.map((item) => item.coreType),
    size: filings.map((item) => item.size),
    isXBRL: filings.map((item) => item.isXbrl),
    isInlineXBRL: filings.map((item) => item.isInlineXbrl),
    isXBRLNumeric: filings.map((item) => item.isXbrlNumeric),
    primaryDocument: filings.map((item) => item.primaryDocument),
    primaryDocDescription: filings.map((item) => item.primaryDocDescription),
  }
  return JSON.stringify({
    cik: String(Number(TEST_IDENTITIES[identityIndex].cik)),
    name: `REGISTRANT ${identityIndex + 1}`,
    filings: { recent, files },
  })
}

export function createFilingDetail(
  identityIndex: number,
  accessionNumber = `${TEST_IDENTITIES[identityIndex].cik}-26-000001`
): SecEdgarFilingDetailV1 {
  const identity = TEST_IDENTITIES[identityIndex]
  return {
    accessionNumber,
    scope: 'series-and-classes',
    series: [
      {
        seriesId: identity.seriesId,
        classes: [{ classContractId: identity.classContractId }],
      },
    ],
    seriesCount: 1,
    classCount: 1,
    documentCount: 2,
  }
}

export function createFilingDetailHtml(
  accessionNumber: string = TEST_IDENTITIES[0].cik + '-26-000001',
  seriesId: string = TEST_IDENTITIES[0].seriesId,
  classContractId: string = TEST_IDENTITIES[0].classContractId
): string {
  return `<!doctype html>
<html><body>
  <h1>Filing Detail</h1>
  <div class="infoHead">Accession Number</div><div class="info">${accessionNumber}</div>
  <div class="infoHead">Documents</div><div class="info">2</div>
  <div class="infoHead">Document Format Files</div>
  <table class="tableFile">
    <tr><th>Document</th></tr>
    <tr><td>primary.htm</td></tr>
    <tr><td>instance.xml</td></tr>
  </table>
  <div class="seriesClassTitle">Series and Classes/Contracts Information:</div>
  <table class="tableSeries">
    <tr><td><a href="?CIK=${seriesId}">${seriesId}</a></td></tr>
    <tr><td><a href="?CIK=${classContractId}">${classContractId}</a></td></tr>
  </table>
</body></html>`
}
