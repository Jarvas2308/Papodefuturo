import { describe, expect, it } from 'vitest'
import { CVM_REAL_ESTATE_FUNDS } from '../fii/funds'
import type { CvmRealEstateFund } from '../fii/types'
import {
  MATURITY_FAIXA_COLUMNS,
  parseCvmFiiTrimestralComplementCsv,
  parseCvmFiiTrimestralGeneralCsv,
  parseCvmFiiTrimestralPropertyCsv,
  parseCvmFiiTrimestralResultCsv,
  parseCvmFiiTrimestralTenantCsv,
} from './csv'
import { extractCvmRealEstateFundVacancy } from './provider'
import type { CvmFiiTrimestralDocument } from './types'

type GeneralFixture = {
  cnpj: string
  referenceDate: string
  version: string
  officialName: string
  isin: string
}

type PropertyFixture = {
  cnpj: string
  referenceDate: string
  version: string
  propertyName: string
  vacancy: string
  revenueShare: string
}

type ComplementFixture = {
  cnpj: string
  referenceDate: string
  version: string
  ipca: string
  igpm: string
  inpc: string
  incc: string
  maturity: Record<string, string>
}

type TenantFixture = {
  cnpj: string
  referenceDate: string
  version: string
  propertyName: string
  sector: string
  revenueShare: string
}

type ResultFixture = {
  cnpj: string
  referenceDate: string
  version: string
  quarterlyNetResult: string
}

function createGeneralFixture(fund: CvmRealEstateFund): GeneralFixture {
  return {
    cnpj: fund.cnpj,
    referenceDate: '2026-03-31',
    version: '2',
    officialName: fund.officialName,
    isin: fund.isin,
  }
}

// Espelha os 100 imoveis reais da HGRU11 com apenas 2 linhas representativas
// (uma vacancia baixa de alta precisao, uma vacancia total de 100%),
// suficiente para exercitar a media ponderada sem replicar o CSV inteiro.
function createPropertyFixtures(fund: CvmRealEstateFund): PropertyFixture[] {
  return [
    {
      cnpj: fund.cnpj,
      referenceDate: '2026-03-31',
      version: '2',
      propertyName: 'Pernambucanas Barra Bonita',
      vacancy: '0.00183809242195829',
      revenueShare: '0.014',
    },
    {
      cnpj: fund.cnpj,
      referenceDate: '2026-03-31',
      version: '2',
      propertyName: 'ITM',
      vacancy: '1',
      revenueShare: '0.005',
    },
  ]
}

// Espelha o indexador e as 13 faixas de vencimento reais da HGRU11
// (Informe Trimestral 2026, tabela `complemento`). Indexador: as 4
// fracoes somam 0.870173, nao 1 - receita nao indexada ou nao alocada.
// Faixas: WALE real esperado ~35,87 meses (3587 x100), incluindo dois
// valores em notacao cientifica (27a30 e 30a33) confirmados no dado real.
function createComplementFixture(fund: CvmRealEstateFund): ComplementFixture {
  return {
    cnpj: fund.cnpj,
    referenceDate: '2026-03-31',
    version: '2',
    ipca: '0.867201',
    igpm: '0.002972',
    inpc: '0',
    incc: '0',
    maturity: {
      ate3Meses: '0.0001466',
      '3a6Meses': '0',
      '6a9Meses': '0',
      '9a12Meses': '0',
      '12a15Meses': '0',
      '15a18Meses': '0',
      '18a21Meses': '0.001068',
      '21a24Meses': '0',
      '24a27Meses': '0.001364',
      '27a30Meses': '6.8E-05',
      '30a33Meses': '7.5E-05',
      '33a36Meses': '0.047827',
      acima36Meses: '0.8196',
      indeterminado: '0',
    },
  }
}

// Espelha dado real do Medcenter (Informe Trimestral 2026): setor Servico
// domina a receita do imovel (88,46%), Comercio fica com o resto.
function createTenantFixtures(fund: CvmRealEstateFund): TenantFixture[] {
  return [
    {
      cnpj: fund.cnpj,
      referenceDate: '2026-03-31',
      version: '2',
      propertyName: 'Medcenter',
      sector: 'Serviço',
      revenueShare: '0.884577',
    },
    {
      cnpj: fund.cnpj,
      referenceDate: '2026-03-31',
      version: '2',
      propertyName: 'Medcenter',
      sector: 'Comércio',
      revenueShare: '0.100799',
    },
  ]
}

// Espelha o resultado financeiro liquido trimestral real da HGRU11.
function createResultFixture(fund: CvmRealEstateFund): ResultFixture {
  return {
    cnpj: fund.cnpj,
    referenceDate: '2026-03-31',
    version: '2',
    quarterlyNetResult: '56879214.47',
  }
}

function generalToCsv(row: GeneralFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.officialName,
    row.isin,
  ].join(';')
}

function propertyToCsv(row: PropertyFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.propertyName,
    row.vacancy,
    row.revenueShare,
  ].join(';')
}

function complementToCsv(row: ComplementFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.ipca,
    row.igpm,
    row.inpc,
    row.incc,
    ...Object.keys(MATURITY_FAIXA_COLUMNS).map((faixa) => row.maturity[faixa]!),
  ].join(';')
}

function tenantToCsv(row: TenantFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.propertyName,
    row.sector,
    row.revenueShare,
  ].join(';')
}

function resultToCsv(row: ResultFixture): string {
  return [
    row.cnpj,
    row.referenceDate,
    row.version,
    row.quarterlyNetResult,
  ].join(';')
}

function buildDocuments(
  general: readonly GeneralFixture[],
  property: readonly PropertyFixture[],
  complement: readonly ComplementFixture[] = CVM_REAL_ESTATE_FUNDS.map(
    createComplementFixture
  ),
  tenant: readonly TenantFixture[] = CVM_REAL_ESTATE_FUNDS.flatMap(
    createTenantFixtures
  ),
  result: readonly ResultFixture[] = CVM_REAL_ESTATE_FUNDS.map(
    createResultFixture
  )
): CvmFiiTrimestralDocument[] {
  const generalContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Fundo_Classe;Codigo_ISIN',
    ...general.map(generalToCsv),
  ].join('\n')
  const propertyContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Percentual_Vacancia;Percentual_Receitas_FII',
    ...property.map(propertyToCsv),
  ].join('\n')
  const complementContent = [
    [
      'CNPJ_Fundo_Classe',
      'Data_Referencia',
      'Versao',
      'Percentual_Indexador_Receita_FII_IPCA',
      'Percentual_Indexador_Receita_FII_IGPM',
      'Percentual_Indexador_Receita_FII_INPC',
      'Percentual_Indexador_Receita_FII_INCC',
      ...Object.values(MATURITY_FAIXA_COLUMNS),
    ].join(';'),
    ...complement.map(complementToCsv),
  ].join('\n')
  const tenantContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Setor_Atuacao;Percentual_Receitas_FII',
    ...tenant.map(tenantToCsv),
  ].join('\n')
  const resultContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro',
    ...result.map(resultToCsv),
  ].join('\n')

  return [
    {
      fileName: 'inf_trimestral_fii_geral_2026.csv',
      type: 'general',
      content: generalContent,
    },
    {
      fileName: 'inf_trimestral_fii_imovel_2026.csv',
      type: 'property',
      content: propertyContent,
    },
    {
      fileName: 'inf_trimestral_fii_complemento_2026.csv',
      type: 'complement',
      content: complementContent,
    },
    {
      fileName: 'inf_trimestral_fii_imovel_renda_acabado_inquilino_2026.csv',
      type: 'tenant',
      content: tenantContent,
    },
    {
      fileName: 'inf_trimestral_fii_resultado_contabil_financeiro_2026.csv',
      type: 'result',
      content: resultContent,
    },
  ]
}

describe('extractCvmRealEstateFundVacancy', () => {
  it('builds one weighted vacancy record per known fund', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const propertyRows = CVM_REAL_ESTATE_FUNDS.flatMap(createPropertyFixtures)
    const documents = buildDocuments(generalRows, propertyRows)

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    expect(records.map((record) => record.ticker)).toEqual(
      CVM_REAL_ESTATE_FUNDS.map((fund) => fund.ticker)
    )

    for (const record of records) {
      expect(record.source).toBe('cvm-fii-inf-trimestral')
      expect(record.period).toBe('quarterly')
      expect(record.referenceDate).toBe('2026-03-31')
      expect(record.filingVersion).toBe(2)
      expect(record.exerciseOrder).toBeNull()
      expect(record.facts.netAssetValue).toBeNull()
      expect(record.facts.issuedShares).toBeNull()
      expect(record.facts.shareholderCount).toBeNull()
      // (0.00183809242195829*0.014 + 1*0.005) / (0.014+0.005) = 0.2645...
      expect(record.facts.vacancyInBasisPoints).toBe(2645)
      expect(record.provenance.vacancy?.propertyCount).toBe(2)
      expect(record.provenance.vacancy?.properties).toHaveLength(2)
      expect(record.sourceDocumentId).toContain('cvm-fii-inf-trimestral')
      // Indexador real da HGRU11: 0.867201 / 0.002972 / 0 / 0.
      expect(record.facts.ipcaRevenueShareInBasisPoints).toBe(8672)
      expect(record.facts.igpmRevenueShareInBasisPoints).toBe(30)
      expect(record.facts.inpcRevenueShareInBasisPoints).toBe(0)
      expect(record.facts.inccRevenueShareInBasisPoints).toBe(0)
      expect(record.provenance.indexador?.ipca.rawValue).toBe('0.867201')
      // Setor Servico domina (88,46%) sobre Comercio (10,08%) no Medcenter.
      expect(record.facts.tenantConcentrationInBasisPoints).toBe(8846)
      expect(record.provenance.tenantConcentration?.dominantSector).toBe(
        'Serviço'
      )
      expect(record.provenance.tenantConcentration?.sectorCount).toBe(2)
      // Resultado financeiro liquido trimestral real da HGRU11.
      expect(record.facts.quarterlyNetFinancialResult).toEqual({
        amountInMinorUnits: 5_687_921_447,
        currency: 'BRL',
      })
      expect(record.provenance.quarterlyNetFinancialResult?.rawValue).toBe(
        '56879214.47'
      )
      // WALE real da HGRU11: media ponderada por receita dos pontos medios
      // das faixas de vencimento, incluindo duas em notacao cientifica.
      expect(record.facts.waleInMonthsScaledBy100).toBe(3587)
      // 13 faixas com prazo definido (todas exceto indeterminado) - mesmo
      // as que valem "0" sao parses validos e entram na provenance, so
      // nao contribuem para o numerador/denominador.
      expect(record.provenance.wale?.faixas).toHaveLength(13)
    }
  })

  it('produces a null WALE when no complement row matches the filing identity', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const documents = buildDocuments(generalRows, [], [])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    for (const record of records) {
      expect(record.facts.waleInMonthsScaledBy100).toBeNull()
      expect(record.provenance.wale).toBeNull()
    }
  })

  it('excludes indeterminado from the WALE calculation even with revenue share', () => {
    const fund = CVM_REAL_ESTATE_FUNDS[0]!
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const allInOneFaixa: ComplementFixture = {
      cnpj: fund.cnpj,
      referenceDate: '2026-03-31',
      version: '2',
      ipca: '0',
      igpm: '0',
      inpc: '0',
      incc: '0',
      maturity: {
        ate3Meses: '0.5',
        '3a6Meses': '0',
        '6a9Meses': '0',
        '9a12Meses': '0',
        '12a15Meses': '0',
        '15a18Meses': '0',
        '18a21Meses': '0',
        '21a24Meses': '0',
        '24a27Meses': '0',
        '27a30Meses': '0',
        '30a33Meses': '0',
        '33a36Meses': '0',
        acima36Meses: '0',
        // Metade da receita nao tem prazo definido - deve ficar fora do
        // calculo, tanto do numerador quanto do denominador.
        indeterminado: '0.5',
      },
    }
    const documents = buildDocuments(generalRows, [], [allInOneFaixa])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    // So sobra a faixa Ate_3Meses (ponto medio 1.5 mes) apos excluir
    // indeterminado - media ponderada = 1.5 mes exatos.
    expect(records[0]!.facts.waleInMonthsScaledBy100).toBe(150)
  })

  it('produces a null quarterly result when a fund has no matching result row', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const documents = buildDocuments(generalRows, [], undefined, undefined, [])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    for (const record of records) {
      expect(record.facts.quarterlyNetFinancialResult).toBeNull()
      expect(record.provenance.quarterlyNetFinancialResult).toBeNull()
    }
  })

  it('preserves a negative quarterly net financial result', () => {
    const fund = CVM_REAL_ESTATE_FUNDS[0]!
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const deficitResult: ResultFixture[] = [
      {
        cnpj: fund.cnpj,
        referenceDate: '2026-03-31',
        version: '2',
        quarterlyNetResult: '-1234.56',
      },
    ]
    const documents = buildDocuments(
      generalRows,
      [],
      undefined,
      undefined,
      deficitResult
    )

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    expect(records[0]!.facts.quarterlyNetFinancialResult).toEqual({
      amountInMinorUnits: -123_456,
      currency: 'BRL',
    })
  })

  it('produces a null tenant concentration when a fund has no matching tenant rows', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const documents = buildDocuments(generalRows, [], undefined, [])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    for (const record of records) {
      expect(record.facts.tenantConcentrationInBasisPoints).toBeNull()
      expect(record.provenance.tenantConcentration).toBeNull()
    }
  })

  it('sums revenue share across properties sharing the same tenant sector', () => {
    const fund = CVM_REAL_ESTATE_FUNDS[0]!
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const splitSectorTenants: TenantFixture[] = [
      {
        cnpj: fund.cnpj,
        referenceDate: '2026-03-31',
        version: '2',
        propertyName: 'Imovel A',
        sector: 'Varejo',
        revenueShare: '0.3',
      },
      {
        cnpj: fund.cnpj,
        referenceDate: '2026-03-31',
        version: '2',
        propertyName: 'Imovel B',
        sector: 'Varejo',
        revenueShare: '0.25',
      },
      {
        cnpj: fund.cnpj,
        referenceDate: '2026-03-31',
        version: '2',
        propertyName: 'Imovel C',
        sector: 'Educação',
        revenueShare: '0.4',
      },
    ]
    const documents = buildDocuments(
      generalRows,
      [],
      undefined,
      splitSectorTenants
    )

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    // Varejo soma 0.3+0.25=0.55, maior que Educacao (0.4) - domina mesmo
    // espalhado em dois imoveis diferentes.
    expect(records[0]!.facts.tenantConcentrationInBasisPoints).toBe(5500)
    expect(records[0]!.provenance.tenantConcentration?.dominantSector).toBe(
      'Varejo'
    )
    expect(records[0]!.provenance.tenantConcentration?.sectorCount).toBe(2)
  })

  it('produces a null indexador when no complement row matches the filing identity', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const documents = buildDocuments(generalRows, [], [])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    for (const record of records) {
      expect(record.facts.ipcaRevenueShareInBasisPoints).toBeNull()
      expect(record.facts.igpmRevenueShareInBasisPoints).toBeNull()
      expect(record.facts.inpcRevenueShareInBasisPoints).toBeNull()
      expect(record.facts.inccRevenueShareInBasisPoints).toBeNull()
      expect(record.provenance.indexador).toBeNull()
    }
  })

  it('rejects an ambiguous complement row for the same filing identity', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const duplicated = [
      createComplementFixture(CVM_REAL_ESTATE_FUNDS[0]!),
      createComplementFixture(CVM_REAL_ESTATE_FUNDS[0]!),
    ]
    const documents = buildDocuments(generalRows, [], duplicated)

    expect(() =>
      extractCvmRealEstateFundVacancy({
        archiveId: 'inf_trimestral_fii_2026.zip',
        documents,
      })
    ).toThrow('Ambiguous CVM FII trimestral complement row')
  })

  it('produces a null vacancy when a fund has no matching property rows', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const documents = buildDocuments(generalRows, [])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    for (const record of records) {
      expect(record.facts.vacancyInBasisPoints).toBeNull()
      expect(record.provenance.vacancy).toBeNull()
    }
  })

  it('rejects an unexpected official name for a known ticker', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map((fund) => ({
      ...createGeneralFixture(fund),
      officialName: 'NOME INESPERADO',
    }))
    const documents = buildDocuments(generalRows, [])

    expect(() =>
      extractCvmRealEstateFundVacancy({
        archiveId: 'inf_trimestral_fii_2026.zip',
        documents,
      })
    ).toThrow('Unexpected official CVM FII trimestral name')
  })

  it('ignores property rows from an older filing version for the same fund', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const staleProperty: PropertyFixture = {
      cnpj: CVM_REAL_ESTATE_FUNDS[0]!.cnpj,
      referenceDate: '2026-03-31',
      version: '1',
      propertyName: 'Imovel desatualizado',
      vacancy: '0.5',
      revenueShare: '1',
    }
    const documents = buildDocuments(generalRows, [staleProperty])

    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents,
    })

    expect(records[0]!.facts.vacancyInBasisPoints).toBeNull()
  })

  it('round-trips through the real trimestral CSV parsers', () => {
    const generalRows = CVM_REAL_ESTATE_FUNDS.map(createGeneralFixture)
    const propertyRows = CVM_REAL_ESTATE_FUNDS.flatMap(createPropertyFixtures)
    const documents = buildDocuments(generalRows, propertyRows)

    const parsedGeneral = parseCvmFiiTrimestralGeneralCsv(
      documents.find((document) => document.type === 'general')!
    )
    const parsedProperty = parseCvmFiiTrimestralPropertyCsv(
      documents.find((document) => document.type === 'property')!
    )
    const parsedComplement = parseCvmFiiTrimestralComplementCsv(
      documents.find((document) => document.type === 'complement')!
    )
    const parsedTenant = parseCvmFiiTrimestralTenantCsv(
      documents.find((document) => document.type === 'tenant')!
    )
    const parsedResult = parseCvmFiiTrimestralResultCsv(
      documents.find((document) => document.type === 'result')!
    )

    expect(parsedGeneral).toHaveLength(CVM_REAL_ESTATE_FUNDS.length)
    expect(parsedProperty).toHaveLength(CVM_REAL_ESTATE_FUNDS.length * 2)
    expect(parsedComplement).toHaveLength(CVM_REAL_ESTATE_FUNDS.length)
    expect(parsedTenant).toHaveLength(CVM_REAL_ESTATE_FUNDS.length * 2)
    expect(parsedResult).toHaveLength(CVM_REAL_ESTATE_FUNDS.length)
  })
})
