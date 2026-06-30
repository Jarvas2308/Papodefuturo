import type { DashboardMock } from '../features/dashboard/types'

export const dashboardMock: DashboardMock = {
  disclaimer: 'Dados demonstrativos',
  welcome: {
    title: 'Olá, Luis Fernando',
    description:
      'Veja como está a distribuição da sua carteira e acompanhe seus últimos movimentos.',
    actionLabel: 'Planejar novo aporte',
    actionTo: '/novo-aporte',
  },
  summary: [
    {
      id: 'monitored-equity',
      label: 'Patrimônio monitorado',
      value: 'R$ 126.540,80',
      helper: 'Valor atual dos ativos acompanhados',
      icon: 'wallet',
    },
    {
      id: 'total-invested',
      label: 'Total investido',
      value: 'R$ 118.250,00',
      helper: 'Capital acumulado em compras',
      icon: 'landmark',
    },
    {
      id: 'accumulated-return',
      label: 'Rentabilidade acumulada',
      value: '+ R$ 8.290,80',
      helper: 'Desde o início da carteira',
      icon: 'trending-up',
      tone: 'positive',
      badge: '+7,01%',
      detail: 'Resultado positivo demonstrativo',
    },
    {
      id: 'last-contribution',
      label: 'Último aporte',
      value: 'R$ 2.000,00',
      helper: 'Último valor registrado',
      icon: 'calendar',
      detail: '24 de junho de 2026',
    },
  ],
  evolution: {
    title: 'Evolução patrimonial',
    description:
      'Acompanhe a variação demonstrativa do patrimônio nos últimos seis meses.',
    changeLabel: '+29,12% no período',
    chartAriaLabel: 'Gráfico de evolução patrimonial demonstrativa',
    chartAriaDescription:
      'Linha com crescimento de janeiro a junho, saindo de R$ 98.000 e chegando a R$ 126.540,80.',
    points: [
      { month: 'Jan', valueLabel: 'R$ 98.000', x: 18, y: 152 },
      { month: 'Fev', valueLabel: 'R$ 103.500', x: 78, y: 122 },
      { month: 'Mar', valueLabel: 'R$ 107.800', x: 138, y: 98 },
      { month: 'Abr', valueLabel: 'R$ 114.200', x: 198, y: 62 },
      { month: 'Mai', valueLabel: 'R$ 119.900', x: 258, y: 34 },
      { month: 'Jun', valueLabel: 'R$ 126.540,80', x: 318, y: 14 },
    ],
    polylinePoints: '18,152 78,122 138,98 198,62 258,34 318,14',
    areaPath:
      'M 18 152 L 78 122 L 138 98 L 198 62 L 258 34 L 318 14 L 318 176 L 18 176 Z',
  },
  allocation: {
    title: 'Distribuição por categoria',
    description:
      'Compare a participação atual da carteira com a meta monitorada.',
    note: 'A renda fixa representa 15% da estratégia total e é acompanhada fora do sistema.',
    items: [
      {
        id: 'brazilian-stocks',
        category: 'Ações brasileiras',
        current: 37.8,
        currentLabel: '37,8%',
        target: 35.3,
        targetLabel: '35,3%',
        differenceLabel: '+2,5 p.p. acima da meta',
        tone: 'positive',
      },
      {
        id: 'reits',
        category: 'Fundos imobiliários',
        current: 33.6,
        currentLabel: '33,6%',
        target: 35.3,
        targetLabel: '35,3%',
        differenceLabel: '-1,7 p.p. abaixo da meta',
        tone: 'neutral',
      },
      {
        id: 'international',
        category: 'Internacional',
        current: 28.6,
        currentLabel: '28,6%',
        target: 29.4,
        targetLabel: '29,4%',
        differenceLabel: '-0,8 p.p. em relação à meta',
        tone: 'neutral',
      },
    ],
  },
  nextStep: {
    title: 'Pronto para o próximo aporte?',
    description:
      'Use o planejamento de aporte para visualizar como um novo valor poderá contribuir para o equilíbrio da carteira.',
    actionLabel: 'Planejar aporte',
    actionTo: '/novo-aporte',
  },
  recentMovements: {
    title: 'Últimas movimentações',
    description:
      'Registros demonstrativos das movimentações mais recentes da carteira.',
    actionLabel: 'Ver histórico completo',
    actionTo: '/historico',
    items: [
      {
        id: 'movement-1',
        date: '24/06/2026',
        asset: 'BBAS3',
        type: 'Compra',
        quantity: '10 unidades',
        amount: 'R$ 315,00',
      },
      {
        id: 'movement-2',
        date: '12/06/2026',
        asset: 'HGLG11',
        type: 'Compra',
        quantity: '2 unidades',
        amount: 'R$ 322,40',
      },
      {
        id: 'movement-3',
        date: '28/05/2026',
        asset: 'IVVB11',
        type: 'Compra',
        quantity: '3 unidades',
        amount: 'R$ 1.089,60',
      },
      {
        id: 'movement-4',
        date: '10/05/2026',
        asset: 'BBAS3',
        type: 'Compra',
        quantity: '8 unidades',
        amount: 'R$ 248,80',
      },
    ],
  },
  informationStatus: {
    title: 'Status das informações',
    items: [
      {
        id: 'status-1',
        label: '3 categorias monitoradas',
        detail: 'Carteira segmentada para visão demonstrativa do equilíbrio.',
      },
      {
        id: 'status-2',
        label: '12 ativos acompanhados',
        detail:
          'Ativos distribuídos entre categorias nacionais e internacionais.',
      },
      {
        id: 'status-3',
        label: 'Cotações demonstrativas',
        detail:
          'Os valores exibidos nesta etapa não representam mercado em tempo real.',
      },
      {
        id: 'status-4',
        label: 'Atualização real será conectada futuramente',
        detail:
          'Integrações e sincronização automática entram em etapas posteriores.',
      },
    ],
  },
}
