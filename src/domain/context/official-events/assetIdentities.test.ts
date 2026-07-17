import { describe, expect, it } from 'vitest'
import { CVM_BRAZILIAN_STOCK_COMPANIES } from '../../../data/fundamentals/cvm/companies'
import { CVM_REAL_ESTATE_FUNDS } from '../../../data/fundamentals/cvm/fii/funds'
import { SEC_INTERNATIONAL_ETFS } from '../../../data/fundamentals/sec/nport/etfs'
import {
  assertOfficialEventAssetIdentity,
  buildOfficialEventAssetIdentityKey,
  getOfficialEventAssetIdentitiesV1,
  getOfficialEventAssetIdentityByTicker,
} from './assetIdentities'

const stripCnpjFormatting = (cnpj: string): string => cnpj.replace(/\D/g, '')

describe('official event asset identities', () => {
  it('contains exactly the twelve approved assets in stable order', () => {
    expect(
      getOfficialEventAssetIdentitiesV1().map(({ ticker }) => ticker)
    ).toEqual([
      'BBAS3',
      'ITSA4',
      'TAEE11',
      'WEGE3',
      'PSSA3',
      'KNRI11',
      'VISC11',
      'XPLG11',
      'HGRU11',
      'VOO',
      'VNQ',
      'VEA',
    ])
  })

  it('has unique tickers and strong identity keys', () => {
    const identities = getOfficialEventAssetIdentitiesV1()
    expect(new Set(identities.map(({ ticker }) => ticker))).toHaveLength(12)
    expect(
      new Set(identities.map(buildOfficialEventAssetIdentityKey))
    ).toHaveLength(12)
    expect(
      new Set(
        identities.map(({ regulatoryIdentityKey }) => regulatoryIdentityKey)
      )
    ).toHaveLength(12)
  })

  it('builds identity keys from category, market and class-specific strong identifiers', () => {
    const stock = getOfficialEventAssetIdentityByTicker('BBAS3')
    const fund = getOfficialEventAssetIdentityByTicker('KNRI11')
    const etf = getOfficialEventAssetIdentityByTicker('VOO')
    expect(buildOfficialEventAssetIdentityKey(stock)).toContain(
      'brazilian-stock'
    )
    expect(buildOfficialEventAssetIdentityKey(stock)).toContain(
      '00000000000191|001023'
    )
    expect(buildOfficialEventAssetIdentityKey(fund)).toContain(
      'real-estate-fund'
    )
    expect(buildOfficialEventAssetIdentityKey(fund)).toContain(
      '12005956000165|BRKNRICTF007'
    )
    expect(buildOfficialEventAssetIdentityKey(etf)).toContain(
      'international-etf'
    )
    expect(buildOfficialEventAssetIdentityKey(etf)).toContain(
      '0000036405|S000002839|C000092055'
    )
  })

  it('does not depend on official name or object property order', () => {
    const identity = getOfficialEventAssetIdentityByTicker('BBAS3')
    if (identity.category !== 'brazilian-stock')
      throw new Error('Unexpected category')
    const reordered: typeof identity = {
      regulatoryIdentityKey: identity.regulatoryIdentityKey,
      cvmCode: identity.cvmCode,
      cnpj: identity.cnpj,
      officialName: 'NAME|WITH:SEPARATORS',
      ticker: identity.ticker,
      market: identity.market,
      category: identity.category,
    }
    expect(buildOfficialEventAssetIdentityKey(reordered)).toBe(
      buildOfficialEventAssetIdentityKey(identity)
    )
  })

  it('reuses the audited Brazilian stock mappings', () => {
    for (const company of CVM_BRAZILIAN_STOCK_COMPANIES) {
      const identity = getOfficialEventAssetIdentityByTicker(company.ticker)
      expect(identity.officialName).toBe(company.officialName)
      if (identity.category !== 'brazilian-stock')
        throw new Error('Unexpected category')
      expect(identity.cnpj).toBe(stripCnpjFormatting(company.cnpj))
      expect(identity.cvmCode).toBe(company.cvmCode)
    }
  })

  it('reuses the audited FII mappings', () => {
    for (const fund of CVM_REAL_ESTATE_FUNDS) {
      const identity = getOfficialEventAssetIdentityByTicker(fund.ticker)
      expect(identity.officialName).toBe(fund.officialName)
      if (identity.category !== 'real-estate-fund')
        throw new Error('Unexpected category')
      expect(identity.cnpj).toBe(stripCnpjFormatting(fund.cnpj))
      expect(identity.isin).toBe(fund.isin)
    }
  })

  it('reuses the audited SEC ETF mappings', () => {
    for (const fund of SEC_INTERNATIONAL_ETFS) {
      const identity = getOfficialEventAssetIdentityByTicker(fund.ticker)
      expect(identity.officialName).toBe(fund.registrantName)
      if (identity.category !== 'international-etf')
        throw new Error('Unexpected category')
      expect(identity.registrantCik).toBe(fund.registrantCik)
      expect(identity.seriesId).toBe(fund.seriesId)
      expect(identity.classContractId).toBe(fund.classId)
    }
  })

  it('gets a defensive copy by ticker', () => {
    const first = getOfficialEventAssetIdentityByTicker('BBAS3')
    first.officialName = 'MUTATED'
    expect(getOfficialEventAssetIdentityByTicker('BBAS3').officialName).toBe(
      'BCO BRASIL S.A.'
    )
  })

  it('returns defensive copies for the full registry', () => {
    const identities = getOfficialEventAssetIdentitiesV1()
    identities[0].officialName = 'MUTATED'
    identities.reverse()
    expect(getOfficialEventAssetIdentitiesV1()[0].ticker).toBe('BBAS3')
  })

  it.each(['bbas3', ' BBAS3', 'BBAS3 '])(
    'rejects noncanonical ticker %s',
    (ticker) => {
      expect(() => getOfficialEventAssetIdentityByTicker(ticker)).toThrow(
        /uppercase|unpadded/
      )
    }
  )

  it('rejects an unknown ticker', () => {
    expect(() => getOfficialEventAssetIdentityByTicker('ABCD3')).toThrow(
      /Unsupported/
    )
  })

  it('rejects a CNPJ that does not contain exactly fourteen digits', () => {
    const identity = getOfficialEventAssetIdentityByTicker('BBAS3')
    if (identity.category !== 'brazilian-stock')
      throw new Error('Unexpected category')
    identity.cnpj = '0000000000019'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(
      /14 digits/
    )
  })

  it('rejects a CIK that does not preserve ten digits', () => {
    const identity = getOfficialEventAssetIdentityByTicker('VOO')
    if (identity.category !== 'international-etf')
      throw new Error('Unexpected category')
    identity.registrantCik = '36405'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(
      /10 digits/
    )
  })

  it('rejects an invalid series identifier', () => {
    const identity = getOfficialEventAssetIdentityByTicker('VOO')
    if (identity.category !== 'international-etf')
      throw new Error('Unexpected category')
    identity.seriesId = 'SERIES'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(/seriesId/)
  })

  it('rejects an invalid class identifier', () => {
    const identity = getOfficialEventAssetIdentityByTicker('VOO')
    if (identity.category !== 'international-etf')
      throw new Error('Unexpected category')
    identity.classContractId = 'CLASS'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(
      /classContractId/
    )
  })

  it('rejects an invalid ISIN without modifying its content', () => {
    const identity = getOfficialEventAssetIdentityByTicker('KNRI11')
    if (identity.category !== 'real-estate-fund')
      throw new Error('Unexpected category')
    identity.isin = 'brknrictf007'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(/isin/)
  })

  it('rejects a divergent official identity', () => {
    const identity = getOfficialEventAssetIdentityByTicker('BBAS3')
    identity.officialName = 'OTHER COMPANY'
    expect(() => assertOfficialEventAssetIdentity(identity)).toThrow(/diverges/)
  })
})
