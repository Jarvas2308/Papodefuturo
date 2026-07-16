import type {
  SecNportFormType,
  SecNportParsedDocument,
  SecNportRawFact,
  SecNportXmlPathName,
} from './types'

export const SEC_NPORT_XML_NAMESPACE = 'http://www.sec.gov/edgar/nport'

export const SEC_NPORT_XML_PATHS = {
  form: '/edgarSubmission/headerData/submissionType',
  headerCik:
    '/edgarSubmission/headerData/filerInfo/filer/issuerCredentials/cik',
  headerSeriesId:
    '/edgarSubmission/headerData/filerInfo/filer/seriesClassInfo/seriesId',
  headerClassId:
    '/edgarSubmission/headerData/filerInfo/filer/seriesClassInfo/classId',
  registrantName: '/edgarSubmission/formData/genInfo/regName',
  registrantCik: '/edgarSubmission/formData/genInfo/regCik',
  seriesName: '/edgarSubmission/formData/genInfo/seriesName',
  seriesId: '/edgarSubmission/formData/genInfo/seriesId',
  reportDate: '/edgarSubmission/formData/genInfo/repPdDate',
  totalAssets: '/edgarSubmission/formData/fundInfo/totAssets',
  totalLiabilities: '/edgarSubmission/formData/fundInfo/totLiabs',
  netAssets: '/edgarSubmission/formData/fundInfo/netAssets',
} as const satisfies Readonly<Record<SecNportXmlPathName, string>>

type XmlNode = {
  qualifiedName: string
  localName: string
  namespaceUri: string
  text: string
  children: XmlNode[]
}

type NamespaceMap = Map<string, string>

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(#x[\da-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g,
    (_entity, name: string) => {
      if (name === 'amp') return '&'
      if (name === 'lt') return '<'
      if (name === 'gt') return '>'
      if (name === 'quot') return '"'
      if (name === 'apos') return "'"
      const codePoint = name.startsWith('#x')
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10)
      if (!Number.isSafeInteger(codePoint) || codePoint < 0) {
        throw new Error(`Invalid XML character entity: &${name};`)
      }
      return String.fromCodePoint(codePoint)
    }
  )
}

function splitQualifiedName(value: string): {
  prefix: string
  localName: string
} {
  const separator = value.indexOf(':')
  if (separator === -1) {
    return { prefix: '', localName: value }
  }
  if (value.indexOf(':', separator + 1) !== -1) {
    throw new Error(`Invalid XML qualified name: ${value}`)
  }
  return {
    prefix: value.slice(0, separator),
    localName: value.slice(separator + 1),
  }
}

function isNameCharacter(character: string): boolean {
  return /[A-Za-z0-9_.:-]/.test(character)
}

function parseXml(xml: string): XmlNode {
  let index = 0
  let root: XmlNode | null = null
  const nodeStack: XmlNode[] = []
  const namespaceStack: NamespaceMap[] = [new Map()]

  const fail = (message: string): never => {
    throw new Error(`Malformed SEC N-PORT XML at ${index}: ${message}`)
  }
  const skipWhitespace = () => {
    while (index < xml.length && /\s/.test(xml[index]!)) index += 1
  }
  const readName = (): string => {
    const start = index
    while (index < xml.length && isNameCharacter(xml[index]!)) index += 1
    if (start === index) fail('expected XML name')
    return xml.slice(start, index)
  }

  while (index < xml.length) {
    if (xml[index] !== '<') {
      const end = xml.indexOf('<', index)
      const textEnd = end === -1 ? xml.length : end
      const value = decodeXmlEntities(xml.slice(index, textEnd))
      if (nodeStack.length === 0) {
        if (value.trim()) fail('text outside root element')
      } else {
        nodeStack[nodeStack.length - 1]!.text += value
      }
      index = textEnd
      continue
    }

    if (xml.startsWith('<!--', index)) {
      const end = xml.indexOf('-->', index + 4)
      if (end === -1) fail('unterminated comment')
      index = end + 3
      continue
    }
    if (xml.startsWith('<?', index)) {
      const end = xml.indexOf('?>', index + 2)
      if (end === -1) fail('unterminated processing instruction')
      index = end + 2
      continue
    }
    if (xml.startsWith('<![CDATA[', index)) {
      const end = xml.indexOf(']]>', index + 9)
      if (end === -1) fail('unterminated CDATA section')
      if (nodeStack.length === 0) fail('CDATA outside root element')
      nodeStack[nodeStack.length - 1]!.text += xml.slice(index + 9, end)
      index = end + 3
      continue
    }
    if (xml.startsWith('<!', index)) {
      fail('unsupported declaration')
    }
    if (xml.startsWith('</', index)) {
      index += 2
      const closingName = readName()
      skipWhitespace()
      if (xml[index] !== '>') fail('expected closing bracket')
      index += 1
      const node = nodeStack.pop()
      namespaceStack.pop()
      if (!node || node.qualifiedName !== closingName) {
        fail(`unexpected closing element ${closingName}`)
      }
      continue
    }

    index += 1
    const qualifiedName = readName()
    const attributes = new Map<string, string>()
    let selfClosing = false

    while (index < xml.length) {
      skipWhitespace()
      if (xml.startsWith('/>', index)) {
        selfClosing = true
        index += 2
        break
      }
      if (xml[index] === '>') {
        index += 1
        break
      }

      const attributeName = readName()
      skipWhitespace()
      if (xml[index] !== '=') fail(`expected equals after ${attributeName}`)
      index += 1
      skipWhitespace()
      const quote = xml[index]
      if (quote !== '"' && quote !== "'") {
        fail(`expected quoted value for ${attributeName}`)
      }
      index += 1
      const valueStart = index
      const valueEnd = xml.indexOf(quote, valueStart)
      if (valueEnd === -1) fail(`unterminated value for ${attributeName}`)
      if (attributes.has(attributeName)) {
        fail(`duplicate attribute ${attributeName}`)
      }
      attributes.set(
        attributeName,
        decodeXmlEntities(xml.slice(valueStart, valueEnd))
      )
      index = valueEnd + 1
    }

    const namespaces = new Map(namespaceStack[namespaceStack.length - 1])
    for (const [name, value] of attributes) {
      if (name === 'xmlns') namespaces.set('', value)
      else if (name.startsWith('xmlns:')) namespaces.set(name.slice(6), value)
    }

    const { prefix, localName } = splitQualifiedName(qualifiedName)
    const namespaceUri =
      namespaces.get(prefix) ??
      fail(`unbound namespace prefix for ${qualifiedName}`)
    const node: XmlNode = {
      qualifiedName,
      localName,
      namespaceUri,
      text: '',
      children: [],
    }

    if (nodeStack.length === 0) {
      if (root) fail('multiple root elements')
      root = node
    } else {
      nodeStack[nodeStack.length - 1]!.children.push(node)
    }
    if (!selfClosing) {
      nodeStack.push(node)
      namespaceStack.push(namespaces)
    }
  }

  if (nodeStack.length > 0) {
    fail(`unclosed element ${nodeStack[nodeStack.length - 1]!.qualifiedName}`)
  }
  if (!root) {
    throw new Error('Malformed SEC N-PORT XML: missing root element')
  }
  return root
}

function pathParts(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function findNodes(root: XmlNode, path: string): XmlNode[] {
  const parts = pathParts(path)
  if (
    parts.length === 0 ||
    root.localName !== parts[0] ||
    root.namespaceUri !== SEC_NPORT_XML_NAMESPACE
  ) {
    return []
  }

  let nodes = [root]
  for (const part of parts.slice(1)) {
    nodes = nodes.flatMap((node) =>
      node.children.filter(
        (child) =>
          child.localName === part &&
          child.namespaceUri === SEC_NPORT_XML_NAMESPACE
      )
    )
  }
  return nodes
}

function readUniqueText(root: XmlNode, path: string): string {
  const nodes = findNodes(root, path)
  if (nodes.length !== 1) {
    throw new Error(
      `SEC N-PORT XML path must occur exactly once: ${path} (${nodes.length})`
    )
  }
  const value = nodes[0]!.text.trim()
  if (!value) {
    throw new Error(`SEC N-PORT XML path must not be empty: ${path}`)
  }
  return value
}

function readOptionalFact(root: XmlNode, path: string): SecNportRawFact {
  const nodes = findNodes(root, path)
  if (nodes.length > 1) {
    throw new Error(`Ambiguous SEC N-PORT XML fact path: ${path}`)
  }
  return { path, rawValue: nodes[0]?.text.trim() || null }
}

function readClassIds(root: XmlNode): string[] {
  const nodes = findNodes(root, SEC_NPORT_XML_PATHS.headerClassId)
  if (nodes.length === 0) {
    throw new Error('SEC N-PORT XML must include at least one class ID')
  }
  const ids = nodes.map((node) => node.text.trim())
  if (ids.some((value) => !/^C\d{9}$/.test(value))) {
    throw new Error('SEC N-PORT XML class ID must use the official format')
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error('SEC N-PORT XML contains duplicate class IDs')
  }
  return ids
}

function readConsistentText(root: XmlNode, path: string): string {
  const nodes = findNodes(root, path)
  if (nodes.length === 0) {
    throw new Error(`SEC N-PORT XML path must occur at least once: ${path}`)
  }
  const values = nodes.map((node) => node.text.trim())
  if (values.some((value) => !value)) {
    throw new Error(`SEC N-PORT XML path must not be empty: ${path}`)
  }
  if (new Set(values).size !== 1) {
    throw new Error(`SEC N-PORT XML path contains divergent values: ${path}`)
  }
  return values[0]!
}

function readForm(root: XmlNode): SecNportFormType {
  const form = readUniqueText(root, SEC_NPORT_XML_PATHS.form)
  if (form !== 'NPORT-P' && form !== 'NPORT-P/A') {
    throw new Error(`Unsupported SEC N-PORT form: ${form}`)
  }
  return form
}

export function parseSecNportXml(xml: string): SecNportParsedDocument {
  const root = parseXml(xml)
  if (
    root.localName !== 'edgarSubmission' ||
    root.namespaceUri !== SEC_NPORT_XML_NAMESPACE
  ) {
    throw new Error(
      `Unexpected SEC N-PORT XML namespace: ${root.namespaceUri || '(empty)'}`
    )
  }

  const registrantCik = readUniqueText(root, SEC_NPORT_XML_PATHS.registrantCik)
  const headerCik = readUniqueText(root, SEC_NPORT_XML_PATHS.headerCik)
  const seriesId = readUniqueText(root, SEC_NPORT_XML_PATHS.seriesId)
  const headerSeriesId = readConsistentText(
    root,
    SEC_NPORT_XML_PATHS.headerSeriesId
  )
  if (registrantCik !== headerCik || seriesId !== headerSeriesId) {
    throw new Error('SEC N-PORT XML header and form identities diverge')
  }

  return {
    namespace: root.namespaceUri,
    form: readForm(root),
    registrantCik,
    registrantName: readUniqueText(root, SEC_NPORT_XML_PATHS.registrantName),
    seriesId,
    seriesName: readUniqueText(root, SEC_NPORT_XML_PATHS.seriesName),
    classIds: readClassIds(root),
    reportDate: readUniqueText(root, SEC_NPORT_XML_PATHS.reportDate),
    totalAssets: readOptionalFact(root, SEC_NPORT_XML_PATHS.totalAssets),
    totalLiabilities: readOptionalFact(
      root,
      SEC_NPORT_XML_PATHS.totalLiabilities
    ),
    netAssets: readOptionalFact(root, SEC_NPORT_XML_PATHS.netAssets),
  }
}
