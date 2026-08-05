# Operações V1 — observabilidade e frescor de dados

## 1. Objetivo

Dar ao operador (hoje, o próprio usuário) um jeito de responder três
perguntas sem precisar ler código: o job agendado de mercado está rodando?
Uma falha real na Edge Function fica visível? O usuário sabe quando o preço
que está vendo na tela não é de hoje?

Este runbook cobre o que a Sprint 12 (`DEC-071`) entregou. Não cobre
deployment de schema (ver `OFFICIAL_EVENTS_DEPLOYMENT_V1.md`) nem segurança
de backfill (ver `OFFICIAL_EVENTS_SECURITY_CHECKLIST_V1.md`).

## 2. As três peças

| Peça | Onde | O que resolve |
|---|---|---|
| Log estruturado | `supabase/functions/refresh-market-data/index.ts`, `supabase/functions/explain-contribution-plan/index.ts` | Sucesso e falha da lógica interna da função ficam no log, não só a resposta HTTP |
| `check:health` | `scripts/check-health.mjs` + RPC `check_market_data_health_v1` | Confirma se o `pg_cron` está disparando `refresh-market-data-hourly` no intervalo esperado |
| Aviso de preço obsoleto | `src/domain/priceFreshness.ts`, exibido em `/carteira` | Usuário vê, na própria tela, quando um preço automático está velho — não precisa confiar cegamente |

## 3. Log estruturado — o que cada evento significa

Ambas as funções logam JSON de uma linha, sempre sem segredo, token, header
ou corpo de resposta de provider — só nome do evento e o mínimo necessário
para diagnosticar.

**`refresh-market-data`**

- `refresh-market-data-succeeded` — sucesso, com contagem de preços e
  câmbio atualizados, quantos foram pulados por já estarem frescos, e os
  tipos de warning emitidos (`stale-quote` é normal, os outros três não).
- `refresh-market-data-failed` — exceção não tratada, com nome e mensagem
  do erro. Antes da `DEC-062`, esse caminho não logava nada — um 500 do
  cron ficava mudo.

**`explain-contribution-plan`**

- `explain-contribution-plan-failed` — mesma disciplina, adicionada nesta
  sprint. Antes, qualquer falha (chave da OpenRouter inválida, provider
  fora do ar, dossiê malformado) era indistinguível de sucesso nos logs —
  o mesmo bug que a `DEC-062` já tinha corrigido do outro lado.

**Onde ver:** painel do Supabase → Edge Functions → selecionar a função →
aba Logs. Filtrar por `refresh-market-data-failed` ou
`explain-contribution-plan-failed` para achar falha real rápido.

## 4. `npm run check:health`

```bash
node --env-file=.env.server.local scripts/check-health.mjs
```

Exige `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente. Chama a RPC
`check_market_data_health_v1` (`SECURITY DEFINER`, `service_role` apenas —
`cron.job_run_details` não é exposto via PostgREST de propósito, é
infraestrutura interna do `pg_cron`).

**Saída, resumida:** nome do job, se existe e está ativo, quantas das
últimas 24 execuções tiveram `status = 'succeeded'`, minutos desde a última
execução. Sai com código 1 se: o job não existe, está desativado, passou de
90 minutos sem rodar (60 min de agenda + 30 de folga), ou alguma execução
recente não teve `status = 'succeeded'`.

### Limite conhecido, deliberado

`cron.job_run_details.status = 'succeeded'` significa que o `pg_net`
entregou a chamada HTTP e recebeu resposta — **não** que a lógica interna
da função funcionou. Confirmado no próprio código
(`refresh-market-data/index.ts`, comentário da `DEC-062`): a função pode
responder 500 e o cron mesmo assim registrar `succeeded`.

**Por isso as duas checagens são complementares, não substitutas:**
`check:health` confirma que o cron está disparando; os logs da Edge
Function (seção 3) confirmam se o que rodou deu certo. Rodar só uma das
duas dá falso sinal de saúde.

## 5. Aviso de preço obsoleto

Calculado por `getStaleAssetPrices` (`src/domain/priceFreshness.ts`),
exibido em `/carteira` quando algum ativo tem o preço automático
(`source: 'market-provider'`) mais velho que `UI_STALE_PRICE_THRESHOLD_MS`
(4 dias).

**Por que 4 dias e não a mesma janela de 60 minutos do cron:**
`MARKET_DATA_FRESHNESS_MS` (60 min) é para o job decidir se vale buscar de
novo no provider — não é o número certo para alarmar o usuário, porque
soaria falso alarme em todo fim de semana (mercado fechado, nenhum preço
novo, e não deveria haver). Quatro dias cobre um feriado prolongado sem
ruído.

Preço manual (`source: 'manual'`) nunca é sinalizado — é o usuário quem
decidiu aquele valor, não um provider automático parando de responder.

## 6. Cenários e o que fazer

| Sintoma | Onde olhar | Ação |
|---|---|---|
| `check:health` sai com código 1, job não existe/inativo | `cron.job` no painel Supabase | Reaplicar a migration `20260729120000_schedule_refresh_market_data_cron.sql` ou reativar o job manualmente |
| `check:health` OK, mas preço obsoleto aparece em `/carteira` | Logs da Edge Function, filtrar `refresh-market-data-failed` | Cron está disparando mas a função está falhando por dentro — provider fora do ar, chave de API expirada, etc. |
| `check:health` sai com código 1 por minutos desde a última execução | Painel do Supabase, `pg_cron` extension status | Confirmar que a extensão `pg_cron` segue habilitada no projeto |
| Nenhum aviso na tela, mas usuário desconfia do preço | `/carteira`, comparar com fonte externa | Sistema funcionando dentro do esperado — 4 dias é o limite antes de avisar, não garantia de atualização diária |

## 7. Limitações deste runbook

- Não cobre alertas automáticos (e-mail, Slack) — hoje é checagem manual,
  sob demanda.
- Não cobre `explain-contribution-plan` no `check:health` — só o job
  agendado tem checagem própria, porque só ele roda sem intervenção
  humana. `explain-contribution-plan` só executa quando o usuário pede
  explicação de um plano, então falha ali aparece na hora, na tela.
- `MAX_MINUTES_SINCE_LAST_RUN` (90) e `UI_STALE_PRICE_THRESHOLD_MS` (4
  dias) são constantes escolhidas nesta sprint, não validadas contra
  incidente real — ajustar se gerarem alarme falso ou silêncio indevido na
  prática.
