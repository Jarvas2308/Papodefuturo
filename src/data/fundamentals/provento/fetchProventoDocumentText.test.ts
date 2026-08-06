import { describe, expect, it, vi } from 'vitest'
import { fetchProventoDocumentText } from './fetchProventoDocumentText'

function fakeResponse(overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => new ArrayBuffer(0),
    ...overrides,
  } as Response
}

describe('fetchProventoDocumentText', () => {
  it('rejeita host fora do allowlist sem chamar fetch', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      fetchProventoDocumentText(
        'https://evil.example.com/doc.pdf',
        fetchImplementation
      )
    ).rejects.toThrow('Provento document host not allowed')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('rejeita resposta HTTP não-ok com o status na mensagem', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(fakeResponse({ ok: false, status: 404 }))

    await expect(
      fetchProventoDocumentText(
        'https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?a=1',
        fetchImplementation
      )
    ).rejects.toThrow('CVM respondeu 404')
  })

  it('rejeita documento acima do limite defensivo de tamanho, sem tentar parsear', async () => {
    const oversized = new ArrayBuffer(10 * 1024 * 1024 + 1)
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(fakeResponse({ arrayBuffer: async () => oversized }))

    await expect(
      fetchProventoDocumentText(
        'https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?a=1',
        fetchImplementation
      )
    ).rejects.toThrow('excede o limite defensivo de tamanho')
  })
})
