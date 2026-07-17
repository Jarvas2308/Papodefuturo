import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmFundDeliveryArchiveUrl,
  downloadOfficialCvmFundDeliveryArchive,
  readOfficialCvmFundDeliveryCsvFromArchive,
} from './archive'
import {
  MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES,
  MAX_CVM_FUND_DELIVERY_ARCHIVE_ENTRIES,
} from './constants'
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

describe('CVM Fund Delivery archive', () => {
  it('builds only the audited monthly official URL', () => {
    expect(
      buildOfficialCvmFundDeliveryArchiveUrl({ year: 2026, month: 3 })
    ).toBe(
      'https://dados.cvm.gov.br/dados/FI/DOC/ENTREGA/DADOS/fi_entrega_documento_202603.zip'
    )
  })

  it.each([
    { year: 2020, month: 1 },
    { year: 10_000, month: 1 },
    { year: 2026.5, month: 1 },
    { year: Number.MAX_SAFE_INTEGER + 1, month: 1 },
    { year: 2026, month: 0 },
    { year: 2026, month: 13 },
    { year: 2026, month: 1.5 },
    { year: 2026, month: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects invalid numeric period %#', (period) => {
    expect(() => buildOfficialCvmFundDeliveryArchiveUrl(period)).toThrow()
  })

  it('rejects string year or month at the runtime boundary', () => {
    expect(() =>
      Reflect.apply(buildOfficialCvmFundDeliveryArchiveUrl, undefined, [
        { year: '2026', month: 3 },
      ])
    ).toThrow(/year/)
    expect(() =>
      Reflect.apply(buildOfficialCvmFundDeliveryArchiveUrl, undefined, [
        { year: 2026, month: '3' },
      ])
    ).toThrow(/month/)
  })

  it('downloads once through the injected fetcher and enforces response limits', async () => {
    const fetcher = vi.fn(async () => response(Uint8Array.of(1, 2, 3)))
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        year: 2026,
        month: 7,
        fetcher,
      })
    ).resolves.toMatchObject({
      archiveFileName: 'fi_entrega_documento_202607.zip',
      archiveBytes: Uint8Array.of(1, 2, 3),
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        year: 2026,
        month: 7,
        fetcher: async () => response(Uint8Array.of(1), 503),
      })
    ).rejects.toThrow(/HTTP 503/)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        year: 2026,
        month: 7,
        fetcher: async () => response(new Uint8Array()),
      })
    ).rejects.toThrow(/empty/)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        year: 2026,
        month: 7,
        fetcher: async () =>
          response(
            Uint8Array.of(1),
            200,
            String(MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES + 1)
          ),
      })
    ).rejects.toThrow(/declared compressed size/)
  })

  it('extracts only the monthly CSV and never inflates the daily entry', () => {
    const archive = zipSync({
      'fi_entrega_documento_202607.csv': encodeWindows1252('Apresentação'),
      'fi_entrega_documento_diario_202607.csv': Uint8Array.of(0xff, 0xff),
    })
    expect(
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: archive,
      })
    ).toEqual({
      csvFileName: 'fi_entrega_documento_202607.csv',
      content: 'Apresentação',
    })
  })

  it('rejects missing, ambiguous, unsafe, excessive and corrupt archives', () => {
    expect(() =>
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: zipSync({ other: Uint8Array.of(1) }),
      })
    ).toThrow(/missing/)
    expect(() =>
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: zipSync({
          'FI_ENTREGA_DOCUMENTO_202607.CSV': Uint8Array.of(1),
        }),
      })
    ).toThrow(/Ambiguous/)
    expect(() =>
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: zipSync({
          '../escape': Uint8Array.of(1),
          'fi_entrega_documento_202607.csv': Uint8Array.of(65),
        }),
      })
    ).toThrow(/Unsafe/)
    const entries = Object.fromEntries(
      Array.from(
        { length: MAX_CVM_FUND_DELIVERY_ARCHIVE_ENTRIES },
        (_, index) => [`metadata-${index}`, Uint8Array.of(1)]
      )
    )
    expect(() =>
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: zipSync({
          ...entries,
          'fi_entrega_documento_202607.csv': Uint8Array.of(65),
        }),
      })
    ).toThrow(/entry count/)
    expect(() =>
      readOfficialCvmFundDeliveryCsvFromArchive({
        year: 2026,
        month: 7,
        archiveBytes: Uint8Array.of(1, 2, 3),
      })
    ).toThrow(/Invalid/)
  })
})
