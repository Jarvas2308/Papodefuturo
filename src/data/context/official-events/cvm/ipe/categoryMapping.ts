import type { OfficialEventTypeV1 } from '../../../../../domain/context'

export function getCvmIpeEventType(
  category: string
): OfficialEventTypeV1 | null {
  switch (category) {
    case 'Acordo de Acionistas':
    case 'Dados Econômico-Financeiros':
    case 'Estatuto Social':
    case 'Reunião da Administração':
      return 'regulatory-filing'
    case 'Assembleia':
      return 'shareholder-meeting'
    case 'Aviso aos Acionistas':
    case 'Comunicação sobre Transação entre Partes Relacionadas':
    case 'Comunicado ao Mercado':
    case 'Informação Prestada às Bolsas Estrangeiras':
      return 'market-communication'
    case 'Documentos de Oferta de Distribuição Pública':
    case 'OPA - Edital de Oferta Pública de Ações':
      return 'offering-or-issuance'
    case 'Fato Relevante':
      return 'material-fact'
    // Categoria real da CVM IPE para anuncio de dividendo/JCP (DEC-082),
    // confirmada por download real de ipe_cia_aberta_2026.csv - resolve a
    // pergunta em aberto de docs/reference/ACOES_BR_SETORES_E_METRICAS.md,
    // secao 6.2. BBAS3 e PSSA3 confirmados com linhas reais nesta
    // categoria; as outras 3 do universo ainda nao verificadas, mas a
    // categoria e' generica (nao especifica por empresa).
    case 'Relatório Proventos':
      return 'dividend-or-distribution'
    case 'Informações Companhias em Falência':
    case 'Informações Companhias em Liquidação':
    case 'Informações de Companhias em Recuperação Judicial ou Extrajudicial':
      return 'legal-or-regulatory-action'
    default:
      return null
  }
}
