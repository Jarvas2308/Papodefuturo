import { describe, expect, it } from 'vitest'
import { divideToScaledSafeInteger } from './scaledArithmetic'

describe('divideToScaledSafeInteger', () => {
  it('preserva uma divisão exata', () => {
    expect(divideToScaledSafeInteger(1, 4, 1_000_000)).toBe(250_000)
  })

  it('preserva o sinal de uma divisão exata negativa', () => {
    expect(divideToScaledSafeInteger(-1, 8, 1_000_000)).toBe(-125_000)
  })

  it('arredonda empate positivo para longe de zero', () => {
    expect(divideToScaledSafeInteger(1, 2, 1)).toBe(1)
  })

  it('arredonda empate negativo para longe de zero', () => {
    expect(divideToScaledSafeInteger(-1, 2, 1)).toBe(-1)
  })

  it('arredonda uma fração abaixo da metade em direção a zero', () => {
    expect(divideToScaledSafeInteger(1, 3, 1)).toBe(0)
  })

  it('arredonda uma fração acima da metade para longe de zero', () => {
    expect(divideToScaledSafeInteger(2, 3, 1)).toBe(1)
  })

  it('representa zero sem sinal residual', () => {
    expect(divideToScaledSafeInteger(0, 3, 1_000_000)).toBe(0)
  })

  it('rejeita denominador zero', () => {
    expect(() => divideToScaledSafeInteger(1, 0, 10)).toThrow(
      'Denominator must be a positive safe integer'
    )
  })

  it('rejeita denominador negativo', () => {
    expect(() => divideToScaledSafeInteger(1, -1, 10)).toThrow(
      'Denominator must be a positive safe integer'
    )
  })

  it('rejeita numerador que não é inteiro seguro', () => {
    expect(() => divideToScaledSafeInteger(Number.MAX_VALUE, 1, 10)).toThrow(
      'Numerator must be a safe integer'
    )
  })

  it('rejeita denominador que não é inteiro seguro', () => {
    expect(() => divideToScaledSafeInteger(1, Number.MAX_VALUE, 10)).toThrow(
      'Denominator must be a positive safe integer'
    )
  })

  it('rejeita escala não positiva', () => {
    expect(() => divideToScaledSafeInteger(1, 1, 0)).toThrow(
      'Scale must be a positive safe integer'
    )
  })

  it('rejeita resultado fora do intervalo de inteiro seguro', () => {
    expect(() =>
      divideToScaledSafeInteger(Number.MAX_SAFE_INTEGER, 1, 2)
    ).toThrow('Scaled result exceeds the safe integer range')
  })
})
