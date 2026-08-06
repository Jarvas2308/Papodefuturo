import { describe, expect, it } from 'vitest'
import { buildProventoDeclarationValueRowsV1 } from './buildProventoDeclarationValueRowsV1'
import { PROVENTO_DECLARATION_VALUE_PARSER_VERSION } from './toProventoDeclarationValueRowV1'

// Same real "Provento" document text as extractProventoFormV1.test.ts
// (ITSA4, numProtocolo=1475857, single quarter, both share classes).
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

describe('buildProventoDeclarationValueRowsV1', () => {
  it('builds one row per ISIN, sharing the same protocol identity (real document)', () => {
    const rows = buildProventoDeclarationValueRowsV1({
      eventId: 'event-itsa4-1',
      documentText: ITSA4_SINGLE_QUARTER,
    })

    expect(rows).toEqual([
      {
        event_id: 'event-itsa4-1',
        isin: 'BRITSAACNOR0',
        protocol: '1475856',
        version: 1,
        gross_value_per_share_unscaled: 242425,
        gross_value_per_share_scale: 7,
        period_base: '4º Trimestre',
        fiscal_year: 2026,
        payment_date: '2027-01-04',
        sent_at: '2026-02-09',
        parser_version: PROVENTO_DECLARATION_VALUE_PARSER_VERSION,
      },
      {
        event_id: 'event-itsa4-1',
        isin: 'BRITSAACNPR7',
        protocol: '1475856',
        version: 1,
        gross_value_per_share_unscaled: 242425,
        gross_value_per_share_scale: 7,
        period_base: '4º Trimestre',
        fiscal_year: 2026,
        payment_date: '2027-01-04',
        sent_at: '2026-02-09',
        parser_version: PROVENTO_DECLARATION_VALUE_PARSER_VERSION,
      },
    ])
  })

  it('returns null when the document is not a Provento form at all', () => {
    expect(
      buildProventoDeclarationValueRowsV1({
        eventId: 'event-1',
        documentText: 'FATO RELEVANTE\nAlgum outro documento qualquer.',
      })
    ).toBeNull()
  })

  it('returns an empty array when the header is found but no row matches', () => {
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
    expect(
      buildProventoDeclarationValueRowsV1({
        eventId: 'event-1',
        documentText: malformed,
      })
    ).toEqual([])
  })

  it('throws instead of storing dedup-blind rows when identity is missing', () => {
    const noIdentity = ITSA4_SINGLE_QUARTER.replace(
      'Protocolo Provento Versão Data Envio\n1475856 1 09/02/2026\n',
      ''
    )

    expect(() =>
      buildProventoDeclarationValueRowsV1({
        eventId: 'event-1',
        documentText: noIdentity,
      })
    ).toThrow(/declaration identity/)
  })
})
