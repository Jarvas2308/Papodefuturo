import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function StrategyPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Estratégia de Alocação"
        description="Acompanhe as metas definidas para cada categoria e ativo."
      />
      <ComingSoonCard
        message="As metas estratégicas serão implementadas após a conclusão das telas."
        detail="Nesta fundação, preservamos o espaço para visão estratégica sem adiantar cálculos, metas numéricas ou integração com dados de mercado."
      />
    </section>
  )
}
