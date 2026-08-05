// Frescor por fonte (Sprint 16, Fase 9, DEC-089) - DEC-068 ja alertava que
// o limiar de "dado velho" nao pode ser um numero global: cada fonte tem
// seu proprio ritmo de publicacao (preco de mercado por hora, CVM
// Trimestral por trimestre, SEC N-PORT com ate 60 dias de atraso). Esta
// constante cobre o unico caso implementado ate agora - CVM Informe
// Trimestral (FII tijolo) - e e' um ponto de partida documentado, nao uma
// medicao formal: 2 trimestres (~180 dias) cobre 1 ciclo de publicacao
// normal mais 1 de folga para atraso, editavel quando o produto tiver mais
// historico real de frescor por fonte.
export const CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS = 180

const MILLISECONDS_PER_DAY = 86_400_000

export function isReferenceDateStale(
  referenceDate: string,
  now: string,
  staleAfterDays: number
): boolean {
  const referenceMs = Date.parse(referenceDate)
  const nowMs = Date.parse(now)
  if (Number.isNaN(referenceMs) || Number.isNaN(nowMs)) {
    throw new RangeError('referenceDate and now must be valid ISO dates')
  }

  const ageInDays = Math.floor((nowMs - referenceMs) / MILLISECONDS_PER_DAY)
  return ageInDays > staleAfterDays
}
