import { describe, expect, it } from 'vitest'
import { parseCvmMonetaryFact } from './money'

describe('parseCvmMonetaryFact', () => {
  it('parses positive, negative and zero monetary values', () => {
    expect(parseCvmMonetaryFact('12', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: 1_200,
      currency: 'BRL',
    })
    expect(parseCvmMonetaryFact('-12', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: -1_200,
      currency: 'BRL',
    })
    expect(parseCvmMonetaryFact('0', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: 0,
      currency: 'BRL',
    })
  })

  it('parses exact decimals without converting through Number', () => {
    expect(parseCvmMonetaryFact('1234,56', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: 123_456,
      currency: 'BRL',
    })
  })

  it('applies the official thousand-unit scale', () => {
    expect(parseCvmMonetaryFact('1.25', 'REAL', 'MIL')).toEqual({
      amountInMinorUnits: 125_000,
      currency: 'BRL',
    })
  })

  it('rounds half away from zero deterministically', () => {
    expect(parseCvmMonetaryFact('0.005', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: 1,
      currency: 'BRL',
    })
    expect(parseCvmMonetaryFact('-0.005', 'REAL', 'UNIDADE')).toEqual({
      amountInMinorUnits: -1,
      currency: 'BRL',
    })
  })

  it('rejects malformed values', () => {
    expect(() => parseCvmMonetaryFact('1.234,56', 'REAL', 'UNIDADE')).toThrow(
      'Invalid CVM monetary value'
    )
  })

  it('rejects unsupported currency and scale', () => {
    expect(() => parseCvmMonetaryFact('1', 'DOLAR', 'UNIDADE')).toThrow(
      'Unsupported CVM currency'
    )
    expect(() => parseCvmMonetaryFact('1', 'REAL', 'MILHÃO')).toThrow(
      'Unsupported CVM currency scale'
    )
  })

  it('rejects values outside the safe integer range', () => {
    expect(() => parseCvmMonetaryFact('90071992547410', 'REAL', 'MIL')).toThrow(
      'outside the safe integer range'
    )
  })
})
