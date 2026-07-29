# explain-contribution-plan

Edge Function autenticada que interpreta um `TechnicalDossierV1` já calculado pelo motor determinístico e devolve uma explicação em texto, via OpenRouter (roteando para `anthropic/claude-sonnet-4.5`, endpoint OpenAI-compatible).

## Contrato de produto (inegociável, `docs/PRODUCT.md` §Papel futuro da IA)

A IA **nunca** cria, seleciona ou modifica o plano técnico; nunca recomenda ativos fora do dossiê recebido; nunca calcula preço médio, participação, rentabilidade ou metas; nunca declara execução de ordem. A função recebe o dossiê já pronto e devolve apenas: fatos extraídos do dossiê, interpretação, grau de convicção, reapresentação do plano técnico e explicação comparativa — nunca números novos.

A falha da IA (rede, chave ausente, resposta malformada) nunca bloqueia o plano determinístico: o chamador (`src/data/aiExplanationBestEffort.ts`) trata qualquer erro como degradação silenciosa, mantendo apenas o plano técnico puro.

## Entrada

`POST` com corpo `{ "dossier": TechnicalDossierV1 }` (serializado como JSON simples, sem classes). O corpo é validado estruturalmente (`dossierValidator.ts`) antes de qualquer chamada externa; um dossiê malformado nunca chega à Anthropic API.

## Saída

`AiExplanationV1` (`ai-explanation.v1`): `facts: string[]`, `interpretation`, `convictionLevel: 'low' | 'medium' | 'high'`, `technicalPlanSummary`, `comparativeExplanation`. A resposta bruta do OpenRouter é parseada e validada (`responseSchema.ts`) — uma resposta fora do formato esperado é rejeitada, nunca repassada como está.

## Autenticação

Exige sessão de usuário autenticada real (`Authorization: Bearer <JWT>`). Diferente de `refresh-market-data`, não há caminho `service_role`/agendado aqui: o dossiê pertence a uma simulação pontual do usuário que a solicitou, nunca a um job em segundo plano.

## Configuração

Secret esperado, exclusivo do ambiente da Edge Function, nunca `VITE_*`:

- `OPENROUTER_API_KEY`.

O envio do dossiê para o OpenRouter (e por ele, à Claude API) é o "envio de dados a serviço externo" que `AGENTS.md` exige autorização explícita para habilitar (`DEC-056`). Este diretório não executa deploy nem altera o projeto Supabase real; qualquer publicação continua sendo uma etapa manual e separada.

## Sanitização de erros

Qualquer falha (chave ausente, rede, resposta malformada do OpenRouter) retorna uma mensagem genérica em português, nunca o payload bruto do provedor ou o erro original — mesmo padrão de `refresh-market-data`.
