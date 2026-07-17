export const CVM_FUND_DELIVERY_FII_EVENTS_PROVIDER_V1_VERSION =
  'cvm-fund-delivery-fii-events-provider.v1' as const
export const CVM_FUND_DELIVERY_FII_EVENTS_PARSER_V1_VERSION =
  'cvm-fund-delivery-fii-events-parser.v1' as const
export const CVM_FUND_DELIVERY_FII_DOCUMENT_TYPES_V1_VERSION =
  'cvm-fund-delivery-fii-document-types.v1' as const
export const CVM_FUND_DELIVERY_TERMS_AUDITED_AT = '2026-07-17' as const
export const CVM_FUND_DELIVERY_DATASET_LICENSE = 'ODbL-1.0' as const

export const MAX_CVM_FUND_DELIVERY_ARCHIVE_BYTES = 32 * 1024 * 1024
export const MAX_CVM_FUND_DELIVERY_ARCHIVE_ENTRIES = 10
export const MAX_CVM_FUND_DELIVERY_DECLARED_UNCOMPRESSED_BYTES =
  320 * 1024 * 1024
export const MAX_CVM_FUND_DELIVERY_MONTHLY_CSV_BYTES = 32 * 1024 * 1024
export const MAX_CVM_FUND_DELIVERY_CSV_ROWS = 250_000
export const MAX_CVM_FUND_DELIVERY_CSV_COLUMNS = 11

export const CVM_FUND_DELIVERY_HEADERS = Object.freeze([
  'Tipo_Fundo_Classe',
  'CNPJ_Fundo_Classe',
  'ID_Subclasse',
  'Tipo_Documento',
  'Data_Inicio_Competencia',
  'Data_Fim_Competencia',
  'ID_Documento',
  'Data_Hora_Entrega',
  'Tipo_Apresentacao',
  'Ativo',
  'Sistema_Origem',
] as const)
