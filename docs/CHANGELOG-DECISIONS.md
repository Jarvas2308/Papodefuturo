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

## DEC-021 — Provider SEC N-PORT V1 usa identidade fechada e execução server-side

- Data: 16 de julho de 2026
- Status: Aceita
- Contexto: ETFs internacionais do universo fechado precisam de fatos oficiais
  comparáveis sem depender de agregadores. O Form N-PORT identifica registrant,
  série e classes e publica ativos, passivos e patrimônio líquido em USD no
  escopo da série; o filing pode receber amendments para o mesmo período.
- Decisão: O provider V1 cobre somente VOO, VNQ e VEA e usa exclusivamente o
  Submissions API e os documentos N-PORT oficiais da SEC. A identidade é
  validada por CIK, nome do registrant, series ID, nome da série, class ID e nome
  da classe. Os fatos financeiros pertencem à série; todos os class IDs do XML
  são preservados, e a classe ETF esperada apenas associa a série ao ticker do
  produto. A seleção une filings recentes e históricos, elimina accessions
  idênticos e rejeita metadados divergentes, priorizando `reportDate`,
  `acceptedAt`, amendment em empate temporal e accession. Valores USD são
  convertidos para centavos por parsing decimal exato com `BigInt`. Todo fetch é
  injetado e deve executar server-side, com User-Agent identificável e respeito
  ao fair access da SEC. O accession number com hífens identifica o filing e
  compõe o `sourceDocumentId`; `filingVersion` permanece nulo para SEC. Ativos,
  passivos e patrimônio líquido são preservados como publicados, sem derivar um
  fato ausente a partir dos demais.
- Consequências: O provider não depende de React, navegador, Supabase ou rede em
  testes. A tabela global foi estendida de forma não destrutiva para
  `international-etf` e `sec-nport` na PR #76, com migration aplicada como
  `20260716203927_generalize_fundamental_snapshots_for_sec_nport`. Os tipos e o
  adapter Supabase foram sincronizados para escrita e leitura globais, mantendo
  a tabela vazia e as barreiras de segurança existentes. Scheduler, execução
  real, derivados e UI exigem ciclos posteriores; o provider não inventa fatos
  ausentes nem altera o Motor V2 ou o Dossiê Técnico.

## DEC-022 — Derivados fundamentalistas são uma camada separada e auditável

- Data: 16 de julho de 2026
- Status: Aceita
- Contexto: Os providers e adapters das três classes produzem fatos oficiais
  normalizados, mas razões financeiras e reconciliações são interpretações
  matemáticas derivadas. Misturar esses resultados ao contrato factual apagaria
  a fronteira entre fonte oficial e cálculo do produto.
- Decisão: Criar `FundamentalDerivedFactsV1` como objeto puro, determinístico e
  somente em memória. Cada métrica referencia o snapshot factual de origem sem
  modificá-lo. Razões usam `BigInt`, escala fixa de 1.000.000 e arredondamento
  half-away-from-zero. Input ausente, denominador não positivo, moeda divergente
  e aritmética insegura são indisponibilidades explícitas. A camada não usa
  preço de mercado, não calcula crescimento, score, ranking ou recomendação e
  não altera o Motor V2.
- Consequências: Derivados podem ser auditados contra o documento factual e
  evoluídos por versão sem contaminar `FundamentalFactsV1`. Eles não são
  persistidos nem integrados ao runtime ou à UI neste ciclo. A tabela global
  `fundamental_snapshots` continua vazia e exclusiva para fatos normalizados.
  O adapter SEC factual foi integrado na PR #77, deixando providers e adapters
  das três classes disponíveis antes desta nova fronteira derivada.

## DEC-023 — Notícias editoriais e eventos oficiais possuem contratos separados

- Data: 16 de julho de 2026
- Status: Aceita
- Contexto: Após a conclusão dos fundamentos e integração da PR #78, o próximo
  estágio precisa contextualizar os ativos sem confundir filing oficial com
  documento jornalístico, sem duplicar fatos e sem interferir na verdade
  matemática do plano.
- Decisão: Fica aprovada a política Eventos Oficiais Primeiro. Eventos oficiais
  são fatos contextuais e notícias são documentos editoriais, com contratos,
  deduplicação e persistência conceitual próprios. Somente CVM, para ações e
  FIIs, e SEC EDGAR, para ETFs, são fontes automatizadas V1. Notícias editoriais
  ficam adiadas. A associação exige identidade forte e mapping fechado; não
  haverá sentimento, score, ranking ou IA. O armazenamento será mínimo,
  compatível com os termos e sempre preservará atribuição e proveniência.
  Nenhuma categoria altera o Motor V2 ou o plano.
- Consequências: Contexto indisponível nunca bloqueia carteira, Motor V2, plano,
  Novo Aporte ou confirmação de compra. A próxima implementação cobre somente o
  domínio puro de `OfficialAssetEventV1`, sem provider, banco ou runtime. B3, RI,
  gestores e Vanguard permanecem verificação humana; GDELT permanece pesquisa
  exploratória. Notícias editoriais exigem nova auditoria de provider, cobertura,
  identidade e licença antes de qualquer implementação.

## DEC-024 — OfficialAssetEventV1 é um domínio puro, determinístico e não bloqueante

- Data: 16 de julho de 2026
- Status: Aceita
- Contexto: A política Eventos Oficiais Primeiro exige uma fronteira auditável
  antes de providers e infraestrutura, sem confundir documentos regulatórios
  com notícias editoriais nem permitir que contexto altere decisões financeiras.
- Decisão: `OfficialAssetEventV1` é um domínio puro, determinístico e somente em
  memória. O contrato usa registry fechado dos 12 ativos e identidade
  regulatória forte, taxonomia fechada de 15 eventos, tempo com precisão
  explícita e data civil sem conversão para meia-noite. A deduplicação segue a
  identidade documental, e amendments, correções, substituições e cancelamentos
  preservam documentos anteriores como histórico. Não existem provider, banco,
  Supabase ou runtime nesta entrega.
- Consequências: O contexto oficial nunca altera nem bloqueia o Motor V2 ou o
  plano. Providers CVM e SEC serão ciclos independentes, começando por eventos
  de ações. Notícias editoriais continuam adiadas e exigem nova auditoria antes
  de qualquer contrato implementado.

## DEC-025 — Provider CVM IPE V1 classifica apenas categorias oficiais fechadas

- Data: 17 de julho de 2026
- Status: Aceita
- Contexto: O domínio `OfficialAssetEventV1` precisa receber eventos das cinco
  ações do universo fechado sem interpretar texto livre. A auditoria do arquivo
  anual IPE confirmou schema, identidade, categorias, datas e links oficiais,
  além de denominações oficiais da fonte que diferem pontualmente dos nomes
  canônicos internos.
- Decisão: O provider V1 cobre somente BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3 e
  usa a URL anual oficial do IPE. Código CVM e CNPJ são identificadores fortes;
  o registry mantém a identidade canônica. Denominações alternativas são
  aliases fechados, auditados e específicos do provider, nunca fuzzy matching,
  e a denominação observada não altera `assetIdentity`. Nome desconhecido
  bloqueia o lote e qualquer novo alias exige decisão posterior. A classificação
  usa somente a categoria oficial em mapping fechado, sem assunto ou texto
  livre. O provider não baixa os documentos, reduz horários sem timezone à data
  civil, não infere revisão pela versão e deduplica em memória.
  `Tipo_Apresentacao` é preservado somente como metadado bruto: todos os eventos
  desta V1 são `original`, sem relação de revisão. Um valor futuro só poderá
  alterar status após auditoria oficial, mapping fechado e testes específicos.
- Consequências: O provider produz contexto regulatório opcional com
  proveniência e rejeições estruturadas, sem persistência, migration, Supabase,
  scheduler ou integração runtime. Falhas nunca afetam Motor V2, Dossiê Técnico
  ou plano de aporte. Providers de FIIs e ETFs permanecem ciclos posteriores.

## DEC-026 — Provider CVM Fund Delivery V1 usa entrega mensal e identidade exata de FII

- Data: 17 de julho de 2026
- Status: Aceita
- Contexto: Os quatro FIIs do universo fechado precisam de eventos oficiais sem
  misturar o arquivo mensal controlado com o arquivo diário muito maior, sem
  inferir ticker por nome e sem converter datas civis em instantes artificiais.
- Decisão: O provider V1 cobre somente KNRI11, VISC11, XPLG11 e HGRU11 e usa o
  ZIP mensal oficial de Fund Delivery, materializando exclusivamente
  `fi_entrega_documento_<YYYYMM>.csv`. A associação usa CNPJ exato e mapping
  fechado de ticker. Apenas `INFORM MENSAL` e `INFO TRIM FII` produzem
  `periodic-report`; os demais tipos são rejeitados. A entrega fornece somente
  a data civil de publicação, o fim da competência fornece a ocorrência e não
  se inventa timezone. A API recebe ano e mês numéricos. CNPJ aceita somente a
  forma canônica ou a pontuação oficial; sistema de origem normalizado e ID em
  decimal canônico formam a identidade documental, e o ID também é preservado
  como identificador regulatório.
- Consequências: Todos os eventos são `original`, sem URL, protocolo,
  fingerprint ou revisão inventados; apresentação e indicador de ativo ficam
  apenas na proveniência. Limites defensivos evitam materializar o CSV diário.
  O provider permanece isolado, determinístico, com fetch injetado e
  deduplicação em memória, sem storage, migration, Supabase, scheduler, runtime
  ou UI. O source canônico passa a ser `cvm-fund-delivery`, sem alias legado.

## DEC-027 — Provider SEC EDGAR V1 associa ETFs por CIK, série e classe

- Data: 17 de julho de 2026
- Status: Aceita
- Contexto: VOO, VNQ e VEA precisam de eventos regulatórios oficiais sem usar
  ticker textual, nome do fundo ou o prefixo do accession como identidade do
  ETF. A Submissions API fornece o índice de filings, mas somente a Filing
  Detail confirma a hierarquia oficial de série e class/contract.
- Decisão: O provider V1 cobre somente VOO, VNQ e VEA e associa cada filing pela
  combinação exata do registrant CIK validado em Submissions com series ID e
  class/contract ID confirmados na Filing Detail. O prefixo do accession é usado
  apenas para construir a URL do Archives. O mapping fechado aceita `NPORT-P`,
  `N-CEN`, `N-CSR` e `N-CSRS` como `periodic-report`, e `DEF 14A` e `DEFA14A`
  como `shareholder-meeting`; forms ambíguos e `/A` ficam fora da V1. Todos os
  eventos são `original`, o accession é a identidade documental,
  `acceptanceDateTime` fornece a publicação e `reportDate` ou `filingDate`
  fornece a ocorrência. A Filing Detail é a URL canônica e original; o primary
  document não é baixado. A execução usa User-Agent obrigatório, chamadas
  sequenciais com intervalo mínimo de 500 ms e cache por URL.
- Consequências: A V1 usa apenas `filings.recent`. Se `filings.files` indicar
  histórico necessário, o lote é interrompido antes dos detalhes. SGML fica
  como fallback futuro e `index.json` não é usado porque não confirma série e
  classe. Mudança estrutural ou indisponibilidade da Filing Detail aborta sem
  omissão silenciosa. O provider permanece isolado, sem storage, migration,
  Supabase, scheduler, runtime, UI ou ingestão real, e falhas não alteram nem
  bloqueiam o Motor V2. O próximo ciclo é o storage global de eventos oficiais.

## DEC-028 — Contrato global de storage de eventos oficiais usa eventId e deduplicationKey como identidades persistentes

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: Os três providers oficiais já produzem `OfficialAssetEventV1`, mas a
  futura persistência precisa de uma fronteira global, auditável e independente
  de CVM, SEC, usuário ou carteira. A identidade não pode depender apenas de
  `source_type + source_document_id`, pois o domínio possui uma hierarquia
  canônica de identidades documentais.
- Decisão: O contrato `official-asset-event-storage-record.v1` é global,
  provider-agnostic e lossless. `eventId` é a identidade determinística
  persistente, `deduplicationKey` é a chave natural global e
  `documentIdentity` permanece preservada. O record não possui `user_id` nem FK
  para `assets.id`. A escrita usa batch validado e upsert idempotente: preserva
  o menor `ingestedAt`, aceita a versão de `updatedAt` mais recente, ignora stale
  e trata payload divergente na mesma versão como conflito. Amendments,
  correções, substituições e cancelamentos permanecem registros independentes.
- Consequências: A implementação em memória serve somente como referência de
  conformance e test double. Este ciclo não cria SQL, migration, Supabase,
  runtime, scheduler, backfill, conexão com providers ou repository de leitura.
  O próximo ciclo é a migration de `official_asset_events`; adapter e leitura
  permanecem posteriores.

## DEC-029 — Migration official_asset_events preserva identidade global e separa datas civis de instantes

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: O contrato global de storage precisa de uma representação PostgreSQL
  que preserve identidade, temporalidade e proveniência sem transformar datas
  civis em instantes nem acoplar fatos globais a usuários ou carteiras.
- Decisão: A migration cria a tabela global `official_asset_events`, sem
  `user_id` e sem FK para `assets`. `event_id` é a PK,
  `deduplication_key` é a chave natural unique e a identidade documental
  discriminada permanece separada. A identidade regulatória é validada por
  classe. Datas civis usam `date`; instantes UTC, valores temporais brutos e
  timestamps internos ficam em texto canônico lossless, sem meia-noite
  inventada. Somente estruturas auditáveis usam `jsonb`. RLS fica habilitado,
  `anon` não possui acesso, `authenticated` recebe somente leitura e a escrita é
  reservada ao contexto server-side. Revisões são preservadas sem FK obrigatória
  em `supersedes_event_id`, permitindo backfill fora de ordem.
- Consequências: A validação profunda continua no contrato TypeScript e no futuro
  adapter. Esta decisão não cria adapter, runtime, scheduler, ingestão ou
  backfill e não aplica a migration ao Supabase remoto. A sincronização dos tipos
  gerados fica para o ciclo que aplicar o schema real e implementar o adapter.

## DEC-030 — Adapter Supabase de eventos oficiais usa RPC transacional e escrita server-side

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: A tabela global versionada precisa implementar a semântica de
  `OfficialAssetEventStorageV1` sem simular atomicidade por múltiplas chamadas
  PostgREST nem expor escrita direta ao browser. A fronteira deve preservar os
  58 campos, identidades, temporalidade lossless, proveniência e histórico de
  revisões sob concorrência.
- Decisão: O adapter mapeia explicitamente os 58 campos e chama uma única RPC
  `upsert_official_asset_events_v1` por batch de até 500 records. A função usa
  `SECURITY DEFINER`, `search_path` fixo e `pg_advisory_xact_lock` transacional
  para serializar writers. Todo o lote é classificado antes de writes e qualquer
  conflito impede gravações. `eventId` e `deduplicationKey` permanecem
  identidades imutáveis; stale é ignorado, divergência na mesma versão é
  conflito, conteúdo mutável posterior pode ser atualizado, o menor
  `ingestedAt` é preservado e o `updatedAt` mais recente governa a versão.
  Somente `service_role` executa a RPC, a escrita direta da tabela por esse role
  é revogada, `authenticated` continua somente leitura e `anon` permanece sem
  acesso.
- Consequências: O client é estrutural, injetado e exclusivo da camada
  server-side; não existe singleton, chave privilegiada ou operação direta no
  frontend. `database.types.ts` permanece gerado e não foi falsificado. A
  migration complementar ainda não foi aplicada ao Supabase remoto, o adapter
  ainda não está conectado ao runtime e os providers ainda não executam
  persistência real. Execução server-side, backfill, scheduler, repository e UI
  permanecem ciclos posteriores.

## DEC-031 — Executor de eventos oficiais compõe providers e storage somente no servidor

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: Os três providers oficiais e o contrato global de persistência já
  existem, mas precisam ser compostos sem levar credenciais, rede regulatória ou
  escrita privilegiada ao browser e sem permitir que falhas contextuais afetem
  o produto financeiro.
- Decisão: O executor V1 recebe jobs explícitos de CVM IPE, CVM Fund Delivery e
  SEC EDGAR, valida todo o lote e os executa sequencialmente na ordem recebida.
  Cada provider produz `OfficialAssetEventV1`, que é persistido somente por
  `persistOfficialAssetEventsV1` e pelo adapter Supabase injetado. Falhas são
  isoladas por job e não bloqueiam login, carteira, compras, Motor V2 ou Novo
  Aporte. O fetch server-side usa allowlist exata de hosts, HTTPS, redirect
  manual rejeitado, timeout com abort e headers mínimos. User-Agent SEC,
  relógio, fetch e RPC client são injetados; o módulo não lê segredo ou ambiente
  e não é exportado ao browser.
- Consequências: O resultado preserva ordem, contadores, rejeições, duplicatas,
  conflitos e retorno da persistência com erros sanitizados. Este ciclo não
  cria scheduler, retry, checkpoint, backfill, entrypoint de produção,
  repository de leitura ou UI; não executa rede real, não acessa Supabase real e
  não aplica migrations. O próximo ciclo é o backfill controlado e reiniciável.

## DEC-032 — Backfill de eventos oficiais usa planos determinísticos, leases e checkpoint persistente

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: O executor server-side já compõe os três providers e o storage
  global, mas um histórico amplo não pode depender de uma chamada monolítica,
  memória volátil, retries implícitos ou jobs sem identidade. Interrupções e
  concorrência precisam preservar progresso auditável sem vincular fatos
  globais a usuários ou carteiras.
- Decisão: O backfill V1 recebe plano explícito e fechado, deriva `planId`, hash
  e `jobId` deterministicamente e gera um job por ano, mês ou janela civil. A
  execução ocorre em passos limitados por `maxJobs`, sem loop infinito. O
  checkpoint global não possui `user_id`; runs e jobs preservam status,
  contadores e summaries seguros. Claims usam lease com owner explícito e
  recuperação após expiração. Retry de `failed` exige nova etapa,
  `retryFailed: true` e tentativas restantes; `conflict` não recebe retry.
  `failureMode` define continuar ou pausar, devolvendo transacionalmente jobs
  ainda não iniciados. RPCs server-side versionadas, `SECURITY DEFINER`,
  `search_path` fixo, RLS e revokes impedem acesso de `anon` e `authenticated`;
  `service_role` opera somente pelas RPCs.
- Consequências: O mesmo plano retoma as mesmas identidades e não reexecuta jobs
  concluídos. A implementação em memória é referência de conformance e o
  adapter Supabase usa client RPC injetado. Não existem scheduler, cron,
  execução automática, backfill real, migration aplicada, repository de
  leitura, runtime ou UI. A validação profunda permanece em TypeScript e SQL; o
  próximo ciclo é o repository global de leitura de eventos oficiais.

## DEC-033 — Repository global de eventos oficiais usa timeline publicada e cursor determinístico

- Data: 19 de julho de 2026
- Status: Aceita
- Contexto: O contrato global, a tabela versionada, o adapter de escrita, o
  executor e o backfill já definem fatos oficiais auditáveis, mas consumidores
  futuros precisam de uma fronteira única de leitura que não dependa de provider,
  usuário ou paginação por offset. Datas civis e instantes possuem semânticas
  distintas e não podem ser achatados em um timestamp artificial.
- Decisão: O repository V1 expõe somente leitura por `eventId` e timeline
  paginada. A ordem descendente combina data civil publicada, precisão, instante
  UTC canônico quando existente e `eventId`. O cursor opaco e versionado inclui
  essa tupla e um hash determinístico da consulta canônica. Filtros são fechados,
  o limite fica entre 1 e 100 e não existem count global, busca textual ou campos
  de usuário/carteira. As RPCs são `STABLE`, `SECURITY INVOKER`, obedecem à RLS e
  concedem execução somente a `authenticated` e `service_role`. Toda linha passa
  pelos contratos Supabase, storage e domínio existentes.
- Consequências: A paginação é keyset e não oferece snapshot transacional entre
  chamadas; inserções concorrentes seguem a posição da chave. A validação
  profunda e o cursor público permanecem no adapter TypeScript, enquanto o SQL
  valida a fronteira e aplica filtros/ordenação. A migration não foi aplicada e
  este ciclo não cria runtime, UI, scheduler, backfill real, escrita, count ou
  busca editorial. O próximo ciclo é a integração runtime opcional.

## DEC-034 — Runtime de eventos oficiais é opcional, somente leitura e não bloqueante

- Data: 20 de julho de 2026
- Status: Aceita
- Contexto: O repository global oferece leitura auditável por identidade e
  timeline, mas a aplicação ainda não possui uma fronteira opcional que trate
  autenticação, indisponibilidade e capacidade local sem acoplar eventos aos
  fluxos financeiros ou ativar infraestrutura ainda não aplicada.
- Decisão: `official-events-runtime.v1` usa uma união discriminada sem default:
  `disabled` não recebe nem chama repository ou acesso; `read-only` recebe o
  repository global, um client autenticado por composição indireta, uma porta de
  estado de acesso e relógio UTC injetados. Somente `authenticated` lê;
  `unauthenticated` e `unresolved` não chamam o repository. Cada operação faz no
  máximo uma leitura, sem retry, preflight, cache ou count. Falhas não viram
  timeline vazia: página vazia e `get` nulo válidos são `succeeded`, enquanto
  transporte/schema indisponível e violações contratuais têm estados separados
  e erros sanitizados. O relógio preserva até nove dígitos fracionários e rejeita
  regressão. A composição Supabase estreita reutiliza o repository e nunca cria
  client, singleton, service role, escrita, provider, executor, backfill ou
  scheduler.
- Consequências: O runtime é browser-compatible, somente leitura e não bloqueia
  login, carteira, compras, Motor V2, Dossiê Técnico ou Novo Aporte. Não existe
  UI, hook, rota ou ativação no composition root neste ciclo. As migrations e
  RPCs continuam não aplicadas; o modo `read-only` só poderá ser selecionado após
  o schema estar disponível. O próximo ciclo é a apresentação opcional dos
  eventos oficiais na UI, sem autorização implícita para escrita ou execução de
  providers.

## DEC-035 — UI de eventos oficiais usa runtime opcional e permanece desligada até o deployment do schema

- Data: 20 de julho de 2026
- Status: Aceita
- Contexto: O runtime opcional já distingue capacidade, autenticação,
  indisponibilidade, falha e sucesso, mas a aplicação precisa apresentar os
  eventos sem acoplar componentes ao repository ou ativar infraestrutura ainda
  não aplicada no Supabase remoto.
- Decisão: A página autenticada de Eventos Oficiais recebe somente
  `OfficialEventsRuntimeV1`. Ela apresenta timeline read-only, filtros fechados,
  paginação por cursor, detalhes por `eventId`, revisões, fontes CVM e SEC,
  precisão temporal e links HTTPS para hosts oficiais auditados. Eventos não são
  notícias editoriais nem recomendações. A composição real seleciona
  explicitamente `disabled`: o item da navegação não é renderizado e o acesso
  direto mostra o estado desabilitado sem chamar repository ou Supabase.
- Consequências: Estados do runtime não são convertidos em vazio, respostas
  obsoletas não sobrescrevem filtros atuais e a UI não acessa storage, escrita,
  providers, executor ou backfill. Nenhuma migration foi aplicada, nenhum
  backfill foi executado e nenhum evento está disponível em produção. O recurso
  `read-only` só poderá ser ativado após deployment e validação do schema e das
  RPCs. Fluxos financeiros, Motor V2 e plano técnico permanecem independentes.

## DEC-036 — Notícias editoriais permanecem condicionadas a licença, identidade forte e cobertura comprovada

- Data: 20 de julho de 2026
- Status: Aceita
- Contexto: A sequência local de eventos oficiais chegou à apresentação opcional
  ainda desativada. Antes de qualquer implementação editorial, a auditoria V2
  avaliou GDELT, NewsAPI, Finnhub, Marketaux, Alpha Vantage, Financial Modeling
  Prep, Massive com Benzinga e Benzinga direta quanto a uso comercial
  multiusuário, copyright, identidade do instrumento, cobertura dos 12 ativos,
  custo e operação. Nenhum candidato comprovou todos os gates simultaneamente.
- Decisão: O resultado é `NO-GO`. GDELT, NewsAPI, Finnhub, Marketaux e Alpha
  Vantage ficam rejeitados para o contrato atual. FMP, Massive com Benzinga e
  Benzinga direta permanecem condicionais, sem autorização de implementação.
  Não existe provider ou composição multiprovider aprovada. Notícias editoriais
  só poderão ser reavaliadas com contrato comercial completo e revisão jurídica,
  direitos explícitos por campo, identidade forte e teste autenticado de
  cobertura dos 12 ativos. Eventos Oficiais Primeiro permanece a política do
  produto.
- Consequências: O item 17 do roadmap está concluído como auditoria e decisão,
  não como funcionalidade editorial. Não serão criados contrato runtime,
  provider, storage, migration, repository, UI, IA, sentimento ou score
  editorial. As migrations oficiais permanecem não aplicadas, nenhum backfill
  foi executado e o runtime real segue `disabled`. A única próxima ação permitida
  é um deployment controlado dos eventos oficiais mediante autorização separada.

## DEC-037 — Deployment de eventos oficiais exige migrations em fases, gates explícitos e ativação posterior

- Data: 20 de julho de 2026
- Status: Aceita
- Contexto: Os 17 itens de desenvolvimento de News & Events estão concluídos
  localmente, mas as migrations de eventos oficiais não foram aplicadas, os types
  gerados ainda refletem o schema remoto anterior, nenhum backfill foi executado
  e a composição real permanece `disabled`. Aplicação, dados e ativação não podem
  ser tratados como uma única mudança implícita.
- Decisão: A fase operacional é separada e usa manifesto com hashes reais,
  runbook, SQL somente leitura e checklist. A ordem obrigatória é schema, escrita
  transacional, checkpoint e leitura. Migrations precedem regeneração de types;
  types precedem smoke tests; backfill canário precede validação dos dados; e
  somente autorização posterior permite `read-only` e sidebar. Backup, ambiente,
  operador, CI, drift, RLS, grants e hashes são gates de `GO/NO-GO`. O runtime
  permanece `disabled` durante o deployment.
- Consequências: Cada ação remota exige autorização separada. Após dados,
  rollback conservador desativa consumidores e prefere forward fixes
  versionados; eventos não são removidos automaticamente. A auditoria editorial
  continua `NO-GO`. Este ciclo não acessa Supabase, não aplica migrations, não
  executa SQL, provider ou backfill, não regenera types e não ativa runtime ou UI.

## DEC-038 — Branches obsoletas do incidente de publicação removidas

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: `docs/PROJECT_HANDOFF.md` documentava três branches remanescentes do
  incidente de publicação do PR #85 (`ops/official-events-deployment-readiness-v1`,
  `automation/publish-official-events-series` e
  `automation/trigger-official-events-series`) como pendentes de decisão. A
  série real já estava publicada e mergeada em `main` pelo PR #86; as três
  branches estavam defasadas em relação à `main` e não continham nenhum
  trabalho não integrado. `automation/trigger-official-events-series` continha
  especificamente o workflow `publish-official-events-series.yml` com
  `permissions: contents: write` disparado em `pull_request`, o mesmo mecanismo
  do incidente original.
- Decisão: Confirmado com o usuário que o incidente já está documentado em
  `docs/PROJECT_HANDOFF.md` (seção 3) e que a evidência não depende de manter
  as branches vivas, as três foram excluídas — local e remotamente no GitHub.
- Consequências: Nenhum código foi perdido: as três branches eram byte a byte
  regressivas em relação à `main` (nenhum commit exclusivo com trabalho útil,
  exceto os commits do próprio incidente, já superados pelo PR #86). O
  workflow de escrita automática do incidente não existe mais em nenhuma
  branch do repositório. Este ciclo não tocou `main`, migrations, Supabase ou
  qualquer código de produto.

## DEC-039 — Suíte pgTAP de RLS conectada ao CI via Postgres local efêmero

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: `supabase/tests/database/rls_user_isolation.test.sql` (43
  asserções) só havia sido executado manualmente contra o Supabase real de
  produção, nunca em CI, porque rodá-lo exigiria credencial de banco. CI não
  deve ter acesso a credenciais de produção.
- Decisão: Adicionar um job `rls-pgtap` a `.github/workflows/validate.yml` que
  usa o Supabase CLI (`supabase/setup-cli@v1`) para subir um Postgres local
  efêmero via Docker dentro do próprio runner (`supabase db start`), aplicar
  as migrations versionadas (`supabase db reset --local --no-seed`) e então
  rodar a suíte pgTAP (`supabase test db --local supabase/tests/database`).
  Um `supabase/config.toml` mínimo foi criado só para isso, com Studio,
  Storage, Realtime, SMTP local e o serviço de Auth desabilitados — apenas o
  Postgres e os schemas embutidos (incluindo `auth` e a extensão `pgtap`) são
  necessários. Nenhuma credencial ou projeto de produção é referenciado.
- Consequências: A suíte de isolamento de RLS passa a rodar automaticamente
  em todo PR e push para `main`, sem depender de execução manual contra
  produção. Como o ambiente local deste ciclo não tinha Docker disponível, a
  validação de ponta a ponta do job só pôde ser confirmada até o ponto de
  inspeção do serviço Docker pela CLI (o `supabase/config.toml` foi validado
  como sintaticamente correto); a execução completa do job (`db start` →
  `db reset` → `test db`) só será comprovada na primeira execução real do
  GitHub Actions após o merge. Este ciclo não alterou o schema real, não
  aplicou migrations em produção e não tocou o Supabase real.

## DEC-040 — Canário de backfill real executado: CVM Fund Delivery, julho/2026, zero eventos

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: `docs/runbooks/OFFICIAL_EVENTS_DEPLOYMENT_V1.md` (seção 17) exigia
  autorização explícita e separada, escopo mínimo (`maxJobs = 1`) e escolha do
  job no momento da execução para o canário de backfill real. O usuário
  autorizou explicitamente essa execução, confirmou aceitar o risco sem
  verificação formal de backup/PITR (as três tabelas de eventos estavam com 0
  linhas) e forneceu a `service_role` key real via arquivo local
  `.env.server.local`, coberto por `.gitignore` e nunca visto em texto por
  este agente.
- Decisão: Foi criado `scripts/run-official-events-backfill-canary.ts`, um
  runner manual e pontual (não integrado a nenhum fluxo do app nem ao CI) que
  conecta o orquestrador de backfill já testado
  (`src/server/context/official-events/backfill`) a um cliente Supabase real
  com `service_role` e ao provider `cvm-fund-delivery` real. O script roda em
  modo preview por padrão e só executa de verdade com a flag `--confirm`. A
  verificação inicial usava um User-Agent SEC malformado
  (`PapoDeFuturo/1.0 (contact: email)`, com o e-mail colado dentro dos
  parênteses) que falhava a validação de `assertSecUserAgent`; corrigido para
  `PapoDeFuturo/1.0 (contact) email`, validado offline antes de tentar de
  novo. O job único (`cvm-fund-delivery`, ano 2026, mês 7 — mês mais recente
  confirmado publicado pela CVM no momento da execução) rodou com sucesso:
  plano criado e finalizado no checkpoint real, um job reivindicado e
  concluído, `fetchedEventCount: 0`. Consulta somente leitura confirmou o
  estado real após a execução: `official_asset_events` com 0 linhas,
  `official_event_backfill_runs` com 1 linha, `official_event_backfill_jobs`
  com 1 linha. `get_advisors` (segurança) não mostrou nenhum achado novo além
  dos já documentados (RLS sem policy nas tabelas de checkpoint, por desenho;
  leaked password protection desabilitada, pendência pré-existente e não
  relacionada).
- Consequências: O canário provou a cadeia completa ponta a ponta contra
  produção real — rede real à CVM, RPCs de checkpoint e upsert reais,
  `service_role` funcionando com os grants esperados — sem inserir nenhum
  evento, porque o Informe Mensal de julho/2026 não continha, no momento da
  execução, entregas classificáveis como `INFORM MENSAL` ou `INFO TRIM FII`
  para os quatro FIIs do universo fechado. O job é por mês, não por ativo: não
  existe forma de restringir o plano a um único ticker (ex.: só HGRU11) na API
  atual do planner. `OFFICIAL_EVENTS_REAL_UI_MODE` permanece `disabled`; a
  ativação do runtime `read-only` continua exigindo uma autorização separada e
  posterior, agora com um canário real e bem-sucedido como evidência.

## DEC-041 — Runtime de eventos oficiais ativado em `read-only`

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: O usuário autorizou explicitamente a ativação do runtime
  `read-only` ("faça a fase D"), a última etapa de ativação pendente do
  runbook `OFFICIAL_EVENTS_DEPLOYMENT_V1.md` (seção 20), já com o canário de
  `DEC-040` como evidência de que a cadeia de leitura/escrita funciona contra
  produção. Ao investigar a mudança, ficou claro que trocar
  `OFFICIAL_EVENTS_REAL_UI_MODE` de `'disabled'` para `'read-only'` sozinho
  não bastava: `CreateOfficialEventsRuntimeV1Input` é uma union discriminada
  que, em modo `read-only`, exige também um `repository` real e um
  `getAccessState`, nenhum dos dois fornecidos por
  `src/features/official-events/composition.ts`. Além disso,
  `boundary.test.ts` proíbe literalmente as substrings `supabase` (minúsculo),
  `/repository/`, `/storage/`, `/server/`, `/providers/` e `/backfill/` em
  qualquer arquivo sob `src/features/official-events/`, então a fiação real
  com Supabase não podia viver em `composition.ts`.
- Decisão: `composition.ts` passou a aceitar um `OfficialEventsRuntimeV1` já
  construído como parâmetro opcional, retornando um runtime `disabled` padrão
  quando nenhum é passado (preservando o comportamento dos testes existentes
  sem alteração). `OFFICIAL_EVENTS_REAL_UI_MODE` mudou de `'disabled' as const`
  para `: 'disabled' | 'read-only' = 'read-only'` — tipado como union, não
  como literal único, para permitir comparação em runtime. A fiação real
  (criação do cliente Supabase via `createSupabaseBrowserClient` +
  `readCurrentViteSupabaseEnvironment`, e um `getAccessState` que chama
  `client.auth.getSession()`) foi movida para `src/app/AppComposition.tsx`,
  fora da fronteira que `boundary.test.ts` protege. Quando o cliente é `null`
  (modo demo, sem env configurado) ou o modo é `'disabled'`, o runtime
  construído continua `disabled`, preservando o modo demo intacto.
- Consequências: `npm test` (2014 testes, incluindo dois novos casos que
  fixam o comportamento do parâmetro opcional e o valor do flag), `format`,
  `lint` e `build` aprovados. Verificado manualmente num dev server local sem
  Supabase configurado: nenhum erro no console, sidebar sem o item "Eventos
  Oficiais" (modo demo cai para `disabled` como esperado) e a rota direta
  `/eventos-oficiais` mostra corretamente o estado "ainda não foi ativado
  neste ambiente". O caminho `read-only` com sessão autenticada real contra
  produção não foi exercitado manualmente neste ciclo — depende de login real,
  fora do escopo de uma verificação sem tocar dados de produção — mas está
  coberto pelos testes já existentes do runtime e do adapter Supabase
  (`src/application/context/official-events/runtime`), que já validavam esse
  caminho antes desta ativação. O item de navegação "Eventos Oficiais" passa a
  aparecer automaticamente para sessões autenticadas reais, como consequência
  direta da capability do runtime (runbook, seção 21) — não houve mudança
  separada na sidebar. Nenhuma migration, nenhum dado e nenhum SQL foram
  tocados neste ciclo; a mudança é só de composição de dependências no
  frontend.

## DEC-042 — Ativação `read-only` verificada em produção com sessão real

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: `DEC-041` deixou o caminho `read-only` com sessão autenticada real
  como não verificado manualmente. Após o merge das PRs #94, #95 e #96 em
  `main` (commit `5b05e11`) e o deploy automático no Vercel, o usuário
  autenticou-se em `https://papodefuturo.vercel.app` e testou a rota
  `/eventos-oficiais` diretamente.
- Decisão: Confirmado por duas fontes independentes que a ativação funciona
  ponta a ponta em produção: (1) os logs de API do Supabase mostraram, às
  2026-07-28T02:49:30Z, uma chamada real `POST 200` a
  `rpc/list_official_asset_events_v1` a partir de um navegador Chrome real,
  junto de outras leituras normais da sessão autenticada (carteira, câmbio,
  metas), sem nenhum erro; (2) o usuário confirmou visualmente que a página
  carregou vazia e sem erros, e que o item "Eventos Oficiais" aparece na
  sidebar entre Histórico e Estratégia, como o runtime prevê.
- Consequências: A sequência completa de deployment de eventos oficiais —
  schema aplicado, canário real, ativação `read-only`, verificação com sessão
  real — está encerrada e confirmada. Não há uma "Fase E" separada de código:
  a navegação já é consequência da capability, exatamente como o runbook
  desenhou. Próximos passos (backfill gradual com mais providers/meses,
  monitoramento contínuo) exigem autorização própria por ciclo, como já
  registrado em `DEC-040` e `DEC-041`.

## DEC-043 — Roadmap sincronizado; correção factual sobre a Edge Function `refresh-market-data`

- Data: 27 de julho de 2026
- Status: Aceita
- Contexto: Após o merge das PRs #94 a #97, `docs/ROADMAP.md` ainda descrevia
  migrations não aplicadas, runtime `disabled` e 12 itens de fase operacional
  como pendentes — 11 já concluídos. Uma auditoria somente leitura do Supabase
  real, feita para avaliar o próximo ciclo, também encontrou duas afirmações
  erradas em `docs/PROJECT_HANDOFF.md` (seções 13 e 17): que a Edge Function
  `refresh-market-data` não tinha evidência de execução. A consulta encontrou
  45 linhas em `asset_prices` (`source = 'market-provider'`, cobrindo os 12
  ativos do universo fechado, entre `2026-07-13 21:00Z` e
  `2026-07-27 21:00Z`) e 4 em `exchange_rates`, gravadas por
  `Deno/2.1.4 (variant; SupabaseEdgeRuntime/1.74.2)` nos logs de API. A mesma
  auditoria confirmou que `pg_cron` não está instalado
  (`select extname from pg_extension` não retorna `pg_cron` nem `pg_net`), e
  observou o estado geral de dados: `assets` 12, `purchases` 0,
  `fundamental_snapshots` 0, `official_asset_events` 0.
- Decisão: `docs/ROADMAP.md` foi sincronizado — três novas subseções em
  `## Concluído` (CI pgTAP, canário real, ativação `read-only`), `## Próximo`
  reescrito para refletir o que de fato resta (backfill gradual, ingestão de
  fundamentos, agendamento, camadas qualitativas), e `## Fase operacional`
  renomeada para `— concluída` com os 12 itens marcados. As seções históricas
  de `## Concluído` não foram reescritas, preservando registro do estado em
  cada ciclo. `docs/PROJECT_HANDOFF.md` teve as duas afirmações sobre a Edge
  Function corrigidas nas seções 5, 13 e 17, mantendo a cautela legítima sobre
  agendamento ausente e sobre execução futura não comprovável sem verificação
  no momento da leitura.
- Consequências: Documentação alinhada ao estado real. Nenhum código,
  migration, SQL, dado ou runtime foi tocado neste ciclo. Ficam explícitas
  três pendências reais para ciclos futuros, cada uma exigindo autorização
  própria: backfill gradual de eventos oficiais, ingestão real de fundamentos,
  e agendamento automático (`pg_cron`) para `refresh-market-data` e backfill.

## DEC-044 — RPC transacional de upsert para `fundamental_snapshots` aplicada

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: Os três adapters de fundamentos (ações brasileiras, FIIs, ETFs
  internacionais) escreviam direto na tabela via `.upsert()` do client, sem
  camada de validação server-side além das CHECK constraints e do grant de
  `service_role` — assimetria com eventos oficiais, que já usam a RPC
  transacional `upsert_official_asset_events_v1`.
- Decisão: migration `create_fundamental_snapshots_upsert_rpc_v1` aplicada ao
  Supabase real (`vxjrncwfysglinfktifz`), criando
  `upsert_fundamental_snapshots_v1` (`SECURITY DEFINER`, `search_path` fixo,
  lote atômico até 500 registros, `INSERT ... ON CONFLICT DO UPDATE` pela
  identidade lógica de 8 colunas, execute restrito a `service_role`, escrita
  direta na tabela revogada de `service_role`). Antes da aplicação, o
  `apply_migration` criou a função; depois, uma auditoria transacional
  completa (`begin; ... rollback;`, sem deixar linha residual) exercitou
  insert, reinsert idêntico, update por identidade divergente e rejeição de
  record inválido — todos os quatro caminhos se comportaram como esperado, sem
  duplicar linha e sem escrita parcial na rejeição. `get_advisors` (security)
  não mostrou achado novo. `fundamental_snapshots` permanece com 0 linhas após
  a auditoria (`select count(*)` confirmou o rollback). `src/lib/database.types.ts`
  foi regenerado contra o schema aplicado, incluindo a nova função no union de
  `Functions`.
- Consequências: Fundamentos e eventos oficiais agora seguem o mesmo padrão de
  escrita (RPC transacional, sem escrita direta na tabela por nenhum client).
  Os três adapters TypeScript (`src/data/fundamentals/supabase*Snapshots.ts`)
  foram migrados para chamar a RPC via transporte compartilhado
  (`supabaseSnapshotsRpc.ts`), preservando as assinaturas públicas e o
  contrato `upsertMany`. Nenhuma ingestão real foi executada neste ciclo — a
  tabela segue vazia; a decisão sobre o runner de ingestão real de fundamentos
  (item 2 de `docs/ROADMAP.md` § Próximo) é separada e exige autorização
  própria por provider.

## DEC-045 — Atualização documental vira gate obrigatório de conclusão

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: `AGENTS.md` licenciava explicitamente o atraso documental
  ("a documentação pode ficar temporariamente defasada", "deve ser corrigida em
  ciclo apropriado") e o critério de conclusão (seção 17, então 11 itens) e o
  formato do relatório final (seção 20, então 14 itens) não continham nenhum
  gate sobre documentação. `docs/PROJECT_HANDOFF.md` nunca era citado como
  leitura obrigatória. Como consequência, README, o início de
  `docs/ARCHITECTURE.md` e `docs/SUPABASE_SCHEMA_PLAN.md` seguiam descrevendo o
  app como puramente demonstrativo muito depois de Supabase Auth, compras
  reais, Motor V2 e RLS estarem integrados — dívida documental já registrada em
  `docs/PROJECT_HANDOFF.md` seção 2.
- Decisão: `AGENTS.md` seção 2 passa a incluir `docs/PROJECT_HANDOFF.md` na
  leitura obrigatória; as duas frases que licenciavam atraso documental foram
  invertidas; nova seção 2.1 define uma tabela fechada de mapeamento tipo de
  mudança → documento(s) obrigatório(s) (decisão de produto/arquitetura/
  segurança → `CHANGELOG-DECISIONS.md`; feature integrada → `ROADMAP.md` +
  `PRODUCT.md`; migration aplicada em produção → `PROJECT_HANDOFF.md` +
  `SUPABASE_SCHEMA_PLAN.md`; nova rota/fronteira → `ARCHITECTURE.md` +
  `README.md`; runbook executado → runbook + `PROJECT_HANDOFF.md`). A seção 17
  (critério de conclusão) ganhou um item explícito exigindo essa atualização; a
  seção 20 (relatório final) ganhou um item exigindo declarar quais documentos
  foram atualizados, ou por que nenhum se aplicava.
- Consequências: nenhum ciclo futuro pode ser considerado concluído com
  documentação desatualizada em relação ao que ele próprio entregou. A dívida
  documental herdada (README, início de `ARCHITECTURE.md`,
  `SUPABASE_SCHEMA_PLAN.md`) é corrigida nos próximos PRs deste mesmo ciclo
  (Sprint 1, PRs 1.2 e 1.3), não retroativamente por esta decisão. Esta decisão
  não altera nenhuma regra de produto, financeira ou de segurança — é
  exclusivamente processual.

## DEC-046 — Primeiro backfill real de eventos oficiais além do canário

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: item 1 de `docs/ROADMAP.md` § Próximo. Até este ciclo, o único
  backfill real executado era o canário de `DEC-040` (CVM Fund Delivery,
  competência 2026-07, `fetchedEventCount: 0`). O runner gradual
  `scripts/run-official-events-backfill.ts` (PR #99) generaliza esse canário
  para os três providers via CLI, mantendo a mesma disciplina: um job por
  execução, preview sempre primeiro, escrita real só com `--confirm`.
- Decisão: autorizada e executada a sequência de três jobs reais contra
  produção, um por vez, com preview reportado e aprovação explícita antes de
  cada `--confirm`:
  1. `cvm-ipe --year=2026` — **falhou**. O CSV oficial 2026 de IPE da CVM
     contém, na linha 35 (coluna Assunto), uma aspa literal não escapada dentro
     de um campo não cotado (`...Comissão de Valores Mobiliários ("CVM"),
para alienação...`). O parser estrito de
     `src/data/context/official-events/cvm/ipe/csv.ts` rejeita o arquivo
     inteiro nesse caso, por design (fail-closed — nunca faz parsing
     silencioso de dado ambíguo). Resultado: `0` eventos, `failureMode: stop`
     pausou o plano corretamente, nenhuma escrita ocorreu. Não é bug de
     segurança nem corrupção de dado; é o parser reagindo corretamente a um
     defeito de qualidade no dado da própria fonte oficial. A correção do
     parser (tratar aspa solta como caractere literal ou rejeitar somente a
     linha afetada) foi identificada como item separado, fora deste ciclo.
  2. `sec-edgar --from-date=2026-01-01 --to-date=2026-01-31 --window-days=31`
     — `succeeded`, `fetchedEventCount: 0`: nenhum filing qualificável (dos
     seis forms fechados) publicado para VOO, VNQ ou VEA nessa janela civil.
  3. `cvm-fund-delivery --month=2026-06` — `succeeded`,
     `fetchedEventCount: 4`, `persistedAttemptCount: 4`,
     `rejectedItemCount: 0`. Quatro eventos `periodic-report` persistidos, um
     por FII do universo fechado (KNRI11, VISC11, XPLG11, HGRU11),
     correspondentes ao Informe Mensal da competência 2026-06.
- Consequências: `official_asset_events` sai de 0 para 4 linhas — a primeira
  vez que a timeline real deixa de estar vazia. Verificado por consulta
  somente leitura após cada job e `get_advisors`: nenhum advisor de segurança
  novo, apenas os já conhecidos (`rls_enabled_no_policy` informativo nas
  tabelas de checkpoint, e a proteção contra senha vazada desabilitada, que é
  configuração de painel). O provider `cvm-ipe` permanece bloqueado até a
  correção do parser; nenhum evento de ações brasileiras foi backfilled neste
  ciclo. Demais competências de `cvm-fund-delivery` e o backfill de `cvm-ipe`
  seguem como trabalho futuro, cada execução exigindo autorização própria.

## DEC-047 — Correção do parser CVM IPE: aspa solta em campo não cotado

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: `DEC-046` registrou a falha do job `cvm-ipe --year=2026` contra o
  CSV real 2026 da CVM: a linha 35, coluna Assunto, contém uma aspa literal
  não escapada dentro de um campo que não começa com aspas (`...Comissão de
Valores Mobiliários ("CVM"), para alienação...`). O parser estrito de
  `src/data/context/official-events/cvm/ipe/csv.ts` (`parseDelimitedRows`)
  tratava qualquer `"` fora de um campo cotado como erro fatal para o arquivo
  inteiro. Três opções foram avaliadas: (1) tratar a aspa solta como caractere
  literal quando não está no início do campo; (2) rejeitar somente a linha
  afetada, como já ocorre para outras violações de schema via
  `rejectedRows` em `provider.ts`; (3) manter rejeição do arquivo inteiro com
  allowlist de padrões conhecidos.
- Decisão: adotada a opção (1). O parser só entra em modo cotado quando a
  aspa é o primeiro caractere do campo (`atFieldStart`); esse gate já existia
  e não muda. Uma aspa em qualquer outra posição do campo passa a ser
  acrescentada ao valor do campo como caractere literal, em vez de lançar
  `CVM IPE CSV contains a quote inside an unquoted field`. Nenhum outro
  comportamento do parser muda: campos que começam com aspas continuam RFC
  4180 estrito (aspas duplicadas escapam, conteúdo após o fechamento sem
  delimitador continua erro fatal, newlines/CR fora de campo cotado continuam
  rejeitados). O teste `csv.test.ts` que exigia rejeição
  (`rejects quotes inside an unquoted field`) foi substituído por dois testes
  que verificam a aceitação literal, incluindo o padrão exato do CSV real de 2026.
- Consequências: o job `cvm-ipe --year=2026` deixa de falhar por esse motivo
  específico. A mudança amplia o conjunto de entradas aceitas (estritamente
  mais permissiva), mas não introduz ambiguidade de parsing nem novo caminho
  de leitura de delimitador — não há implicação de segurança. Backfill real
  do provider `cvm-ipe` fica novamente pendente de execução (checkpoint da
  tentativa anterior, marcada `completed-with-failures`, precisa ser
  reiniciado manualmente antes do próximo `--confirm`, já que
  `retryFailed: false` e não existe RPC de reset — por design, ver
  `official_event_backfill_runs`/`official_event_backfill_jobs`).

## DEC-048 — Backfill real de `cvm-ipe` concluído; primeiros eventos de ações brasileiras

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: `DEC-047` corrigiu o parser. O checkpoint da tentativa falha de
  `DEC-046` (`planId official-events-backfill:v1:6012929e46851660`, status
  `completed-with-failures`) não tem caminho de retry automático por design
  (`retryFailed: false`, sem RPC de reset), então foi resetado manualmente:
  as linhas desse `plan_id` em `official_event_backfill_jobs` e
  `official_event_backfill_runs` foram apagadas via `execute_sql` (service
  role/postgres), sem tocar `official_asset_events`. Isso permitiu ao runner
  recriar o mesmo plano do zero e reclamar o job novamente.
- Decisão: re-executado `cvm-ipe --year=2026 --confirm` contra produção com o
  parser corrigido. Resultado: `succeeded`, `fetchedEventCount: 298`,
  `persistedAttemptCount: 298`, `rejectedItemCount: 170` (linhas fora do
  universo fechado de ativos ou de tipos de evento não mapeados — rejeição
  esperada por design, não erro). Distribuição persistida por
  `event_type`: `regulatory-filing` 118, `market-communication` 101,
  `shareholder-meeting` 50, `material-fact` 23, `offering-or-issuance` 6.
- Consequências: `official_asset_events` sai de 4 para 302 linhas — primeira
  vez que eventos de ações brasileiras (via `cvm-ipe`) entram na timeline
  real. `get_advisors` (security) verificado após a escrita: nenhum advisor
  novo, apenas os dois já conhecidos (`rls_enabled_no_policy` nas tabelas de
  checkpoint, proteção contra senha vazada desabilitada no painel de Auth).
  Os três providers oficiais (`cvm-ipe`, `cvm-fund-delivery`, `sec-edgar`) já
  têm pelo menos uma execução real bem-sucedida contra produção. Demais
  anos/meses/janelas seguem como trabalho futuro, cada execução exigindo
  autorização própria.

## DEC-049 — Primeira ingestão real de fundamentos; bug de adapter corrigido

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: item 2 de `docs/ROADMAP.md` § Próximo. `fundamental_snapshots`
  permanecia com 0 linhas desde sua criação; o runner
  `scripts/run-fundamentals-ingestion.ts` (PR #107) generaliza os três
  `ingest*.ts` já testados via CLI, mesma disciplina do runner de eventos: um
  provider por execução, preview sempre primeiro, escrita real só com
  `--confirm`.
- Decisão: autorizada e executada a sequência de três providers reais contra
  produção, do menor universo ao maior, com preview reportado e aprovação
  explícita antes do primeiro `--confirm`:
  1. `cvm-fii --year=2026` — **sucesso**. 4 registros extraídos e persistidos,
     um por FII do universo fechado (KNRI11, VISC11, XPLG11, HGRU11).
  2. `sec-nport` — **falhou**. A resposta real da SEC Submissions API para os
     três ETFs contém pelo menos um filing `NPORT-P`/`NPORT-P/A` cujo campo
     `primaryDocument` está vazio ou tem formato inesperado;
     `assertValidFiling` em
     `src/data/fundamentals/sec/nport/submissions.ts:78` rejeita a resposta
     inteira por design (fail-closed). Nenhuma escrita ocorreu. Não é bug de
     segurança; é o parser reagindo a um formato de dado real da SEC não
     coberto pelas fixtures de teste. Correção flagada como item separado
     (fora deste ciclo).
  3. `cvm-stocks --source=DFP --year=2025` — **sucesso após duas correções**:
     - **Não era bug**: `--year=2026` falhava com "No valid CVM filing found"
       para as 5 ações. Diagnóstico confirmou que o arquivo `dfp_cia_aberta_2026.zip`
       da CVM é real mas tem apenas 194 KB (praticamente vazio); o ano no
       nome do arquivo é o **exercício fiscal de referência**, não o ano de
       publicação — para o exercício 2025 (`referenceDate: 2025-12-31`), já
       filed e completo, o arquivo correto é `dfp_cia_aberta_2025.zip`
       (12,7 MB, as 5 empresas confirmadas presentes). Nenhuma mudança de
       código; só ajuste do argumento `--year`.
     - **Bug real corrigido**: com `--year=2025`, a RPC
       `upsert_fundamental_snapshots_v1` (aplicada hoje mais cedo em
       `DEC-044`) rejeitou o lote com `"fundamental snapshot record has
invalid fields"`. A RPC exige exatamente as 24 colunas canônicas de
       `fundamental_snapshots` em toda linha (mesmo com valor `null`), mas
       `toInsertRow` em `src/data/fundamentals/supabaseFundamentalSnapshots.ts`
       (adapter de ações) omitia as 4 colunas específicas de FII
       (`net_asset_value_minor`, `issued_shares_unscaled`,
       `issued_shares_scale`, `shareholder_count`) — os adapters de FII e de
       ETF internacional já enviavam as 24 colunas corretamente desde o PR
       #100; só o de ações ficou incompleto. Como a validação por objeto
       usa `TablesInsert<'fundamental_snapshots'>` (colunas opcionais no tipo
       gerado), o TypeScript não acusava a omissão. Corrigido adicionando as
       4 colunas como `null` explícito; teste existente
       (`"sends an idempotent bulk upsert RPC with the complete row shape"`)
       foi fortalecido de `objectContaining` (verificava só 2 campos, apesar
       do nome) para `toEqual` do objeto completo, mais um novo teste que
       verifica exatamente as 24 chaves. Depois da correção: 5 registros
       extraídos e persistidos, um por ação (BBAS3, ITSA4, PSSA3, TAEE11,
       WEGE3).
- Consequências: `fundamental_snapshots` sai de 0 para 9 linhas — a primeira
  vez que a tabela deixa de estar vazia. Verificado por consulta somente
  leitura após cada job e `get_advisors`: nenhum achado novo de segurança. O
  bug do adapter de ações era **latente desde `DEC-044`** (aplicado no mesmo
  dia) e só foi descoberto porque esta foi a primeira execução real da RPC
  com dado de ações — nenhum dos 2050 testes Vitest o alcançava, porque
  nenhum deles roda a RPC real contra Postgres (mesma lição estrutural já
  registrada para eventos oficiais em `docs/PROJECT_HANDOFF.md` seção 8).
  `sec-nport` permanece bloqueado até a correção do parser; nenhum evento de
  ETFs internacionais foi ingerido neste ciclo.

## DEC-050 — Runtime opcional e apresentação de fundamentos V1

- Data: 28 de julho de 2026
- Status: Aceita
- Contexto: `FundamentalFactsV1` e `FundamentalDerivedFactsV1` são contratos
  puros e determinísticos sem nenhum consumidor de UI ou runtime, apesar de
  `fundamental_snapshots` já ter dados reais desde `DEC-049`. O runtime
  opcional de eventos oficiais (`src/application/context/official-events/runtime`)
  e sua apresentação (`src/features/official-events`) já são um padrão
  auditado, testado e validado em produção (`DEC-041`, `DEC-042`).
- Decisão: espelhar fielmente o mesmo padrão para fundamentos.
  `src/application/context/fundamentals/runtime`: modos explícitos
  `disabled`/`read-only`, leitura condicionada a autenticação via
  `getAccessState()` injetado, falha isolada nunca lançada ao chamador,
  relógio injetado e monotônico, teste de fronteira idêntico (scan estático
  via `import.meta.glob`). Única operação `getDossier()` — mais simples que o
  runtime de eventos porque o universo fechado é pequeno (12 ativos) e não
  precisa de paginação, cursor ou filtros; lê o catálogo de assets já
  materializado (sem escrita) mais as três repositories de leitura de
  fundamentos, monta `FundamentalFactsV1` e deriva `FundamentalDerivedFactsV1`.
  `src/features/fundamentals`: apresentação autenticada consumindo
  exclusivamente o runtime (sem acesso a repository, adapter ou Supabase),
  cards por ativo com fatos e razões derivadas com proveniência, sem score,
  ranking ou recomendação. Rota `/fundamentos` sempre montada (protegida,
  informa o estado sem chamar Supabase quando `disabled`). `Sidebar` e
  `getNavigationItems` (`src/lib/navigation.ts`) passaram a aceitar dois
  modos de capability independentes (eventos oficiais e fundamentos), com o
  segundo parâmetro opcional preservando as chamadas de um argumento
  existentes.
- Consequências: `FUNDAMENTALS_REAL_UI_MODE`
  (`src/features/fundamentals/composition.ts`) permanece `disabled` — a
  ativação em produção é uma decisão separada e posterior, como foi para
  eventos oficiais em `DEC-041`. Verificado manualmente no app real em modo
  demo: rota direta sem erro no console, sidebar sem o item (ambos os modos
  opcionais desabilitados sem Supabase configurado), nenhuma regressão nos
  fluxos existentes. Diferença documentada do runtime de eventos: as três
  repositories de leitura de fundamentos lançam `Error`/`RangeError` simples
  sem preservar o código Postgrest original, então a classificação de erro é
  mais simples — não distingue `schema-unavailable` de
  `repository-unavailable`. 125 arquivos de teste, 2086 testes.

## DEC-051 — Correção completa do provider SEC N-PORT; primeira ingestão real de ETFs internacionais

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: `DEC-049` deixou `sec-nport` bloqueado por um erro de validação de
  `primaryDocument`. Corrigido isoladamente no PR #112 (validador único
  `isSafeSecPrimaryDocumentPath`), a reexecução real revelou que o provider
  nunca havia sido validado contra um download real da SEC: mais dois bugs
  reais e independentes surgiram em sequência, cada um só visível depois do
  anterior ser corrigido.
- Decisão: corrigir os dois bugs adicionais, cada um confirmado por
  diagnóstico contra dado real antes da correção:
  1. **URL errada para o XML estruturado.** `primaryDocument` da Submissions
     API (ex.: `xslFormNPORT-P_X01/primary_doc.xml`) aponta para o
     visualizador HTML com XSLT aplicado (`<!DOCTYPE html>` real, confirmado
     por download), não para o XML bruto. O documento estruturado
     (`<?xml ...?><edgarSubmission ...>`) fica na raiz da pasta da accession,
     sob o nome do último segmento do caminho. Nova função
     `extractSecPrimaryDocumentFileName` (`src/data/fundamentals/sec/nport/path.ts`)
     extrai o nome de arquivo correto; usada tanto para montar a URL de
     download (`buildSecPrimaryDocumentUrl`) quanto para validar a
     proveniência persistida (`assertOfficialDocumentUrl`, storage de ETFs).
  2. **Caminho XML incorreto para `seriesId`/`classId` do cabeçalho.** O
     código esperava `filerInfo/filer/seriesClassInfo/...`
     (`seriesClassInfo` aninhado dentro de `filer`); o XML real tem
     `seriesClassInfo` como irmão de `filer`, ambos filhos diretos de
     `filerInfo`. Corrigido em `SEC_NPORT_XML_PATHS` (`xml.ts`).
  3. **`seriesName` divergente por maiúsculas/minúsculas.** A SEC publica
     `regName`/`seriesName` em maiúsculas no XML real (ex.:
     `"VANGUARD 500 INDEX FUND"`); `SEC_INTERNATIONAL_ETFS`
     (`src/data/fundamentals/sec/nport/etfs.ts`) usava capitalização estilo
     título (`"Vanguard 500 Index Fund"`), reprovando a checagem estrita de
     identidade oficial (`assertProvenanceCoherence`) para os três ETFs.
     Corrigido para o texto verbatim da SEC, com comentário explícito contra
     "arrumar" a capitalização de novo.
     Nenhum dos três bugs era visível nos 2099 testes Vitest porque as fixtures
     (`AUDITED_FILINGS`, `createMinimalNportXml`, `SEC_INTERNATIONAL_ETFS`) foram
     construídas por suposição sobre o formato da SEC, não a partir de um
     payload real — terceira ocorrência da mesma lição estrutural desta semana
     (CVM IPE em `DEC-047`, adapter de fundamentos em `DEC-049`). Todas as
     fixtures foram corrigidas para os valores reais confirmados.
- Consequências: `sec-nport --confirm` executado com sucesso — 3 registros
  extraídos e persistidos (VOO, VNQ, VEA). `fundamental_snapshots` chega a 12
  linhas, cobrindo pela primeira vez as três categorias do universo fechado
  (5 ações, 4 FIIs, 3 ETFs internacionais). Confirmado por consulta somente
  leitura e `get_advisors`: nenhum achado novo de segurança. Item de ROADMAP
  do Sprint 3/`DEC-049` fica totalmente concluído. 126 arquivos de teste,
  2099 testes.

## DEC-052 — Dados de mercado passam a ser globais; tabelas aplicadas

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: item 3 de `docs/ROADMAP.md` § Próximo. `refresh-market-data` exige
  header `Authorization`, cria o client com a chave anônima mais o JWT do
  usuário e chama `auth.getUser()` — todo acesso a banco roda sob RLS do
  usuário, e `asset_prices`/`exchange_rates` são tabelas por usuário
  (`user_id` obrigatório, FK para `auth.users`). Um agendamento `pg_cron` não
  tem usuário autenticado: chamar a função sob `service_role` falha em
  `getUser()`, e mesmo contornando isso não há `user_id` de sessão para
  gravar. A auditoria de `DEC-043` já havia constatado o efeito colateral
  desse desenho: cada usuário que autentica grava sua própria cópia das
  mesmas cotações públicas.
- Decisão: dados de mercado (preços e câmbio) passam a ser **globais**, no
  mesmo padrão já usado por `fundamental_snapshots` e
  `official_asset_events` — sem `user_id`, identidade por `ticker` (não FK
  para `assets`, que é por usuário), leitura `authenticated` via RLS
  (`using (true)`), escrita exclusiva de `service_role` via RPC transacional.
  Duas tabelas novas e independentes aplicadas ao Supabase real:
  - `market_asset_prices` — identidade `(ticker, source, priced_at)`, RPC
    `upsert_market_asset_prices_v1`, lote de até 100 registros.
  - `market_exchange_rates` — identidade
    `(base_currency, quote_currency, source, priced_at)`, RPC
    `upsert_market_exchange_rates_v1`, mesmo limite de lote.
    Ambas as RPCs seguem a lição estrutural dos bugs reais de
    `upsert_official_asset_events_v1` (`docs/PROJECT_HANDOFF.md` seção 8): toda
    variável PL/pgSQL usa prefixo `v_`, `COALESCE` nunca é qualificado por
    schema. Auditadas transacionalmente (`begin; … rollback;`) contra o
    Supabase real: inserção, reinserção idêntica (idempotente) e atualização
    por conflito de identidade confirmadas para as duas tabelas, sem resíduo;
    rejeição de shape inválido confirmada. `get_advisors` não mostrou achado
    novo. `src/lib/database.types.ts` regenerado.
  - **Consequência de produto explícita**: a edição manual de câmbio
    USD/BRL (`saveManualUsdBrl`, hoje exposta nas telas Dashboard, Carteira,
    Estratégia e Novo Aporte) será removida quando o consumo migrar para a
    fonte global (próximo ciclo deste sprint) — câmbio global não tem dono
    individual para sobrescrever, e o valor automático via
    `refresh-market-data` já roda de verdade (`DEC-043`).
  - As tabelas antigas por usuário (`asset_prices`, `exchange_rates`)
    permanecem **intocadas e em uso** até um ciclo futuro confirmar que nada
    mais depende delas; não fazem parte desta migration e não foram
    alteradas.
- Consequências: schema aplicado, sem dado real ainda (0 linhas nas duas
  tabelas novas). A migração do consumo (`MarketDataRepository`, os quatro
  hooks, a Edge Function `refresh-market-data` para um caminho
  `service_role`) e o agendamento `pg_cron`/`pg_net` ficam para os próximos
  PRs deste mesmo Sprint 5, cada aplicação real com autorização própria.

## DEC-053 — Cutover completo do consumo para dados de mercado globais; remoção da edição manual de câmbio

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: sequência de `DEC-052` (PR 5.1, tabelas globais aplicadas). Faltava
  migrar quem lê e escreve esses dados: a Edge Function `refresh-market-data`
  ainda rodava sob a sessão do usuário chamador (`SUPABASE_ANON_KEY` + JWT),
  e o app ainda lia/escrevia nas tabelas antigas por usuário (`asset_prices`,
  `exchange_rates`), incluindo a edição manual de câmbio USD/BRL exposta em
  quatro telas.
- Decisão, parte 1 (Edge Function, PR #115): `refresh-market-data` passa a
  ler `market_asset_prices`/`market_exchange_rates` e a escrever
  exclusivamente via `upsert_market_asset_prices_v1`/
  `upsert_market_exchange_rates_v1`, usando um client próprio construído com
  `SUPABASE_SERVICE_ROLE_KEY` (nunca a sessão encaminhada pelo chamador). A
  função aceita duas formas de chamada: sessão de usuário autenticado real
  (gate já existente) ou chamador de confiança server-side
  (`Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`), preparando o caminho
  para o agendamento `pg_cron`/`pg_net` do próximo PR. O universo fechado de
  ativos (`SERVER_CLOSED_ASSET_UNIVERSE`) passou a ser a fonte direta da
  iteração, em vez de cruzar com a tabela `assets` de um usuário específico.
  Verificado em produção: deploy real (versão 7, ativa), disparo real via
  `service_role`, 12 preços e 1 câmbio persistidos em
  `market_asset_prices`/`market_exchange_rates` (confirmado por consulta
  somente leitura), execuções subsequentes reconhecendo corretamente
  freshness (skip/stale), `get_advisors` sem achado novo.
- Decisão, parte 2 (app, PR 5.2 conclusão): `AssetPriceRepository.list` passa
  a receber a lista de `Asset[]` já carregada e resolve `ticker` → `Asset.id`
  localmente (a tabela global não tem `asset_id`); `ExchangeRateRepository`
  passa a ler `market_exchange_rates` diretamente. Os quatro hooks
  (`useDashboardData`, `usePortfolioData`, `useStrategyData`,
  `useContributionData`) passam `assets` para `assetPrices.list`, sem
  qualquer outra mudança de lógica.
  - **Edição manual de câmbio removida por completo**: `saveManualUsdBrl`
    (contrato, repository e os quatro hooks) e o componente
    `ExchangeRateSetup` foram apagados; os cinco pontos de uso (Dashboard,
    Carteira, Estratégia, Novo Aporte, `ContributionPurchaseConfirmation`)
    passam a exibir uma mensagem informativa de espera pela próxima
    atualização automática, sem formulário de entrada — câmbio global não
    tem dono individual para sobrescrever, e a atualização automática via
    `refresh-market-data` já roda de verdade (`DEC-043`, confirmado nesta
    mesma decisão).
  - Mapeadores reescritos: `mapMarketAssetPriceRow` (substitui
    `mapAssetPriceRow`) e `mapExchangeRateRow` (agora contra
    `Tables<'market_exchange_rates'>` gerado, não mais um schema paralelo
    escrito à mão). O arquivo `exchangeRateSchema.ts` foi substituído por
    `rpcSchema.ts`, genérico, usado apenas para tipar a RPC
    `replace_allocation_targets` de metas de alocação (não relacionado a
    câmbio).
  - As tabelas antigas por usuário (`asset_prices`, `exchange_rates`)
    permanecem intocadas no schema; nenhum código do app ainda as lê ou
    escreve.
- Consequências: `npm test` (128 arquivos, 2119 testes), lint, build e
  `git diff --check` limpos. Verificação de UI feita em modo demo (sem
  crash, sem erro de console); o caminho autenticado real é coberto pelos
  testes unitários dos quatro hooks. Resta apenas o agendamento
  `pg_cron`/`pg_net` (PR 5.3) para fechar o Sprint 5.

## DEC-054 — Agendamento automático de refresh-market-data via pg_cron/pg_net

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: último item pendente do Sprint 5. `DEC-052`/`DEC-053` resolveram o
  pré-requisito (dados de mercado globais, Edge Function aceitando
  `service_role` como chamador de confiança sem sessão de usuário); faltava
  só o agendamento em si — hoje o refresh só roda por disparo direto
  (script ou usuário autenticado), nunca sozinho.
- Decisão: migration nova (`20260729120000_schedule_refresh_market_data_cron.sql`)
  habilita `pg_net` e `pg_cron` e agenda o job `refresh-market-data-hourly`
  (`0 * * * *`, a cada hora), alinhado com a janela de freshness de 60
  minutos já usada pelo core da função (`MARKET_DATA_FRESHNESS_MS`). O job
  chama a Edge Function via `net.http_post`, autenticado como
  `service_role`.
  - **O valor do `service_role` key nunca entra na migration versionada.**
    O job lê o segredo em tempo de execução via Supabase Vault
    (`vault.decrypted_secrets`), referenciado só pelo nome
    `refresh_market_data_service_role_key`. O segredo em si foi inserido por
    uma ação operacional separada (`vault.create_secret`, fora do controle
    de versão), executada uma única vez em produção com autorização
    explícita, antes do primeiro disparo agendado.
  - Teste de forma estática (`scheduleRefreshMarketDataCronMigration.test.ts`)
    confirma que a migration nunca contém o segredo literal e sempre lê via
    Vault por nome.
- Consequências: com este PR, o Sprint 5 está completo — dados de mercado
  globais aplicados (`DEC-052`), consumo migrado por completo em ambos os
  lados, Edge Function e app (`DEC-053`), agendamento automático ativo
  (`DEC-054`). A partir do próximo disparo de hora cheia, `market_asset_prices`/
  `market_exchange_rates` se atualizam sozinhas, sem depender de nenhum
  usuário autenticar.
  - Verificado em produção: migration aplicada, segredo inserido no Vault
    via `vault.create_secret` (ação operacional avulsa, fora de qualquer
    migration versionada), job confirmado em `cron.job` (`active = true`,
    `schedule = '0 * * * *'`). `get_advisors` mostrou um achado novo, WARN
    `extension_in_public` para `pg_net`: a extensão é **não relocável**
    (`alter extension pg_net set schema extensions` falha com
    `does not support SET SCHEMA`), suas funções reais (`net.http_post`)
    já vivem no schema `net`, dedicado e não exposto via `public` — o
    achado é metadado cosmético do `pg_extension`, sem consequência de
    segurança, e fica **aceito e documentado**, no mesmo padrão do WARN já
    conhecido de `auth_leaked_password_protection` (ação de painel, não de
    código).

## DEC-055 — Persistência do plano de aporte; reverte o adiamento de `ContributionPlan`

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: `ContributionPlan`/`ContributionPlanItem` existiam apenas no
  domínio desde o início do projeto; a persistência foi deliberadamente
  adiada (`AGENTS.md` seção 14, decisão original preservada no histórico)
  até existir o fluxo real de apresentação, aceite, rejeição e confirmação.
  Esse fluxo agora existe: o Novo Aporte autenticado já consome carteira,
  cotações, metas e câmbio reais (Sprints anteriores), e o motor
  determinístico já produz resultados técnicos reais. Zero blast radius no
  código de aplicação antes desta decisão — nenhum hook, componente ou
  repository referenciava os dois símbolos.
- Decisão: `contribution_plans` e `contribution_plan_items` aplicadas como
  tabelas **por usuário** — `user_id` da sessão, RLS com
  `(select auth.uid())`, ownership validado nas relações de insert/update,
  mesmo padrão de `purchases`/`allocation_targets` (sem RPC; escrita direta
  via client autenticado, como as demais tabelas por usuário desta
  categoria).
  - `contribution_plans`: `input_amount_minor`, `currency`, `status`
    (`draft`, `presented`, `accepted`, `rejected`, `confirmed` — o domínio
    ganhou o status `confirmed`, que não existia antes), trigger
    `set_updated_at`.
  - `contribution_plan_items`: `contribution_plan_id` (FK cascade),
    `asset_id` (FK restrict), `planned_amount_minor`, `currency`,
    `purchase_id` (FK nullable, `on delete set null`) — resolve
    `ContributionPlanItem.plannedPurchase`, o campo que motivava
    explicitamente o adiamento original. Unicidade por
    `(contribution_plan_id, asset_id)`: um item por ativo por plano.
  - Fluxo real implementado: simular aporte com sugestões positivas persiste
    um plano `presented`; o usuário aceita ou rejeita explicitamente
    (`ContributionResult` ganha os botões "Aceitar plano"/"Rejeitar plano");
    somente um plano `accepted` libera "Confirmar compras realizadas"; ao
    registrar as compras, cada `Purchase` criada é ligada ao
    `ContributionPlanItem` do mesmo ativo via `linkItemPurchase`, e o plano
    vai para `confirmed`. O motor determinístico não muda: continua sem
    executar ordens e sem persistir plano automaticamente — cada transição
    de status é ato explícito do usuário (`AGENTS.md` seção 14 atualizada
    para refletir isso, mantendo a restrição contra persistência automática
    do motor).
  - Repository novo (`ContributionPlanRepository`): `list`, `create`,
    `updateStatus`, `linkItemPurchase`. Mapeadores em
    `contributionPlanMapper.ts` resolvem `plannedPurchase` via um
    `ReadonlyMap<EntityId, Purchase>` passado pelo chamador — mesmo padrão
    de resolução por mapa já usado para `ticker → Asset.id` em `DEC-053`.
  - Lógica de construção do input do plano e de vínculo compra-item extraída
    em funções puras exportadas (`buildContributionPlanCreateInput`,
    `matchRegisteredPurchasesToPlanItems`) para cobertura de teste direta,
    já que a Vitest não tem um padrão de `renderHook` neste projeto.
- Verificado em produção: migration aplicada; auditoria transacional
  (`begin; … rollback;`) confirmou insert de plano e item, transições de
  status `draft → presented → accepted`, rejeição do `check` de status
  inválido, unicidade `(contribution_plan_id, asset_id)` rejeitando
  duplicata, `on delete restrict` em `asset_id`, `on delete set null` em
  `purchase_id` (apagar a compra zera o link sem afetar o plano), `on delete
cascade` do plano para seus itens — tudo sem resíduo real. `get_advisors`
  sem achado novo. `src/lib/database.types.ts` regenerado.
- Consequências: `npm test`, `format:check`, `lint`, `build` e
  `git diff --check` limpos. Sanidade em browser (modo demo, sem crash —
  demo nunca exercita o novo caminho). Docs atualizados: `AGENTS.md` seção
  14, `docs/PRODUCT.md` (fluxo de aporte deixa de ser "funcionamento
  futuro"), `docs/ARCHITECTURE.md`, `docs/SUPABASE_SCHEMA_PLAN.md`
  (`contribution_plans`/`contribution_plan_items` deixam de ser "planejada e
  adiada"), `docs/ROADMAP.md`.

## DEC-056 — IA explicativa consumindo o Dossiê Técnico; primeiro envio de dados a serviço externo

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: `TechnicalDossierV1` existe desde um ciclo anterior — contrato
  puro, determinístico, versionado, derivado em memória a partir de
  `PortfolioSnapshot`, estratégia, fatos de mercado e
  `TargetAllocationContributionResult` — mas nunca teve consumidor (zero
  referências fora de `src/domain/technicalDossier/`). `AGENTS.md`
  (subseção "Dossiê Técnico V1") registrava explicitamente: "não persistir o
  dossiê nem enviá-lo a IA ou serviço externo sem nova decisão arquitetural
  explícita." Esta é essa decisão. Contrato de produto inegociável
  (`docs/PRODUCT.md`, então "§Papel futuro da IA"): a IA nunca cria,
  seleciona ou modifica o plano técnico — só pode interpretá-lo.
- Decisão: nova Edge Function `explain-contribution-plan`
  (`supabase/functions/explain-contribution-plan/`), autenticada por sessão
  de usuário real (sem caminho `service_role`/agendado — o dossiê pertence a
  uma simulação pontual do usuário que a solicitou). Recebe
  `{ dossier: TechnicalDossierV1 }`, valida a forma do dossiê
  estruturalmente antes de qualquer chamada externa
  (`dossierValidator.ts`), monta um prompt determinístico
  (`promptBuilder.ts`) com um system prompt que reafirma as regras
  inegociáveis do produto (nunca cria/seleciona/modifica o plano, nunca
  recomenda ativo fora do dossiê, nunca inventa números, sempre responde em
  JSON estrito), chama o OpenRouter (`OPENROUTER_API_KEY`, secret exclusivo
  do ambiente da função, nunca `VITE_*`, roteando para
  `anthropic/claude-sonnet-4.5` via endpoint OpenAI-compatible) e valida a
  resposta contra o
  contrato de saída (`responseSchema.ts`) antes de devolvê-la — uma resposta
  fora do formato é rejeitada, nunca repassada como está.
  - Contrato de saída novo, `AiExplanationV1` (`ai-explanation.v1`,
    `src/domain/aiExplanation/`): `facts: string[]`, `interpretation`,
    `convictionLevel: 'low' | 'medium' | 'high'`, `technicalPlanSummary`,
    `comparativeExplanation` — exatamente os cinco itens da "saída prevista"
    já documentada em `docs/PRODUCT.md`.
  - Lado app: `AiExplanationRepository` (`src/data/repositories/contracts.ts`)
    chama a Edge Function via `client.functions.invoke`, com o mesmo padrão
    de validação em runtime de `parseMarketDataRefreshResult` (`DEC-*`
    anteriores). `explainContributionPlanBestEffort`
    (`src/data/aiExplanationBestEffort.ts`) degrada qualquer falha (rede,
    chave ausente, resposta malformada) para `null`, nunca para exceção —
    mesmo padrão de `refreshMarketDataBestEffort`. **A falha da IA nunca
    bloqueia o plano determinístico.**
  - `useContributionData` ganhou os estados necessários para montar o
    dossiê (`portfolioSnapshot` via `buildPortfolioSnapshot`, já existente
    mas não usado neste hook; `strategyCategories`, o `StrategyCategory[]`
    bruto que `buildContributionTargets` já calculava mas não expunha;
    `assetPrices`/`exchangeRates` brutos) e a ação `explainContributionPlan`,
    que monta o dossiê e chama o repository best-effort.
  - UI: ao simular um aporte com estratégia `target-allocation` e sugestões
    positivas, o Novo Aporte dispara a explicação em paralelo à apresentação
    do plano (`ContributionPlan` status `presented`, `DEC-055`); o
    componente `AiExplanation` só renderiza quando há explicação disponível
    — nenhuma UI de carregamento bloqueante, nenhum erro visível ao usuário
    quando a IA falha.
- Verificado: `npm test` (cobertura nova para `dossierValidator`,
  `promptBuilder`, `responseSchema`, `openRouterClient` com fetch mockado, e
  `explainContributionPlanBestEffort`), `format:check`,
  `lint`, `build` e `git diff --check` limpos. Sanidade em browser (modo
  demo, sem crash — demo nunca exercita o novo caminho).
  - **Verificado em produção, 29 de julho de 2026**: autorização explícita
    do usuário para enviar dados a serviço externo obtida em chat
    (`AGENTS.md`). Deploy real da Edge Function (versão 3, `ACTIVE`),
    `OPENROUTER_API_KEY` configurado como secret da função (via dashboard —
    não há ferramenta de MCP para secrets de Edge Function, diferente de
    Vault). Disparo real com sessão autenticada de usuário real (magic link
    gerado via admin API, verificado, nunca enviado por e-mail) e um dossiê
    de exemplo: resposta `200`, `AiExplanationV1` completo e validado
    (`facts`, `interpretation`, `convictionLevel: "high"`,
    `technicalPlanSummary`, `comparativeExplanation`), gerado de fato pelo
    `anthropic/claude-sonnet-4.5` via OpenRouter. `get_advisors` sem achado
    novo.
- Consequências: primeira integração de IA do projeto. O dossiê nunca é
  persistido — só a explicação passa a existir, e apenas em memória do
  componente React, descartada ao simular de novo. Nenhum dado sai do
  navegador além do dossiê já calculado (nenhuma consulta adicional a
  Supabase, mercado ou fundamentos a partir da Edge Function). Docs
  atualizados: `AGENTS.md` (subseção "Dossiê Técnico V1" cross-referenciada
  - nova subseção "IA explicativa"), `docs/PRODUCT.md` ("Papel futuro da
    IA" vira "Papel da IA"), `docs/ARCHITECTURE.md` (nova fronteira),
    `docs/PROJECT_HANDOFF.md`, `docs/ROADMAP.md`, `README.md`.

## DEC-057 — Encerramento do plano de 8 sprints

- Data: 29 de julho de 2026
- Status: Aceita
- Contexto: plano de 8 sprints aprovado em 28 de julho de 2026 para levar o
  Papo de Futuro do estado pós-eventos-oficiais até o cumprimento completo
  de `docs/PRODUCT.md`. Os 8 sprints estão completos e mergeados: (1) gate
  documental; (2) backfill real de eventos oficiais; (3) ingestão real de
  fundamentos; (4) fundamentos no runtime e na interface; (5) preços/câmbio
  globais e agendamento automático (`DEC-052`–`DEC-054`); (6) persistência
  do plano de aporte (`DEC-055`); (7) IA explicativa (`DEC-056`); (8)
  auditoria e polimento final (este ciclo).
- Decisão: registrar o encerramento do plano de sprints como marco — não
  significa fim do projeto, significa que o backlog explicitamente
  planejado em 28 de julho está integralmente aplicado em produção e
  verificado. Trabalho futuro (backfill amplo dos providers ainda não
  exercitados, ativação `read-only` de fundamentos em produção, notícias
  editoriais, camadas qualitativas adicionais) segue registrado em
  `docs/ROADMAP.md` § Próximo como itens abertos, não como um novo plano de
  sprints numerado.
  - Sprint 8 (PR 8.1–8.4): code-splitting por rota eliminou o aviso de
    bundle >500 kB (maior chunk 232 kB); `rls_user_isolation.test.sql`
    ampliado de 43 para 58 asserções, cobrindo `contribution_plans`/
    `contribution_plan_items` e o padrão RPC-only de
    `market_asset_prices`/`market_exchange_rates`; `get_advisors`
    security/performance auditado, sem achado corrigível novo; varredura de
    secrets no código versionado, limpa; `docs/PROJECT_HANDOFF.md` §17 e
    trechos remanescentes de `docs/ARCHITECTURE.md`/`docs/PRODUCT.md` que
    ainda descreviam o projeto pré-persistência corrigidos para o estado
    real.
- Consequências: `auth_leaked_password_protection` permanece desabilitado —
  é configuração de painel do Supabase Auth, não alterável por ciclo de
  código; fica registrado aqui como ação manual pendente do usuário
  (Authentication → Policies → Enable leaked password protection). `pg_net`
  em schema `public` permanece um achado aceito (extensão não relocável,
  `DEC-054`). Nenhum dado real foi apagado ou alterado neste ciclo — Sprint
  8 é auditoria e polimento, não migração de schema.

## DEC-058 — Expansão de backfill de eventos oficiais (2026 completo + 2025) e limite estrutural do SEC EDGAR

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: com o plano de 8 sprints encerrado (`DEC-057`), o item 1 de
  `docs/ROADMAP.md` § Próximo continuava aberto — cada provider de eventos
  oficiais só tinha uma execução real (CVM IPE ano 2026; CVM Fund Delivery
  competência 2026-06; SEC EDGAR janela 2026-01). Usuário autorizou
  expandir o escopo para "2026 completo + 2025" nos três providers, um job
  por execução, runbook seção 18.
- Decisão:
  - CVM IPE: `--year=2025` executado com sucesso.
    `fetchedEventCount: 500`, `persistedAttemptCount: 500`,
    `rejectedItemCount: 288` (o provider retorna no máximo 500 itens por
    execução; rejeições seguem o padrão já auditado em `DEC-048`).
  - CVM Fund Delivery: 6 meses restantes de 2026 (01, 02, 03, 04, 05, 07 —
    06 já coberto por `DEC-046`) e os 12 meses de 2025 executados com
    sucesso, todos `executorStatus: succeeded`, sem falha nem conflito.
  - SEC EDGAR: janela 2026-01 já coberta (`DEC-046`). Executadas
    2026-02 a 2026-07 e uma janela de teste em 2025-12. Apenas 2026-01 e
    2026-07 tiveram sucesso (`fetchedEventCount: 0` em ambos); as demais
    (2026-02 a 2026-06, e 2025-12) falharam com `provider-failed`.
  - Causa raiz identificada em código, não em dado: o provider SEC EDGAR
    (`src/data/context/official-events/sec/edgar/provider.ts`,
    `assertRecentSubmissionsCoverRequestedRange`) só lê `filings.recent` da
    API de submissions. Quando a janela pedida se sobrepõe a um
    `historicalFiles` (índice paginado antigo, fora de `filings.recent`),
    ele recusa por design fail-closed — comportamento já documentado como
    limitação da versão atual (`docs/ROADMAP.md`, item "Provider SEC EDGAR
    V1": "somente `filings.recent`; histórico necessário em `filings.files`
    interrompe o lote"). Não é bug nem dado malformado; é escopo não
    implementado. Nenhuma escrita ocorreu nos jobs que falharam.
  - Usuário optou por aceitar o limite atual em vez de abrir um novo épico
    de suporte a `filings.files` agora. Fica registrado como item aberto em
    `docs/ROADMAP.md` § Próximo.
  - `get_advisors` (security e performance) auditado após todos os jobs:
    sem achado corrigível novo, mesmo padrão de `unused_index` esperado e
    `auth_leaked_password_protection` já conhecido.
- Consequências: `official_asset_events` foi de 302 para 902 linhas. Os
  três providers seguem com pelo menos uma execução real bem-sucedida;
  CVM IPE e CVM Fund Delivery agora cobrem 2025–2026 por completo, SEC
  EDGAR cobre apenas as duas janelas dentro do alcance de `filings.recent`
  no momento da execução. Ampliar a cobertura do SEC EDGAR além disso exige
  trabalho de desenvolvimento novo (suporte a `filings.files`), não apenas
  mais execuções do runner.

## DEC-059 — Expansão de ingestão de fundamentos para 2025 e dois bugs reais de dado corrigidos

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: item 2 de `docs/ROADMAP.md` § Próximo. Antes deste ciclo,
  `fundamental_snapshots` tinha 12 linhas: `cvm-fii` só cobria o ano 2026,
  `cvm-stocks` só cobria `DFP` (anual) 2025, e `ITR` (trimestral) nunca havia
  sido exercitado contra dado real. Usuário autorizou ampliar para
  `cvm-fii --year=2025` e `cvm-stocks --source=ITR --year=2025`.
- Decisão:
  - `cvm-fii --year=2025` falhou na primeira tentativa: a CVM registra
    XPLG11 na competência de dezembro/2025 como `"FII XP LOG"`, divergindo
    da denominação oficial canônica `"XP LOG FII RL"` (mesmo CNPJ e ISIN).
    O provider (`src/data/fundamentals/cvm/fii/provider.ts`) e o storage
    Supabase (`src/data/fundamentals/supabaseRealEstateFundSnapshots.ts`,
    dois pontos de revalidação independente por defesa em profundidade)
    comparavam o nome oficial por igualdade exata e rejeitavam por design
    fail-closed. Corrigido com um allowlist fechado de aliases por ticker
    (`src/data/fundamentals/cvm/fii/officialNames.ts`), no mesmo padrão já
    usado pelo provider CVM IPE de eventos oficiais
    (`companyNames.ts`/`matchCvmIpeCompanyNameAlias`). Sem fuzzy matching,
    sem alterar a identidade canônica do fundo. Reexecutado com sucesso: 4
    registros (um por FII).
  - `cvm-stocks --source=ITR --year=2025` falhou com
    `"Ambiguous netIncome: 2 candidates found"` para todas as ações. Causa
    raiz: a CVM publica, para a mesma data de fechamento do ITR, duas
    linhas DRE com a mesma conta (`3.11`, `ORDEM_EXERC=ÚLTIMO`) — o
    trimestre isolado (ex.: jul-set) e o acumulado do ano até ali (ex.:
    jan-set) — diferindo apenas por `DT_INI_EXERC`, dimensão que
    `selectFact` não considerava. Nenhuma escrita ocorreu na tentativa que
    falhou.
  - Decisão de produto sobre a ambiguidade: `netIncome` trimestral do ITR
    passa a significar o trimestre isolado, no mesmo espírito de
    granularidade que o DFP anual já aplica ao ano inteiro. Implementado em
    `selectStandaloneQuarterPeriodRows` (`src/data/fundamentals/cvm/provider.ts`):
    quando todos os candidatos têm `DT_INI_EXERC` conhecido e distinto,
    mantém somente a linha de início mais recente (o subperíodo mais
    curto); quando a data é desconhecida ou já única, o comportamento
    anterior — incluindo a falha fail-closed em ambiguidade genuína —
    permanece intacto. Reexecutado com sucesso: 5 registros (uma ação
    cada).
  - `get_advisors` (security e performance) auditado após os jobs: sem
    achado corrigível novo.
- Consequências: `fundamental_snapshots` foi de 12 para 21 linhas
  (`brazilian-stock`/`cvm-dfp`: 5, `brazilian-stock`/`cvm-itr`: 5,
  `international-etf`/`sec-nport`: 3, `real-estate-fund`/`cvm-fii-inf-mensal`:
  8). Os dois bugs corrigidos eram reais e não hipotéticos — só surgiram ao
  tocar dado real de produção pela primeira vez, mesmo padrão já observado
  em `DEC-047` e `DEC-051`. `docs/PRODUCT.md` documenta a semântica de
  `netIncome` trimestral junto do precedente já existente de `totalRevenue`
  nulo.

## DEC-060 — Ativação do runtime de fundamentos em produção (`read-only`)

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: o runtime opcional e a apresentação de `FundamentalFactsV1`/
  `FundamentalDerivedFactsV1` (`src/application/context/fundamentals`,
  `src/features/fundamentals`, rota `/fundamentos`) estavam prontos desde
  o Sprint 4, mas a composição real permanecia `disabled` — ativação
  explicitamente adiada como decisão separada, mesmo padrão de eventos
  oficiais (`DEC-041`). Com `fundamental_snapshots` em 21 linhas reais
  (`DEC-059`), o usuário autorizou a ativação.
- Decisão: `FUNDAMENTALS_REAL_UI_MODE`
  (`src/features/fundamentals/composition.ts`) mudou de `'disabled'` para
  `'read-only'`. `AppComposition.tsx` já condicionava a fiação do cliente
  real a esse flag, sem mudança adicional necessária. Verificado em
  produção com sessão autenticada real (magic link gerado via admin API,
  nunca enviado por e-mail, mesma técnica de `DEC-042`): leitura direta de
  `fundamental_snapshots` sob RLS retornou `200` e as 21 linhas reais.
- Consequências: rota `/fundamentos` e o item de navegação correspondente
  ficam visíveis para usuários autenticados em produção. O runtime
  continua sem score, ranking ou recomendação (`'no-fundamental-score'`/
  `'no-score'`/`'no-ranking'` permanecem verdadeiros). Nenhuma escrita foi
  afetada; esta é puramente uma mudança de leitura/apresentação.

## DEC-061 — Contenção de falha: error boundary, logger e handlers globais

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: o plano de 8 sprints entregou toda a infraestrutura, mas o
  levantamento de prontidão para uso encontrou zero observabilidade no
  frontend: nenhum error boundary React, nenhum `window.onerror` ou
  `unhandledrejection`, nenhum logger. Qualquer exceção de render virava tela
  branca sem rastro — inaceitável antes do primeiro uso real, em que o
  objetivo é justamente descobrir defeitos ao tocar dado de carteira pela
  primeira vez (mesmo padrão de `DEC-047`, `DEC-051` e `DEC-059`, onde só o
  dado real revelou o bug).
- Decisão: três peças mínimas, sem dependência externa e sem custo.
  - `src/lib/logger.ts` — logger com buffer em memória limitado
    (`DEFAULT_MAX_ENTRIES = 50`), relógio e sink injetáveis, `describeError`
    que normaliza qualquer valor lançado sem nunca lançar, e
    `registerGlobalErrorHandlers`, que cobre exceção não capturada e promise
    rejeitada sem tratamento. Um sink que falhe nunca derruba o fluxo que
    estava sendo registrado.
  - `src/app/ErrorBoundary.tsx` — boundary de classe com `ErrorFallback`
    exportado à parte, para ser testável sem DOM. A tela de falha nomeia a
    tela afetada, mostra a mensagem técnica e afirma que nenhum dado foi
    alterado.
  - Fiação: boundary raiz em `AppComposition`, boundary por rota em
    `RouteContent` (`src/app/router/AppRouter.tsx`, por fora do `Suspense`,
    de modo que falha de chunk também seja contida) e boundary no `/login`.
    `registerGlobalErrorHandlers(window, appLogger)` em `src/main.tsx`.
- Alternativa descartada: Sentry ou APM equivalente. Adicionaria dependência,
  custo e superfície de vazamento de dado financeiro para um sistema que
  ainda tem um único usuário. Reavaliar apenas se houver volume que
  justifique.
- Consequências: o logger não envia nada para fora do browser — é diagnóstico
  local, e nunca deve receber segredo, credencial ou valor financeiro
  identificável. Verificado com o dev server real: a aplicação carrega sem
  erro de console e um `Promise.reject` disparado no browser produziu
  `"Promise rejeitada sem tratamento."` no console, confirmando o registro
  efetivo no `window`. Baseline de testes: 138 arquivos, 2192 testes.

## DEC-062 — Primeiro ensaio real ponta a ponta e as duas correções bloqueantes

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: até 30 de julho de 2026 nenhuma compra jamais tinha sido
  cadastrada em produção (`purchases`, `allocation_targets` e
  `contribution_plans` com 0 linhas). Motor V2, Dossiê Técnico, plano
  persistido e IA explicativa nunca haviam rodado sobre uma carteira real.
  O Sprint 9 executou o ensaio com dados fictícios, em sessão autenticada
  real, para descobrir defeitos antes do primeiro uso de verdade.
- Resultado do ensaio: a cadeia funciona ponta a ponta.
  `allocation_targets` foi de 0 para 15 linhas (3 categorias + 12 ativos),
  `purchases` de 0 para 3 (uma por categoria, incluindo uma em USD),
  `contribution_plans` de 0 para 1 em status `presented`. O Motor V2
  reduziu o desvio de 141,58 p.p. para 84,70 p.p. e a Edge Function
  `explain-contribution-plan` respondeu `200` em 14,8 s com uma explicação
  fiel aos números do plano.
- Defeito 1 — moeda incorreta nos itens do plano (integridade financeira):
  `buildContributionPlanCreateInput`
  (`src/features/contribution/hooks/useContributionData.ts`) gravava
  `currency: getContributionAssetCurrency(asset)` em cada item, enquanto
  `plannedAmountInMinorUnits` vem da distribuição do motor, que trabalha
  exclusivamente em BRL — preços de ativos em USD já são convertidos em
  `buildContributionInputs`. O ensaio gravou VNQ com `152970`/`USD`, mas
  R$ 1.529,70 são 3 × US$ 99,50 convertidos pela cotação do dia: um erro
  de fator igual ao câmbio. `buildContributionConfirmationItems` sempre
  tratou o mesmo valor como BRL (`suggestedAmountInBrlMinorUnits`), o que
  confirma qual dos dois lados estava errado. Corrigido para `'BRL'`, a
  mesma moeda do plano. A suíte não pegava porque todos os testes desse
  builder usavam ativos brasileiros; adicionado teste de regressão com
  ativo cotado em USD.
- Defeito 2 — `refresh-market-data` falhando em silêncio: 14 das 24
  execuções horárias das últimas 24 h responderam `500`, e
  `cron.job_run_details` registrava todas como `succeeded`, porque
  `pg_net` apenas enfileira a requisição. Exatamente o cenário que a seção
  17 de `docs/PROJECT_HANDOFF.md` mandava não presumir resolvido. A causa
  permanecia invisível porque o handler terminava em `catch {}` sem
  log algum.
- Decisão sobre o defeito 2: instrumentar e endurecer, em vez de apenas
  diagnosticar.
  - `index.ts` passa a registrar nome e mensagem do erro em
    `console.error` antes do `500` — nunca segredo, token, header ou corpo
    de resposta de provider.
  - `sanitizeMarketPriceRows` (`core.ts`) descarta preço não positivo, que
    viola `market_asset_prices_price_minor_positive`, e deduplica por
    `(ticker, source, priced_at)`. A segunda defesa é necessária porque
    `upsert_market_asset_prices_v1` usa `ON CONFLICT DO UPDATE`, que falha
    com `21000` — "cannot affect row a second time" — quando a mesma chave
    aparece duas vezes no mesmo comando; reproduzido diretamente contra a
    RPC em produção.
  - Falha de escrita de preços passa a virar `warning` de provider
    `storage`, nunca `500`. Uma execução parcial é melhor que nenhuma, e o
    resultado continua observável.
  - `updatedPrices` passa a refletir o que foi de fato persistido, não o
    que foi montado.
- Consequências: a RPC continua transacional e recusando lote inválido —
  o endurecimento está no chamador, que é quem tem contexto para degradar.
  As leituras iniciais (`listMarketPrices`/`listMarketExchangeRates`)
  continuam podendo gerar `500`, agora com log: se o banco não responde,
  não há execução parcial possível. Os dados do ensaio, incluindo o plano
  com moeda incorreta, permanecem em produção como evidência até a
  limpeza do próximo ciclo.
