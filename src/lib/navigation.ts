import type { NavigationItem, PageCopy } from '../types/navigation'

export const navigationItems: NavigationItem[] = [
  {
    to: '/dashboard',
    label: 'Visão Geral',
    icon: 'dashboard',
  },
  {
    to: '/carteira',
    label: 'Minha Carteira',
    icon: 'portfolio',
  },
  {
    to: '/novo-aporte',
    label: 'Novo Aporte',
    icon: 'contribution',
  },
  {
    to: '/historico',
    label: 'Histórico',
    icon: 'history',
  },
  {
    to: '/estrategia',
    label: 'Estratégia',
    icon: 'strategy',
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: 'settings',
  },
]

export const pageCopyByPath: Record<string, PageCopy> = {
  '/dashboard': {
    title: 'Visão Geral',
    description: 'Acompanhe a evolução e a distribuição da sua carteira.',
  },
  '/carteira': {
    title: 'Minha Carteira',
    description: 'Visualize suas posições, compras e resultados consolidados.',
  },
  '/novo-aporte': {
    title: 'Novo Aporte',
    description: 'Planeje a melhor distribuição para o próximo aporte.',
  },
  '/historico': {
    title: 'Histórico de Compras',
    description: 'Consulte e gerencie as operações registradas.',
  },
  '/estrategia': {
    title: 'Estratégia de Alocação',
    description: 'Acompanhe as metas definidas para cada categoria e ativo.',
  },
  '/configuracoes': {
    title: 'Configurações',
    description: 'Gerencie preferências e informações da conta.',
  },
}

export function getPageCopyFromPath(pathname: string): PageCopy {
  return (
    pageCopyByPath[pathname] ?? {
      title: 'Papo de Futuro',
      description: 'Inteligência para o seu próximo aporte',
    }
  )
}
