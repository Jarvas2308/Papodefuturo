export function normalizeCvmCnpj(value: string): string {
  if (!value.trim()) {
    throw new Error('CVM company CNPJ must not be empty')
  }

  const normalized = value.normalize('NFC').replace(/[\p{P}\s]+/gu, '')
  if (!/^\d{14}$/.test(normalized)) {
    throw new Error(`Invalid CVM company CNPJ: ${value}`)
  }

  return normalized
}
