import { assertAccessionNumber, assertCanonicalCik } from './validation'

export function buildSecEdgarSubmissionsUrl(input: {
  registrantCik: string
}): string {
  const { registrantCik } = input
  assertCanonicalCik(registrantCik, 'registrantCik')
  return `https://data.sec.gov/submissions/CIK${registrantCik}.json`
}

export function buildSecEdgarFilingDetailUrl(input: {
  accessionNumber: string
}): string {
  const { accessionNumber } = input
  assertAccessionNumber(accessionNumber)
  const archiveCik = accessionNumber.slice(0, 10).replace(/^0+/, '')
  if (archiveCik.length === 0) {
    throw new Error('SEC EDGAR accession archive CIK must be positive')
  }
  const accessionWithoutDashes = accessionNumber.replaceAll('-', '')
  return `https://www.sec.gov/Archives/edgar/data/${archiveCik}/${accessionWithoutDashes}/${accessionNumber}-index.html`
}
