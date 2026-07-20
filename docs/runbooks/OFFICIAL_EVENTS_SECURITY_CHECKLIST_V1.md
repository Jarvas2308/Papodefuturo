# Checklist de segurança de eventos oficiais V1

Preencher `PASS` ou `FAIL` somente durante uma mudança autorizada. Qualquer
`FAIL` interrompe a execução. Evidências não podem conter secrets ou payloads.

| Controle                   | Estado esperado                       | Evidência                                   | Responsável conceitual | Resultado   |
| -------------------------- | ------------------------------------- | ------------------------------------------- | ---------------------- | ----------- |
| Service role no browser    | Ausente                               | Busca no bundle e código cliente            | Security reviewer      | A preencher |
| Service role em `VITE_*`   | Ausente                               | Inventário sanitizado de nomes de variáveis | Security reviewer      | A preencher |
| Acesso `anon`              | Nenhum nas tabelas e RPCs             | Checks de catalogs e teste por role         | Database operator      | A preencher |
| Escrita `authenticated`    | Ausente                               | Privileges e teste negativo                 | Database operator      | A preencher |
| RPC de upsert              | Execução exclusiva de `service_role`  | `pg_proc` e routine privileges              | Security reviewer      | A preencher |
| RPCs de checkpoint         | Execução exclusiva de `service_role`  | `pg_proc` e routine privileges              | Security reviewer      | A preencher |
| RPCs de leitura            | `SECURITY INVOKER`, `STABLE`          | `pg_proc`                                   | Security reviewer      | A preencher |
| RLS                        | Habilitado nas três tabelas           | `pg_class` e `pg_policies`                  | Database operator      | A preencher |
| `search_path`              | `pg_catalog, public` em todas as RPCs | `pg_proc.proconfig`                         | Security reviewer      | A preencher |
| SQL dinâmico               | Ausente                               | Revisão das quatro migrations               | Database reviewer      | A preencher |
| Policy por `user_id`       | Ausente                               | Policies e texto das migrations             | Security reviewer      | A preencher |
| Coluna `user_id`           | Ausente                               | `information_schema.columns`                | Database operator      | A preencher |
| FK para `auth.users`       | Ausente                               | Constraints e definição das FKs             | Database operator      | A preencher |
| `provenance_raw_fields`    | Não exposto em logs                   | Revisão de observabilidade                  | Application reviewer   | A preencher |
| Payload integral em logs   | Ausente                               | Amostra sanitizada de logs                  | Application reviewer   | A preencher |
| URL ou chave em commit     | Ausente                               | secret scan e revisão do diff               | Security reviewer      | A preencher |
| Backfill por frontend      | Ausente                               | Boundary tests e bundle                     | Application reviewer   | A preencher |
| Provider no browser        | Ausente                               | Boundary tests e bundle                     | Application reviewer   | A preencher |
| Runtime antes dos checks   | `disabled`                            | Constante de composição e smoke test        | Change owner           | A preencher |
| Notícia editorial/IA/score | Ausente                               | Escopo, código e UI                         | Product owner          | A preencher |

## Encerramento

- Ambiente: `<CONTROLLED_ENVIRONMENT>`
- Operador: `<AUTHORIZED_OPERATOR>`
- Janela aprovada: a preencher
- SHA implantado: a preencher
- Evidência do backup: a preencher
- Decisão final: `GO` ou `NO-GO`
