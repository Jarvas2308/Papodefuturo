import { extractEtfFinancialHighlightsV1 } from './extractEtfFinancialHighlightsV1'
import type { EtfNcsrFundIdentityV1 } from './etfNcsrFundIdentityV1'
import { normalizeSecDocumentTextV1 } from './normalizeSecDocumentTextV1'

// Linha de `etf_distribution_values` (snake_case, exatamente os 11 campos
// que `upsert_etf_distribution_values_v1` aceita). Puro: recebe o HTML já
// baixado, nunca faz rede.
export type EtfDistributionValueRowV1 = {
  ticker: string
  registrant_cik: string
  accession_number: string
  fund_name: string
  share_class_label: string
  fiscal_year_end_date: string
  total_distributions_per_share_unscaled: number
  total_distributions_per_share_scale: number
  net_asset_value_end_of_period_unscaled: number
  net_asset_value_end_of_period_scale: number
  source_document_url: string
}

// Falha fechada por documento: se o bloco do fundo/classe não for
// encontrado, ou vier fora de formato, devolve `null` e o chamador pula
// aquele filing inteiro - nunca escreve linha parcial nem "melhor
// palpite" (mesma disciplina de buildProventoDeclarationValueRowsV1).
export function buildEtfDistributionValueRowV1(input: {
  identity: EtfNcsrFundIdentityV1
  accessionNumber: string
  documentUrl: string
  documentHtml: string
}): EtfDistributionValueRowV1 | null {
  const { identity, accessionNumber, documentUrl, documentHtml } = input

  const highlights = extractEtfFinancialHighlightsV1({
    documentText: normalizeSecDocumentTextV1(documentHtml),
    fundName: identity.fundName,
    shareClassLabel: identity.shareClassLabel,
  })
  if (highlights === null) {
    return null
  }

  return {
    ticker: identity.ticker,
    registrant_cik: identity.registrantCik,
    accession_number: accessionNumber,
    fund_name: identity.fundName,
    share_class_label: identity.shareClassLabel,
    fiscal_year_end_date: highlights.fiscalYearEndDate,
    total_distributions_per_share_unscaled:
      highlights.totalDistributionsPerShare.unscaledValue,
    total_distributions_per_share_scale:
      highlights.totalDistributionsPerShare.scale,
    net_asset_value_end_of_period_unscaled:
      highlights.netAssetValueEndOfPeriod.unscaledValue,
    net_asset_value_end_of_period_scale:
      highlights.netAssetValueEndOfPeriod.scale,
    source_document_url: documentUrl,
  }
}
