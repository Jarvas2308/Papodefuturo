import { describe, expect, it, vi } from 'vitest'
import {
  createVanguardEtfValuationProvider,
  parseVanguardPremiumDiscount,
} from './vanguardEtfValuationProvider.ts'

// Amostra real, baixada e conferida em 05/08/2026 (VOO, fund number 0968,
// endpoint /vmf/api/0968/premium-discount/CURR, sem autenticação).
const REAL_SAMPLE = JSON.stringify({
  periodQualifier: 'CURR',
  pdDetails: [
    {
      nav: 685.25,
      marketPrice: 685.46,
      premiumDiscountPercentage: 0.03,
      premiumDiscountAmount: 0.21,
      effectiveDate: '2026-07-01',
    },
    {
      nav: 693.88,
      marketPrice: 693.86,
      premiumDiscountPercentage: 0,
      premiumDiscountAmount: -0.02,
      effectiveDate: '2026-07-10',
    },
    {
      nav: 708.9,
      marketPrice: 708.98,
      premiumDiscountPercentage: 0.01,
      premiumDiscountAmount: 0.08,
      effectiveDate: '2026-08-04',
    },
    {
      nav: 707.72,
      marketPrice: 707.6,
      premiumDiscountPercentage: -0.02,
      premiumDiscountAmount: -0.12,
      effectiveDate: '2026-08-05',
    },
  ],
})

describe('parseVanguardPremiumDiscount', () => {
  it('picks the item with the most recent effectiveDate, real sample', () => {
    const quote = parseVanguardPremiumDiscount(REAL_SAMPLE, 'VOO')

    expect(quote).toEqual({
      ticker: 'VOO',
      effectiveDate: '2026-08-05',
      premiumDiscountBasisPoints: -2,
      source: 'vanguard-site',
    })
  })

  it('converts a positive percentage to positive basis points', () => {
    const quote = parseVanguardPremiumDiscount(
      JSON.stringify({
        pdDetails: [
          {
            nav: 1,
            marketPrice: 1,
            premiumDiscountPercentage: 0.06,
            premiumDiscountAmount: 0.41,
            effectiveDate: '2026-07-31',
          },
        ],
      }),
      'VOO'
    )

    expect(quote.premiumDiscountBasisPoints).toBe(6)
  })

  it('converts a zero percentage to zero basis points', () => {
    const quote = parseVanguardPremiumDiscount(
      JSON.stringify({
        pdDetails: [
          {
            nav: 1,
            marketPrice: 1,
            premiumDiscountPercentage: 0,
            premiumDiscountAmount: -0.03,
            effectiveDate: '2026-08-03',
          },
        ],
      }),
      'VNQ'
    )

    expect(quote.premiumDiscountBasisPoints).toBe(0)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseVanguardPremiumDiscount('not json', 'VOO')).toThrow(
      /não é um JSON válido/
    )
  })

  it('throws when pdDetails is missing', () => {
    expect(() =>
      parseVanguardPremiumDiscount(JSON.stringify({}), 'VOO')
    ).toThrow(/sem "pdDetails"/)
  })

  it('throws when pdDetails is empty', () => {
    expect(() =>
      parseVanguardPremiumDiscount(JSON.stringify({ pdDetails: [] }), 'VOO')
    ).toThrow(/sem "pdDetails"/)
  })

  it('throws when no item has the expected shape', () => {
    expect(() =>
      parseVanguardPremiumDiscount(
        JSON.stringify({ pdDetails: [{ foo: 'bar' }] }),
        'VOO'
      )
    ).toThrow(/formato esperado/)
  })
})

describe('createVanguardEtfValuationProvider', () => {
  it('fetches the fund-specific URL with an identifiable User-Agent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => REAL_SAMPLE,
    })

    const provider = createVanguardEtfValuationProvider(fetchMock)
    const quote = await provider.getPremiumDiscount('VOO')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://investor.vanguard.com/vmf/api/0968/premium-discount/CURR',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('PapoDeFuturo'),
        }),
      })
    )
    expect(quote.ticker).toBe('VOO')
    expect(quote.premiumDiscountBasisPoints).toBe(-2)
  })

  it('uses the correct fund number for VNQ and VEA', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => REAL_SAMPLE,
    })
    const provider = createVanguardEtfValuationProvider(fetchMock)

    await provider.getPremiumDiscount('VNQ')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://investor.vanguard.com/vmf/api/0986/premium-discount/CURR',
      expect.anything()
    )

    await provider.getPremiumDiscount('VEA')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://investor.vanguard.com/vmf/api/0936/premium-discount/CURR',
      expect.anything()
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '',
    })
    const provider = createVanguardEtfValuationProvider(fetchMock)

    await expect(provider.getPremiumDiscount('VOO')).rejects.toThrow(
      /Vanguard respondeu 503/
    )
  })
})
