import { Zip, ZipPassThrough, zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmIpeArchiveUrl,
  downloadOfficialCvmIpeArchive,
  readOfficialCvmIpeCsvFromArchive,
} from './archive'
import { MAX_CVM_IPE_ARCHIVE_BYTES } from './constants'
import { encodeWindows1252 } from './testFixtures'

function response(
  bytes: Uint8Array,
  status = 200,
  contentLength: string | null = null
) {
  const copy = bytes.slice()
  return {
    ok: status >= 200 && status <= 299,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-length' ? contentLength : null,
    },
    arrayBuffer: async () => copy.buffer,
  }
}

function archiveWithDuplicateName(name: string): Uint8Array {
  const chunks: Uint8Array[] = []
  let archiveError: Error | null = null
  const archive = new Zip((error, chunk) => {
    if (error) archiveError = error
    else chunks.push(chunk)
  })
  for (const value of [65, 66]) {
    const entry = new ZipPassThrough(name)
    archive.add(entry)
    entry.push(Uint8Array.of(value), true)
  }
  archive.end()
  if (archiveError) throw archiveError
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

describe('CVM IPE archive URL and download', () => {
  it('builds the exact official 2026 URL', () => {
    expect(buildOfficialCvmIpeArchiveUrl(2026)).toBe(
      'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2026.zip'
    )
  })

  it('accepts the minimum year', () => {
    expect(buildOfficialCvmIpeArchiveUrl(2003)).toContain('2003.zip')
  })

  it.each([2002, 10_000, 2026.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid year %s',
    (year) => expect(() => buildOfficialCvmIpeArchiveUrl(year)).toThrow()
  )

  it('calls the injected fetcher exactly once with the official URL', async () => {
    const fetcher = vi.fn(async () => response(Uint8Array.of(1, 2, 3)))
    const downloaded = await downloadOfficialCvmIpeArchive({
      year: 2026,
      fetcher,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith(buildOfficialCvmIpeArchiveUrl(2026))
    expect(downloaded.archiveBytes).toEqual(Uint8Array.of(1, 2, 3))
  })

  it('rejects an unsuccessful HTTP response', async () => {
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () => response(Uint8Array.of(1), 503),
      })
    ).rejects.toThrow(/HTTP 503/)
  })

  it('rejects an empty response', async () => {
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () => response(new Uint8Array()),
      })
    ).rejects.toThrow(/empty/)
  })

  it('rejects a compressed response over the limit', async () => {
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () =>
          response(new Uint8Array(MAX_CVM_IPE_ARCHIVE_BYTES + 1)),
      })
    ).rejects.toThrow(/compressed size/)
  })

  it('rejects an oversized declared Content-Length before reading the body', async () => {
    const body = vi.fn(async () => Uint8Array.of(1).buffer)
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () => ({
          ok: true,
          status: 200,
          headers: {
            get: () => String(MAX_CVM_IPE_ARCHIVE_BYTES + 1),
          },
          arrayBuffer: body,
        }),
      })
    ).rejects.toThrow(/declared compressed size/)
    expect(body).not.toHaveBeenCalled()
  })

  it.each(['-1', '1.5', 'unsafe', String(Number.MAX_SAFE_INTEGER + 1)])(
    'rejects invalid Content-Length %s',
    async (contentLength) => {
      await expect(
        downloadOfficialCvmIpeArchive({
          year: 2026,
          fetcher: async () => response(Uint8Array.of(1), 200, contentLength),
        })
      ).rejects.toThrow(/Content-Length/)
    }
  )

  it('does not require declared and actual sizes to match', async () => {
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () => response(Uint8Array.of(1, 2, 3), 200, '1'),
      })
    ).resolves.toMatchObject({ archiveBytes: Uint8Array.of(1, 2, 3) })
  })

  it('still rejects an actual body over the limit when the header is smaller', async () => {
    await expect(
      downloadOfficialCvmIpeArchive({
        year: 2026,
        fetcher: async () =>
          response(new Uint8Array(MAX_CVM_IPE_ARCHIVE_BYTES + 1), 200, '1'),
      })
    ).rejects.toThrow(/compressed size/)
  })
})

describe('readOfficialCvmIpeCsvFromArchive', () => {
  it('extracts the exact expected Windows-1252 CSV', () => {
    const archive = zipSync({
      'ipe_cia_aberta_2026.csv': encodeWindows1252('Categoria\r\nAssembleia'),
    })
    expect(
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toEqual({
      csvFileName: 'ipe_cia_aberta_2026.csv',
      content: 'Categoria\r\nAssembleia',
    })
  })

  it('decodes audited Windows-1252 accents', () => {
    const archive = zipSync({
      'ipe_cia_aberta_2026.csv': encodeWindows1252('ITAÚSA;Administração'),
    })
    expect(
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
        .content
    ).toBe('ITAÚSA;Administração')
  })

  it('ignores safe auxiliary entries', () => {
    const archive = zipSync({
      'README.txt': Uint8Array.of(1),
      'metadata/info.txt': Uint8Array.of(2),
      'ipe_cia_aberta_2026.csv': Uint8Array.of(65),
    })
    expect(
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
        .content
    ).toBe('A')
  })

  it('rejects a missing official CSV', () => {
    const archive = zipSync({ 'other.csv': Uint8Array.of(65) })
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/missing/)
  })

  it('rejects a case-ambiguous second CSV name', () => {
    const archive = zipSync({
      'ipe_cia_aberta_2026.csv': Uint8Array.of(65),
      'IPE_CIA_ABERTA_2026.CSV': Uint8Array.of(66),
    })
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/Ambiguous/)
  })

  it.each([
    '../escape.txt',
    '/absolute.txt',
    'C:/absolute.txt',
    '\\\\server\\file.txt',
    'folder\\file.txt',
    'folder//file.txt',
    './file.txt',
    'nul\0name.txt',
    'ｉｐｅ.txt',
    'ipe_cia_aberta_2026.csv/',
  ])('rejects unsafe entry %s', (name) => {
    const archive = zipSync({
      [name]: Uint8Array.of(1),
      'ipe_cia_aberta_2026.csv': Uint8Array.of(65),
    })
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/Unsafe/)
  })

  it('rejects duplicate entry names', () => {
    const archive = archiveWithDuplicateName('ipe_cia_aberta_2026.csv')
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/Duplicate/)
  })

  it('rejects more than one hundred entries before extraction', () => {
    const entries = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [
        `metadata-${index}.txt`,
        Uint8Array.of(1),
      ])
    )
    const archive = zipSync({
      ...entries,
      'ipe_cia_aberta_2026.csv': Uint8Array.of(65),
    })
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/entry count/)
  })

  it('rejects a corrupt ZIP', () => {
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({
        year: 2026,
        archiveBytes: Uint8Array.of(1, 2, 3),
      })
    ).toThrow(/Invalid/)
  })

  it('rejects an oversized uncompressed entry before extraction', () => {
    const archive = zipSync({
      'ipe_cia_aberta_2026.csv': new Uint8Array(50 * 1024 * 1024 + 1),
    })
    expect(() =>
      readOfficialCvmIpeCsvFromArchive({ year: 2026, archiveBytes: archive })
    ).toThrow(/uncompressed size/)
  })
})
