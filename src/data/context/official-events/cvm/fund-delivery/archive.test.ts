import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmFundDeliveryArchiveUrl,
  downloadOfficialCvmFundDeliveryArchive,
  readOfficialCvmFundDeliveryMonthlyCsvFromArchive,
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
    expect(buildOfficialCvmFundDeliveryArchiveUrl('202607')).toBe(
      'https://dados.cvm.gov.br/dados/FI/DOC/ENTREGA/DADOS/fi_entrega_documento_202607.zip'
    )
    for (const invalid of ['2026', '202600', '202613', '20260701', '2020AA']) {
      expect(() => buildOfficialCvmFundDeliveryArchiveUrl(invalid)).toThrow()
    }
  })

  it('downloads once through the injected fetcher and enforces response limits', async () => {
    const fetcher = vi.fn(async () => response(Uint8Array.of(1, 2, 3)))
    await expect(
      downloadOfficialCvmFundDeliveryArchive({ yearMonth: '202607', fetcher })
    ).resolves.toMatchObject({
      archiveFileName: 'fi_entrega_documento_202607.zip',
      archiveBytes: Uint8Array.of(1, 2, 3),
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        yearMonth: '202607',
        fetcher: async () => response(Uint8Array.of(1), 503),
      })
    ).rejects.toThrow(/HTTP 503/)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        yearMonth: '202607',
        fetcher: async () => response(new Uint8Array()),
      })
    ).rejects.toThrow(/empty/)
    await expect(
      downloadOfficialCvmFundDeliveryArchive({
        yearMonth: '202607',
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
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
        archiveBytes: archive,
      })
    ).toEqual({
      csvFileName: 'fi_entrega_documento_202607.csv',
      content: 'Apresentação',
    })
  })

  it('rejects missing, ambiguous, unsafe, excessive and corrupt archives', () => {
    expect(() =>
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
        archiveBytes: zipSync({ other: Uint8Array.of(1) }),
      })
    ).toThrow(/missing/)
    expect(() =>
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
        archiveBytes: zipSync({
          'FI_ENTREGA_DOCUMENTO_202607.CSV': Uint8Array.of(1),
        }),
      })
    ).toThrow(/Ambiguous/)
    expect(() =>
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
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
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
        archiveBytes: zipSync({
          ...entries,
          'fi_entrega_documento_202607.csv': Uint8Array.of(65),
        }),
      })
    ).toThrow(/entry count/)
    expect(() =>
      readOfficialCvmFundDeliveryMonthlyCsvFromArchive({
        yearMonth: '202607',
        archiveBytes: Uint8Array.of(1, 2, 3),
      })
    ).toThrow(/Invalid/)
  })
})
