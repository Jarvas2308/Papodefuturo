import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Visão Geral"
        description="Acompanhe a evolução e a distribuição da sua carteira."
      />
      <ComingSoonCard
        message="O resumo financeiro será construído na próxima etapa."
        detail="Nesta fundação visual, já preparamos a navegação principal, o layout compartilhado e uma base consistente para receber indicadores, resumos e distribuição da carteira."
      />
    </section>
  )
}
