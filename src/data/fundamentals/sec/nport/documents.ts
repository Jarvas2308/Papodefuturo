import type { SecNportFetcher, SecNportFiling } from './types'

const SEC_SUBMISSIONS_BASE_URL = 'https://data.sec.gov/submissions'
const SEC_ARCHIVES_BASE_URL = 'https://www.sec.gov/Archives/edgar/data'

export function assertValidSecUserAgent(userAgent: string): void {
  const normalized = userAgent.trim()
  const parts = normalized.split(/\s+/)
  const application = parts[0] ?? ''
  const contact = parts.slice(1).join(' ')
  const hasApplicationIdentity = /^[A-Za-z0-9._-]+\/\d+(?:\.\d+)*$/.test(
    application
  )
  const hasContact =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
    /^https:\/\/[^\s]+$/.test(contact)

  if (!hasApplicationIdentity || !hasContact) {
    throw new Error(
      'SEC User-Agent must identify the application and provide contact information'
    )
  }
}

function requestHeaders(
  userAgent: string,
  accept: 'application/json' | 'application/xml, text/xml'
): Readonly<Record<string, string>> {
  assertValidSecUserAgent(userAgent)
  return {
    'User-Agent': userAgent.trim(),
    'Accept-Encoding': 'gzip, deflate',
    Accept: accept,
  }
}

async function downloadText(input: {
  url: string
  userAgent: string
  accept: 'application/json' | 'application/xml, text/xml'
  fetcher: SecNportFetcher
}): Promise<string> {
  const response = await input.fetcher(input.url, {
    headers: requestHeaders(input.userAgent, input.accept),
  })
  if (!response.ok) {
    const suffix = response.statusText ? ` ${response.statusText}` : ''
    throw new Error(
      `SEC request failed with HTTP ${response.status}${suffix}: ${input.url}`
    )
  }
  return response.text()
}

export function buildSecSubmissionsUrl(registrantCik: string): string {
  if (!/^\d{10}$/.test(registrantCik)) {
    throw new Error(`Invalid SEC registrant CIK: ${registrantCik}`)
  }
  return `${SEC_SUBMISSIONS_BASE_URL}/CIK${registrantCik}.json`
}

export function buildSecHistoricalSubmissionsUrl(fileName: string): string {
  if (!/^CIK\d{10}-submissions-\d{3}\.json$/.test(fileName)) {
    throw new Error(`Invalid SEC historical submissions file: ${fileName}`)
  }
  return `${SEC_SUBMISSIONS_BASE_URL}/${fileName}`
}

export function buildSecPrimaryDocumentUrl(
  registrantCik: string,
  filing: SecNportFiling
): string {
  if (!/^\d{10}$/.test(registrantCik)) {
    throw new Error(`Invalid SEC registrant CIK: ${registrantCik}`)
  }
  if (!/^\d{10}-\d{2}-\d{6}$/.test(filing.accessionNumber)) {
    throw new Error(
      `Invalid SEC N-PORT accession number: ${filing.accessionNumber}`
    )
  }
  if (
    !filing.primaryDocument.trim() ||
    filing.primaryDocument.includes('/') ||
    filing.primaryDocument.includes('\\')
  ) {
    throw new Error('SEC N-PORT primaryDocument must be a file name')
  }

  const cik = registrantCik.replace(/^0+/, '') || '0'
  const accession = filing.accessionNumber.replaceAll('-', '')
  return `${SEC_ARCHIVES_BASE_URL}/${cik}/${accession}/${filing.primaryDocument}`
}

export function downloadSecSubmissionsJson(input: {
  registrantCik: string
  userAgent: string
  fetcher: SecNportFetcher
}): Promise<string> {
  return downloadText({
    url: buildSecSubmissionsUrl(input.registrantCik),
    userAgent: input.userAgent,
    accept: 'application/json',
    fetcher: input.fetcher,
  })
}

export function downloadSecHistoricalSubmissionsJson(input: {
  fileName: string
  userAgent: string
  fetcher: SecNportFetcher
}): Promise<string> {
  return downloadText({
    url: buildSecHistoricalSubmissionsUrl(input.fileName),
    userAgent: input.userAgent,
    accept: 'application/json',
    fetcher: input.fetcher,
  })
}

export function downloadSecPrimaryDocumentXml(input: {
  registrantCik: string
  filing: SecNportFiling
  userAgent: string
  fetcher: SecNportFetcher
}): Promise<{ url: string; xml: string }> {
  const url = buildSecPrimaryDocumentUrl(input.registrantCik, input.filing)
  return downloadText({
    url,
    userAgent: input.userAgent,
    accept: 'application/xml, text/xml',
    fetcher: input.fetcher,
  }).then((xml) => ({ url, xml }))
}
