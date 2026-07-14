import { Card } from '../components/ui/Card'
import { ExchangeRateSetup } from '../components/ui/ExchangeRateSetup'
import { AllocationOverview } from '../features/dashboard/components/AllocationOverview'
import { DashboardNextStep } from '../features/dashboard/components/DashboardNextStep'
import { DashboardWelcome } from '../features/dashboard/components/DashboardWelcome'
import { InformationStatus } from '../features/dashboard/components/InformationStatus'
import { InvestmentEvolution } from '../features/dashboard/components/InvestmentEvolution'
import { RecentMovements } from '../features/dashboard/components/RecentMovements'
import { SummaryCard } from '../features/dashboard/components/SummaryCard'
import type { DashboardView } from '../features/dashboard/types'
import { useDashboardData } from '../features/dashboard/useDashboardData'

type DashboardContentProps = {
  data: DashboardView
}

export function DashboardContent({ data }: DashboardContentProps) {
  return (
    <section className="space-y-6">
      <DashboardWelcome
        disclaimer={data.disclaimer}
        title={data.welcome.title}
        description={data.welcome.description}
        actionLabel={data.welcome.actionLabel}
        actionTo={data.welcome.actionTo}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item) => (
          <SummaryCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <InvestmentEvolution evolution={data.investmentEvolution} />
        <AllocationOverview allocation={data.allocation} />
      </div>

      <DashboardNextStep
        title={data.nextStep.title}
        description={data.nextStep.description}
      />

      <RecentMovements
        recentMovements={data.recentMovements}
        disclaimer={data.disclaimer}
      />

      <InformationStatus informationStatus={data.informationStatus} />
    </section>
  )
}

export function DashboardPage() {
  const { data, status, error, needsExchangeRate, saveManualUsdBrl } =
    useDashboardData()

  if (status === 'error') {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Não foi possível carregar o painel
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {error ?? 'Tente novamente após atualizar a página.'}
        </p>
      </Card>
    )
  }

  if (status === 'loading') {
    return (
      <Card>
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Carregando seu painel...
        </p>
      </Card>
    )
  }

  if (needsExchangeRate) {
    return (
      <section className="space-y-6">
        <ExchangeRateSetup
          description="Seu painel possui posição internacional confirmada. Informe a taxa USD/BRL para calcular patrimônio, rentabilidade, alocação e capital investido em BRL sem somar moedas diferentes."
          successMessage="Cotação salva. Recalculando o painel em BRL."
          onSave={saveManualUsdBrl}
        />
      </section>
    )
  }

  return data ? <DashboardContent data={data} /> : null
}
