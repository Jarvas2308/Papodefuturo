import { normalizeCvmCnpj } from '../cnpj'
import { CVM_REAL_ESTATE_FUNDS } from './funds'
import { extractCvmFiiMonthlyDividendYieldRowsV1 } from './extractCvmFiiMonthlyDividendYieldV1'
import type { CvmFiiMonthlyDocument } from './types'

export type FiiMonthlyDividendYieldRowV1 = {
  cnpj: string
  ticker: string
  reference_date: string
  version: number
  dividend_yield_unscaled: number
  dividend_yield_scale: number
  source_archive: string
}

const TRACKED_FUNDS_BY_CNPJ = new Map(
  CVM_REAL_ESTATE_FUNDS.map((fund) => [normalizeCvmCnpj(fund.cnpj), fund])
)

function parsePositiveVersion(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }
  const version = Number(value)
  return Number.isSafeInteger(version) && version > 0 ? version : null
}

/**
 * Liga extractCvmFiiMonthlyDividendYieldRowsV1 aos 4 fundos rastreados
 * (CVM_REAL_ESTATE_FUNDS) e monta as linhas prontas pra
 * fii_monthly_dividend_yield. Documento com CNPJ fora do universo
 * rastreado é ignorado aqui - filtro por ativo é responsabilidade deste
 * adapter, não do extrator genérico.
 */
export function buildFiiMonthlyDividendYieldRowsV1(input: {
  document: CvmFiiMonthlyDocument
  sourceArchive: string
}): FiiMonthlyDividendYieldRowV1[] {
  const rawRows = extractCvmFiiMonthlyDividendYieldRowsV1(input.document)

  const rows: FiiMonthlyDividendYieldRowV1[] = []
  for (const rawRow of rawRows) {
    let normalizedCnpj: string
    try {
      normalizedCnpj = normalizeCvmCnpj(rawRow.cnpj)
    } catch {
      continue
    }

    const fund = TRACKED_FUNDS_BY_CNPJ.get(normalizedCnpj)
    if (!fund) {
      continue
    }

    const version = parsePositiveVersion(rawRow.version)
    if (version === null) {
      continue
    }

    rows.push({
      cnpj: rawRow.cnpj,
      ticker: fund.ticker,
      reference_date: rawRow.referenceDate,
      version,
      dividend_yield_unscaled: rawRow.dividendYieldDecimal.unscaledValue,
      dividend_yield_scale: rawRow.dividendYieldDecimal.scale,
      source_archive: input.sourceArchive,
    })
  }

  return rows
}
