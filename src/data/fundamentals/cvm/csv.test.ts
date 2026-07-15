import { describe, expect, it } from 'vitest'
import { parseCvmStatementCsv } from './csv'

describe('parseCvmStatementCsv', () => {
  it('parses the official semicolon layout and quoted fields', () => {
    const rows = parseCvmStatementCsv({
      fileName: 'itr_cia_aberta_DRE_con_2026.csv',
      statement: 'DRE',
      content: [
        'CNPJ_CIA;DT_REFER;VERSAO;DENOM_CIA;CD_CVM;GRUPO_DFP;MOEDA;ESCALA_MOEDA;ORDEM_EXERC;DT_INI_EXERC;DT_FIM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA;ST_CONTA_FIXA',
        '00.000.000/0001-91;2026-03-31;1;BCO BRASIL S.A.;001023;DF Consolidado;REAL;MIL;ÚLTIMO;2026-01-01;2026-03-31;3.11;"Lucro; Consolidado";-10,5;S',
      ].join('\n'),
    })

    expect(rows).toEqual([
      {
        companyName: 'BCO BRASIL S.A.',
        cvmCode: '001023',
        referenceDate: '2026-03-31',
        version: '1',
        currency: 'REAL',
        currencyScale: 'MIL',
        exerciseOrder: 'ÚLTIMO',
        exerciseStartDate: '2026-01-01',
        exerciseEndDate: '2026-03-31',
        accountCode: '3.11',
        accountDescription: 'Lucro; Consolidado',
        accountValue: '-10,5',
        statement: 'DRE',
      },
    ])
  })

  it('supports balance-sheet documents without DT_INI_EXERC', () => {
    const rows = parseCvmStatementCsv({
      fileName: 'dfp_cia_aberta_BPA_con_2025.csv',
      statement: 'BPA',
      content: [
        'CNPJ_CIA;DT_REFER;VERSAO;DENOM_CIA;CD_CVM;GRUPO_DFP;MOEDA;ESCALA_MOEDA;ORDEM_EXERC;DT_FIM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA;ST_CONTA_FIXA',
        '00;2025-12-31;1;BCO BRASIL S.A.;001023;DF Consolidado;REAL;MIL;ÚLTIMO;2025-12-31;1;Ativo Total;100;S',
      ].join('\n'),
    })

    expect(rows[0]?.exerciseStartDate).toBeNull()
  })

  it('rejects missing official headers', () => {
    expect(() =>
      parseCvmStatementCsv({
        fileName: 'itr_cia_aberta_DRE_con_2026.csv',
        statement: 'DRE',
        content: 'CD_CVM;VL_CONTA\n001023;10',
      })
    ).toThrow('Missing CVM CSV header')
  })

  it('rejects an individual statement document', () => {
    expect(() =>
      parseCvmStatementCsv({
        fileName: 'itr_cia_aberta_DRE_ind_2026.csv',
        statement: 'DRE',
        content: '',
      })
    ).toThrow('Only consolidated CVM statements are supported')
  })
})
