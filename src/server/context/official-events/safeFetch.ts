export const OFFICIAL_EVENTS_FETCH_TIMEOUT_MS_V1 = 30_000
export const OFFICIAL_EVENTS_ALLOWED_HOSTS_V1 = [
  'dados.cvm.gov.br',
  'data.sec.gov',
  'www.sec.gov',
] as const
const ALLOWED_HOSTS = new Set<string>(OFFICIAL_EVENTS_ALLOWED_HOSTS_V1)

export type OfficialEventsFetchResponseV1 = {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  arrayBuffer(): Promise<ArrayBuffer>
}

export type OfficialEventsFetchImplV1 = (
  input: string,
  init: RequestInit
) => Promise<OfficialEventsFetchResponseV1>

export class OfficialEventsSafeFetchErrorV1 extends Error {
  readonly code: 'invalid-url' | 'redirect' | 'timeout' | 'network'

  constructor(code: OfficialEventsSafeFetchErrorV1['code'], message: string) {
    super(message)
    this.name = 'OfficialEventsSafeFetchErrorV1'
    this.code = code
  }
}

function assertAllowedUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new OfficialEventsSafeFetchErrorV1(
      'invalid-url',
      'Request URL is invalid'
    )
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !ALLOWED_HOSTS.has(url.hostname)
  )
    throw new OfficialEventsSafeFetchErrorV1(
      'invalid-url',
      'Request URL is not allowed'
    )
  return url
}

function sanitizeHeaders(headers: Readonly<Record<string, string>>): Headers {
  const output = new Headers()
  Object.entries(headers).forEach(([name, value]) => {
    const normalized = name.toLowerCase()
    if (normalized !== 'accept' && normalized !== 'user-agent')
      throw new OfficialEventsSafeFetchErrorV1(
        'invalid-url',
        'Request header is not allowed'
      )
    output.set(name, value)
  })
  return output
}

export function createOfficialEventsSafeFetchV1(input: {
  fetchImpl: OfficialEventsFetchImplV1
  timeoutMs?: number
}) {
  const timeoutMs = input.timeoutMs ?? OFFICIAL_EVENTS_FETCH_TIMEOUT_MS_V1
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
    throw new Error('Fetch timeout must be a positive safe integer')

  async function request(
    urlValue: string,
    headers: Readonly<Record<string, string>>
  ): Promise<OfficialEventsFetchResponseV1> {
    const url = assertAllowedUrl(urlValue)
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort()
          reject(
            new OfficialEventsSafeFetchErrorV1(
              'timeout',
              'Official source request timed out'
            )
          )
        }, timeoutMs)
      })
      const response = await Promise.race([
        input.fetchImpl(url.toString(), {
          method: 'GET',
          headers: sanitizeHeaders(headers),
          redirect: 'manual',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal: controller.signal,
        }),
        timeout,
      ])
      if (response.status >= 300 && response.status < 400)
        throw new OfficialEventsSafeFetchErrorV1(
          'redirect',
          'Official source redirect was rejected'
        )
      return response
    } catch (error) {
      if (error instanceof OfficialEventsSafeFetchErrorV1) throw error
      throw new OfficialEventsSafeFetchErrorV1(
        'network',
        'Official source request failed'
      )
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }

  return {
    cvm: (url: string) => request(url, { Accept: 'application/zip' }),
    sec: (requestInput: {
      url: string
      headers: Readonly<Record<string, string>>
    }) => request(requestInput.url, requestInput.headers),
  }
}
