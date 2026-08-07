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

// Shiller/Yale publica mensalmente e com pouco atraso - limiar bem mais
// apertado que o trimestral da CVM (2 meses cobre 1 ciclo de publicacao
// normal mais 1 de folga, mesmo raciocinio de CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS).
export const SHILLER_CAPE_STALE_AFTER_DAYS = 60

// Vanguard publica prêmio/desconto diariamente em dia útil (Sprint 16,
// Fase 4 fatia ETF, DEC-092) - limiar bem mais apertado que os demais
// (mesmo raciocínio: 1 ciclo normal de publicação, 1 dia útil, mais folga
// pra cobrir um fim de semana longo/feriado sem soar "stale" à toa).
// Fonte não regulatória (site do próprio emissor, não um filing) - janela
// curta reduz o tempo em que um dado desatualizado poderia influenciar o
// score.
export const VANGUARD_PREMIUM_DISCOUNT_STALE_AFTER_DAYS = 5

// N-CSR (relatório ANUAL auditado de fundo registrado na SEC) é a fonte
// mais lenta do motor: um documento por exercício. Observado com filing
// real de VNQ (accession 0001104659-26-036013): exercício encerrado em
// 31/01/2026, protocolado em 27/03/2026 — ~55 dias de defasagem. Da data
// de referência de um exercício até a publicação do seguinte passam
// ~365 + ~55 = ~420 dias; 450 cobre esse ciclo normal com ~1 mês de
// folga, mesmo raciocínio das demais constantes (1 ciclo de publicação +
// folga), não uma medição formal.
export const SEC_N_CSR_STALE_AFTER_DAYS = 450

// FRED DFII10 (DEC-093) é série diária de dia útil, igual em ritmo ao
// prêmio/desconto da Vanguard — mesmo limiar e mesma justificativa
// (1 ciclo normal, 1 dia útil, mais folga pra fim de semana longo).
export const FRED_DFII10_STALE_AFTER_DAYS = 5

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
