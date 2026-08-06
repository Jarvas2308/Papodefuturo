import { describe, expect, it } from 'vitest'
import { extractProventoValuePerShareV1 } from './extractProventoValuePerShareV1'

// Os 3 textos abaixo são extração real (pdf-parse) de documentos CVM
// baixados nesta sessão (numProtocolo real no comentário de cada caso),
// não fixture inventada. Confirma o comportamento contra o dado de
// verdade que motivou o desenho fail-closed.

// ITSA4, Fato Relevante "Declaração de juros sobre capital próprio",
// numProtocolo=1534704, 15/06/2026.
const ITSA4_SINGLE_DECLARATION = `FATO RELEVANTE
DECLARAÇÃO DE JUROS SOBRE CAPITAL PRÓPRIO
ITAÚSA S.A. (B3: ITSA3, ITSA4) comunica que seu Conselho de Administração, reunido nesta
data, deliberou declarar juros sobre capital próprio no montante bruto de R$ 1.547 milhões
(R$ 0,138 por ação), correspondente ao montante líquido de R$ 1.276 milhões (R$ 0,11385 por
ação), considerando a retenção de 17,5% de imposto de renda na fonte, excetuados dessa retenção
os acionistas pessoas jurídicas comprovadamente imunes ou isentos.`

// PSSA3, Aviso aos Acionistas (declaração de uma única reunião de
// conselho, 17/06/2026), numProtocolo=1535779.
const PSSA3_SINGLE_DECLARATION = `A PORTO SEGURO S.A. ("Porto" ou "Companhia") (B3: PSSA3) comunica aos senhores acionistas que,
conforme deliberação em reunião do Conselho de Administração realizada nesta data, 17 de junho de
2026, foi aprovada, ad referendum da Assembleia Geral Ordinária da Companhia de 2027, a declaração
de juros sobre o capital próprio ("JCP"), relativos ao segundo trimestre de 2026, no montante total
bruto de R$ 328.703.200,00 (trezentos e vinte e oito milhões, setecentos e três mil e duzentos reais),
equivalente ao valor líquido de R$ 271.447.218,54 (duzentos e setenta e um milhões, quatrocentos e
quarenta e sete mil, duzentos e dezoito reais e cinquenta e quatro centavos), imputados ao dividendo
mínimo obrigatório relativo ao exercício social de 2026, nos termos do artigo 9º da Lei 9.249/95,
observado o que segue:
1.  O valor bruto dos JCP corresponde a R$ 0,51280364554 para cada uma das ações da
Companhia, considerando as ações mantidas em tesouraria nesta data, correspondendo ao valor líquido
de R$ 0,42347967175 por ação, sobre o qual incidirá a retenção de 17,5%.`

// PSSA3, Aviso aos Acionistas de ratificação na AGO (soma 4 tranches
// trimestrais de JCP + 1 dividendo adicional, 31/03/2026),
// numProtocolo=1499377.
const PSSA3_AGM_RATIFICATION_MULTI_TRANCHE = `A PORTO SEGURO S.A. ("Companhia") (B3: PSSA3) comunica aos senhores acionistas que a
Assembleia Geral Ordinária e Extraordinária realizada em 31 de março de 2026 aprovou
a ratificação da distribuição de juros sobre o capital próprio ("JCP") aos acionistas.
(i) valor bruto de R$ 277.810.000,00, correspondendo a R$ 0,43273681330 por ação, em valores
    líquidos, correspondendo a R$ 0,37234392477 por ação;
(ii) valor bruto de R$ 311.011.000,00, correspondendo a R$ 0,48320810620 por ação, em valores
    líquidos, correspondendo a R$ 0,41507772131 por ação;
(iii) valor bruto de R$ 342.850.000,00, correspondendo a R$ 0,53380435871 por ação, em valores
    líquidos, correspondendo a R$ 0,45784608909 por ação; e
(iv) valor bruto de R$ 344.260.000,00, correspondendo a R$ 0,53760384028 por ação, em valores
    líquidos, correspondendo a R$ 0,45733804670 por ação.
A Assembleia também aprovou o pagamento de dividendos adicionais, no valor de R$
567.390.120,88, correspondentes a R$ 0,88610135766 por ação.`

describe('extractProventoValuePerShareV1', () => {
  it('extracts gross and net value from a single-declaration Fato Relevante (ITSA4, real document)', () => {
    expect(extractProventoValuePerShareV1(ITSA4_SINGLE_DECLARATION)).toEqual({
      grossValuePerShareDecimal: '0.138',
      netValuePerShareDecimal: '0.11385',
    })
  })

  it('extracts gross and net value from a single-declaration Aviso aos Acionistas (PSSA3, real document)', () => {
    expect(extractProventoValuePerShareV1(PSSA3_SINGLE_DECLARATION)).toEqual({
      grossValuePerShareDecimal: '0.51280364554',
      netValuePerShareDecimal: '0.42347967175',
    })
  })

  it('fails closed on a multi-tranche AGM ratification instead of summing or guessing (PSSA3, real document)', () => {
    expect(
      extractProventoValuePerShareV1(PSSA3_AGM_RATIFICATION_MULTI_TRANCHE)
    ).toBeNull()
  })

  it('fails closed when no per-share value is present', () => {
    expect(
      extractProventoValuePerShareV1('Nenhum provento mencionado aqui.')
    ).toBeNull()
  })

  it('fails closed when only one value is found (missing gross or net)', () => {
    const text = 'Valor bruto de R$ 1,50 por ação, sem menção ao líquido.'
    expect(extractProventoValuePerShareV1(text)).toBeNull()
  })

  it('fails closed when neither value has a recognizable bruto/líquido keyword nearby', () => {
    const text =
      'Primeiro valor de R$ 1,50 por ação. Segundo valor de R$ 1,20 por ação.'
    expect(extractProventoValuePerShareV1(text)).toBeNull()
  })

  it('normalizes Brazilian thousand separators in large per-share values', () => {
    const text =
      'valor bruto de R$ 1.234,56 por ação, valor líquido de R$ 1.000,00 por ação'
    expect(extractProventoValuePerShareV1(text)).toEqual({
      grossValuePerShareDecimal: '1234.56',
      netValuePerShareDecimal: '1000.00',
    })
  })

  it('accepts "liquido" without accent as a valid net keyword', () => {
    const text =
      'valor bruto de R$ 2,00 por ação, valor liquido de R$ 1,80 por ação'
    expect(extractProventoValuePerShareV1(text)).toEqual({
      grossValuePerShareDecimal: '2.00',
      netValuePerShareDecimal: '1.80',
    })
  })
})
