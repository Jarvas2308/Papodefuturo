# Papo de Futuro — Registro de Decisões

Este documento registra decisões de produto e arquitetura.

- decisões não devem ser apagadas silenciosamente;
- quando uma decisão mudar, a anterior permanece e é marcada como substituída;
- novas decisões são adicionadas ao final;
- esta primeira versão consolida decisões anteriores em 29 de junho de 2026.

## DEC-001 — Missão do produto

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O produto precisava de uma definição clara sobre seu propósito para
  não se confundir com um sistema de dicas abertas ou execução automática.
- Decisão: O produto existe para apoiar o melhor próximo passo da carteira, não
  para fornecer dicas irrestritas.
- Consequências: Escopo, interface, domínio e futura IA devem permanecer
  alinhados à lógica de apoio à decisão, com o usuário como responsável final.

## DEC-002 — Universo fechado de ativos

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O motor futuro precisa operar com um conjunto delimitado de ativos
  para manter previsibilidade, governança e rastreabilidade.
- Decisão: O motor não poderá sugerir ativos fora da lista definida no
  documento de produto.
- Consequências: Mudanças no universo permitido exigem atualização documental e
  decisão explícita antes de qualquer implementação.

## DEC-003 — Estratégia total 30/30/25/15

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O produto precisava registrar a estratégia macro que orienta a
  distribuição da carteira como base para metas e desvios futuros.
- Decisão: A estratégia total é composta por ações brasileiras: 30%, FIIs: 30%,
  internacional: 25% e renda fixa: 15%.
- Consequências: Todos os documentos e futuros cálculos devem respeitar essa
  distribuição como referência estratégica.

## DEC-004 — Renda fixa fora do sistema

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: A estratégia total inclui renda fixa, mas a reconstrução atual do
  produto está concentrada na parcela monitorada dentro do sistema.
- Decisão: A renda fixa integra a estratégia total, mas não será cadastrada nem
  monitorada pelo produto nesta fase.
- Consequências: Não deve existir categoria operacional de renda fixa no
  produto atual nem campos para o usuário editar essa parcela nesta etapa.

## DEC-005 — Normalização da parcela monitorada

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: Era necessário comparar corretamente as categorias monitoradas sem
  distorcer a estratégia total.
- Decisão: As metas monitoradas são 35,2941%, 35,2941% e 29,4118%.
- Consequências: A camada futura de domínio deve calcular desvios usando a
  parcela monitorada, sem alterar a estratégia original 30/30/25/15.

## DEC-006 — Algoritmo calcula e IA interpreta

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O produto precisa manter separação entre cálculo determinístico e
  interpretação assistida.
- Decisão: Cálculos e seleção técnica pertencem ao domínio determinístico.
- Consequências: A IA futura não poderá ser fonte primária de metas, cálculos,
  participações, rankings, seleção técnica ou planos de aporte, nem sugerir
  ativos fora do universo permitido.

## DEC-007 — Banco armazena fatos

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: A base de dados futura precisa preservar rastreabilidade e permitir
  recálculo consistente dos valores derivados.
- Decisão: Valores derivados não são fonte primária persistida.
- Consequências: Preço médio, valor investido, valor atual, participação,
  rentabilidade e ranking devem ser recalculáveis a partir de fatos.

## DEC-008 — Cálculos fora dos componentes

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: A reconstrução visual já separa interface e dados demonstrativos, e
  o produto precisa preservar essa disciplina quando o domínio surgir.
- Decisão: React apresenta resultados e coleta entradas, mas não concentra
  regras financeiras.
- Consequências: Cálculos relevantes devem ficar fora da camada visual e fora
  dos componentes de interface.

## DEC-009 — Reconstrução incremental orientada por telas

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O projeto está sendo reconstruído de forma progressiva a partir de
  telas, layout e comportamento visual.
- Decisão: Primeiro são construídas telas demonstrativas; integrações entram em
  etapas posteriores e isoladas.
- Consequências: Placeholders, mocks e fluxo visual podem anteceder domínio,
  banco, autenticação e APIs, desde que isso seja documentado com clareza.

## DEC-010 — Mocks não são fonte de verdade do domínio

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O Dashboard demonstrativo já exibe ativos, quantidades e valores
  que podem divergir do universo estratégico planejado.
- Decisão: Valores, ativos e quantidades demonstrativos podem divergir do
  universo real e serão substituídos ao conectar o domínio.
- Consequências: Nenhum documento pode tratar os mocks atuais como regra oficial
  de produto ou base financeira definitiva.

## DEC-011 — Supabase é planejado, não atual

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: O repositório atual ainda não possui autenticação real, banco,
  variáveis de ambiente nem integração de dados.
- Decisão: Nenhuma documentação pode declarar Supabase como implementado antes
  da integração real.
- Consequências: Supabase deve aparecer apenas como arquitetura planejada até
  que exista evidência concreta no código e na configuração do projeto.

## DEC-012 — Migrations e RLS obrigatórias

- Data de consolidação: 29 de junho de 2026
- Status: Aceita para a futura fase de dados
- Contexto: A camada futura de persistência exigirá controle de mudança
  estrutural e isolamento confiável por usuário.
- Decisão: Toda alteração estrutural do banco deverá ser versionada e dados de
  usuário deverão ser protegidos por RLS.
- Consequências: Qualquer entrada futura de banco sem migrations e sem políticas
  de isolamento será considerada incompleta.

## DEC-013 — Consolidação monetária em reais

- Data de consolidação: 29 de junho de 2026
- Status: Aceita para a futura fase financeira
- Contexto: O produto precisará consolidar uma carteira com ativos
  internacionais preservando rastreabilidade de moeda e câmbio.
- Decisão: Ativos internacionais preservam sua moeda de origem, mas a visão
  consolidada será calculada em reais com câmbio rastreável.
- Consequências: O domínio futuro precisará manter fonte, horário e valor da
  taxa usada em cada consolidação relevante.

## DEC-014 — Documentação como fonte de alinhamento

- Data de consolidação: 29 de junho de 2026
- Status: Aceita
- Contexto: A reconstrução envolve produto, arquitetura, interface e futuras
  integrações em etapas diferentes.
- Decisão: Mudanças de produto ou arquitetura precisam atualizar os documentos
  correspondentes e registrar decisões relevantes.
- Consequências: A documentação passa a ser parte do alinhamento do repositório,
  não apenas material opcional de apoio.

## DEC-015 — Motor Estratégico V2 antes do dossiê de IA

- Data: 14 de julho de 2026
- Status: Aceita
- Contexto: A atualização automática de mercado já está integrada, mas
  `target-allocation` ainda usava déficit por categoria e pesos proporcionais.
  O produto historicamente definiu o plano multiativos como etapa anterior à
  interpretação por IA.
- Decisão: `target-allocation` passa a usar o Motor V2 guloso, simulando uma
  unidade inteira por iteração e escolhendo a unidade que mais reduz o desvio
  global individual. O cálculo usa metas globais por ativo, limita o plano a até
  3 ativos distintos e não força o gasto do saldo quando uma nova unidade não
  melhora a carteira.
- Consequências: O motor passa a produzir fatos técnicos de antes e depois, que
  serão entrada do futuro dossiê. A IA continua sem poder alterar o plano
  técnico.

## DEC-016 — Dossiê Técnico V1 como contrato derivado em memória

- Data: 14 de julho de 2026
- Status: Aceita
- Contexto: O Motor Estratégico V2 já produz o plano técnico e seus impactos
  determinísticos. A futura camada qualitativa precisa de uma fronteira
  estruturada e auditável sem duplicar cálculo financeiro.
- Decisão: O Dossiê Técnico V1 será um objeto puro, determinístico e derivado
  em memória. Ele consolida `PortfolioSnapshot`, estratégia, fatos atuais de
  mercado e o `TargetAllocationContributionResult` já calculado. Não possui
  persistência, não chama IA e não recalcula o Motor V2.
- Consequências: A futura camada de fundamentos, notícias, eventos e IA deve
  consumir o contrato do dossiê ou evoluções versionadas dele. Ranking técnico
  completo não será inventado enquanto o Motor V2 não expuser esse fato.
  Persistência exige decisão arquitetural futura explícita.

## DEC-017 — Fatos fundamentalistas normalizados antes dos providers

- Data: 14 de julho de 2026
- Status: Aceita
- Contexto: As fontes oficiais de fundamentos possuem contratos diferentes
  para ações brasileiras, FIIs e ETFs. Acoplar o domínio diretamente aos
  formatos CVM ou SEC criaria dependência de infraestrutura e dificultaria a
  futura interpretação qualitativa.
- Decisão: Criar `FundamentalFactsV1` como contrato puro, determinístico e em
  memória. O contrato normaliza fatos contábeis mínimos por classe de ativo,
  preserva período, fonte, documento e moeda e não calcula derivados ou scores.
  Valores contábeis monetários usam representação signed em unidades menores,
  sem alterar `MoneyAmount`.
- Consequências: Providers CVM DFP/ITR, CVM FII e SEC N-PORT deverão produzir
  esse contrato em ciclos posteriores. P/L, P/VP, margens, crescimento,
  rankings e scores permanecem fora da camada factual. `FundamentalFactsV1`
  não modifica o Motor V2 nem `TechnicalDossierV1`.

## DEC-018 — Fundamentos como fatos globais compartilhados

- Data: 15 de julho de 2026
- Status: Aceita
- Contexto: O mesmo fato contábil oficial da CVM descreve a companhia e não um
  usuário específico. As tabelas `assets` são materializadas por usuário e não
  podem ser usadas como identidade global de fundamentos.
- Decisão: Persistir snapshots fundamentalistas como fatos globais, sem
  `user_id` e sem FK para `assets.id`. A identidade de junção do MVP usa ticker
  normalizado, categoria e mercado. A escrita fica reservada a contexto
  server-side privilegiado e a leitura é permitida a usuários autenticados.
- Consequências: A ingestão usa storage injetado e upsert idempotente. Nenhuma
  chave privilegiada pode existir no browser. A associação ao ativo de cada
  usuário ocorre somente na leitura, sem duplicar o fato contábil global.

## DEC-019 — Comparabilidade semântica governa a extração fundamentalista CVM

- Data: 15 de julho de 2026
- Status: Aceita
- Contexto: A auditoria oficial mostrou que uniformidade de `CD_CONTA` não
  prova comparabilidade econômica. DRE 3.01 representa receitas de
  intermediação financeira em BBAS3 e receita de venda de bens ou serviços nas
  outras quatro companhias do universo.
- Decisão: Um fato só entra em um campo normalizado quando sua semântica oficial
  é compatível com o conceito do domínio. Quando a comparabilidade não é
  comprovada, o fato permanece `null`. `totalRevenue` continua no contrato V1,
  mas o provider CVM V1 não o preenche nem força conceitos setoriais distintos
  para o mesmo campo.
- Consequências: Cobertura parcial é explícita e não significa valor zero ou
  falha silenciosa. Métricas setoriais ou uma abstração futura de top line
  exigem decisão própria. A seleção atual usa allowlists exatas de descrições,
  sem fuzzy matching, `contains` ou exceções por ticker.

## DEC-020 — Snapshots fundamentalistas globais usam contrato multi-kind

- Data: 16 de julho de 2026
- Status: Aceita
- Contexto: O provider CVM de FIIs introduz fatos e metadados diferentes dos
  demonstrativos de ações. O Informe Mensal identifica o fundo por CNPJ e nome,
  mas não fornece o ticker necessário para associação ao universo fechado.
- Decisão: Manter uma única tabela global `fundamental_snapshots`, com colunas
  factuais específicas por classe e constraints discriminadas por `kind`.
  FIIs são identificados na fonte por CNPJ, denominação oficial e ISIN; o ticker
  é resolvido por mapping fechado e auditado. Não há `user_id` nem FK para
  `assets`, e ausência factual continua representada por `null`. Como o campo
  oficial de cotas emitidas pode conter quantidade decimal, o domínio usa
  coeficiente inteiro seguro e escala, removendo zeros decimais finais sem
  arredondar ou recorrer a ponto flutuante.
- Consequências: Ações existentes permanecem compatíveis e as colunas de FII
  ficam nulas para `brazilian-stock`. Registros de FII exigem fonte e período
  oficiais, `filing_version` positivo e `exercise_order` nulo, enquanto campos
  de ações ficam nulos. O contrato inteiro anterior não representava todos os
  dados oficiais; `issued_shares_unscaled` e `issued_shares_scale` preservam a
  informação sem perda. Novos kinds deverão adicionar regras explícitas sem
  enfraquecer as classes existentes. A migration foi integrada na PR #74 e
  aplicada como `20260716172033_generalize_fundamental_snapshots_for_fii`; os
  tipos Supabase e adapters de ações e FIIs foram sincronizados, mantendo a
  tabela vazia e sem integração runtime.
