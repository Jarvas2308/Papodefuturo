import { BookOpenCheck, Landmark, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { FundamentalAssetCard } from './components/FundamentalAssetCard'
import {
  FundamentalsInitialSkeleton,
  FundamentalsState,
} from './components/FundamentalsState'
import { useFundamentalsDossierV1 } from './hooks'
import type { FundamentalsUiDependenciesV1 } from './types'

export function FundamentalsPageContent({
  dependencies,
}: {
  dependencies: FundamentalsUiDependenciesV1
}) {
  const { state, reload } = useFundamentalsDossierV1(dependencies.runtime)
  const capability = dependencies.runtime.getCapability()

  return (
    <section className="space-y-6" aria-labelledby="fundamentals-section-title">
      <Card className="relative overflow-hidden border-blue-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_58%,#f7fbf8_100%)] p-5 sm:p-7">
        <div
          className="absolute -right-12 -top-12 size-40 rounded-full bg-blue-200/35 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Fatos fundamentalistas
            </p>
            <h2
              id="fundamentals-section-title"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              Fundamentos dos ativos acompanhados
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
              Fatos contábeis normalizados publicados por CVM e SEC para os
              ativos do universo fechado, mais razões derivadas auditáveis.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Fontes oficiais disponíveis"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--color-brand-strong)] shadow-sm">
              <Landmark className="size-4" aria-hidden="true" /> CVM
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--color-brand-strong)] shadow-sm">
              <ShieldCheck className="size-4" aria-hidden="true" /> SEC N-PORT
            </span>
          </div>
        </div>
        <div className="relative mt-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-blue-200 bg-white/75 p-4">
          <BookOpenCheck
            className="mt-0.5 size-5 shrink-0 text-[var(--color-brand)]"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-[var(--color-text)]">
            Estes fatos e razões são de caráter informativo, não constituem
            recomendação de investimento e não alteram o Motor V2 nem o plano
            técnico de aporte. Nenhum score, ranking ou classificação de
            qualidade é produzido.
          </p>
        </div>
      </Card>

      {capability.mode === 'disabled' ? (
        <FundamentalsState status="disabled" />
      ) : state.status === 'idle' || state.status === 'loading' ? (
        <FundamentalsInitialSkeleton />
      ) : state.status !== 'succeeded' ? (
        <FundamentalsState status={state.status} onRetry={reload} />
      ) : state.dossier.facts.assets.length === 0 ? (
        <div
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-soft)]"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Nenhum ativo elegível encontrado
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ainda não há ativos ações, FIIs ou ETFs internacionais no seu
            catálogo.
          </p>
        </div>
      ) : (
        <div
          aria-live="polite"
          aria-label="Fundamentos por ativo"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {state.dossier.facts.assets.map((factsAsset) => (
            <FundamentalAssetCard
              key={factsAsset.assetId}
              factsAsset={factsAsset}
              derivedAsset={state.dossier.derived.assets.find(
                (asset) => asset.assetId === factsAsset.assetId
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
