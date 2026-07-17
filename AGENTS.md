# AGENTS.md — Papo de Futuro

Este arquivo define como agentes de código devem trabalhar neste repositório.

O objetivo é permitir execução técnica autônoma com alto rigor, mantendo decisões de produto, domínio financeiro, arquitetura e segurança coerentes ao longo dos ciclos.

## 1. Papel do agente

O agente atua como engenheiro de software do Papo de Futuro.

Responsabilidades principais:

- ler o estado atual do repositório antes de alterar qualquer coisa;
- implementar o escopo solicitado de ponta a ponta;
- preservar decisões arquiteturais já integradas;
- rodar testes, format, lint e build;
- corrigir falhas encontradas dentro do escopo do ciclo;
- manter migrations pequenas, revisáveis e versionadas;
- produzir branches e commits claros;
- relatar exatamente o que foi alterado e validado.

O agente não deve redefinir sozinho a estratégia de produto nem inventar regras financeiras.

Quando uma decisão muda a lógica financeira central, o schema conceitual, a política de dados ou o escopo do produto, deve parar e registrar claramente a decisão necessária.

## 2. Leitura obrigatória e fonte de verdade

Antes de mudanças relevantes, ler:

- `README.md`;
- `AGENTS.md`;
- `docs/PRODUCT.md`;
- `docs/ARCHITECTURE.md`;
- `docs/CHANGELOG-DECISIONS.md`;
- `docs/ROADMAP.md`;
- migrations relacionadas ao escopo;
- testes relacionados ao escopo.

Antes de implementar, compare:

1. `main` atual;
2. código em `src`;
3. migrations versionadas em `supabase/migrations`;
4. testes existentes;
5. documentação;
6. instrução específica do ciclo atual.

A documentação pode ficar temporariamente defasada em relação ao código integrado.

Em caso de divergência operacional:

- código e migrations já integrados na `main` têm precedência sobre descrições antigas de estado;
- testes existentes são evidência importante do comportamento intencional;
- o schema real validado em ciclos anteriores deve ser respeitado;
- documentação desatualizada não deve ser usada para remover funcionalidades reais já integradas;
- a documentação deve ser corrigida em ciclo apropriado;
- decisões substituídas devem preservar o histórico em `docs/CHANGELOG-DECISIONS.md`.

Nunca assuma que uma seção antiga dizendo "planejado" significa que a funcionalidade ainda não existe. Confirme no código e no histórico recente.

## 3. Estado funcional atual

O Papo de Futuro é uma aplicação de inteligência para aportes em carteira fechada de ativos.

Estado já integrado:

- Supabase Auth real com fallback demo quando as variáveis públicas não estão configuradas;
- rotas internas protegidas quando Supabase está configurado;
- login, cadastro e logout;
- cliente Supabase tipado;
- repositories isolados entre UI e Supabase;
- universo fechado de 12 ativos materializado por usuário autenticado;
- RLS validado transacionalmente com dois usuários e 27 verificações;
- leitura real de carteira;
- leitura e persistência real de estratégia;
- taxas de câmbio USD/BRL persistidas;
- conversão monetária determinística entre BRL e USD;
- Histórico autenticado conectado a compras reais;
- registro real de compras confirmadas;
- Novo Aporte conectado a compras, preços, metas e câmbio reais;
- Motor Estratégico V2 multiativos integrado ao fluxo de Novo Aporte;
- Dossiê Técnico V1 puro e determinístico como fronteira derivada em memória
  entre o Motor V2 e futuras camadas qualitativas;
- Fundamental Facts V1 puro e determinístico como contrato normalizado em
  memória;
- Fundamental Derived Facts V1 puro, determinístico e auditável como camada
  separada em memória, sem persistência ou integração runtime;
- política News & Events V1 aprovada como Eventos Oficiais Primeiro, com CVM e
  SEC como únicas fontes automatizadas V1 e notícias editoriais adiadas;
- domínio puro `OfficialAssetEventV1` implementado com registry fechado dos 12
  ativos, taxonomia, precisão temporal explícita, identidade documental,
  deduplicação e histórico de revisões, sem banco ou runtime;
- provider CVM IPE V1 isolado para eventos oficiais de BBAS3, ITSA4, TAEE11,
  WEGE3 e PSSA3, com ZIP/CSV auditados, identidade forte, categorias fechadas e
  deduplicação em memória, sem storage, Supabase ou runtime;
- provider CVM V1 isolado para as cinco ações brasileiras e os quatro FIIs do
  universo fechado, com ingestão, storages e repositories Supabase injetados,
  ainda sem scheduler ou integração com telas; os adapters de FIIs foram
  integrados na PR #75;
- provider SEC N-PORT V1 isolado para VOO, VNQ e VEA, com descoberta
  determinística de filings, parsing XML factual e ingestão com fetch e storage
  injetados e adapter Supabase global tipado, ainda sem ingestão real, scheduler
  ou integração runtime;
- tabela global `fundamental_snapshots` aplicada e vazia no Supabase real, com
  tipos e adapters sincronizados para ações, FIIs e ETFs; a generalização SEC
  foi integrada na PR #76 e aplicada como
  `20260716203927_generalize_fundamental_snapshots_for_sec_nport`, preservando
  RLS, leitura autenticada e escrita privilegiada; o adapter SEC foi integrado
  na PR #77;
- modo demo preservado com mocks quando Supabase não está configurado.

O resultado de Novo Aporte continua sendo simulação. O sistema não executa ordens financeiras.

Não declarar como implementado algo que não esteja comprovado no runtime, código ou migrations integradas.

## 4. Stack e comandos obrigatórios

Stack principal:

- Vite;
- React 19;
- TypeScript;
- Tailwind CSS v4;
- React Router;
- Supabase JS;
- Vitest;
- ESLint;
- Prettier;
- npm.

Usar npm e manter `package-lock.json`.

Comandos obrigatórios de validação:

```bash
npm test
npm run format:check
npm run lint
npm run build
```

Todos devem passar antes de concluir um ciclo que altere código.

Se `npm run format:check` falhar exclusivamente por problema ambiental de symlink ao verificar `.`, use a checagem explícita:

```bash
npx prettier --check package.json package-lock.json index.html eslint.config.js vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json README.md AGENTS.md docs src supabase
```

Não tratar falha real de formatação como problema ambiental.

## 5. Estrutura arquitetural

### Apresentação

Responsável por:

- páginas;
- componentes;
- formulários;
- loading;
- erros;
- feedback;
- acessibilidade;
- responsividade.

Localização principal:

- `src/pages`;
- `src/features/*/components`;
- `src/components`.

A camada de apresentação não deve conter regras financeiras relevantes.

Toda a interface deve permanecer em português do Brasil.

### Domínio

Localização principal:

- `src/domain`;
- engines e funções puras de features financeiras quando ainda não migradas ao domínio comum.

O domínio deve ser:

- determinístico;
- puro quando possível;
- independente de React;
- independente de Supabase;
- testável;
- baseado em valores inteiros para dinheiro crítico e escalas explícitas para taxas.

Mocks não são fonte de verdade do domínio.

### Dados e infraestrutura

Localização principal:

- `src/data`;
- `src/lib`;
- `src/auth`;
- `supabase/migrations`;
- `supabase/tests`.

As telas não devem espalhar chamadas diretas ao Supabase.

Usar repositories como fronteira de persistência.

### IA

IA futura deve interpretar e explicar resultados determinísticos.

IA nunca deve substituir o motor determinístico nem ser a fonte oficial de cálculos de alocação, preço médio, rentabilidade, desvios ou distribuição do aporte.

## 6. Regras financeiras obrigatórias

### Dinheiro

- não usar ponto flutuante comum como fonte de verdade monetária;
- armazenar dinheiro em unidades menores inteiras;
- para BRL e USD atuais, unidades menores representam centavos;
- validar `Number.isSafeInteger` antes de aceitar valores críticos no domínio;
- evitar casts cegos de dados vindos do banco.

### Metas

- metas usam basis points;
- 10.000 basis points = 100,00%;
- não converter metas internamente para floats quando o cálculo puder permanecer inteiro;
- validar faixa de 0 a 10.000;
- validar somas quando a regra do fluxo exigir alocação completa.

### Câmbio

- nunca somar BRL e USD diretamente;
- normalizar valores para uma moeda comum antes de calcular participação global ou déficit de carteira;
- a moeda base operacional atual das visões agregadas é BRL;
- taxas de câmbio usam `rate_scaled` e `rate_scale`;
- a escala atual é 1.000.000;
- conversões devem usar helpers determinísticos do domínio;
- não inventar cotação USD/BRL;
- na ausência de taxa necessária, interromper o cálculo agregado e pedir uma taxa válida ou fonte real.

### Carteira

- posição é derivada de compras;
- não criar ou reintroduzir `holdings` sem decisão arquitetural explícita;
- somente compras `confirmed` formam posição atual;
- preço médio é derivado das compras;
- quantidade consolidada é derivada das compras;
- valor investido é derivado das compras;
- valor atual é derivado da posição e da cotação mais recente disponível;
- valores derivados não devem virar fonte primária persistida.

### Preços

- `asset_prices` armazena fatos de cotação;
- usar a cotação mais recente por ativo quando o fluxo pede valor atual;
- source atual aceita `manual` e `market-provider`;
- não fingir integração de mercado quando ela não existe;
- fallback para preço médio deve ser explícito e usado apenas onde o produto já decidiu aceitá-lo.

### Novo Aporte

- o motor é determinístico;
- o resultado é simulação, não execução de ordem;
- o motor pode considerar ativos do universo fechado ainda sem posição quando a estratégia exigir correção de alocação;
- estratégia proporcional exige patrimônio atual positivo;
- `target-allocation` usa metas globais individuais por ativo;
- o Motor V2 simula uma unidade inteira por iteração e escolhe de forma gulosa somente compras que reduzam o desvio total;
- o plano técnico seleciona no máximo 3 ativos distintos;
- o saldo pode permanecer não alocado quando nenhuma nova unidade acessível melhora estritamente a carteira;
- a IA futura pode interpretar o resultado técnico, mas não modificá-lo;
- não persistir automaticamente `ContributionPlan` até o fluxo de apresentação, aceite e confirmação estar arquiteturalmente fechado.

### Dossiê Técnico V1

- o dossiê é um contrato derivado em memória, não uma engine ou persistência;
- consolidar somente fatos já produzidos por `PortfolioSnapshot`, estratégia,
  helpers compartilhados de mercado e `TargetAllocationContributionResult`;
- não recalcular carteira, metas globais, câmbio, seleção, quantidades, preços
  de referência ou desvios dentro do dossiê;
- manter o builder puro, determinístico e independente de React, Supabase, APIs
  e fontes ambientais;
- `generatedAt` deve ser injetado pelo chamador;
- não inventar ranking técnico enquanto o Motor V2 não expuser esse fato;
- não persistir o dossiê nem enviá-lo a IA ou serviço externo sem nova decisão
  arquitetural explícita.

### Fundamental Facts V1

- fundamentos V1 representam fatos normalizados, não interpretação ou
  recomendação;
- manter o contrato independente de `TechnicalDossierV1`, React, Supabase,
  providers e APIs;
- valores contábeis monetários usam unidades menores inteiras signed em tipo
  próprio, sem alterar ou reutilizar a semântica não negativa de `MoneyAmount`;
- preservar período, fonte oficial conceitual, documento, data de referência e
  moeda factual sem conversão cambial;
- não calcular P/L, P/VP, margens, crescimento, valuation, ranking ou score na
  camada factual;
- `generatedAt` deve ser injetado, e o builder deve permanecer puro,
  determinístico e sem relógio ambiental;
- o provider CVM de ações brasileiras usa somente demonstrações consolidadas,
  versão numérica máxima, exercício corrente e seleção contábil auditável;
- uniformidade de `CD_CONTA` não basta para normalizar um fato: a semântica
  oficial deve ser compatível com o conceito do domínio;
- `totalRevenue` permanece `null` no provider CVM V1 porque DRE 3.01 não é
  economicamente comparável no universo auditado;
- fatos fundamentalistas persistidos são globais, sem `user_id` e sem FK para
  `assets`, e se associam ao universo por ticker, categoria e mercado;
- o provider SEC N-PORT de ETFs internacionais usa somente fontes oficiais da
  SEC, identidade fechada por CIK, series ID e class ID, seleciona filings
  `NPORT-P`/`NPORT-P/A` e preserva valores USD por parsing decimal exato;
- fatos financeiros N-PORT pertencem à série; todos os class IDs publicados
  devem ser preservados, e a classe ETF esperada apenas associa a série ao
  ticker do universo fechado;
- o acesso a `data.sec.gov` e aos documentos EDGAR deve ocorrer em contexto
  server-side com User-Agent identificável e fair access; não chamar a SEC do
  navegador, pois `data.sec.gov` não oferece CORS para esse consumo;
- ingestão real, integração runtime e scheduler exigem ciclos posteriores
  explícitos;
- o provider CVM de FIIs usa o Informe Mensal oficial, identidade fechada por
  CNPJ, nome e ISIN, e não arredonda quantidades de cotas fracionárias para
  satisfazer um contrato inteiro; cotas oficiais decimais usam coeficiente
  inteiro seguro e escala, com texto bruto preservado na proveniência.

### Fundamental Derived Facts V1

- derivados fundamentalistas são uma camada separada de `FundamentalFactsV1` e
  nunca modificam os snapshots factuais recebidos;
- cada métrica aponta para o mesmo asset, data, período, fonte e documento do
  snapshot factual que a originou;
- razões usam `BigInt`, escala fixa de 1.000.000 e arredondamento
  half-away-from-zero, sem aritmética financeira intermediária em ponto
  flutuante;
- entradas ausentes, denominadores não positivos, moedas divergentes e
  resultados fora do intervalo seguro permanecem explicitamente indisponíveis;
- não calcular derivados de preço de mercado, crescimento, score, ranking ou
  recomendação, nem modificar o plano técnico do Motor V2;
- manter o builder puro, determinístico, em memória e independente de React,
  Supabase, providers, APIs e fontes ambientais;
- não persistir nem integrar os derivados ao runtime ou à UI sem nova decisão
  arquitetural explícita.

### News & Events V1

- o domínio puro `OfficialAssetEventV1` já cobre contratos, mapping fechado,
  taxonomia, normalização temporal, deduplicação e relações entre revisões;
- o provider CVM IPE V1 de ações usa fetch injetado, registry canônico, código
  CVM e CNPJ exatos e allowlist fechada de denominações oficiais da fonte;
- domínio e provider permanecem determinísticos e sem banco, migration,
  Supabase, runtime ou UI;
- somente CVM para ações/FIIs e SEC EDGAR para ETFs estão aprovadas como fontes
  automatizadas V1;
- B3, RI, gestores e Vanguard são apenas verificação humana; GDELT é apenas
  pesquisa exploratória; providers editoriais estão adiados;
- eventos oficiais são fatos contextuais; notícias são documentos editoriais e
  os contratos não podem apagar essa distinção;
- nenhum contexto altera `FundamentalFactsV1`, `FundamentalDerivedFactsV1`,
  `TechnicalDossierV1`, Motor V2, metas ou plano técnico;
- associar itens somente por identidade forte e mapping fechado, nunca por fuzzy
  matching ou nome parecido;
- não criar sentimento, score, ranking, recomendação ou classificação por IA;
- armazenar apenas metadados e textos permitidos pelos termos, com URL,
  atribuição e proveniência;
- falha ou ausência de contexto nunca bloqueia carteira, motor ou Novo Aporte;
- `EditorialAssetNewsV1` permanece apenas conceitual, sem implementação aprovada;
- implementar providers somente nos ciclos próprios posteriores e na sequência
  aprovada em `docs/NEWS_EVENTS_V1_DESIGN.md`; o próximo é o provider CVM para
  eventos de FIIs.

## 7. Modelos e valores atuais do domínio

Modelos principais incluem:

- `Asset`;
- `Purchase`;
- `AssetPrice`;
- `ExchangeRate`;
- `AllocationTarget`;
- `PortfolioPosition`;
- `ContributionPlan`;
- `ContributionPlanItem`.

Categorias atuais:

- `brazilian-stock`;
- `real-estate-fund`;
- `international-etf`;
- `fixed-income`;
- `cash`.

Mercados atuais:

- `BR`;
- `US`;
- `INTERNAL`.

Moedas atuais:

- `BRL`;
- `USD`.

Status de compra atuais:

- `planned`;
- `confirmed`;
- `cancelled`.

Não inventar novos valores para unions sem atualizar domínio, schema, migrations, mapeadores e testes de forma coerente.

Não adicionar ativos fora do universo definido sem decisão registrada.

Não criar uma nova categoria de renda fixa apenas por conveniência de implementação. A categoria `fixed-income` já existe no domínio, mas inclusão de ativos e fluxo funcional exige decisão de produto registrada.

## 8. Supabase e schema real

Projeto Supabase de produção:

- project ref `vxjrncwfysglinfktifz`.

Tabelas públicas reais atuais:

- `profiles`;
- `assets`;
- `purchases`;
- `asset_prices`;
- `allocation_targets`;
- `exchange_rates`.

Todas as tabelas de dados do usuário usam RLS.

A função real `public.replace_allocation_targets(jsonb)` existe e está versionada. Ela substitui atomicamente todas as metas do usuário autenticado.

### Regras para migrations

- alterações futuras no banco exigem migrations;
- criar migrations novas; nunca editar migration já aplicada para "corrigir histórico";
- nomear com timestamp real e descrição em snake_case;
- manter escopo pequeno e revisável;
- usar RLS para tabelas por usuário;
- preferir `(select auth.uid())` nas policies;
- validar ownership de entidades relacionadas quando necessário;
- usar `security invoker` por padrão em funções expostas ao usuário, salvo justificativa revisada;
- fixar `search_path` em funções SQL/PLpgSQL;
- revogar `PUBLIC` e `anon` quando a função for exclusiva de usuário autenticado;
- conceder somente privilégios mínimos necessários a `authenticated`;
- não usar `using (true)` em dados privados;
- não inserir dados fictícios de usuário em migrations de produção;
- não hardcodar `user_id` fictício;
- não criar extensões sem necessidade clara;
- não usar `gen_random_uuid()` automaticamente se a entidade atual recebe ID da aplicação, salvo decisão explícita de mudança.

### Aplicação em produção

O agente de código não deve assumir que uma migration integrada foi aplicada no Supabase real.

Ele deve:

- versionar a migration;
- validar o código;
- relatar que a aplicação real ainda é uma etapa separada, quando não tiver ferramenta ou instrução explícita para produção.

Não declarar schema de produção como atualizado apenas porque o arquivo SQL foi criado.

## 9. RLS e segurança

O isolamento por usuário é requisito central.

Regras:

- `user_id` deve vir da sessão autenticada no fluxo de aplicação;
- não confiar em `user_id` fornecido livremente por formulário;
- RLS deve ser a barreira final de banco;
- policies de insert/update devem validar ownership de FKs sensíveis;
- acesso cruzado entre usuários deve ser testado quando novas tabelas ou relações privadas forem criadas;
- não conceder acesso a `anon` em dados financeiros privados;
- não conceder acesso amplo a `PUBLIC`;
- não usar service role no navegador;
- nunca versionar secrets, chaves ou credenciais;
- nunca incluir `SUPABASE_SERVICE_ROLE_KEY` em Vite ou variáveis `VITE_*`;
- variáveis `VITE_*` são públicas no bundle e devem conter apenas valores públicos adequados.

O teste transacional de isolamento RLS em `supabase/tests/database` deve continuar válido e ser ampliado quando novas tabelas privadas forem incorporadas ao fluxo do usuário.

## 10. Repositories e acesso a dados

A UI não deve conhecer `snake_case` do banco.

Repositories devem:

- receber cliente Supabase tipado;
- executar consultas e mutações;
- mapear rows para modelos de domínio;
- validar strings vindas do banco contra unions do domínio;
- lançar erros claros em dados incompatíveis;
- devolver domínio em `camelCase`;
- manter detalhes do Supabase isolados.

Evitar `as unknown as`.

Quando ele existir apenas por types gerados desatualizados, preferir regenerar `src/lib/database.types.ts` a manter schemas paralelos manuais.

Não criar um segundo repository para o mesmo recurso sem revisar o contrato existente.

## 11. Types gerados do Supabase

`src/lib/database.types.ts` é artefato gerado a partir do schema real.

Regras:

- preservar o formato gerado pelo Supabase;
- o arquivo pode permanecer ignorado pelo Prettier se esse for o padrão atual;
- após mudança real de schema aplicada, regenerar os types em ciclo apropriado;
- eliminar schemas complementares manuais quando os types gerados já cobrem o recurso;
- não editar o type gerado manualmente para fingir que uma tabela ou função existe.

## 12. Auth e modo demo

O app possui dois modos operacionais relevantes.

### Supabase configurado

- Auth real;
- rotas internas exigem sessão;
- repositories reais;
- dados isolados por RLS;
- persistência real nos fluxos já conectados.

### Supabase não configurado

- modo demo;
- mocks determinísticos;
- nenhuma persistência real;
- experiência visual continua acessível.

Ao conectar uma feature real:

- preservar o modo demo, salvo decisão explícita de removê-lo;
- não mostrar mensagem de persistência real no modo demo;
- não usar mocks como fallback silencioso quando uma consulta real autenticada falhar;
- em modo autenticado, erro real deve ser tratado como erro, não substituído por dados demonstrativos.

## 13. Universo fechado de ativos

O produto atual trabalha com um universo fechado de 12 ativos versionado no app.

O catálogo é materializado por usuário via bootstrap idempotente.

Regras:

- não criar seed SQL global com usuário fictício;
- comparar tickers case-insensitive;
- respeitar a unicidade por usuário + ticker normalizado;
- novos ativos do produto exigem revisão de catálogo, categoria, mercado, moeda, defaults de estratégia e testes relacionados;
- ativos fora do universo fechado não devem ser silenciosamente aceitos por fluxos que dependem desse universo.

## 14. ContributionPlan

`ContributionPlan` e `ContributionPlanItem` existem no domínio, mas a persistência foi deliberadamente adiada.

Não criar `contribution_plans` ou `contribution_plan_items` por iniciativa própria.

Revisitar essas tabelas quando o fluxo estiver explicitamente cobrindo:

- apresentação do plano;
- aceite ou rejeição;
- confirmação;
- relação entre item planejado e compra efetivamente registrada;
- auditoria do plano original versus execução.

## 15. Escopo e decisões

Implementar apenas o escopo solicitado.

Não avançar espontaneamente para outro produto, outra arquitetura ou regra financeira não pedida.

Isso não impede corrigir dependências técnicas necessárias para concluir o ciclo com segurança.

Quando encontrar uma dependência crítica:

- explicar o bloqueio;
- corrigir dentro do ciclo se for uma consequência técnica direta e segura;
- parar se a correção exigir nova decisão de produto, mudança financeira central ou nova política de dados.

Não alterar regras de produto silenciosamente.

Registrar decisões relevantes em `docs/CHANGELOG-DECISIONS.md`.

Atualizar o roadmap somente após implementação, validação, revisão e integração.

## 16. Fluxo Git obrigatório

Para cada ciclo:

1. partir da `main` atual;
2. verificar o hash base;
3. garantir diretório limpo;
4. criar branch específica;
5. implementar apenas o escopo necessário;
6. revisar diff;
7. rodar validações obrigatórias;
8. criar commits descritivos;
9. fazer push da branch;
10. abrir PR ou entregar branch conforme a instrução do ciclo.

Nunca trabalhar diretamente na `main`.

Nomes sugeridos:

- `feat/...` para funcionalidade;
- `fix/...` para correção;
- `db/...` para migrations/schema;
- `test/...` para testes;
- `docs/...` para documentação;
- `refactor/...` para refactor sem mudança funcional intencional.

Commits e PRs devem explicar:

- problema;
- alteração;
- comportamento resultante;
- segurança ou consistência quando relevante;
- itens fora do escopo.

## 17. Critério de conclusão

Um ciclo de código só está concluído quando:

- escopo implementado;
- diff revisado;
- nenhum arquivo não relacionado alterado;
- `npm test` aprovado;
- `npm run format:check` aprovado;
- `npm run lint` aprovado;
- `npm run build` aprovado;
- nenhuma dependência alterada sem necessidade explícita;
- migrations antigas intactas;
- nenhum secret incluído;
- comportamento demo preservado quando aplicável;
- relatório final descreve fatos, não suposições.

Evitar arquivos excessivamente grandes e responsabilidades misturadas.

Se o ambiente impedir uma validação, informar exatamente qual comando falhou, por quê e qual evidência alternativa foi obtida.

Não declarar teste aprovado sem executá-lo.

## 18. Bugs encontrados durante outro ciclo

Se encontrar bug crítico de segurança, integridade financeira ou corrupção de dados:

- interromper a expansão do escopo;
- corrigir ou isolar o problema primeiro;
- adicionar teste de regressão quando possível;
- relatar claramente a descoberta.

Se encontrar problema pequeno não relacionado:

- não aumentar silenciosamente o escopo;
- registrar no relatório;
- corrigir somente se for necessário para concluir o ciclo atual com segurança.

## 19. Princípios de produto

O Papo de Futuro deve explicar e apoiar decisões de aporte, não prometer retorno nem executar recomendação financeira cega.

Princípios:

- cálculos antes de explicações de IA;
- fatos persistidos, derivados recalculados;
- transparência de fonte e data para preço e câmbio;
- não misturar moedas;
- não esconder ausência de dados;
- não tratar mock como dado real;
- não executar compra automaticamente;
- não classificar um ativo como "bom" ou "ruim" sem uma regra de produto explicitamente definida;
- manter o motor determinístico e auditável.

## 20. Formato esperado do relatório do agente

Ao terminar, informar objetivamente:

1. branch;
2. hash base da `main`;
3. commits criados;
4. arquivos alterados;
5. comportamento implementado;
6. decisões técnicas relevantes;
7. testes executados e resultado;
8. format, lint e build;
9. migrations criadas ou alteradas;
10. se algum SQL foi executado;
11. se o Supabase real foi alterado;
12. riscos, limitações ou itens fora do escopo;
13. situação do diretório Git;
14. situação do push e PR.

Nunca afirmar que alterou Supabase real quando apenas criou migration local.

Nunca afirmar que uma tela está conectada a dados reais sem verificar o fluxo runtime autenticado.
