// Formulário "Provento" da CVM (categoria IPE "Relatório Proventos",
// DEC-082) - template fixo do próprio governo, não prosa da empresa.
// Muito mais confiável que a declaração em Fato Relevante/Aviso aos
// Acionistas (ver extractProventoValuePerShareV1.ts, mantido como
// referência histórica da primeira tentativa) - cross-validado nesta
// sessão: valor bruto de PSSA3 extraído deste formulário
// (0,48320810620) bate exatamente com o mesmo trimestre extraído da
// prosa do Aviso aos Acionistas.
//
// pdf-parse quebra a tabela em blocos fixos de 5 linhas por linha de
// ISIN (confirmado com 2 documentos reais, ITSA4 e PSSA3):
//   1. primeira metade do código ISIN (ex.: "BRITSAACN")
//   2. segunda metade do código ISIN (ex.: "OR0")
//   3. primeira parte do valor bruto decimal (ex.: "0,0242425000")
//   4. dígito final do valor bruto, quebrado por largura de coluna
//      (ex.: "0" -> concatenado dá "0,02424250000")
//   5. período base + exercício social + atualização + forma de
//      pagamento + data de pagamento, todos na mesma linha
//
// Falha fechada (linha ignorada, nunca um valor inventado) sempre que
// um bloco de 5 linhas não bater exatamente nesse formato - mesma
// disciplina do resto do parser CVM do projeto.
export type ProventoFormRowV1 = {
  isin: string
  grossValuePerShareDecimal: string
  periodBase: string
  fiscalYear: number
  paymentDate: string
}

const ISIN_PATTERN = /^[A-Z0-9]+$/
const DECIMAL_FIRST_PART_PATTERN = /^\d+,\d+$/
const DECIMAL_TRAILING_DIGIT_PATTERN = /^\d+$/
const ROW_SUMMARY_PATTERN =
  /^(.+?)\s+(\d{4})\s+(?:Sim|Não)\s+.+?\s+(\d{2}\/\d{2}\/\d{4})\s*$/

function parseRow(lines: readonly string[]): ProventoFormRowV1 | null {
  const [isinPart1, isinPart2, valuePart1, valuePart2, summary] = lines

  if (
    !isinPart1 ||
    !isinPart2 ||
    !valuePart1 ||
    !valuePart2 ||
    !summary ||
    !ISIN_PATTERN.test(isinPart1) ||
    !ISIN_PATTERN.test(isinPart2) ||
    !DECIMAL_FIRST_PART_PATTERN.test(valuePart1) ||
    !DECIMAL_TRAILING_DIGIT_PATTERN.test(valuePart2)
  ) {
    return null
  }

  const isin = `${isinPart1}${isinPart2}`
  if (isin.length !== 12) {
    return null
  }

  const summaryMatch = ROW_SUMMARY_PATTERN.exec(summary)
  if (!summaryMatch) {
    return null
  }

  const periodBase = summaryMatch[1]!
  const fiscalYearRaw = summaryMatch[2]!
  const paymentDate = summaryMatch[3]!
  const fiscalYear = Number(fiscalYearRaw)

  // "31/12/9999" observed for real in production (PSSA3, protocolo
  // 1225424 versão 2, Anual 2023) - o próprio formulário "Provento" da
  // CVM usa esse valor sentinela quando a empresa não preencheu a data
  // de pagamento real. Sintaticamente é uma data válida (bate o padrão
  // acima), mas nunca é uma data de pagamento real - falha fechada em
  // vez de guardar um valor que quebraria qualquer agregação por
  // período (trailing-12-meses).
  if (paymentDate.endsWith('/9999')) {
    return null
  }

  return {
    isin,
    grossValuePerShareDecimal: `${valuePart1}${valuePart2}`.replace(',', '.'),
    periodBase: periodBase.trim(),
    fiscalYear,
    paymentDate,
  }
}

/**
 * Extrai as linhas da tabela de proventos do formulário "Provento" da
 * CVM. Devolve um array vazio (não `null`) quando o cabeçalho é
 * encontrado mas nenhuma linha bate no formato esperado - `null` só
 * quando o documento nem parece ser este formulário (fail-closed no
 * nível do documento, não confundir "formulário sem linha válida" com
 * "não é este formulário").
 */
export function extractProventoFormV1(
  documentText: string
): ProventoFormRowV1[] | null {
  const lines = documentText.split('\n').map((line) => line.trim())
  // O cabeçalho "Data Pagamento" vem quebrado em 2 linhas ("Data" e
  // "Pagamento") pelo pdf-parse, igual todo o resto do cabeçalho da
  // tabela - confirmado com os documentos reais.
  const headerIndex = lines.findIndex(
    (line, index) => line === 'Pagamento' && lines[index - 1] === 'Data'
  )
  const footerIndex = lines.findIndex((line) => line === 'Parcelamento')

  if (headerIndex === -1 || footerIndex === -1 || footerIndex <= headerIndex) {
    return null
  }

  const tableLines = lines
    .slice(headerIndex + 1, footerIndex)
    .filter((line) => line !== '')

  const rows: ProventoFormRowV1[] = []
  for (let index = 0; index + 5 <= tableLines.length; index += 5) {
    const row = parseRow(tableLines.slice(index, index + 5))
    if (row) {
      rows.push(row)
    }
  }

  return rows
}
