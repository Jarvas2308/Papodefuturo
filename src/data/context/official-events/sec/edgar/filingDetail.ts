import {
  SEC_EDGAR_MAX_CLASSES,
  SEC_EDGAR_MAX_DOCUMENTS,
  SEC_EDGAR_MAX_SERIES,
} from './constants'
import type { SecEdgarFilingDetailV1, SecEdgarSeriesClassV1 } from './types'
import { assertAccessionNumber } from './validation'

type HtmlToken =
  | {
      type: 'start'
      name: string
      attributes: Readonly<Record<string, string>>
    }
  | { type: 'end'; name: string }
  | { type: 'text'; value: string }

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi,
    (_entity, body: string) => {
      const lower = body.toLowerCase()
      if (lower === 'amp') return '&'
      if (lower === 'lt') return '<'
      if (lower === 'gt') return '>'
      if (lower === 'quot') return '"'
      if (lower === 'apos') return "'"
      if (lower === 'nbsp') return ' '
      const codePoint = lower.startsWith('#x')
        ? Number.parseInt(lower.slice(2), 16)
        : Number.parseInt(lower.slice(1), 10)
      if (
        !Number.isSafeInteger(codePoint) ||
        codePoint <= 0 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        throw new Error('SEC EDGAR filing detail contains an invalid entity')
      }
      return String.fromCodePoint(codePoint)
    }
  )
}

function findTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | null = null
  for (let index = start; index < html.length; index += 1) {
    const character = html[index]
    if (quote !== null) {
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '>') return index
  }
  throw new Error('SEC EDGAR filing detail contains an unterminated tag')
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const attributePattern =
    /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  while ((match = attributePattern.exec(source)) !== null) {
    const name = match[1].toLowerCase()
    if (!Object.hasOwn(attributes, name)) {
      attributes[name] = decodeHtmlEntities(
        match[2] ?? match[3] ?? match[4] ?? ''
      )
    }
  }
  return attributes
}

function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = []
  let cursor = 0
  while (cursor < html.length) {
    const opening = html.indexOf('<', cursor)
    if (opening < 0) {
      if (cursor < html.length) {
        tokens.push({
          type: 'text',
          value: decodeHtmlEntities(html.slice(cursor)),
        })
      }
      break
    }
    if (opening > cursor) {
      tokens.push({
        type: 'text',
        value: decodeHtmlEntities(html.slice(cursor, opening)),
      })
    }
    if (html.startsWith('<!--', opening)) {
      const commentEnd = html.indexOf('-->', opening + 4)
      if (commentEnd < 0)
        throw new Error('SEC EDGAR filing detail has an unterminated comment')
      cursor = commentEnd + 3
      continue
    }
    if (/^<!doctype\b/i.test(html.slice(opening, opening + 20))) {
      cursor = findTagEnd(html, opening + 2) + 1
      continue
    }
    const tagEnd = findTagEnd(html, opening + 1)
    const raw = html.slice(opening + 1, tagEnd).trim()
    const closing = raw.startsWith('/')
    const body = closing ? raw.slice(1).trim() : raw
    const nameMatch = /^([a-zA-Z][a-zA-Z0-9:-]*)/.exec(body)
    if (!nameMatch) {
      cursor = tagEnd + 1
      continue
    }
    const name = nameMatch[1].toLowerCase()
    if (closing) {
      tokens.push({ type: 'end', name })
      cursor = tagEnd + 1
      continue
    }
    const attributes = parseAttributes(body.slice(nameMatch[0].length))
    cursor = tagEnd + 1
    if (name === 'script' || name === 'style') {
      const closingPattern = new RegExp(`<\\/\\s*${name}\\s*>`, 'gi')
      closingPattern.lastIndex = cursor
      const closingMatch = closingPattern.exec(html)
      if (!closingMatch)
        throw new Error(`SEC EDGAR filing detail has an unterminated ${name}`)
      cursor = closingMatch.index + closingMatch[0].length
      continue
    }
    tokens.push({ type: 'start', name, attributes })
  }
  return tokens
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function hasClass(
  token: Extract<HtmlToken, { type: 'start' }>,
  className: string
): boolean {
  return (token.attributes.class ?? '').split(/\s+/).includes(className)
}

function findElementEnd(
  tokens: readonly HtmlToken[],
  startIndex: number
): number {
  const start = tokens[startIndex]
  if (start.type !== 'start') throw new Error('Expected an HTML start token')
  if (VOID_ELEMENTS.has(start.name)) return startIndex
  let depth = 0
  for (let index = startIndex; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type === 'start' && token.name === start.name) depth += 1
    if (token.type === 'end' && token.name === start.name) {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error(
    `SEC EDGAR filing detail has an unterminated ${start.name} element`
  )
}

function tokenRangeText(
  tokens: readonly HtmlToken[],
  startIndex: number,
  endIndex: number
): string {
  return collapseWhitespace(
    tokens
      .slice(startIndex, endIndex + 1)
      .filter(
        (token): token is Extract<HtmlToken, { type: 'text' }> =>
          token.type === 'text'
      )
      .map((token) => token.value)
      .join(' ')
  )
}

function collectRows(
  tokens: readonly HtmlToken[],
  tableStart: number,
  tableEnd: number
): string[] {
  const rows: string[] = []
  for (let index = tableStart + 1; index < tableEnd; index += 1) {
    const token = tokens[index]
    if (token.type !== 'start' || token.name !== 'tr') continue
    const rowEnd = findElementEnd(tokens, index)
    if (rowEnd > tableEnd)
      throw new Error('SEC EDGAR filing detail contains a malformed table row')
    rows.push(tokenRangeText(tokens, index, rowEnd))
    index = rowEnd
  }
  return rows
}

function findImmediateAssociatedTable(
  tokens: readonly HtmlToken[],
  markerIndex: number,
  context: string
): number {
  const markerEnd = findElementEnd(tokens, markerIndex)
  for (let index = markerEnd + 1; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type === 'end') continue
    if (token.type === 'text' && collapseWhitespace(token.value).length === 0) {
      continue
    }
    if (token.type === 'start' && token.name === 'table') return index
    throw new Error(
      `SEC EDGAR ${context} is not immediately followed by its table`
    )
  }
  throw new Error(`SEC EDGAR ${context} is not followed by its table`)
}

function extractSeries(
  tokens: readonly HtmlToken[],
  headingIndex: number
): SecEdgarSeriesClassV1[] {
  const tableIndex = findImmediateAssociatedTable(
    tokens,
    headingIndex,
    'series heading'
  )
  const rows = collectRows(
    tokens,
    tableIndex,
    findElementEnd(tokens, tableIndex)
  )
  const segments: Array<{ seriesId: string; classContractIds: string[] }> = []
  let current: { seriesId: string; classContractIds: string[] } | null = null
  let seriesOccurrences = 0
  let classOccurrences = 0
  for (const row of rows) {
    const observedSeriesIds = row.match(/\bS\d{9}\b/g) ?? []
    const observedClassIds = row.match(/\bC\d{9}\b/g) ?? []
    seriesOccurrences += observedSeriesIds.length
    classOccurrences += observedClassIds.length
    if (
      seriesOccurrences > SEC_EDGAR_MAX_SERIES ||
      classOccurrences > SEC_EDGAR_MAX_CLASSES
    ) {
      throw new Error('SEC EDGAR series table exceeds the supported limits')
    }
    const seriesIds = [...new Set(observedSeriesIds)]
    const classIds = [...new Set(observedClassIds)]
    if (seriesIds.length > 1 || classIds.length > 1) {
      throw new Error(
        'SEC EDGAR series table row contains multiple official identifiers'
      )
    }
    if (seriesIds.length === 1) {
      current = { seriesId: seriesIds[0], classContractIds: [] }
      segments.push(current)
    }
    if (classIds.length === 1) {
      if (current === null) {
        throw new Error('SEC EDGAR class appears before its parent series')
      }
      if (!current.classContractIds.includes(classIds[0])) {
        current.classContractIds.push(classIds[0])
      }
    }
  }
  const bySeries = new Map<string, string[]>()
  const classOwners = new Map<string, string>()
  for (const segment of segments) {
    const previous = bySeries.get(segment.seriesId)
    if (
      previous &&
      JSON.stringify(previous) !== JSON.stringify(segment.classContractIds)
    ) {
      throw new Error(
        'SEC EDGAR series table contains contradictory duplicate series'
      )
    }
    if (!previous) bySeries.set(segment.seriesId, [...segment.classContractIds])
    for (const classId of segment.classContractIds) {
      const owner = classOwners.get(classId)
      if (owner && owner !== segment.seriesId) {
        throw new Error('SEC EDGAR class is associated with multiple series')
      }
      classOwners.set(classId, segment.seriesId)
    }
  }
  if (bySeries.size === 0)
    throw new Error('SEC EDGAR series table contains no series')
  return [...bySeries].map(([seriesId, classContractIds]) => ({
    seriesId,
    classes: classContractIds.map((classContractId) => ({ classContractId })),
  }))
}

function findStructuredInfoValue(
  tokens: readonly HtmlToken[],
  label: string
): string | null {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'start' || !hasClass(token, 'infoHead')) continue
    const end = findElementEnd(tokens, index)
    const text = tokenRangeText(tokens, index, end)
    if (text !== label) continue
    for (let next = end + 1; next < tokens.length; next += 1) {
      const candidate = tokens[next]
      if (candidate.type === 'end') continue
      if (
        candidate.type === 'text' &&
        collapseWhitespace(candidate.value).length === 0
      ) {
        continue
      }
      if (
        candidate.type !== 'start' ||
        candidate.name !== 'div' ||
        !hasClass(candidate, 'info')
      ) {
        return null
      }
      const candidateEnd = findElementEnd(tokens, next)
      return tokenRangeText(tokens, next, candidateEnd)
    }
  }
  return null
}

function findOfficialDocumentTable(tokens: readonly HtmlToken[]): number {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'start' || !hasClass(token, 'infoHead')) continue
    const end = findElementEnd(tokens, index)
    if (tokenRangeText(tokens, index, end) === 'Document Format Files') {
      return findImmediateAssociatedTable(tokens, index, 'document marker')
    }
  }
  throw new Error(
    'SEC EDGAR filing detail is missing the official document table marker'
  )
}

function findDocumentCount(tokens: readonly HtmlToken[]): number {
  const declaredText = findStructuredInfoValue(tokens, 'Documents')
  if (declaredText === null || !/^\d+$/.test(declaredText)) {
    throw new Error(
      'SEC EDGAR filing detail does not expose a valid document count'
    )
  }
  const declaredCount = Number(declaredText)
  if (
    !Number.isSafeInteger(declaredCount) ||
    declaredCount > SEC_EDGAR_MAX_DOCUMENTS
  ) {
    throw new Error(
      'SEC EDGAR filing detail document count exceeds the supported limit'
    )
  }
  const tableIndex = findOfficialDocumentTable(tokens)
  const tableEnd = findElementEnd(tokens, tableIndex)
  let observedCount = 0
  for (let index = tableIndex + 1; index < tableEnd; index += 1) {
    const token = tokens[index]
    if (token.type !== 'start' || token.name !== 'tr') continue
    const rowEnd = findElementEnd(tokens, index)
    const hasDataCell = tokens
      .slice(index + 1, rowEnd)
      .some(
        (candidate) => candidate.type === 'start' && candidate.name === 'td'
      )
    if (hasDataCell) {
      observedCount += 1
      if (observedCount > SEC_EDGAR_MAX_DOCUMENTS) {
        throw new Error(
          'SEC EDGAR filing detail document count exceeds the supported limit'
        )
      }
    }
    index = rowEnd
  }
  if (observedCount !== declaredCount) {
    throw new Error(
      'SEC EDGAR filing detail document count diverges from its official table'
    )
  }
  return observedCount
}

function hasOfficialFilingDetailMarker(tokens: readonly HtmlToken[]): boolean {
  return tokens.some((token, index) => {
    if (token.type !== 'start' || !['title', 'h1', 'h2'].includes(token.name)) {
      return false
    }
    const text = tokenRangeText(tokens, index, findElementEnd(tokens, index))
    return (
      text === 'Filing Detail' ||
      (token.name === 'title' && text === 'SEC.gov | Filing Detail')
    )
  })
}

function hasOfficialAccession(
  tokens: readonly HtmlToken[],
  expectedAccessionNumber: string
): boolean {
  return (
    findStructuredInfoValue(tokens, 'Accession Number') ===
    expectedAccessionNumber
  )
}

export function parseSecEdgarFilingDetailHtml(input: {
  html: string
  expectedAccessionNumber: string
}): SecEdgarFilingDetailV1 {
  const { html, expectedAccessionNumber } = input
  assertAccessionNumber(expectedAccessionNumber)
  if (html.includes('\u0000'))
    throw new Error('SEC EDGAR filing detail contains NUL')
  if (html.trim().length === 0)
    throw new Error('SEC EDGAR filing detail contains only whitespace')
  const tokens = tokenizeHtml(html)
  if (!hasOfficialFilingDetailMarker(tokens)) {
    throw new Error('SEC EDGAR payload is not an official filing detail page')
  }
  if (!hasOfficialAccession(tokens, expectedAccessionNumber)) {
    throw new Error(
      'SEC EDGAR filing detail accession diverges from the requested filing'
    )
  }
  const documentCount = findDocumentCount(tokens)
  let headingIndex = -1
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'start') continue
    const end = findElementEnd(tokens, index)
    if (
      tokenRangeText(tokens, index, end) ===
      'Series and Classes/Contracts Information:'
    ) {
      headingIndex = index
      break
    }
  }
  if (headingIndex < 0) {
    return {
      accessionNumber: expectedAccessionNumber,
      scope: 'registrant-only',
      series: [],
      seriesCount: 0,
      classCount: 0,
      documentCount,
    }
  }
  const series = extractSeries(tokens, headingIndex)
  const classCount = series.reduce(
    (total, item) => total + item.classes.length,
    0
  )
  return {
    accessionNumber: expectedAccessionNumber,
    scope: 'series-and-classes',
    series,
    seriesCount: series.length,
    classCount,
    documentCount,
  }
}
