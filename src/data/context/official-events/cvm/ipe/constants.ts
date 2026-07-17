export const CVM_IPE_STOCK_EVENTS_PROVIDER_V1_VERSION =
  'cvm-ipe-stock-events-provider.v1' as const
export const CVM_IPE_STOCK_EVENTS_PARSER_V1_VERSION =
  'cvm-ipe-stock-events-parser.v1' as const
export const CVM_IPE_TERMS_AUDITED_AT = '2026-07-16' as const
export const CVM_IPE_DATASET_LICENSE = 'ODbL-1.0' as const

export const MAX_CVM_IPE_ARCHIVE_BYTES = 20 * 1024 * 1024
export const MAX_CVM_IPE_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
export const MAX_CVM_IPE_ARCHIVE_ENTRIES = 100
export const MAX_CVM_IPE_CSV_ROWS = 100_000
export const MAX_CVM_IPE_CSV_COLUMNS = 64

export const CVM_IPE_HEADERS = Object.freeze([
  'CNPJ_Companhia',
  'Nome_Companhia',
  'Codigo_CVM',
  'Data_Referencia',
  'Categoria',
  'Tipo',
  'Especie',
  'Assunto',
  'Data_Entrega',
  'Tipo_Apresentacao',
  'Protocolo_Entrega',
  'Versao',
  'Link_Download',
] as const)
