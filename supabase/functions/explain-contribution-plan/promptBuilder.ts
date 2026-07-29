import type { TechnicalDossierInput } from './types.ts'

export const EXPLANATION_SYSTEM_PROMPT = `Você interpreta e explica, em português do Brasil, um plano de aporte já calculado por um motor determinístico de uma aplicação financeira.

Regras inegociáveis:
- Você NUNCA cria, seleciona ou modifica o plano técnico.
- Você NUNCA recomenda ativos fora dos que já aparecem no plano informado.
- Você NUNCA calcula preço médio, participação, rentabilidade ou metas — esses valores já vêm prontos.
- Você NUNCA declara que uma ordem foi ou será executada.
- Use exclusivamente os fatos e números fornecidos nesta mensagem. Nunca invente, estime ou arredonde números que não estejam no dossiê.
- Se um dado não estiver disponível no dossiê, diga que não está disponível em vez de supor um valor.

Responda apenas com um objeto JSON, sem markdown e sem texto fora do JSON, no formato exato:
{"facts": string[], "interpretation": string, "convictionLevel": "low" | "medium" | "high", "technicalPlanSummary": string, "comparativeExplanation": string}

- facts: de 2 a 5 fatos objetivos extraídos diretamente do dossiê (números e nomes exatamente como fornecidos).
- interpretation: um parágrafo curto interpretando o que os fatos significam para o usuário, sem recomendação.
- convictionLevel: grau de convicção da leitura técnica com base na cobertura de dados do dossiê (baixa cobertura de preços ou câmbio ausente → "low").
- technicalPlanSummary: um parágrafo curto reapresentando o plano técnico já calculado (itens, quantidades, valores), sem alterar nenhum número.
- comparativeExplanation: um parágrafo curto explicando por que os ativos do plano foram os escolhidos pelo motor e não outros do universo, com base nos desvios informados.`

function formatBrl(minorUnits: number): string {
  return (minorUnits / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatBasisPoints(value: number): string {
  return `${(value / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} p.p.`
}

export function buildExplanationUserPrompt(
  dossier: TechnicalDossierInput
): string {
  const positionsText = dossier.portfolio.positions
    .map(
      (position) =>
        `- ${position.ticker} (${position.name}): ${formatBrl(position.currentMinorInBrl)}, resultado ${position.resultPercentage.toFixed(2)}%`
    )
    .join('\n')

  const planItemsText = dossier.technicalPlan.items
    .map(
      (item) =>
        `- ${item.ticker} (${item.name}): ${item.suggestedQuantity} unidade(s) a ${formatBrl(item.unitPriceMinorInBrl)}, total ${formatBrl(item.allocatedMinorInBrl)}, desvio antes ${formatBasisPoints(item.differenceBeforeInBasisPoints)}, desvio depois ${formatBasisPoints(item.differenceAfterInBasisPoints)}`
    )
    .join('\n')

  const limitationsText = dossier.limitations
    .map((limitation) => `- ${limitation.description}`)
    .join('\n')

  return `Dossiê técnico (gerado em ${dossier.generatedAt}):

Carteira atual (${dossier.portfolio.baseCurrency}):
- Investido: ${formatBrl(dossier.portfolio.totalInvestedMinorInBrl)}
- Valor atual: ${formatBrl(dossier.portfolio.totalCurrentMinorInBrl)}
- Resultado: ${formatBrl(dossier.portfolio.totalResultMinorInBrl)} (${dossier.portfolio.totalResultPercentage.toFixed(2)}%)

Posições:
${positionsText || '- nenhuma posição elegível'}

Plano técnico calculado pelo motor:
- Valor do aporte: ${formatBrl(dossier.technicalPlan.contributionAmountMinorInBrl)}
- Alocado: ${formatBrl(dossier.technicalPlan.totalAllocatedMinorInBrl)}
- Não alocado: ${formatBrl(dossier.technicalPlan.unallocatedMinorInBrl)}
- Motivo de parada: ${dossier.technicalPlan.stopReason}

Itens do plano:
${planItemsText || '- nenhum item'}

Desvio total da carteira:
- Antes: ${formatBasisPoints(dossier.deviations.totalBeforeInBasisPoints)}
- Depois: ${formatBasisPoints(dossier.deviations.totalAfterInBasisPoints)}
- Redução: ${formatBasisPoints(dossier.deviations.totalReductionInBasisPoints)}

Limitações conhecidas deste plano:
${limitationsText || '- nenhuma'}

Responda apenas com o objeto JSON descrito nas instruções.`
}
