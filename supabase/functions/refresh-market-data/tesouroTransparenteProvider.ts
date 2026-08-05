import { decimalToExchangeRateScaled } from './decimal.ts'

export type NtnbLongaRate = {
  series: 'ntnb-longa'
  maturityDate: string
  rateScaled: number
  rateScale: 1000000
  pricedAt: string
  source: 'tesouro-transparente'
}

const CSV_URL =
  'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv'

// Nome atual da NTN-B classica no Tesouro Direto (docs/reference/FII_SEGMENTOS_E_METRICAS.md, secao 7.2).
const TITLE = 'Tesouro IPCA+ com Juros Semestrais'

type TesouroCsvRow = {
  tipoTitulo: string
  dataVencimento: string
  dataBase: string
  taxaCompraManha: string
}

// DD/MM/AAAA -> AAAA-MM-DD. CSV brasileiro, sempre este formato.
function toIsoDate(brazilianDate: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(brazilianDate.trim())

  if (!match) {
    throw new Error(`Data em formato inesperado: ${brazilianDate}`)
  }

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

export function parseTesouroTransparenteCsv(rawLatin1Text: string): TesouroCsvRow[] {
  const lines = rawLatin1Text.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('CSV do Tesouro Transparente veio vazio.')
  }

  const header = lines[0]!.split(';')
  const titleIndex = header.indexOf('Tipo Titulo')
  const maturityIndex = header.indexOf('Data Vencimento')
  const baseIndex = header.indexOf('Data Base')
  const rateIndex = header.indexOf('Taxa Compra Manha')

  if (
    titleIndex === -1 ||
    maturityIndex === -1 ||
    baseIndex === -1 ||
    rateIndex === -1
  ) {
    throw new Error('CSV do Tesouro Transparente com cabeçalho inesperado.')
  }

  const rows: TesouroCsvRow[] = []

  for (let index = 1; index < lines.length; index += 1) {
    const columns = lines[index]!.split(';')
    const tipoTitulo = columns[titleIndex]

    if (tipoTitulo !== TITLE) {
      continue
    }

    const dataVencimento = columns[maturityIndex]
    const dataBase = columns[baseIndex]
    const taxaCompraManha = columns[rateIndex]

    if (!dataVencimento || !dataBase || !taxaCompraManha) {
      continue
    }

    rows.push({ tipoTitulo, dataVencimento, dataBase, taxaCompraManha })
  }

  return rows
}

// "Vencimento mais longo disponivel" e regra explicita, nao vencimento
// fixo - o titulo mais longo muda com o tempo conforme o Tesouro emite
// novos (docs/reference/FII_SEGMENTOS_E_METRICAS.md, secao 7.2).
export function selectLatestNtnbLongaRow(
  rows: readonly TesouroCsvRow[]
): TesouroCsvRow {
  if (rows.length === 0) {
    throw new Error(`Nenhuma linha de "${TITLE}" encontrada no CSV.`)
  }

  const latestBaseDate = rows.reduce((latest, row) => {
    const current = toIsoDate(row.dataBase)
    return current > latest ? current : latest
  }, toIsoDate(rows[0]!.dataBase))

  const rowsAtLatestBase = rows.filter(
    (row) => toIsoDate(row.dataBase) === latestBaseDate
  )

  return rowsAtLatestBase.reduce((longest, row) => {
    const current = toIsoDate(row.dataVencimento)
    const longestMaturity = toIsoDate(longest.dataVencimento)
    return current > longestMaturity ? row : longest
  }, rowsAtLatestBase[0]!)
}

export function parseNtnbLongaRate(rawLatin1Text: string): NtnbLongaRate {
  const rows = parseTesouroTransparenteCsv(rawLatin1Text)
  const selected = selectLatestNtnbLongaRow(rows)
  const normalizedRate = selected.taxaCompraManha.trim().replace(',', '.')

  return {
    series: 'ntnb-longa',
    maturityDate: toIsoDate(selected.dataVencimento),
    rateScaled: decimalToExchangeRateScaled(normalizedRate),
    rateScale: 1_000_000,
    pricedAt: toIsoDate(selected.dataBase),
    source: 'tesouro-transparente',
  }
}

type FetchLike = typeof fetch

export type TesouroTransparenteProvider = {
  getNtnbLongaRate(): Promise<NtnbLongaRate>
}

export function createTesouroTransparenteProvider(
  fetchImplementation: FetchLike = fetch
): TesouroTransparenteProvider {
  return {
    async getNtnbLongaRate() {
      const response = await fetchImplementation(CSV_URL)

      if (!response.ok) {
        throw new Error(
          `Tesouro Transparente respondeu ${response.status} ao baixar o CSV.`
        )
      }

      const buffer = await response.arrayBuffer()
      // CSV do Tesouro vem em Latin-1 (ISO-8859-1), nao UTF-8 - confirmado
      // baixando o arquivo real. Decodificar errado corrompe os nomes dos
      // titulos e a filtragem por TITLE falha silenciosamente (zero linhas).
      const text = new TextDecoder('iso-8859-1').decode(buffer)

      return parseNtnbLongaRate(text)
    },
  }
}
