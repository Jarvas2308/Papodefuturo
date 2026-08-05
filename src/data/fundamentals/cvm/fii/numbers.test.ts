import { describe, expect, it } from 'vitest'
import {
  parseNullableCvmFiiExactDecimalQuantity,
  parseNullableCvmFiiMoney,
  parseNullableCvmFiiNonNegativeInteger,
} from './numbers'

describe('parseNullableCvmFiiExactDecimalQuantity', () => {
  it('returns null for an empty string', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('', 'test')).toBeNull()
  })

  it('parses a plain decimal', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('0.014', 'test')).toEqual({
      unscaledValue: 14,
      scale: 3,
    })
  })

  it('parses an integer with no fraction', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('1', 'test')).toEqual({
      unscaledValue: 1,
      scale: 0,
    })
  })

  // Confirmado em dado real da CVM (Informe Trimestral 2026, tabelas
  // `imovel` e `complemento`): valores pequenos sao exportados em notacao
  // cientifica, ex. "6.8E-05" para Percentual_Vencimento_Receita_FII.
  // Sem suporte a expoente aqui, essas linhas reais quebravam o parser.
  it('parses scientific notation with a negative exponent', () => {
    expect(
      parseNullableCvmFiiExactDecimalQuantity('6.8E-05', 'test')
    ).toEqual({ unscaledValue: 68, scale: 6 })
  })

  it('parses scientific notation with an uppercase E and no decimal point', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('5E-05', 'test')).toEqual({
      unscaledValue: 5,
      scale: 5,
    })
  })

  it('parses scientific notation with a lowercase e', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('7.5e-05', 'test')).toEqual(
      { unscaledValue: 75, scale: 6 }
    )
  })

  it('parses scientific notation with a positive exponent', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('1.5E+2', 'test')).toEqual(
      { unscaledValue: 150, scale: 0 }
    )
  })

  it('parses scientific notation with no exponent sign (implicit positive)', () => {
    expect(parseNullableCvmFiiExactDecimalQuantity('1.5E2', 'test')).toEqual({
      unscaledValue: 150,
      scale: 0,
    })
  })

  it('rejects a malformed value', () => {
    expect(() =>
      parseNullableCvmFiiExactDecimalQuantity('abc', 'test field')
    ).toThrow('Invalid CVM FII test field: abc')
  })

  it('rejects a negative value', () => {
    expect(() =>
      parseNullableCvmFiiExactDecimalQuantity('-1', 'test')
    ).toThrow('Invalid CVM FII test')
  })
})

describe('parseNullableCvmFiiMoney', () => {
  it('returns null for an empty string', () => {
    expect(parseNullableCvmFiiMoney('', 'test')).toBeNull()
  })

  it('parses a positive amount into BRL minor units', () => {
    expect(parseNullableCvmFiiMoney('56879214.47', 'test')).toEqual({
      amountInMinorUnits: 5_687_921_447,
      currency: 'BRL',
    })
  })

  it('preserves a negative sign', () => {
    expect(parseNullableCvmFiiMoney('-1234.56', 'test')).toEqual({
      amountInMinorUnits: -123_456,
      currency: 'BRL',
    })
  })
})

describe('parseNullableCvmFiiNonNegativeInteger', () => {
  it('returns null for an empty string', () => {
    expect(parseNullableCvmFiiNonNegativeInteger('', 'test')).toBeNull()
  })

  it('parses a non-negative integer', () => {
    expect(parseNullableCvmFiiNonNegativeInteger('100000', 'test')).toBe(
      100_000
    )
  })

  it('rejects a negative value', () => {
    expect(() =>
      parseNullableCvmFiiNonNegativeInteger('-1', 'test')
    ).toThrow('Invalid CVM FII test')
  })
})
