import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function HistoryPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Histórico de Compras"
        description="Consulte e gerencie as operações registradas."
      />
      <ComingSoonCard
        message="O histórico será conectado às compras depois da criação do banco de dados."
        detail="A interface já está pronta para receber listagens, filtros e detalhes das operações, sem antecipar integração com persistência ou dados financeiros reais."
      />
    </section>
  )
}
