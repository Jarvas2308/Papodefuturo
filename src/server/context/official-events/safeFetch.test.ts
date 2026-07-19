import { describe, expect, it, vi } from 'vitest'

import {
  OfficialEventsSafeFetchErrorV1,
  createOfficialEventsSafeFetchV1,
  type OfficialEventsFetchImplV1,
  type OfficialEventsFetchResponseV1,
} from './safeFetch'

function response(status = 200): OfficialEventsFetchResponseV1 {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    arrayBuffer: async () => new ArrayBuffer(0),
  }
}

describe('official events secure server fetch', () => {
  it.each([
    'https://dados.cvm.gov.br/archive.zip',
    'https://data.sec.gov/submissions/CIK0000036405.json',
    'https://www.sec.gov/Archives/filing-index.html',
  ])('allows exact audited HTTPS host %s', async (url) => {
    const fetchImpl = vi.fn<OfficialEventsFetchImplV1>(async () => response())
    const fetchers = createOfficialEventsSafeFetchV1({ fetchImpl })
    if (url.includes('cvm')) await fetchers.cvm(url)
    else
      await fetchers.sec({
        url,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'App test@example.com',
        },
      })
    expect(fetchImpl).toHaveBeenCalledOnce()
    const init = fetchImpl.mock.calls[0][1]
    expect(init).toMatchObject({
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
  })

  it.each([
    'http://dados.cvm.gov.br/archive.zip',
    'https://evil.example/archive.zip',
    'https://dados.cvm.gov.br.evil.example/archive.zip',
    'https://evil-dados.cvm.gov.br/archive.zip',
    'https://user:password@dados.cvm.gov.br/archive.zip',
    'https://localhost/archive.zip',
    'https://127.0.0.1/archive.zip',
    'https://[::1]/archive.zip',
  ])('rejects unsafe URL %s before fetch', async (url) => {
    const fetchImpl = vi.fn(async () => response())
    const fetchers = createOfficialEventsSafeFetchV1({ fetchImpl })
    await expect(fetchers.cvm(url)).rejects.toMatchObject({
      code: 'invalid-url',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects redirects instead of following them', async () => {
    const fetchers = createOfficialEventsSafeFetchV1({
      fetchImpl: async () => response(302),
    })
    await expect(
      fetchers.cvm('https://dados.cvm.gov.br/archive.zip')
    ).rejects.toMatchObject({ code: 'redirect' })
  })

  it('aborts and sanitizes timed out requests', async () => {
    const captured: { signal: AbortSignal | null } = { signal: null }
    const fetchImpl: OfficialEventsFetchImplV1 = async (_, init) => {
      captured.signal = init.signal as AbortSignal
      return new Promise(() => undefined)
    }
    const fetchers = createOfficialEventsSafeFetchV1({
      fetchImpl,
      timeoutMs: 5,
    })
    await expect(
      fetchers.cvm('https://dados.cvm.gov.br/archive.zip')
    ).rejects.toEqual(
      new OfficialEventsSafeFetchErrorV1(
        'timeout',
        'Official source request timed out'
      )
    )
    expect(captured.signal?.aborted).toBe(true)
  })

  it('sanitizes native and injected network errors', async () => {
    const fetchers = createOfficialEventsSafeFetchV1({
      fetchImpl: async () => {
        throw new Error('response body with secret')
      },
    })
    await expect(
      fetchers.cvm('https://dados.cvm.gov.br/archive.zip')
    ).rejects.toEqual(
      new OfficialEventsSafeFetchErrorV1(
        'network',
        'Official source request failed'
      )
    )
  })

  it('does not propagate authorization or cookies', async () => {
    const fetchImpl = vi.fn<OfficialEventsFetchImplV1>(async () => response())
    const fetchers = createOfficialEventsSafeFetchV1({ fetchImpl })
    await expect(
      fetchers.sec({
        url: 'https://data.sec.gov/submissions/test.json',
        headers: { Authorization: 'secret' },
      })
    ).rejects.toThrow(/header is not allowed/)
    await expect(
      fetchers.sec({
        url: 'https://data.sec.gov/submissions/test.json',
        headers: { Cookie: 'secret' },
      })
    ).rejects.toThrow(/header is not allowed/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('preserves only the SEC Accept and User-Agent headers', async () => {
    const fetchImpl = vi.fn<OfficialEventsFetchImplV1>(async () => response())
    const fetchers = createOfficialEventsSafeFetchV1({ fetchImpl })
    await fetchers.sec({
      url: 'https://data.sec.gov/submissions/test.json',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Papo de Futuro test@example.com',
      },
    })
    const call = fetchImpl.mock.calls[0]
    expect(call).toBeDefined()
    const headers = call?.[1].headers as Headers
    expect([...headers.entries()]).toEqual([
      ['accept', 'application/json'],
      ['user-agent', 'Papo de Futuro test@example.com'],
    ])
  })
})
