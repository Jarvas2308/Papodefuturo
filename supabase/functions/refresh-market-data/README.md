# refresh-market-data

Edge Function autenticada para atualização best-effort das cotações do universo fechado.

## Fontes

- Ações B3 e FIIs: arquivos oficiais B3 COTAHIST, com a última cotação de fechamento disponível (`PREULT`).
- ETFs dos EUA: Twelve Data.
- USD/BRL: Twelve Data.

O COTAHIST é consultado em candidatos diários recentes e, como fallback limitado, nos arquivos mensais atual e anterior. O parser usa a data de pregão (`DATAPRE`) e normaliza cada fechamento para `21:00:00.000Z`, de modo que o mesmo pregão produza sempre o mesmo timestamp.

Os arquivos oficiais são ZIP. A extração é isolada em `b3CotahistZip.ts` e usa `fflate@0.8.2` via import npm nativo do runtime Deno/Supabase. Essa dependência pertence apenas à Edge Function e não altera o bundle ou as dependências do frontend.

## Configuração

O único secret externo esperado é:

- `TWELVE_DATA_API_KEY`

O secret pertence exclusivamente ao ambiente da Edge Function e não deve usar prefixo `VITE_`. A B3 COTAHIST não requer secret. A função ainda precisa ser configurada e publicada manualmente após o merge; este diretório não executa deploy nem altera o projeto Supabase real.

O câmbio usa o timestamp informado pela Twelve Data. Quando o endpoint não fornece um timestamp, a função usa o instante da resposta como `pricedAt`; nenhum horário histórico é inventado.

Os providers são adapters de infraestrutura. `B3CotahistProvider` pode ser substituído futuramente sem alterar Dashboard, Carteira, Estratégia ou Novo Aporte, que continuam acessando apenas a fronteira `MarketDataRepository`.
