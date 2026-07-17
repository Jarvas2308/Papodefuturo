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
- `INFORM MENSAL` e `INFO TRIM FII` classificados como `periodic-report`; todos
  os demais tipos rejeitados de forma estruturada;
- data de entrega estrita reduzida somente à data civil e competência validada
  sem timezone inventado;
- identidade documental por sistema de origem codificado e ID oficial;
- eventos sempre `original`, sem URL, protocolo, fingerprint ou relação de
  revisão inventados;
- limites defensivos de ZIP, entradas, tamanho descomprimido, CSV, linhas e 11
  colunas oficiais;
- deduplicação em memória com duplicatas e conflitos explícitos;
- sem storage, migration, Supabase, scheduler, ingestão real, runtime, UI,
  sentimento, score, ranking ou IA.

## Próximo

1. Provider SEC para eventos de ETFs;
2. Storage global de eventos oficiais;
3. Comitê de IA;
4. Auditoria;
5. Polimento.

As futuras camadas qualitativas deverão consumir os contratos factuais e
derivados sem recalcular ou alterar o plano técnico do motor determinístico.
A política News & Events V1 está aprovada como Eventos Oficiais Primeiro. CVM e
SEC são as únicas fontes automatizadas V1; notícias editoriais e Comitê de IA
permanecem posteriores. O domínio puro e os providers CVM IPE de ações e Fund
Delivery de FIIs estão concluídos; o próximo ciclo começa somente pelo provider
SEC de eventos de ETFs.
