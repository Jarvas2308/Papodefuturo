import {
  SEC_EDGAR_MAX_HISTORICAL_FILES,
  SEC_EDGAR_MAX_RECENT_FILINGS,
} from './constants'
import type {
  SecEdgarHistoricalSubmissionsFileV1,
  SecEdgarRecentFilingV1,
  SecEdgarSubmissionsV1,
} from './types'
import {
  assertAccessionNumber,
  assertCanonicalCik,
  assertSafeInteger,
  assertStrictText,
  canonicalizeCik,
  isValidAcceptanceDateTime,
  isValidCivilDate,
} from './validation'

type JsonObject = Record<string, unknown>

const REQUIRED_RECENT_ARRAYS = [
  'accessionNumber',
  'filingDate',
  'reportDate',
  'acceptanceDateTime',
  'act',
  'form',
  'fileNumber',
  'filmNumber',
  'items',
  'core_type',
  'size',
  'isXBRL',
  'isInlineXBRL',
  'primaryDocument',
  'primaryDocDescription',
] as const

function assertObject(value: unknown, field: string): JsonObject {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`${field} must be a plain object`)
  }
  return Object.fromEntries(Object.entries(value))
}

function assertArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new Error(`${field} must not be sparse`)
    }
  }
  return value
}

function readRecentFiling(
  recent: JsonObject,
  arrays: Readonly<Record<string, unknown[]>>,
  index: number
): SecEdgarRecentFilingV1 {
  const text = (name: string, allowEmpty = true) =>
    assertStrictText(
      arrays[name][index],
      `filings.recent.${name}[${index}]`,
      allowEmpty
    )
  const accessionNumber = text('accessionNumber', false)
  assertAccessionNumber(accessionNumber)
  const filingDate = text('filingDate', false)
  const reportDate = text('reportDate')
  const acceptanceDateTime = text('acceptanceDateTime', false)
  if (!isValidCivilDate(filingDate)) {
    throw new Error(`filings.recent.filingDate[${index}] is invalid`)
  }
  if (reportDate.length > 0 && !isValidCivilDate(reportDate)) {
    throw new Error(`filings.recent.reportDate[${index}] is invalid`)
  }
  if (!isValidAcceptanceDateTime(acceptanceDateTime)) {
    throw new Error(`filings.recent.acceptanceDateTime[${index}] is invalid`)
  }
  const isXbrlNumeric = Object.hasOwn(recent, 'isXBRLNumeric')
    ? assertArray(recent.isXBRLNumeric, 'filings.recent.isXBRLNumeric')[index]
    : null

  return {
    sourceIndex: index,
    accessionNumber,
    filingDate,
    reportDate,
    acceptanceDateTime,
    act: text('act'),
    form: text('form', false),
    fileNumber: text('fileNumber'),
    filmNumber: text('filmNumber'),
    items: text('items'),
    coreType: text('core_type'),
    size: assertSafeInteger(
      arrays.size[index],
      `filings.recent.size[${index}]`
    ),
    isXbrl: assertSafeInteger(
      arrays.isXBRL[index],
      `filings.recent.isXBRL[${index}]`,
      Number.MIN_SAFE_INTEGER
    ),
    isInlineXbrl: assertSafeInteger(
      arrays.isInlineXBRL[index],
      `filings.recent.isInlineXBRL[${index}]`,
      Number.MIN_SAFE_INTEGER
    ),
    isXbrlNumeric:
      isXbrlNumeric === null
        ? null
        : assertSafeInteger(
            isXbrlNumeric,
            `filings.recent.isXBRLNumeric[${index}]`,
            Number.MIN_SAFE_INTEGER
          ),
    primaryDocument: text('primaryDocument'),
    primaryDocDescription: text('primaryDocDescription'),
  }
}

function parseHistoricalFiles(
  value: unknown
): SecEdgarHistoricalSubmissionsFileV1[] {
  const files = assertArray(value, 'filings.files')
  if (files.length > SEC_EDGAR_MAX_HISTORICAL_FILES) {
    throw new Error('filings.files exceeds the supported limit')
  }
  return files.map((entry, index) => {
    const file = assertObject(entry, `filings.files[${index}]`)
    const name = assertStrictText(
      file.name,
      `filings.files[${index}].name`,
      false
    )
    if (
      name.normalize('NFKC') !== name ||
      !/^CIK\d{10}-submissions-\d{3}\.json$/.test(name) ||
      name.includes('/') ||
      name.includes('\\')
    ) {
      throw new Error(`filings.files[${index}].name is not a safe SEC basename`)
    }
    const filingFrom = assertStrictText(
      file.filingFrom,
      `filings.files[${index}].filingFrom`,
      false
    )
    const filingTo = assertStrictText(
      file.filingTo,
      `filings.files[${index}].filingTo`,
      false
    )
    if (!isValidCivilDate(filingFrom) || !isValidCivilDate(filingTo)) {
      throw new Error(`filings.files[${index}] contains an invalid date range`)
    }
    if (filingFrom > filingTo) {
      throw new Error(`filings.files[${index}] has a reversed date range`)
    }
    return {
      name,
      filingCount: assertSafeInteger(
        file.filingCount,
        `filings.files[${index}].filingCount`
      ),
      filingFrom,
      filingTo,
    }
  })
}

export function parseSecEdgarSubmissionsJson(input: {
  jsonText: string
  expectedRegistrantCik: string
}): SecEdgarSubmissionsV1 {
  const { jsonText, expectedRegistrantCik } = input
  assertCanonicalCik(expectedRegistrantCik, 'expectedRegistrantCik')
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('SEC EDGAR submissions payload is not valid JSON')
  }
  const root = assertObject(parsed, 'SEC EDGAR submissions root')
  const registrantCik = canonicalizeCik(
    assertStrictText(root.cik, 'cik', false),
    'cik'
  )
  if (registrantCik !== expectedRegistrantCik) {
    throw new Error(
      'SEC EDGAR submissions CIK diverges from the requested registrant'
    )
  }
  const registrantName = assertStrictText(root.name, 'name', false)
  const filings = assertObject(root.filings, 'filings')
  const recent = assertObject(filings.recent, 'filings.recent')
  const arrays: Record<string, unknown[]> = {}
  for (const name of REQUIRED_RECENT_ARRAYS) {
    arrays[name] = assertArray(recent[name], `filings.recent.${name}`)
  }
  const filingCount = arrays.accessionNumber.length
  if (filingCount > SEC_EDGAR_MAX_RECENT_FILINGS) {
    throw new Error('filings.recent exceeds the supported limit')
  }
  for (const [name, values] of Object.entries(arrays)) {
    if (values.length !== filingCount) {
      throw new Error(`filings.recent.${name} is not aligned`)
    }
  }
  if (Object.hasOwn(recent, 'isXBRLNumeric')) {
    const values = assertArray(
      recent.isXBRLNumeric,
      'filings.recent.isXBRLNumeric'
    )
    if (values.length !== filingCount) {
      throw new Error('filings.recent.isXBRLNumeric is not aligned')
    }
  }

  return {
    registrantCik,
    registrantName,
    recentFilings: Array.from({ length: filingCount }, (_, index) =>
      readRecentFiling(recent, arrays, index)
    ),
    historicalFiles: parseHistoricalFiles(filings.files),
  }
}
