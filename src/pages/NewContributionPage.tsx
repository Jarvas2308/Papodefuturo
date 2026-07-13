import { useState } from 'react'
import { ContributionForm } from '../features/contribution/components/ContributionForm'
import { ContributionPurchaseConfirmation } from '../features/contribution/components/ContributionPurchaseConfirmation'
import { ContributionPreview } from '../features/contribution/components/ContributionPreview'
import { ContributionResult } from '../features/contribution/components/ContributionResult'
import { useContribution } from '../features/contribution/hooks/useContribution'
import { useContributionData } from '../features/contribution/hooks/useContributionData'
import { contributionMock } from '../features/contribution/mocks/contributionMock'
import type { CreatePurchaseBatchItem } from '../data/repositories/contracts'
import type { Asset, ExchangeRate } from '../domain/models'
import type {
  AllocationTarget,
  ContributionPosition,
} from '../features/contribution/types'
import { ExchangeRateSetup } from '../features/strategy/components/ExchangeRateSetup'
import { shouldOfferContributionPurchaseConfirmation } from '../features/contribution/utils/confirmedPurchases'

type ResultPosition = {
  id: string
  ticker: string
  name: string
  categoryLabel: string
}

type ContributionWorkspaceProps = {
  assets: Asset[]
  exchangeRate: ExchangeRate | null
  positions: ContributionPosition[]
  resultPositions: ResultPosition[]
  targets: AllocationTarget[]
  isDemo: boolean
  onRegisterPurchases(
    purchases: readonly CreatePurchaseBatchItem[]
  ): Promise<unknown>
  onSaveExchangeRate(rateScaled: number): Promise<void>
}

function ContributionWorkspace({
  assets,
  exchangeRate,
  positions,
  resultPositions,
  targets,
  isDemo,
  onRegisterPurchases,
  onSaveExchangeRate,
}: ContributionWorkspaceProps) {
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
    carteiraAtual: positions,
    metasAlocacao: targets,
  })
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  function handleSimulation() {
    simulateContribution()
    setIsConfirmationOpen(false)
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <ContributionForm
          error={error}
          strategy={strategy}
          value={valorAporte}
          onChange={updateValue}
          onStrategyChange={updateStrategy}
          onSubmit={handleSimulation}
        />
        <ContributionPreview
          positionCount={positions.length}
          strategy={strategy}
          targets={targets}
        />
      </div>

      {result ? (
        <ContributionResult
          positions={resultPositions}
          result={result}
          strategy={strategy}
          onConfirmPurchases={
            shouldOfferContributionPurchaseConfirmation(isDemo)
              ? () => setIsConfirmationOpen(true)
              : undefined
          }
        />
      ) : null}

      {result && isConfirmationOpen && !isDemo ? (
        <ContributionPurchaseConfirmation
          key={result.distribuicao
            .map((item) => `${item.assetId}:${item.valorEmCentavos}`)
            .join('|')}
          assets={assets}
          exchangeRate={exchangeRate}
          positions={resultPositions}
          result={result}
          onRegister={onRegisterPurchases}
          onSaveExchangeRate={onSaveExchangeRate}
        />
      ) : null}

      {!isDemo ? (
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">
          Simulação baseada nas compras, cotações, metas e taxa cambial salvas
          na sua conta. Nenhuma ordem é executada automaticamente.
        </p>
      ) : null}
    </>
  )
}

export function NewContributionPage() {
  const contributionData = useContributionData()

  if (contributionData.status === 'loading') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Carregando os dados para o próximo aporte...
        </p>
      </section>
    )
  }

  if (contributionData.status === 'error') {
    return (
      <section className="space-y-6">
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm font-medium text-[var(--color-text)]">
          {contributionData.error ??
            'Não foi possível carregar os dados do próximo aporte.'}
        </p>
      </section>
    )
  }

  if (contributionData.needsExchangeRate) {
    return (
      <section className="space-y-6">
        <ExchangeRateSetup onSave={contributionData.saveManualUsdBrl} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {contributionData.latestUsdBrlRate ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          Posições internacionais convertidas para BRL pela taxa USD/BRL salva
          em{' '}
          {new Date(contributionData.latestUsdBrlRate.pricedAt).toLocaleString(
            'pt-BR'
          )}
          .
        </p>
      ) : null}

      <ContributionWorkspace
        key={`${contributionData.positions.length}-${contributionData.targets
          .map((target) => `${target.category}:${target.targetPercentage}`)
          .join('|')}`}
        positions={contributionData.positions}
        assets={contributionData.assets}
        exchangeRate={contributionData.latestUsdBrlRate}
        resultPositions={contributionData.resultPositions}
        targets={contributionData.targets}
        isDemo={contributionData.isDemo}
        onRegisterPurchases={contributionData.registerConfirmedPurchases}
        onSaveExchangeRate={contributionData.saveManualUsdBrl}
      />
    </section>
  )
}
