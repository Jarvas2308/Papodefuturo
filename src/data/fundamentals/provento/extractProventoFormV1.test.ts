import { describe, expect, it } from 'vitest'
import { extractProventoFormV1 } from './extractProventoFormV1'

// Extração real (pdf-parse) de 2 documentos "Provento" da CVM baixados
// nesta sessão - não fixture inventada. r2 é a mesma declaração do
// protocolo cross-validado contra a prosa do Aviso aos Acionistas
// (ver extractProventoValuePerShareV1.test.ts, caso PSSA3).

// ITSA4, numProtocolo=1475857, declaração única (4º trimestre 2026,
// ON e PN).
const ITSA4_SINGLE_QUARTER = `Provento
Denominação Social Protocolo IPE
ITAÚSA S.A. 09/02/2026 007617IPE090220260232536990-42 Aviso aos
Acionistas Outros avisos
Ato Societário Outros
Outros Aviso aos Acionistas
Data Aprovação Ultimo dia de negociação com Direitos
09/02/2026 30/11/2026
Protocolo Provento Versão Data Envio
1475856 1 09/02/2026
Código ISIN Valor Bruto
(R$/Unidade)
Período
Base
Execício
Social
Haverá
Atualização
Forma de
Pagamento
Data
Pagamento
BRITSAACN
OR0
0,0242425000
0
4º Trimestre 2026 Não A Vista 04/01/2027
BRITSAACN
PR7
0,0242425000
0
4º Trimestre 2026 Não A Vista 04/01/2027
Parcelamento
Dia de Pagamento das Parcelas Valor Bruto (R$/Unidade)

-- 1 of 1 --
`

// ITSA4, numProtocolo=1475753, 2 declarações anuais distintas no mesmo
// documento (ON e PN cada) - 4 linhas de tabela.
const ITSA4_TWO_ANNUAL_DECLARATIONS = `Provento
Denominação Social Protocolo IPE
ITAÚSA S.A. 09/02/2026 007617IPE090220260120656270-89 Reunião da
Administração Conselho de Administração Ata
Ato Societário Outros
RCA
Data Aprovação Ultimo dia de negociação com Direitos
01/12/2025 09/12/2025
Protocolo Provento Versão Data Envio
1475045 2 09/02/2026
Código ISIN Valor Bruto
(R$/Unidade)
Período
Base
Execício
Social
Haverá
Atualização
Forma de
Pagamento
Data
Pagamento
BRITSAACN
OR0
0,7753640000
0
Anual 2025 Não A Vista 19/12/2025
BRITSAACN
PR7
0,7753640000
0
Anual 2025 Não A Vista 19/12/2025
BRITSAACN
OR0
0,0182000000
0
Anual 2025 Não A Vista 06/03/2026
BRITSAACN
PR7
0,0182000000
0
Anual 2025 Não A Vista 06/03/2026
Parcelamento
Dia de Pagamento das Parcelas Valor Bruto (R$/Unidade)

-- 1 of 1 --
`

// PSSA3, numProtocolo=1500046, declaração de um único ISIN (2º
// trimestre 2025). Valor bruto (0,48320810620) cross-validado nesta
// sessão contra a prosa do Aviso aos Acionistas do mesmo trimestre
// (extractProventoValuePerShareV1.test.ts) - duas fontes independentes,
// mesmo número.
const PSSA3_SINGLE_QUARTER = `Provento
Denominação Social Protocolo IPE
PORTO SEGURO S.A. 23/06/2025 016659IPE230620250193164610-38 Reunião da
Administração Conselho de Administração Ata
Ato Societário Outros
RCA
Data Aprovação Ultimo dia de negociação com Direitos
23/06/2025 26/06/2025
Protocolo Provento Versão Data Envio
1392979 2 01/04/2026
Código ISIN Valor Bruto
(R$/Unidade)
Período
Base
Execício
Social
Haverá
Atualização
Forma de
Pagamento
Data
Pagamento
BRPSSAACN
OR7
0,4832081062
0
2º Trimestre 2025 Não A Vista 30/04/2026
Parcelamento
Dia de Pagamento das Parcelas Valor Bruto (R$/Unidade)

-- 1 of 1 --
`

describe('extractProventoFormV1', () => {
  it('extracts a single quarterly declaration for both share classes (ITSA4, real document)', () => {
    expect(extractProventoFormV1(ITSA4_SINGLE_QUARTER)).toEqual([
      {
        isin: 'BRITSAACNOR0',
        grossValuePerShareDecimal: '0.02424250000',
        periodBase: '4º Trimestre',
        fiscalYear: 2026,
        paymentDate: '04/01/2027',
      },
      {
        isin: 'BRITSAACNPR7',
        grossValuePerShareDecimal: '0.02424250000',
        periodBase: '4º Trimestre',
        fiscalYear: 2026,
        paymentDate: '04/01/2027',
      },
    ])
  })

  it('extracts two distinct annual declarations from one document, both share classes each (ITSA4, real document)', () => {
    const rows = extractProventoFormV1(ITSA4_TWO_ANNUAL_DECLARATIONS)
    expect(rows).toHaveLength(4)
    expect(rows).toEqual([
      expect.objectContaining({
        isin: 'BRITSAACNOR0',
        grossValuePerShareDecimal: '0.77536400000',
        paymentDate: '19/12/2025',
      }),
      expect.objectContaining({
        isin: 'BRITSAACNPR7',
        grossValuePerShareDecimal: '0.77536400000',
        paymentDate: '19/12/2025',
      }),
      expect.objectContaining({
        isin: 'BRITSAACNOR0',
        grossValuePerShareDecimal: '0.01820000000',
        paymentDate: '06/03/2026',
      }),
      expect.objectContaining({
        isin: 'BRITSAACNPR7',
        grossValuePerShareDecimal: '0.01820000000',
        paymentDate: '06/03/2026',
      }),
    ])
  })

  it('extracts a single-ISIN quarterly declaration, cross-validated against independent prose extraction (PSSA3, real document)', () => {
    expect(extractProventoFormV1(PSSA3_SINGLE_QUARTER)).toEqual([
      {
        isin: 'BRPSSAACNOR7',
        grossValuePerShareDecimal: '0.48320810620',
        periodBase: '2º Trimestre',
        fiscalYear: 2025,
        paymentDate: '30/04/2026',
      },
    ])
  })

  it('returns null when the document is not a Provento form at all', () => {
    expect(
      extractProventoFormV1('FATO RELEVANTE\nAlgum outro documento qualquer.')
    ).toBeNull()
  })

  it('returns an empty array (not null) when the header is found but no row matches the expected shape', () => {
    const malformed = `Código ISIN Valor Bruto
(R$/Unidade)
Período
Base
Execício
Social
Haverá
Atualização
Forma de
Pagamento
Data
Pagamento
alguma coisa inesperada aqui
Parcelamento
`
    expect(extractProventoFormV1(malformed)).toEqual([])
  })

  it('skips a malformed row instead of guessing when the ISIN pattern is broken', () => {
    const malformed = `Código ISIN Valor Bruto
(R$/Unidade)
Período
Base
Execício
Social
Haverá
Atualização
Forma de
Pagamento
Data
Pagamento
não-é-isin
válido
0,50
0
Anual 2025 Não A Vista 01/01/2026
Parcelamento
`
    expect(extractProventoFormV1(malformed)).toEqual([])
  })
})
