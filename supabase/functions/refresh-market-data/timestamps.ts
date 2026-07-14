export function normalizeProviderTimestamp(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RangeError('Provider timestamp is required')
  }

  const candidate = value.trim().includes('T')
    ? value.trim()
    : `${value.trim().replace(' ', 'T')}Z`
  const timestamp = Date.parse(candidate)

  if (Number.isNaN(timestamp)) {
    throw new RangeError('Provider timestamp is invalid')
  }

  return new Date(timestamp).toISOString()
}
