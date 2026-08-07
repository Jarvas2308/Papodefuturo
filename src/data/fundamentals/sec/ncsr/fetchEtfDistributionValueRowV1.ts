import {
  buildEtfDistributionValueRowV1,
  type EtfDistributionValueRowV1,
} from './buildEtfDistributionValueRowV1'
import type { EtfNcsrFundIdentityV1 } from './etfNcsrFundIdentityV1'

type FetchLike = typeof fetch

// Um trust protocola VÁRIOS N-CSR no mesmo dia, um por grupo de fundos,
// e nada no índice diz qual deles contém o fundo que interessa - só o
// corpo do documento diz. Por isso a descoberta aqui é: listar os N-CSR
// mais recentes do CIK, baixar um a um em ordem e ficar com o PRIMEIRO
// cujo bloco "Financial Highlights" do par (fundo, classe ETF) exista.
// Se nenhum contiver, devolve `null` - nunca um palpite.
//
// Só `filings.recent` é usado, mesma restrição já documentada do provider
// SEC EDGAR de eventos oficiais (`AGENTS.md`, News & Events V1).

const SEC_ARCHIVES_HOST = 'www.sec.gov'
const SEC_SUBMISSIONS_HOST = 'data.sec.gov'
const MAX_DOCUMENT_BYTES = 32 * 1024 * 1024
const MAX_SUBMISSIONS_BYTES = 8 * 1024 * 1024
const ANNUAL_REPORT_FORMS = new Set(['N-CSR', 'N-CSR/A'])

export type SecSubmissionsIndexEntry = {
  form: string
  filingDate: string
  accessionNumber: string
  primaryDocument: string
}

export function buildSecSubmissionsUrlV1(registrantCik: string): string {
  if (!/^\d{10}$/.test(registrantCik)) {
    throw new Error(`SEC registrant CIK must be 10 digits: ${registrantCik}`)
  }
  return `https://${SEC_SUBMISSIONS_HOST}/submissions/CIK${registrantCik}.json`
}

export function buildSecArchiveDocumentUrlV1(input: {
  registrantCik: string
  accessionNumber: string
  primaryDocument: string
}): string {
  const { registrantCik, accessionNumber, primaryDocument } = input
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber)) {
    throw new Error(`SEC accession number is malformed: ${accessionNumber}`)
  }
  if (!/^[\w.-]+$/.test(primaryDocument)) {
    throw new Error(`SEC primary document name is malformed: ${primaryDocument}`)
  }
  const archiveCik = registrantCik.replace(/^0+/, '')
  const accessionWithoutDashes = accessionNumber.replaceAll('-', '')
  return `https://${SEC_ARCHIVES_HOST}/Archives/edgar/data/${archiveCik}/${accessionWithoutDashes}/${primaryDocument}`
}

// `filings.recent` é colunar (arrays paralelos). Falha fechada se os
// comprimentos não baterem - índice inconsistente nunca vira linha.
export function readRecentAnnualReportFilingsV1(
  submissions: unknown
): SecSubmissionsIndexEntry[] | null {
  if (typeof submissions !== 'object' || submissions === null) return null
  const filings = (submissions as { filings?: unknown }).filings
  if (typeof filings !== 'object' || filings === null) return null
  const recent = (filings as { recent?: unknown }).recent
  if (typeof recent !== 'object' || recent === null) return null

  const columns = recent as Record<string, unknown>
  const form = columns.form
  const filingDate = columns.filingDate
  const accessionNumber = columns.accessionNumber
  const primaryDocument = columns.primaryDocument

  if (
    !Array.isArray(form) ||
    !Array.isArray(filingDate) ||
    !Array.isArray(accessionNumber) ||
    !Array.isArray(primaryDocument) ||
    form.length !== filingDate.length ||
    form.length !== accessionNumber.length ||
    form.length !== primaryDocument.length
  ) {
    return null
  }

  const entries: SecSubmissionsIndexEntry[] = []
  for (let index = 0; index < form.length; index += 1) {
    if (!ANNUAL_REPORT_FORMS.has(String(form[index]))) continue
    entries.push({
      form: String(form[index]),
      filingDate: String(filingDate[index]),
      accessionNumber: String(accessionNumber[index]),
      primaryDocument: String(primaryDocument[index]),
    })
  }

  return entries.sort((left, right) =>
    left.filingDate < right.filingDate ? 1 : -1
  )
}

async function fetchTextWithLimit(
  url: string,
  limitInBytes: number,
  userAgent: string,
  fetchImplementation: FetchLike
): Promise<string> {
  const parsed = new URL(url)
  if (
    parsed.hostname !== SEC_ARCHIVES_HOST &&
    parsed.hostname !== SEC_SUBMISSIONS_HOST
  ) {
    throw new Error(`SEC host not allowed: ${parsed.hostname}`)
  }

  const response = await fetchImplementation(url, {
    headers: { 'User-Agent': userAgent, Accept: 'text/html,application/json' },
  })
  if (!response.ok) {
    throw new Error(`SEC responded ${response.status} for ${url}`)
  }

  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > limitInBytes) {
    throw new Error(
      `SEC document exceeds the defensive size limit: ${buffer.byteLength} bytes`
    )
  }
  return new TextDecoder('utf-8').decode(buffer)
}

export async function fetchEtfDistributionValueRowV1(
  params: {
    identity: EtfNcsrFundIdentityV1
    userAgent: string
    maxFilingsToInspect?: number
    onProgress?: (message: string) => void
    delay?: (milliseconds: number) => Promise<void>
    fairAccessDelayMs?: number
  },
  fetchImplementation: FetchLike = fetch
): Promise<EtfDistributionValueRowV1 | null> {
  const {
    identity,
    userAgent,
    maxFilingsToInspect = 4,
    onProgress,
    delay,
    fairAccessDelayMs = 500,
  } = params

  const submissionsText = await fetchTextWithLimit(
    buildSecSubmissionsUrlV1(identity.registrantCik),
    MAX_SUBMISSIONS_BYTES,
    userAgent,
    fetchImplementation
  )

  const filings = readRecentAnnualReportFilingsV1(JSON.parse(submissionsText))
  if (filings === null || filings.length === 0) {
    return null
  }

  for (const filing of filings.slice(0, maxFilingsToInspect)) {
    if (delay) {
      await delay(fairAccessDelayMs)
    }

    const documentUrl = buildSecArchiveDocumentUrlV1({
      registrantCik: identity.registrantCik,
      accessionNumber: filing.accessionNumber,
      primaryDocument: filing.primaryDocument,
    })
    onProgress?.(`Inspecionando ${filing.form} ${filing.accessionNumber}`)

    const documentHtml = await fetchTextWithLimit(
      documentUrl,
      MAX_DOCUMENT_BYTES,
      userAgent,
      fetchImplementation
    )

    const row = buildEtfDistributionValueRowV1({
      identity,
      accessionNumber: filing.accessionNumber,
      documentUrl,
      documentHtml,
    })
    if (row !== null) {
      return row
    }
  }

  return null
}
