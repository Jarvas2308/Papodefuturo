import {
  CVM_IPE_HEADERS,
  MAX_CVM_IPE_CSV_COLUMNS,
  MAX_CVM_IPE_CSV_ROWS,
} from './constants'
import type { CvmIpeRowV1 } from './types'

function parseDelimitedRows(content: string): string[][] {
  if (content.includes('\0')) throw new Error('CVM IPE CSV contains NUL')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let atFieldStart = true
  let afterClosingQuote = false

  const pushField = (): void => {
    row.push(field)
    if (row.length > MAX_CVM_IPE_CSV_COLUMNS) {
      throw new Error('CVM IPE CSV exceeds column count limit')
    }
    field = ''
    atFieldStart = true
    afterClosingQuote = false
  }
  const pushRow = (): void => {
    pushField()
    rows.push(row)
    if (rows.length > MAX_CVM_IPE_CSV_ROWS + 1) {
      throw new Error('CVM IPE CSV exceeds row count limit')
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
        throw new Error('CVM IPE CSV has content after a closing quote')
      }
    } else if (character === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
    } else if (character === '"') {
      throw new Error('CVM IPE CSV contains a quote inside an unquoted field')
    } else if (character === ';') {
      pushField()
    } else if (character === '\n') {
      if (field.endsWith('\r')) field = field.slice(0, -1)
      pushRow()
    } else if (character === '\r') {
      if (content[index + 1] !== '\n') {
        throw new Error('CVM IPE CSV contains an unsupported CR line ending')
      }
      field += character
    } else {
      field += character
      atFieldStart = false
    }
  }
  if (quoted) throw new Error('CVM IPE CSV contains unterminated quotes')
  if (field.length > 0 || row.length > 0) pushRow()
  return rows
}

function assertHeaders(headers: readonly string[]): void {
  const normalizedHeaders = headers.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '') : header
  )
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new Error('CVM IPE CSV contains duplicate headers')
  }
  if (
    normalizedHeaders.length !== CVM_IPE_HEADERS.length ||
    normalizedHeaders.some((header, index) => header !== CVM_IPE_HEADERS[index])
  ) {
    throw new Error('CVM IPE CSV schema does not match the audited headers')
  }
}

export function parseOfficialCvmIpeCsv(content: string): CvmIpeRowV1[] {
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('CVM IPE CSV is empty')
  }
  const parsedRows = parseDelimitedRows(content)
  if (parsedRows.length === 0) throw new Error('CVM IPE CSV header is missing')
  assertHeaders(parsedRows[0])

  return parsedRows.slice(1).map((values, index) => {
    if (values.length !== CVM_IPE_HEADERS.length) {
      throw new Error(`CVM IPE CSV row ${index + 2} has invalid column count`)
    }
    return {
      rowNumber: index + 2,
      companyCnpj: values[0],
      companyName: values[1],
      cvmCode: values[2],
      referenceDate: values[3],
      category: values[4],
      documentType: values[5],
      species: values[6],
      subject: values[7],
      deliveryDate: values[8],
      presentationType: values[9],
      protocolNumber: values[10],
      version: values[11],
      downloadLink: values[12],
    }
  })
}
