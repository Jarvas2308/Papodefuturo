import { describe, expect, it, vi } from 'vitest'
import { MATURITY_FAIXA_COLUMNS } from './cvm/fii-trimestral/csv'
import { CVM_REAL_ESTATE_FUNDS } from './cvm/fii/funds'
import { extractCvmRealEstateFundVacancy } from './cvm/fii-trimestral/provider'
import type { CvmFiiTrimestralDocument } from './cvm/fii-trimestral/types'
import { createSupabaseRealEstateFundVacancySnapshotStorage } from './supabaseRealEstateFundSnapshotsTrimestral'
import type { FundamentalSnapshotsRpcClientV1 } from './supabaseSnapshotsRpc'

const COMPLEMENT_HEADER = [
  'CNPJ_Fundo_Classe',
  'Data_Referencia',
  'Versao',
  'Percentual_Indexador_Receita_FII_IPCA',
  'Percentual_Indexador_Receita_FII_IGPM',
  'Percentual_Indexador_Receita_FII_INPC',
  'Percentual_Indexador_Receita_FII_INCC',
  ...Object.values(MATURITY_FAIXA_COLUMNS),
].join(';')
const ZERO_MATURITY_FIELDS = Object.keys(MATURITY_FAIXA_COLUMNS)
  .map(() => '0')
  .join(';')

function asRpcClient(client: {
  rpc: FundamentalSnapshotsRpcClientV1['rpc']
}): FundamentalSnapshotsRpcClientV1 {
  return client
}

function buildDocuments(): CvmFiiTrimestralDocument[] {
  const generalContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Fundo_Classe;Codigo_ISIN',
    ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
      [fund.cnpj, '2026-03-31', '2', fund.officialName, fund.isin].join(';')
    ),
  ].join('\n')
  const propertyContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Percentual_Vacancia;Percentual_Receitas_FII',
    ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
      [fund.cnpj, '2026-03-31', '2', 'Imovel unico', '0.1', '1'].join(';')
    ),
  ].join('\n')
  const complementContent = [
    COMPLEMENT_HEADER,
    ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
      [
        fund.cnpj,
        '2026-03-31',
        '2',
        '0.867201',
        '0.002972',
        '0',
        '0',
        ZERO_MATURITY_FIELDS,
      ].join(';')
    ),
  ].join('\n')
  const tenantContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Setor_Atuacao;Percentual_Receitas_FII',
    ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
      [fund.cnpj, '2026-03-31', '2', 'Imovel unico', 'Varejo', '1'].join(';')
    ),
  ].join('\n')
  const resultContent = [
    'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro',
    ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
      [fund.cnpj, '2026-03-31', '2', '56879214.47'].join(';')
    ),
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

function buildRecords() {
  return extractCvmRealEstateFundVacancy({
    archiveId: 'inf_trimestral_fii_2026.zip',
    documents: buildDocuments(),
  })
}

describe('Supabase FII trimestral vacancy snapshot storage', () => {
  it('sends a bulk upsert RPC nulling every mensal-only column', async () => {
    const rpc = vi.fn(async () => ({
      data: { attempted: 1, upserted: 1 },
      error: null,
    }))
    const storage = createSupabaseRealEstateFundVacancySnapshotStorage(
      asRpcClient({ rpc })
    )

    await storage.upsertMany([buildRecords()[0]!])

    expect(rpc).toHaveBeenCalledWith('upsert_fundamental_snapshots_v1', {
      records: [
        expect.objectContaining({
          ticker: CVM_REAL_ESTATE_FUNDS[0]!.ticker,
          kind: 'real-estate-fund',
          source: 'cvm-fii-inf-trimestral',
          period: 'quarterly',
          vacancy_basis_points: 1000,
          ipca_revenue_share_basis_points: 8672,
          igpm_revenue_share_basis_points: 30,
          inpc_revenue_share_basis_points: 0,
          incc_revenue_share_basis_points: 0,
          tenant_concentration_basis_points: 10_000,
          quarterly_net_financial_result_minor: 5_687_921_447,
          wale_months_x100: null,
          net_asset_value_minor: null,
          issued_shares_unscaled: null,
          issued_shares_scale: null,
          shareholder_count: null,
          total_revenue_minor: null,
          net_income_minor: null,
          total_assets_minor: null,
          total_equity_minor: null,
          total_liabilities_minor: null,
          net_assets_minor: null,
          operating_cash_flow_minor: null,
          exercise_order: null,
        }),
      ],
    })
  })

  it('serializes per-property provenance for audit', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }))
    const storage = createSupabaseRealEstateFundVacancySnapshotStorage(
      asRpcClient({ rpc })
    )

    await storage.upsertMany([buildRecords()[0]!])

    expect(rpc).toHaveBeenCalledWith('upsert_fundamental_snapshots_v1', {
      records: [
        expect.objectContaining({
          provenance: expect.objectContaining({
            dataset: 'FII: Documentos: Informe Trimestral Estruturado',
            vacancy: expect.objectContaining({
              method: 'weighted-average-by-revenue-share',
              propertyCount: 1,
              properties: [
                expect.objectContaining({ propertyName: 'Imovel unico' }),
              ],
            }),
          }),
        }),
      ],
    })
  })

  it('does not call Supabase for an empty record list', async () => {
    const rpc = vi.fn()
    const storage = createSupabaseRealEstateFundVacancySnapshotStorage(
      asRpcClient({ rpc })
    )

    await storage.upsertMany([])

    expect(rpc).not.toHaveBeenCalled()
  })

  it('preserves contextual Supabase upsert errors', async () => {
    const storage = createSupabaseRealEstateFundVacancySnapshotStorage(
      asRpcClient({
        rpc: vi.fn(async () => ({ data: null, error: { message: 'denied' } })),
      })
    )

    await expect(storage.upsertMany([buildRecords()[0]!])).rejects.toThrow(
      'denied'
    )
  })

  it('persists a null vacancy when no property rows matched', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }))
    const storage = createSupabaseRealEstateFundVacancySnapshotStorage(
      asRpcClient({ rpc })
    )
    const records = extractCvmRealEstateFundVacancy({
      archiveId: 'inf_trimestral_fii_2026.zip',
      documents: [
        {
          fileName: 'inf_trimestral_fii_geral_2026.csv',
          type: 'general',
          content: [
            'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Fundo_Classe;Codigo_ISIN',
            ...CVM_REAL_ESTATE_FUNDS.map((fund) =>
              [fund.cnpj, '2026-03-31', '2', fund.officialName, fund.isin].join(
                ';'
              )
            ),
          ].join('\n'),
        },
        {
          fileName: 'inf_trimestral_fii_imovel_2026.csv',
          type: 'property',
          content:
            'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Percentual_Vacancia;Percentual_Receitas_FII',
        },
        {
          fileName: 'inf_trimestral_fii_complemento_2026.csv',
          type: 'complement',
          content: COMPLEMENT_HEADER,
        },
        {
          fileName: 'inf_trimestral_fii_imovel_renda_acabado_inquilino_2026.csv',
          type: 'tenant',
          content:
            'CNPJ_Fundo_Classe;Data_Referencia;Versao;Nome_Imovel;Setor_Atuacao;Percentual_Receitas_FII',
        },
        {
          fileName: 'inf_trimestral_fii_resultado_contabil_financeiro_2026.csv',
          type: 'result',
          content:
            'CNPJ_Fundo_Classe;Data_Referencia;Versao;Resultado_Trimestral_Liquido_Financeiro',
        },
      ],
    })

    await storage.upsertMany([records[0]!])

    expect(rpc).toHaveBeenCalledWith('upsert_fundamental_snapshots_v1', {
      records: [
        expect.objectContaining({
          vacancy_basis_points: null,
          ipca_revenue_share_basis_points: null,
          igpm_revenue_share_basis_points: null,
          inpc_revenue_share_basis_points: null,
          incc_revenue_share_basis_points: null,
          tenant_concentration_basis_points: null,
          quarterly_net_financial_result_minor: null,
          wale_months_x100: null,
        }),
      ],
    })
  })
})
