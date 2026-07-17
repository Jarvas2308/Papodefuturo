import {
  CVM_FUND_DELIVERY_HEADERS,
  MAX_CVM_FUND_DELIVERY_CSV_COLUMNS,
  MAX_CVM_FUND_DELIVERY_CSV_ROWS,
} from './constants'
import type { CvmFundDeliveryRowV1 } from './types'

function parseDelimitedRows(content: string): string[][] {
  if (content.includes('\0')) {
    throw new Error('CVM Fund Delivery CSV contains NUL')
  }
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let atFieldStart = true
  let afterClosingQuote = false

  const pushField = (): void => {
    row.push(field)
    if (row.length > MAX_CVM_FUND_DELIVERY_CSV_COLUMNS) {
      throw new Error('CVM Fund Delivery CSV exceeds column count limit')
    }
    field = ''
    atFieldStart = true
    afterClosingQuote = false
  }
  const pushRow = (): void => {
    pushField()
    rows.push(row)
    if (rows.length > MAX_CVM_FUND_DELIVERY_CSV_ROWS + 1) {
      throw new Error('CVM Fund Delivery CSV exceeds row count limit')
    }
    row = []
  }

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    if (quoted) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
          afterClosingQuote = true
        }
      } else {
        field += character
      }
      continue
    }
    if (afterClosingQuote) {
      if (character === ';') {
        pushField()
      } else if (character === '\n') {
        pushRow()
      } else if (character !== '\r' || content[index + 1] !== '\n') {
        throw new Error(
          'CVM Fund Delivery CSV has content after a closing quote'
        )
      }
    } else if (character === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
    } else if (character === '"') {
      throw new Error(
        'CVM Fund Delivery CSV contains a quote inside an unquoted field'
      )
    } else if (character === ';') {
      pushField()
    } else if (character === '\n') {
      if (field.endsWith('\r')) field = field.slice(0, -1)
      pushRow()
    } else if (character === '\r') {
      if (content[index + 1] !== '\n') {
        throw new Error(
          'CVM Fund Delivery CSV contains an unsupported CR line ending'
        )
      }
      field += character
    } else {
      field += character
      atFieldStart = false
    }
  }
  if (quoted) {
    throw new Error('CVM Fund Delivery CSV contains unterminated quotes')
  }
  if (field.length > 0 || row.length > 0) pushRow()
  return rows
}

function assertHeaders(headers: readonly string[]): void {
  const normalizedHeaders = headers.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '') : header
  )
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new Error('CVM Fund Delivery CSV contains duplicate headers')
  }
  if (
    normalizedHeaders.length !== CVM_FUND_DELIVERY_HEADERS.length ||
    normalizedHeaders.some(
      (header, index) => header !== CVM_FUND_DELIVERY_HEADERS[index]
    )
  ) {
    throw new Error(
      'CVM Fund Delivery CSV schema does not match the audited headers'
    )
  }
}

export function parseOfficialCvmFundDeliveryCsv(
  content: string
): CvmFundDeliveryRowV1[] {
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('CVM Fund Delivery CSV is empty')
  }
  const parsedRows = parseDelimitedRows(content)
  if (parsedRows.length === 0) {
    throw new Error('CVM Fund Delivery CSV header is missing')
  }
  assertHeaders(parsedRows[0])

  return parsedRows.slice(1).map((values, index) => {
    if (values.length !== CVM_FUND_DELIVERY_HEADERS.length) {
      throw new Error(
        `CVM Fund Delivery CSV row ${index + 2} has invalid column count`
      )
    }
    return {
      rowNumber: index + 2,
      fundClassType: values[0],
      fundClassCnpj: values[1],
      subclassId: values[2],
      documentType: values[3],
      competenceStartDate: values[4],
      competenceEndDate: values[5],
      documentId: values[6],
      deliveryDateTime: values[7],
      presentationType: values[8],
      activeIndicator: values[9],
      sourceSystem: values[10],
    }
  })
}
