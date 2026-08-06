// Valor do provento (dividendo/JCP) por ação - bloqueio confirmado em
// DEC-091 pra fonte CSV/XML/JSON estruturada (FRE, Informe Mensal, DFIN
// não têm). Único caminho real remanescente: o próprio PDF do documento
// regulatório (Fato Relevante "Declaração de juros sobre capital próprio"
// ou Aviso aos Acionistas de uma única reunião de conselho) já linkado
// pelo evento oficial ingerido (CVM IPE, DEC-082).
//
// Risco aceito explicitamente pelo usuário: é o primeiro parser de texto
// livre do projeto - tudo mais até aqui é CSV/XML/JSON estruturado.
// Disciplina de mitigação: falha fechada sempre que o documento não bater
// no formato de declaração ÚNICA por reunião de conselho (exatamente um
// valor bruto e um valor líquido "por ação"/"para cada uma das ações").
//
// Confirmado com 3 documentos reais baixados nesta sessão:
// - ITSA4, Fato Relevante (declaração única): "R$ 0,138 por ação" (bruto),
//   "R$ 0,11385 por ação" (líquido) - 2 ocorrências, aceito.
// - PSSA3, Aviso aos Acionistas (declaração única, reunião de 17/06/2026):
//   "R$ 0,51280364554 para cada uma das ações" (bruto), "R$
//   0,42347967175 por ação" (líquido) - 2 ocorrências, aceito.
// - PSSA3, Aviso aos Acionistas de ratificação na AGO (soma 4 tranches +
//   1 dividendo adicional): 9 ocorrências de valor por ação - rejeitado
//   corretamente, nunca somaria ou escolheria um dos 9 valores sem
//   inventar critério.
export type ProventoDeclarationValuePerShareV1 = {
  grossValuePerShareDecimal: string
  netValuePerShareDecimal: string
}

const PER_SHARE_VALUE_PATTERN =
  /R\$\s*(\d{1,3}(?:\.\d{3})*,\d+)\s+(?:por\s+a[cç][ãa]o|para\s+cada\s+uma\s+das\s+a[cç][õo]es)/gi

const LOOKBEHIND_WINDOW = 120

type Classification = 'gross' | 'net' | null

function classifyByNearestKeyword(
  text: string,
  matchStartIndex: number
): Classification {
  const windowStart = Math.max(0, matchStartIndex - LOOKBEHIND_WINDOW)
  const preceding = text.slice(windowStart, matchStartIndex).toLowerCase()

  const grossIndex = preceding.lastIndexOf('bruto')
  const netIndex = Math.max(
    preceding.lastIndexOf('líquido'),
    preceding.lastIndexOf('liquido')
  )

  if (grossIndex === -1 && netIndex === -1) {
    return null
  }

  return grossIndex > netIndex ? 'gross' : 'net'
}

// Normaliza decimal brasileiro (ponto de milhar, vírgula decimal) pro
// formato que parseCvmMonetaryFact/parseFredDfii10Percent já esperam
// (ponto decimal, sem separador de milhar) - reaproveita a mesma
// disciplina de conversão do resto do projeto, não uma nova.
function normalizeBrazilianDecimal(value: string): string {
  return value.replace(/\./g, '').replace(',', '.')
}

/**
 * Extrai o valor bruto e líquido por ação de um documento de declaração
 * ÚNICA de provento (Fato Relevante ou Aviso aos Acionistas de uma
 * reunião de conselho específica). Devolve `null` sempre que o texto não
 * corresponder exatamente ao formato de uma declaração única - nunca
 * soma, nunca escolhe entre candidatos ambíguos, nunca adivinha.
 */
export function extractProventoValuePerShareV1(
  documentText: string
): ProventoDeclarationValuePerShareV1 | null {
  const matches = [...documentText.matchAll(PER_SHARE_VALUE_PATTERN)]

  if (matches.length !== 2) {
    return null
  }

  const classified = matches.map((match) => ({
    value: normalizeBrazilianDecimal(match[1]!),
    classification: classifyByNearestKeyword(documentText, match.index),
  }))

  const gross = classified.find((entry) => entry.classification === 'gross')
  const net = classified.find((entry) => entry.classification === 'net')

  if (!gross || !net || gross === net) {
    return null
  }

  return {
    grossValuePerShareDecimal: gross.value,
    netValuePerShareDecimal: net.value,
  }
}
