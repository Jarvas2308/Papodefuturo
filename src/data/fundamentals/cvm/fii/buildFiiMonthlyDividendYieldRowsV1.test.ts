import { describe, expect, it } from 'vitest'
import { buildFiiMonthlyDividendYieldRowsV1 } from './buildFiiMonthlyDividendYieldRowsV1'

// Mesma fixture real de extractCvmFiiMonthlyDividendYieldV1.test.ts
// (KNRI11, janeiro 2025), mais uma linha de fundo fora do universo
// rastreado pra confirmar o filtro.
const HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Informacao_Numero_Cotistas;Total_Numero_Cotistas;Numero_Cotistas_Pessoa_Fisica;Numero_Cotistas_Pessoa_Juridica_Nao_Financeira;Numero_Cotistas_Banco_Comercial;Numero_Cotistas_Corretora_Distribuidora;Numero_Cotistas_Outras_Pessoas_Juridicas_Financeira;Numero_Cotistas_Investidores_Nao_Residentes;Numero_Cotistas_Entidade_Aberta_Previdencia_Complementar;Numero_Cotistas_Entidade_Fechada_Previdência_Complementar;Numero_Cotistas_Regime_Proprio_Previdencia_Servidores_Publicos;Numero_Cotistas_Sociedade_Seguradora_Resseguradora;Numero_Cotistas_Sociedade_Capitalizacao_Arrendamento_Mercantil;Numero_Cotistas_FII;Numero_Cotistas_Outros_Fundos;Numero_Cotistas_Distribuidores_Fundo;Numero_Cotistas_Outros_Tipos;Valor_Ativo;Patrimonio_Liquido;Cotas_Emitidas;Valor_Patrimonial_Cotas;Percentual_Despesas_Taxa_Administracao;Percentual_Despesas_Agente_Custodiante;Percentual_Rentabilidade_Efetiva_Mes;Percentual_Rentabilidade_Patrimonial_Mes;Percentual_Dividend_Yield_Mes;Percentual_Amortizacao_Cotas_Mes'
const ROW_KNRI11 =
  '12.005.956/0001-65;2025-01-01;1;2025-01-31;291274;;;;;;;;;;;;;;;;4975915121.2;4548826342.26;28204047;161.282752870891;0.000796;0.000011;0.008713;0.002497;0.006216;0'
const ROW_UNTRACKED_FUND =
  '99.999.999/0001-99;2025-01-01;1;2025-01-31;100;;;;;;;;;;;;;;;;1;1;1;1;0;0;0;0;0.01;0'

describe('buildFiiMonthlyDividendYieldRowsV1', () => {
  it('resolves ticker for a tracked fund and shapes the insert row (real KNRI11 fixture)', () => {
    const rows = buildFiiMonthlyDividendYieldRowsV1({
      document: {
        fileName: 'inf_mensal_fii_complemento_2025.csv',
        type: 'complement',
        content: `${HEADER}\n${ROW_KNRI11}\n`,
      },
      sourceArchive: 'inf_mensal_fii_2025.zip',
    })

    expect(rows).toEqual([
      {
        cnpj: '12.005.956/0001-65',
        ticker: 'KNRI11',
        reference_date: '2025-01-01',
        version: 1,
        dividend_yield_unscaled: 6216,
        dividend_yield_scale: 6,
        source_archive: 'inf_mensal_fii_2025.zip',
      },
    ])
  })

  it('skips a fund outside the tracked universe', () => {
    const rows = buildFiiMonthlyDividendYieldRowsV1({
      document: {
        fileName: 'inf_mensal_fii_complemento_2025.csv',
        type: 'complement',
        content: `${HEADER}\n${ROW_UNTRACKED_FUND}\n`,
      },
      sourceArchive: 'inf_mensal_fii_2025.zip',
    })

    expect(rows).toEqual([])
  })

  it('mixes a tracked and untracked fund in the same document, keeps only the tracked one', () => {
    const rows = buildFiiMonthlyDividendYieldRowsV1({
      document: {
        fileName: 'inf_mensal_fii_complemento_2025.csv',
        type: 'complement',
        content: `${HEADER}\n${ROW_UNTRACKED_FUND}\n${ROW_KNRI11}\n`,
      },
      sourceArchive: 'inf_mensal_fii_2025.zip',
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]!.ticker).toBe('KNRI11')
  })
})
