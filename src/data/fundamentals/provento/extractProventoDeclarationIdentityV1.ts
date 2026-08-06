// Identidade interna da declaração de provento no formulário "Provento" da
// CVM (mesmo documento de extractProventoFormV1.ts) - a linha "Protocolo
// Provento Versão Data Envio", sempre antes da tabela de valores por ISIN.
//
// Não confundir com `numProtocolo`/`numSequencia`/`numVersao` do URL de
// download do ENET (já usados como identidade do `official_asset_event`):
// esses são identificadores do sistema de protocolo regulatório da CVM,
// atribuídos a cada envio de documento. O "Protocolo Provento" é a
// identidade da declaração de dividendo/JCP em si, definida pela empresa -
// duas submissões ENET diferentes (numProtocolo distinto) podem carregar o
// mesmo Protocolo Provento com Versão incrementada, quando a empresa reenvia
// uma correção da mesma declaração.
//
// Confirmado com 5 documentos reais (ITSA4 x2, BBAS3, TAEE11, WEGE3) nesta
// sessão: ITSA4 numProtocolo=1333427 (Versão 1) e numProtocolo=1333428
// (Versão 2) compartilham Protocolo Provento 1332829 - a mesma declaração,
// corrigida. Achado que resolve a pergunta de dedup deixada em aberto por
// DEC-096.
//
// Falha fechada: `null` sempre que a linha de cabeçalho não aparece ou o
// valor seguinte não bate exatamente no formato esperado - nunca um valor
// inventado.
export type ProventoDeclarationIdentityV1 = {
  protocol: string
  version: number
  sentAt: string
}

const HEADER_LINE = 'Protocolo Provento Versão Data Envio'
const VALUE_PATTERN = /^(\d+)\s+(\d+)\s+(\d{2}\/\d{2}\/\d{4})$/

export function extractProventoDeclarationIdentityV1(
  documentText: string
): ProventoDeclarationIdentityV1 | null {
  const lines = documentText.split('\n').map((line) => line.trim())
  const headerIndex = lines.findIndex((line) => line === HEADER_LINE)
  if (headerIndex === -1) {
    return null
  }

  const valueLine = lines
    .slice(headerIndex + 1)
    .find((line) => line !== '')
  if (!valueLine) {
    return null
  }

  const match = VALUE_PATTERN.exec(valueLine)
  if (!match) {
    return null
  }

  return {
    protocol: match[1]!,
    version: Number(match[2]!),
    sentAt: match[3]!,
  }
}
