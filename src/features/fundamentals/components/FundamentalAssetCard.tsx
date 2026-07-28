import { Card } from '../../../components/ui/Card'
import type {
  FundamentalDerivedFactsAsset,
  FundamentalFactsAsset,
} from '../../../domain/fundamentals'
import {
  formatFundamentalSource,
  formatFundamentalsDate,
  formatFundamentalsMoney,
  formatFundamentalsMoneyPerUnit,
  formatFundamentalsRatioPercent,
  FUNDAMENTAL_ASSET_KIND_LABELS,
} from '../presentation'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  )
}

function describeMetric<TValue>(
  metric: { status: 'available'; value: TValue } | { status: 'unavailable' },
  format: (value: TValue) => string
): string {
  return metric.status === 'available' ? format(metric.value) : 'Indisponível'
}

export function FundamentalAssetCard({
  factsAsset,
  derivedAsset,
}: {
  factsAsset: FundamentalFactsAsset
  derivedAsset: FundamentalDerivedFactsAsset | undefined
}) {
  const snapshot = factsAsset.snapshots[0] ?? null
  const derivedSnapshot = derivedAsset?.snapshots[0] ?? null

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        {FUNDAMENTAL_ASSET_KIND_LABELS[factsAsset.category]}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-[var(--color-text)]">
        {factsAsset.ticker}{' '}
        <span className="font-normal text-[var(--color-text-muted)]">
          {factsAsset.name}
        </span>
      </h3>

      {snapshot === null ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Sem dados fundamentalistas disponíveis para este ativo.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {formatFundamentalSource(snapshot.source)} · referência{' '}
            {formatFundamentalsDate(snapshot.referenceDate)}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {snapshot.kind === 'brazilian-stock' ? (
              <>
                <Fact
                  label="Lucro líquido"
                  value={formatFundamentalsMoney(snapshot.facts.netIncome)}
                />
                <Fact
                  label="Ativos totais"
                  value={formatFundamentalsMoney(snapshot.facts.totalAssets)}
                />
                <Fact
                  label="Patrimônio líquido"
                  value={formatFundamentalsMoney(snapshot.facts.totalEquity)}
                />
                <Fact
                  label="Fluxo de caixa operacional"
                  value={formatFundamentalsMoney(
                    snapshot.facts.operatingCashFlow
                  )}
                />
                {derivedSnapshot?.kind === 'brazilian-stock' ? (
                  <Fact
                    label="Patrimônio líquido / ativos"
                    value={describeMetric(
                      derivedSnapshot.metrics.equityToAssets,
                      (value) =>
                        formatFundamentalsRatioPercent(value.scaledValue)
                    )}
                  />
                ) : null}
              </>
            ) : null}

            {snapshot.kind === 'real-estate-fund' ? (
              <>
                <Fact
                  label="Patrimônio líquido"
                  value={formatFundamentalsMoney(snapshot.facts.netAssetValue)}
                />
                <Fact
                  label="Cotistas"
                  value={
                    snapshot.facts.shareholderCount === null
                      ? 'Não informado'
                      : new Intl.NumberFormat('pt-BR').format(
                          snapshot.facts.shareholderCount
                        )
                  }
                />
                {derivedSnapshot?.kind === 'real-estate-fund' ? (
                  <Fact
                    label="Valor patrimonial por cota"
                    value={describeMetric(
                      derivedSnapshot.metrics.netAssetValuePerIssuedShare,
                      (value) =>
                        formatFundamentalsMoneyPerUnit(
                          value.scaledAmountInMinorUnitsPerUnit
                        )
                    )}
                  />
                ) : null}
              </>
            ) : null}

            {snapshot.kind === 'international-etf' ? (
              <>
                <Fact
                  label="Ativos totais"
                  value={formatFundamentalsMoney(snapshot.facts.totalAssets)}
                />
                <Fact
                  label="Passivos totais"
                  value={formatFundamentalsMoney(
                    snapshot.facts.totalLiabilities
                  )}
                />
                <Fact
                  label="Patrimônio líquido"
                  value={formatFundamentalsMoney(snapshot.facts.netAssets)}
                />
                {derivedSnapshot?.kind === 'international-etf' ? (
                  <>
                    <Fact
                      label="Passivos / ativos"
                      value={describeMetric(
                        derivedSnapshot.metrics.liabilitiesToAssets,
                        (value) =>
                          formatFundamentalsRatioPercent(value.scaledValue)
                      )}
                    />
                    <Fact
                      label="Patrimônio líquido / ativos"
                      value={describeMetric(
                        derivedSnapshot.metrics.netAssetsToAssets,
                        (value) =>
                          formatFundamentalsRatioPercent(value.scaledValue)
                      )}
                    />
                  </>
                ) : null}
              </>
            ) : null}
          </dl>
        </>
      )}
    </Card>
  )
}
