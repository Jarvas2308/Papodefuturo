import { AllocationOverview } from '../features/dashboard/components/AllocationOverview'
import { DashboardNextStep } from '../features/dashboard/components/DashboardNextStep'
import { DashboardWelcome } from '../features/dashboard/components/DashboardWelcome'
import { InformationStatus } from '../features/dashboard/components/InformationStatus'
import { PortfolioEvolution } from '../features/dashboard/components/PortfolioEvolution'
import { RecentMovements } from '../features/dashboard/components/RecentMovements'
import { SummaryCard } from '../features/dashboard/components/SummaryCard'
import { dashboardMock } from '../mocks/dashboard'

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <DashboardWelcome
        disclaimer={dashboardMock.disclaimer}
        title={dashboardMock.welcome.title}
        description={dashboardMock.welcome.description}
        actionLabel={dashboardMock.welcome.actionLabel}
        actionTo={dashboardMock.welcome.actionTo}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMock.summary.map((item) => (
          <SummaryCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <PortfolioEvolution evolution={dashboardMock.evolution} />
        <AllocationOverview allocation={dashboardMock.allocation} />
      </div>

      <DashboardNextStep
        title={dashboardMock.nextStep.title}
        description={dashboardMock.nextStep.description}
      />

      <RecentMovements
        recentMovements={dashboardMock.recentMovements}
        disclaimer={dashboardMock.disclaimer}
      />

      <InformationStatus informationStatus={dashboardMock.informationStatus} />
    </section>
  )
}
