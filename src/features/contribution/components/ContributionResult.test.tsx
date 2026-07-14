import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ContributionResult as ContributionResultData } from '../types'
import { ContributionResult } from './ContributionResult'

const positions = [
  {
    id: 'asset-a',
    ticker: 'ATV3',
    name: 'Ativo técnico',
    categoryLabel: 'Ações brasileiras',
  },
]

function renderResult(result: ContributionResultData, onConfirm = false) {
  return renderToStaticMarkup(
    <ContributionResult
      positions={positions}
      result={result}
      strategy={result.strategy}
      onConfirmPurchases={onConfirm ? () => undefined : undefined}
    />
  )
}

describe('ContributionResult', () => {
  it('presents the multiasset technical plan and its calculated impact', () => {
    const markup = renderResult({
      strategy: 'target-allocation',
      distribuicao: [{ assetId: 'asset-a', valorEmCentavos: 12_000 }],
      totalDistribuidoEmCentavos: 12_000,
      saldoNaoAlocadoEmCentavos: 500,
      technicalImpact: {
        totalDeviationBeforeInBasisPoints: 1_250,
        totalDeviationAfterInBasisPoints: 750,
        totalDeviationReductionInBasisPoints: 500,
        stopReason: 'no-affordable-unit',
        items: [
          {
            assetId: 'asset-a',
            suggestedQuantity: 3,
            unitPriceInCents: 4_000,
            allocatedInCents: 12_000,
            differenceBeforeInBasisPoints: -250,
            differenceAfterInBasisPoints: 100,
          },
        ],
      },
    })

    expect(markup).toContain('Plano técnico multiativos')
    expect(markup).toContain('Desvio antes')
    expect(markup).toContain('Saldo não alocado')
    expect(markup).toContain('Quantidade sugerida')
    expect(markup).toContain('Preço unitário de referência')
    expect(markup).toContain('Dif. antes')
    expect(markup).toContain('Ativo técnico')
    expect(markup).toContain('não uma recomendação financeira')
  })

  it('shows the normal stop reason without an empty card grid or confirmation CTA', () => {
    const markup = renderResult(
      {
        strategy: 'target-allocation',
        distribuicao: [],
        totalDistribuidoEmCentavos: 0,
        saldoNaoAlocadoEmCentavos: 100,
        technicalImpact: {
          totalDeviationBeforeInBasisPoints: 0,
          totalDeviationAfterInBasisPoints: 0,
          totalDeviationReductionInBasisPoints: 0,
          stopReason: 'no-improving-purchase',
          items: [],
        },
      },
      true
    )

    expect(markup).toContain(
      'Nenhuma nova unidade reduziria o desvio total da carteira.'
    )
    expect(markup).not.toContain('Confirmar compras realizadas')
    expect(markup).not.toContain('<article')
  })

  it('preserves the proportional result presentation', () => {
    const markup = renderResult({
      strategy: 'proportional',
      distribuicao: [{ assetId: 'asset-a', valorEmCentavos: 10_000 }],
      totalDistribuidoEmCentavos: 10_000,
      saldoNaoAlocadoEmCentavos: 0,
    })

    expect(markup).toContain('Simulação concluída')
    expect(markup).toContain('Distribuição proporcional')
    expect(markup).not.toContain('Desvio antes')
  })

  it('offers real purchase confirmation only for a non-empty plan', () => {
    const markup = renderResult(
      {
        strategy: 'proportional',
        distribuicao: [{ assetId: 'asset-a', valorEmCentavos: 10_000 }],
        totalDistribuidoEmCentavos: 10_000,
        saldoNaoAlocadoEmCentavos: 0,
      },
      true
    )

    expect(markup).toContain('Confirmar compras realizadas')
  })
})
