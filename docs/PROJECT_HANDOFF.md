# Papo de Futuro — Handoff do Projeto

Snapshot preparado em 21 de julho de 2026 e atualizado em 27 de julho de 2026
para continuidade técnica, revisão e operação controlada. Este documento resume
o estado comprovado pelo código, migrations, testes e decisões mais recentes.
Ele não substitui os contratos ou runbooks especializados citados ao longo do
texto.

A atualização de 27 de julho corrigiu a seção 3, que afirmava que a série ainda
não havia sido publicada. Ela havia sido, por um mecanismo que falhou; o
histórico está registrado abaixo.

Uma segunda atualização, ainda em 27 de julho, corrigiu as seções 1, 8, 13, 14
e 17: as quatro migrations de eventos oficiais foram aplicadas ao Supabase real
nesse mesmo dia, com duas migrations corretivas adicionais para bugs
encontrados por auditoria transacional. O detalhe está na seção 8.

Uma terceira atualização, ainda em 27 de julho, corrigiu as seções 1, 3, 8, 13,
14 e 17: as PRs #94 a #96 foram mergeadas em `main` (commit final `5b05e11`),
completando CI com pgTAP real, o canário de backfill e a ativação do runtime
`read-only`, verificada em produção com sessão autenticada real.

Uma quarta atualização corrigiu as seções 5, 13 e 17: as duas primeiras
afirmavam que a Edge Function `refresh-market-data` não tinha evidência de
execução. Isso estava errado — uma consulta somente leitura ao Supabase real
encontrou 45 linhas em `asset_prices` (`source = 'market-provider'`, cobrindo
os 12 ativos, entre 2026-07-13 e 2026-07-27) e 4 em `exchange_rates`,
gravadas pelo runtime Deno da própria função. `pg_cron` continua ausente, então
a atualização só ocorre quando um usuário autentica — ver `DEC-043`.

Uma quinta atualização, em 28 de julho de 2026, corrigiu as seções 8, 9, 13 e
17: o backfill gradual autorizado (`DEC-046`) executou três jobs reais contra
produção. `official_asset_events` deixou de estar vazia pela primeira vez —
4 eventos `periodic-report` persistidos via `cvm-fund-delivery`. O job
`cvm-ipe` falhou por dado malformado no CSV oficial da CVM, sem persistir
nada; não é bug de segurança. Detalhe na seção 8.

Uma sexta atualização, no mesmo dia, registra a correção do parser CVM IPE
(`DEC-047`) e a reexecução bem-sucedida do job `cvm-ipe --year=2026`
(`DEC-048`): `fetchedEventCount: 298`, `persistedAttemptCount: 298`,
`rejectedItemCount: 170`. `official_asset_events` foi de 4 para 302 linhas;
os três providers oficiais já têm pelo menos um backfill real bem-sucedido.
Detalhe na seção 8.

Uma sétima atualização, no mesmo dia, registra a primeira ingestão real de
fundamentos (`DEC-049`): `cvm-fii` e `cvm-stocks` (após corrigir um bug real de
adapter, latente desde `DEC-044`) tiveram sucesso, trazendo
`fundamental_snapshots` de 0 para 9 linhas; `sec-nport` falhou por dado real da
SEC não coberto pelo parser, sem persistir nada. Detalhe na seção 7.

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
- infraestrutura completa de eventos oficiais aplicada ao Supabase real em 27
  de julho de 2026; runtime ativado em `read-only` no mesmo dia após um
  canário real bem-sucedido, ambos com autorização explícita — ver seção 8;
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
`automation/trigger-official-events-series` foram mantidas por algum tempo como
evidência do incidente. Em 27 de julho de 2026, junto da própria
`ops/official-events-deployment-readiness-v1`, as três foram excluídas — local e
remotamente — por decisão explícita do usuário (`DEC-038` em
`docs/CHANGELOG-DECISIONS.md`), já que o incidente permanece documentado nesta
seção e nenhuma das três continha trabalho não integrado a `main`.

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

A composição real da rota de eventos oficiais foi ativada em `read-only` em 27
de julho de 2026 (`DEC-041`). O item de navegação aparece para sessões
autenticadas reais e a rota consulta o repository de leitura via Supabase.
Como as tabelas de eventos seguem com 0 linhas, a experiência real é uma
timeline vazia; nenhum dado de produto foi inserido.

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
- confirmado em produção (auditoria de 27 de julho, `DEC-043`): a Edge
  Function está publicada e produzindo dados reais (45 preços, 4 taxas de
  câmbio); dispara quando um usuário autentica, sem `pg_cron` instalado — sem
  agendamento automático.

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

`fundamental_snapshots` é uma tabela global sem `user_id` ou FK para assets,
RLS habilitado, leitura autenticada e escrita privilegiada via RPC transacional
`upsert_fundamental_snapshots_v1` (`DEC-044`). Em 28 de julho de 2026
(`DEC-049`), a primeira ingestão real trouxe a tabela de 0 para 9 linhas:
`cvm-fii --year=2026` (4 registros, um por FII) e `cvm-stocks --source=DFP
--year=2025` (5 registros, um por ação, após corrigir um bug real de adapter
que omitia 4 das 24 colunas exigidas pela RPC). `sec-nport` segue bloqueado —
falhou por um filing real da SEC com `primaryDocument` vazio/malformado, sem
persistir nada. Antes de operar, confirmar contagens reais no ambiente
autorizado; não inferir aplicação remota apenas pelos arquivos locais.

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

Estado operacional atual, em 27 de julho de 2026:

- as quatro migrations de eventos foram aplicadas ao Supabase real
  (`vxjrncwfysglinfktifz`), mais duas migrations corretivas — ver "Auditoria
  transacional e correções" abaixo;
- `official_asset_events`, `official_event_backfill_runs` e
  `official_event_backfill_jobs` existem no schema real, com RLS habilitado e
  0 linhas cada;
- nenhum backfill real foi executado; nenhum provider (CVM/SEC) foi chamado;
- nenhuma linha de dado de produto foi persistida;
- `src/lib/database.types.ts` foi regenerado contra o schema aplicado (PR
  #90) e inclui as três tabelas e as 12 funções de eventos oficiais;
- `OFFICIAL_EVENTS_REAL_UI_MODE` permanece `disabled` no código — essa
  constante não foi tocada; é uma decisão de ativação separada, não uma
  pendência de schema;
- nenhuma notícia editorial foi aprovada ou implementada.

Migrations aplicadas, nesta ordem, com os identificadores reais atribuídos
pelo Supabase (diferentes dos timestamps dos arquivos locais, como já ocorre
com as migrations mais antigas do projeto):

1. `20260727185154_create_official_asset_events` (arquivo local
   `20260719165850_create_official_asset_events.sql`);
2. `20260727185351_create_official_asset_events_upsert_rpc_v1` (arquivo local
   `20260719173416_create_official_asset_events_upsert_rpc_v1.sql`);
3. `20260727185626_create_official_events_backfill_checkpoint_v1` (arquivo
   local `20260719221733_create_official_events_backfill_checkpoint_v1.sql`);
4. `20260727185719_create_official_asset_events_read_rpcs_v1` (arquivo local
   `20260719235049_create_official_asset_events_read_rpcs_v1.sql`);
5. `fix_official_events_coalesce_schema_qualification` (PR #91);
6. `fix_official_events_upsert_variable_shadowing` (PR #92).

### Auditoria transacional e correções

Depois de aplicar as quatro migrations originais, uma auditoria transacional
completa — cada verificação executada dentro de `begin; ... rollback;` contra
o Supabase real, sem deixar nenhuma linha residual — encontrou dois bugs de
produção que nenhum dos 2012 testes Vitest detectava, porque nenhum deles
executa contra Postgres real:

- **`pg_catalog.coalesce` não existe.** `COALESCE` é uma forma especial da
  gramática SQL, não uma função do catálogo, e não pode ser qualificada por
  schema. `CREATE FUNCTION` aceitava a referência inválida sem erro; toda
  chamada que alcançasse a expressão falhava em runtime com
  `42883: function pg_catalog.coalesce(jsonb, jsonb) does not exist`. Atingia
  7 pontos em 3 funções: `upsert_official_asset_events_v1` (atualizar um
  evento existente), `get_official_event_backfill_snapshot_v1` (chamada
  internamente por quase toda função de orquestração de backfill) e
  `release_official_event_backfill_jobs_v1`. Corrigido no PR #91.
- **Colisão de variável PL/pgSQL.** As variáveis `event_id` e
  `deduplication_key` em `upsert_official_asset_events_v1` tinham o mesmo
  nome de colunas reais de `official_asset_events`. Dentro de SQL embutido
  que referencia a tabela, a referência não qualificada é ambígua entre a
  variável e a coluna; `plpgsql.variable_conflict = error` (padrão do
  Postgres) rejeita isso em runtime com
  `42702: column reference "event_id" is ambiguous`. Essa falha ocorria na
  primeira consulta de busca do registro existente, executada para todo item
  do lote — **a RPC de escrita nunca processou um único registro com
  sucesso, nem inserir nem atualizar, desde que foi mergeada no PR #86**.
  Corrigido no PR #92, renomeando as variáveis para `v_event_id` e
  `v_deduplication_key`.

Depois das duas correções, um teste transacional completo (inserir evento,
atualizar o mesmo evento, ciclo de backfill inteiro incluindo
falha→retry→sucesso→finalize e pause, busca via RPC de leitura) rodou de
ponta a ponta contra dados reais, dentro de `begin; ... rollback;`, sem deixar
resíduo. As 12 funções de eventos oficiais foram exercitadas com sucesso. Uma
varredura do mesmo padrão de qualificação inválida nas 18 migrations do
projeto não encontrou mais nenhuma ocorrência fora do já corrigido.

A auditoria também executou pela primeira vez
`supabase/tests/database/rls_user_isolation.test.sql` (pgTAP, 43 asserções)
contra o Supabase real — esse arquivo existe no repositório, mas não está
conectado a `npm test` nem ao CI. As 43 asserções passaram, confirmando
isolamento de RLS correto em `profiles`, `assets`, `purchases`,
`asset_prices`, `allocation_targets`, `exchange_rates` e na RPC
`replace_allocation_targets`. Conectar essa suíte a um pipeline automatizado
continua pendente — exige credencial de banco no ambiente de CI.

**Lição estrutural:** testes em TypeScript não alcançam o corpo de funções
PL/pgSQL. Nenhuma RPC deve ser considerada pronta para produção só por passar
na suíte Vitest; requer execução real contra Postgres, idealmente em
transação com rollback antes de qualquer aplicação real de dados.

Runbooks obrigatórios:

- `docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md`;
- `docs/runbooks/OFFICIAL_EVENTS_SECURITY_CHECKLIST_V1.md`;
- `docs/runbooks/official-events-deployment-manifest-v1.json`;
- `docs/runbooks/sql/official-events-post-deployment-checks-v1.sql`.

Validador local:

```bash
npm run verify:official-events-deployment
```

O canário de backfill real (CVM Fund Delivery, ano 2026, mês 7) foi executado
em 27 de julho de 2026 com autorização explícita do usuário — ver `DEC-040`.
Rodou de ponta a ponta contra produção (rede real à CVM, RPCs de checkpoint e
upsert reais), concluiu com sucesso e `fetchedEventCount: 0`: o Informe
Mensal de julho/2026 não continha, no momento da execução, nenhuma entrega
classificável como `INFORM MENSAL`/`INFO TRIM FII` para os quatro FIIs do
universo. Estado real confirmado por consulta somente leitura logo após:
`official_asset_events` com 0 linhas, `official_event_backfill_runs` com 1
linha, `official_event_backfill_jobs` com 1 linha. `get_advisors` não mostrou
achado novo de segurança. O runner usado,
`scripts/run-official-events-backfill-canary.ts`, não é chamado por nenhum
fluxo do app nem pelo CI — é um script manual e pontual, com modo preview por
padrão e execução real apenas com `--confirm`, usando credenciais lidas de um
arquivo local nunca versionado.

O runtime `read-only` foi ativado em 27 de julho de 2026 com autorização
explícita do usuário — ver `DEC-041`. `OFFICIAL_EVENTS_REAL_UI_MODE`
(`src/features/official-events/composition.ts`) passou de `'disabled'` para
`'read-only'`; a fiação real do cliente Supabase e do estado de acesso vive em
`src/app/AppComposition.tsx`, fora da fronteira que `boundary.test.ts`
protege. O item de navegação aparece como consequência direta da capability
do runtime, sem alteração separada na sidebar. Modo demo (sem env
configurado) continua caindo para `disabled` automaticamente. Após o merge
(PRs #94, #95 e #96) e o deploy no Vercel, o caminho `read-only` com sessão
autenticada real foi verificado em produção — timeline vazia sem erro, item
"Eventos Oficiais" visível na sidebar, confirmado tanto pelos logs de API do
Supabase (`200` em `list_official_asset_events_v1`) quanto visualmente pelo
usuário — ver `DEC-042`.

Em 28 de julho de 2026, o runner gradual `scripts/run-official-events-backfill.ts`
(PR #99, que generaliza o canário acima para os três providers via CLI)
executou três jobs reais, um por vez, com autorização explícita do usuário —
ver `DEC-046`. `sec-edgar` (janela 2026-01-01 a 2026-01-31) e
`cvm-fund-delivery` (competência 2026-06) tiveram sucesso; o segundo persistiu
4 eventos `periodic-report`, um por FII (KNRI11, VISC11, XPLG11, HGRU11). O
job `cvm-ipe` (ano 2026) falhou por um defeito de dado real no CSV oficial da
própria CVM — aspa não escapada dentro de campo não cotado — que o parser
estrito rejeita por design, sem persistir nada; não é bug de segurança. A
timeline real deixou de estar vazia pela primeira vez: `official_asset_events`
tem 4 linhas.

No mesmo dia, o parser foi corrigido (`DEC-047`, PR #105): uma aspa fora do
início do campo passa a ser aceita como caractere literal em vez de rejeitar
o arquivo inteiro; o gate que decide entrar em modo cotado (aspa como
primeiro caractere do campo) não muda, então campos que começam com aspas
seguem RFC 4180 estrito. O checkpoint da tentativa falha anterior (`plan_id`
determinístico por provider/ano, sem RPC de reset) foi resetado manualmente
via `execute_sql` (apagando as linhas correspondentes em
`official_event_backfill_jobs`/`official_event_backfill_runs`, sem tocar
`official_asset_events`), e o job `cvm-ipe --year=2026 --confirm` foi
reexecutado com sucesso (`DEC-048`): `fetchedEventCount: 298`,
`persistedAttemptCount: 298`, `rejectedItemCount: 170` (rejeições esperadas
por universo fechado de ativos/tipos de evento). `official_asset_events` foi
de 4 para 302 linhas. Os três providers oficiais já têm pelo menos um
backfill real bem-sucedido contra produção.

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

- série de eventos oficiais mergeada em `main` pelo PR #86 em 27 de julho de
  2026, e as quatro migrations correspondentes aplicadas ao Supabase real no
  mesmo dia, junto de duas migrations corretivas (PRs #91 e #92) — ver seção
  8 para os bugs encontrados e a auditoria transacional que os revelou;
- o repositório não possuía CI até 27 de julho de 2026. O PR #87 adicionou
  `.github/workflows/validate.yml` e foi mergeado nessa data, tornando o gate
  "CI aprovado" do runbook de deployment satisfazível a partir daquele ponto.
  Antes disso, todas as validações desta série foram executadas manualmente e
  documentadas nos PRs correspondentes;
- a suíte pgTAP `supabase/tests/database/rls_user_isolation.test.sql` foi
  rodada manualmente contra produção em 27 de julho, passou 43/43 — ver seção 8. Nesse mesmo ciclo ela ainda não estava conectada a `npm test` nem ao CI;
  em um ciclo posterior, no mesmo dia, um job de CI dedicado (`rls-pgtap`) foi
  adicionado — ver a entrada logo abaixo e `DEC-039`;
- as três branches do incidente de publicação (`automation/publish-official-events-series`,
  `automation/trigger-official-events-series` e
  `ops/official-events-deployment-readiness-v1`) foram excluídas local e
  remotamente em 27 de julho de 2026, após confirmação explícita do usuário —
  ver `DEC-038`. Os PRs #84 e #85 foram fechados; #86, #87, #88, #89, #90,
  #91 e #92 foram mergeados;
- a suíte pgTAP `supabase/tests/database/rls_user_isolation.test.sql` foi
  conectada a um novo job de CI (`rls-pgtap` em
  `.github/workflows/validate.yml`) que sobe um Postgres local efêmero via
  Supabase CLI, sem tocar produção — ver `DEC-039`. Confirmado rodando com
  sucesso em execuções reais do GitHub Actions nas PRs #94 a #97;
- runtime e UI de eventos foram ativados em `read-only` em 27 de julho de 2026
  com autorização explícita do usuário (`DEC-041`, seção 8), após o canário de
  backfill real (`DEC-040`). Como as tabelas seguem com 0 linhas, a timeline
  real está vazia; nenhum dado de produto foi inserido;
- a Edge Function `refresh-market-data` está implantada e `ACTIVE` (versão 4)
  no projeto real, com código revisado e estruturalmente correto. Correção
  de uma afirmação anterior: **ela já foi executada com sucesso** — auditoria
  de 27 de julho (`DEC-043`) encontrou 45 linhas reais em `asset_prices`
  (`source = 'market-provider'`, 12 ativos, 2026-07-13 a 2026-07-27) e 4 em
  `exchange_rates`, gravadas por `Deno/SupabaseEdgeRuntime`. Continua sem
  `pg_cron` instalado, então dispara só quando um usuário autentica, não em
  agendamento automático;
- estado de dados real observado nessa mesma auditoria (27 de julho): `assets`
  com 12 linhas (universo completo), `purchases` com **0** (carteira real
  vazia — Motor V2 e Dossiê Técnico não têm o que calcular em produção hoje),
  `fundamental_snapshots` com 0, `official_asset_events` com 0. Atualização
  posterior: em 28 de julho, o backfill gradual (`DEC-046`) inseriu 4 linhas
  reais em `official_asset_events`; no mesmo dia, após a correção do parser
  CVM IPE (`DEC-047`) e a reexecução do job (`DEC-048`), a tabela foi de 4
  para 302 linhas. No mesmo dia, a primeira ingestão real de fundamentos
  (`DEC-049`) trouxe `fundamental_snapshots` de 0 para 9 linhas (`cvm-fii` e
  `cvm-stocks`; `sec-nport` bloqueado). `purchases` segue com 0;
- proteção contra senha vazada (leaked password protection) permanece
  desabilitada no Auth; é configuração de painel, não alterável por ciclo de
  código;
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

O código está integrado em `main` desde 27 de julho de 2026 (PRs #86 a #96,
commit final `5b05e11`). O schema de eventos oficiais foi aplicado ao Supabase
real no mesmo dia, com `database.types.ts` regenerado e dois bugs de produção
corrigidos após auditoria transacional (seção 8). A sequência operacional
original de deployment — schema, canário real, ativação `read-only`,
verificação com sessão real — está encerrada (`DEC-037` a `DEC-042`). O que
resta é operação contínua, não deployment:

1. decidir sobre backfill gradual (runbook, seção 18: um job por execução,
   confirmação manual entre CVM IPE, CVM Fund Delivery e SEC EDGAR), com
   autorização própria por provider/job — nenhum foi executado além do
   canário de `DEC-040`;
2. monitorar o runtime `read-only` real em produção (falhas por job,
   conflitos, latência de leitura) conforme a seção 19 do runbook;
3. conectar `supabase/tests/database/rls_user_isolation.test.sql` a produção
   real de forma automatizada, se decidido — hoje só roda em CI contra um
   Postgres local efêmero (`DEC-039`).

Concluído neste ciclo, sem tocar produção: a suíte pgTAP foi conectada a um
job de CI (`DEC-039`, confirmado rodando com sucesso em CI real após o merge)
e as três branches obsoletas do incidente de publicação foram removidas
(`DEC-038`). Concluído neste ciclo, tocando produção com autorização
explícita: o canário de um job de backfill real (CVM Fund Delivery, 2026-07)
rodou com sucesso e `fetchedEventCount: 0` (`DEC-040`), o runtime `read-only`
foi ativado (`DEC-041`), e a ativação foi verificada em produção com sessão
autenticada real (`DEC-042`) — ver a seção 8.

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

Os PRs #86 a #96 foram mergeados em `main` em 27 de julho de 2026; existe CI
ativo desde o #87, incluindo o job `rls-pgtap` desde o #94. As quatro
migrations originais de eventos oficiais mais duas corretivas foram aplicadas
ao Supabase real no mesmo dia, comprovado por consulta direta ao projeto
(`list_migrations`, `list_tables`) e por um teste transacional de ponta a
ponta contra as 12 funções — ver seção 8. O canário real de backfill
(`DEC-040`) e a ativação do runtime `read-only` (`DEC-041`) foram mergeados
(PRs #95 e #96, commit final `5b05e11`), deployados no Vercel e verificados
com sessão autenticada real: logs de API do Supabase confirmaram uma chamada
`200` a `list_official_asset_events_v1`, e o usuário confirmou visualmente a
timeline vazia sem erros e o item "Eventos Oficiais" na sidebar — ver
`DEC-042`. Isso não significa que este handoff comprove, por si só, sem
verificação adicional no sistema correspondente:

- que o schema remoto atual, na data em que este documento for lido, ainda
  coincide com os arquivos locais — migrations futuras podem ter sido
  aplicadas depois desta atualização;
- que a Edge Function `refresh-market-data` tenha sido invocada _recentemente_
  — a auditoria de 27 de julho (`DEC-043`) comprovou execução real passada,
  mas sem `pg_cron` não há agendamento; a atualização mais recente pode estar
  defasada quando este documento for lido;
- que o deployment Vercel atual, na data em que este documento for lido, ainda
  aponta para o commit `5b05e11` — deployments futuros podem ter substituído
  esse estado;
- que existe dado fundamentalista além do registrado em `DEC-049` (28 de
  julho: `cvm-fii` e `cvm-stocks` bem-sucedidos, 9 linhas; `sec-nport`
  bloqueado) — contagem futura deve ser verificada, não assumida;
- que existe backfill real de eventos oficiais além do que está registrado em
  `DEC-040` (canário, `fetchedEventCount: 0`) e `DEC-046` (28 de julho:
  `sec-edgar` e `cvm-fund-delivery` com sucesso, 4 eventos persistidos;
  `cvm-ipe` falhou por dado malformado da própria CVM, sem persistir nada) —
  `official_asset_events` tinha exatamente 4 linhas no momento desta
  atualização; contagem futura deve ser verificada, não assumida.

Esses fatos devem ser verificados no sistema correspondente antes de qualquer
mudança operacional.
