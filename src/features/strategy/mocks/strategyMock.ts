import { contributionMock } from '../../contribution/mocks/contributionMock'
import type { StrategyCategory, StrategyCategoryId } from '../types'
import { cloneStrategy } from '../utils/strategy'

const categoryDefinitions: Array<{
  id: StrategyCategoryId
  name: string
  targetInBasisPoints: number
  assetTargets: Record<string, number>
}> = [
  {
    id: 'brazilian-stocks',
    name: 'Ações brasileiras',
    targetInBasisPoints: 3529,
    assetTargets: {
      bbas3: 2000,
      itsa4: 2000,
      taee11: 2000,
      weg3: 2000,
      pssa3: 2000,
    },
  },
  {
    id: 'real-estate-funds',
    name: 'Fundos imobiliários',
    targetInBasisPoints: 3529,
    assetTargets: {
      knri11: 2500,
      visc11: 2500,
      xplg11: 2500,
      hgru11: 2500,
    },
  },
  {
    id: 'international',
    name: 'Internacional',
    targetInBasisPoints: 2942,
    assetTargets: {
      voo: 3334,
      vnq: 3333,
      vea: 3333,
    },
  },
]

const defaultStrategy: StrategyCategory[] = categoryDefinitions.map(
  (definition) => ({
    id: definition.id,
    name: definition.name,
    targetInBasisPoints: definition.targetInBasisPoints,
    assets: contributionMock.posicoesVisuais
      .filter((position) => position.category === definition.id)
      .map((position) => ({
        assetId: position.id,
        ticker: position.ticker,
        assetName: position.name,
        targetWithinCategoryInBasisPoints: definition.assetTargets[position.id],
      })),
  })
)

export const strategyMock = cloneStrategy(defaultStrategy)
export const strategyCurrentPositions = contributionMock.carteiraAtual
