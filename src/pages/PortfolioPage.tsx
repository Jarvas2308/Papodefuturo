import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function PortfolioPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Minha Carteira"
        description="Visualize suas posições, compras e resultados consolidados."
      />
      <ComingSoonCard
        message="A estrutura da carteira será construída em uma etapa específica."
        detail="A base visual foi desenhada para receber tabelas, agrupamentos e indicadores com clareza, sem misturar regras financeiras nesta primeira entrega."
      />
    </section>
  )
}
