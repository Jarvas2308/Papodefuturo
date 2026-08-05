import { describe, expect, it } from 'vitest'
import {
  parseCvmCapitalCompositionCsv,
  parseCvmShareQuantity,
  type CvmCapitalCompositionDocument,
} from './capitalComposition'

function document(content: string): CvmCapitalCompositionDocument {
  return { fileName: 'dfp_cia_aberta_composicao_capital_2025.csv', content }
}

const HEADER = [
  'CNPJ_CIA',
  'DT_REFER',
  'VERSAO',
  'DENOM_CIA',
  'QT_ACAO_ORDIN_CAP_INTEGR',
  'QT_ACAO_PREF_CAP_INTEGR',
  'QT_ACAO_TOTAL_CAP_INTEGR',
  'QT_ACAO_ORDIN_TESOURO',
  'QT_ACAO_PREF_TESOURO',
  'QT_ACAO_TOTAL_TESOURO',
].join(';')

describe('parseCvmCapitalCompositionCsv', () => {
  it('parses the real BBAS3 row shape', () => {
    const content = [
      HEADER,
      '00.000.000/0001-91;2025-12-31;1;BCO BRASIL S.A.;5730834040;0;5730834040;22370399;0;22370399',
    ].join('\n')

    expect(parseCvmCapitalCompositionCsv(document(content))).toEqual([
      {
        fileName: 'dfp_cia_aberta_composicao_capital_2025.csv',
        cnpj: '00.000.000/0001-91',
        referenceDate: '2025-12-31',
        version: '1',
        companyName: 'BCO BRASIL S.A.',
        ordinaryShares: '5730834040',
        preferredShares: '0',
        totalShares: '5730834040',
      },
    ])
  })

  it('parses the real ITSA4 row with both ON and PN classes', () => {
    const content = [
      HEADER,
      '61.532.644/0001-15;2025-12-31;1;ITAÚSA S.A.;3853634;7360053;11213687;0;2340;2340',
    ].join('\n')

    const rows = parseCvmCapitalCompositionCsv(document(content))

    expect(rows[0]!.ordinaryShares).toBe('3853634')
    expect(rows[0]!.preferredShares).toBe('7360053')
    expect(rows[0]!.totalShares).toBe('11213687')
  })

  it('rejects a document missing a required header (no CD_CVM column, unlike other DFP statements)', () => {
    const content = 'CNPJ_CIA;DT_REFER;VERSAO\n00.000.000/0001-91;2025-12-31;1'
    expect(() => parseCvmCapitalCompositionCsv(document(content))).toThrow(
      'Missing CVM capital composition CSV header'
    )
  })

  it('rejects an empty document', () => {
    expect(() => parseCvmCapitalCompositionCsv(document(''))).toThrow(
      'Empty CVM capital composition CSV document'
    )
  })
})

describe('parseCvmShareQuantity', () => {
  it('returns null for an empty string', () => {
    expect(parseCvmShareQuantity('', 'test')).toBeNull()
  })

  it('parses a large real share count exactly', () => {
    expect(parseCvmShareQuantity('5730834040', 'test')).toEqual({
      unscaledValue: 5_730_834_040,
      scale: 0,
    })
  })

  it('parses zero', () => {
    expect(parseCvmShareQuantity('0', 'test')).toEqual({
      unscaledValue: 0,
      scale: 0,
    })
  })

  it('rejects a fractional value', () => {
    expect(() => parseCvmShareQuantity('1.5', 'test field')).toThrow(
      'Invalid CVM test field: 1.5'
    )
  })

  it('rejects a negative value', () => {
    expect(() => parseCvmShareQuantity('-1', 'test field')).toThrow(
      'Invalid CVM test field: -1'
    )
  })

  it('rejects a non-numeric value', () => {
    expect(() => parseCvmShareQuantity('abc', 'test field')).toThrow(
      'Invalid CVM test field: abc'
    )
  })
})
