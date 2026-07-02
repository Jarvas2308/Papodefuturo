import { ContributionForm } from '../features/contribution/components/ContributionForm'
import { ContributionPreview } from '../features/contribution/components/ContributionPreview'
import { ContributionResult } from '../features/contribution/components/ContributionResult'
import { useContribution } from '../features/contribution/hooks/useContribution'
import { contributionMock } from '../features/contribution/mocks/contributionMock'

export function NewContributionPage() {
  const {
    error,
    result,
    simulateContribution,
    strategy,
    updateStrategy,
    updateValue,
    valorAporte,
  } = useContribution({
    initialValue: contributionMock.valorInicialInterface,
    initialStrategy: contributionMock.strategyInicial,
    carteiraAtual: contributionMock.carteiraAtual,
    metasAlocacao: contributionMock.metasAlocacao,
  })

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <ContributionForm
          error={error}
          strategy={strategy}
          value={valorAporte}
          onChange={updateValue}
          onStrategyChange={updateStrategy}
          onSubmit={simulateContribution}
        />
        <ContributionPreview
          positionCount={contributionMock.carteiraAtual.length}
          strategy={strategy}
          targets={contributionMock.metasAlocacao}
        />
      </div>

      {result ? (
        <ContributionResult
          positions={contributionMock.posicoesVisuais}
          result={result}
          strategy={strategy}
        />
      ) : null}
    </section>
  )
}
