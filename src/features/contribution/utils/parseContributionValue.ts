export function parseContributionValue(value: string): number {
  const normalizedValue = value.trim()

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(normalizedValue)) {
    throw new RangeError(
      'Informe um valor monetário válido com até duas casas decimais.'
    )
  }

  const [integerPart, decimalPart = ''] = normalizedValue
    .replace(',', '.')
    .split('.')
  const valueInCents =
    Number(integerPart) * 100 + Number(decimalPart.padEnd(2, '0'))

  if (!Number.isSafeInteger(valueInCents) || valueInCents <= 0) {
    throw new RangeError('Informe um valor de aporte maior que zero.')
  }

  return valueInCents
}
