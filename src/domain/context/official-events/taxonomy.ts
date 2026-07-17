import type {
  OfficialEventAssetIdentityV1,
  OfficialEventSourceV1,
  OfficialEventTaxonomyDefinitionV1,
  OfficialEventTypeV1,
} from './types'

const ALL_SOURCES = ['cvm-ipe', 'cvm-fund-eventual', 'sec-edgar'] as const
const CVM_SOURCES = ['cvm-ipe', 'cvm-fund-eventual'] as const
const ALL_CATEGORIES = [
  'brazilian-stock',
  'real-estate-fund',
  'international-etf',
] as const
const FUND_CATEGORIES = ['real-estate-fund', 'international-etf'] as const

const TAXONOMY = [
  {
    type: 'regulatory-filing',
    description: 'Documento regulatório entregue à autoridade competente.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Identificador regulatório e identidade forte do ativo.',
    exclusionRule: 'Documento apenas hospedado por terceiro.',
    requiresHumanReview: false,
  },
  {
    type: 'earnings-release',
    description: 'Divulgação oficial de resultado.',
    allowedSources: ['cvm-ipe', 'sec-edgar'],
    applicableCategories: ['brazilian-stock', 'international-etf'],
    inclusionRule: 'Categoria ou formulário e período explícitos.',
    exclusionRule: 'Matéria editorial sobre o resultado.',
    requiresHumanReview: false,
  },
  {
    type: 'periodic-report',
    description: 'Relatório periódico obrigatório.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Tipo e período oficiais.',
    exclusionRule: 'Relatório editorial.',
    requiresHumanReview: false,
  },
  {
    type: 'material-fact',
    description: 'Fato relevante formal.',
    allowedSources: CVM_SOURCES,
    applicableCategories: ['brazilian-stock', 'real-estate-fund'],
    inclusionRule: 'Categoria oficial da CVM.',
    exclusionRule: 'Comunicado sem classificação formal.',
    requiresHumanReview: false,
  },
  {
    type: 'market-communication',
    description: 'Comunicado regulatório não classificado como fato relevante.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Categoria ou formulário e ativo identificado.',
    exclusionRule: 'Notícia ou marketing genérico.',
    requiresHumanReview: false,
  },
  {
    type: 'dividend-or-distribution',
    description: 'Deliberação ou anúncio oficial de provento.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Datas e ativo no documento oficial.',
    exclusionRule: 'Estimativa de veículo editorial.',
    requiresHumanReview: false,
  },
  {
    type: 'capital-structure-change',
    description: 'Desdobramento, grupamento, recompra ou mudança de capital.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Ato oficial concluído ou anunciado.',
    exclusionRule: 'Variação de preço.',
    requiresHumanReview: false,
  },
  {
    type: 'offering-or-issuance',
    description: 'Oferta ou emissão de ações, cotas ou classes.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Documento regulatório com identidade forte.',
    exclusionRule: 'Rumor de captação.',
    requiresHumanReview: false,
  },
  {
    type: 'shareholder-meeting',
    description: 'Convocação, ata ou resultado de assembleia.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Documento oficial com data.',
    exclusionRule: 'Agenda editorial.',
    requiresHumanReview: false,
  },
  {
    type: 'management-change',
    description: 'Mudança formal de administração.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Filing ou comunicado regulatório com vigência.',
    exclusionRule: 'Especulação sobre executivo.',
    requiresHumanReview: false,
  },
  {
    type: 'merger-acquisition-or-reorganization',
    description: 'Fusão, aquisição, cisão, incorporação ou reorganização.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Documento regulatório vinculado ao ativo.',
    exclusionRule: 'Discussão setorial sem ato.',
    requiresHumanReview: false,
  },
  {
    type: 'legal-or-regulatory-action',
    description: 'Ação de autoridade diretamente ligada ao ativo.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Filing regulatório e identidade forte.',
    exclusionRule: 'Regulação genérica sem vínculo.',
    requiresHumanReview: false,
  },
  {
    type: 'fund-policy-change',
    description: 'Mudança formal de política ou regulamento do fundo.',
    allowedSources: ALL_SOURCES,
    applicableCategories: FUND_CATEGORIES,
    inclusionRule: 'Regulamento ou filing oficial.',
    exclusionRule: 'Comentário sem mudança formal.',
    requiresHumanReview: false,
  },
  {
    type: 'fund-manager-or-administrator-change',
    description:
      'Troca formal de gestor, administrador ou serviço equivalente.',
    allowedSources: ALL_SOURCES,
    applicableCategories: FUND_CATEGORIES,
    inclusionRule: 'Documento oficial e vigência.',
    exclusionRule: 'Mudança de equipe sem efeito formal.',
    requiresHumanReview: false,
  },
  {
    type: 'other-official-event',
    description: 'Evento regulatório relevante fora das classes anteriores.',
    allowedSources: ALL_SOURCES,
    applicableCategories: ALL_CATEGORIES,
    inclusionRule: 'Identidade forte e justificativa estruturada.',
    exclusionRule: 'Categoria de conveniência para notícia.',
    requiresHumanReview: true,
  },
] as const satisfies readonly OfficialEventTaxonomyDefinitionV1[]

function expectedSource(
  identity: OfficialEventAssetIdentityV1
): OfficialEventSourceV1 {
  if (identity.category === 'brazilian-stock') return 'cvm-ipe'
  if (identity.category === 'real-estate-fund') return 'cvm-fund-eventual'
  return 'sec-edgar'
}

export function getOfficialEventTaxonomyDefinitionsV1(): OfficialEventTaxonomyDefinitionV1[] {
  return TAXONOMY.map((definition) => ({
    ...definition,
    allowedSources: [...definition.allowedSources],
    applicableCategories: [...definition.applicableCategories],
  }))
}

export function getOfficialEventTaxonomyDefinition(
  type: OfficialEventTypeV1
): OfficialEventTaxonomyDefinitionV1 {
  const definition = TAXONOMY.find((candidate) => candidate.type === type)
  if (!definition) throw new Error(`Unsupported official event type: ${type}`)
  return {
    ...definition,
    allowedSources: [...definition.allowedSources],
    applicableCategories: [...definition.applicableCategories],
  }
}

export function assertOfficialEventTypeCompatibility(
  type: OfficialEventTypeV1,
  identity: OfficialEventAssetIdentityV1,
  source: OfficialEventSourceV1
): void {
  if (source !== expectedSource(identity)) {
    throw new Error(
      `Source ${source} is incompatible with ${identity.category}`
    )
  }
  const definition = getOfficialEventTaxonomyDefinition(type)
  if (
    !definition.allowedSources.includes(source) ||
    !definition.applicableCategories.includes(identity.category)
  ) {
    throw new Error(
      `Event type ${type} is incompatible with ${identity.category} and ${source}`
    )
  }
}
