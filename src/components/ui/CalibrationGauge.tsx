type CalibrationGaugeProps = {
  label: string
  targetPercent: number
  currentPercent: number
  alert?: boolean
}

/**
 * Renders allocation as a calibration reading (tick at target, fill to
 * current) instead of a generic progress bar — the product's actual job is
 * comparing "onde está" a "onde deveria estar".
 */
export function CalibrationGauge({
  label,
  targetPercent,
  currentPercent,
  alert = false,
}: CalibrationGaugeProps) {
  const scaleMax = Math.max(targetPercent, currentPercent, 1) * 1.2
  const fillPercent = Math.min((currentPercent / scaleMax) * 100, 100)
  const tickPercent = Math.min((targetPercent / scaleMax) * 100, 100)
  const fillColor = alert ? 'var(--color-alert)' : 'var(--color-positive)'

  return (
    <div
      className="relative h-2.5 rounded-full bg-[var(--color-surface-muted)]"
      role="progressbar"
      aria-valuenow={currentPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Participação atual de ${label}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width]"
        style={{ width: `${fillPercent}%`, backgroundColor: fillColor }}
      />
      <div
        className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-text)]"
        style={{ left: `calc(${tickPercent}% - 1px)` }}
        aria-hidden="true"
        title={`Meta: ${targetPercent.toFixed(1)}%`}
      />
    </div>
  )
}
