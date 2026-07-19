const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ACCEPTANCE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function isValidCivilDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  return day <= daysInMonth[month - 1]
}

export function assertRequestedDateRange(
  fromDate: string,
  toDate: string
): void {
  if (!isValidCivilDate(fromDate) || Number(fromDate.slice(0, 4)) < 1994) {
    throw new Error('SEC EDGAR fromDate must be a valid date from 1994 onward')
  }
  if (!isValidCivilDate(toDate) || Number(toDate.slice(0, 4)) < 1994) {
    throw new Error('SEC EDGAR toDate must be a valid date from 1994 onward')
  }
  if (fromDate > toDate) {
    throw new Error('SEC EDGAR fromDate must not be later than toDate')
  }
}

export function isValidAcceptanceDateTime(value: string): boolean {
  const match = ACCEPTANCE_PATTERN.exec(value)
  if (!match || !isValidCivilDate(`${match[1]}-${match[2]}-${match[3]}`)) {
    return false
  }
  return (
    Number(match[4]) <= 23 && Number(match[5]) <= 59 && Number(match[6]) <= 59
  )
}

export function canonicalizeCik(value: string, field: string): string {
  if (!/^\d{1,10}$/.test(value) || /^0+$/.test(value)) {
    throw new Error(`${field} must contain between 1 and 10 digits`)
  }
  return value.padStart(10, '0')
}

export function assertCanonicalCik(value: string, field: string): void {
  if (!/^\d{10}$/.test(value) || /^0{10}$/.test(value)) {
    throw new Error(`${field} must contain exactly 10 digits`)
  }
}

export function assertAccessionNumber(value: string): void {
  if (!/^\d{10}-\d{2}-\d{6}$/.test(value)) {
    throw new Error('SEC EDGAR accession number has an invalid format')
  }
}

export function compareCodeUnits(left: string, right: string): number {
  if (left === right) return 0
  return left < right ? -1 : 1
}

export function hasC0OrC1ControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)
  })
}

export function assertStrictText(
  value: unknown,
  field: string,
  allowEmpty = true
): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  if (value.trim() !== value || hasC0OrC1ControlCharacter(value)) {
    throw new Error(`${field} must be unpadded and free of control characters`)
  }
  if (!allowEmpty && value.length === 0) {
    throw new Error(`${field} must not be empty`)
  }
  return value
}

export function assertSafeInteger(
  value: unknown,
  field: string,
  minimum = 0
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    Object.is(value, -0) ||
    value < minimum
  ) {
    throw new Error(
      `${field} must be a safe integer greater than or equal to ${minimum}`
    )
  }
  return value
}

function isAsciiLetterOrDigit(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? -1
  return (
    (codePoint >= 0x30 && codePoint <= 0x39) ||
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a)
  )
}

function isValidEmailContactToken(token: string): boolean {
  if (
    token.length === 0 ||
    token.includes('<') ||
    token.includes('>') ||
    token.includes('"') ||
    hasC0OrC1ControlCharacter(token)
  ) {
    return false
  }

  const atIndex = token.indexOf('@')
  if (atIndex <= 0 || atIndex !== token.lastIndexOf('@')) return false

  const localPart = token.slice(0, atIndex)
  const domain = token.slice(atIndex + 1)
  if (
    domain.length === 0 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    !domain.includes('.')
  ) {
    return false
  }

  const localSpecialCharacters = "!#$%&'*+-/=?^_`{|}~."
  if (
    [...localPart].some(
      (character) =>
        !isAsciiLetterOrDigit(character) &&
        !localSpecialCharacters.includes(character)
    )
  ) {
    return false
  }

  const domainParts = domain.split('.')
  return domainParts.every(
    (part) =>
      part.length > 0 &&
      !part.startsWith('-') &&
      !part.endsWith('-') &&
      [...part].every(
        (character) => isAsciiLetterOrDigit(character) || character === '-'
      )
  )
}

export function assertSecUserAgent(userAgent: string): void {
  const hasProjectIdentity =
    /(?:^|[ (])(?:PapoDeFuturo|Papo de Futuro)(?:$|[ /)])/.test(userAgent)
  const hasContactEmail = userAgent.split(/\s+/u).some(isValidEmailContactToken)
  if (
    typeof userAgent !== 'string' ||
    userAgent.length === 0 ||
    userAgent.trim() !== userAgent ||
    [...userAgent].length > 300 ||
    hasC0OrC1ControlCharacter(userAgent) ||
    !hasContactEmail ||
    !hasProjectIdentity
  ) {
    throw new Error(
      'SEC EDGAR User-Agent must identify Papo de Futuro and contain a contact email'
    )
  }
}
