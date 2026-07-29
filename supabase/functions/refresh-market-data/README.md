# refresh-market-data

Edge Function autenticada para atualização best-effort das cotações do universo fechado.

## Fontes

- Ações B3 e FIIs: arquivos oficiais B3 COTAHIST, com a última cotação de fechamento disponível (`PREULT`).
- ETFs dos EUA: Twelve Data.
- USD/BRL: Twelve Data.

O COTAHIST é consultado em candidatos diários recentes e, como fallback limitado, nos arquivos mensais atual e anterior. O parser usa a data de pregão (`DATAPRE`) e normaliza cada fechamento para `21:00:00.000Z`, de modo que o mesmo pregão produza sempre o mesmo timestamp.

Os arquivos oficiais são ZIP. A extração é isolada em `b3CotahistZip.ts` e usa `fflate@0.8.2` via import npm nativo do runtime Deno/Supabase. Essa dependência pertence apenas à Edge Function e não altera o bundle ou as dependências do frontend.

## Configuração

Secrets externos esperados:

- `TWELVE_DATA_API_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` (desde `DEC-052`) — usado para escrever nas
  tabelas globais via as RPCs `upsert_market_asset_prices_v1`/
  `upsert_market_exchange_rates_v1`, nunca exposto ao chamador.

Os secrets pertencem exclusivamente ao ambiente da Edge Function e não devem usar prefixo `VITE_`. A B3 COTAHIST não requer secret próprio. Este diretório não executa deploy nem altera o projeto Supabase real; qualquer publicação continua sendo uma etapa manual e separada.

A função está publicada e ativa no projeto Supabase real (`vxjrncwfysglinfktifz`). Desde `DEC-052`, preços e câmbio são dados globais (`market_asset_prices`, `market_exchange_rates`, sem `user_id`) — a função aceita duas formas de chamada: sessão de usuário autenticado real (mesmo gate de acesso de antes) ou um chamador de confiança server-side (`Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, usado por agendamento via `pg_cron`/`pg_net` ou scripts operacionais). Em ambos os casos a escrita real usa um client próprio com `service_role`, nunca a sessão encaminhada pelo chamador. As tabelas antigas por usuário (`asset_prices`, `exchange_rates`) permanecem no schema, mas não recebem mais escrita desta função.

O câmbio usa o timestamp informado pela Twelve Data. Quando o endpoint não fornece um timestamp, a função usa o instante da resposta como `pricedAt`; nenhum horário histórico é inventado.

Os providers são adapters de infraestrutura. `B3CotahistProvider` pode ser substituído futuramente sem alterar Dashboard, Carteira, Estratégia ou Novo Aporte, que continuam acessando apenas a fronteira `MarketDataRepository`.
