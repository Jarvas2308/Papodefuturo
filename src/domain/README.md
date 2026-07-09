# Dominio

Esta pasta reune a primeira fundacao tipada do futuro dominio financeiro do Papo
de Futuro.

## Objetivo

- definir nomes e formatos minimos para entidades financeiras futuras;
- manter o dominio independente de React, componentes, rotas e mocks visuais;
- preparar a proxima etapa de modelo de dados sem criar banco, backend ou
  persistencia real.

## Entidades iniciais

- `Asset`: ativo monitoravel do universo permitido.
- `PortfolioPosition`: posicao consolidada futura da carteira.
- `Purchase`: compra planejada ou registravel futuramente.
- `AssetPrice`: preco de referencia futuro, manual ou vindo de provedor.
- `AllocationTarget`: meta de alocacao por categoria ou ativo.
- `ContributionPlan`: plano futuro de aporte, ainda sem execucao automatica.
- `ContributionPlanItem`: item individual de um plano de aporte.

## Decisoes de representacao

- IDs sao `string` por enquanto, sem assumir formato de banco.
- Dinheiro usa unidades menores inteiras por meio de `MoneyInMinorUnits`.
- `MoneyAmount` combina valor inteiro e moeda (`BRL` ou `USD`).
- Percentuais de metas usam pontos-base (`BasisPoints`), em que `10.000`
  representa `100,00%`.
- Helpers puros validam IDs, dinheiro e metas sem depender de UI ou backend.

## Fora do escopo

- Supabase;
- autenticacao;
- APIs;
- persistencia;
- migrations;
- integracao com telas demonstrativas;
- alteracao de mocks existentes;
- execucao real de compras;
- recomendacao financeira.
