import { describe, expect, it } from 'vitest'
import {
  createTesouroTransparenteProvider,
  parseNtnbLongaRate,
  parseTesouroTransparenteCsv,
  selectLatestNtnbLongaRow,
} from './tesouroTransparenteProvider.ts'

const HEADER =
  'Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha'

// Amostra real, baixada e conferida em 31/07/2026 (docs/reference/FII_SEGMENTOS_E_METRICAS.md, secao 7.2).
const REAL_SAMPLE = [
  HEADER,
  'Tesouro Selic;01/03/2027;30/07/2026;0,05;0,05;15000,00;15000,00;15000,00',
  'Tesouro IPCA+ com Juros Semestrais;15/08/2032;30/07/2026;8,28;8,40;4389,21;4363,87;4363,87',
  'Tesouro IPCA+ com Juros Semestrais;15/05/2035;30/07/2026;8,23;8,35;4180,59;4148,39;4148,39',
  'Tesouro IPCA+ com Juros Semestrais;15/08/2026;30/07/2026;14,63;14,75;4851,79;4848,84;4848,84',
  'Tesouro IPCA+ com Juros Semestrais;15/05/2045;30/07/2026;7,77;7,89;4016,12;3967,71;3967,71',
  'Tesouro IPCA+ com Juros Semestrais;15/08/2050;30/07/2026;7,74;7,86;4015,46;3963,14;3963,14',
  'Tesouro IPCA+ com Juros Semestrais;15/08/2030;30/07/2026;8,30;8,42;4523,93;4504,92;4504,92',
  'Tesouro IPCA+ com Juros Semestrais;15/05/2037;30/07/2026;8,06;8,18;4139,51;4102,88;4102,88',
  'Tesouro IPCA+ com Juros Semestrais;15/05/2055;30/07/2026;7,66;7,78;3930,55;3875,42;3875,42',
  'Tesouro IPCA+ com Juros Semestrais;15/08/2060;30/07/2026;7,65;7,77;3966,35;3909,70;3909,70',
  'Tesouro Prefixado;01/01/2029;30/07/2026;12,90;13,00;700,00;695,00;695,00',
].join('\n')

describe('parseTesouroTransparenteCsv', () => {
  it('keeps only rows for the NTN-B classic title', () => {
    const rows = parseTesouroTransparenteCsv(REAL_SAMPLE)

    expect(rows).toHaveLength(9)
    expect(
      rows.every(
        (row) => row.tipoTitulo === 'Tesouro IPCA+ com Juros Semestrais'
      )
    ).toBe(true)
  })

  it('throws on an unexpected header', () => {
    expect(() =>
      parseTesouroTransparenteCsv('Coluna Errada;Outra\nvalor;valor')
    ).toThrow(/cabeçalho inesperado/)
  })

  it('throws on an empty file', () => {
    expect(() => parseTesouroTransparenteCsv('')).toThrow(/vazio/)
  })
})

describe('selectLatestNtnbLongaRow', () => {
  it('picks the longest maturity at the most recent base date, real sample -> 2060', () => {
    const rows = parseTesouroTransparenteCsv(REAL_SAMPLE)
    const selected = selectLatestNtnbLongaRow(rows)

    expect(selected.dataVencimento).toBe('15/08/2060')
    expect(selected.taxaCompraManha).toBe('7,65')
  })

  it('ignores rows from an older base date even if their maturity is longer', () => {
    const rows = [
      {
        tipoTitulo: 'Tesouro IPCA+ com Juros Semestrais',
        dataVencimento: '15/08/2060',
        dataBase: '29/07/2026',
        taxaCompraManha: '7,70',
      },
      {
        tipoTitulo: 'Tesouro IPCA+ com Juros Semestrais',
        dataVencimento: '15/05/2055',
        dataBase: '30/07/2026',
        taxaCompraManha: '7,66',
      },
    ]

    expect(selectLatestNtnbLongaRow(rows).dataVencimento).toBe('15/05/2055')
  })

  it('throws when there are no rows', () => {
    expect(() => selectLatestNtnbLongaRow([])).toThrow(/Nenhuma linha/)
  })
})

describe('parseNtnbLongaRate', () => {
  it('extracts the real sample into the expected shape', () => {
    const rate = parseNtnbLongaRate(REAL_SAMPLE)

    expect(rate).toEqual({
      series: 'ntnb-longa',
      maturityDate: '2060-08-15',
      rateScaled: 7_650_000,
      rateScale: 1_000_000,
      pricedAt: '2026-07-30',
      source: 'tesouro-transparente',
    })
  })
})

describe('createTesouroTransparenteProvider', () => {
  it('decodes the response as Latin-1 and returns the parsed rate', async () => {
    const latin1Bytes = new TextEncoder().encode(REAL_SAMPLE)
    const fetchMock = async () => new Response(latin1Bytes, { status: 200 })

    const provider = createTesouroTransparenteProvider(fetchMock)
    const rate = await provider.getNtnbLongaRate()

    expect(rate.maturityDate).toBe('2060-08-15')
    expect(rate.rateScaled).toBe(7_650_000)
  })

  it('throws when the download fails', async () => {
    const fetchMock = async () => new Response('', { status: 503 })
    const provider = createTesouroTransparenteProvider(fetchMock)

    await expect(provider.getNtnbLongaRate()).rejects.toThrow(/503/)
  })
})
