import { strToU8, zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmFiiArchiveUrl,
  downloadOfficialCvmFiiArchive,
  readCvmFiiMonthlyDocuments,
} from './archive'

const GENERAL_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Entrega;Nome_Fundo_Classe;Codigo_ISIN;Quantidade_Cotas_Emitidas'
const COMPLEMENT_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Informacao_Numero_Cotistas;Total_Numero_Cotistas;Patrimonio_Liquido;Cotas_Emitidas'

function createArchive() {
  return zipSync({
    'inf_mensal_fii_geral_2026.csv': strToU8(GENERAL_HEADER),
    'inf_mensal_fii_complemento_2026.csv': strToU8(COMPLEMENT_HEADER),
    'inf_mensal_fii_ativo_passivo_2026.csv': strToU8('ignored'),
  })
}

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength)
  new Uint8Array(buffer).set(value)
  return buffer
}

describe('official CVM FII archive', () => {
  it('builds the official annual archive URL', () => {
    expect(buildOfficialCvmFiiArchiveUrl(2026)).toBe(
      'https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_2026.zip'
    )
  })

  it('downloads through an injected fetcher', async () => {
    const archive = createArchive()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => copyToArrayBuffer(archive),
    }))

    const result = await downloadOfficialCvmFiiArchive(2026, fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      'https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_2026.zip'
    )
    expect(result).toEqual(archive)
  })

  it('reports an explicit download failure', async () => {
    await expect(
      downloadOfficialCvmFiiArchive(
        2026,
        vi.fn(async () => ({
          ok: false,
          status: 503,
          arrayBuffer: async () => new ArrayBuffer(0),
        }))
      )
    ).rejects.toThrow('Failed to download official CVM FII archive: HTTP 503')
  })

  it('reads only the required general and complement documents', () => {
    const documents = readCvmFiiMonthlyDocuments(createArchive())

    expect(documents.map((document) => document.type)).toEqual([
      'general',
      'complement',
    ])
  })

  it('rejects an archive missing one required official document', () => {
    const archive = zipSync({
      'inf_mensal_fii_geral_2026.csv': strToU8(GENERAL_HEADER),
    })

    expect(() => readCvmFiiMonthlyDocuments(archive)).toThrow(
      'exactly one complement document'
    )
  })
})
