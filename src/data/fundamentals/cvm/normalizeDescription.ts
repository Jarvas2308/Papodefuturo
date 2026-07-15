export function normalizeCvmDescription(value: string): string {
  return value
    .normalize('NFC')
    .toLocaleUpperCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}
