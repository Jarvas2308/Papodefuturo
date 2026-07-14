# refresh-market-data

Edge Function autenticada para atualização best-effort de cotações do universo fechado.

Secrets server-side esperados:

- `HG_BRASIL_API_KEY`
- `TWELVE_DATA_API_KEY`

Esses valores pertencem exclusivamente ao ambiente da Edge Function e não devem usar o prefixo `VITE_`. A função ainda precisa ser configurada e publicada manualmente após o merge; este diretório não executa deploy nem altera o projeto Supabase real.
