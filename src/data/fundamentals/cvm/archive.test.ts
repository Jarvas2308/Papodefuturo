import { strToU8, zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmArchiveUrl,
  downloadOfficialCvmArchive,
  readCvmConsolidatedDocuments,
} from './archive'

const HEADER =
  'CNPJ_CIA;DT_REFER;VERSAO;DENOM_CIA;CD_CVM;GRUPO_DFP;MOEDA;ESCALA_MOEDA;ORDEM_EXERC;DT_FIM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA;ST_CONTA_FIXA'

function createArchive() {
  return zipSync({
    'dfp_cia_aberta_BPA_con_2025.csv': strToU8(HEADER),
    'dfp_cia_aberta_BPP_con_2025.csv': strToU8(HEADER),
    'dfp_cia_aberta_DRE_con_2025.csv': strToU8(HEADER),
    'dfp_cia_aberta_DFC_MI_con_2025.csv': strToU8(HEADER),
    'dfp_cia_aberta_DRE_ind_2025.csv': strToU8(HEADER),
    'README.txt': strToU8('ignored'),
  })
}

describe('official CVM archive', () => {
  it('builds the official DFP and ITR URLs', () => {
    expect(buildOfficialCvmArchiveUrl('DFP', 2025)).toBe(
      'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_2025.zip'
    )
    expect(buildOfficialCvmArchiveUrl('ITR', 2026)).toBe(
      'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/itr_cia_aberta_2026.zip'
    )
  })

  it('downloads through an injected fetcher', async () => {
    const archive = createArchive()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => archive.buffer as ArrayBuffer,
    }))

    const result = await downloadOfficialCvmArchive('DFP', 2025, fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_2025.zip'
    )
    expect(result).toEqual(archive)
  })

  it('reads only supported consolidated statements', () => {
    const documents = readCvmConsolidatedDocuments(createArchive())

    expect(documents.map((document) => document.statement)).toEqual([
      'BPA',
      'BPP',
      'DRE',
      'DFC_MI',
    ])
    expect(
      documents.every((document) => document.fileName.includes('_con_'))
    ).toBe(true)
  })

  it('rejects an archive without a consolidated cash-flow statement', () => {
    const archive = zipSync({
      'dfp_cia_aberta_BPA_con_2025.csv': strToU8(HEADER),
      'dfp_cia_aberta_BPP_con_2025.csv': strToU8(HEADER),
      'dfp_cia_aberta_DRE_con_2025.csv': strToU8(HEADER),
    })

    expect(() => readCvmConsolidatedDocuments(archive)).toThrow(
      'missing consolidated cash flow'
    )
  })
})
