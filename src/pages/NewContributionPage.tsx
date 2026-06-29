import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function NewContributionPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Novo Aporte"
        description="Planeje a melhor distribuição para o próximo aporte."
      />
      <ComingSoonCard
        message="O planejamento de aporte será conectado ao motor estratégico posteriormente."
        detail="Nesta etapa, a tela já reserva o espaço de interação e a linguagem visual que vai receber os cálculos, recomendações e cenários futuros."
      />
    </section>
  )
}
