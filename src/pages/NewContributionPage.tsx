import { useState } from 'react'
import { AiExplanation } from '../features/contribution/components/AiExplanation'
import { ContributionForm } from '../features/contribution/components/ContributionForm'
import { ContributionPurchaseConfirmation } from '../features/contribution/components/ContributionPurchaseConfirmation'
import { ContributionPreview } from '../features/contribution/components/ContributionPreview'
import { ContributionResult } from '../features/contribution/components/ContributionResult'
import { useContribution } from '../features/contribution/hooks/useContribution'
import { useContributionData } from '../features/contribution/hooks/useContributionData'
import { contributionMock } from '../features/contribution/mocks/contributionMock'
import type { CreatePurchaseBatchItem } from '../data/repositories/contracts'
import type { Asset, ContributionPlan, ExchangeRate } from '../domain/models'
import type { AiExplanationV1 } from '../domain/aiExplanation'
import type {
  AllocationTarget,
  ContributionAssetScore,
  ContributionAssetTarget,
  ContributionDistribution,
  ContributionPosition,
  TargetAllocationContributionResult,
} from '../features/contribution/types'
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
  assetTargets: ContributionAssetTarget[]
  assetScores: ContributionAssetScore[]
  scoreWeightInBasisPoints: number
  isDemo: boolean
  contributionPlan: ContributionPlan | null
  onPresentPlan(
    distribution: readonly ContributionDistribution[],
    inputAmountInMinorUnits: number
  ): Promise<void>
  onAcceptPlan(): Promise<void>
  onRejectPlan(): Promise<void>
  onExplainPlan(
    technicalPlan: TargetAllocationContributionResult,
    contributionAmountInCents: number
  ): Promise<AiExplanationV1 | null>
  onRegisterPurchases(
    purchases: readonly CreatePurchaseBatchItem[]
  ): Promise<unknown>
}

function ContributionWorkspace({
  assets,
  exchangeRate,
  positions,
  resultPositions,
  targets,
  assetTargets,
  assetScores,
  scoreWeightInBasisPoints,
  isDemo,
  contributionPlan,
  onPresentPlan,
  onAcceptPlan,
  onRejectPlan,
  onExplainPlan,
  onRegisterPurchases,
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
    metasGlobaisPorAtivo: assetTargets,
    assetScores,
    scoreWeightInBasisPoints,
  })
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<AiExplanationV1 | null>(
    null
  )

  function handleSimulation() {
    const simulation = simulateContribution()
    setIsConfirmationOpen(false)
    setAiExplanation(null)

    if (
      !isDemo &&
      simulation.result &&
      simulation.valorAporteEmCentavos !== null &&
      simulation.result.distribuicao.length > 0
    ) {
      void onPresentPlan(
        simulation.result.distribuicao,
        simulation.valorAporteEmCentavos
      )

      if (simulation.result.strategy === 'target-allocation') {
        const technicalPlan = simulation.result
        const contributionAmountInCents = simulation.valorAporteEmCentavos

        void onExplainPlan(technicalPlan, contributionAmountInCents).then(
          setAiExplanation
        )
      }
    }
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
          planStatus={isDemo ? undefined : contributionPlan?.status}
          onAcceptPlan={isDemo ? undefined : () => void onAcceptPlan()}
          onRejectPlan={isDemo ? undefined : () => void onRejectPlan()}
          onConfirmPurchases={
            result.distribuicao.length > 0 &&
            shouldOfferContributionPurchaseConfirmation(isDemo)
              ? () => setIsConfirmationOpen(true)
              : undefined
          }
        />
      ) : null}

      {aiExplanation ? <AiExplanation explanation={aiExplanation} /> : null}

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
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          Sua simulação inclui posição internacional confirmada. Aguardando a
          próxima atualização automática da cotação USD/BRL para calcular
          valores em BRL.
        </p>
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
        assetTargets={contributionData.assetTargets}
        assetScores={contributionData.assetScores}
        scoreWeightInBasisPoints={contributionData.scoreWeightInBasisPoints}
        isDemo={contributionData.isDemo}
        contributionPlan={contributionData.contributionPlan}
        onPresentPlan={contributionData.presentContributionPlan}
        onAcceptPlan={contributionData.acceptContributionPlan}
        onRejectPlan={contributionData.rejectContributionPlan}
        onExplainPlan={contributionData.explainContributionPlan}
        onRegisterPurchases={contributionData.registerConfirmedPurchases}
      />
    </section>
  )
}
