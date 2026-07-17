import { CVM_IPE_HEADERS } from './constants'

export type FixtureRow = Record<(typeof CVM_IPE_HEADERS)[number], string>

const BASE_ROW: FixtureRow = {
  CNPJ_Companhia: '00.000.000/0001-91',
  Nome_Companhia: 'BANCO DO BRASIL S.A.',
  Codigo_CVM: '1023',
  Data_Referencia: '2026-07-15',
  Categoria: 'Fato Relevante',
  Tipo: '',
  Especie: '',
  Assunto: 'Evento oficial',
  Data_Entrega: '2026-07-16',
  Tipo_Apresentacao: 'AP - Apresentação',
  Protocolo_Entrega: '001023IPE160720260000000001-01',
  Versao: '1',
  Link_Download:
    'https://www.rad.cvm.gov.br/ENET/frmDownloadDocumento.aspx?numProtocolo=1&utm_source=test#top',
}

export function createFixtureRow(
  overrides: Partial<FixtureRow> = {}
): FixtureRow {
  return { ...BASE_ROW, ...overrides }
}

export function serializeFixtureRow(row: FixtureRow): string {
  return CVM_IPE_HEADERS.map((header) => {
    const value = row[header]
    return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }).join(';')
}

export function createFixtureCsv(rows: readonly FixtureRow[]): string {
  return [CVM_IPE_HEADERS.join(';'), ...rows.map(serializeFixtureRow)].join(
    '\r\n'
  )
}

export function createFiveCompanyRows(): FixtureRow[] {
  return [
    createFixtureRow(),
    createFixtureRow({
      CNPJ_Companhia: '61.532.644/0001-15',
      Nome_Companhia: 'ITAUSA S.A.',
      Codigo_CVM: '7617',
      Categoria: 'Comunicado ao Mercado',
      Assunto: 'Comunicado oficial',
      Protocolo_Entrega: '007617IPE160720260000000002-02',
    }),
    createFixtureRow({
      CNPJ_Companhia: '07.859.971/0001-30',
      Nome_Companhia: 'TRANSMISSORA ALIANÇA DE ENERGIA ELÉTRICA S.A.',
      Codigo_CVM: '20257',
      Categoria: 'Assembleia',
      Assunto: '',
      Especie: 'Ata',
      Protocolo_Entrega: '020257IPE160720260000000003-03',
    }),
    createFixtureRow({
      CNPJ_Companhia: '84.429.695/0001-11',
      Nome_Companhia: 'WEG SA',
      Codigo_CVM: '5410',
      Categoria: 'Dados Econômico-Financeiros',
      Assunto: '',
      Especie: '',
      Tipo: 'Demonstrações Financeiras',
      Protocolo_Entrega: '005410IPE160720260000000004-04',
    }),
    createFixtureRow({
      CNPJ_Companhia: '02.149.205/0001-69',
      Nome_Companhia: 'PORTO SEGURO SA',
      Codigo_CVM: '16659',
      Categoria: 'Aviso aos Acionistas',
      Assunto: 'Aviso oficial',
      Protocolo_Entrega: '016659IPE160720260000000005-05',
    }),
  ]
}

export function encodeWindows1252(value: string): Uint8Array {
  const specialCharacters = new Map<string, number>([
    ['Á', 0xc1],
    ['Ã', 0xc3],
    ['Ç', 0xc7],
    ['É', 0xc9],
    ['Í', 0xcd],
    ['Ó', 0xd3],
    ['Ú', 0xda],
    ['á', 0xe1],
    ['ã', 0xe3],
    ['ç', 0xe7],
    ['é', 0xe9],
    ['í', 0xed],
    ['ó', 0xf3],
    ['ú', 0xfa],
    ['—', 0x97],
  ])
  return Uint8Array.from(
    [...value].map((character) => {
      const special = specialCharacters.get(character)
      if (special !== undefined) return special
      const code = character.charCodeAt(0)
      if (code > 0x7f)
        throw new Error(`Unsupported fixture character: ${character}`)
      return code
    })
  )
}
