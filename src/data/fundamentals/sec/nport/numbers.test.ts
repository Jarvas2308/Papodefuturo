import { describe, expect, it } from 'vitest'
import { parseNullableSecUsdMoney } from './numbers'

describe('parseNullableSecUsdMoney', () => {
  it('converts official decimal text to exact USD minor units', () => {
    expect(parseNullableSecUsdMoney('282420399171.71', 'total assets')).toEqual(
      {
        amountInMinorUnits: 28_242_039_917_171,
        currency: 'USD',
      }
    )
    expect(parseNullableSecUsdMoney('-10.50', 'net assets')).toEqual({
      amountInMinorUnits: -1_050,
      currency: 'USD',
    })
    expect(parseNullableSecUsdMoney('12.34000000', 'total assets')).toEqual({
      amountInMinorUnits: 1_234,
      currency: 'USD',
    })
  })

  it('preserves official absence as null', () => {
    expect(parseNullableSecUsdMoney(null, 'total assets')).toBeNull()
    expect(parseNullableSecUsdMoney(' ', 'total assets')).toBeNull()
  })

  it('rejects invalid, inexact and unsafe decimal values', () => {
    expect(() => parseNullableSecUsdMoney('1,25', 'total assets')).toThrow(
      'Invalid SEC N-PORT'
    )
    expect(() => parseNullableSecUsdMoney('1.001', 'total assets')).toThrow(
      'not exactly representable in cents'
    )
    expect(() =>
      parseNullableSecUsdMoney('90071992547409.92', 'total assets')
    ).toThrow('exceeds safe integer')
  })
})
