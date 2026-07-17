import { CVM_FUND_DELIVERY_HEADERS } from './constants'

export type FundDeliveryFixtureRow = {
  Tipo_Fundo_Classe: string
  CNPJ_Fundo_Classe: string
  ID_Subclasse: string
  Tipo_Documento: string
  Data_Inicio_Competencia: string
  Data_Fim_Competencia: string
  ID_Documento: string
  Data_Hora_Entrega: string
  Tipo_Apresentacao: string
  Ativo: string
  Sistema_Origem: string
}

export function createFundDeliveryFixtureRow(
  overrides: Partial<FundDeliveryFixtureRow> = {}
): FundDeliveryFixtureRow {
  return {
    Tipo_Fundo_Classe: 'CLASSES - FII',
    CNPJ_Fundo_Classe: '12005956000165',
    ID_Subclasse: '',
    Tipo_Documento: 'INFORM MENSAL',
    Data_Inicio_Competencia: '2026-06-01',
    Data_Fim_Competencia: '2026-06-30',
    ID_Documento: '1247762',
    Data_Hora_Entrega: '2026-07-14 18:34:42.067',
    Tipo_Apresentacao: 'Apresentação',
    Ativo: 'S',
    Sistema_Origem: 'FNET',
    ...overrides,
  }
}

function escapeField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function createFundDeliveryFixtureCsv(
  rows: readonly FundDeliveryFixtureRow[]
): string {
  return [
    CVM_FUND_DELIVERY_HEADERS.join(';'),
    ...rows.map((row) => Object.values(row).map(escapeField).join(';')),
  ].join('\r\n')
}

export function createFourFundRows(): FundDeliveryFixtureRow[] {
  return [
    createFundDeliveryFixtureRow(),
    createFundDeliveryFixtureRow({
      CNPJ_Fundo_Classe: '17554274000125',
      ID_Documento: '1247763',
    }),
    createFundDeliveryFixtureRow({
      CNPJ_Fundo_Classe: '26502794000185',
      ID_Documento: '1247764',
    }),
    createFundDeliveryFixtureRow({
      CNPJ_Fundo_Classe: '29641226000153',
      ID_Documento: '1247765',
    }),
  ]
}

export function encodeWindows1252(value: string): Uint8Array {
  const substitutions = new Map([
    ['ç', 0xe7],
    ['ã', 0xe3],
    ['á', 0xe1],
    ['é', 0xe9],
    ['í', 0xed],
    ['ó', 0xf3],
    ['ú', 0xfa],
    ['Ç', 0xc7],
    ['Ã', 0xc3],
    ['Á', 0xc1],
    ['É', 0xc9],
    ['Í', 0xcd],
    ['Ó', 0xd3],
    ['Ú', 0xda],
  ])
  return Uint8Array.from(
    [...value].map((character) => {
      const replacement = substitutions.get(character)
      if (replacement !== undefined) return replacement
      const codePoint = character.codePointAt(0) ?? -1
      if (codePoint < 0 || codePoint > 0x7f) {
        throw new Error(
          `Unsupported Windows-1252 fixture character: ${character}`
        )
      }
      return codePoint
    })
  )
}
