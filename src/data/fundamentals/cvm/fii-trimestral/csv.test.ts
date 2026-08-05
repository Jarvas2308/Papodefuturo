import { describe, expect, it } from 'vitest'
import {
  MATURITY_FAIXA_COLUMNS,
  parseCvmFiiTrimestralComplementCsv,
  parseCvmFiiTrimestralGeneralCsv,
  parseCvmFiiTrimestralPropertyCsv,
  parseCvmFiiTrimestralResultCsv,
  parseCvmFiiTrimestralTenantCsv,
} from './csv'
import type { CvmFiiTrimestralDocument } from './types'

function document(
  type: CvmFiiTrimestralDocument['type'],
  content: string
): CvmFiiTrimestralDocument {
  return { fileName: `inf_trimestral_fii_${type}_2026.csv`, type, content }
}

const COMPLEMENT_HEADER = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Percentual_Indexador_Receita_FII_IPCA',
  'Percentual_Indexador_Receita_FII_IGPM',
  'Percentual_Indexador_Receita_FII_INPC',
  'Percentual_Indexador_Receita_FII_INCC',
  ...Object.values(MATURITY_FAIXA_COLUMNS),
].join(';')

describe('parseCvmFiiTrimestralGeneralCsv', () => {
  it('parses the real HGRU11 general row shape', () => {
    const content = [
      'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Fundo_Classe;Codigo_ISIN',
      '29.641.226/0001-53;2026-03-31;2;PÁTRIA RENDA URBANA - FII - RESPONSABILIDADE LIMITADA;BRHGRUCTF002',
    ].join('\n')

    expect(
      parseCvmFiiTrimestralGeneralCsv(document('general', content))
    ).toEqual([
      {
        fileName: 'inf_trimestral_fii_general_2026.csv',
        cnpj: '29.641.226/0001-53',
        referenceDate: '2026-03-31',
        version: '2',
        officialName: 'PÁTRIA RENDA URBANA - FII - RESPONSABILIDADE LIMITADA',
        isin: 'BRHGRUCTF002',
      },
    ])
  })

  it('rejects a document missing a required header', () => {
    const content =
      'CNPJ_Fundo_Classe;Data_Referencia\n29.641.226/0001-53;2026-03-31'
    expect(() =>
      parseCvmFiiTrimestralGeneralCsv(document('general', content))
    ).toThrow('Missing CVM FII trimestral CSV header')
  })

  it('rejects a property document passed as general', () => {
    expect(() =>
      parseCvmFiiTrimestralGeneralCsv(document('property', 'a;b'))
    ).toThrow('Expected CVM FII trimestral general document')
  })
})

describe('parseCvmFiiTrimestralPropertyCsv', () => {
  it('parses real HGRU11 property rows, including fraction-scale vacancy with a dot separator', () => {
    const content = [
      'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Percentual_Vacancia;Percentual_Receitas_FII',
      '29.641.226/0001-53;2026-03-31;2;Pernambucanas Barra Bonita;0.00183809242195829;0.014',
      '29.641.226/0001-53;2026-03-31;2;ITM;1;0.005',
    ].join('\n')

    const rows = parseCvmFiiTrimestralPropertyCsv(document('property', content))

    expect(rows).toEqual([
      {
        fileName: 'inf_trimestral_fii_property_2026.csv',
        cnpj: '29.641.226/0001-53',
        referenceDate: '2026-03-31',
        version: '2',
        propertyName: 'Pernambucanas Barra Bonita',
        vacancy: '0.00183809242195829',
        revenueShare: '0.014',
      },
      {
        fileName: 'inf_trimestral_fii_property_2026.csv',
        cnpj: '29.641.226/0001-53',
        referenceDate: '2026-03-31',
        version: '2',
        propertyName: 'ITM',
        vacancy: '1',
        revenueShare: '0.005',
      },
    ])
  })

  it('rejects a general document passed as property', () => {
    expect(() =>
      parseCvmFiiTrimestralPropertyCsv(document('general', 'a;b'))
    ).toThrow('Expected CVM FII trimestral property document')
  })
})

describe('parseCvmFiiTrimestralTenantCsv', () => {
  it('parses real Medcenter tenant sector rows', () => {
    const content = [
      'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Setor_Atuacao;Percentual_Receitas_FII',
      '00.868.235/0001-08;2026-03-31;1;Medcenter;Serviço;0.884577',
      '00.868.235/0001-08;2026-03-31;1;Medcenter;Comércio;0.100799',
    ].join('\n')

    const rows = parseCvmFiiTrimestralTenantCsv(document('tenant', content))

    expect(rows).toEqual([
      {
        fileName: 'inf_trimestral_fii_tenant_2026.csv',
        cnpj: '00.868.235/0001-08',
        referenceDate: '2026-03-31',
        version: '1',
        propertyName: 'Medcenter',
        sector: 'Serviço',
        revenueShare: '0.884577',
      },
      {
        fileName: 'inf_trimestral_fii_tenant_2026.csv',
        cnpj: '00.868.235/0001-08',
        referenceDate: '2026-03-31',
        version: '1',
        propertyName: 'Medcenter',
        sector: 'Comércio',
        revenueShare: '0.100799',
      },
    ])
  })

  it('rejects a property document passed as tenant', () => {
    expect(() =>
      parseCvmFiiTrimestralTenantCsv(document('property', 'a;b'))
    ).toThrow('Expected CVM FII trimestral tenant document')
  })
})

describe('parseCvmFiiTrimestralComplementCsv', () => {
  it('parses the real HGRU11 complement row, including scientific notation faixas', () => {
    const row = [
      '29.641.226/0001-53',
      '2026-03-31',
      '2',
      '0.867201',
      '0.002972',
      '0',
      '0',
      '0.0001466',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0.001068',
      '0',
      '0.001364',
      '6.8E-05',
      '7.5E-05',
      '0.047827',
      '0.8196',
      '0',
    ].join(';')
    const content = [COMPLEMENT_HEADER, row].join('\n')

    const rows = parseCvmFiiTrimestralComplementCsv(
      document('complement', content)
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]!.ipcaRevenueShare).toBe('0.867201')
    expect(rows[0]!.maturityRevenueShare.ate3Meses).toBe('0.0001466')
    expect(rows[0]!.maturityRevenueShare['27a30Meses']).toBe('6.8E-05')
    expect(rows[0]!.maturityRevenueShare.acima36Meses).toBe('0.8196')
    expect(rows[0]!.maturityRevenueShare.indeterminado).toBe('0')
  })

  it('rejects a document missing a required maturity header', () => {
    expect(() =>
      parseCvmFiiTrimestralComplementCsv(
        document(
          'complement',
          'CNPJ_Fundo_Classe;Data_Referencia;Versao;Percentual_Indexador_Receita_FII_IPCA'
        )
      )
    ).toThrow('Missing CVM FII trimestral CSV header')
  })

  it('rejects a general document passed as complement', () => {
    expect(() =>
      parseCvmFiiTrimestralComplementCsv(document('general', 'a;b'))
    ).toThrow('Expected CVM FII trimestral complement document')
  })
})

describe('parseCvmFiiTrimestralResultCsv', () => {
  it('parses the real HGRU11 quarterly net financial result', () => {
    const content = [
      'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro',
      '29.641.226/0001-53;2026-03-31;2;56879214.47',
    ].join('\n')

    const rows = parseCvmFiiTrimestralResultCsv(document('result', content))

    expect(rows).toEqual([
      {
        fileName: 'inf_trimestral_fii_result_2026.csv',
        cnpj: '29.641.226/0001-53',
        referenceDate: '2026-03-31',
        version: '2',
        quarterlyNetResult: '56879214.47',
      },
    ])
  })

  it('parses a negative quarterly result', () => {
    const content = [
      'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro',
      '29.641.226/0001-53;2026-03-31;2;-1234.56',
    ].join('\n')

    const rows = parseCvmFiiTrimestralResultCsv(document('result', content))

    expect(rows[0]!.quarterlyNetResult).toBe('-1234.56')
  })

  it('rejects a general document passed as result', () => {
    expect(() =>
      parseCvmFiiTrimestralResultCsv(document('general', 'a;b'))
    ).toThrow('Expected CVM FII trimestral result document')
  })
})
