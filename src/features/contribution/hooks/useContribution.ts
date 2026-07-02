import { useState } from 'react'
import { calculateContribution as contributionEngine } from '../contributionEngine'
import type {
  AllocationTarget,
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
}

export function useContribution({
  initialValue,
  initialStrategy,
  carteiraAtual,
  metasAlocacao,
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

  function simulateContribution() {
    try {
      const valorAporteEmCentavos = parseContributionValue(valorAporte)
      const simulation = contributionEngine({
        valorAporteEmCentavos,
        carteiraAtual,
        metasAlocacao,
        strategy,
      })

      setResult(simulation)
      setError(null)
    } catch (caughtError) {
      setResult(null)
      setError(
        caughtError instanceof RangeError &&
          caughtError.message.startsWith('Informe')
          ? caughtError.message
          : 'Não foi possível simular o aporte com os dados atuais.'
      )
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
