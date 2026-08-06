# Papo de Futuro — Roadmap

## Concluído

Cada subseção abaixo é um registro histórico: descreve o estado ao final
daquele ciclo, incluindo as limitações que valiam naquele momento. Frases como
"migration ainda não aplicada" ou "runtime permanece `disabled`" continuam
válidas como história e não devem ser reescritas. O estado atual consolidado
está nas seções `## Próximo` e `## Fase operacional` ao final deste documento.

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

Ainda não existiam, nesse ciclo documental, migrations aplicadas, tabelas reais,
RLS aplicado, policies reais, conexão com telas, persistência real,
autenticação, backend, APIs ou acesso a dados reais.

### Estado aplicado inicial do Supabase

- migration inicial de `profiles` aplicada no Supabase real;
- migrations corretivas dos advisors iniciais aplicadas;
- tabela real `public.profiles` criada;
- `public.profiles` com RLS habilitado e 0 linhas;
- primary key `profiles.id`;
- foreign key `profiles.id -> auth.users.id`;
- colunas `id`, `name`, `created_at` e `updated_at` registradas;
- policies de `profiles` otimizadas com `(select auth.uid())`;
- `public.set_updated_at()` corrigida com `search_path` fixo;
- execução pública de `public.rls_auto_enable()` revogada;
- advisors de segurança e performance limpos;
- `public.profiles` foi a primeira tabela real aplicada; o estado atual completo
  do banco também inclui `public.assets`, `public.purchases`,
  `public.asset_prices` e `public.allocation_targets`, conforme seções
  seguintes;
- app ainda usa mocks e dados demonstrativos;
- nenhuma tela foi conectada ao Supabase;
- nenhum dado real foi inserido.

Ainda não existem autenticação frontend real, backend, APIs, persistência real no
app, repositories conectados às telas ou substituição dos mocks por dados reais.

### Estado aplicado de assets no Supabase

- migration inicial de `assets` versionada e aplicada no Supabase real;
- tabela real `public.assets` criada;
- `public.assets` com RLS habilitado e 0 linhas;
- primary key `assets.id`;
- foreign key `assets.user_id -> auth.users.id`;
- colunas `id`, `user_id`, `ticker`, `name`, `category`, `market`, `currency`,
  `status`, `created_at` e `updated_at` registradas;
- constraints para ticker e nome não vazios, categorias do domínio atual,
  mercados `BR`, `US` e `INTERNAL`, moedas `BRL` e `USD`, e status `active` e
  `inactive`;
- policies de select, insert, update e delete para `authenticated`, usando
  `(select auth.uid())`;
- índice único `assets_user_ticker_unique` por `user_id + upper(ticker)`;
- índices auxiliares `assets_user_id_idx`, `assets_user_id_category_idx` e
  `assets_user_id_status_idx`;
- trigger `set_assets_updated_at` usando `public.set_updated_at()`;
- advisors de segurança limpos;
- avisos de performance `unused_index` documentados como informativos e
  esperados enquanto a tabela tem 0 linhas e o app não faz consultas reais;
- app ainda usa mocks e dados demonstrativos;
- nenhuma tela foi conectada ao Supabase;
- nenhum dado real foi inserido.

Ainda não existem compras reais pela interface, cotações reais, persistência nas
telas, autenticação frontend real, backend, APIs, repositories conectados às
telas ou substituição dos mocks por dados reais.

### Estado aplicado de purchases no Supabase

- migration inicial de `purchases` versionada e aplicada no Supabase real;
- tabela real `public.purchases` criada;
- `public.purchases` com RLS habilitado e 0 linhas;
- primary key `purchases.id`;
- foreign keys `purchases.user_id -> auth.users.id` e
  `purchases.asset_id -> public.assets.id`;
- colunas `id`, `user_id`, `asset_id`, `quantity`, `unit_price_minor`,
  `total_amount_minor`, `currency`, `purchased_at`, `status`, `notes`,
  `created_at` e `updated_at` registradas;
- constraints para quantidade positiva, valores monetários não negativos, moedas
  `BRL` e `USD`, status `planned`, `confirmed` e `cancelled`, e notas nulas ou
  não vazias;
- policies de select, insert, update e delete para `authenticated`, usando
  `(select auth.uid())`;
- policies de insert e update validando que o ativo pertence ao usuário
  autenticado;
- índices auxiliares `purchases_user_id_idx`, `purchases_asset_id_idx`,
  `purchases_user_asset_idx`, `purchases_user_purchased_at_idx` e
  `purchases_user_status_idx`;
- trigger `set_purchases_updated_at` usando `public.set_updated_at()`;
- advisors de segurança limpos;
- avisos de performance `unused_index` documentados como informativos e
  esperados enquanto a tabela tem 0 linhas e o app não faz consultas reais;
- app ainda usa mocks e dados demonstrativos;
- nenhuma tela foi conectada ao Supabase;
- nenhum dado real foi inserido.

Ainda não existem compras reais pela interface, cotações reais, persistência nas
telas, autenticação frontend real, backend, APIs, repositories conectados às
telas ou substituição dos mocks por dados reais.

### Estado aplicado de asset_prices no Supabase

- migration inicial de `asset_prices` versionada e aplicada no Supabase real;
- tabela real `public.asset_prices` criada;
- `public.asset_prices` com RLS habilitado e 0 linhas;
- primary key `asset_prices.id`;
- foreign keys `asset_prices.user_id -> auth.users.id` e
  `asset_prices.asset_id -> public.assets.id`;
- colunas `id`, `user_id`, `asset_id`, `price_minor`, `currency`, `priced_at`,
  `source` e `created_at` registradas;
- valores monetários representados em unidades menores inteiras por
  `price_minor`;
- constraints para preço positivo, moedas `BRL` e `USD`, e source `manual` ou
  `market-provider`;
- histórico de preços preparado por ativo e data de preço;
- policies de select, insert, update e delete para `authenticated`, usando
  `(select auth.uid())`;
- policies de insert e update validando que o ativo pertence ao usuário
  autenticado;
- índices auxiliares `asset_prices_user_id_idx`, `asset_prices_asset_id_idx`,
  `asset_prices_user_asset_idx`, `asset_prices_user_priced_at_idx` e
  `asset_prices_user_asset_priced_at_idx`;
- advisors de segurança limpos;
- avisos de performance `unused_index` documentados como informativos e
  esperados enquanto a tabela tem 0 linhas e o app não faz consultas reais;
- app ainda usa mocks e dados demonstrativos;
- nenhuma tela foi conectada ao Supabase;
- nenhum dado real foi inserido.

Ainda não existem cotações reais pela interface, persistência nas telas,
autenticação frontend real, backend, APIs, repositories conectados às telas ou
substituição dos mocks por dados reais.

### Estado aplicado de allocation_targets no Supabase

- migration real `20260713134642_create_allocation_targets` aplicada no Supabase
  real, correspondente ao arquivo versionado
  `supabase/migrations/20260711200225_create_allocation_targets.sql`;
- tabela real `public.allocation_targets` criada;
- `public.allocation_targets` com RLS habilitado e 0 linhas;
- primary key `allocation_targets.id`;
- foreign keys `allocation_targets.user_id -> auth.users.id` e
  `allocation_targets.asset_id -> public.assets.id`;
- colunas `id`, `user_id`, `target_type`, `asset_id`, `category`,
  `target_basis_points`, `created_at` e `updated_at` registradas;
- `target_type` aceita somente `category` e `asset`;
- categorias alinhadas ao domínio atual;
- `target_basis_points` aceita valores entre 0 e 10.000;
- meta `category` exige `asset_id is null`;
- meta `asset` exige `asset_id is not null`;
- trigger `set_allocation_targets_updated_at` usando `public.set_updated_at()`;
- policies de select, insert, update e delete para `authenticated`, usando
  `(select auth.uid())`;
- policies de insert e update validando que o ativo pertence ao usuário
  autenticado;
- policies de insert e update validando que `assets.category` corresponde a
  `allocation_targets.category`;
- índices únicos parciais por usuário/categoria e por usuário/ativo;
- índices auxiliares por usuário, usuário + tipo de meta e ativo não nulo;
- advisors de segurança limpos;
- avisos de performance `unused_index` documentados como informativos e
  esperados enquanto a tabela tem 0 linhas e o app não faz consultas reais;
- app ainda usa mocks e dados demonstrativos;
- nenhuma tela foi conectada ao Supabase;
- nenhum dado real foi inserido.

Ainda não existem metas reais pela interface, persistência nas telas,
autenticação frontend real, backend, APIs, repositories conectados às telas ou
substituição dos mocks por dados reais.

### Decisão arquitetural sobre planos de aporte persistidos

- `ContributionPlan` representa um resultado futuro do motor estratégico;
- `ContributionPlanItem` representa itens de uma sugestão ou plano futuro;
- `plannedPurchase` indica que o modelo ainda depende da definição do fluxo
  entre plano aceito e compra registrada;
- persistir planos agora anteciparia o histórico de decisões antes de existir o
  fluxo real de Auth, carteira, estratégia e repositories;
- `contribution_plans` e `contribution_plan_items` continuam planejadas e foram
  explicitamente adiadas, não canceladas;
- essas tabelas devem ser revisitadas quando o motor estratégico real e o fluxo
  de apresentação, aceite e confirmação estiverem sendo conectados;
- nenhuma migration dessas tabelas deve ser criada neste momento.

### Motor Estratégico V2 multiativos

- fundação, carteira autenticada e compras reais preservadas;
- Motor Estratégico V1 mantido como etapa histórica;
- dados de mercado automáticos integrados ao universo fechado;
- metas globais individuais totalizando exatamente 10.000 basis points;
- simulação gulosa de uma unidade inteira por iteração;
- comparação exata do desvio total com intermediários em `BigInt`;
- plano limitado a até 3 ativos distintos;
- saldo não alocado quando nenhuma unidade acessível melhora estritamente a
  carteira;
- resumo técnico de antes, depois e redução do desvio;
- modo demo e estratégia proporcional preservados.

### Dossiê Técnico V1

- contrato `technical-dossier.v1` puro, determinístico e derivado em memória;
- consolidação do `PortfolioSnapshot` sem recalcular a carteira;
- estratégia e metas globais associadas a partir das fontes existentes;
- últimas cotações e último câmbio USD/BRL selecionados pelos helpers
  compartilhados;
- plano target-allocation e impactos copiados diretamente do Motor V2;
- cobertura de preços e câmbio explicitada sem criar política de freshness;
- limitações contratuais explícitas, incluindo simulação, ausência de
  persistência, algoritmo guloso de unidades inteiras e limite de três ativos;
- ranking técnico não inventado enquanto não for exposto pelo Motor V2;
- sem tabela, migration, persistência, UI, IA ou chamadas externas.

### Fundação de Fundamental Facts V1

- contrato `fundamental-facts.v1` puro, determinístico e em memória;
- união discriminada para ações brasileiras, FIIs e ETFs internacionais;
- fatos contábeis monetários signed em unidades menores inteiras;
- preservação de período, fonte, documento, data de referência e moeda;
- validações runtime de categoria, kind, source, período, datas e duplicidade;
- cobertura explícita de ativos e snapshots sem política de freshness;
- ausência de derivados, valuation, ranking, score ou recomendação;
- sem provider, tabela, migration, persistência, UI ou integração com o Dossiê
  Técnico V1.

### Provider CVM V1 para ações brasileiras

- universo fechado: BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3;
- arquivos oficiais DFP e ITR consolidados, com leitura de ZIP Windows-1252 e
  CSV separado por ponto e vírgula;
- seleção do filing mais recente, maior `VERSAO` numérica e exercício corrente;
- parsing monetário decimal exato com `BigInt`, escala oficial e validação de
  safe integer em unidades menores;
- `netIncome`, `totalAssets`, `totalEquity` e `operatingCashFlow` selecionados
  por códigos e descrições oficiais auditados;
- `totalRevenue` preservado como `null` por decisão explícita de comparabilidade
  semântica;
- seleção de patrimônio líquido por descrição exata, sem mapping por ticker ou
  código universal presumido;
- proveniência factual de demonstrativo, conta, descrição, data, versão e
  exercício;
- `sourceDocumentId` determinístico;
- ingestão testável com fetch e storage injetados;
- migration global `fundamental_snapshots` versionada e aplicada, com upsert
  idempotente, RLS, leitura autenticada e tipos sincronizados na PR #73;
- sem scheduler, integração com UI, ratios, score, ranking, IA ou alteração do
  Motor V2 e do Dossiê Técnico.

A tabela permanece vazia e sem integração com o runtime ou com as telas.

### Provider CVM V1 para fundos imobiliários

- universo fechado: KNRI11, VISC11, XPLG11 e HGRU11;
- pacote META e arquivo anual do Informe Mensal de FII auditados;
- CSVs oficiais `geral` e `complemento`, em Windows-1252 e separados por ponto
  e vírgula;
- vínculo ticker/fundo fechado e auditável por CNPJ, denominação oficial e ISIN;
- seleção determinística da competência mais recente e maior `Versao` numérica;
- patrimônio líquido em centavos por parsing decimal exato com `BigInt`;
- cotas emitidas decimais preservadas por coeficiente inteiro seguro e escala,
  sem arredondamento, truncamento ou ponto flutuante;
- número de cotistas aceito somente como inteiro seguro;
- ausência oficial preservada como `null`, sem conversão para zero;
- proveniência factual com arquivo, archiveId, colunas e valores oficiais;
- `sourceDocumentId` determinístico e ingestão com fetch e storage injetados;
- migration não destrutiva integrada na PR #74 e aplicada no Supabase real como
  `20260716172033_generalize_fundamental_snapshots_for_fii`;
- tipos Supabase sincronizados e adapters isolados de storage e repository para
  ações e FIIs;
- provider de ações, Motor V2, Dossiê Técnico, UI e modo demo preservados;
- sem scheduler, ratios, score, ranking, IA ou integração runtime.

A tabela `fundamental_snapshots` permanece vazia, com RLS, leitura para
`authenticated` e escrita privilegiada para `service_role` preservadas. Ainda
não existem ingestão real, scheduler, integração runtime ou UI, derivados ou
IA.

### Provider SEC N-PORT V1 para ETFs internacionais

- universo fechado: VOO, VNQ e VEA;
- fontes oficiais SEC Submissions API e documentos Form N-PORT;
- descoberta determinística em filings recentes e históricos;
- suporte a `NPORT-P` e `NPORT-P/A`, com precedência determinística de
  amendments para o mesmo período;
- identidade fechada e validada por CIK, registrant, series ID, nome da série,
  class ID e nome da classe;
- fatos financeiros tratados no escopo da série, com todos os class IDs do XML
  preservados e a classe ETF usada apenas no mapping para o ticker;
- seleção do documento primário e parsing XML com namespace oficial;
- ativos totais, passivos totais e patrimônio líquido preservados em centavos
  de USD por parsing decimal exato com `BigInt`;
- proveniência factual com accession number, documento, datas, formulário e
  identidades oficiais;
- fetch e storage injetados; testes completamente sem rede;
- User-Agent identificável e fair access obrigatórios em execução server-side;
- migration não destrutiva versionada para adicionar `international-etf` e
  `sec-nport` à tabela global, integrada na PR #76 e aplicada como
  `20260716203927_generalize_fundamental_snapshots_for_sec_nport`;
- tipos Supabase sincronizados e adapter isolado de storage, repository e
  mapper para ETFs, com validação integral da proveniência SEC;
- providers CVM, Motor V2, Dossiê Técnico, UI e modo demo preservados;
- sem scheduler, ingestão real, runtime, UI, derivados, ranking, score ou IA.

A tabela `fundamental_snapshots` permanece vazia no Supabase real, com RLS,
leitura para `authenticated`, escrita privilegiada para `service_role`, trigger
e identidade lógica preservados. Nenhuma ingestão ou inserção real foi
executada neste ciclo.

### Fundamental Derived Facts V1

- contrato `fundamental-derived-facts.v1` puro, determinístico e em memória;
- camada separada de `FundamentalFactsV1`, sem mutar ou substituir fatos;
- um snapshot derivado para cada snapshot factual, com asset, período, fonte,
  data e documento preservados;
- razão patrimônio líquido/ativos para ações brasileiras;
- valor patrimonial por cota para FIIs, preservando a quantidade decimal exata;
- razões passivos/ativos e patrimônio líquido/ativos e delta de reconciliação
  para ETFs internacionais;
- escala fixa de 1.000.000, `BigInt` intermediário e arredondamento
  half-away-from-zero;
- indisponibilidades explícitas para input ausente, denominador não positivo,
  moeda divergente e aritmética insegura;
- cobertura por classe e limitações contratuais em ordem estável;
- sem preço de mercado, crescimento, score, ranking, recomendação ou alteração
  do Motor V2;
- sem tabela, migration, persistência, runtime, UI, APIs ou chamadas externas;
- PR #77 integrada para o adapter SEC factual; providers e adapters das três
  classes estão disponíveis e `fundamental_snapshots` permanece vazia.

O ciclo de Fundamentos está concluído. A PR #78 integrou a camada de derivados
fundamentalistas auditáveis, preservando fatos, Motor V2 e Dossiê Técnico.

### Domínio puro de eventos oficiais V1

- política News & Events V1 concluída e integrada pela PR #79;
- domínio puro integrado pela PR #80;
- contrato `official-asset-event.v1` puro, determinístico e em memória;
- registry fechado e auditável dos 12 ativos com identidade regulatória forte;
- taxonomia fechada de 15 tipos, sem sentimento, score, ranking ou IA;
- precisão temporal explícita, sem converter data civil em meia-noite;
- identidade documental, URL canônica e fingerprint determinístico de fallback;
- deduplicação que distingue duplicatas de conflitos de payload;
- amendments, correções, substituições e cancelamentos preservados como
  histórico, com relações resolvidas e não resolvidas explícitas;
- domínio sem dependência de provider, banco, migration, Supabase, runtime, UI
  ou chamada externa;
- contexto opcional que nunca altera nem bloqueia Motor V2 ou plano de aporte.

### Provider CVM IPE V1 para eventos de ações

- universo fechado: BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3;
- arquivo anual oficial IPE em ZIP, com CSV Windows-1252 e schema de 13 colunas
  auditado;
- fetcher obrigatoriamente injetado e limites defensivos de arquivo, entradas,
  linhas e colunas;
- identidade validada por código CVM, CNPJ e registry canônico;
- denominações alternativas oficiais em allowlist fechada específica do IPE,
  sem fuzzy matching e sem alterar a identidade canônica do ativo;
- mapping fechado das categorias oficiais, sem classificação por assunto ou
  texto livre;
- datas civis preservadas sem timezone inventado e documentos não baixados;
- `Tipo_Apresentacao` preservado apenas como metadado bruto, com todos os eventos
  mantidos como `original` e sem revisão ou status inferido;
- eventos construídos pelo domínio, validados em runtime e deduplicados em
  memória, com rejeições e conflitos estruturados;
- contadores distinguem registros aceitos, duplicatas exatas e payloads
  conflitantes sem descarte silencioso;
- sem storage, migration, Supabase, scheduler, ingestão real, runtime, UI,
  sentimento, score, ranking ou IA;
- contexto opcional que nunca altera nem bloqueia Motor V2 ou plano de aporte.

### Provider CVM Fund Delivery FII Events V1

- universo fechado: KNRI11, VISC11, XPLG11 e HGRU11;
- fonte mensal oficial `fi_entrega_documento_<YYYYMM>.csv`, extraída do ZIP sem
  materializar ou interpretar o CSV diário;
- associação exclusiva por CNPJ exato ao registry e mapping fechado de ticker;
- API pública por ano e mês numéricos, com mês de referência derivado
  internamente;
- `INFORM MENSAL` e `INFO TRIM FII` classificados como `periodic-report`; todos
  os demais tipos rejeitados de forma estruturada;
- data de entrega estrita reduzida somente à data civil e competência validada
  sem timezone inventado;
- identidade documental por sistema de origem normalizado e codificado mais ID
  oficial em decimal canônico, também preservado como identificador regulatório;
- título determinístico com tipo documental e início/fim da competência;
- eventos sempre `original`, sem URL, protocolo, fingerprint ou relação de
  revisão inventados;
- limites defensivos de ZIP, entradas, tamanho descomprimido, CSV, linhas e 11
  colunas oficiais;
- deduplicação em memória com duplicatas e conflitos explícitos;
- sem storage, migration, Supabase, scheduler, ingestão real, runtime, UI,
  sentimento, score, ranking ou IA.

### Provider SEC EDGAR ETF Events V1

- universo fechado: VOO, VNQ e VEA, com identidades provenientes do registry;
- Submissions API usada somente como índice e Filing Detail canônica obrigatória
  para confirmar CIK, série e class/contract ID;
- quatro forms de relatório periódico (`NPORT-P`, `N-CEN`, `N-CSR`, `N-CSRS`) e
  dois forms de assembleia (`DEF 14A`, `DEFA14A`) em mapping fechado;
- forms ambíguos e todas as variantes `/A` ignorados sem baixar detalhes;
- accession como identidade documental e prefixo usado somente na URL Archives,
  nunca como identidade do ETF;
- `acceptanceDateTime` UTC como publicação e `reportDate`, com fallback para
  `filingDate`, como ocorrência civil;
- todos os eventos `original`, sem supersedes, resumo, sentimento, score ou IA;
- User-Agent obrigatório, chamadas sequenciais, intervalo mínimo de 500 ms,
  cache por URL e limites defensivos de bytes e requisições;
- somente `filings.recent`; histórico necessário em `filings.files` interrompe o
  lote, e SGML e `index.json` permanecem fora desta versão;
- primary document nunca baixado e mudanças estruturais da Filing Detail
  interrompem o lote sem omissão silenciosa;
- construção e deduplicação oficiais do domínio, com duplicatas, conflitos,
  rejeições e contadores explícitos;
- sem storage, migration, Supabase, scheduler, ingestão real, runtime ou UI.

### Contrato global de storage de eventos oficiais V1

- record `official-asset-event-storage-record.v1` global e lossless;
- `eventId` como identidade determinística e `deduplicationKey` como chave natural;
- mapeamento de ida e volta com identidade regulatória, temporalidade e proveniência;
- validação runtime estrita e preparação determinística de batches;
- interface de escrita provider-agnostic com resultados e conflitos estruturados;
- upsert idempotente, preservação do menor `ingestedAt` e rejeição de divergência
  na mesma versão;
- histórico de amendments preservado sem sobrescrita destrutiva;
- implementação em memória somente como referência e suporte de testes;
- esse ciclo não incluiu runtime ou repository de leitura.

### Migration global de eventos oficiais V1

- tabela global `official_asset_events` com as 58 propriedades lossless do record;
- `event_id` como PK e `deduplication_key` como unique natural;
- identidade regulatória discriminada por classe e identidade documental
  preservada separadamente;
- datas civis em `date`, instantes e timestamps lossless em `text`, sem
  meia-noite inventada;
- estruturas auditáveis em `jsonb`, com validação profunda mantida no runtime;
- RLS habilitado, `anon` sem acesso, `authenticated` somente leitura e escrita
  reservada a `service_role`;
- migration versionada e ainda não aplicada ao Supabase remoto;
- esse ciclo não incluiu ingestão, scheduler, backfill, repository ou
  integração runtime.

### Adapter Supabase de eventos oficiais V1

- implementação de `OfficialAssetEventStorageV1` com client server-side injetado;
- mapping explícito e defensivo dos 58 campos canônicos;
- RPC transacional com `SECURITY DEFINER`, `search_path` fixo e lock de writers;
- batch atômico de até 500 records, sem fracionamento silencioso;
- conflitos classificados antes de qualquer escrita;
- stale ignorado, divergência na mesma versão preservada como conflito e menor
  `ingestedAt` mantido;
- `service_role` com execução exclusiva da RPC e sem escrita direta na tabela;
- `authenticated` somente leitura e `anon` sem acesso preservados;
- migration complementar e adapter versionados, ainda sem aplicação remota,
  scheduler, backfill, repository ou UI.

### Executor server-side de eventos oficiais V1

- jobs explícitos para CVM IPE, CVM Fund Delivery e SEC EDGAR;
- execução sequencial, ordem preservada e falha isolada por job;
- persistência exclusivamente por `persistOfficialAssetEventsV1` e pelo storage
  injetado;
- fetch HTTPS com allowlist exata, redirect bloqueado, timeout e abort;
- User-Agent SEC, relógio, fetch e RPC client injetados;
- resultados auditáveis com contadores, rejeições, conflitos e persistência;
- fronteira exclusiva de servidor, sem segredo, env, singleton ou export para o
  browser;
- esse ciclo não incluiu scheduler, checkpoint, backfill, execução remota,
  repository ou UI.

### Backfill controlado e reiniciável de eventos oficiais V1

- plano explícito e fechado para CVM IPE, CVM Fund Delivery e SEC EDGAR;
- `planId`, hash e `jobId` determinísticos, sem UUID ou relógio ambiental;
- preview puro, sem checkpoint, executor, storage, Supabase ou rede;
- jobs cronológicos por ano, mês e janela civil inclusiva;
- checkpoint global sem usuário, carteira ou ativo;
- leases com owner explícito, recuperação após expiração e sem heartbeat;
- retry de falha somente em nova etapa explícita, dentro do limite configurado;
- conflito nunca repetido automaticamente;
- `failureMode` explícito para continuar ou pausar com devolução dos jobs não
  iniciados;
- orquestrador limitado por `maxJobs`, sem loop de novos claims na mesma chamada;
- duas tabelas e RPCs server-side versionadas com RLS e menor privilégio;
- implementação em memória de referência e adapter RPC injetado;
- sem scheduler, execução remota, migration aplicada, backfill executado,
  repository ou UI.

### Repository global de leitura de eventos oficiais V1

- contrato `official-asset-event-read-repository.v1` somente leitura;
- busca exata por `eventId` e timeline global paginada;
- filtros fechados por identidade regulatória, ticker, fonte, tipo, status e
  intervalo de data civil publicada;
- ordem descendente determinística por data civil, precisão, instante e
  `eventId`, sem meia-noite inventada;
- cursor `official-asset-event-read-cursor.v1` opaco e ligado ao hash canônico da
  consulta;
- adapters Supabase e em memória sob a mesma suíte de conformance;
- RPCs `STABLE SECURITY INVOKER`, com leitura autenticada e sem acesso `anon`;
- sem count global, busca textual, escrita, runtime, UI ou migration aplicada.

### Apresentação opcional dos eventos oficiais V1

- rota autenticada `/eventos-oficiais` e integração responsiva ao shell atual;
- dependência exclusiva de `OfficialEventsRuntimeV1`, sem acesso direto ao
  repository, Supabase, storage, executor, providers ou backfill;
- filtros fechados pelos 12 ativos, três fontes, 15 tipos, cinco status e
  intervalo civil de publicação;
- timeline em ordem do runtime, paginação por cursor opaco e detalhes por
  `eventId`, com revisões preservadas;
- precisão temporal mantida sem meia-noite inventada e links HTTPS limitados aos
  hosts oficiais auditados;
- estados completos do runtime, loading independente, proteção contra resposta
  obsoleta, dupla paginação e duplicidade entre páginas;
- composição real explicitamente `disabled`, item ausente da navegação e rota
  direta sem chamada de leitura;
- nenhuma migration aplicada, nenhum backfill executado, nenhum evento em
  produção e nenhuma notícia editorial criada.

### CI de isolamento RLS com pgTAP

- job `rls-pgtap` em `.github/workflows/validate.yml`;
- Postgres efêmero via Supabase CLI, sem credencial de produção;
- migrations versionadas aplicadas ao Postgres efêmero e suíte
  `supabase/tests/database/rls_user_isolation.test.sql` executada nele;
- confirmado rodando com sucesso em execução real do GitHub Actions (`DEC-039`).

### Canário de backfill real de eventos oficiais

- job único CVM Fund Delivery, competência 2026-07;
- `maxJobs = 1`, `retryFailed = false`, `failureMode = stop`;
- runner manual `scripts/run-official-events-backfill-canary.ts`, fora de
  qualquer fluxo do app ou do CI;
- execução real: `succeeded`, `fetchedEventCount: 0` (`DEC-040`).

### Ativação do runtime `read-only`

- `OFFICIAL_EVENTS_REAL_UI_MODE` de `'disabled'` para `'read-only'`;
- fiação real do cliente Supabase e do estado de acesso movida para
  `src/app/AppComposition.tsx`, fora da fronteira que `boundary.test.ts`
  protege;
- item de navegação como consequência direta da capability do runtime, sem
  alteração separada na sidebar;
- verificado em produção com sessão autenticada real: chamada `200` a
  `list_official_asset_events_v1` e item "Eventos Oficiais" visível na sidebar
  (`DEC-041`, `DEC-042`).

### Plano de 8 sprints (29/07/2026, DEC-057)

1. **Sprint 1 — Regra documental**: gate obrigatório em `AGENTS.md`, README,
   ARCHITECTURE e SUPABASE_SCHEMA_PLAN atualizados. Concluído.

2. **Sprint 2 — Backfill de eventos oficiais**: Em 28 de julho de 2026
   (`DEC-046`), três jobs rodaram contra produção via
   `scripts/run-official-events-backfill.ts`: `sec-edgar` (ETFs, janela
   2026-01-01 a 2026-01-31, `succeeded`, `fetchedEventCount: 0`) e
   `cvm-fund-delivery` (FIIs, competência 2026-06, `succeeded`,
   `fetchedEventCount: 4`, quatro eventos persistidos). O job `cvm-ipe`
   (ações, ano 2026) falhou por dado malformado no CSV CVM (aspa não
   escapada); parser rejeitou por design (fail-closed). Corrigido no mesmo
   dia (`DEC-047`) e reexecutado com sucesso (`DEC-048`): `fetchedEventCount:
298`, `persistedAttemptCount: 298`, `rejectedItemCount: 170`. Os três
   providers oficiais têm pelo menos uma execução real bem-sucedida. Em 30
   de julho de 2026 (`DEC-058`), escopo ampliado para 2026 completo + 2025
   inteiro: CVM IPE (`--year=2025`, 500 eventos) e CVM Fund Delivery (6
   meses restantes 2026 + 12 meses 2025) rodaram com sucesso total, sem
   falha. `official_asset_events` 302 → 902 linhas. SEC EDGAR bateu limite
   estrutural: só `filings.recent` da SEC, recusa por design quando janela
   cai em `historicalFiles` (não é bug, funcionalidade não implementada).
   Usuário aceitou o limite. **Sprint 2 completo.**

3. **Sprint 3 — Ingestão de fundamentos**: Em 28 de julho (`DEC-049`),
   `cvm-fii --year=2026`: sucesso, 4 registros. `cvm-stocks --source=DFP
--year=2025`: sucesso após corrigir bug real no adapter. `sec-nport`:
   falhou por dado real SEC não coberto; corrigido em 29 de julho (`DEC-051`,
   três bugs: URL primária, caminho XML, maiúscula `seriesName`). Em 30 de
   julho (`DEC-059`), `cvm-fii --year=2025` + primeira execução real
   `cvm-stocks --source=ITR`, revelando dois bugs reais de dado (XPLG11 nome
   alternativo "FII XP LOG" vs "XP LOG FII RL", corrigido com allowlist; ITR
   `netIncome` ambíguo entre trimestre isolado e acumulado, decisão:
   trimestre isolado). `fundamental_snapshots` 0 → 12 → 21 linhas (5 DFP, 5
   ITR, 3 SEC, 8 FII). **Sprint 3 completo.**

4. **Sprint 4 — Fundamentos no runtime/UI**: Runtime opcional
   (`disabled`/`read-only`) implementado em `src/application/context/fundamentals`
   e rota `/fundamentos` criada. Em 30 de julho (`DEC-060`), ativado em
   `read-only` em produção e verificado com sessão real (`200`, 21 linhas via
   RLS). Rota e item de navegação visíveis. **Sprint 4 completo.**

5. **Sprint 5 — Preços globais e agendamento**: Em 29 de julho (`DEC-052`),
   dados de mercado ficaram globais: `market_asset_prices` e
   `market_exchange_rates`, sem `user_id`, leitura `authenticated`, escrita
   `service_role` via RPC. Em seguida (`DEC-053`), consumo migrou por
   completo para tabelas globais; edição manual de câmbio removida. Em
   seguida (`DEC-054`), `pg_cron`/`pg_net` disparam `refresh-market-data-hourly`
   a cada hora via `service_role`. **Sprint 5 completo.**

6. **Sprint 6 — Persistência plano aporte**: Em 29 de julho (`DEC-055`),
   `contribution_plans` e `contribution_plan_items` aplicadas — por usuário,
   RLS com `(select auth.uid())`, ownership validado. Fluxo: simular →
   apresentar → aceitar/rejeitar → confirmar (ligação via `purchase_id`).
   `ContributionPlanItem.plannedPurchase` resolvido. Motor continua sem
   executar ordens — toda transição é ação explícita do usuário.
   **Sprint 6 completo.**

7. **Sprint 7 — IA explicativa**: Em 29 de julho (`DEC-056`), `TechnicalDossierV1`
   integrado: Edge Function `explain-contribution-plan` chama OpenRouter
   server-side (`anthropic/claude-sonnet-4.5`) e devolve `AiExplanationV1`
   (fatos, interpretação, convicção, reapresentação plano, explicação
   comparativa). IA nunca modifica o plano — só interpreta. Falha degrada
   silenciosamente para `null`. **Sprint 7 completo.**

8. **Sprint 8 — Auditoria**: Em 29 de julho (`DEC-057`), code-splitting por
   rota eliminou aviso bundle >500 kB (maior chunk 232 kB);
   `rls_user_isolation.test.sql` ampliado 43 → 58 asserções; `get_advisors`
   auditado sem achado corrigível; varredura secrets limpa; documentos
   corrigidos. `auth_leaked_password_protection` pendente ação manual
   (painel). **Sprint 8 completo — plano de 8 sprints encerrado.**

O domínio puro e três providers oficiais (CVM IPE, CVM Fund Delivery, SEC
EDGAR) estão concluídos e aplicados. Storage global, migration, adapter
Supabase transacional, executor server-side, backfill controlado, repository
leitura, runtime opcional, apresentação UI — todos concluídos, aplicados,
ativados read-only. 17 itens eventos oficiais + 12 itens fase operacional
concluídos. Item 17 auditoria Editorial News Providers V2 concluído com
decisão `NO-GO`.

## Ciclo de prontidão para uso — Sprints 9 a 15

Aprovado em 30 de julho de 2026. O plano de 8 sprints entregou toda a
infraestrutura, mas o levantamento de prontidão encontrou o fato decisivo:
`purchases`, `allocation_targets` e `contribution_plans` estavam com **0 linhas**
em produção. Motor V2, Dossiê Técnico, plano persistido e IA explicativa nunca
rodaram sobre uma carteira real. O sistema estava tecnicamente completo e sem
evidência de funcionamento.

Escopo decidido: **single-user** — só o próprio usuário no primeiro momento.

### Sprint 9 — Primeiro uso real ponta a ponta (bloqueante) — **concluído**

1. Rede de segurança de pré-voo — **concluído** (`DEC-061`): error boundary
   raiz e por rota, logger em memória, handlers globais de exceção não
   capturada e promise rejeitada.
2. Ensaio ponta a ponta com dados fictícios — **concluído** (`DEC-062`):
   ciclo completo `presented → accepted → confirmed` executado pela primeira
   vez, com Motor V2, Dossiê Técnico e IA explicativa rodando sobre carteira
   real. `purchases`, `allocation_targets` e `contribution_plans` saíram de
   0 linhas.
3. Correções dos defeitos encontrados no ensaio — **concluído**: moeda
   incorreta nos itens do plano e falha silenciosa do `refresh-market-data`
   (`DEC-062`); textos de demonstração sobre dado real na Estratégia
   (`DEC-063`) e na barra lateral/histórico (`DEC-065`); leitura de eventos
   oficiais quebrada desde a ativação em `DEC-041`/`DEC-042`, nunca
   verificada pela interface (`DEC-064`); banner de cotação disparando em
   situação normal (`DEC-066`).
4. Limpeza dos dados de ensaio e primeiro uso com a carteira real —
   **concluído**: `purchases`, `allocation_targets`, `contribution_plans` e
   `contribution_plan_items` de ensaio removidos em 30 de julho de 2026.
   Carteira em produção pronta para o cadastro real do usuário.

### Sprint 10 — Recuperação de senha (bloqueante) — **concluído**

`resetPasswordForEmail`/`updatePassword` em `AuthProvider` (`DEC-069`),
rotas públicas `/recuperar-senha` e `/redefinir-senha`, link "Esqueceu sua
senha?" em `LoginPage`. Suíte completa verificada: 2210/2210 testes
passando após a mudança. Pendente, fora de código: habilitação de
`auth_leaked_password_protection` no painel Supabase — ação manual de
configuração de segurança em serviço de terceiro, não script.

### Sprint 11 — Superfície honesta e segura (bloqueante) — **concluído**

Configurações deixam de ser mock (`DEC-070`): nome de exibição persiste em
`profiles`, subconjunto útil de preferências (moeda, casas decimais, view
compacta, estratégia padrão, lembrete de aporte) persiste em
`user_preferences`, tabela nova. E-mail vira somente leitura, vindo da
sessão real — editar e-mail exige o fluxo de confirmação do Supabase Auth,
fora deste escopo. Seção de notificações removida inteira — nunca teve
canal de envio. Textos que afirmavam "sem conta autenticada" e "e-mail
demonstrativo" reescritos para refletir o estado real. Headers de segurança
no `vercel.json` (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) —
Content-Security-Policy deliberadamente fora, sem ambiente de teste contra
produção para validar antes de aplicar. Migration
`20260731120000_create_user_preferences.sql` aplicada em produção após
confirmação do usuário; `database.types.ts` regenerado.
`get_advisors` confirma RLS correta na tabela nova e reconfirma a
pendência de `auth_leaked_password_protection` já registrada na Sprint 10.

### Sprint 12 — Observabilidade e frescor de dados (bloqueante para uso continuado) — **concluído**

`DEC-071`. Log estruturado JSON em `refresh-market-data` (sucesso e falha —
antes só falha era logada) e `explain-contribution-plan` (antes nenhum log,
mesmo bug que `DEC-062` já tinha corrigido do outro lado). Aviso de preço
obsoleto em `/carteira` via `getStaleAssetPrices`
(`src/domain/priceFreshness.ts`, limiar de 4 dias, deliberadamente distinto
da janela de 60 min do cron). `npm run check:health` — RPC
`check_market_data_health_v1` (`SECURITY DEFINER`, só `service_role`, já
que `cron.job_run_details` não é exposto via PostgREST de propósito) —
migration aplicada e testada em produção, 24/24 execuções recentes
`succeeded`. `docs/runbooks/OPERATIONS_V1.md` documenta as três peças e o
limite conhecido: `status = 'succeeded'` no cron confirma só que o
`pg_net` entregou a chamada, não que a lógica interna da função funcionou —
as duas checagens são complementares, não substitutas.

### Sprints 13 a 15 — pós-uso

13. Testes de interação (`jsdom` + Testing Library) — **entrega inicial
    concluída** (`DEC-072`), reordenada para antes das Sprints 14 e 16 por
    ser dívida de cobertura mais urgente. `jsdom`, `@testing-library/react`,
    `@testing-library/user-event` e `@testing-library/jest-dom`
    adicionados; ambiente por arquivo via pragma
    `// @vitest-environment jsdom`, não global — suíte de domínio
    permanece em `node`. Cobertos: `LoginPage`, `ForgotPasswordPage`,
    `ResetPasswordPage` (as três telas da `DEC-069`, sem teste de
    interação até então) e `PurchaseForm` (criação e edição de compra).
    **Não coberto ainda:** fluxo de cancelamento de compra em
    `HistoryPage` (orquestração de página inteira, exige mock do hook
    `useHistoryData` completo) e demais páginas — item aberto, não
    fechado por engano.
14. Reconciliação documental e limpeza de código morto — **entrega
    inicial concluída** (`DEC-073`). `README.md` e `docs/PROJECT_HANDOFF.md`
    reconciliados com o estado real (Sprints 9-13). `knip` configurado
    (`knip.json`, `npm run audit:dead-code`) com pontos de entrada
    corretos do projeto (scripts, Edge Functions, `vite.config.ts`) — a
    config padrão sem isso gerava falso positivo até em arquivo editado
    na mesma sessão. Um export desnecessário removido
    (`cloneTemporalValue`, usado só internamente). **Não executado, item
    aberto e deliberado:** ~190 reexportações de barrel (`index.ts` de
    `fundamentals`, `repositories`, `cvm/fii`, `sec/nport`,
    `backfill`) sinalizadas como não consumidas via o próprio barrel —
    a função de origem geralmente é usada por import direto em outro
    lugar. Não removidas em massa por dois motivos: risco de quebrar
    consumidor não mapeado pela config atual do knip, e a Sprint 16 vai
    voltar a mexer exatamente nesses módulos de fundamentos em breve —
    prunar agora para reconstruir depois é desperdício.
15. Multiusuário — somente se houver segundo usuário.

### Sprint 16 — Motor com recomendação por score (`DEC-068`)

Planejada em 31 de julho de 2026, depois das Sprints 10 e 12 (recuperação de
senha e observabilidade — os providers novos desta sprint precisam do log
estruturado da 12 para depurar falha de ingestão). Prioridade acima das
Sprints 13 a 15, que são pós-uso e de menor urgência para o usuário único
atual.

Pesquisa de fonte concluída em `docs/reference/`:
`FII_SEGMENTOS_E_METRICAS.md`, `ACOES_BR_SETORES_E_METRICAS.md`,
`ETF_INTERNACIONAL_SEGMENTOS_E_METRICAS.md` e
`REGRAS_DE_PONTUACAO_RASCUNHO.md` (tabela de pontos e mecanismo de
integração com o motor, editável).

1. **Fundação de schema — concluída** (`DEC-074`, 4 de agosto de 2026).
   `asset_type`/`asset_segment` em `assets`, os 12 ativos do universo
   classificados e verificados em fonte (KNRI11 e XPLG11 conferidos nesta
   etapa, não estavam nos documentos de referência). Tabela
   `signal_rules` criada, vazia de propósito — população acontece na Fase
   5, junto com o código que a consome. `score_weight_basis_points` em
   `user_preferences` (default 50, ajustável). Migrations aplicadas em
   produção, `database.types.ts` regenerado, 2232/2232 testes passando.
2. **Providers FII** — em andamento (`DEC-075`).
   - **Tesouro Transparente (NTN-B) — concluído.** Tabela global
     `market_reference_rates`, provider com regra de vencimento mais
     longo disponível (não fixo), frescor por dia (não por hora, distinto
     do resto do cron). Integrado em `refresh-market-data`, migration
     aplicada e Edge Function publicada em produção (versão 11).
   - **CVM Informe Trimestral Estruturado — vacância concluída (`DEC-076`).**
     Primeiro sinal extraído das 16 tabelas do Informe Trimestral: vacância
     média ponderada por participação na receita do imóvel (tabela
     `imovel`), não por 1 fixo — soma real dos pesos observada em dado real
     da HGRU11 fica em ~0,868, não 1. Aritmética inteira (`BigInt`) do
     início ao fim. Módulo paralelo e não genérico em relação ao provider
     do Informe Mensal (`src/data/fundamentals/cvm/fii-trimestral/`),
     porque as formas de provenance dos dois informes são estruturalmente
     diferentes. Escrita isolada em
     `supabaseRealEstateFundSnapshotsTrimestral.ts` (`source:
'cvm-fii-inf-trimestral'`); a leitura usada pela tela `/fundamentos`
     real (`listRealEstateFundSnapshots`) foi filtrada para continuar
     enxergando só `cvm-fii-inf-mensal` — leitura da vacância fica para a
     Fase 5, quando o motor de score for consumi-la. Coluna
     `vacancy_basis_points` e terceiro ramo dos CHECKs de
     `fundamental_snapshots` aplicados em produção.
   - **Indexador da carteira — concluído (`DEC-077`).** Segundo sinal do
     Informe Trimestral: participação da receita contratual por índice de
     reajuste (IPCA, IGP-M, INPC, INCC), direto da tabela `complemento`
     (1 linha/fundo/trimestre, sem agregação ponderada — diferente da
     vacância). 4 colunas independentes (`ipca_revenue_share_basis_points`
     e as 3 análogas), porque as frações não somam necessariamente 1.
   - **Concentração por setor de inquilino — concluída (`DEC-078`).**
     Terceiro sinal do Informe Trimestral: maior soma de participação de
     receita de um único setor de atuação (`Setor_Atuacao`), tabela
     `imovel_renda_acabado_inquilino`. CVM não divulga inquilino nomeado,
     só setor — a soma agrega o mesmo setor entre imóveis diferentes do
     fundo antes de escolher o dominante. Coluna
     `tenant_concentration_basis_points`; nome do setor dominante fica só
     na provenance (texto livre).
   - **Resultado financeiro trimestral (FFO) — concluído (`DEC-079`).**
     Quarto sinal do Informe Trimestral: `Resultado_Trimestral_Liquido_Financeiro`
     da tabela `resultado_contabil_financeiro` — equivalente brasileiro de
     FFO (resultado caixa do trimestre, não o acumulado do exercício).
     Único valor monetário absoluto desta fatia (os outros três são
     percentuais) — coluna `quarterly_net_financial_result_minor`
     (`bigint`, pode ser negativo).
   - **WALE (prazo médio de vencimento) — concluído (`DEC-080`).** Quinto e
     último sinal desta fatia: média ponderada por receita do ponto médio
     de cada uma das 13 faixas de vencimento da tabela `complemento`
     (mesma tabela do indexador). Metodologia documentada, não dado
     exato da CVM — "Acima_36Meses" usa piso conservador (36 meses) e
     "Indeterminado" fica fora do cálculo. Coluna `wale_months_x100`
     (meses, escala x100 — única escala de duração desta fatia).
     **Bug crítico corrigido nesta entrada**: `Percentual_Vencimento_*`
     usa notação científica ("6.8E-05") para valores pequenos em dado
     real da CVM — confirmado nas tabelas `imovel` e `complemento`. O
     parser compartilhado `parseNullableCvmFiiExactDecimalQuantity`
     (`cvm/fii/numbers.ts`) não suportava expoente e rejeitaria essas
     linhas reais em produção — corrigido retroativamente, afeta também
     vacância/indexador/concentração (`DEC-076`-`078`).
     Informe Trimestral Estruturado: só falta tipo de contrato
     (texto livre, exige leitura de texto — fora do escopo desta fatia).
3. **Providers ação** — em andamento (`DEC-081`).
   - **Cotas emitidas (`composicao_capital`) — concluído.** Insumo de
     LPA/P-L. Tabela estruturalmente diferente das demonstrações
     (`BPA`/`BPP`/`DRE`/`DFC`): sem `CD_CVM` (casa por CNPJ), colunas
     fixas de quantidade de ações, nome de arquivo próprio (não segue
     `_con_YYYY.csv`). Classe correta por ticker verificada com dado real
     (`CvmBrazilianStockCompany.shareClass`): BBAS3/WEGE3/PSSA3 usam ON
     (única classe, PN=0 no dado real), ITSA4 usa PN (ticker negociado),
     TAEE11 usa o total ON+PN (é unit). Reaproveita as colunas
     `issued_shares_unscaled`/`issued_shares_scale` já existentes (mesma
     representação `ExactDecimalQuantity` do FII mensal) — só relaxou o
     CHECK que exigia null no ramo `brazilian-stock`, nenhuma coluna nova.
   - **DRE `3.11`** já estava coberto desde a Fase 1 original (confirmado
     universal entre setores testados).
   - **Dividendo/JCP — resolvido, fonte é CVM IPE (`DEC-082`).** Pergunta
     em aberto da seção 6.2 do documento de referência, respondida por
     download real do `ipe_cia_aberta_2026.csv`: a categoria
     `Relatório Proventos` é o anúncio oficial de provento (dividendo/JCP),
     confirmada com linhas reais para BBAS3 e PSSA3. Mapeada para
     `dividend-or-distribution` em `categoryMapping.ts` — provider CVM IPE
     já existente (Fato Relevante/Comunicado ao Mercado) cobre dividendo
     sem fonte nova, só a adição do mapeamento. Evento de ocorrência
     (data, título, link), não o valor do provento em si — extrair o
     valor exigiria ler o PDF/link, fora do escopo desta entrada.
4. **Providers ETF** — 2 de 3 itens resolvidos (`DEC-084`, `DEC-092`), 1
   segue bloqueado (`DEC-083` continua válido pra FRED).
   - **NAV por cota / cotas em circulação — premissa errada, corrigida, e
     prêmio/desconto resolvido por fonte alternativa (`DEC-092`).**
     "Campo já existe no formulário" não era verdade: N-PORT real da VOO
     inspecionado por completo (`accessionNumber 0000036405-26-000325`,
     `primary_doc.xml`, ~90 tags XML) e nenhuma delas é NAV por cota nem
     cotas em circulação. Pesquisa de fonte alternativa (a pedido do
     usuário) confirmou: Rule 6c-11 da SEC obriga todo ETF a publicar
     diariamente NAV, preço de mercado e prêmio/desconto no site do
     próprio emissor — `investor.vanguard.com` expõe isso via endpoint
     JSON não documentado (`vmf/api/<fundNumber>/premium-discount/CURR`),
     confirmado com fetch real sem autenticação devolvendo série diária
     exata (`nav`, `marketPrice`, `premiumDiscountPercentage`,
     `effectiveDate`). Usuário aprovou explicitamente o risco (endpoint
     interno, sem contrato público, pode quebrar sem aviso — mitigado por
     validação estrita que falha fechado). Implementado dentro do cron
     `refresh-market-data` (não CLI — dado diário, mesmo padrão de NTN-B):
     `vanguardEtfValuationProvider.ts`, tabela global nova
     `market_etf_valuations` (signed, sem `value_scaled > 0` que
     `market_valuation_ratios` exige), RPC
     `upsert_market_etf_valuations_v1`, migration aplicada em produção.
     Cotas em circulação isoladas (sem o prêmio/desconto) seguem sem fonte
     confirmada, mas deixaram de ser necessárias — o sinal em si já está
     resolvido.
   - **Shiller/Yale CAPE — resolvido e implementado (`DEC-084`).** Provider
     completo em `src/data/fundamentals/shiller/` (download, parser `.xls`
     via dependência nova `xlsx`, extração do valor mais recente), tabela
     global nova `market_valuation_ratios` (mesmo padrão de segurança de
     `market_reference_rates`), CLI (`--provider=shiller-cape`), 5 arquivos
     de teste novos. Usuário aprovou explicitamente a dependência `.xls`.
   - **FRED `DFII10`** — exige chave de API gratuita que só o usuário pode
     obter e fornecer; não é algo que dá para resolver de forma autônoma.
     **Segue bloqueado.**
   - O item restante (FRED) segue pausado até o usuário fornecer a chave —
     não é codificável sem essa decisão externa.
5. **Motor de score — fechado até onde o dado real permite
   (`DEC-085`/`DEC-086`/`DEC-090`/`DEC-091`/`DEC-092`).**
   `src/domain/fundamentals/score/` cobre, hoje, 7 dos 12 sinais do
   rascunho de pontuação:
   - **FII tijolo (4/5):** vacância, WALE, concentração do maior
     inquilino, P/VP. Spread de DY sobre NTN-B bloqueado — precisa valor
     do provento, só o evento foi ingerido (`DEC-082`), confirmado
     bloqueado de verdade (`DEC-091` baixou e inspecionou os datasets
     reais da CVM: FRE, Informe Mensal e DFIN não têm o valor em nenhum
     CSV estruturado, nem para FII nem para ação).
   - **Ação (1/4):** ROE, aplicável a todos os regimes exceto holding
     pura. Os outros 3 ficam bloqueados por motivos diferentes: payout
     (mesmo bloqueio de valor de provento do FII), dívida líquida/EBITDA
     (dívida financeira e D&A não são extraídos do DFP/ITR — precisa
     provider novo, não só o motor), P/L vs série histórica (só 1-2
     períodos ingeridos por empresa até agora — amostra pequena demais
     para um quartil confiável; o mecanismo existiria, falta profundidade
     histórica real).
   - **ETF (2/3):** CAPE de VOO vs própria média de 10 anos —
     `extractShillerCapeHistoryV1` reingere 11 anos de histórico (o
     arquivo do Shiller já contém a série completa, só não era mantida),
     `createSupabaseShillerCapeHistoryRepository` lê de volta, e
     `buildInternationalEtfScoreV1` computa o desvio (atual − média,
     `BigInt` exato) e pontua. Só se aplica a `indice-amplo-us`
     (`wrong-regime` pra VNQ/VEA). Prêmio/desconto sobre NAV
     (`DEC-092`) resolvido por fonte alternativa (site do emissor, ver
     item 4) e aplicável aos 3 ETFs (`indice-amplo-us`, `reit-us`,
     `mercados-desenvolvidos-ex-us`) — `createSupabaseEtfValuationRepository`
     lê `market_etf_valuations`, `buildInternationalEtfScoreV1` pontua -1
     quando o desvio ultrapassa 50 basis points em módulo (prêmio ou
     desconto), 0 dentro da faixa normal de tracking. Frescor de 5 dias
     (fonte diária, mais curto que qualquer outro sinal do motor). Spread
     de DY sobre TIPS segue bloqueado, depende de chave de API do FRED
     (usuário).
   - Cada classe de ativo com sinal implementado está conectada ao fluxo
     real de aporte (não é só o motor de domínio isolado) — ver item 6.
6. **Integração no motor — implementada e conectada ao fluxo real
   (`DEC-085`/`DEC-086`).** `desvioAjustado = desvioCandidato − (score ×
peso)` (`targetAllocationStrategy.ts`, `ContributionInput.assetScores` /
   `scoreWeightInBasisPoints`, ambos opcionais — comportamento antigo
   inalterado quando ausentes), aplicado somente entre candidatos que já
   passam `compareDeviation(candidateDeviation, currentDeviation) < 0` (ou
   na primeira compra de carteira vazia). Score nunca aprova compra que
   não melhora o desvio — `stopReason: 'no-improving-purchase'` continua
   sendo o piso de segurança, verificado por teste dedicado.
   `useContributionData.ts` lê fundamentos e `signal_rules` direto do
   repositório (nunca via `application/context/fundamentals/runtime` — ver
   `DEC-086` sobre o boundary revisado), semeia as faixas default na
   primeira vez que o usuário simula, e falha de forma best-effort (score
   vazio, nunca quebra o aporte) se qualquer etapa falhar.
7. **Dossiê e IA — implementado (`DEC-087`).** `TechnicalDossierV1` ganha
   `signals: TechnicalDossierAssetSignals[]` — por ativo com score
   calculado, cada sinal com `status` (`applied`/`unavailable`),
   `observedValue`, `points` ou `unavailableReason`. Campo
   `assetFundamentalScores` do input é opcional (ausente, `signals: []` —
   mesmo comportamento de antes desta fase). IA continua só explicando,
   nunca decidindo — o dossiê só expõe o que o motor já calculou, sem
   adicionar julgamento novo.
8. **Documentação — implementada para a fatia FII tijolo (`DEC-088`).**
   `PRODUCT.md` e `ARCHITECTURE.md` corrigidos (revisão cirúrgica, não
   reescrita) onde diziam que fundamentos não influenciam o Motor V2 —
   agora apontam para o módulo separado `src/domain/fundamentals/score`.
   `no-fundamental-score`/`no-technical-plan-modification` (em
   `buildFundamentalFactsV1.ts`/`buildFundamentalDerivedFactsV1.ts`)
   reescritos para descrever exatamente o que o contrato em si ainda não
   inclui, sem esconder o que o score downstream já faz.
   `technical-ranking-not-exposed-v1` permanece válido sem alteração — o
   motor ainda não expõe o histórico de candidatos avaliados a cada
   iteração, só o resultado priorizado. Cada nova fatia (ação, ETF, spread
   de DY) reabre a mesma revisão.
9. **Testes — implementados para a fatia FII tijolo (`DEC-089`).**
   Determinismo, trava de segurança do laço guloso e priorização com
   scores diferentes cobertos desde `DEC-086`. Estado `stale` (dado com
   `referenceDate` além do limiar de frescor da fonte,
   `CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS = 180`, ponto de partida editável)
   implementado e testado nesta entrada — contribui 0 pontos, expõe o
   valor observado, nunca pontua com dado velho silenciosamente. Cenário
   de ativo sem sinal disponível (`missing-input`/`wrong-regime`) coberto
   desde `DEC-085`.

Frescor por fonte, confirmado antes do planejamento (não uniforme — o teto
é da fonte, não do sistema): preço de mercado já roda a cada hora
(`refresh-market-data`, `pg_cron`). NTN-B e FRED são diários. CVM Informe
Mensal e Shiller são mensais. CVM Informe Trimestral e DFP/ITR são
trimestrais. SEC N-PORT é o pior caso: só o mês de fechamento de trimestre
é público, publicado com até 60 dias de atraso — o dado pode refletir
posição de até ~5 meses antes da consulta, e isso é regra da SEC, não falha
de ingestão.

Fora de escopo, sinalizado explicitamente: notícia editorial/sentimento
(`NO-GO`, `DEC-036`, não reaberto), CAPE de VEA, expense ratio de ETF,
métricas de Basileia/NIM/NPL/índice combinado/RAB, contrato típico/atípico
de FII (texto livre), cap rate exato, leasing spread, same-store.

## Itens abertos sem prazo

1. **Backfill competências CVM anteriores a 2025** — opcional, sem prazo.
   Suporte a `filings.files` no SEC EDGAR é desenvolvimento novo, não
   execução.

2. **Notícias editoriais** — `NO-GO` (DEC-036). Nenhum provider editorial
   aprovado.

## Fase operacional — concluída

1. Publicar a série no GitHub — concluído (PR #86).
2. Revisar e aprovar PR — concluído.
3. Confirmar ambiente, operador, janela e backup — concluído (`DEC-037`).
4. Aplicar as quatro migrations na ordem do manifesto — concluído (`DEC-037`).
5. Validar schema, RLS, grants e RPCs — concluído (`DEC-037`).
6. Regenerar e revisar `database.types.ts` — concluído (PR #90).
7. Executar smoke tests sem backfill — concluído (`DEC-037`).
8. Executar backfill canário de um job — concluído (`DEC-040`).
9. Validar dados, conflitos e checkpoint — concluído (`DEC-040`).
10. Autorizar runtime `read-only` — concluído (`DEC-041`).
11. Ativar a composição e a sidebar pela capability — concluído (`DEC-041`,
    `DEC-042`).
12. Monitorar e decidir ampliação gradual — em aberto; ver item 1 e 3 de
    "Próximo" acima.

O roadmap de desenvolvimento dos 17 itens e a fase operacional dos 12 itens
estão encerrados. Runtime real em `read-only`, verificado em produção com
sessão autenticada. Em 28 de julho de 2026, o backfill gradual autorizado
(`DEC-046`) inseriu os quatro primeiros eventos reais em `official_asset_events`
— a timeline deixou de estar vazia pela primeira vez. No mesmo dia, após a
correção do parser CVM IPE (`DEC-047`) e a reexecução do job (`DEC-048`),
`official_asset_events` foi de 4 para 302 linhas: os três providers oficiais
(CVM IPE, CVM Fund Delivery, SEC EDGAR) já têm pelo menos um backfill real
bem-sucedido. No mesmo dia, a primeira ingestão real de fundamentos
(`DEC-049`) trouxe `fundamental_snapshots` de 0 para 9 linhas via `cvm-fii` e
`cvm-stocks`. Em 29 de julho de 2026, após corrigir três bugs reais
independentes no provider `sec-nport` (`DEC-051`), a tabela chegou a 12
linhas, cobrindo as três categorias do universo fechado.
