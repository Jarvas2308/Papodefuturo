import { describe, expect, it, vi } from 'vitest'
import { fetchProventoDeclarationValueRowsV1 } from './fetchProventoDeclarationValueRowsV1'

describe('fetchProventoDeclarationValueRowsV1', () => {
  it('propagates host allowlist rejection from fetchProventoDocumentText', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      fetchProventoDeclarationValueRowsV1(
        { eventId: 'event-1', documentUrl: 'https://evil.example.com/doc.pdf' },
        fetchImplementation
      )
    ).rejects.toThrow('Provento document host not allowed')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })
})
