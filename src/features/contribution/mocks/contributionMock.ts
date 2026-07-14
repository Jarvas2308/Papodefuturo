import { portfolioMock } from '../../../mocks/portfolio'
import type {
  AllocationTarget,
  ContributionPosition,
  ContributionStrategyType,
} from '../types'

export function parseBrazilianCurrencyToCents(value: string): number {
  const match = /^R\$ (\d{1,3}(?:\.\d{3})*|\d+),(\d{2})$/.exec(value)

  if (!match) {
    throw new RangeError(`Invalid Brazilian currency value: ${value}`)
  }

  const integerPart = Number(match[1].replace(/\./g, ''))
  const valueInCents = integerPart * 100 + Number(match[2])

  if (!Number.isSafeInteger(valueInCents) || valueInCents < 0) {
    throw new RangeError(
      `Brazilian currency value exceeds safe range: ${value}`
    )
  }

  return valueInCents
}

const visualPositions = portfolioMock.positions.items
const domainPositions: ContributionPosition[] = visualPositions.map(
  (position) => ({
    assetId: position.id,
    category: position.category,
    currentValueInCents: parseBrazilianCurrencyToCents(position.currentValue),
    unitPriceInCents: Math.round(
      parseBrazilianCurrencyToCents(position.currentValue) /
        Number(position.quantity)
    ),
  })
)
const allocationTargets: AllocationTarget[] = [
  { category: 'brazilian-stocks', targetPercentage: 35.2941 },
  { category: 'real-estate-funds', targetPercentage: 35.2941 },
  { category: 'international', targetPercentage: 29.4118 },
]

const globalAssetTargets = [
  { assetId: 'bbas3', targetInBasisPoints: 706 },
  { assetId: 'itsa4', targetInBasisPoints: 706 },
  { assetId: 'taee11', targetInBasisPoints: 706 },
  { assetId: 'weg3', targetInBasisPoints: 706 },
  { assetId: 'pssa3', targetInBasisPoints: 706 },
  { assetId: 'knri11', targetInBasisPoints: 882 },
  { assetId: 'visc11', targetInBasisPoints: 882 },
  { assetId: 'xplg11', targetInBasisPoints: 882 },
  { assetId: 'hgru11', targetInBasisPoints: 882 },
  { assetId: 'voo', targetInBasisPoints: 981 },
  { assetId: 'vnq', targetInBasisPoints: 981 },
  { assetId: 'vea', targetInBasisPoints: 980 },
]

export const contributionMock = {
  valorInicialInterface: '1000',
  strategyInicial: 'proportional' as ContributionStrategyType,
  carteiraAtual: domainPositions,
  posicoesVisuais: visualPositions,
  metasAlocacao: allocationTargets,
  metasGlobaisPorAtivo: globalAssetTargets,
}
