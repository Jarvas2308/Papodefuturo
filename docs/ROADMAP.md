# Papo de Futuro — Roadmap

## Concluído

### Fundação técnica e visual

- Vite, React e TypeScript;
- Tailwind;
- rotas;
- layout responsivo;
- sidebar;
- menu móvel acessível;
- componentes básicos;
- login visual;
- rotas iniciais da fundação visual.

### Visão Geral demonstrativa

- cards;
- gráfico visual;
- distribuição;
- movimentações;
- responsividade;
- acessibilidade;
- mocks centralizados.

### Fundação da tela Minha Carteira (UI demonstrativa)

- cards de resumo;
- distribuição por categoria;
- comparação entre participação atual e meta monitorada;
- filtros locais por categoria;
- tabela semântica para desktop;
- cards responsivos para telas menores;
- 12 ativos do universo documentado;
- estados visuais de ganho, perda e sobrealocação;
- acessibilidade;
- mocks centralizados.

### Fundação documental

- visão de produto;
- arquitetura;
- decisões;
- roadmap;
- reorganização do README e AGENTS.

### Fundação da tela Novo Aporte e motor demonstrativo

- formulário de valor e seleção de estratégia;
- simulação sem persistência;
- estratégia proporcional;
- estratégia por déficit projetado com base no total final da carteira;
- valores monetários representados em centavos;
- arredondamento pelo método dos maiores restos;
- preservação do total exato;
- engine determinístico;
- validação de metas e tratamento de estratégias inválidas;
- integração com as 12 posições mockadas;
- UI responsiva e mensagens de caráter demonstrativo;
- Vitest com 5 arquivos de teste e 60 testes aprovados.

Ainda não existem compra real, persistência, histórico real, Supabase,
autenticação, APIs, recomendação financeira ou IA.

### Publicação inicial no Vercel

- aplicação publicada no Vercel;
- produção ligada à branch `main`;
- configuração SPA por `vercel.json`;
- suporte a acesso direto e refresh das rotas;
- rotas atuais: `/`, `/dashboard`, `/carteira` e `/novo-aporte`;
- deploy sem variáveis de ambiente e ainda baseado em mocks;
- produção disponível em `https://papodefuturo.vercel.app`.

### Fundação da tela Histórico demonstrativo

- rota `/historico`;
- 16 movimentações determinísticas;
- compras, vendas, dividendos, rendimentos e aportes;
- ações brasileiras, fundos imobiliários e ativos internacionais;
- moedas BRL e USD;
- valores monetários representados em centavos;
- cards de resumo calculados a partir dos mocks;
- busca por ticker ou nome;
- filtros por tipo, categoria, mês e status;
- filtros combináveis e ação para limpeza;
- estado vazio;
- tabela semântica no desktop;
- cards responsivos no mobile sem overflow horizontal;
- suporte a acesso direto e refresh;
- Vitest com 6 arquivos de teste e 68 testes aprovados.

Ainda não existem movimentações reais, cadastro, edição, exclusão,
persistência, paginação, backend, autenticação, Supabase, APIs ou dados
financeiros reais.

### Fundação da tela Estratégia demonstrativa

- rota `/estrategia`;
- 3 categorias: Ações brasileiras, Fundos imobiliários e Internacional;
- 12 ativos reutilizados da Carteira;
- metas armazenadas em pontos-base, com 10.000 pontos-base equivalendo a 100%;
- metas das categorias totalizando exatamente 10.000 pontos-base;
- metas internas dos ativos de cada categoria totalizando exatamente 10.000 pontos-base;
- cálculo da participação atual por categoria e da participação atual global por ativo;
- meta global derivada, cálculo de desvios e classificação abaixo, próximo ou acima da meta;
- tolerância visual de ±0,50 ponto percentual;
- cards de resumo calculados e mensagens para estratégias inválidas;
- edição local das metas de categorias e ativos;
- ações para aplicar somente na sessão, cancelar alterações e restaurar a estratégia padrão;
- tabelas semânticas no desktop e cards responsivos no mobile sem overflow horizontal;
- suporte a acesso direto e refresh;
- Vitest com 7 arquivos de teste e 85 testes aprovados.

Ainda não existem persistência, `localStorage`, backend, autenticação, Supabase,
APIs, integração com Novo Aporte, ranking de ativos, plano de compra, confirmação
de operações, IA ou dados financeiros reais.

### Fundação da tela Configurações demonstrativa

- rota `/configuracoes`;
- seções Perfil, Exibição, Planejamento, Notificações e Dados e privacidade;
- mock determinístico;
- moedas BRL e USD;
- localidade `pt-BR`;
- casas decimais de percentuais configuráveis;
- visualização compacta demonstrativa;
- estratégia padrão de aporte;
- lembrete mensal configurável entre os dias 1 e 28;
- notificações demonstrativas;
- validação de nome e e-mail;
- edição local das preferências;
- ações para aplicar somente na sessão, cancelar alterações e restaurar o padrão;
- refresh recuperando o mock original;
- resumos calculados;
- controles e mensagens acessíveis;
- layout responsivo para desktop e mobile sem overflow horizontal;
- suporte a acesso direto e refresh;
- Vitest com 8 arquivos de teste e 101 testes aprovados.

Ainda não existem persistência, `localStorage`, `sessionStorage`, cookies,
backend, autenticação, Supabase, APIs, notificações reais, tema global,
integração das preferências com outras telas ou dados financeiros reais.

### Ajustes iniciais da revisão geral de experiência

- menu móvel com foco contido, `Escape`, retorno de foco e bloqueio de rolagem;
- painel de notificações demonstrativas no cabeçalho;
- linguagem de conta demonstrativa no shell;
- descrições do cabeçalho compartilhado ajustadas para mobile;
- hierarquia do cabeçalho da carteira revisada;
- CTA redundante do Dashboard removido, mantendo uma ação principal para Novo
  Aporte;
- validação final com 9 arquivos de teste e 102 testes aprovados.

Ainda não existem backend, autenticação, Supabase, APIs, persistência real ou
dados financeiros reais.

### Fundação do modelo de dados

- `src/domain/README.md` criado;
- modelos TypeScript isolados em `src/domain/models`;
- entidades iniciais: `Asset`, `PortfolioPosition`, `Purchase`, `AssetPrice`,
  `AllocationTarget`, `ContributionPlan` e `ContributionPlanItem`;
- primitivos compartilhados: `EntityId`, `MoneyAmount`, `MoneyInMinorUnits`,
  `CurrencyCode` e `BasisPoints`;
- dinheiro representado em unidades menores inteiras;
- metas representadas em pontos-base, com `TOTAL_ALLOCATION_BASIS_POINTS = 10_000`;
- IDs definidos como `string`, sem assumir formato de banco;
- helpers puros para validar IDs, dinheiro, pontos-base, soma de pontos-base e
  alocação completa;
- testes unitários para os helpers puros;
- validação final com 10 arquivos de teste e 107 testes aprovados.

Ainda não existem conexão do domínio com telas, mocks, backend, Supabase,
autenticação, APIs, persistência real, `localStorage`, `sessionStorage`, cookies
ou dados financeiros reais.

### Planejamento do schema Supabase

- documento `docs/SUPABASE_SCHEMA_PLAN.md` criado;
- tabelas futuras planejadas: `profiles`, `assets`, `purchases`, `asset_prices`,
  `allocation_targets`, `contribution_plans` e `contribution_plan_items`;
- relacionamentos entre usuário, ativos, compras, preços, metas e planos de aporte
  descritos;
- estratégia futura de RLS documentada, sem aplicação real;
- ordem sugerida de migrations futuras documentada;
- índices planejados e integração gradual com o app descritos;
- escopo limitado a documentação.

Ainda não existem migrations, tabelas, RLS, policies, SQL executado, conexão com
telas, persistência real, autenticação, backend, APIs ou acesso a dados reais.

## Próximo

### Fundação de dados e acesso

Ordem planejada:

1. preparação controlada para Supabase;
2. variáveis de ambiente sem segredos;
3. cliente Supabase isolado, sem conectar telas;
4. esquema inicial;
5. migrations;
6. RLS;
7. Auth;
8. seed do universo fechado;
9. testes de isolamento por usuário.

Todas as etapas devem continuar em ciclos pequenos, revisáveis e sem conectar
telas antes da base estar validada.

## Planejado

### Supabase e persistência

- projeto Supabase;
- variáveis de ambiente;
- Auth;
- esquema inicial;
- migrations;
- RLS;
- seed do universo fechado;
- testes de isolamento por usuário.

### Carteira funcional

- compras;
- edição;
- exclusão;
- consolidação;
- preço médio;
- valor investido;
- valor atual;
- rentabilidade;
- participação;
- histórico.

### Motor estratégico

#### V1

- metas;
- desvios;
- ranking;
- plano de um ativo;
- simulação;
- confirmação.

#### V2

- plano multiativos;
- comparação antes/depois;
- redução do desvio total;
- limites operacionais;
- testes de cenários.

### Comitê de IA

Planejado somente após o domínio determinístico:

- dossiê;
