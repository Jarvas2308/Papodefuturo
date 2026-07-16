import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import { CVM_REAL_ESTATE_FUNDS } from './cvm/fii/funds'
import { ingestCvmRealEstateFundFundamentals } from './ingestCvmRealEstateFunds'

const OFFICIAL_ISSUED_SHARES = {
  KNRI11: '28204047',
  VISC11: '28828640.0000073',
  XPLG11: '51390097.8938388',
  HGRU11: '23238024',
} as const

function encodeWindows1252(value: string): Uint8Array {
  return Uint8Array.from(
    [...value].map((character) => {
      const codePoint = character.codePointAt(0)!
      if (codePoint > 255) {
        throw new Error(`Unsupported fixture character: ${character}`)
      }
      return codePoint
    })
  )
}

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength)
  new Uint8Array(buffer).set(value)
  return buffer
}

function createArchive(): Uint8Array {
  const generalHeaders =
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Entrega;Nome_Fundo_Classe;Codigo_ISIN;Quantidade_Cotas_Emitidas'
  const complementHeaders =
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Informacao_Numero_Cotistas;Total_Numero_Cotistas;Patrimonio_Liquido;Cotas_Emitidas'
  const generalRows = CVM_REAL_ESTATE_FUNDS.map((fund) =>
    [
      fund.cnpj,
      '2026-05-01',
      '1',
      '2026-06-15',
      fund.officialName,
      fund.isin,
      OFFICIAL_ISSUED_SHARES[fund.ticker],
    ].join(';')
  )
  const complementRows = CVM_REAL_ESTATE_FUNDS.map((fund, index) =>
    [
      fund.cnpj,
      '2026-05-01',
      '1',
      '2026-05-31',
      String(100_000 + index),
      `${1_000_000_000 + index}.25`,
      OFFICIAL_ISSUED_SHARES[fund.ticker],
    ].join(';')
  )

  return zipSync({
    'inf_mensal_fii_geral_2026.csv': encodeWindows1252(
      [generalHeaders, ...generalRows].join('\n')
    ),
    'inf_mensal_fii_complemento_2026.csv': encodeWindows1252(
      [complementHeaders, ...complementRows].join('\n')
    ),
  })
}

describe('ingestCvmRealEstateFundFundamentals', () => {
  it('downloads, parses and persists through injected boundaries', async () => {
    const archive = createArchive()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => copyToArrayBuffer(archive),
    }))
    const storage = { upsertMany: vi.fn(async () => undefined) }

    const records = await ingestCvmRealEstateFundFundamentals({
      year: 2026,
      fetcher,
      storage,
    })

    expect(records.map((record) => record.ticker)).toEqual([
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
    ])
    expect(storage.upsertMany).toHaveBeenCalledOnce()
    expect(storage.upsertMany).toHaveBeenCalledWith(records)
    expect(records[1]?.facts.issuedShares).toEqual({
      unscaledValue: 288_286_400_000_073,
      scale: 7,
    })
    expect(records[2]?.facts.issuedShares).toEqual({
      unscaledValue: 513_900_978_938_388,
      scale: 7,
    })
  })
})
