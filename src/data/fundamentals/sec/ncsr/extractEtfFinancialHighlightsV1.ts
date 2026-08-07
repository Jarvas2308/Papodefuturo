import { parseExactDecimalString } from '../../../../domain/fundamentals/exactDecimalQuantity'
import type { ExactDecimalQuantity } from '../../../../domain/fundamentals/types'

// Extrai, do N-CSR anual da SEC, o bloco "Financial Highlights" da classe
// ETF de um fundo específico e devolve os dois fatos que o sinal de
// spread DY/TIPS precisa (DEC-103): "Total Distributions" por cota do
// exercício mais recente e "Net Asset Value, End of Period".
//
// Toda a disciplina aqui é falha fechada (`null`), nunca chute:
//
// - o par (nome do fundo, rótulo da classe) precisa casar EXATAMENTE uma
//   vez no documento. Zero ocorrências ou mais de uma abortam - um N-CSR
//   agrupa vários fundos e várias classes por fundo, e pegar "a primeira
//   tabela de Financial Highlights" traria o fundo errado;
// - o cabeçalho precisa ser "Year Ended <Mês> <Dia>," seguido dos anos
//   dos exercícios. Um bloco de fundo novo com período parcial
//   ("Period Ended") não é comparável e aborta;
// - cada linha precisa ter exatamente um valor por exercício declarado no
//   cabeçalho; qualquer célula fora do formato numérico aborta.
//
// Os valores de distribuição vêm entre parênteses no original (saída de
// caixa do NAV). O domínio trata distribuição como magnitude positiva -
// mesmo tratamento que o pipeline de provento da CVM dá ao valor bruto
// declarado -, então o sinal do parêntese é descartado aqui, de forma
// explícita e documentada, e não silenciosamente.

const MONTHS: Readonly<Record<string, string>> = {
  January: '01',
  February: '02',
  March: '03',
  April: '04',
  May: '05',
  June: '06',
  July: '07',
  August: '08',
  September: '09',
  October: '10',
  November: '11',
  December: '12',
}

const TOTAL_DISTRIBUTIONS_LABEL = 'Total Distributions'
const NAV_END_OF_PERIOD_LABEL = 'Net Asset Value, End of Period'
const FINANCIAL_HIGHLIGHTS_LABEL = 'Financial Highlights'
const MAX_FISCAL_YEAR_COLUMNS = 10

export type EtfFinancialHighlightsV1 = {
  fiscalYearEndDate: string
  totalDistributionsPerShare: ExactDecimalQuantity
  netAssetValueEndOfPeriod: ExactDecimalQuantity
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Aceita "$90.81", "(3.472)", "(.852)", "1,234.56" e o travessão que a
// fonte usa para "nenhum valor no exercício" (zero real, não ausência).
// Recusa qualquer coisa com "%" - percentual significa que a varredura
// caiu em outra linha da tabela.
function parseHighlightValue(token: string): ExactDecimalQuantity | null {
  if (token === '—' || token === '–' || token === '-') {
    return { unscaledValue: 0, scale: 0 }
  }

  let body = token
  if (body.startsWith('(') && body.endsWith(')')) {
    body = body.slice(1, -1)
  }
  body = body.replace(/^\$/, '').replaceAll(',', '')

  if (!/^\d*\.?\d+$/.test(body)) {
    return null
  }
  if (body.startsWith('.')) {
    body = `0${body}`
  }

  try {
    return parseExactDecimalString(body, 'ETF financial highlights value')
  } catch {
    return null
  }
}

function readRowValues(
  tokens: readonly string[],
  label: string,
  columnCount: number
): ExactDecimalQuantity[] | null {
  const labelTokens = label.split(' ')
  for (let index = 0; index + labelTokens.length <= tokens.length; index += 1) {
    const matches = labelTokens.every(
      (labelToken, offset) => tokens[index + offset] === labelToken
    )
    if (!matches) continue

    const values: ExactDecimalQuantity[] = []
    for (let column = 0; column < columnCount; column += 1) {
      const token = tokens[index + labelTokens.length + column]
      if (token === undefined) return null
      const value = parseHighlightValue(token)
      if (value === null) return null
      values.push(value)
    }
    return values
  }
  return null
}

export function extractEtfFinancialHighlightsV1(input: {
  documentText: string
  fundName: string
  shareClassLabel: string
}): EtfFinancialHighlightsV1 | null {
  const { documentText, fundName, shareClassLabel } = input

  // O cabeçalho do bloco é sempre precedido pelo número da página
  // impressa (invariante estrutural confirmado nos três filings reais de
  // 2026 de VOO, VNQ e VEA: "...Financial Statements. 13 500 Index Fund
  // Financial Highlights ETF Shares"). Exigir esse número não é
  // preciosismo: sem ele, "Real Estate Index Fund" casaria dentro de
  // "Vanguard Real Estate Index Fund" e o extrator devolveria os números
  // de outro fundo. Se a Vanguard mudar a diagramação, isto falha
  // fechado (`null`) em vez de extrair o fundo errado.
  const blockPattern = new RegExp(
    `(?:^|\\s)\\d+ (${escapeRegExp(fundName)} ${FINANCIAL_HIGHLIGHTS_LABEL} ${escapeRegExp(shareClassLabel)} )`,
    'g'
  )

  const starts: number[] = []
  for (const match of documentText.matchAll(blockPattern)) {
    starts.push(match.index + match[0].length - match[1].length)
  }
  if (starts.length !== 1) {
    return null
  }

  const blockStart = starts[0]
  const nextHighlights = documentText.indexOf(
    FINANCIAL_HIGHLIGHTS_LABEL,
    blockStart + FINANCIAL_HIGHLIGHTS_LABEL.length + fundName.length
  )
  const block = documentText.slice(
    blockStart,
    nextHighlights === -1 ? undefined : nextHighlights
  )

  const headerMatch = /Year Ended ([A-Z][a-z]+) (\d{1,2}), ((?:\d{4} ?)+)/.exec(
    block
  )
  if (!headerMatch) {
    return null
  }

  const [, monthName, dayOfMonth, yearList] = headerMatch
  const month = MONTHS[monthName]
  if (month === undefined) {
    return null
  }

  const fiscalYears = yearList.trim().split(' ')
  if (
    fiscalYears.length === 0 ||
    fiscalYears.length > MAX_FISCAL_YEAR_COLUMNS
  ) {
    return null
  }

  const tokens = block.slice(headerMatch.index).split(' ')

  const distributions = readRowValues(
    tokens,
    TOTAL_DISTRIBUTIONS_LABEL,
    fiscalYears.length
  )
  const netAssetValues = readRowValues(
    tokens,
    NAV_END_OF_PERIOD_LABEL,
    fiscalYears.length
  )
  if (distributions === null || netAssetValues === null) {
    return null
  }

  // A primeira coluna é sempre o exercício mais recente - a própria
  // ordem do cabeçalho (2026 2025 2024 ...) confirma isso no documento.
  const netAssetValue = netAssetValues[0]
  if (netAssetValue.unscaledValue <= 0) {
    return null
  }

  return {
    fiscalYearEndDate: `${fiscalYears[0]}-${month}-${dayOfMonth.padStart(2, '0')}`,
    totalDistributionsPerShare: distributions[0],
    netAssetValueEndOfPeriod: netAssetValue,
  }
}
