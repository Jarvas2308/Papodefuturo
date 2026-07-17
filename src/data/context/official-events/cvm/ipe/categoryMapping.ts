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
    case 'Informações Companhias em Falência':
    case 'Informações Companhias em Liquidação':
    case 'Informações de Companhias em Recuperação Judicial ou Extrajudicial':
      return 'legal-or-regulatory-action'
    default:
      return null
  }
}
