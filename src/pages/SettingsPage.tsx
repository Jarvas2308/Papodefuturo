import { ComingSoonCard } from '../components/ui/ComingSoonCard'
import { PageHeader } from '../components/ui/PageHeader'

export function SettingsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie preferências e informações da conta."
      />
      <ComingSoonCard
        message="As preferências serão disponibilizadas em uma etapa futura."
        detail="A tela já está pronta para receber dados da conta, preferências e ajustes da experiência quando a etapa funcional for iniciada."
      />
    </section>
  )
}
