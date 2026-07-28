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

const officialEventsNavigationItem: NavigationItem = {
  to: '/eventos-oficiais',
  label: 'Eventos Oficiais',
  icon: 'officialEvents',
}

const fundamentalsNavigationItem: NavigationItem = {
  to: '/fundamentos',
  label: 'Fundamentos',
  icon: 'fundamentals',
}

export function getNavigationItems(
  officialEventsMode: 'disabled' | 'read-only',
  fundamentalsMode: 'disabled' | 'read-only' = 'disabled'
): NavigationItem[] {
  const optionalItems: NavigationItem[] = []
  if (officialEventsMode !== 'disabled') {
    optionalItems.push(officialEventsNavigationItem)
  }
  if (fundamentalsMode !== 'disabled') {
    optionalItems.push(fundamentalsNavigationItem)
  }
  if (optionalItems.length === 0) return [...navigationItems]
  const historyIndex = navigationItems.findIndex(
    (item) => item.to === '/historico'
  )
  return [
    ...navigationItems.slice(0, historyIndex + 1),
    ...optionalItems,
    ...navigationItems.slice(historyIndex + 1),
  ]
}

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
    title: 'Histórico',
    description: 'Consulte as movimentações demonstrativas da sua carteira.',
  },
  '/eventos-oficiais': {
    title: 'Eventos Oficiais',
    description:
      'Acompanhe documentos regulatórios publicados para os ativos monitorados.',
  },
  '/fundamentos': {
    title: 'Fundamentos',
    description:
      'Fatos contábeis e razões derivadas dos ativos do universo fechado.',
  },
  '/estrategia': {
    title: 'Estratégia',
    description: 'Defina e acompanhe metas demonstrativas de alocação.',
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
