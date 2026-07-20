# Papo de Futuro — Arquitetura

## Estado atual

### Frontend

- Vite;
- React;
- TypeScript;
- Tailwind CSS;
- React Router;
- Lucide React;
- ESLint;
- Prettier;
- npm.

### Organização atual

- `src/app`: configuração de aplicação e roteamento principal.
- `src/components/layout`: shell compartilhado, sidebar, cabeçalho e menu móvel.
- `src/components/ui`: componentes básicos reutilizáveis de interface.
- `src/domain`: primeira fundação tipada do domínio financeiro futuro.
- `src/features`: componentes específicos de domínio visual por área funcional.
- `src/mocks`: dados demonstrativos utilizados pelas telas visuais.
- `src/pages`: páginas de rota e composição das telas.
- `src/lib`: utilidades leves e definições auxiliares.
- `src/styles`: tokens, estilos base e estilos globais.

No estado atual:

- as páginas demonstrativas ficam em `src/pages` e compõem as rotas principais;
- componentes específicos de cada área ficam em `src/features`;
- Dashboard, Minha Carteira, Histórico, Estratégia e Configurações possuem
  componentes de feature próprios;
- Novo Aporte possui engine, estratégias, utilitários e UI demonstrativa em
  `src/features/contribution`;
- `src/domain/models` possui os primeiros tipos compartilhados do domínio;
- `src/domain/technicalDossier` contém o contrato derivado e o builder puro do
  Dossiê Técnico V1;
- `src/domain/fundamentals` contém o contrato normalizado e o builder puro de
  Fundamental Facts V1, além da camada separada e pura de Fundamental Derived
  Facts V1;
- `src/domain/context/official-events` contém o domínio puro e determinístico de
  `OfficialAssetEventV1`, com identidades, taxonomia, tempo, documentos,
  deduplicação e revisões, ainda sem persistência ou runtime;
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
- dados demonstrativos compartilhados ficam em `src/mocks` quando são usados por
  mais de uma área;
- existe preparação inicial de Supabase com factory isolada de cliente e
  migrations versionadas;
- o Supabase real já possui `public.profiles`, `public.assets`,
  `public.purchases`, `public.asset_prices` e `public.allocation_targets`, todas
  com RLS habilitado;
- advisors de segurança estão limpos e os avisos de performance atuais são
  informativos para índices de `assets`, `purchases`, `asset_prices` e
  `allocation_targets` ainda não usados;
- ainda não existe camada runtime de dados conectada às telas, backend,
  autenticação frontend real, APIs ou persistência no app.

### Situação funcional atual

#### Atual

- login visual demonstrativo;
- layout principal responsivo;
- rotas demonstrativas para Dashboard, Minha Carteira, Novo Aporte, Histórico,
  Estratégia e Configurações;
- telas responsivas com dados determinísticos e mensagens demonstrativas;
- engine local de simulação do Novo Aporte, sem backend e sem persistência;
- edição local demonstrativa em Estratégia e Configurações;
- primeira fundação tipada do domínio financeiro em `src/domain`;
- factory isolada de cliente Supabase em `src/lib`, sem criação automática de
  cliente pronto no import;
- tabelas reais `public.profiles`, `public.assets`, `public.purchases`,
  `public.asset_prices` e `public.allocation_targets` aplicadas no Supabase,
  ainda sem consumo pelas telas;
- publicação inicial no Vercel com suporte a acesso direto e refresh das rotas;
- testes automatizados com Vitest para regras e utilitários já extraídos.

#### Planejado

- persistência de dados;
- autenticação real;
- motor estratégico final de produto;
- integrações externas.

#### Em aberto

- desenho final das fronteiras entre `domain`, `services` e `integrations`;
- formato definitivo das futuras entidades persistidas;
- estratégia operacional para auditoria e histórico financeiro.

## Arquitetura planejada

### Apresentação

Responsável por:

- páginas;
- componentes;
- formulários;
- estados de carregamento;
- feedback ao usuário;
- acessibilidade;
- responsividade.

Não deve conter regras financeiras relevantes.

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

A primeira fundação tipada do domínio já existe em `src/domain/models`.

Modelos iniciais:

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

Helpers puros já disponíveis:

- validação de IDs não vazios;
- validação de dinheiro em unidades menores;
- validação de pontos-base;
- soma de pontos-base;
- verificação de alocação completa.

Essa fundação ainda não está conectada às telas, mocks, Supabase, autenticação,
APIs ou persistência.

### Fronteira do Dossiê Técnico V1

```text
PortfolioSnapshot
+ Strategy
+ Market Facts
+ TargetAllocationContributionResult
                ↓
        TechnicalDossierV1
                ↓
 futuras camadas qualitativas
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

Futuras camadas de fundamentos, notícias, eventos e interpretação qualitativa
devem consumir esse contrato ou evoluções explicitamente versionadas dele, sem
alterar a verdade matemática do Motor V2.

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
- não há P/L, P/VP, margens, crescimento, valuation, ranking ou score;
- o contrato não altera o Motor V2 nem o schema `technical-dossier.v1`.

Os providers CVM DFP/ITR para ações brasileiras, Informe Mensal para FIIs e SEC
N-PORT para ETFs internacionais já produzem o contrato, mas ainda não possuem
execução real, scheduler ou integração com telas. A
tabela global `fundamental_snapshots`, sem `user_id` ou FK para `assets.id`, já
está aplicada e vazia no Supabase real, com leitura autenticada, escrita
reservada a contexto server-side privilegiado e adapters separados para ações,
FIIs e ETFs. A generalização SEC integrada na PR #76 foi aplicada como
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

A camada não usa preço de mercado, não calcula crescimento, score, ranking ou
recomendação e não modifica o plano técnico. Também não possui persistência,
tabela, integração runtime, UI ou chamada externa. A tabela global
`fundamental_snapshots` continua vazia e armazena somente fatos normalizados,
nunca os derivados.

### Fronteira aprovada de News & Events V1

```text
CVM para ações e FIIs / SEC EDGAR para ETFs
                  ↓
          OfficialAssetEventV1
                  ↓
       contexto factual opcional

provider editorial futuro após nova auditoria
                  ↓
         EditorialAssetNewsV1
                  ↓
       contexto editorial opcional
```

Eventos oficiais e notícias editoriais possuem identidade, proveniência,
deduplicação e persistência conceitual separadas. A associação usa apenas
identidade forte do universo fechado. Nenhuma das fronteiras é engine, IA ou
fonte de recomendação, e nenhuma altera fatos fundamentalistas, Dossiê Técnico,
Motor V2 ou plano de aporte. `EditorialAssetNewsV1` permanece adiado e apenas
conceitual. `OfficialAssetEventV1` já implementa contratos puros, mapping,
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
migration ainda não foi aplicada ao Supabase; não existem ingestão, scheduler,
backfill ou repository de leitura.

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
aplicado. A migration complementar e o adapter ainda não foram aplicados ao
Supabase remoto.

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
injetada e valida profundamente os retornos. As migrations não foram aplicadas,
o backfill não foi executado e não existem scheduler, cron, entrypoint de
produção ou UI. O repository posterior não executa nem controla o backfill.

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
As RPCs permanecem não aplicadas. O runtime opcional existe como módulo local,
mas não está ativado em modo de leitura; não existe scheduler ou execução de
backfill.

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

A composição real em `src/app/AppComposition.tsx` continua explicitamente
`disabled`: o item não é criado na sidebar e a rota direta informa que o recurso
não foi ativado sem executar leitura. A UI pode receber um runtime `read-only`
em testes, mas não existe ativação de produção, migration aplicada, backfill
executado ou notícia editorial.

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

Responsável futuramente apenas por interpretação e explicação.

Nunca deve ser a fonte oficial dos cálculos.

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

## Modelo de dados conceitual planejado

Este modelo é conceitual e não deve ser interpretado como migration definitiva.

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

Decisão em aberto:

- se cotações de mercado serão globais;
- como serão separados preços de mercado e substituições manuais por usuário;
- política de histórico e retenção.

Não há justificativa, nesta fase, para assumir automaticamente o modelo antigo
com `user_id` em todas as cotações.

## Precisão financeira

Princípios planejados:

- não usar números de ponto flutuante comuns como fonte de verdade monetária;
- valores monetários devem usar representação decimal segura ou unidades
  inteiras adequadas;
- quantidades fracionárias precisam de precisão explícita;
- arredondamentos devem ser centralizados no domínio;
- componentes visuais apenas formatam valores já calculados.

## Moeda e ativos internacionais

- a visualização consolidada da carteira será expressa em reais;
- ativos internacionais mantêm a moeda original da cotação;
- a conversão deve usar uma taxa USD/BRL identificada por fonte e horário;
- o valor original e o valor convertido devem ser rastreáveis;
- a implementação ainda é futura.

## Supabase

Supabase já existe como base técnica inicial, mas ainda não é consumido pelas
telas em runtime.

Estado atual:

- dependência `@supabase/supabase-js` instalada;
- leitura tipada de variáveis públicas preparada;
- factory isolada de cliente Supabase criada;
- migrations versionadas iniciais criadas;
- tabelas reais `public.profiles`, `public.assets`, `public.purchases`,
  `public.asset_prices`, `public.allocation_targets` e
  `public.fundamental_snapshots` aplicadas no Supabase;
- RLS habilitado em `public.profiles`;
- RLS habilitado em `public.assets`;
- RLS habilitado em `public.purchases`;
- RLS habilitado em `public.asset_prices`;
- RLS habilitado em `public.allocation_targets`;
- policies de `profiles` usando `(select auth.uid())`;
- policies de `assets` usando `(select auth.uid())`;
- policies de `purchases` usando `(select auth.uid())`;
- policies de insert e update de `purchases` validando que o ativo pertence ao
  usuário autenticado;
- policies de `asset_prices` usando `(select auth.uid())`;
- policies de insert e update de `asset_prices` validando que o ativo pertence
  ao usuário autenticado;
- policies de `allocation_targets` usando `(select auth.uid())`;
- policies de insert e update de `allocation_targets` validando ownership do
  ativo e coerência entre `assets.category` e `allocation_targets.category`;
- índice único de `assets` por `user_id + upper(ticker)`;
- índices de `purchases` por usuário, ativo, usuário + ativo, usuário + data de
  compra e usuário + status;
- índices de `asset_prices` por usuário, ativo, usuário + ativo, usuário + data
  de preço e usuário + ativo + data de preço;
- índices únicos parciais de `allocation_targets` por usuário + categoria e
  usuário + ativo, além de índices auxiliares por usuário, tipo de meta e ativo;
- advisors atuais de segurança limpos;
- avisos informativos `unused_index` para índices de `assets`, `purchases`,
  `asset_prices` e `allocation_targets` ainda não usados;
- nenhuma tela conectada ao banco real;
- nenhum dado real inserido;
- mocks continuam como fonte das experiências demonstrativas.

Planejado:

- Supabase Auth;
- PostgreSQL;
- Row Level Security;
- migrations versionadas;
- políticas por usuário;
- variáveis de ambiente;
- separação entre cliente e domínio.

## Segurança planejada

- nenhuma chave secreta no frontend;
- nenhuma credencial no repositório;
- RLS obrigatória para dados de usuário;
- validação de entrada;
- princípio do menor privilégio;
- secrets somente em ambiente seguro;
- logs sem dados sensíveis.

## Integrações futuras

Integrações candidatas sob avaliação:

- BRAPI para mercado brasileiro;
- Twelve Data para mercado internacional;
- Finnhub para notícias;
- Financial Modeling Prep para fundamentos;
- provedor de USD/BRL ainda a definir.

Nenhuma integração está aprovada apenas por estar listada.

Critérios futuros de avaliação:
