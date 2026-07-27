# Papo de Futuro — Handoff do Projeto

Snapshot preparado em 21 de julho de 2026 e atualizado em 27 de julho de 2026
para continuidade técnica, revisão e operação controlada. Este documento resume
o estado comprovado pelo código, migrations, testes e decisões mais recentes.
Ele não substitui os contratos ou runbooks especializados citados ao longo do
texto.

A atualização de 27 de julho corrigiu a seção 3, que afirmava que a série ainda
não havia sido publicada. Ela havia sido, por um mecanismo que falhou; o
histórico está registrado abaixo.

Este documento é versionado na `main` antes do merge do PR #86. Portanto ele
cita caminhos que ainda não existem na `main` — `src/server/context`,
`src/application/context`, `src/features/official-events`, `docs/runbooks` e as
quatro migrations de eventos oficiais chegam com aquele PR.

## 1. Resumo executivo

O Papo de Futuro é uma aplicação de inteligência para aportes de longo prazo em
um universo fechado de 12 ativos. O produto combina dados financeiros por
usuário, um motor determinístico de alocação e contratos auditáveis para fatos
fundamentalistas e eventos regulatórios.

Estado consolidado:

- autenticação Supabase real com fallback demo quando o ambiente não está
  configurado;
- carteira, compras, histórico, estratégia, cotações e câmbio conectados por
  repositories nos fluxos autenticados;
- Motor Estratégico V2 multiativos integrado ao Novo Aporte;
- Dossiê Técnico V1, Fundamental Facts V1 e Fundamental Derived Facts V1 como
  contratos puros e determinísticos;
- providers oficiais CVM e SEC implementados para fundamentos e eventos;
- infraestrutura completa de eventos oficiais implementada localmente, mas não
  aplicada ao Supabase e mantida em modo `disabled`;
- notícias editoriais em `NO-GO`; IA, sentimento e score não foram integrados;
- modo demo preservado e sem fallback silencioso após erro de consulta real.

Nenhuma ordem financeira é executada automaticamente. O plano de aporte é uma
simulação e a decisão permanece com o usuário.

## 2. Fontes de verdade e precedência

Ao encontrar divergência, usar esta ordem:

1. comportamento integrado e testes do código atual;
2. migrations versionadas e estado remoto explicitamente validado;
3. `AGENTS.md`;
4. decisões mais recentes em `docs/CHANGELOG-DECISIONS.md`;
5. `docs/PRODUCT.md` e seções recentes de `docs/ARCHITECTURE.md`;
6. roadmap e documentos históricos.

Há dívida documental conhecida: partes de `README.md`, do início de
`docs/ARCHITECTURE.md` e de `docs/SUPABASE_SCHEMA_PLAN.md` ainda descrevem o app
como apenas demonstrativo. Não remover fluxos reais com base nesses trechos.
`AGENTS.md`, `docs/PRODUCT.md`, o código e as migrations mais recentes têm
precedência.

Leitura obrigatória antes de alterar o projeto:

- `AGENTS.md`;
- `docs/PRODUCT.md`;
- `docs/ARCHITECTURE.md`;
- `docs/CHANGELOG-DECISIONS.md`;
- `docs/ROADMAP.md`;
- documentos especializados da área alterada.

## 3. Estado Git no momento do handoff

- Série: 10 commits sobre `2808fc3cc385613c0f9914c24b8beb238409e7b9`, cobrindo
  storage, migration, adapter, executor, backfill, leitura, runtime, UI,
  auditoria editorial e readiness de deployment.
- HEAD da série: `fed151be0246146cb076e0cdb555549b9f1a7316`.
- `origin/main`: `2808fc3cc385613c0f9914c24b8beb238409e7b9`.
- A série foi publicada em 27 de julho de 2026 na branch
  `ops/official-events-series-v1` e mergeada em `main` pelo PR #86 no mesmo dia,
  como merge commit `e747bd2bbe00920eacc3957243bc62f92592a405`.
- A publicação usou push de criação, sem force push e sem rebase. A base da
  série coincidia exatamente com `origin/main` no momento do push, então ela
  aplicou sem reescrita de histórico. Os 10 SHAs individuais dos commits da
  série foram preservados: o merge não usou squash nem rebase.
- `.chatgpt-upload/` está ignorada apenas em `.git/info/exclude` e não deve ser
  adicionada ao Git.

### Incidente de publicação — PR #85 fechado

A primeira tentativa de publicação contornou uma falha do Git Credential Manager
no Windows codificando a série em `xz` mais base64 e commitando os pedaços na
branch `ops/official-events-deployment-readiness-v1`, junto de dois workflows
que reconstruiriam o patch e fariam `git push --force`.

O passo de reconstrução falhou com `xz: (stdin): Compressed data is corrupt`.
Como consequência, o PR #85 continha apenas 18 arquivos — 16 pedaços
`.bootstrap/*.chunk-*` e os dois workflows com `permissions: contents: write` — e
nenhuma linha da funcionalidade. Como a `main` não possuía workflows, mergear o
#85 teria introduzido automação com force push na branch principal sem entregar
a feature.

O PR #85 foi fechado e substituído pelo #86. A branch
`ops/official-events-deployment-readiness-v1` foi preservada como evidência do
incidente e não deve ser mergeada.

Houve uma tentativa anterior, o PR #84, que usava um patch gzip e o workflow
`publish-official-events-series.yml`. Sua base era
`automation/publish-official-events-series`, nunca a `main`, então ele não podia
contaminar a branch principal. Ainda assim foi fechado em 27 de julho de 2026,
por dois motivos: o propósito já estava cumprido pelo #86, e o workflow declarava
`permissions: contents: write` disparando em `pull_request`. Enquanto o PR
estivesse aberto, qualquer push na branch head o reexecutaria e sobrescreveria a
branch de evidência.

As branches `automation/publish-official-events-series` e
`automation/trigger-official-events-series` foram mantidas e seguem pendentes de
decisão. A primeira é byte a byte idêntica à `main` e não carrega informação. A
segunda contém o patch gzip e o workflow da primeira tentativa.

O patch de transporte
`.chatgpt-upload/official-events-complete-with-deployment-readiness-v1.patch`
tornou-se obsoleto: a série está publicada por Git normal e não depende mais de
transporte alternativo.

Lição registrada: o contorno era mais arriscado que o problema que resolvia.
Quando o push falhar por credencial, verificar primeiro se há um caminho
autenticado disponível — o `gh` CLI autenticado publicou a série sem
dificuldade — em vez de construir automação com permissão de escrita.

## 4. Produto e universo financeiro

Missão: ajudar o usuário a identificar o melhor próximo aporte possível com
base em estratégia, fatos e capital disponível, mantendo explicabilidade e
controle humano.

Princípios ativos:

- estratégia acima de opinião;
- dados acima de achismos;
- motor determinístico como verdade matemática;
- APIs e providers como fontes de fatos;
- IA futura apenas como interpretação;
- nenhum ativo fora do universo fechado entra silenciosamente;
- nenhum valor derivado é persistido como fato primário sem decisão explícita.

Estratégia total:

| Categoria           | Estratégia total |  Meta na parcela monitorada |
| ------------------- | ---------------: | --------------------------: |
| Ações brasileiras   |              30% |                    35,2941% |
| Fundos imobiliários |              30% |                    35,2941% |
| Internacional       |              25% |                    29,4118% |
| Renda fixa          |              15% | Fora do monitoramento atual |

Universo fechado:

- ações: BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3;
- FIIs: KNRI11, VISC11, XPLG11 e HGRU11;
- ETFs internacionais: VOO, VNQ e VEA.

Renda fixa faz parte da estratégia total, mas continua acompanhada fora do
sistema. Não criar categoria ou fluxo adicional sem nova decisão de produto.

## 5. Fluxos funcionais atuais

### Autenticação e modos

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` válidos:

- Supabase Auth real;
- cadastro, login, sessão e logout;
- rotas internas protegidas;
- repositories reais e isolamento por RLS.

Sem as variáveis públicas:

- modo demo determinístico;
- nenhuma persistência real;
- experiência visual preservada.

Erro real no modo autenticado não deve ser mascarado por mocks.

### Rotas

- `/login`;
- `/dashboard`;
- `/carteira`;
- `/novo-aporte`;
- `/historico`;
- `/eventos-oficiais`;
- `/estrategia`;
- `/configuracoes`.

A rota de eventos oficiais existe, mas a composição real está explicitamente
em `disabled`. O item não aparece na navegação e a rota não consulta Supabase.

### Carteira, compras e estratégia

- o catálogo fechado é materializado por usuário de forma idempotente;
- o Histórico usa `PurchaseRepository` para criar, editar e cancelar compras;
- compras canceladas são preservadas, mas não formam posição;
- somente compras `confirmed` participam da carteira;
- preço médio, quantidade, valor investido e resultado são derivados dos fatos;
- metas são persistidas em basis points por repository;
- `replace_allocation_targets(jsonb)` substitui metas atomicamente;
- `ContributionPlan` existe no domínio, mas sua persistência foi adiada;
- não existem tabelas `holdings`, `contribution_plans` ou
  `contribution_plan_items`.

### Mercado e câmbio

- preços usam unidades menores inteiras em BRL ou USD;
- USD/BRL é persistido com conversão determinística;
- `MarketDataRepository` isola refresh e consumo;
- a Edge Function `refresh-market-data` possui providers B3 COTAHIST e Twelve
  Data;
- `TWELVE_DATA_API_KEY` é secret exclusivamente server-side e nunca `VITE_*`;
- o estado efetivo de publicação da Edge Function deve ser confirmado no
  ambiente antes de qualquer operação.

## 6. Motor Estratégico V2

Implementação principal:
`src/features/contribution/strategies/targetAllocationStrategy.ts`.

Invariantes:

- metas globais somam exatamente `10000` basis points;
- dinheiro crítico usa inteiros seguros e `BigInt` nos intermediários;
- algoritmo guloso compra uma unidade inteira por iteração;
- cada unidade precisa reduzir estritamente o desvio total;
- até três ativos distintos por plano (`MAX_PLAN_ASSETS = 3`);
- saldo permanece não alocado quando não existe unidade acessível que melhore a
  carteira;
- ordem de seleção é preservada;
- o motor não executa ordens e não persiste o plano automaticamente.

Não substituir o algoritmo unitário por heurística em lote sem decisão
arquitetural e suíte de regressão financeira.

## 7. Dossiê Técnico e fundamentos

### TechnicalDossierV1

Contrato puro `technical-dossier.v1`, derivado em memória. Consolida snapshot da
carteira, estratégia, fatos de mercado e resultado já calculado do Motor V2.
Não recalcula o plano, não persiste dados, não chama IA e declara limitações de
forma explícita.

### FundamentalFactsV1

Contrato factual global, normalizado e determinístico:

- ações brasileiras: lucro líquido, ativos, patrimônio líquido e fluxo de
  caixa operacional; `totalRevenue` permanece `null` por falta de
  comparabilidade comprovada para BBAS3;
- FIIs: patrimônio líquido, cotas emitidas e cotistas, preservando decimais
  exatos sem float;
- ETFs: ativos, passivos e patrimônio líquido em USD por série SEC.

Providers:

- CVM DFP/ITR para as cinco ações;
- CVM Informe Mensal para os quatro FIIs;
- SEC N-PORT para VOO, VNQ e VEA.

### FundamentalDerivedFactsV1

Deriva em memória razões auditáveis e reconciliações. Usa escala fixa,
`BigInt`, arredondamento definido e estados explícitos de indisponibilidade.
Não produz score, ranking ou recomendação e não está conectado à UI.

### Persistência factual

`fundamental_snapshots` é uma tabela global sem `user_id` ou FK para assets. O
estado documentado mais recente informa migration aplicada, tabela vazia, RLS,
leitura autenticada e escrita privilegiada. Antes de operar, confirmar esse
estado no ambiente autorizado; não inferir aplicação remota apenas pelos
arquivos locais.

## 8. Eventos oficiais e notícias

Política: Eventos Oficiais Primeiro.

Fontes automatizadas V1:

- CVM IPE para eventos das cinco ações;
- CVM Fund Delivery mensal para eventos dos quatro FIIs;
- SEC EDGAR para eventos dos três ETFs.

Os providers usam identidades regulatórias exatas, taxonomia fechada,
deduplicação determinística, precisão temporal explícita e proveniência. Não
fazem fuzzy matching, scoring, sentimento ou leitura editorial.

Infraestrutura local concluída:

1. domínio `OfficialAssetEventV1`;
2. três providers oficiais;
3. record global lossless com 58 campos;
4. migration de `official_asset_events`;
5. RPC transacional de upsert server-side;
6. executor sequencial com fetch seguro;
7. checkpoint e backfill reiniciável;
8. repository global de leitura e cursor determinístico;
9. runtime opcional `disabled`/`read-only`;
10. UI autenticada opcional;
11. auditoria editorial V2 em `NO-GO`;
12. pacote de readiness operacional.

Estado operacional obrigatório:

- nenhuma das quatro migrations de eventos foi aplicada;
- nenhum backfill foi executado;
- nenhuma linha foi persistida;
- `src/lib/database.types.ts` ainda não inclui o schema de eventos;
- `OFFICIAL_EVENTS_REAL_UI_MODE` permanece `disabled`;
- nenhuma notícia editorial foi aprovada ou implementada.

Migrations pendentes, nesta ordem:

1. `20260719165850_create_official_asset_events.sql`;
2. `20260719173416_create_official_asset_events_upsert_rpc_v1.sql`;
3. `20260719221733_create_official_events_backfill_checkpoint_v1.sql`;
4. `20260719235049_create_official_asset_events_read_rpcs_v1.sql`.

Runbooks obrigatórios:

- `docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md`;
- `docs/runbooks/OFFICIAL_EVENTS_SECURITY_CHECKLIST_V1.md`;
- `docs/runbooks/official-events-deployment-manifest-v1.json`;
- `docs/runbooks/sql/official-events-post-deployment-checks-v1.sql`.

Validador local:

```bash
npm run verify:official-events-deployment
```

Não aplicar migrations, regenerar types, executar canário, ativar runtime ou
mostrar sidebar no mesmo passo. Cada transição exige autorização separada.

## 9. Supabase, schema e segurança

Projeto documentado:

- nome: Papodefuturo;
- project ref: `vxjrncwfysglinfktifz`;
- região: `us-east-1`.

Tabelas privadas documentadas como aplicadas:

- `profiles`;
- `assets`;
- `purchases`;
- `asset_prices`;
- `allocation_targets`;
- `exchange_rates`.

Regras inegociáveis:

- RLS em toda tabela privada exposta;
- `user_id` vem da sessão, nunca do formulário como fonte confiável;
- insert/update validam ownership das relações;
- `(select auth.uid())` nas policies privadas;
- `anon` não acessa dados financeiros privados;
- `service_role` nunca aparece no browser, em `VITE_*`, logs ou commits;
- funções privilegiadas usam `search_path` fixo e grants mínimos;
- `database.types.ts` é gerado, não editado manualmente;
- migration integrada não significa migration aplicada;
- mudanças de schema exigem nova migration; migrations aplicadas não são
  reescritas.

Eventos e fundamentos são dados globais, não dados por usuário. As policies e
grants desses recursos seguem contratos próprios e não devem receber
`auth.uid()` ou FK para `assets` por conveniência.

## 10. Arquitetura e mapa de diretórios

```text
src/app                         composição e roteamento
src/auth                        sessão e fronteira demo/real
src/components                  layout e UI compartilhada
src/domain                      modelos e contratos puros
src/features                    apresentação e casos de uso por feature
src/data/repositories           repositories financeiros e mappers Supabase
src/data/fundamentals           providers e adapters de fundamentos
src/data/context/official-events providers, storage e leitura de eventos
src/application/context         runtime browser-compatible de eventos
src/server/context              executor e backfill server-side
src/lib                         ambiente, client e types Supabase
supabase/migrations             histórico versionado do schema
supabase/functions              Edge Function de atualização de mercado
docs/runbooks                   operação controlada
docs/audits                     evidências de auditorias externas
```

Fronteiras:

- React não contém cálculo financeiro central;
- páginas e componentes não chamam Supabase diretamente;
- repositories convertem banco `snake_case` para domínio `camelCase`;
- providers externos ficam em data/server;
- domínio não depende de React, Supabase ou rede;
- runtime opcional falha sem bloquear carteira, motor ou autenticação.

## 11. Stack, ambiente e comandos

Stack:

- Node.js 24+ e npm 11+;
- React 19, TypeScript 6, Vite 8;
- Tailwind CSS 4 e React Router 7;
- Supabase JS 2;
- Vitest, ESLint e Prettier.

Instalação e desenvolvimento:

```bash
npm install
npm run dev
```

Validação obrigatória para ciclos de código:

```bash
npm test
npm run format:check
npm run lint
npm run build
git diff --check
```

Última baseline validada no ciclo de readiness:

- 116 arquivos de teste;
- 2012 testes aprovados;
- lint sem avisos;
- build aprovado;
- aviso conhecido: chunk principal acima de 500 kB.

Produção documentada: `https://papodefuturo.vercel.app`. Confirmar o deployment
vigente antes de associá-lo a um SHA específico.

## 12. Decisões arquiteturais ativas

O registro completo está em `docs/CHANGELOG-DECISIONS.md` (`DEC-001` a
`DEC-037`). Grupos principais:

- produto e universo fechado: `DEC-001` a `DEC-006`;
- fatos, cálculos e persistência: `DEC-007` a `DEC-014`;
- Motor V2 e Dossiê Técnico: `DEC-015` e `DEC-016`;
- fundamentos e providers CVM/SEC: `DEC-017` a `DEC-022`;
- política, domínio e providers de eventos: `DEC-023` a `DEC-027`;
- storage, banco, execução, leitura, runtime e UI de eventos: `DEC-028` a
  `DEC-035`;
- auditoria editorial `NO-GO`: `DEC-036`;
- deployment faseado e posterior: `DEC-037`.

Não alterar uma decisão financeira, de identidade ou segurança de forma
silenciosa. Decisão nova ou reversão exige registro explícito.

## 13. Riscos e dívidas conhecidas

- série de eventos oficiais mergeada em `main` pelo PR #86 em 27 de julho de 2026. O código está integrado; nada disso implica schema aplicado no Supabase
  real — ver o próximo item;
- o repositório não possuía CI até 27 de julho de 2026. O PR #87 adicionou
  `.github/workflows/validate.yml` e foi mergeado nessa data, tornando o gate
  "CI aprovado" do runbook de deployment satisfazível a partir daquele ponto.
  Antes disso, todas as validações desta série foram executadas manualmente e
  documentadas nos PRs correspondentes;
- as duas branches `automation/*` do contorno de publicação seguem sem decisão.
  Os PRs #84 e #85 foram fechados; o #86 e o #87 foram mergeados;
- migrations de eventos não aplicadas e types ainda desatualizados para esse
  schema. O merge do #86 não aplicou nenhuma migration nem alterou o Supabase
  real — apenas versionou código e SQL local;
- runtime e UI de eventos continuam desabilitados por desenho;
- fundamentos permanecem sem ingestão real, scheduler ou UI;
- notícias editoriais não têm provider aprovado;
- IA explicativa, comitê, sentimento e score não existem;
- `ContributionPlan` não é persistido;
- documentação histórica possui trechos contraditórios com o estado integrado;
- bundle possui aviso preexistente acima de 500 kB;
- o runner Codex no Windows já apresentou falha de HTTPS/Git Credential Manager
  sob usuário sandbox diferente. Não alterar remote ou credenciais para
  contornar; usar integração autenticada aprovada ou patch validado.

## 14. Próxima sequência recomendada

O código está integrado em `main` desde 27 de julho de 2026 (PRs #86 e #87). A
fase operacional de eventos oficiais, que toca o Supabase real, ainda não foi
executada:

1. confirmar ambiente, operador, janela e backup;
2. conferir hashes do manifesto;
3. aplicar as quatro migrations em ordem;
4. executar checks read-only de schema, RLS, grants e RPCs;
5. regenerar e revisar `database.types.ts`;
6. executar smoke tests sem backfill;
7. executar canário de um job com runtime ainda `disabled`;
8. validar dados, conflitos e checkpoint;
9. autorizar separadamente runtime `read-only`;
10. ativar navegação pela capability e monitorar.

Qualquer drift, hash divergente, deployment parcial, grant inesperado, dado
inesperado ou falha de backup é `NO-GO` imediato. Após existirem dados, preferir
forward fix; não apagar eventos como rollback automático.

## 15. Checklist para o próximo responsável

Antes de começar:

- ler `AGENTS.md` e os documentos da feature;
- confirmar branch, HEAD, base e worktree;
- verificar no GitHub se a série já foi publicada;
- não confiar em refs locais antigas sem sincronização autorizada;
- confirmar se o ciclo é apenas local, remoto ou de produção;
- preservar demo e RLS;
- não expor secrets ou service role;
- não executar SQL, provider, backfill ou migration sem autorização explícita.

Antes de entregar:

- revisar todo o diff;
- executar as validações obrigatórias;
- confirmar migrations antigas intactas;
- informar claramente se houve SQL, Supabase, push ou PR;
- diferenciar “versionado”, “integrado” e “aplicado em produção”;
- atualizar documentação apenas com fatos comprovados.

## 16. Arquivos-chave

- regras do projeto: `AGENTS.md`;
- produto: `docs/PRODUCT.md`;
- arquitetura: `docs/ARCHITECTURE.md`;
- decisões: `docs/CHANGELOG-DECISIONS.md`;
- roadmap: `docs/ROADMAP.md`;
- schema histórico: `docs/SUPABASE_SCHEMA_PLAN.md`;
- News & Events: `docs/NEWS_EVENTS_V1_DESIGN.md`;
- readiness: `docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md`;
- engine: `src/features/contribution/strategies/targetAllocationStrategy.ts`;
- snapshot da carteira: `src/domain/portfolioSnapshot.ts`;
- dossiê: `src/domain/technicalDossier`;
- fundamentos: `src/domain/fundamentals` e `src/data/fundamentals`;
- eventos: `src/domain/context/official-events` e
  `src/data/context/official-events`;
- runtime de eventos: `src/application/context/official-events/runtime`;
- composição real: `src/features/official-events/composition.ts`;
- types gerados: `src/lib/database.types.ts`.

## 17. Estado que não deve ser inferido

Os PRs #86 e #87 foram mergeados em `main` em 27 de julho de 2026; existe CI
ativo desde então. Isso é código integrado, não schema aplicado. Este handoff
não comprova por si só:

- que migrations de eventos foram aplicadas ao Supabase real;
- que o schema remoto atual coincide com todos os arquivos locais;
- que a Edge Function está implantada na versão local;
- que o deployment Vercel atual aponta para este HEAD;
- que existe backfill, dado fundamentalista ou evento oficial persistido;
- que a UI de eventos está ativa.

Esses fatos devem ser verificados no sistema correspondente antes de qualquer
mudança operacional.
