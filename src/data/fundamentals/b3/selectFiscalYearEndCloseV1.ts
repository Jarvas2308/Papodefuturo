import type { CotahistAnnualCloseRecord } from './b3CotahistAnnualCloseSeriesV1'

// Casa uma série de pregões (já ordenada ascendentemente por
// `tradingDate`) com a data de exercício do DFP (`fiscalYearEndDate`,
// tipicamente 31/12 para o universo fechado). `fiscalYearEndDate` nem
// sempre é pregão (fim de semana, feriado) - o fechamento oficial usado é
// o último pregão em OU ANTES dessa data (mesma convenção confirmada com
// dado real em DEC-096: BBAS3 fecha 2025-12-30, último pregão de 2025,
// pro exercício encerrado em 2025-12-31).
//
// Restrito ao mesmo ano-calendário de `fiscalYearEndDate`: um arquivo
// anual só cobre um ano, então isso é sempre satisfeito na prática, mas a
// checagem existe pra nunca silenciosamente aceitar um pregão de um ano
// completamente diferente caso a série de entrada venha de mais de um
// arquivo concatenado.
export function selectFiscalYearEndCloseV1(input: {
  series: readonly CotahistAnnualCloseRecord[]
  fiscalYearEndDate: string
}): CotahistAnnualCloseRecord | null {
  const { series, fiscalYearEndDate } = input
  const fiscalYear = fiscalYearEndDate.slice(0, 4)

  let best: CotahistAnnualCloseRecord | null = null
  for (const record of series) {
    if (record.tradingDate.slice(0, 4) !== fiscalYear) {
      continue
    }
    if (record.tradingDate > fiscalYearEndDate) {
      continue
    }
    if (best === null || record.tradingDate > best.tradingDate) {
      best = record
    }
  }

  return best
}
