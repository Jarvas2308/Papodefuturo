import { parseExactDecimalString } from '../../../../domain/fundamentals'
import type { ExactDecimalQuantity } from '../../../../domain/fundamentals'
import type { CvmFiiMonthlyDocument } from './types'

// Extrai TODAS as linhas de Percentual_Dividend_Yield_Mes do documento
// "complemento" do Informe Mensal Estruturado da CVM (mesmo arquivo já
// baixado e parseado por csv.ts/provider.ts), deliberadamente sem
// colapsar pra "linha mais recente" como o resto do pipeline de FII faz
// - histórico mensal é o insumo real do DY trailing-12-meses, ao
// contrário dos outros fatos (patrimônio, cotas emitidas) que só
// precisam do valor mais recente. Não filtra por fundo aqui - devolve
// tudo, filtro por CNPJ é responsabilidade do chamador (mesmo padrão de
// separação de responsabilidade de buildProventoDeclarationValueRowsV1).
//
// Valor real confirmado com o arquivo de 2025 baixado nesta sessão:
// decimal com ponto (não vírgula), ex. "0.006216" = 0,6216% naquele mês
// - diferente do formato brasileiro com vírgula usado no DFP/ITR de
// ação. Falha fechada por linha: CNPJ/data/versão ausentes ou valor de
// DY não-parseável (inclusive notação científica, não suportada por
// parseExactDecimalString) descartam só aquela linha, nunca abortam o
// documento inteiro.

export type CvmFiiMonthlyDividendYieldRowV1 = {
  cnpj: string
  referenceDate: string
  version: string
  dividendYieldDecimal: ExactDecimalQuantity
}

const REQUIRED_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Percentual_Dividend_Yield_Mes',
] as const

function parseDelimitedRows(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]

    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }

    if (character === '"') {
      quoted = true
    } else if (character === ';') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') {
        continue
      }
      row.push(field)
      field = ''
      if (row.some((value) => value !== '') || row.length > 1) {
        rows.push(row)
      }
      row = []
    } else {
      field += character
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function extractCvmFiiMonthlyDividendYieldRowsV1(
  document: CvmFiiMonthlyDocument
): CvmFiiMonthlyDividendYieldRowV1[] {
  if (document.type !== 'complement') {
    throw new Error(
      `Expected CVM FII complement document: ${document.fileName}`
    )
  }

  const rows = parseDelimitedRows(document.content)
  if (rows.length === 0) {
    throw new Error(`CVM FII complement CSV is empty: ${document.fileName}`)
  }

  const header = rows[0]!.map((column, index) =>
    index === 0 ? column.replace(/^\uFEFF/, '') : column
  )
  const indexes = new Map(header.map((column, index) => [column, index]))
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!indexes.has(requiredHeader)) {
      throw new Error(
        `CVM FII complement CSV is missing header ${requiredHeader}: ${document.fileName}`
      )
    }
  }

  const cnpjIndex = indexes.get('CNPJ_Fundo_Classe')!
  const referenceDateIndex = indexes.get('Data_Referencia')!
  const versionIndex = indexes.get('Versao')!
  const dividendYieldIndex = indexes.get('Percentual_Dividend_Yield_Mes')!

  const result: CvmFiiMonthlyDividendYieldRowV1[] = []
  for (const values of rows.slice(1)) {
    const cnpj = values[cnpjIndex]?.trim()
    const referenceDate = values[referenceDateIndex]?.trim()
    const version = values[versionIndex]?.trim()
    const rawDividendYield = values[dividendYieldIndex]?.trim()

    if (!cnpj || !referenceDate || !version || !rawDividendYield) {
      continue
    }

    let dividendYieldDecimal: ExactDecimalQuantity
    try {
      dividendYieldDecimal = parseExactDecimalString(
        rawDividendYield,
        'CVM FII monthly dividend yield'
      )
    } catch {
      continue
    }

    result.push({ cnpj, referenceDate, version, dividendYieldDecimal })
  }

  return result
}
