# Deployment controlado de eventos oficiais V1

## 1. Objetivo

Preparar a aplicação futura das quatro migrations de eventos oficiais com ordem,
hashes, gates, evidências e interrupção explícita. Este runbook não autoriza nem
executa qualquer mudança remota.

## 2. Escopo

O deployment futuro compreende somente schema, escrita transacional, checkpoint
de backfill e leitura global. Runtime, sidebar, providers, backfill, dados,
autenticação e notícias editoriais são fases independentes e posteriores.

## 3. Estado atual

- Série auditada em `66dc336fb78bef03580bc2a454196b318269cda0`.
- Base original `2808fc3cc385613c0f9914c24b8beb238409e7b9`.
- Quatro migrations versionadas e ainda não aplicadas.
- `src/lib/database.types.ts` ainda reflete o schema remoto anterior.
- Runtime real `disabled`; sidebar sem capability `read-only`.
- Nenhum backfill executado e nenhum evento persistido.
- Auditoria editorial V2 em `NO-GO`.

## 4. Pré-requisitos

- Série publicada e revisada no GitHub, com CI aprovado.
- Ambiente `<CONTROLLED_ENVIRONMENT>` identificado de forma inequívoca.
- Operador `<AUTHORIZED_OPERATOR>` autorizado para a janela.
- Backup ou PITR confirmado, testado e com evidência recuperável.
- Método oficial de deployment disponível e versão registrada.
- Acesso administrativo confirmado sem expor credenciais.
- Manifesto validado por `npm run verify:official-events-deployment`.
- Ausência de drift ou deployment parcial.
- Runtime confirmado como `disabled` e ausência de backfill automático.

## 5. Responsáveis conceituais

| Papel                | Responsabilidade                              |
| -------------------- | --------------------------------------------- |
| Change owner         | Escopo, ordem, gates e decisão de parada      |
| Database operator    | Backup, aplicação e evidências do schema      |
| Security reviewer    | RLS, policies, grants e funções privilegiadas |
| Application reviewer | Tipos, smoke tests e runtime desativado       |
| Product owner        | Autorização posterior de canário e ativação   |

Uma pessoa pode acumular papéis, mas cada aprovação deve permanecer explícita.

## 6. Gates de GO/NO-GO

### GO

Todos os itens abaixo são obrigatórios:

- branch revisada e série publicada;
- CI aprovado;
- backup validado;
- ambiente e `<PROJECT_REF>` confirmados por canal seguro;
- operador e janela autorizados;
- ferramenta oficial e acesso administrativo disponíveis;
- hashes e tamanhos iguais ao manifesto;
- migrations ainda não aplicadas ou integralmente registradas na ordem esperada;
- nenhuma drift desconhecida;
- regeneração de types disponível para etapa posterior;
- runtime `disabled`;
- nenhum scheduler, cron ou backfill automático configurado.

### NO-GO

Parar imediatamente diante de ambiente não identificado, hash divergente,
migration parcial, ordem divergente, drift desconhecida, backup ausente, CI com
falha, RLS não verificável, `service_role` exposto, função com privilégio
inesperado, dado inesperado, ferramenta não aprovada ou operador não autorizado.
Não corrigir parcialmente durante a janela.

## 7. Backup e recuperação

Antes da mudança, registrar método, identificador, horário UTC, retenção e teste
de restauração do backup/PITR. A restauração deve ser exercitada em ambiente
seguro quando o plano contratado permitir. Sem recuperação validada, o gate é
`NO-GO`.

## 8. Ordem das migrations

| Fase          | Migration                                                          | Dependência | Risco |
| ------------- | ------------------------------------------------------------------ | ----------- | ----- |
| 1. Schema     | `20260719165850_create_official_asset_events.sql`                  | nenhuma     | médio |
| 2. Escrita    | `20260719173416_create_official_asset_events_upsert_rpc_v1.sql`    | fase 1      | alto  |
| 3. Checkpoint | `20260719221733_create_official_events_backfill_checkpoint_v1.sql` | fases 1 e 2 | alto  |
| 4. Leitura    | `20260719235049_create_official_asset_events_read_rpcs_v1.sql`     | fase 1      | médio |

Não reaplicar trechos manualmente. O método oficial deve executar os arquivos na
ordem versionada e registrar cada versão em `supabase_migrations`.

## 9. Validação após cada migration

1. Conferir registro da versão e ausência de erro parcial.
2. Executar somente a seção correspondente de
   `sql/official-events-post-deployment-checks-v1.sql`.
3. Guardar saída, horário UTC, operador, ambiente e versão da ferramenta.
4. Parar se qualquer objeto, assinatura, privilege ou contagem divergir.
5. Não avançar por considerar uma divergência “provavelmente inofensiva”.

## 10. Validação de RLS

As três tabelas devem possuir RLS habilitado. `official_asset_events` possui uma
única policy de leitura para `authenticated`; as tabelas de checkpoint não
possuem policy para clientes. Testar também que `anon` não lê e que
`authenticated` não escreve nem acessa checkpoint.

## 11. Validação de grants

- `anon`: nenhum acesso às três tabelas ou às RPCs.
- `authenticated`: `SELECT` na tabela de eventos e execução somente das duas
  funções de leitura.
- `service_role`: acesso operacional somente pelas RPCs previstas; escrita
  direta de eventos e acesso direto ao checkpoint permanecem revogados.
- Defaults do projeto não substituem grants explícitos.

## 12. Validação das RPCs

Conferir nome, argumentos, retorno, owner, `prosecdef`, volatilidade,
`search_path` e roles com execução. As funções de escrita e checkpoint são
`SECURITY DEFINER`; as duas funções de leitura são `STABLE SECURITY INVOKER`.
Não chamar RPC de escrita durante esta validação.

## 13. Validação do schema

Confirmar 58 colunas em `official_asset_events`, 17 em
`official_event_backfill_runs` e 18 em `official_event_backfill_jobs`, além de
PKs, unique constraints, FK restritiva do job, checks e vinte índices. Não pode
existir `user_id`, `asset_id` ou FK para `auth.users`.

## 14. Regeneração de `database.types.ts`

Somente após migrations e checks aprovados, um operador autorizado executa, em
ambiente controlado e com autenticação fora do repositório, o comando oficial:

```text
npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/database.types.ts
```

Este ciclo não executa o comando nem edita o arquivo gerado.

## 15. Validação dos tipos gerados

Revisar o diff e confirmar as três tabelas, doze funções, JSON/JSONB, nullability,
argumentos e retornos. Nenhuma tabela existente pode mudar sem explicação de
drift. Rodar format, lint, testes e build antes de publicar os tipos.

## 16. Smoke tests sem backfill

Com runtime ainda `disabled`, validar tabela vazia, leitura autenticada vazia,
busca de ID inexistente, negação a `anon`, ausência de escrita autenticada e
ausência de acesso ao checkpoint. Não chamar providers nem RPCs operacionais.

## 17. Backfill canário

Somente após autorização separada, escolher no momento da execução o menor job
determinístico disponível, preferindo um único mês recente de CVM Fund Delivery.
Configuração obrigatória: `maxJobs = 1`, `retryFailed = false`,
`failureMode = stop`, `workerId` explícito e lease controlado. Não fixar data
sem verificar a disponibilidade oficial no momento real.

## 18. Backfill gradual

Após o canário, conferir checkpoint, eventos, conflitos, RLS, leitura autenticada
e runtime ainda `disabled`. Prosseguir com um job por execução e confirmação
manual entre CVM IPE, CVM Fund Delivery e SEC EDGAR. Ampliar somente após
evidências estáveis; não habilitar retry ou automação implicitamente.

## 19. Monitoramento

Monitorar falhas por job, conflitos, contadores, duração, leases expirados,
volume, erros de schema/RPC e latência de leitura. Logs guardam somente summaries
seguros, nunca payload integral, credencial ou documento regulatório.

## 20. Ativação read-only

A ativação é um commit posterior e independente. Somente após migrations,
types, smoke tests, canário e validação dos dados, uma autorização explícita pode
alterar a composição real para `mode: 'read-only'`.

## 21. Ativação da sidebar

O item aparece como consequência da capability `read-only`. Não alterar sidebar
diretamente nem criar flag paralela. A rota permanece informativa enquanto o
runtime estiver `disabled`.

## 22. Rollback

| Situação              | Estratégia conservadora                                              |
| --------------------- | -------------------------------------------------------------------- |
| Ativação              | Voltar a composição para `disabled`; preservar dados                 |
| Privilege inesperado  | Interromper, revogar somente com autorização e registrar forward fix |
| Função antes de dados | Remoção apenas com schema vazio, backup e autorização                |
| Schema vazio          | Reversível somente se todas as tabelas vazias e sem consumidores     |
| Após dados            | `forward-fix-only`; nunca apagar eventos automaticamente             |
| UI ativa              | Desativar runtime primeiro; preservar schema e evidências            |

Nunca executar down migration destrutiva como resposta automática. Após dados,
preferir migration adicional e preservar histórico.

## 23. Forward fixes

Migration publicada não é editada. Drift, assinatura errada, constraint ou
privilege divergente exigem captura de evidência, análise e migration corretiva
adicional. Nenhum forward fix é criado durante a janela sem revisão própria.

## 24. Critérios de interrupção

Interromper por qualquer `NO-GO`, timeout sem estado conhecido, registro parcial,
resultado inconclusivo, erro de RLS, função privilegiada inesperada, dado criado
antes do canário ou perda de acesso administrativo. Manter runtime `disabled`.

## 25. Evidências a guardar

- SHA da série e do manifesto;
- hashes/tamanhos das migrations;
- aprovação e janela;
- identificador do backup;
- versão da ferramenta;
- histórico de migration antes/depois;
- saída dos checks SQL;
- diff dos types gerados;
- resultados de CI e smoke tests;
- summaries do canário e decisão de cada gate.

Não guardar secrets, tokens, URLs privadas ou payloads integrais.

## 26. Checklist final

Usar `OFFICIAL_EVENTS_SECURITY_CHECKLIST_V1.md`, preencher todos os resultados e
anexar as evidências. Qualquer `FAIL` mantém o deployment em `NO-GO`.

## 27. Responsabilidade por autorização

Preparação local, aplicação de migrations, canário, ampliação, runtime read-only
e sidebar são autorizações distintas. Somente o responsável designado pode
autorizar cada transição, com registro auditável.

## 28. Fora do escopo

Este runbook não cria conta, usuário, `.env`, segredo, provider, scheduler,
Edge Function, cron, notícia editorial, IA, sentimento, score ou mudança
financeira. Não altera autenticação, carteira, Novo Aporte ou Motor V2.

## 29. Drift e idempotência

Antes da fase 1, comparar histórico registrado, objetos, assinaturas, índices,
constraints, policies e privileges com o manifesto. Objeto existente com
definição divergente, versão ausente com objeto presente ou aplicação parcial é
`NO-GO`. Não reaplicar migration em partes e não usar cláusulas condicionais
para esconder drift.

## 30. Fases independentes de ativação

1. Migrations aplicadas; runtime `disabled`.
2. Types regenerados; runtime `disabled`.
3. Smoke tests de leitura; runtime `disabled`.
4. Backfill canário; runtime `disabled`.
5. Dados validados; runtime `disabled`.
6. Autorização explícita para `read-only`.
7. Sidebar habilitada pela capability.

Este ciclo conclui somente a preparação documental e local.
