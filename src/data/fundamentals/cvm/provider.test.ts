import { describe, expect, it } from 'vitest'
import { buildFundamentalFactsV1 } from '../../../domain/fundamentals'
import type { Asset } from '../../../domain/models'
import {
  CVM_BRAZILIAN_STOCK_COMPANIES,
  getCvmBrazilianStockCompany,
} from './companies'
import { normalizeCvmCnpj } from './cnpj'
import { extractCvmBrazilianStockFundamentals } from './provider'
import type {
  CvmArchiveSource,
  CvmStatement,
  CvmStatementDocument,
} from './types'

type FixtureRow = {
  statement: CvmStatement
  companyName: string
  companyCnpj: string
  cvmCode: string
  referenceDate: string
  version: string
  exerciseOrder: string
  accountCode: string
  accountDescription: string
  accountValue: string
}

const HEADERS = [
  'CNPJ_CIA',
  'DT_REFER',
  'VERSAO',
  'DENOM_CIA',
  'CD_CVM',
  'GRUPO_DFP',
  'MOEDA',
  'ESCALA_MOEDA',
  'ORDEM_EXERC',
  'DT_INI_EXERC',
  'DT_FIM_EXERC',
  'CD_CONTA',
  'DS_CONTA',
  'VL_CONTA',
  'ST_CONTA_FIXA',
]

function createRows(): FixtureRow[] {
  return CVM_BRAZILIAN_STOCK_COMPANIES.flatMap((company, index) => {
    const version = company.ticker === 'PSSA3' ? '2' : '1'
    const isBank = company.ticker === 'BBAS3'
    return [
      {
        statement: 'DRE',
        companyName: company.officialName,
        companyCnpj: company.cnpj,
        cvmCode: company.cvmCode,
        referenceDate: '2026-03-31',
        version,
        exerciseOrder: 'ÚLTIMO',
        accountCode: '3.01',
        accountDescription: isBank
          ? 'Receitas de Intermediação Financeira'
          : 'Receita de Venda de Bens e/ou Serviços',
        accountValue: String(90 + index),
      },
      {
        statement: 'DRE',
        companyName: company.officialName,
        companyCnpj: company.cnpj,
        cvmCode: company.cvmCode,
        referenceDate: '2026-03-31',
        version,
        exerciseOrder: 'ÚLTIMO',
        accountCode: '3.11',
        accountDescription: isBank
          ? 'Lucro ou Prejuízo Líquido Consolidado do Período'
          : 'Lucro/Prejuízo Consolidado do Período',
        accountValue: String(10 + index),
      },
      {
        statement: 'BPA',
        companyName: company.officialName,
        companyCnpj: company.cnpj,
        cvmCode: company.cvmCode,
        referenceDate: '2026-03-31',
        version,
        exerciseOrder: 'ÚLTIMO',
        accountCode: '1',
        accountDescription: 'Ativo Total',
        accountValue: String(100 + index),
      },
      {
        statement: 'BPP',
        companyName: company.officialName,
        companyCnpj: company.cnpj,
        cvmCode: company.cvmCode,
        referenceDate: '2026-03-31',
        version,
        exerciseOrder: 'ÚLTIMO',
        accountCode: isBank ? '2.07' : '2.03',
        accountDescription: 'Patrimônio Líquido Consolidado',
        accountValue: String(50 + index),
      },
      {
        statement: 'DFC_MI',
        companyName: company.officialName,
        companyCnpj: company.cnpj,
        cvmCode: company.cvmCode,
        referenceDate: '2026-03-31',
        version,
        exerciseOrder: 'ÚLTIMO',
        accountCode: '6.01',
        accountDescription: isBank
          ? 'Caixa Líquido das Atividades Operacionais'
          : 'Caixa Líquido Atividades Operacionais',
        accountValue: String(20 + index),
      },
    ] satisfies FixtureRow[]
  })
}

function rowToCsv(row: FixtureRow): string {
  return [
    row.companyCnpj,
    row.referenceDate,
    row.version,
    row.companyName,
    row.cvmCode,
    `DF Consolidado - ${row.statement}`,
    'REAL',
    'MIL',
    row.exerciseOrder,
    '2026-01-01',
    row.referenceDate,
    row.accountCode,
    row.accountDescription,
    row.accountValue,
    'S',
  ].join(';')
}

function toDocuments(rows: readonly FixtureRow[]): CvmStatementDocument[] {
  const statements = [...new Set(rows.map((row) => row.statement))]
  return statements.map((statement) => ({
    fileName: `itr_cia_aberta_${statement}_con_2026.csv`,
    statement,
    content: [
      HEADERS.join(';'),
      ...rows.filter((row) => row.statement === statement).map(rowToCsv),
    ].join('\n'),
  }))
}

function extract(
  rows: readonly FixtureRow[] = createRows(),
  source: CvmArchiveSource = 'ITR'
) {
  return extractCvmBrazilianStockFundamentals({
    source,
    archiveId:
      source === 'ITR' ? 'itr_cia_aberta_2026.zip' : 'dfp_cia_aberta_2025.zip',
    documents: toDocuments(rows),
  })
}

function findRecord(
  records: ReturnType<typeof extract>,
  ticker: (typeof CVM_BRAZILIAN_STOCK_COMPANIES)[number]['ticker']
) {
  const record = records.find((candidate) => candidate.ticker === ticker)
  if (!record) {
    throw new Error(`Missing fixture record: ${ticker}`)
  }
  return record
}

function replaceRow(
  rows: readonly FixtureRow[],
  predicate: (row: FixtureRow) => boolean,
  replacement: Partial<FixtureRow>
): FixtureRow[] {
  return rows.map((row) =>
    predicate(row) ? { ...row, ...replacement } : { ...row }
  )
}

describe('extractCvmBrazilianStockFundamentals', () => {
  it('extracts the closed universe with deterministic source identities', () => {
    const first = extract()
    const second = extract()

    expect(first).toEqual(second)
    expect(first.map((record) => record.ticker)).toEqual([
      'BBAS3',
      'ITSA4',
      'TAEE11',
      'WEGE3',
      'PSSA3',
    ])
    expect(first[0]?.sourceDocumentId).toBe(
      'itr:itr_cia_aberta_2026.zip:001023:2026-03-31:v1'
    )
  })

  it('preserves the five validated official identities and rejects outside tickers', () => {
    expect(CVM_BRAZILIAN_STOCK_COMPANIES).toEqual([
      expect.objectContaining({
        ticker: 'BBAS3',
        cvmCode: '001023',
        cnpj: '00.000.000/0001-91',
      }),
      expect.objectContaining({ ticker: 'ITSA4', cvmCode: '007617' }),
      expect.objectContaining({ ticker: 'TAEE11', cvmCode: '020257' }),
      expect.objectContaining({ ticker: 'WEGE3', cvmCode: '005410' }),
      expect.objectContaining({ ticker: 'PSSA3', cvmCode: '016659' }),
    ])
    expect(getCvmBrazilianStockCompany(' bbas3 ').ticker).toBe('BBAS3')
    expect(() => getCvmBrazilianStockCompany('PETR4')).toThrow(
      'Unsupported CVM Brazilian stock ticker'
    )
    expect(extract().map((record) => record.companyIdentity.cnpj)).toEqual(
      CVM_BRAZILIAN_STOCK_COMPANIES.map((company) => company.cnpj)
    )
  })

  it('normalizes punctuated and digits-only CNPJ to the same official identity', () => {
    expect(normalizeCvmCnpj('00.000.000/0001-91')).toBe('00000000000191')
    expect(normalizeCvmCnpj('00000000000191')).toBe('00000000000191')
    expect(findRecord(extract(), 'BBAS3').companyIdentity.cnpj).toBe(
      '00.000.000/0001-91'
    )
  })

  it('rejects divergent, empty and invalid company CNPJ values', () => {
    const divergent = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.accountCode === '3.11',
      { companyCnpj: '11.111.111/0001-11' }
    )
    const empty = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.accountCode === '3.11',
      { companyCnpj: ' ' }
    )
    const invalid = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.accountCode === '3.11',
      { companyCnpj: '00.000.000/0001-9X' }
    )

    expect(() => extract(divergent)).toThrow(
      'Unexpected official company CNPJ for BBAS3'
    )
    expect(() => extract(empty)).toThrow('CVM company CNPJ must not be empty')
    expect(() => extract(invalid)).toThrow('Invalid CVM company CNPJ')
  })

  it('maps DFP and ITR to the approved source and period without de-accumulating ITR', () => {
    const itr = findRecord(extract(), 'BBAS3')
    const dfpRows = replaceRow(createRows(), () => true, {
      referenceDate: '2025-12-31',
    })
    const dfp = findRecord(extract(dfpRows, 'DFP'), 'BBAS3')

    expect(itr).toMatchObject({ source: 'cvm-itr', period: 'quarterly' })
    expect(itr.facts.netIncome?.amountInMinorUnits).toBe(1_000_000)
    expect(dfp).toMatchObject({ source: 'cvm-dfp', period: 'annual' })
  })

  it('keeps totalRevenue null for financial and non-financial companies', () => {
    const records = extract()

    expect(findRecord(records, 'BBAS3').facts.totalRevenue).toBeNull()
    expect(findRecord(records, 'WEGE3').facts.totalRevenue).toBeNull()
  })

  it('never uses DRE 3.01 to populate totalRevenue', () => {
    const rows = replaceRow(
      createRows(),
      (row) => row.statement === 'DRE' && row.accountCode === '3.01',
      { accountValue: '999999999' }
    )

    expect(
      extract(rows).every((record) => record.facts.totalRevenue === null)
    ).toBe(true)
  })

  it('accepts both exact audited net-income descriptions', () => {
    const records = extract()

    expect(
      findRecord(records, 'BBAS3').provenance.netIncome.accountDescription
    ).toBe('Lucro ou Prejuízo Líquido Consolidado do Período')
    expect(
      findRecord(records, 'ITSA4').provenance.netIncome.accountDescription
    ).toBe('Lucro/Prejuízo Consolidado do Período')
  })

  it('rejects a non-allowlisted net-income description even with code 3.11', () => {
    const rows = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.accountCode === '3.11',
      { accountDescription: 'Resultado líquido ajustado' }
    )

    expect(() => extract(rows)).toThrow('No valid netIncome candidate')
  })

  it('rejects multiple valid net-income candidates', () => {
    const rows = createRows()
    const netIncome = rows.find(
      (row) => row.cvmCode === '001023' && row.accountCode === '3.11'
    )!

    expect(() => extract([...rows, { ...netIncome }])).toThrow(
      'Ambiguous netIncome'
    )
  })

  it('requires BPA code 1 and its exact normalized description', () => {
    const wrongCode = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.statement === 'BPA',
      { accountCode: '1.01' }
    )
    const normalizedDescription = replaceRow(
      createRows(),
      (row) => row.statement === 'BPA',
      { accountDescription: '  ativo   total  ' }
    )

    expect(() => extract(wrongCode)).toThrow('No valid totalAssets candidate')
    expect(
      findRecord(extract(normalizedDescription), 'BBAS3').facts.totalAssets
    ).toEqual({ amountInMinorUnits: 10_000_000, currency: 'BRL' })
  })

  it('rejects multiple valid total-assets candidates', () => {
    const rows = createRows()
    const totalAssets = rows.find(
      (row) => row.cvmCode === '001023' && row.statement === 'BPA'
    )!

    expect(() => extract([...rows, { ...totalAssets }])).toThrow(
      'Ambiguous totalAssets'
    )
  })

  it('selects totalEquity by description, preserving the actual account code', () => {
    const records = extract()

    expect(
      findRecord(records, 'BBAS3').provenance.totalEquity.accountCode
    ).toBe('2.07')
    expect(
      findRecord(records, 'ITSA4').provenance.totalEquity.accountCode
    ).toBe('2.03')
  })

  it('does not assume BPP 2.03 is universal for totalEquity', () => {
    const rows = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.statement === 'BPP',
      { accountCode: '9.99' }
    )

    expect(
      findRecord(extract(rows), 'BBAS3').provenance.totalEquity.accountCode
    ).toBe('9.99')
  })

  it('rejects zero or multiple exact totalEquity candidates', () => {
    const missing = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.statement === 'BPP',
      { accountDescription: 'Provisões' }
    )
    const duplicate = [
      ...createRows(),
      {
        ...createRows().find(
          (row) => row.cvmCode === '001023' && row.statement === 'BPP'
        )!,
        accountCode: '8.88',
      },
    ]

    expect(() => extract(missing)).toThrow('No valid totalEquity candidate')
    expect(() => extract(duplicate)).toThrow('Ambiguous totalEquity')
  })

  it('accepts both audited operating cash-flow descriptions', () => {
    const records = extract()

    expect(
      findRecord(records, 'BBAS3').provenance.operatingCashFlow
        .accountDescription
    ).toBe('Caixa Líquido das Atividades Operacionais')
    expect(
      findRecord(records, 'WEGE3').provenance.operatingCashFlow
        .accountDescription
    ).toBe('Caixa Líquido Atividades Operacionais')
  })

  it('rejects unsupported operating cash-flow descriptions', () => {
    const rows = replaceRow(
      createRows(),
      (row) => row.cvmCode === '001023' && row.statement === 'DFC_MI',
      { accountDescription: 'Fluxo operacional' }
    )

    expect(() => extract(rows)).toThrow('No valid operatingCashFlow candidate')
  })

  it('rejects simultaneous valid candidates in indirect and direct cash-flow statements', () => {
    const rows = createRows()
    const indirect = rows.find(
      (row) => row.cvmCode === '001023' && row.statement === 'DFC_MI'
    )!

    expect(() =>
      extract([...rows, { ...indirect, statement: 'DFC_MD' }])
    ).toThrow('Ambiguous operatingCashFlow')
  })

  it('selects numeric version 10 over 9 and 1', () => {
    const rows = createRows()
    const bankRows = rows.filter((row) => row.cvmCode === '001023')
    const version9 = bankRows.map((row) => ({ ...row, version: '9' }))
    const version10 = bankRows.map((row) => ({
      ...row,
      version: '10',
      accountValue: row.accountCode === '3.11' ? '77' : row.accountValue,
    }))
    const bank = findRecord(
      extract([...rows, ...version9, ...version10]),
      'BBAS3'
    )

    expect(bank.filingVersion).toBe(10)
    expect(bank.facts.netIncome?.amountInMinorUnits).toBe(7_700_000)
  })

  it('selects the latest filing date before comparing numeric versions', () => {
    const rows = createRows()
    const oldBankRows = rows
      .filter((row) => row.cvmCode === '001023')
      .map((row) => ({
        ...row,
        referenceDate: '2025-12-31',
        version: '99',
        accountValue: '999',
      }))

    const bank = findRecord(extract([...rows, ...oldBankRows]), 'BBAS3')

    expect(bank.referenceDate).toBe('2026-03-31')
    expect(bank.filingVersion).toBe(1)
    expect(bank.facts.netIncome?.amountInMinorUnits).toBe(1_000_000)
  })

  it('ignores the previous exercise', () => {
    const rows = createRows()
    const previous = rows
      .filter((row) => row.cvmCode === '001023')
      .map((row) => ({
        ...row,
        exerciseOrder: 'PENÚLTIMO',
        accountValue: '999',
      }))

    expect(
      findRecord(extract([...rows, ...previous]), 'BBAS3').facts.netIncome
        ?.amountInMinorUnits
    ).toBe(1_000_000)
  })

  it('produces snapshots accepted by Fundamental Facts V1 with partial coverage', () => {
    const records = extract()
    const assets: Asset[] = records.map((record) => ({
      id: `asset-${record.ticker.toLowerCase()}`,
      ticker: record.ticker,
      name: record.ticker,
      category: 'brazilian-stock',
      market: 'BR',
      status: 'active',
    }))
    const snapshots = records.map((record, index) => ({
      assetId: assets[index]!.id,
      kind: record.kind,
      referenceDate: record.referenceDate,
      period: record.period,
      source: record.source,
      sourceDocumentId: record.sourceDocumentId,
      facts: record.facts,
    }))

    const output = buildFundamentalFactsV1({
      generatedAt: '2026-07-15T12:00:00.000Z',
      assets,
      snapshots,
    })

    expect(output.assets).toHaveLength(5)
    expect(
      output.assets.every((asset) => {
        const snapshot = asset.snapshots[0]
        return (
          snapshot?.kind === 'brazilian-stock' &&
          snapshot.facts.totalRevenue === null
        )
      })
    ).toBe(true)
  })
})
