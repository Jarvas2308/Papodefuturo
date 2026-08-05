import { useState } from 'react'
import { calculateContribution as contributionEngine } from '../contributionEngine'
import type {
  AllocationTarget,
  ContributionAssetScore,
  ContributionAssetTarget,
  ContributionPosition,
  ContributionResult,
  ContributionStrategyType,
} from '../types'
import { parseContributionValue } from '../utils/parseContributionValue'

type UseContributionOptions = {
  initialValue: string
  initialStrategy: ContributionStrategyType
  carteiraAtual: ContributionPosition[]
  metasAlocacao: AllocationTarget[]
  metasGlobaisPorAtivo: ContributionAssetTarget[]
  // Score do motor de recomendação (Sprint 16, Fase 5/6, DEC-085/DEC-086) -
  // opcionais: ausentes, o laço guloso se comporta como antes da Fase 5.
  assetScores?: ContributionAssetScore[]
  scoreWeightInBasisPoints?: number
}

export function useContribution({
  initialValue,
  initialStrategy,
  carteiraAtual,
  metasAlocacao,
  metasGlobaisPorAtivo,
  assetScores,
  scoreWeightInBasisPoints,
}: UseContributionOptions) {
  const [valorAporte, setValorAporte] = useState(initialValue)
  const [strategy, setStrategy] =
    useState<ContributionStrategyType>(initialStrategy)
  const [result, setResult] = useState<ContributionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateValue(value: string) {
    setValorAporte(value)
    setResult(null)
    setError(null)
  }

  function updateStrategy(value: ContributionStrategyType) {
    setStrategy(value)
    setResult(null)
    setError(null)
  }

  function simulateContribution(): {
    result: ContributionResult | null
    valorAporteEmCentavos: number | null
  } {
    try {
      const valorAporteEmCentavos = parseContributionValue(valorAporte)
      const simulation = contributionEngine({
        valorAporteEmCentavos,
        carteiraAtual,
        metasAlocacao,
        metasGlobaisPorAtivo,
        strategy,
        assetScores,
        scoreWeightInBasisPoints,
      })

      setResult(simulation)
      setError(null)
      return { result: simulation, valorAporteEmCentavos }
    } catch (caughtError) {
      setResult(null)
      setError(
        caughtError instanceof RangeError &&
          (caughtError.message.startsWith('Informe') ||
            caughtError.message.startsWith('Não há cotações'))
          ? caughtError.message
          : 'Não foi possível simular o aporte com os dados atuais.'
      )
      return { result: null, valorAporteEmCentavos: null }
    }
  }

  return {
    error,
    result,
    simulateContribution,
    strategy,
    updateStrategy,
    updateValue,
    valorAporte,
  }
}
