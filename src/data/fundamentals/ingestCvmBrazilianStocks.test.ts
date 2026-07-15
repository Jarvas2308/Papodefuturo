import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import { CVM_BRAZILIAN_STOCK_COMPANIES } from './cvm/companies'
import type { CvmStatement } from './cvm/types'
import { ingestCvmBrazilianStockFundamentals } from './ingestCvmBrazilianStocks'

const HEADERS =
  'CNPJ_CIA;DT_REFER;VERSAO;DENOM_CIA;CD_CVM;GRUPO_DFP;MOEDA;ESCALA_MOEDA;ORDEM_EXERC;DT_INI_EXERC;DT_FIM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA;ST_CONTA_FIXA'

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

function createStatementCsv(statement: CvmStatement): string {
  const rows = CVM_BRAZILIAN_STOCK_COMPANIES.map((company, index) => {
    const isBank = company.ticker === 'BBAS3'
    const account = {
      DRE: [
        '3.11',
        isBank
          ? 'Lucro ou Prejuízo Líquido Consolidado do Período'
          : 'Lucro/Prejuízo Consolidado do Período',
      ],
      BPA: ['1', 'Ativo Total'],
      BPP: [isBank ? '2.07' : '2.03', 'Patrimônio Líquido Consolidado'],
      DFC_MI: [
        '6.01',
        isBank
          ? 'Caixa Líquido das Atividades Operacionais'
          : 'Caixa Líquido Atividades Operacionais',
      ],
      DFC_MD: ['6.01', 'unsupported fixture'],
    }[statement]

    return [
      company.cnpj,
      '2026-03-31',
      company.ticker === 'PSSA3' ? '2' : '1',
      company.officialName,
      company.cvmCode,
      `DF Consolidado - ${statement}`,
      'REAL',
      'MIL',
      'ÚLTIMO',
      '2026-01-01',
      '2026-03-31',
      account[0],
      account[1],
      String(10 + index),
      'S',
    ].join(';')
  })

  return [HEADERS, ...rows].join('\n')
}

function createOfficialFixtureArchive(): Uint8Array {
  return zipSync(
    Object.fromEntries(
      (['DRE', 'BPA', 'BPP', 'DFC_MI'] as const).map((statement) => [
        `itr_cia_aberta_${statement}_con_2026.csv`,
        encodeWindows1252(createStatementCsv(statement)),
      ])
    )
  )
}

describe('ingestCvmBrazilianStockFundamentals', () => {
  it('downloads, parses and persists through injected storage', async () => {
    const archive = createOfficialFixtureArchive()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => archive.buffer as ArrayBuffer,
    }))
    const storage = { upsertMany: vi.fn(async () => undefined) }

    const records = await ingestCvmBrazilianStockFundamentals({
      source: 'ITR',
      year: 2026,
      fetcher,
      storage,
    })

    expect(records).toHaveLength(5)
    expect(storage.upsertMany).toHaveBeenCalledWith(records)
    expect(records.every((record) => record.facts.totalRevenue === null)).toBe(
      true
    )
  })
})
