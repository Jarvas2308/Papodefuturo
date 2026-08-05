import { strToU8, zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import {
  buildOfficialCvmFiiTrimestralArchiveUrl,
  downloadOfficialCvmFiiTrimestralArchive,
  readCvmFiiTrimestralDocuments,
} from './archive'

const GENERAL_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Fundo_Classe;Codigo_ISIN'
const PROPERTY_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Percentual_Vacancia;Percentual_Receitas_FII'
const COMPLEMENT_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Percentual_Indexador_Receita_FII_IPCA;Percentual_Indexador_Receita_FII_IGPM;Percentual_Indexador_Receita_FII_INPC;Percentual_Indexador_Receita_FII_INCC'
const TENANT_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Setor_Atuacao;Percentual_Receitas_FII'
const RESULT_HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro'

function createArchive() {
  return zipSync({
    'inf_trimestral_fii_geral_2026.csv': strToU8(GENERAL_HEADER),
    'inf_trimestral_fii_imovel_2026.csv': strToU8(PROPERTY_HEADER),
    'inf_trimestral_fii_complemento_2026.csv': strToU8(COMPLEMENT_HEADER),
    'inf_trimestral_fii_imovel_renda_acabado_inquilino_2026.csv':
      strToU8(TENANT_HEADER),
    'inf_trimestral_fii_resultado_contabil_financeiro_2026.csv':
      strToU8(RESULT_HEADER),
    'inf_trimestral_fii_ativo_2026.csv': strToU8('ignored'),
  })
}

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(value.byteLength)
  new Uint8Array(buffer).set(value)
  return buffer
}

describe('official CVM FII trimestral archive', () => {
  it('builds the official annual archive URL', () => {
    expect(buildOfficialCvmFiiTrimestralArchiveUrl(2026)).toBe(
      'https://dados.cvm.gov.br/dados/FII/DOC/INF_TRIMESTRAL/DADOS/inf_trimestral_fii_2026.zip'
    )
  })

  it('downloads through an injected fetcher', async () => {
    const archive = createArchive()
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => copyToArrayBuffer(archive),
    }))

    const result = await downloadOfficialCvmFiiTrimestralArchive(2026, fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      'https://dados.cvm.gov.br/dados/FII/DOC/INF_TRIMESTRAL/DADOS/inf_trimestral_fii_2026.zip'
    )
    expect(result).toEqual(archive)
  })

  it('reports an explicit download failure', async () => {
    await expect(
      downloadOfficialCvmFiiTrimestralArchive(
        2026,
        vi.fn(async () => ({
          ok: false,
          status: 503,
          arrayBuffer: async () => new ArrayBuffer(0),
        }))
      )
    ).rejects.toThrow(
      'Failed to download official CVM FII trimestral archive: HTTP 503'
    )
  })

  it('reads only the required general, property, complement, tenant and result documents, ignoring the other 11 tables', () => {
    const documents = readCvmFiiTrimestralDocuments(createArchive())

    expect(documents.map((document) => document.type)).toEqual([
      'general',
      'property',
      'complement',
      'tenant',
      'result',
    ])
  })

  it('rejects an archive missing one required official document', () => {
    const archive = zipSync({
      'inf_trimestral_fii_geral_2026.csv': strToU8(GENERAL_HEADER),
    })

    expect(() => readCvmFiiTrimestralDocuments(archive)).toThrow(
      'exactly one property document'
    )
  })
})
