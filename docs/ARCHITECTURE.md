# Papo de Futuro — Arquitetura

## Estado atual

### Frontend

- Vite;
- React;
- TypeScript;
- Tailwind CSS;
- React Router;
- Supabase JS;
- Lucide React;
- Vitest;
- ESLint;
- Prettier;
- npm.

### Organização atual

- `src/app`: composição de aplicação e roteamento principal.
- `src/auth`: sessão e fronteira entre modo demo e modo autenticado real.
- `src/components/layout`: shell compartilhado, sidebar, cabeçalho e menu móvel.
- `src/components/ui`: componentes básicos reutilizáveis de interface.
- `src/domain`: modelos e contratos puros do domínio financeiro (carteira,
  Dossiê Técnico V1, fundamentos, eventos oficiais).
- `src/data/repositories`: repositories financeiros e mappers Supabase para os
  fluxos autenticados.
- `src/data/fundamentals`, `src/data/context/official-events`: providers e
  adapters isolados de fundamentos e eventos oficiais.
- `src/application/context`: runtime browser-compatible de eventos oficiais e
  de fundamentos, ambos com modos explícitos `disabled`/`read-only`.
- `src/server/context`: executor e backfill server-side de eventos oficiais,
  fronteira exclusiva de servidor.
- `src/features`: componentes específicos de domínio visual por área funcional.
- `src/mocks`: dados determinísticos usados pelo modo demo.
- `src/pages`: páginas de rota e composição das telas.
- `src/lib`: ambiente, client e types Supabase.
- `src/styles`: tokens, estilos base e estilos globais.

No estado atual:

- as páginas ficam em `src/pages` e compõem as rotas principais, conectadas a
  dados reais quando o usuário está autenticado;
- componentes específicos de cada área ficam em `src/features`;
- Dashboard, Minha Carteira, Histórico, Estratégia, Configurações, Eventos
  Oficiais e Fundamentos possuem componentes de feature próprios;
- Novo Aporte possui o Motor Estratégico V2, estratégias, utilitários e UI em
  `src/features/contribution`, conectado a compras, cotações, metas e câmbio
  reais;
- `src/domain/models` possui os tipos compartilhados do domínio;
- `src/domain/technicalDossier` contém o contrato derivado e o builder puro do
  Dossiê Técnico V1;
- `src/domain/fundamentals` contém o contrato normalizado e o builder puro de
  Fundamental Facts V1, além da camada separada e pura de Fundamental Derived
  Facts V1;
- `src/domain/context/official-events` contém o domínio puro e determinístico de
  `OfficialAssetEventV1`, com identidades, taxonomia, tempo, documentos,
  deduplicação e revisões — por design, esta camada em si permanece pura, sem
  I/O; persistência, backfill e runtime existem nas camadas irmãs descritas
  abaixo (`src/data`, `src/server`, `src/application`), todas aplicadas em
  produção;
- `src/data/context/official-events/cvm/ipe` contém o provider CVM IPE V1
  isolado para as cinco ações, com download injetado, ZIP/CSV auditados,
  identidade forte, categorias fechadas e deduplicação em memória;
- `src/data/context/official-events/cvm/fund-delivery` contém o provider CVM
  Fund Delivery FII Events V1 isolado para os quatro FIIs, com download
  injetado, materialização exclusiva do CSV mensal, associação por CNPJ exato,
  tipos documentais fechados e deduplicação em memória;
- `src/data/context/official-events/sec/edgar` contém o provider SEC EDGAR ETF
  Events V1 isolado para VOO, VNQ e VEA, com Submissions como índice, Filing
  Detail obrigatória, identidade exata por CIK, série e classe, forms fechados,
  fair access e deduplicação em memória;
- `src/data/fundamentals` contém providers CVM isolados para ações e FIIs e o
  provider SEC N-PORT isolado para ETFs internacionais, com parsing factual,
  ingestão injetável e adapters globais apenas para os fluxos já conectados;
- dados do modo demo ficam em `src/mocks` quando usados por mais de uma área;
  o modo demo é fallback determinístico, não fonte de verdade;
- factory isolada de cliente Supabase em `src/lib`, com migrations versionadas
  aplicadas ao projeto real;
- o Supabase real possui `public.profiles`, `public.assets`,
  `public.purchases`, `public.allocation_targets`,
  `public.fundamental_snapshots`, `public.official_asset_events` e as
  tabelas de checkpoint de backfill, todas com RLS habilitado;
- `public.asset_prices` e `public.exchange_rates` (por usuário) permanecem
  aplicadas mas sem consumidor no app desde `DEC-053`; preços e câmbio reais
  vêm de `public.market_asset_prices` e `public.market_exchange_rates`
  (globais, `DEC-052`), atualizadas automaticamente a cada hora via
  `pg_cron`/`pg_net` (`DEC-054`);
- advisors de segurança limpos; avisos de performance restantes são
  informativos para tabelas ainda vazias (`fundamental_snapshots`,
  `official_asset_events`);
- as telas autenticadas consomem dados reais via repositories; o modo demo
  continua disponível sem env configurado.

### Situação funcional atual

#### Atual

- login real via Supabase Auth, com fallback demo quando o ambiente não está
  configurado;
- layout principal responsivo;
- rotas para Dashboard, Minha Carteira, Novo Aporte, Histórico, Eventos
  Oficiais, Estratégia e Configurações, conectadas a dados reais quando
  autenticado;
- Motor Estratégico V2 integrado ao Novo Aporte, consumindo compras, cotações,
  metas e câmbio reais;
- edição real de metas em Estratégia, persistida via `replace_allocation_targets`;
- domínio financeiro tipado em `src/domain`, incluindo Dossiê Técnico V1,
  Fundamental Facts V1 e o domínio puro de eventos oficiais;
- persistência real do plano de aporte (`ContributionPlan`), com fluxo de
  apresentação, aceite, rejeição e confirmação (`DEC-055`, Sprint 6);
- IA explicativa (`DEC-056`, Sprint 7) interpretando o Dossiê Técnico via
  Edge Function `explain-contribution-plan`, com degradação silenciosa em
  qualquer falha;
- factory isolada de cliente Supabase em `src/lib`, sem criação automática de
  cliente pronto no import;
- publicação em produção em `https://papodefuturo.vercel.app`, com suporte a
  acesso direto e refresh das rotas;
- testes automatizados com Vitest (125 arquivos, 2086 testes na baseline atual);
- runtime opcional de fundamentos (`src/application/context/fundamentals/runtime`)
  e apresentação autenticada (`src/features/fundamentals`, rota `/fundamentos`),
  espelhando fielmente o runtime e a apresentação de eventos oficiais; ativação
  em produção (`FUNDAMENTALS_REAL_UI_MODE`) permanece `disabled` até decisão
  separada.

#### Planejado

- backfill amplo de eventos oficiais e ingestão real de fundamentos para os
  providers ainda não exercitados (CVM IPE ações já concluído; SEC N-PORT
  bloqueado por parser — ver `docs/ROADMAP.md`);
- ativação em produção do runtime de fundamentos (`read-only`), como ocorreu
  para eventos oficiais em `DEC-041`.

#### Em aberto

- desenho final das fronteiras entre `domain`, `services` e `integrations`;
- formato definitivo das futuras entidades persistidas;
- estratégia operacional para auditoria e histórico financeiro.

## Princípios de arquitetura em vigor

As camadas abaixo descrevem a separação de responsabilidades já aplicada no
código atual, não um desenho futuro.

### Apresentação

Responsável por:

- páginas;
- componentes;
- formulários;
- estados de carregamento;
- feedback ao usuário;
- contenção de falha inesperada;
- acessibilidade;
- responsividade.

Não deve conter regras financeiras relevantes.

#### Contenção de falha (`DEC-061`)

`src/app/ErrorBoundary.tsx` é a única fronteira de contenção de erro de render.
Aplicada em duas alturas: uma vez na raiz, em `AppComposition`, e uma vez por
rota autenticada, dentro de `RouteContent` (`src/app/router/AppRouter.tsx`),
sempre por fora do `Suspense` — assim uma falha de render ou de carregamento de
chunk derruba apenas o conteúdo da rota, preservando shell e navegação.

`src/lib/logger.ts` é o logger da aplicação: buffer em memória com limite fixo,
sem dependência externa e sem envio para terceiros. `registerGlobalErrorHandlers`
é chamado uma única vez em `src/main.tsx` e cobre os dois canais que escapam de
qualquer boundary — exceção não capturada e promise rejeitada sem tratamento.

O logger nunca deve receber segredo, credencial ou valor financeiro
identificável do usuário. A tela de falha informa apenas o nome da tela e a
mensagem técnica do erro, e afirma explicitamente que nenhum dado foi alterado.

### Domínio

Responsável por:

- representar os conceitos financeiros centrais;
- consolidar posições;
- calcular preço médio;
- calcular valor investido;
- calcular valor atual;
- calcular participação;
- calcular rentabilidade;
- representar metas;
- calcular desvios;
- calcular ranking;
- simular aportes;
- comparar cenários antes e depois.

As funções de domínio devem ser:

- puras quando possível;
- determinísticas;
- independentes de React;
- testáveis;
- sem dependência direta de Supabase ou APIs.

### Domínio atual

O domínio tipado existe em `src/domain/models`.

Modelos:

- `Asset`;
- `PortfolioPosition`;
- `Purchase`;
- `AssetPrice`;
- `AllocationTarget`;
- `ContributionPlan`;
- `ContributionPlanItem`.

Primitivos compartilhados:

- `EntityId` como `string`, sem assumir formato de banco;
- `MoneyInMinorUnits` para dinheiro em unidades menores inteiras;
- `MoneyAmount` combinando valor inteiro e moeda;
- `BasisPoints` para metas, com `10.000` pontos-base equivalendo a `100,00%`.

Helpers puros disponíveis:

- validação de IDs não vazios;
- validação de dinheiro em unidades menores;
- validação de pontos-base;
- soma de pontos-base;
- verificação de alocação completa.

`Asset`, `PortfolioPosition`, `Purchase`, `AssetPrice`, `AllocationTarget` e,
desde o Sprint 6 (`DEC-055`), `ContributionPlan`/`ContributionPlanItem` estão
conectados a repositories Supabase reais nos fluxos autenticados (carteira,
compras, histórico, estratégia, aporte). `contribution_plans` e
`contribution_plan_items` são tabelas por usuário, RLS com
`(select auth.uid())`, ownership validado nas relações — mesmo padrão de
`purchases`/`allocation_targets`; ver `docs/CHANGELOG-DECISIONS.md` (`DEC-055`)
e `docs/SUPABASE_SCHEMA_PLAN.md`.

### Fronteira do Dossiê Técnico V1

```text
PortfolioSnapshot
+ Strategy
+ Market Facts
+ TargetAllocationContributionResult
                ↓
        TechnicalDossierV1
                ↓
   IA explicativa (Sprint 7)
```

`TechnicalDossierV1` é um contrato puro, determinístico, versionado e derivado
somente em memória. Ele consolida fatos já calculados e preserva a ordem das
fontes de verdade recebidas.

O dossiê:

- não é persistência;
- não é uma engine;
- não é IA;
- não recalcula o plano técnico;
- não recalcula carteira, participação, preço médio, câmbio ou desvios;
- não inventa ranking técnico que o Motor V2 ainda não expõe;
- não depende de React, Supabase, APIs ou relógio ambiental.

Futuras camadas de fundamentos, notícias e eventos devem consumir esse
contrato ou evoluções explicitamente versionadas dele, sem alterar a verdade
matemática do Motor V2. A camada de interpretação qualitativa já existe — ver
abaixo.

### Fronteira da IA explicativa (Sprint 7, `DEC-056`)

```text
TechnicalDossierV1 (montado no cliente, em memória)
                ↓
client.functions.invoke('explain-contribution-plan')
                ↓
Edge Function: valida o dossiê, chama o OpenRouter, valida a resposta
                ↓
        AiExplanationV1 (ai-explanation.v1)
                ↓
        explainContributionPlanBestEffort (degrada para null em qualquer falha)
                ↓
        AiExplanation (componente de apresentação, só renderiza se houver explicação)
```

- o dossiê é montado no app (`buildTechnicalDossierV1`) e enviado como está
  para a Edge Function — nenhum cálculo novo acontece no caminho até a IA;
- a chamada ao OpenRouter (`OPENROUTER_API_KEY`, roteando para
  `anthropic/claude-sonnet-4.5`) é exclusiva da Edge Function
  `supabase/functions/explain-contribution-plan`; o navegador nunca vê a
  chave nem fala diretamente com o OpenRouter;
- a resposta da IA é validada contra o contrato `AiExplanationV1` tanto na
  Edge Function quanto no repository do app — uma resposta fora do formato é
  descartada;
- falha em qualquer ponto (rede, chave ausente, resposta malformada) resulta
  em `null`, nunca em exceção não tratada — o plano técnico determinístico
  nunca é bloqueado pela IA;
- a IA nunca recebe dados fora do que já está no dossiê (nenhuma consulta
  adicional a Supabase, mercado ou fundamentos a partir da Edge Function).

### Fronteira de Fundamental Facts V1

```text
arquivos oficiais CVM                       SEC Submissions + N-PORT XML
DFP / ITR / Informe Mensal de FII                     ↓
                  ↓                         seleção determinística do filing
leitura ZIP + parsing CSV                              ↓
                  ↓                         validação CIK / série / classe
seleção contábil por regras auditadas                  ↓
                  └───────────────────────┬─────────────┘
                                          ↓
                       FundamentalFactsV1 + proveniência
                              ┌───────────┴───────────┐
                              ↓                       ↓
                    storage global injetado  FundamentalDerivedFactsV1
                                                      ↓
                                          futuras camadas qualitativas
```

`FundamentalFactsV1` é independente de `TechnicalDossierV1`. O contrato
normaliza fatos mínimos de ações brasileiras, FIIs e ETFs internacionais sem
acoplamento a formatos de infraestrutura.

Princípios da fronteira:

- fatos contábeis monetários podem ser negativos e usam representação signed
  própria em unidades menores inteiras;
- moeda, período, fonte, documento e data de referência são preservados;
- `null` representa ausência de fato ou conceito não normalizado e não é
  transformado em zero;
- no provider CVM V1, `totalRevenue` é `null` por falta de comparabilidade
  econômica comprovada entre as linhas oficiais DRE 3.01 auditadas;
- não há conversão cambial;
- este contrato em si não inclui P/L, P/VP, margens, crescimento, valuation,
  ranking ou score — desde o Sprint 16 (`DEC-085` a `DEC-087`), P/VP de FII
  tijolo e o score do motor são calculados à parte, em
  `src/domain/fundamentals/score`, consumindo estes mesmos fatos;
- o contrato em si não altera o Motor V2 nem o schema `technical-dossier.v1`
  — o score derivado dele altera, via `desvioAjustado` (ver seção do motor
  de score).

Os providers CVM DFP/ITR para ações brasileiras, Informe Mensal para FIIs e SEC
N-PORT para ETFs internacionais produzem o contrato e já têm ingestão real
executada (`DEC-049`, `DEC-051`): `fundamental_snapshots` tem 12 linhas,
cobrindo as três categorias do universo fechado. Runtime `read-only` e
apresentação em `/fundamentos` também estão integrados e ativos em produção
desde `DEC-060` (`FUNDAMENTALS_REAL_UI_MODE = 'read-only'`). A
tabela global `fundamental_snapshots`, sem `user_id` ou FK para `assets.id`,
está aplicada no Supabase real, com leitura autenticada, escrita reservada a
contexto server-side privilegiado e adapters separados para ações, FIIs e
ETFs. A generalização SEC integrada na PR #76 foi aplicada como
`20260716203927_generalize_fundamental_snapshots_for_sec_nport`; os tipos
Supabase foram sincronizados com as colunas factuais e constraints
discriminadas por `kind`. O provider SEC N-PORT V1 cobre VOO, VNQ e VEA,
seleciona filings
`NPORT-P`/`NPORT-P/A` pelo Submissions API, valida identidade oficial por CIK,
registrant, série e classe e extrai ativos, passivos e patrimônio líquido em
USD com parsing decimal exato. O fetch é injetado, deve executar somente em
contexto server-side e exige User-Agent identificável e respeito ao fair access
da SEC; `data.sec.gov` não oferece CORS para esse consumo e o navegador não o
chama diretamente. Os fatos são publicados no escopo da série. O parser
preserva todos os class IDs do XML e exige a classe ETF do mapping exatamente
uma vez, sem atribuir os fatos financeiros exclusivamente a essa classe.

A migration de suporte a `international-etf` e `sec-nport` está versionada e
aplicada. O adapter valida integralmente identidade, filing, documento oficial,
caminhos XML e coerência dos fatos antes da escrita ou leitura. Ainda não
existem ingestão real, scheduler, integração runtime ou UI. O adapter SEC foi
integrado na PR #77; a tabela permanece vazia e nenhuma IA foi adicionada.

Quantidades oficiais de cotas podem conter casas decimais. O domínio usa
`ExactDecimalQuantity`, formado por coeficiente inteiro seguro e escala inteira
não negativa, e a persistência separa `issued_shares_unscaled` de
`issued_shares_scale`. Essa fronteira preserva o valor publicado sem
arredondamento, truncamento ou aritmética de ponto flutuante; o texto bruto
continua disponível na proveniência.

### Fronteira de Fundamental Derived Facts V1

```text
FundamentalFactsV1 + proveniência factual
                    ↓
      buildFundamentalDerivedFactsV1
                    ↓
       FundamentalDerivedFactsV1
                    ↓
       futuras camadas qualitativas
```

`FundamentalDerivedFactsV1` é uma camada separada e auditável. Ela não altera o
contrato factual e cada snapshot derivado preserva asset, data de referência,
período, fonte e documento oficial de origem. Ações brasileiras expõem a razão
entre patrimônio líquido e ativos; FIIs expõem valor patrimonial por cota; ETFs
internacionais expõem duas razões de balanço e o delta assinado de
reconciliação.

As razões usam escala fixa de 1.000.000, intermediários em `BigInt` e
arredondamento half-away-from-zero. Quantidades decimais exatas são calculadas
por coeficiente e escala sem ponto flutuante. Falta de input, denominador não
positivo, moeda divergente e resultado fora do intervalo de inteiro seguro são
indisponibilidades contratuais explícitas. Inconsistências estruturais do
snapshot factual são rejeitadas.

`FundamentalDerivedFactsV1` em si não usa preço de mercado, não calcula
crescimento nem recomendação, e não possui persistência, tabela, integração
runtime, UI ou chamada externa própria — a tabela global
`fundamental_snapshots` armazena somente os fatos normalizados de entrada,
nunca os derivados calculados a partir deles. Desde o Sprint 16 (`DEC-085`
a `DEC-087`), P/VP de FII tijolo (que usa preço de mercado) e o score do
motor (que consome estes derivados) existem em
`src/domain/fundamentals/score`, um módulo separado que modifica a
priorização de compra do Motor V2 — ver seção "Motor de score" abaixo.

### Fronteira aprovada de News & Events V1

```text
CVM para ações e FIIs / SEC EDGAR para ETFs
                  ↓
          OfficialAssetEventV1
                  ↓
       contexto factual opcional

provider editorial futuro somente após nova evidência
                  ↓
 EditorialAssetNewsV1 ainda não implementado
```

Eventos oficiais e notícias editoriais possuem identidade, proveniência,
deduplicação e persistência conceitual separadas. A associação usa apenas
identidade forte do universo fechado. Nenhuma das fronteiras é engine, IA ou
fonte de recomendação, e nenhuma altera fatos fundamentalistas, Dossiê Técnico,
Motor V2 ou plano de aporte. `EditorialAssetNewsV1` permanece adiado e apenas
conceitual. A auditoria Editorial News Providers V2, de 20/07/2026, resultou em
`NO-GO`: GDELT, NewsAPI, Finnhub, Marketaux e Alpha Vantage foram rejeitados;
FMP, Massive com Benzinga e Benzinga direta permanecem condicionais, sem licença,
identidade e cobertura 12/12 simultaneamente comprovadas. Logo, não há provider
editorial aprovado nem autorização para contrato runtime, storage, migration,
repository ou UI editorial. `OfficialAssetEventV1` já implementa contratos puros, mapping,
taxonomia, precisão temporal, identidade documental, deduplicação e revisões.
O provider CVM IPE V1 de ações transforma somente metadados oficiais em eventos
por código CVM, CNPJ e registry, mantendo aliases oficiais em allowlist fechada
específica da fonte. Ele não baixa documentos, não interpreta texto livre e não
possui storage, Supabase ou runtime. ZIPs são limitados pelos metadados antes da
extração, somente o CSV esperado é materializado e os contadores distinguem
aceites, duplicatas exatas e conflitos de payload.

O provider CVM Fund Delivery V1 de FIIs transforma somente o CSV mensal oficial
em eventos para KNRI11, VISC11, XPLG11 e HGRU11. A associação usa CNPJ exato e
mapping fechado de ticker; `INFORM MENSAL` e `INFO TRIM FII` são os únicos tipos
suportados e ambos produzem `periodic-report`. O provider não materializa o CSV
diário, não inventa timezone, URL, protocolo ou revisão e preserva
`Tipo_Apresentacao` e `Ativo` apenas como proveniência bruta. Assim como o IPE,
ele não possui storage, Supabase ou integração runtime. A API pública recebe ano
e mês como inteiros validados; o CNPJ aceita somente 14 dígitos ou a pontuação
oficial, `Sistema_Origem` é normalizado por trim e `ID_Documento` vira decimal
canônico usado também como identificador regulatório. O título combina tipo e
competência.

O provider SEC EDGAR ETF Events V1 usa a Submissions API como índice e a Filing
Detail canônica como confirmação obrigatória de CIK, série e classe para VOO,
VNQ e VEA. O prefixo do accession serve apenas para construir a URL do Archives
e não identifica o ETF. O mapping fechado cobre quatro relatórios periódicos
(`NPORT-P`, `N-CEN`, `N-CSR`, `N-CSRS`) e duas formas de assembleia (`DEF 14A`,
`DEFA14A`); forms ambíguos e `/A` ficam fora da V1. Todos os eventos são
`original`, o accession é a identidade documental, `acceptanceDateTime` fornece
`publishedAt` e `reportDate` ou `filingDate` fornece `occurredAt`. O provider
nunca baixa o primary document, usa User-Agent obrigatório, chamadas
sequenciais com intervalo mínimo de 500 ms e cache por URL. Somente
`filings.recent` é suportado; sobreposição com `filings.files` aborta o lote.
SGML fica como fallback futuro e `index.json` não é usado porque não confirma a
identidade de série e classe. Mudança estrutural ou indisponibilidade da Filing
Detail aborta sem omissão silenciosa. Não há conexão com Supabase ou runtime.

### Contrato global de storage de eventos oficiais V1

O contrato `official-asset-event-storage-record.v1` transforma
`OfficialAssetEventV1` em um registro global, flat e lossless. `eventId` é a
identidade determinística persistente e `deduplicationKey` é a chave natural
global; `documentIdentity` permanece discriminada para auditoria. O contrato não
possui `user_id`, FK para `assets.id`, provider específico ou método de leitura.

O fluxo puro é:

```text
OfficialAssetEventV1
  -> validação e record canônico
  -> preparação determinística do batch
  -> interface abstrata de upsert
```

O upsert preserva o menor `ingestedAt`, aceita somente `updatedAt` posterior para
mudança de payload, ignora versões stale e trata divergência na mesma versão como
conflito. Amendments e demais revisões permanecem documentos independentes. A
implementação em memória existe apenas como referência de conformance.

### Migration global de eventos oficiais V1

A migration versionada de `official_asset_events` materializa as 58 propriedades
do record sem `user_id`, `asset_id` ou FK para `assets`. `event_id` é a PK e
`deduplication_key` é a única unicidade natural adicional. Datas civis usam
`date`; instantes, valores brutos e timestamps internos permanecem `text`
canônico para preservar precisão e round-trip. Estruturas auditáveis usam
`jsonb`, com shape superficial no SQL e validação profunda no contrato runtime.

A tabela global habilita RLS, revoga todo acesso de `anon`, concede somente
`select` a `authenticated` e reserva `select`, `insert`, `update` e `delete` a
`service_role`. Revisões continuam registros independentes e
`supersedes_event_id` não possui FK, permitindo backfill fora de ordem. A
migration está aplicada ao Supabase real, com backfill executado
(`DEC-046`, `DEC-048`): `official_asset_events` tem 302 linhas. Runtime
`read-only` e apresentação em `/eventos-oficiais` também estão integrados e
ativados em produção (`DEC-041`, `DEC-042`).

### Adapter Supabase de eventos oficiais V1

O adapter implementa `OfficialAssetEventStorageV1` por injeção de um client
server-side mínimo e mapeia explicitamente os 58 campos entre camelCase e
snake_case. Uma única chamada à RPC `upsert_official_asset_events_v1` processa
até 500 records, preserva a ordem e rejeita entradas maiores sem fracionar a
atomicidade.

A RPC usa `SECURITY DEFINER`, `search_path` fixo e
`pg_advisory_xact_lock` transacional para serializar apenas os writers deste
contrato. Todo o batch é classificado antes das escritas; qualquer conflito
impede gravações. Stale writes são ignorados, divergências na mesma versão são
conflitos, o menor `ingested_at` é preservado e apenas `updated_at` posterior
permite atualizar conteúdo mutável. A execução é exclusiva de `service_role`;
`authenticated` continua somente leitura, `anon` permanece sem acesso e a
escrita direta da tabela pelo role server-side é revogada em favor da RPC.

`database.types.ts` continua gerado e não foi editado sem schema remoto
aplicado. A migration complementar e o adapter estão aplicados ao Supabase
remoto, com backfill real executado (ver acima).

### Fronteira operacional de deployment de eventos oficiais V1

O pacote de readiness versiona o manifesto verificável, o runbook, o checklist
de segurança e as consultas pós-deployment somente leitura. Ele não é importado
pelo runtime e não concede autorização implícita para acessar ou alterar o
Supabase.

```text
migrations versionadas + manifesto local verificado
  -> aplicação autorizada e sequencial do schema
  -> checks de objetos, constraints, RLS, grants e RPCs
  -> geração oficial de database.types.ts contra o schema aplicado
  -> canário server-side com leitura real ainda desabilitada
  -> backfill gradual com checkpoints e monitoramento
  -> autorização separada para runtime read-only e navegação
```

Cada seta é um gate operacional independente. A composição real permanece em
modo `disabled`; nem o manifesto nem o runbook alteram esse estado. Antes de
qualquer dado, uma falha pode permitir rollback destrutivo conforme o runbook.
Depois de escrita ou backfill, a estratégia padrão é correção forward-only para
preservar fatos, revisões e checkpoints. Drift de hash, ordem, grants, RLS,
assinaturas ou tipos gera `NO-GO`.

### Executor server-side de eventos oficiais V1

O módulo `src/server/context/official-events` compõe os três providers em jobs
explícitos e sequenciais. Cada provider entrega `OfficialAssetEventV1` à fachada
`persistOfficialAssetEventsV1`, que então usa `OfficialAssetEventStorageV1` e o
adapter Supabase injetado. O executor nunca chama a RPC nem transforma record de
storage diretamente.

O fetch server-side aceita somente HTTPS para `dados.cvm.gov.br`,
`data.sec.gov` e `www.sec.gov`, rejeita redirects, credenciais na URL e headers
não autorizados, usa timeout com `AbortController` e não expõe payloads em
erros. User-Agent SEC, relógio, fetch e client RPC são injetados; não existe
leitura de ambiente, segredo ou singleton no módulo.

Jobs são validados integralmente antes dos efeitos e executados na ordem de
entrada. Falhas de provider ou persistência ficam isoladas no job; conflitos
contratuais são preservados e não bloqueiam os jobs seguintes. O executor não é
exportado por barrels do browser e ainda não possui scheduler, checkpoint,
backfill, entrypoint de produção ou UI. O repository de leitura foi criado em
ciclo posterior e permanece desacoplado do executor.

### Backfill controlado e reiniciável de eventos oficiais V1

O módulo `src/server/context/official-events/backfill` transforma um plano
explícito em jobs determinísticos do executor: um job por ano de CVM IPE, por
mês de CVM Fund Delivery e por janela civil inclusiva de SEC EDGAR. O `planId`,
o hash e os `jobId` derivam somente do conteúdo canônico com componentes
length-prefixed. O preview é puro e não chama checkpoint, executor, storage,
Supabase ou rede.

O checkpoint é global, sem `user_id`, carteira ou ativo. Runs e jobs preservam
status, contadores, summaries e leases com owner explícito. Cada chamada do
orquestrador reivindica no máximo `maxJobs`, executa somente esse lote e pode ser
repetida. Leases ativos não são roubados; leases expirados podem ser retomados;
falhas só retornam quando `retryFailed` permite e conflitos nunca recebem retry
automático. Em `failureMode: stop`, jobs ainda não iniciados voltam
transacionalmente para `pending` e o plano fica pausado.

A migration cria `official_event_backfill_runs` e
`official_event_backfill_jobs`, ambas com RLS e sem policy ou acesso direto de
`anon`, `authenticated` e `service_role`. As operações usam RPCs
`SECURITY DEFINER`, `search_path` fixo, locks de linha e `FOR UPDATE SKIP LOCKED`,
com execução exclusiva de `service_role`. O adapter usa somente uma porta RPC
injetada e valida profundamente os retornos. As migrations estão aplicadas em
produção e o backfill já foi executado múltiplas vezes de forma manual
(`scripts/run-official-events-backfill.ts`, gradual, um job por invocação
com `--confirm`) para os três providers, mais recentemente a categoria
`dividend-or-distribution` de CVM IPE em 06/08/2026 (`DEC-097`). Não existem
scheduler, cron, entrypoint de produção automático ou UI que disparem o
backfill — toda execução até aqui foi manual, via CLI, com credenciais
locais do operador. O repository posterior não executa nem controla o
backfill.

### Repository global de leitura de eventos oficiais V1

O contrato `official-asset-event-read-repository.v1` oferece somente
`getByEventId` e `listPage`. A timeline é global e provider-agnostic, sem
`userId`, `assetId`, contagem total ou busca textual. Filtros fechados cobrem
identidade regulatória, ticker, fonte, tipo, status e intervalo inclusivo da data
civil de publicação.

A ordenação canônica descendente usa data civil publicada, rank de precisão
(`second`, `minute`, `date`), instante UTC canônico quando existe e `eventId`.
Datas civis permanecem datas: nenhuma meia-noite artificial é criada. O cursor
`official-asset-event-read-cursor.v1` carrega a última tupla e um hash
determinístico da consulta sem cursor. A paginação é keyset e não promete
snapshot diante de inserções concorrentes.

O adapter Supabase usa somente as RPCs `get_official_asset_event_by_id_v1` e
`list_official_asset_events_v1`, ambas `STABLE`, `SECURITY INVOKER`, com
`search_path` fixo e execução revogada de `PUBLIC` e `anon`. O resultado percorre
o mapper lossless de 58 campos e as validações de storage e domínio. A referência
em memória compartilha filtros, ordenação e cursor para testes de conformance.
As RPCs de leitura estão aplicadas em produção. Não existe scheduler ou
disparo automático de backfill — segue manual via CLI (ver seção anterior).

### Runtime opcional de eventos oficiais V1

`official-events-runtime.v1` é uma fronteira browser-compatible e somente de
leitura sobre `OfficialAssetEventReadRepositoryV1`. O modo é sempre explícito:
`disabled` não cria repository nem chama dependências; `read-only` recebe o
repository, uma porta de estado de acesso e um relógio UTC injetados. Somente o
estado `authenticated` permite uma chamada de leitura. `unauthenticated` e
`unresolved` retornam estados estruturados sem tocar no repository.

A composição Supabase estreita recebe um client RPC estrutural já autenticado e
reutiliza o adapter de leitura existente. Ela não cria client, singleton,
service role, query, cursor ou mapper paralelo. Falhas de transporte e schema
permanecem distintas de timeline vazia e de evento ausente; erros retornados ao
consumidor são sanitizados. O relógio preserva UTC canônico com até nove casas
fracionárias e rejeita regressão sem depender de `Date` na lógica central.

O runtime não está importado pelo `AuthProvider` nem por fluxos financeiros. A
composição da UI escolhe o modo explicitamente; `read-only` só pode ser ativado
após tabela e RPCs estarem aplicadas. Ativá-lo não habilita escrita, providers,
executor, backfill ou scheduler.

### Apresentação opcional dos eventos oficiais V1

`src/features/official-events` contém a fronteira de apresentação autenticada.
Uma porta estreita fornece somente `OfficialEventsRuntimeV1`; componentes não
importam repository, adapter, storage, executor, providers ou Supabase. A
timeline preserva a ordem recebida, usa cursor opaco, filtros fechados pelos 12
ativos, três fontes, 15 tipos, cinco status e intervalo civil, e trata respostas
obsoletas e duplicidades entre páginas como falhas de contrato.

Detalhes são consultados por `eventId` sem recarregar a timeline. A apresentação
preserva precisão temporal, não transforma data civil em instante, omite
proveniência sensível e abre somente URLs HTTPS dos hosts oficiais auditados da
CVM e SEC. Estados `disabled`, autenticação necessária, acesso não resolvido,
indisponibilidade, falha e vazio permanecem distintos.

A composição real em `src/app/AppComposition.tsx` está ativa em `read-only`
desde `DEC-041`, verificada em produção com sessão autenticada (`DEC-042`): o
item aparece na sidebar como consequência da capability do runtime e a rota
consulta o repository de leitura via Supabase. Não existe notícia editorial.

### Apresentação opcional de fundamentos V1

`src/features/fundamentals` espelha fielmente a estrutura acima —
`src/application/context/fundamentals/runtime` (modos `disabled`/`read-only`,
única operação `getDossier()`, sem paginação por ser um universo fechado
pequeno) e uma porta estreita que fornece somente `FundamentalsRuntimeV1`, sem
acesso a repository, adapter ou Supabase pelos componentes. Estados
`disabled`, autenticação necessária, acesso não resolvido, falha e vazio
permanecem distintos; nenhum score, ranking ou recomendação é exibido.

A composição real está ativa em `read-only` desde `DEC-060`
(`FUNDAMENTALS_REAL_UI_MODE` em `src/features/fundamentals/composition.ts`):
o item aparece na sidebar e a rota `/fundamentos` consulta o repository de
leitura via Supabase, mesmo padrão de eventos oficiais.

Esta apresentação permanece isolada do motor de score do Sprint 16
(`DEC-085` a `DEC-087`, ver seção "Motor de score" acima) — o score não é
calculado nem exibido aqui, só no fluxo de aporte (Novo Aporte, dossiê
técnico). `src/features/fundamentals/boundary.test.ts` foi revisado pela
`DEC-086` para permitir que os fluxos financeiros críticos (contribuição,
carteira, histórico) leiam fundamentos via os builders puros de domínio e o
repositório de leitura — mas continua proibindo, sem exceção, que esses
fluxos importem esta feature de apresentação ou o runtime dela.

### Infraestrutura

Responsável pela base técnica atual de Supabase e, futuramente, pela camada real
de dados:

- Supabase;
- autenticação;
- banco;
- migrations;
- RLS;
- APIs de mercado;
- câmbio;
- notícias;
- persistência;
- auditoria.

### IA

Desde o Sprint 7 (`DEC-056`), responsável apenas por interpretação e
explicação em texto do plano já calculado — ver "Fronteira da IA
explicativa" abaixo.

Nunca é a fonte oficial dos cálculos.

## Princípio de persistência

> O banco armazena fatos. Valores derivados são calculados pelo domínio.

### Fatos que poderão ser armazenados

- cadastro mestre de ativos;
- compras;
- preços e respectivas fontes;
- taxas de câmbio e respectivas fontes;
- data e hora das informações;
- planos confirmados;
- dados de auditoria futuramente.

### Valores que não devem ser armazenados como fonte primária

- preço médio;
- quantidade consolidada;
- valor investido;
- valor atual;
- participação;
- rentabilidade;
- diferença da meta;
- ranking técnico.

Todos devem ser recalculáveis a partir dos fatos.

## Modelo de dados conceitual (histórico)

Este modelo foi o esboço conceitual anterior às migrations reais e é preservado
como registro histórico do raciocínio original. O schema efetivamente aplicado
está em `docs/SUPABASE_SCHEMA_PLAN.md` e `docs/PROJECT_HANDOFF.md` seção 9; a
decisão sobre preços de mercado globais está registrada em
`docs/CHANGELOG-DECISIONS.md`.

### `assets`

Cadastro mestre do universo permitido.

Possíveis responsabilidades:

- ticker;
- nome;
- categoria;
- mercado;
- moeda;
- status ativo/inativo.

### `purchases`

Fatos de compras pertencentes ao usuário.

Possíveis responsabilidades:

- usuário;
- ativo;
- quantidade;
- preço pago;
- data da compra;
- data de criação.

### `asset_prices`

Cotações com:

- ativo;
- preço;
- moeda;
- fonte;
- data e hora.

Decisão tomada (`DEC-052`): cotações de mercado são globais
(`public.market_asset_prices`), sem `user_id`, identidade por ticker. Não
existe mais substituição manual por usuário — a edição manual de câmbio foi
removida por completo (`DEC-053`); todo dado vem de fonte automática.

## Precisão financeira

Princípios em vigor:

- não usar números de ponto flutuante comuns como fonte de verdade monetária;
- valores monetários usam representação decimal segura ou unidades inteiras
  adequadas;
- quantidades fracionárias têm precisão explícita;
- arredondamentos são centralizados no domínio;
- componentes visuais apenas formatam valores já calculados.

## Moeda e ativos internacionais

- a visualização consolidada da carteira é expressa em reais;
- ativos internacionais mantêm a moeda original da cotação;
- a conversão usa taxa USD/BRL identificada por fonte e horário, persistida em
  `public.market_exchange_rates` (global, `DEC-052`), atualizada
  automaticamente via `pg_cron` (`DEC-054`);
- o valor original e o valor convertido são rastreáveis.

## Supabase

Estado real do projeto (`vxjrncwfysglinfktifz`) — ver `docs/SUPABASE_SCHEMA_PLAN.md`
para o histórico completo de cada tabela e `docs/PROJECT_HANDOFF.md` seção 9
para o estado mais recente auditado:

- Supabase Auth real, com fallback demo quando o ambiente não está configurado;
- `public.profiles`, `public.assets`, `public.purchases`,
  `public.allocation_targets`, `public.fundamental_snapshots`,
  `public.official_asset_events` e as tabelas de checkpoint de backfill
  aplicadas, todas com RLS habilitado;
- `public.asset_prices` e `public.exchange_rates` (por usuário) permanecem
  aplicadas, sem consumidor no app desde `DEC-053`;
- policies de tabelas privadas usando `(select auth.uid())`, com ownership
  validado nas relações de insert/update;
- eventos oficiais, fundamentos e, desde `DEC-052`, dados de mercado
  (`public.market_asset_prices`, `public.market_exchange_rates`) são dados
  **globais** (sem `user_id`), com leitura para `authenticated` e escrita
  reservada a `service_role` via RPC transacional. Dados de mercado são
  atualizados automaticamente a cada hora via `pg_cron`/`pg_net`
  (`DEC-054`);
- advisors de segurança limpos; avisos de performance restantes são
  informativos para tabelas ainda vazias ou de baixo volume.

## Segurança em vigor

- nenhuma chave secreta no frontend;
- nenhuma credencial no repositório;
- RLS obrigatória para dados de usuário;
- validação de entrada;
- princípio do menor privilégio;
- secrets somente em ambiente seguro;
- logs sem dados sensíveis.

## Integrações futuras

Integrações candidatas ou anteriormente avaliadas:

- BRAPI para mercado brasileiro;
- Twelve Data para mercado internacional;
- providers editoriais somente após nova evidência contratual, identidade forte
  e cobertura 12/12; a auditoria V2 atual resultou em `NO-GO`;
- Financial Modeling Prep para fundamentos;
- provedor de USD/BRL ainda a definir.

Nenhuma integração está aprovada apenas por estar listada.

Critérios futuros de avaliação:
