import { unzipSync } from 'fflate'
import {
  MAX_CVM_IPE_ARCHIVE_BYTES,
  MAX_CVM_IPE_ARCHIVE_ENTRIES,
  MAX_CVM_IPE_UNCOMPRESSED_BYTES,
} from './constants'
import type {
  CvmIpeArchiveFetcher,
  DownloadedCvmIpeArchive,
  OfficialCvmIpeCsvDocument,
} from './types'

const CVM_IPE_DATA_BASE_URL =
  'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS'

class CvmIpeArchiveStructureError extends Error {}

function assertCvmIpeYear(year: number): void {
  if (!Number.isSafeInteger(year) || year < 2003 || year > 9999) {
    throw new RangeError(`Invalid CVM IPE archive year: ${year}`)
  }
}

function archiveFileName(year: number): string {
  return `ipe_cia_aberta_${year}.zip`
}

function csvFileName(year: number): string {
  return `ipe_cia_aberta_${year}.csv`
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
    throw new CvmIpeArchiveStructureError(
      `Unsafe CVM IPE archive entry: ${name}`
    )
  }
}

function readContentLength(
  response: Awaited<ReturnType<CvmIpeArchiveFetcher>>
): number | null {
  const raw = response.headers.get('content-length')
  if (raw === null) return null
  if (!/^\d+$/.test(raw)) {
    throw new Error('CVM IPE Content-Length must be a non-negative integer')
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value)) {
    throw new Error('CVM IPE Content-Length must be a safe integer')
  }
  return value
}

export function buildOfficialCvmIpeArchiveUrl(year: number): string {
  assertCvmIpeYear(year)
  return `${CVM_IPE_DATA_BASE_URL}/${archiveFileName(year)}`
}

export async function downloadOfficialCvmIpeArchive(input: {
  year: number
  fetcher: CvmIpeArchiveFetcher
}): Promise<DownloadedCvmIpeArchive> {
  const archiveUrl = buildOfficialCvmIpeArchiveUrl(input.year)
  const response = await input.fetcher(archiveUrl)
  if (!response.ok || response.status < 200 || response.status > 299) {
    throw new Error(
      `Failed to download CVM IPE archive: HTTP ${response.status}`
    )
  }
  const contentLength = readContentLength(response)
  if (contentLength !== null && contentLength > MAX_CVM_IPE_ARCHIVE_BYTES) {
    throw new Error('CVM IPE archive exceeds declared compressed size limit')
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0) throw new Error('CVM IPE archive is empty')
  if (bytes.byteLength > MAX_CVM_IPE_ARCHIVE_BYTES) {
    throw new Error('CVM IPE archive exceeds compressed size limit')
  }
  return {
    archiveUrl,
    archiveFileName: archiveFileName(input.year),
    archiveBytes: bytes.slice(),
  }
}

export function readOfficialCvmIpeCsvFromArchive(input: {
  year: number
  archiveBytes: Uint8Array
}): OfficialCvmIpeCsvDocument {
  assertCvmIpeYear(input.year)
  if (input.archiveBytes.byteLength === 0) {
    throw new Error('CVM IPE archive is empty')
  }
  if (input.archiveBytes.byteLength > MAX_CVM_IPE_ARCHIVE_BYTES) {
    throw new Error('CVM IPE archive exceeds compressed size limit')
  }

  const expectedName = csvFileName(input.year)
  let entryCount = 0
  let matchingCount = 0
  let totalOriginalSize = 0
  const entryNames = new Set<string>()
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(input.archiveBytes, {
      filter: (entry) => {
        entryCount += 1
        if (entryCount > MAX_CVM_IPE_ARCHIVE_ENTRIES) {
          throw new CvmIpeArchiveStructureError(
            'CVM IPE archive exceeds entry count limit'
          )
        }
        assertSafeArchiveEntryName(entry.name)
        if (entryNames.has(entry.name)) {
          throw new CvmIpeArchiveStructureError(
            `Duplicate CVM IPE archive entry: ${entry.name}`
          )
        }
        entryNames.add(entry.name)
        if (
          !Number.isSafeInteger(entry.originalSize) ||
          entry.originalSize < 0
        ) {
          throw new CvmIpeArchiveStructureError(
            `Invalid declared size for CVM IPE archive entry: ${entry.name}`
          )
        }
        totalOriginalSize += entry.originalSize
        if (totalOriginalSize > MAX_CVM_IPE_UNCOMPRESSED_BYTES) {
          throw new CvmIpeArchiveStructureError(
            'CVM IPE archive exceeds uncompressed size limit'
          )
        }
        if (entry.name.toLowerCase() === expectedName.toLowerCase()) {
          if (entry.name !== expectedName) {
            throw new CvmIpeArchiveStructureError(
              `Ambiguous CVM IPE CSV entry: ${entry.name}`
            )
          }
          matchingCount += 1
          return true
        }
        return false
      },
    })
  } catch (error) {
    if (error instanceof CvmIpeArchiveStructureError) {
      throw error
    }
    throw new Error('Invalid CVM IPE ZIP archive', { cause: error })
  }

  if (matchingCount === 0 || files[expectedName] === undefined) {
    throw new Error(`CVM IPE archive is missing ${expectedName}`)
  }
  if (matchingCount !== 1) {
    throw new Error(`CVM IPE archive contains multiple ${expectedName} entries`)
  }
  const contentBytes = files[expectedName]
  if (contentBytes.byteLength === 0) throw new Error('CVM IPE CSV is empty')
  if (contentBytes.byteLength > MAX_CVM_IPE_UNCOMPRESSED_BYTES) {
    throw new Error('CVM IPE CSV exceeds uncompressed size limit')
  }
  return {
    csvFileName: expectedName,
    content: new TextDecoder('windows-1252', { fatal: true }).decode(
      contentBytes
    ),
  }
}
