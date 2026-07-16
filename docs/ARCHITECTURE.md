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
