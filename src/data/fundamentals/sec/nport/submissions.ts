import type {
  SecNportFiling,
  SecNportFormType,
  SecNportHistoricalFile,
  SecNportSubmissions,
} from './types'

const ACCESSION_PATTERN = /^\d{10}-\d{2}-\d{6}$/
const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ACCEPTED_AT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readRecord(value: unknown, fieldName: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`Invalid SEC submissions ${fieldName}`)
  }
  return value
}

function readStringArray(record: JsonRecord, fieldName: string): string[] {
  const value = record[fieldName]
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(`Invalid SEC submissions ${fieldName}`)
  }
  return [...value]
}

function isValidCivilDate(value: string): boolean {
  const match = CIVIL_DATE_PATTERN.exec(value)
  if (!match) {
    return false
  }
  const [, year, month, day] = match
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  )
}

function isSupportedForm(value: string): value is SecNportFormType {
  return value === 'NPORT-P' || value === 'NPORT-P/A'
}

function assertValidFiling(filing: SecNportFiling): void {
  if (!ACCESSION_PATTERN.test(filing.accessionNumber)) {
    throw new Error(
      `Invalid SEC N-PORT accession number: ${filing.accessionNumber}`
    )
  }
  if (!isValidCivilDate(filing.filingDate)) {
    throw new Error(`Invalid SEC N-PORT filing date: ${filing.filingDate}`)
  }
  if (!isValidCivilDate(filing.reportDate)) {
    throw new Error(`Invalid SEC N-PORT report date: ${filing.reportDate}`)
  }
  if (
    !ACCEPTED_AT_PATTERN.test(filing.acceptedAt) ||
    Number.isNaN(Date.parse(filing.acceptedAt))
  ) {
    throw new Error(`Invalid SEC N-PORT acceptedAt: ${filing.acceptedAt}`)
  }
  if (
    !filing.primaryDocument.trim() ||
    filing.primaryDocument.includes('/') ||
    filing.primaryDocument.includes('\\')
  ) {
    throw new Error('SEC N-PORT primaryDocument must be a file name')
  }
}

function parseFilingColumns(record: JsonRecord): SecNportFiling[] {
  const form = readStringArray(record, 'form')
  const accessionNumber = readStringArray(record, 'accessionNumber')
  const filingDate = readStringArray(record, 'filingDate')
  const acceptedAt = readStringArray(record, 'acceptanceDateTime')
  const reportDate = readStringArray(record, 'reportDate')
  const primaryDocument = readStringArray(record, 'primaryDocument')
  const lengths = [
    form.length,
    accessionNumber.length,
    filingDate.length,
    acceptedAt.length,
    reportDate.length,
    primaryDocument.length,
  ]

  if (!lengths.every((length) => length === form.length)) {
    throw new Error('SEC submissions filing columns have divergent lengths')
  }

  const filings: SecNportFiling[] = []
  for (let index = 0; index < form.length; index += 1) {
    const formType = form[index]!
    if (!isSupportedForm(formType)) {
      continue
    }
    const filing: SecNportFiling = {
      form: formType,
      accessionNumber: accessionNumber[index]!,
      filingDate: filingDate[index]!,
      acceptedAt: acceptedAt[index]!,
      reportDate: reportDate[index]!,
      primaryDocument: primaryDocument[index]!,
    }
    assertValidFiling(filing)
    filings.push(filing)
  }

  return filings
}

function parseHistoricalFiles(value: unknown): SecNportHistoricalFile[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid SEC submissions filings.files')
  }

  return value.map((item) => {
    const file = readRecord(item, 'historical file')
    if (typeof file.name !== 'string' || !file.name.trim()) {
      throw new Error('Invalid SEC submissions historical file name')
    }
    return { name: file.name }
  })
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error('Invalid SEC submissions JSON')
  }
}

export function parseSecSubmissionsJson(json: string): SecNportSubmissions {
  const root = readRecord(parseJson(json), 'response')
  const filings = readRecord(root.filings, 'filings')
  const recent = readRecord(filings.recent, 'filings.recent')

  return {
    filings: parseFilingColumns(recent),
    historicalFiles: parseHistoricalFiles(filings.files),
  }
}

export function parseSecHistoricalFilingsJson(json: string): SecNportFiling[] {
  return parseFilingColumns(readRecord(parseJson(json), 'historical response'))
}

function acceptedAtSortKey(value: string): string {
  const withoutZulu = value.slice(0, -1)
  const separatorIndex = withoutZulu.indexOf('.')
  if (separatorIndex === -1) {
    return `${withoutZulu}.000000000`
  }
  const wholeSeconds = withoutZulu.slice(0, separatorIndex)
  const fraction = withoutZulu.slice(separatorIndex + 1).padEnd(9, '0')
  return `${wholeSeconds}.${fraction}`
}

export function rankSecNportFilings(
  filings: readonly SecNportFiling[]
): SecNportFiling[] {
  return [...filings].sort((left, right) => {
    if (left.reportDate !== right.reportDate) {
      return left.reportDate > right.reportDate ? -1 : 1
    }
    const leftAcceptedAt = acceptedAtSortKey(left.acceptedAt)
    const rightAcceptedAt = acceptedAtSortKey(right.acceptedAt)
    if (leftAcceptedAt !== rightAcceptedAt) {
      return leftAcceptedAt > rightAcceptedAt ? -1 : 1
    }
    if (left.form !== right.form) {
      return left.form === 'NPORT-P/A' ? -1 : 1
    }
    if (left.accessionNumber === right.accessionNumber) {
      return 0
    }
    return left.accessionNumber > right.accessionNumber ? -1 : 1
  })
}

function hasSameFilingMetadata(
  left: SecNportFiling,
  right: SecNportFiling
): boolean {
  return (
    left.form === right.form &&
    left.accessionNumber === right.accessionNumber &&
    left.filingDate === right.filingDate &&
    left.acceptedAt === right.acceptedAt &&
    left.reportDate === right.reportDate &&
    left.primaryDocument === right.primaryDocument
  )
}

export function mergeSecNportFilings(
  sources: readonly (readonly SecNportFiling[])[]
): SecNportFiling[] {
  const filingsByAccession = new Map<string, SecNportFiling>()

  for (const source of sources) {
    for (const filing of source) {
      const existing = filingsByAccession.get(filing.accessionNumber)
      if (existing && !hasSameFilingMetadata(existing, filing)) {
        throw new Error(
          `Divergent SEC N-PORT metadata for accession ${filing.accessionNumber}`
        )
      }
      if (!existing) {
        filingsByAccession.set(filing.accessionNumber, { ...filing })
      }
    }
  }

  return [...filingsByAccession.values()]
}
