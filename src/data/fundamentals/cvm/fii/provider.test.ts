import { describe, expect, it } from 'vitest'
import { buildFundamentalFactsV1 } from '../../../../domain/fundamentals'
import type { Asset } from '../../../../domain/models'
import { normalizeCvmCnpj } from '../cnpj'
import { parseCvmFiiComplementCsv, parseCvmFiiGeneralCsv } from './csv'
import { CVM_REAL_ESTATE_FUNDS, getCvmRealEstateFund } from './funds'
import {
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
  parseNullableCvmFiiNonNegativeInteger,
} from './numbers'
import { extractCvmRealEstateFundFundamentals } from './provider'
import type { CvmFiiMonthlyDocument, CvmRealEstateFund } from './types'

type GeneralFixture = {
  cnpj: string
  referenceDate: string
  version: string
  deliveryDate: string
  officialName: string
  isin: string
  issuedShares: string
}

type ComplementFixture = {
  cnpj: string
  referenceDate: string
  version: string
  shareholderInformationDate: string
  shareholderCount: string
  netAssetValue: string
  issuedShares: string
}

type FixtureData = {
  general: GeneralFixture[]
  complement: ComplementFixture[]
}

const GENERAL_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Data_Entrega',
  'Nome_Fundo_Classe',
  'Codigo_ISIN',
  'Quantidade_Cotas_Emitidas',
]

const COMPLEMENT_HEADERS = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Data_Informacao_Numero_Cotistas',
  'Total_Numero_Cotistas',
  'Patrimonio_Liquido',
  'Cotas_Emitidas',
]

const OFFICIAL_ISSUED_SHARES: Record<CvmRealEstateFund['ticker'], string> = {
  KNRI11: '28204047',
  VISC11: '28828640.0000073',
  XPLG11: '51390097.8938388',
  HGRU11: '23238024',
}

function createGeneralFixture(fund: CvmRealEstateFund): GeneralFixture {
  return {
    cnpj: fund.cnpj,
    referenceDate: '2026-05-01',
    version: '1',
    deliveryDate: '2026-06-15',
    officialName: fund.officialName,
    isin: fund.isin,
    issuedShares: OFFICIAL_ISSUED_SHARES[fund.ticker],
  }
}

function createComplementFixture(
  fund: CvmRealEstateFund,
  index: number
): ComplementFixture {
  return {
    cnpj: fund.cnpj,
    referenceDate: '2026-05-01',
    version: '1',
    shareholderInformationDate: '2026-05-31',
    shareholderCount: String(100_000 + index),
    netAssetValue: `${1_000_000_000 + index}.25`,
    issuedShares: OFFICIAL_ISSUED_SHARES[fund.ticker],
  }
}

function createFixtureData(): FixtureData {
  return {
    general: CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture),
    complement: CVM_REAL_ESTATE_FUNDS.map(createComplementFixture),
  }
}

function generalToCsv(row: GeneralFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.deliveryDate,
    row.officialName,
    row.isin,
    row.issuedShares,
  ].join(';')
}

function complementToCsv(row: ComplementFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.shareholderInformationDate,
    row.shareholderCount,
    row.netAssetValue,
    row.issuedShares,
  ].join(';')
}

function toDocuments(data: FixtureData): CvmFiiMonthlyDocument[] {
  return [
    {
      fileName: 'inf_mensal_fii_geral_2026.csv',
      type: 'general',
      content: [
        GENERAL_HEADERS.join(';'),
        ...data.general.map(generalToCsv),
      ].join('\n'),
    },
    {
      fileName: 'inf_mensal_fii_complemento_2026.csv',
      type: 'complement',
      content: [
        COMPLEMENT_HEADERS.join(';'),
        ...data.complement.map(complementToCsv),
      ].join('\n'),
    },
  ]
}

function extract(data: FixtureData = createFixtureData()) {
  return extractCvmRealEstateFundFundamentals({
    archiveId: 'inf_mensal_fii_2026.zip',
    documents: toDocuments(data),
  })
}

function replaceGeneral(
  data: FixtureData,
  ticker: string,
  replacement: Partial<GeneralFixture>
): FixtureData {
  const fund = getCvmRealEstateFund(ticker)
  return {
    general: data.general.map((row) =>
      normalizeCvmCnpj(row.cnpj) === normalizeCvmCnpj(fund.cnpj)
        ? { ...row, ...replacement }
        : { ...row }
    ),
    complement: data.complement.map((row) => ({ ...row })),
  }
}

function replaceComplement(
  data: FixtureData,
  ticker: string,
  replacement: Partial<ComplementFixture>
): FixtureData {
  const fund = getCvmRealEstateFund(ticker)
  return {
    general: data.general.map((row) => ({ ...row })),
    complement: data.complement.map((row) =>
      normalizeCvmCnpj(row.cnpj) === normalizeCvmCnpj(fund.cnpj)
        ? { ...row, ...replacement }
        : { ...row }
    ),
  }
}

describe('CVM FII official CSV parser', () => {
  it('reads the official general and complement columns', () => {
    const documents = toDocuments(createFixtureData())
    const general = parseCvmFiiGeneralCsv(documents[0]!)
    const complement = parseCvmFiiComplementCsv(documents[1]!)

    expect(general[0]).toMatchObject({
      cnpj: '12.005.956/0001-65',
      officialName: 'KINEA RENDA IMOBILIARIA FII RESPONSABILIDADE LIMITADA',
      referenceDate: '2026-05-01',
      version: '1',
      isin: 'BRKNRICTF007',
    })
    expect(complement[0]).toMatchObject({
      netAssetValue: '1000000000.25',
      issuedShares: '28204047',
      shareholderCount: '100000',
    })
  })

  it('rejects a missing official header', () => {
    const document = toDocuments(createFixtureData())[1]!
    document.content = document.content.replace('Patrimonio_Liquido;', '')

    expect(() => parseCvmFiiComplementCsv(document)).toThrow(
      'Missing CVM FII CSV header Patrimonio_Liquido'
    )
  })
})

describe('CVM FII numeric parsing', () => {
  it('parses BRL decimals exactly with official dot and comma separators', () => {
    expect(parseNullableCvmFiiMoney('1234.56', 'net asset value')).toEqual({
      amountInMinorUnits: 123_456,
      currency: 'BRL',
    })
    expect(parseNullableCvmFiiMoney('1234,5', 'net asset value')).toEqual({
      amountInMinorUnits: 123_450,
      currency: 'BRL',
    })
  })

  it('rejects monetary precision that cannot be represented in cents', () => {
    expect(() => parseNullableCvmFiiMoney('1.001', 'net asset value')).toThrow(
      'cannot be represented exactly'
    )
  })

  it('accepts exact integers and zero-only decimal scales for counts', () => {
    expect(parseNullableCvmFiiNonNegativeInteger('123', 'issued shares')).toBe(
      123
    )
    expect(
      parseNullableCvmFiiNonNegativeInteger('123.000', 'issued shares')
    ).toBe(123)
  })

  it('parses the official VISC11 and XPLG11 fractional shares exactly', () => {
    expect(
      parseNullableCvmFiiExactDecimalQuantity(
        '28828640.0000073',
        'issued shares'
      )
    ).toEqual({ unscaledValue: 288_286_400_000_073, scale: 7 })
    expect(
      parseNullableCvmFiiExactDecimalQuantity(
        '51390097.8938388',
        'issued shares'
      )
    ).toEqual({ unscaledValue: 513_900_978_938_388, scale: 7 })
  })

  it('normalizes integers, zero and trailing decimal zeros canonically', () => {
    expect(
      parseNullableCvmFiiExactDecimalQuantity('123', 'issued shares')
    ).toEqual({ unscaledValue: 123, scale: 0 })
    expect(
      parseNullableCvmFiiExactDecimalQuantity('0.000', 'issued shares')
    ).toEqual({ unscaledValue: 0, scale: 0 })
    expect(
      parseNullableCvmFiiExactDecimalQuantity('00123,4500', 'issued shares')
    ).toEqual({ unscaledValue: 12_345, scale: 2 })
  })

  it('keeps official absence null instead of converting it to zero', () => {
    expect(parseNullableCvmFiiMoney(' ', 'net asset value')).toBeNull()
    expect(
      parseNullableCvmFiiNonNegativeInteger('', 'shareholder count')
    ).toBeNull()
    expect(
      parseNullableCvmFiiExactDecimalQuantity('', 'issued shares')
    ).toBeNull()
  })

  it('rejects invalid and unsafe integer values', () => {
    expect(() =>
      parseNullableCvmFiiNonNegativeInteger('-1', 'shareholder count')
    ).toThrow('Invalid CVM FII shareholder count')
    expect(() =>
      parseNullableCvmFiiNonNegativeInteger(
        '9007199254740992',
        'shareholder count'
      )
    ).toThrow('outside the safe integer range')
    expect(() =>
      parseNullableCvmFiiMoney('9007199254740992.00', 'net asset value')
    ).toThrow('outside the safe integer range')
  })

  it('rejects invalid exact decimal quantities without float coercion', () => {
    for (const value of ['-1', '1x', '1.2.3']) {
      expect(() =>
        parseNullableCvmFiiExactDecimalQuantity(value, 'issued shares')
      ).toThrow('Invalid CVM FII issued shares')
    }
    expect(() =>
      parseNullableCvmFiiExactDecimalQuantity(
        '9007199254740992',
        'issued shares'
      )
    ).toThrow('outside the safe integer range')
    expect(() =>
      parseNullableCvmFiiExactDecimalQuantity(
        `0.${'0'.repeat(32_767)}1`,
        'issued shares'
      )
    ).toThrow('invalid scale')
  })
})

describe('extractCvmRealEstateFundFundamentals', () => {
  it('extracts the four-fund closed universe in deterministic order', () => {
    const first = extract()
    const reversed = createFixtureData()
    reversed.general.reverse()
    reversed.complement.reverse()
    const second = extract(reversed)

    expect(first).toEqual(second)
    expect(first.map((record) => record.ticker)).toEqual([
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
    ])
    expect(
      first.every(
        (record) =>
          record.kind === 'real-estate-fund' &&
          record.period === 'monthly' &&
          record.source === 'cvm-fii-inf-mensal'
      )
    ).toBe(true)
  })

  it('preserves the four official CNPJ, name and ISIN identities', () => {
    expect(extract().map((record) => record.fundIdentity)).toEqual(
      CVM_REAL_ESTATE_FUNDS.map((fund) => ({
        officialName: fund.officialName,
        cnpj: fund.cnpj,
        isin: fund.isin,
      }))
    )
    expect(getCvmRealEstateFund(' knri11 ').ticker).toBe('KNRI11')
    expect(() => getCvmRealEstateFund('MXRF11')).toThrow(
      'Unsupported CVM real estate fund ticker'
    )
  })

  it('selects the latest competence before the highest numeric version', () => {
    const data = createFixtureData()
    const knri = getCvmRealEstateFund('KNRI11')
    data.general.push({
      ...createGeneralFixture(knri),
      referenceDate: '2026-04-01',
      version: '99',
    })
    data.complement.push({
      ...createComplementFixture(knri, 0),
      referenceDate: '2026-04-01',
      version: '99',
      netAssetValue: '9999999999.99',
    })
    data.general.push({ ...createGeneralFixture(knri), version: '10' })
    data.complement.push({
      ...createComplementFixture(knri, 0),
      version: '10',
      netAssetValue: '2000000000.50',
    })

    const record = extract(data)[0]!
    expect(record.referenceDate).toBe('2026-05-01')
    expect(record.filingVersion).toBe(10)
    expect(record.facts.netAssetValue?.amountInMinorUnits).toBe(200_000_000_050)
  })

  it('validates the official name on the selected filing, not historical rows', () => {
    const data = createFixtureData()
    const knri = getCvmRealEstateFund('KNRI11')
    data.general.push({
      ...createGeneralFixture(knri),
      referenceDate: '2026-04-01',
      officialName: 'DENOMINAÇÃO HISTÓRICA DO FUNDO',
    })
    data.complement.push({
      ...createComplementFixture(knri, 0),
      referenceDate: '2026-04-01',
    })

    expect(extract(data)[0]?.referenceDate).toBe('2026-05-01')
  })

  it('builds a deterministic sourceDocumentId from official filing identity', () => {
    expect(extract()[0]?.sourceDocumentId).toBe(
      'cvm-fii-inf-mensal:inf_mensal_fii_2026.zip:12005956000165:2026-05-01:v1'
    )
  })

  it('preserves official files, columns and raw values in provenance', () => {
    const record = extract()[0]!

    expect(record.provenance).toMatchObject({
      dataset: 'FII: Documentos: Informe Mensal Estruturado',
      archiveId: 'inf_mensal_fii_2026.zip',
      identity: {
        cnpj: { column: 'CNPJ_Fundo_Classe' },
        officialName: { column: 'Nome_Fundo_Classe' },
        isin: { column: 'Codigo_ISIN' },
      },
      referenceDate: {
        column: 'Data_Referencia',
        rawValue: '2026-05-01',
      },
      version: { column: 'Versao', rawValue: '1' },
      netAssetValue: {
        column: 'Patrimonio_Liquido',
        rawValue: '1000000000.25',
      },
      issuedShares: {
        column: 'Cotas_Emitidas',
        rawValue: '28204047',
        normalizedValue: '28204047',
        unscaledValue: 28_204_047,
        scale: 0,
        referenceDate: '2026-05-01',
        filingVersion: 1,
        archiveId: 'inf_mensal_fii_2026.zip',
      },
      shareholderCount: {
        column: 'Total_Numero_Cotistas',
        rawValue: '100000',
      },
    })
  })

  it('preserves official fractional shares in facts and provenance deterministically', () => {
    const first = extract()
    const second = extract()
    const visc = first.find((record) => record.ticker === 'VISC11')!
    const xplg = first.find((record) => record.ticker === 'XPLG11')!

    expect(first).toEqual(second)
    expect(visc.facts.issuedShares).toEqual({
      unscaledValue: 288_286_400_000_073,
      scale: 7,
    })
    expect(visc.provenance.issuedShares).toMatchObject({
      rawValue: '28828640.0000073',
      normalizedValue: '28828640.0000073',
      unscaledValue: 288_286_400_000_073,
      scale: 7,
      referenceDate: '2026-05-01',
      filingVersion: 1,
      archiveId: 'inf_mensal_fii_2026.zip',
    })
    expect(xplg.facts.issuedShares).toEqual({
      unscaledValue: 513_900_978_938_388,
      scale: 7,
    })
    expect(xplg.provenance.issuedShares).toMatchObject({
      rawValue: '51390097.8938388',
      normalizedValue: '51390097.8938388',
      unscaledValue: 513_900_978_938_388,
      scale: 7,
    })
  })

  it('keeps all three absent official values null', () => {
    const data = replaceComplement(createFixtureData(), 'KNRI11', {
      netAssetValue: '',
      issuedShares: '',
      shareholderCount: '',
    })

    expect(extract(data)[0]?.facts).toEqual({
      netAssetValue: null,
      issuedShares: null,
      shareholderCount: null,
    })
  })

  it('rejects divergent and invalid official CNPJ identity', () => {
    const divergent = replaceGeneral(createFixtureData(), 'KNRI11', {
      cnpj: '11.111.111/0001-11',
    })
    const invalid = replaceGeneral(createFixtureData(), 'KNRI11', {
      cnpj: '12.005.956/0001-6X',
    })

    expect(() => extract(divergent)).toThrow(
      'Unexpected official CVM FII CNPJ for KNRI11'
    )
    expect(() => extract(invalid)).toThrow('Invalid CVM company CNPJ')
  })

  it('rejects divergent official name and ISIN', () => {
    expect(() =>
      extract(
        replaceGeneral(createFixtureData(), 'KNRI11', {
          officialName: 'OUTRO FUNDO',
        })
      )
    ).toThrow('Unexpected official CVM FII name for KNRI11')
    expect(() =>
      extract(
        replaceGeneral(createFixtureData(), 'KNRI11', { isin: 'BRINVALID000' })
      )
    ).toThrow('Unexpected official CVM FII ISIN for KNRI11')
  })

  it('rejects a missing closed-universe fund', () => {
    const data = createFixtureData()
    data.general = data.general.filter(
      (row) => normalizeCvmCnpj(row.cnpj) !== '12005956000165'
    )
    data.complement = data.complement.filter(
      (row) => normalizeCvmCnpj(row.cnpj) !== '12005956000165'
    )

    expect(() => extract(data)).toThrow(
      'Missing official CVM FII general row for KNRI11'
    )
  })

  it('rejects an invalid reference date', () => {
    const data = replaceGeneral(createFixtureData(), 'KNRI11', {
      referenceDate: '2026-02-30',
    })

    expect(() => extract(data)).toThrow(
      'Invalid CVM FII reference date for KNRI11'
    )
  })

  it.each(['', '0', '1.5'])(
    'rejects missing or non-positive filing version %j',
    (version) => {
      const data = replaceGeneral(createFixtureData(), 'KNRI11', { version })

      expect(() => extract(data)).toThrow('Invalid CVM FII version for KNRI11')
    }
  )

  it('rejects ambiguous duplicate rows for the same competence and version', () => {
    const data = createFixtureData()
    data.complement.push({ ...data.complement[0]! })

    expect(() => extract(data)).toThrow(
      'Ambiguous CVM FII complement row for KNRI11'
    )
  })

  it('rejects inconsistent latest identities between official files', () => {
    const data = replaceComplement(createFixtureData(), 'KNRI11', {
      version: '2',
    })

    expect(() => extract(data)).toThrow(
      'Inconsistent latest CVM FII filing identity for KNRI11'
    )
  })

  it('produces snapshots accepted by Fundamental Facts V1', () => {
    const records = extract()
    const assets: Asset[] = records.map((record) => ({
      id: `asset-${record.ticker.toLowerCase()}`,
      ticker: record.ticker,
      name: record.ticker,
      category: 'real-estate-fund',
      market: 'BR',
      status: 'active',
    }))
    const facts = buildFundamentalFactsV1({
      generatedAt: '2026-07-16T12:00:00.000Z',
      assets,
      snapshots: records.map((record, index) => ({
        assetId: assets[index]!.id,
        kind: record.kind,
        referenceDate: record.referenceDate,
        period: record.period,
        source: record.source,
        sourceDocumentId: record.sourceDocumentId,
        facts: record.facts,
      })),
    })

    expect(facts.dataCoverage.realEstateFundSnapshotCount).toBe(4)
    expect(facts.assets.every((asset) => asset.snapshots.length === 1)).toBe(
      true
    )
  })
})
