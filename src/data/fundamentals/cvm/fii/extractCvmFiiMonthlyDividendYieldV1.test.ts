import { describe, expect, it } from 'vitest'
import { extractCvmFiiMonthlyDividendYieldRowsV1 } from './extractCvmFiiMonthlyDividendYieldV1'

// 2 linhas reais de inf_mensal_fii_complemento_2025.csv (baixado nesta
// sessão), KNRI11 (CNPJ 12.005.956/0001-65), janeiro e fevereiro de
// 2025 - colunas completas até Percentual_Dividend_Yield_Mes,
// truncadas depois (Percentual_Amortizacao_Cotas_Mes não importa aqui).
const HEADER =
  'CNPJ_Fundo_Classe;Data_Referencia;Versao;Data_Informacao_Numero_Cotistas;Total_Numero_Cotistas;Numero_Cotistas_Pessoa_Fisica;Numero_Cotistas_Pessoa_Juridica_Nao_Financeira;Numero_Cotistas_Banco_Comercial;Numero_Cotistas_Corretora_Distribuidora;Numero_Cotistas_Outras_Pessoas_Juridicas_Financeira;Numero_Cotistas_Investidores_Nao_Residentes;Numero_Cotistas_Entidade_Aberta_Previdencia_Complementar;Numero_Cotistas_Entidade_Fechada_Previdência_Complementar;Numero_Cotistas_Regime_Proprio_Previdencia_Servidores_Publicos;Numero_Cotistas_Sociedade_Seguradora_Resseguradora;Numero_Cotistas_Sociedade_Capitalizacao_Arrendamento_Mercantil;Numero_Cotistas_FII;Numero_Cotistas_Outros_Fundos;Numero_Cotistas_Distribuidores_Fundo;Numero_Cotistas_Outros_Tipos;Valor_Ativo;Patrimonio_Liquido;Cotas_Emitidas;Valor_Patrimonial_Cotas;Percentual_Despesas_Taxa_Administracao;Percentual_Despesas_Agente_Custodiante;Percentual_Rentabilidade_Efetiva_Mes;Percentual_Rentabilidade_Patrimonial_Mes;Percentual_Dividend_Yield_Mes;Percentual_Amortizacao_Cotas_Mes'
const ROW_JAN =
  '12.005.956/0001-65;2025-01-01;1;2025-01-31;291274;;;;;;;;;;;;;;;;4975915121.2;4548826342.26;28204047;161.282752870891;0.000796;0.000011;0.008713;0.002497;0.006216;0'
const ROW_FEB =
  '12.005.956/0001-65;2025-02-01;1;2025-02-28;294028;;;;;;;;;;;;;;;;4981536687.22;4545721683.84;28204047;161.17267439811;0.000724;0.000054;0.005517;-0.000683;0.0062;0'

describe('extractCvmFiiMonthlyDividendYieldRowsV1', () => {
  it('extracts the dividend yield for every month, real KNRI11 fixture', () => {
    const rows = extractCvmFiiMonthlyDividendYieldRowsV1({
      fileName: 'inf_mensal_fii_complemento_2025.csv',
      type: 'complement',
      content: `${HEADER}\n${ROW_JAN}\n${ROW_FEB}\n`,
    })

    expect(rows).toEqual([
      {
        cnpj: '12.005.956/0001-65',
        referenceDate: '2025-01-01',
        version: '1',
        dividendYieldDecimal: { unscaledValue: 6216, scale: 6 },
      },
      {
        cnpj: '12.005.956/0001-65',
        referenceDate: '2025-02-01',
        version: '1',
        dividendYieldDecimal: { unscaledValue: 62, scale: 4 },
      },
    ])
  })

  it('rejects a document not typed as complement', () => {
    expect(() =>
      extractCvmFiiMonthlyDividendYieldRowsV1({
        fileName: 'inf_mensal_fii_geral_2025.csv',
        type: 'general',
        content: `${HEADER}\n${ROW_JAN}\n`,
      })
    ).toThrow('Expected CVM FII complement document')
  })

  it('throws when a required header is missing', () => {
    expect(() =>
      extractCvmFiiMonthlyDividendYieldRowsV1({
        fileName: 'malformed.csv',
        type: 'complement',
        content: 'CNPJ_Fundo_Classe;Data_Referencia\n1;2\n',
      })
    ).toThrow('missing header')
  })

  it('skips a row with a negative dividend yield instead of guessing a sign', () => {
    const rows = extractCvmFiiMonthlyDividendYieldRowsV1({
      fileName: 'inf_mensal_fii_complemento_2025.csv',
      type: 'complement',
      content: `${HEADER}\n12.005.956/0001-65;2025-03-01;1;;;;;;;;;;;;;;;;;;;;;;;;;;-0.01;0\n`,
    })

    expect(rows).toEqual([])
  })

  it('skips a row with a blank dividend yield', () => {
    const rows = extractCvmFiiMonthlyDividendYieldRowsV1({
      fileName: 'inf_mensal_fii_complemento_2025.csv',
      type: 'complement',
      content: `${HEADER}\n12.005.956/0001-65;2025-03-01;1;;;;;;;;;;;;;;;;;;;;;;;;;;;0\n`,
    })

    expect(rows).toEqual([])
  })
})
