import { unzipSync } from 'fflate'
import {
  MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES,
  MAX_CVM_FUND_DELIVERY_ARCHIVE_ENTRIES,
  MAX_CVM_FUND_DELIVERY_DECLARED_UNCOMPRESSED_BYTES,
  MAX_CVM_FUND_DELIVERY_MONTHLY_CSV_BYTES,
} from './constants'
import type {
  CvmFundDeliveryArchiveFetcher,
  DownloadedCvmFundDeliveryArchive,
  OfficialCvmFundDeliveryCsvDocument,
} from './types'

const CVM_FUND_DELIVERY_DATA_BASE_URL =
  'https://dados.cvm.gov.br/dados/FI/DOC/ENTREGA/DADOS'

class CvmFundDeliveryArchiveStructureError extends Error {}

export function assertCvmFundDeliveryYearMonth(yearMonth: string): void {
  const match = /^(\d{4})(\d{2})$/.exec(yearMonth)
  if (!match) throw new RangeError('Invalid CVM Fund Delivery year-month')
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 2021 || year > 9999 || month < 1 || month > 12) {
    throw new RangeError('Invalid CVM Fund Delivery year-month')
  }
}

function archiveFileName(yearMonth: string): string {
  return `fi_entrega_documento_${yearMonth}.zip`
}

function monthlyCsvFileName(yearMonth: string): string {
  return `fi_entrega_documento_${yearMonth}.csv`
}

function assertSafeArchiveEntryName(name: string): void {
  const segments = name.split('/')
  if (
    name.includes('\0') ||
    name.normalize('NFKC') !== name ||
    name.startsWith('/') ||
    /^[A-Za-z]:/.test(name) ||
    name.includes('\\') ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    )
  ) {
    throw new CvmFundDeliveryArchiveStructureError(
      `Unsafe CVM Fund Delivery archive entry: ${name}`
    )
  }
}

function readContentLength(
  response: Awaited<ReturnType<CvmFundDeliveryArchiveFetcher>>
): number | null {
  const raw = response.headers.get('content-length')
  if (raw === null) return null
  if (!/^\d+$/.test(raw)) {
    throw new Error(
      'CVM Fund Delivery Content-Length must be a non-negative integer'
    )
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value)) {
    throw new Error('CVM Fund Delivery Content-Length must be a safe integer')
  }
  return value
}

export function buildOfficialCvmFundDeliveryArchiveUrl(
  yearMonth: string
): string {
  assertCvmFundDeliveryYearMonth(yearMonth)
  return `${CVM_FUND_DELIVERY_DATA_BASE_URL}/${archiveFileName(yearMonth)}`
}

export async function downloadOfficialCvmFundDeliveryArchive(input: {
  yearMonth: string
  fetcher: CvmFundDeliveryArchiveFetcher
}): Promise<DownloadedCvmFundDeliveryArchive> {
  const archiveUrl = buildOfficialCvmFundDeliveryArchiveUrl(input.yearMonth)
  const response = await input.fetcher(archiveUrl)
  if (!response.ok || response.status < 200 || response.status > 299) {
    throw new Error(
      `Failed to download CVM Fund Delivery archive: HTTP ${response.status}`
    )
  }
  const contentLength = readContentLength(response)
  if (
    contentLength !== null &&
    contentLength > MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES
  ) {
    throw new Error(
      'CVM Fund Delivery archive exceeds declared compressed size limit'
    )
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0) {
    throw new Error('CVM Fund Delivery archive is empty')
  }
  if (bytes.byteLength > MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES) {
    throw new Error('CVM Fund Delivery archive exceeds compressed size limit')
  }
  return {
    archiveUrl,
    archiveFileName: archiveFileName(input.yearMonth),
    archiveBytes: bytes.slice(),
  }
}

export function readOfficialCvmFundDeliveryMonthlyCsvFromArchive(input: {
  yearMonth: string
  archiveBytes: Uint8Array
}): OfficialCvmFundDeliveryCsvDocument {
  assertCvmFundDeliveryYearMonth(input.yearMonth)
  if (input.archiveBytes.byteLength === 0) {
    throw new Error('CVM Fund Delivery archive is empty')
  }
  if (input.archiveBytes.byteLength > MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES) {
    throw new Error('CVM Fund Delivery archive exceeds compressed size limit')
  }

  const expectedName = monthlyCsvFileName(input.yearMonth)
  let entryCount = 0
  let matchingCount = 0
  let totalOriginalSize = 0
  const entryNames = new Set<string>()
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(input.archiveBytes, {
      filter: (entry) => {
        entryCount += 1
        if (entryCount > MAX_CVM_FUND_DELIVERY_ARCHIVE_ENTRIES) {
          throw new CvmFundDeliveryArchiveStructureError(
            'CVM Fund Delivery archive exceeds entry count limit'
          )
        }
        assertSafeArchiveEntryName(entry.name)
        if (entryNames.has(entry.name)) {
          throw new CvmFundDeliveryArchiveStructureError(
            `Duplicate CVM Fund Delivery archive entry: ${entry.name}`
          )
        }
        entryNames.add(entry.name)
        if (
          !Number.isSafeInteger(entry.originalSize) ||
          entry.originalSize < 0
        ) {
          throw new CvmFundDeliveryArchiveStructureError(
            `Invalid declared size for CVM Fund Delivery entry: ${entry.name}`
          )
        }
        totalOriginalSize += entry.originalSize
        if (
          totalOriginalSize > MAX_CVM_FUND_DELIVERY_DECLARED_UNCOMPRESSED_BYTES
        ) {
          throw new CvmFundDeliveryArchiveStructureError(
            'CVM Fund Delivery archive exceeds declared uncompressed size limit'
          )
        }
        if (entry.name.toLowerCase() === expectedName.toLowerCase()) {
          if (entry.name !== expectedName) {
            throw new CvmFundDeliveryArchiveStructureError(
              `Ambiguous CVM Fund Delivery monthly CSV entry: ${entry.name}`
            )
          }
          if (entry.originalSize > MAX_CVM_FUND_DELIVERY_MONTHLY_CSV_BYTES) {
            throw new CvmFundDeliveryArchiveStructureError(
              'CVM Fund Delivery monthly CSV exceeds declared size limit'
            )
          }
          matchingCount += 1
          return true
        }
        return false
      },
    })
  } catch (error) {
    if (error instanceof CvmFundDeliveryArchiveStructureError) throw error
    throw new Error('Invalid CVM Fund Delivery ZIP archive', { cause: error })
  }

  if (matchingCount === 0 || files[expectedName] === undefined) {
    throw new Error(`CVM Fund Delivery archive is missing ${expectedName}`)
  }
  if (matchingCount !== 1) {
    throw new Error(
      `CVM Fund Delivery archive contains multiple ${expectedName} entries`
    )
  }
  const contentBytes = files[expectedName]
  if (contentBytes.byteLength === 0) {
    throw new Error('CVM Fund Delivery monthly CSV is empty')
  }
  if (contentBytes.byteLength > MAX_CVM_FUND_DELIVERY_MONTHLY_CSV_BYTES) {
    throw new Error('CVM Fund Delivery monthly CSV exceeds size limit')
  }
  return {
    csvFileName: expectedName,
    content: new TextDecoder('windows-1252', { fatal: true }).decode(
      contentBytes
    ),
  }
}
