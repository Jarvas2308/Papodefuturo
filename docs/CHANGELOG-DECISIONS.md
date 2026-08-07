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

## DEC-063 — A interface deixa de chamar dado real de demonstrativo

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: o ensaio do Sprint 9 (`DEC-062`) mostrou rótulos de demonstração
  aparecendo em sessão autenticada real, sobre dado real. O caso mais grave
  estava na Estratégia: `StrategyToolbar` afirmava, com texto fixo, que "as
  alterações ficam somente nesta sessão e não são persistidas" — mas
  `saveStrategy` grava de verdade em `allocation_targets`, e o ensaio
  persistiu 15 linhas enquanto a tela dizia o contrário.
- Agravante: `StrategyPage` passava `key={JSON.stringify(strategy)}` ao
  editor. Como `saveStrategy` atualiza a estratégia do hook, a key mudava
  no instante do salvamento e remontava o componente, descartando o estado
  local — inclusive a mensagem "Estratégia salva com sucesso na sua conta",
  que nunca chegava a ser exibida. Somados, os dois defeitos faziam um
  salvamento bem-sucedido parecer um no-op.
- Decisão, em duas linhas distintas:
  - Onde o texto realmente depende do modo, passa a depender: o
    `StrategyToolbar` recebe `isDemo` e, em sessão real, diz que as metas
    ficam salvas na conta e orientam o próximo aporte. Mesmo padrão que
    `HistoryPanel` e `HistoryTable` já aplicavam.
  - Onde o adjetivo era apenas ruído, foi removido: "Cotação
    demonstrativa", "Posições demonstrativas", "Metas demonstrativas",
    "Registros demonstrativos", "Simulação demonstrativa" e as descrições
    de navegação viraram rótulos neutros, corretos nos dois modos. O modo
    demo continua sinalizado onde importa — pelo badge de cabeçalho de cada
    página, que já é condicional.
  - `key` derivada de conteúdo removida de `StrategyPage`. O editor é
    montado depois do carregamento, já com dados, e mantém a própria cópia
    aplicada a partir daí.
  - A estratégia V1 do Novo Aporte passa a se chamar "Proporcional
    simples", em vez de "Proporcional demonstrativa": ela roda sobre dado
    real e não tem nada de demonstrativo.
- Fora do escopo, registrado para ciclo próprio: o padrão do seletor de
  estratégia do Novo Aporte continua sendo a proporcional V1, e não o Motor
  V2 — mudar isso é decisão de produto, não correção de texto. Também
  seguem abertos o banner "Algumas cotações não puderam ser atualizadas",
  que dispara com warning de cotação já atualizada (situação normal) e por
  isso é praticamente permanente, e as notificações demonstrativas do
  cabeçalho, que serão removidas com a persistência de Configurações.

## DEC-064 — A rota de eventos oficiais nunca funcionou pela interface

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: ao validar as telas restantes depois de `DEC-062`/`DEC-063`,
  `/eventos-oficiais` respondeu "Não foi possível carregar os eventos —
  ocorreu uma falha segura ao consultar a timeline", mesmo com
  `official_asset_events` em 902 linhas e o runtime em `read-only` desde
  `DEC-041`/`DEC-042`.
- Diagnóstico, por eliminação: a RPC `list_official_asset_events_v1` responde
  `200` com dados quando chamada com o `access_token` da sessão real do
  usuário; `authenticated` tem `execute` na função e `select` na tabela; o
  log do Postgres não registra nenhum erro correspondente; e `/fundamentos`,
  que usa outro caminho de leitura, renderiza os 21 snapshots normalmente.
  A falha estava inteiramente no cliente.
- Causa raiz: `callRpc`
  (`src/data/context/official-events/repository/supabase.ts`) validava o
  envelope com `hasExactKeys(response, ['data', 'error'])`, que exige
  contagem exata de chaves. O `.rpc()` do supabase-js devolve seis —
  `success`, `error`, `data`, `count`, `status` e `statusText`. A condição
  nunca era satisfeita, então toda leitura virava `malformed-response` e a
  UI mostrava a falha segura. Determinístico, não intermitente.
- Por que a suíte não pegava: o `createClient` de
  `supabase.test.ts` devolvia exatamente `{ data, error }` — o dublê
  reproduzia a premissa errada em vez do envelope real da biblioteca. Mesmo
  padrão estrutural já registrado em `PROJECT_HANDOFF` §"testes em
  TypeScript não alcançam o corpo de funções PL/pgSQL": um teste que
  confirma a suposição do autor não testa a integração.
- Decisão: introduzir `hasRequiredKeys`, que exige presença de `data` e
  `error` sem fixar a contagem, e usá-la **apenas** no envelope — que
  pertence ao supabase-js e pode ganhar campos em qualquer versão menor. A
  exatidão de `hasExactKeys` permanece onde a forma é nossa: as linhas
  (`ROW_KEYS`) e o payload da RPC seguem fail-closed.
- Verificação: dois testes novos — um com o envelope real de seis chaves,
  que falha com o código anterior e passa com o corrigido, e outro
  confirmando que um envelope sem `data`/`error` continua sendo recusado.
- Consequências: `DEC-042` registrou a ativação como verificada em produção,
  mas a verificação daquele ciclo foi feita por consulta direta à RPC, não
  pela interface. A lição operacional é que ativar uma rota exige exercitá-la
  pela tela, com sessão real, e não apenas confirmar que o dado responde.

## DEC-065 — Rodapé da barra lateral e rótulo de compras em sessão real

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: acabamento do que `DEC-063` deixou registrado como fora de
  escopo. Ao percorrer as dez rotas com sessão autenticada real, dois
  textos ainda descreviam dado real como demonstração.
- Decisão:
  - `SidebarContent` passa a consumir `useAuth`, no mesmo padrão que o
    `Header` já aplicava: as iniciais vêm do e-mail da conta e o rodapé diz
    "Sua conta" com o e-mail, em vez de "Perfil demonstrativo" e "Dados de
    exemplo" fixos. O ramo demo permanece idêntico.
  - `HistorySummaryCards` deixa de chamar as compras confirmadas de "Ordens
    simuladas no período" — elas são fatos registrados pelo usuário, e o
    produto nunca executa ordem. Passa a "Compras confirmadas no período".
- Mantido deliberadamente: o painel de notificações do `Header` continua
  como está. Diferente do toggle de Configurações, ele não simula uma
  funcionalidade — declara em texto que as notificações reais virão em uma
  etapa futura e que o painel apenas mostra onde os avisos aparecerão. É um
  placeholder honesto, não uma afirmação falsa.
- Consequências: `components.test.tsx` de eventos oficiais passou a
  envolver `SidebarContent` em `AuthProvider`, já que o componente agora
  exige o contexto. O novo `Sidebar.test.tsx` cobre apenas o ramo demo —
  montar uma sessão autenticada exige DOM real, e fica para a suíte de
  interação do Sprint 13.

## DEC-066 — Banner de cotação deixa de disparar em situação normal

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: "Algumas cotações não puderam ser atualizadas" aparecia em
  `/dashboard`, `/carteira` e `/novo-aporte` mesmo com os 12 tickers do
  universo fechado com preço em dia, tornando o aviso praticamente
  permanente nas telas onde o usuário decide dinheiro.
- Causa raiz: `refreshMarketDataBestEffort`
  (`src/data/marketDataRefresh.ts`) exibia o banner sempre que
  `result.warnings.length > 0`, sem diferenciar tipo de aviso. Mas
  `staleQuoteWarning` (`supabase/functions/refresh-market-data/core.ts`) é
  emitido no caminho normal: o provider respondeu, a cotação não é mais
  recente que a já armazenada, e nada é escrito de propósito. Confirmado
  disparando a função em produção: todos os warnings da execução real eram
  `stale-quote`.
- Bug relacionado, corrigido no mesmo ciclo: `parseMarketDataRefreshResult`
  (`src/data/repositories/supabaseRepositories.ts`) validava
  `warning.provider` contra apenas três valores, sem incluir `'storage'`.
  Qualquer aviso de falha de escrita introduzido em `DEC-062` derrubava a
  resposta inteira nesta validação, e o motivo real virava o mesmo banner
  genérico — mascarando exatamente o tipo de degradação que o aviso deveria
  expor.
- Decisão: `MarketDataWarning` ganha `kind: 'provider-failed' |
'stale-quote' | 'configuration' | 'storage-failed'`, na Edge Function
  (`supabase/functions/refresh-market-data/types.ts`) e no contrato do
  frontend (`src/data/repositories/contracts.ts`). O banner só aparece
  quando existe pelo menos um aviso com `kind !== 'stale-quote'`. O
  validador do frontend passa a aceitar `'storage'` e a checar `kind`.
- Consequências: a Edge Function precisa de redeploy para o campo `kind`
  chegar em produção — sem isso, o parser do frontend rejeitaria a
  resposta por falta do campo, e o banner voltaria a aparecer sempre pelo
  ramo de erro genérico. Verificado após o deploy: disparo manual da
  função continuou respondendo `200`, e o frontend consumiu a resposta sem
  lançar `Invalid market data refresh response`.

## DEC-067 — Limpeza dos dados de ensaio e encerramento do Sprint 9

- Data: 30 de julho de 2026
- Status: Aceita
- Contexto: `DEC-062` gerou compras, metas e planos fictícios em produção
  para provar a cadeia ponta a ponta pela primeira vez. Esses dados
  cumpriram o papel de evidência ao longo do Sprint 9 e precisavam sair
  antes do usuário cadastrar a carteira real.
- Decisão: confirmadas as 6 `purchases`, 15 `allocation_targets`, 3
  `contribution_plans` e 9 `contribution_plan_items` como pertencentes
  inteiramente ao único usuário da conta (`06c2a497-ef0d-4dc0-83cd-
6c5898848698`) antes de remover — sem filtro por data, por conteúdo
  ainda ser 100% de ensaio. `DELETE` transacional nas quatro tabelas, na
  ordem que respeita a FK de `contribution_plan_items` para
  `contribution_plans`.
- Verificação: as quatro tabelas confirmadas em 0 linhas após a remoção;
  `/dashboard` em produção mostra "Nenhuma" compra e R$ 0,00, o estado
  correto para uma conta sem carteira cadastrada.
- Consequências: Sprint 9 (`docs/ROADMAP.md`) fecha com os quatro itens
  concluídos. `allocation_targets`, `purchases` e `contribution_plans`
  voltam a 0 linhas — não porque a cadeia falhou, mas porque a evidência do
  ensaio foi removida de propósito. O próximo aporte real registrado pelo
  usuário será o primeiro dado de produção de verdade nessas tabelas.

## DEC-068 — Motor evolui de veto para recomendação por score (Sprint 16)

- Data: 31 de julho de 2026
- Status: Aceita, implementação planejada para a Sprint 16
- Contexto: teste real do primeiro aporte (`DEC-062`) expôs que o motor só
  responde "qual ativo está mais longe da meta", sem nunca consultar os
  dados de mercado e fundamento que o sistema já ingere —
  `official_asset_events` (302 linhas) e `fundamental_snapshots` custaram
  sprints inteiras e não influenciam decisão nenhuma. Investigação de
  fonte identificou que um documento de referência anterior sobre FII
  (`Analise_Completa_Categorias_FII.docx`, gerado fora do sistema)
  continha erros reais de classificação de ticker — MXRF11 e KNCR11 (fundos
  de papel, sem imóvel) tratados como fundos de tijolo com vacância. O erro
  raiz identificado: qualquer regra de sinal aplicada sem primeiro
  distinguir o regime do ativo (tijolo/papel/FOF em FII; banco/seguradora/
  regulado/holding/industrial em ação) julga o ativo pela métrica errada.
- Decisão, em três partes:
  1. **Escopo do universo fechado não muda.** `MAX_PLAN_ASSETS = 3`
     permanece. Notícia editorial/sentimento continua fora
     (`NO-GO`, `DEC-036`, não reaberto). Só dado estruturado de fonte
     regulatória (CVM, SEC) ou de mercado público (Tesouro Transparente,
     FRED, Shiller/Yale) alimenta o score.
  2. **Mecanismo é score, não veto puro.** Dado externo pontua o ativo
     (-2 a +2 por sinal, tabela editável em
     `docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md`), não só exclui.
     Escolha explícita do usuário: motor deve funcionar como recomendador
     dentro do universo fechado, com o usuário mantendo a decisão final
     via confirmação obrigatória — não um recomendador irrestrito
     (`PRODUCT.md`, princípio 6).
  3. **Score entra no laço guloso como ajuste de prioridade, com trava.**
     `desvioAjustado = desvioCandidato − (score × pesoConfigurável)`,
     reaproveitando `compareDeviation` já testado
     (`targetAllocationStrategy.ts`), sem escala nova. Trava obrigatória:
     o ajuste só se aplica a candidatos que já passam
     `compareDeviation(bestDeviation, currentDeviation) < 0` — score nunca
     aprova uma compra que não melhora o desvio da carteira.
- Pesquisa de fonte, concluída antes da decisão, registrada em
  `docs/reference/`: `FII_SEGMENTOS_E_METRICAS.md` (corrige os erros de
  ticker da v1, mapeia CVM Informe Trimestral Estruturado — 6 tabelas
  cobrindo vacância, contrato, inquilino, indexador),
  `ACOES_BR_SETORES_E_METRICAS.md` (DFP/ITR, código de lucro líquido `3.11`
  confirmado universal entre setores testados; achado de payout de BBAS3
  caindo de ~45% para 30% no ano), `ETF_INTERNACIONAL_SEGMENTOS_E_METRICAS.md`
  (CAPE de VOO via Shiller/Yale confirmado, spread de VNQ sobre TIPS via
  FRED confirmado, CAPE de VEA sem fonte aberta identificada).
- Frescor de dado verificado por fonte, não uniforme: preço de mercado já
  atualiza a cada hora (`refresh-market-data`, `pg_cron`, migration
  `20260729120000`). NTN-B e FRED são diários. CVM Informe Mensal e
  Shiller são mensais. CVM Informe Trimestral e DFP/ITR são trimestrais.
  SEC N-PORT é o pior caso confirmado: só o mês de fechamento de trimestre
  é público, com até 60 dias de atraso de publicação — dado pode refletir
  posição de até ~5 meses antes da consulta, por regra da SEC, não por
  falha de ingestão. Consequência para a Sprint 16: o estado `stale` de
  cada sinal precisa de limiar por fonte, não um número global.
- Consequências: `docs/ROADMAP.md` ganha a Sprint 16, sequenciada depois
  das Sprints 10 (recuperação de senha, bloqueante) e 12 (observabilidade
  — necessária para depurar os providers novos), à frente das Sprints 13
  a 15 (pós-uso, menor urgência para usuário único). Implementação ainda
  não iniciada — esta entrada registra a decisão de arquitetura e a
  pesquisa de fonte, não código novo. `PRODUCT.md` precisará reconciliar a
  frase "recomendador irrestrito de ativos" (linha 15, o que o produto não
  é) com o novo mecanismo: o motor passa a recomendar, mas dentro de
  universo fechado, com pesos definidos pelo usuário e confirmação manual
  obrigatória antes de qualquer `purchases` — não irrestrito.

## DEC-069 — Recuperação de senha (Sprint 10)

- Data: 31 de julho de 2026
- Status: Aceita, implementada
- Contexto: com um único `auth.users` e sem fluxo de recuperação, senha
  perdida significava perda permanente de todos os dados. Sprint 10,
  registrada bloqueante em `DEC-068`, cobre exatamente isso — executada
  antes de qualquer trabalho de Sprint 16.
- Decisão: `AuthContextValue` ganha `resetPasswordForEmail`,
  `updatePassword` e a flag `isPasswordRecovery` (`src/auth/authContext.ts`,
  `src/auth/AuthProvider.tsx`). `isPasswordRecovery` é setada ao detectar o
  evento `PASSWORD_RECOVERY` do `onAuthStateChange` do Supabase, e usada
  por `ResetPasswordPage` para recusar a troca de senha se a página for
  acessada sem uma sessão de recuperação válida (link inválido ou
  expirado). Duas rotas públicas novas: `/recuperar-senha`
  (`ForgotPasswordPage.tsx`, mensagem de sucesso genérica independente de o
  e-mail existir na base, evita enumeração de conta) e `/redefinir-senha`
  (`ResetPasswordPage.tsx`, exige senha e confirmação iguais, desloga a
  sessão de recuperação após trocar a senha com sucesso). Link "Esqueceu
  sua senha?" adicionado a `LoginPage`, visível apenas no modo de entrada
  (não no cadastro) e fora do modo demonstrativo.
- Verificação: `tsc --noEmit` limpo; suíte completa — 2210/2210 testes
  passando, nenhuma quebra nos 140 arquivos de teste existentes. Preview
  visual no navegador não foi possível nesta sessão — porta 5173 ocupada
  por outra sessão do mesmo usuário, sem relação com o código alterado.
- Consequências: `docs/ROADMAP.md`, Sprint 10 marcada concluída.
  `auth_leaked_password_protection` permanece pendente — é toggle no
  painel do Supabase (Auth → Providers → Password), ação manual de
  configuração de segurança em serviço de terceiro, deliberadamente não
  automatizada por este agente sem o usuário revisar o projeto ao vivo.

## DEC-070 — Configurações deixam de ser mock (Sprint 11)

- Data: 31 de julho de 2026
- Status: Aceita, implementada — migration pendente de aplicação
- Contexto: `SettingsPage` inteira ainda afirmava "sem conta autenticada",
  "e-mail demonstrativo" e "não existe backend conectado" para um usuário
  já autenticado com dado real — mesma classe de bug do `DEC-063`/`DEC-065`
  (texto de demonstração sobre sessão real), não pega até esta sprint.
- Decisão:
  1. **Tabela nova `user_preferences`** (migration
     `20260731120000_create_user_preferences.sql`, RLS idêntica ao padrão
     de `profiles`: select/insert/update/delete restrito a
     `user_id = auth.uid()`), guardando o subconjunto útil: moeda, casas
     decimais, view compacta, estratégia padrão de aporte, lembrete de
     aporte (ativado/dia). **Nome de exibição reaproveita `profiles.name`**,
     já existente e sem uso prévio no código.
  2. **E-mail vira somente leitura**, sempre lido de `user.email` da sessão
     real — deixou de ser campo editável de texto solto. Editar e-mail de
     verdade exige o fluxo próprio de confirmação do Supabase Auth,
     deliberadamente fora deste escopo.
  3. **Seção de notificações removida por completo** —
     `SettingsNotificationsSection.tsx` e teste apagados, campo
     `notifications` removido de `UserSettings`, `countEnabledNotifications`
     removida. Nunca teve canal de envio; card de resumo trocado por
     "Lembrete de aporte", que agora é dado real.
  4. **`restoreDefaultSettings` para de sobrescrever o perfil** — só
     `display` e `planning` voltam ao valor de fábrica; nome e e-mail são
     identidade real, não "padrão" a restaurar. Assinatura mudou para
     receber o perfil atual (`restoreDefaultSettings(currentProfile)`).
  5. **Contratos novos** em `src/data/repositories/contracts.ts`:
     `ProfileRepository` e `UserPreferencesRepository`, seguindo o padrão
     de `AllocationTargetRepository` — `userId` passado por chamada, não no
     construtor da fábrica, igual a `AssetRepository.ensureClosedUniverse`.
  6. **Headers de segurança em `vercel.json`**:
     `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
     `Referrer-Policy: strict-origin-when-cross-origin`,
     `Permissions-Policy` restringindo geolocalização/câmera/microfone,
     `Strict-Transport-Security`. **Content-Security-Policy deliberadamente
     fora** — CSP mal calibrado quebra o site inteiro (Supabase, fontes) e
     não havia ambiente para testar contra produção nesta sessão. Fica
     pendência sinalizada, não resolvida às pressas.
- Migration aplicada em produção (projeto `vxjrncwfysglinfktifz`) após
  confirmação explícita do usuário — não automática. `database.types.ts`
  regenerado logo em seguida; o repositório usa `Tables<'user_preferences'>`
  real, sem cast temporário.
- `get_advisors` (segurança) rodado após a migration: nenhum aviso novo
  para `user_preferences` — RLS habilitada e com as 4 políticas presentes,
  confirmando que as policies foram criadas corretamente. Avisos
  pré-existentes seguem abertos e não fazem parte desta sprint:
  `official_event_backfill_jobs`/`runs` sem policy (RLS habilitada, mas
  sem política — tabelas internas de backfill, não acessadas pelo
  frontend), extensão `pg_net` no schema `public`, e
  `auth_leaked_password_protection` desabilitado — este último é
  exatamente a pendência manual já registrada na Sprint 10 (`DEC-069`), o
  próprio advisor confirma que segue pendente.
- Verificação: `tsc --noEmit` limpo; suíte completa — 2208/2208 testes
  passando (140 arquivos), antes e depois de aplicar a migration e
  regenerar os tipos. Sem teste de componente/página dedicado para
  Settings ainda — confirmado que não existia nenhum antes desta sprint;
  cobertura de interação continua planejada para a Sprint 13.
- Consequências: `docs/ROADMAP.md`, Sprint 11 marcada concluída, sem
  pendência de migration. Pendência que segue real e não fechada por este
  agente: `auth_leaked_password_protection` no painel do Supabase (herdada
  da `DEC-069`, agora confirmada pelo advisor de segurança do próprio
  projeto).

## DEC-071 — Observabilidade e frescor de dados (Sprint 12)

- Data: 4 de agosto de 2026
- Status: Aceita, implementada, migration aplicada em produção
- Contexto: `explain-contribution-plan` tinha `catch` totalmente mudo —
  mesmo bug que a `DEC-062` já tinha corrigido em `refresh-market-data`
  ("o 500 era mudo"), nunca replicado pra segunda função. E mesmo com o
  catch de falha já logado em `refresh-market-data`, o caminho de sucesso
  não logava nada — cron rodando bem e cron rodando sem atualizar quase
  nada de fato pareciam idênticos no log.
- Decisão, em três partes:
  1. **Log estruturado JSON, mesma disciplina nos dois lados.**
     `refresh-market-data-succeeded` novo, com contagem de preços/câmbio
     atualizados, pulados por já frescos, e tipos de warning.
     `explain-contribution-plan-failed` novo, replicando o padrão já
     usado do outro lado — nome e mensagem do erro, nunca segredo, token,
     dossiê (dado de carteira do usuário) ou corpo de resposta de
     provider.
  2. **Aviso de preço obsoleto em `/carteira`.** Novo domínio
     `src/domain/priceFreshness.ts` (`getStaleAssetPrices`), usando
     `getLatestAssetPricesByAsset` já existente. Limiar de **4 dias**
     (`UI_STALE_PRICE_THRESHOLD_MS`), deliberadamente diferente da janela
     de 60 min do cron (`MARKET_DATA_FRESHNESS_MS`) — 60 min soaria falso
     alarme em todo fim de semana de mercado fechado; 4 dias cobre feriado
     prolongado sem ruído. Só preço `source: 'market-provider'` é
     avaliado — preço manual é decisão do usuário, não falha de provider.
  3. **`npm run check:health`** (`scripts/check-health.mjs`) contra nova
     RPC `check_market_data_health_v1` — `SECURITY DEFINER`,
     `search_path` fixo (`public, cron`), `revoke all from public` +
     `grant execute` só para `service_role`. `cron.job_run_details` não é
     exposto via PostgREST de propósito (infraestrutura interna do
     `pg_cron`, não dado de aplicação) — função server-side é o mesmo
     padrão já usado no projeto para leitura controlada de schema
     interno, evitando expor `cron` na API ou adicionar dependência nova
     de conexão Postgres direta.
- Limite documentado, não escondido: `cron.job_run_details.status =
'succeeded'` confirma que o `pg_net` entregou a chamada HTTP e recebeu
  resposta — **não** que a lógica interna da função funcionou (a função
  pode responder 500 e o cron mesmo assim registrar `succeeded`,
  confirmado no comentário original da `DEC-062`). `check:health` e os
  logs estruturados da Edge Function são complementares, não substitutos —
  registrado em `docs/runbooks/OPERATIONS_V1.md`, seção 4.
- Verificação: `tsc --noEmit` limpo; suíte completa — 2215/2215 testes
  passando (141 arquivos, 7 novos testes de `priceFreshness.test.ts`
  cobrindo limiar, ordenação por dias parado, e exclusão de preço manual).
  Migration `20260804170000_create_check_market_data_health_v1.sql`
  aplicada em produção (projeto `vxjrncwfysglinfktifz`) após confirmação
  explícita do usuário. `get_advisors` rodado depois: nenhum aviso de
  segurança novo — os três avisos pré-existentes (tabelas de backfill sem
  policy, `pg_net` no schema `public`, `auth_leaked_password_protection`)
  continuam os mesmos de antes desta sprint. RPC testada com
  `execute_sql`: 24/24 execuções recentes `succeeded`, 56 minutos desde a
  última — dentro do esperado.
- Consequências: `docs/ROADMAP.md`, Sprint 12 marcada concluída.
  `docs/runbooks/OPERATIONS_V1.md` criado, cobrindo as três peças, cenários
  de diagnóstico e o limite conhecido da checagem de cron. Nenhuma
  pendência manual nova — diferente de `DEC-069`/`DEC-070`, esta sprint
  não introduziu ação de painel pendente.

## DEC-072 — Testes de interação: entrega inicial (Sprint 13, reordenada)

- Data: 4 de agosto de 2026
- Status: Aceita, implementada parcialmente — item aberto registrado, não
  fechado por engano
- Contexto: usuário pediu para reordenar as sprints restantes (13 a 16)
  pela lógica mais correta, não pela ordem numérica original. Decisão:
  **13 antes de 14 antes de 16** — não faz sentido documentar/limpar
  código sem teste de interação cobrindo comportamento real primeiro
  (risco de "limpar" algo com bug escondido sem teste pra pegar), e não
  faz sentido documentar/limpar **depois** da Sprint 16 (motor com score),
  que traz volume grande de código novo — melhor a base já limpa antes. 15
  segue fora: trava sozinha, sem segundo usuário não tem o que testar.
  `src/auth` estava no pior estado possível para começar por aqui: Sprint
  10 (`DEC-069`) tinha acabado de adicionar fluxo de recuperação de senha
  inteiro sem nenhum teste de interação, só `tsc --noEmit`.
- Decisão:
  1. **Dependências novas**: `jsdom`, `@testing-library/react`,
     `@testing-library/user-event`, `@testing-library/jest-dom` —
     versões compatíveis com React 19 confirmadas antes de instalar
     (`@testing-library/react@16.3.2`). `npm audit` rodado antes e depois:
     resolvido sem quebra `brace-expansion` e `postcss` (dev-tooling).
     **Achado à parte, fora de escopo desta sprint**: `react-router-dom`
     (dependência de produção) com vulnerabilidade alta de CSRF em modo
     RSC — não corrigido aqui, `npm audit fix --force` sugeriria
     downgrade, precisa de atenção própria e teste dedicado antes de
     mexer numa lib de rotas usada em todo o app.
  2. **Ambiente por arquivo, não global.** `vite.config.ts` ganha
     `test.setupFiles`, mas o ambiente continua `node` por padrão — cada
     arquivo de teste de interação opta em `jsdom` via pragma
     `// @vitest-environment jsdom` no topo. Motivo: a suíte tem mais de
     140 arquivos de teste de domínio/lógica pura sem DOM; forçar `jsdom`
     globalmente pagaria o custo de setup em todos eles à toa.
  3. **`src/testSetup.ts`** registra `@testing-library/jest-dom/vitest`
     (matchers como `toBeInTheDocument`) e `afterEach(cleanup)` — sem
     `globals: true` no vitest config, a limpeza automática do Testing
     Library não dispara sozinha; sem isso, o segundo teste de um arquivo
     via a DOM do primeiro ainda montada (confirmado na prática: sem o
     `afterEach`, inputs apareciam com valor concatenado de dois testes).
     Verificado que `cleanup()` não quebra os arquivos `node` — a função
     protege internamente contra `document` ausente.
  4. **Cobertura entregue**: `LoginPage.test.tsx` (4 testes — link
     "esqueceu senha" condicional a modo e contexto, submit chama
     `signIn`, mensagem amigável em credencial inválida),
     `ForgotPasswordPage.test.tsx` (3 — mensagem de sucesso genérica
     idêntica em sucesso e falha, evitando enumeração de conta; desabilita
     em modo demo), `ResetPasswordPage.test.tsx` (5 — recusa mostrar o
     formulário sem `isPasswordRecovery`, rejeita senha divergente sem
     chamar `updatePassword`, atualiza e desloga a sessão de recuperação
     em sucesso, mensagem amigável em falha), `PurchaseForm.test.tsx` (5 —
     criação, edição pré-preenchida, cancelamento de edição, mensagem de
     erro). Total: 17 testes novos de interação real (clique, digitação,
     submit), não só render estático.
  5. **Não coberto, registrado como item aberto**: fluxo de cancelamento
     de compra em `HistoryPage` (diálogo de confirmação orquestrado no
     nível da página, exige mock do hook `useHistoryData` inteiro — maior
     que o escopo de um componente isolado como `PurchaseForm`) e
     interação em qualquer outra página do app. Sprint 13 permanece aberta
     no roadmap com o que falta explícito, não marcada como concluída por
     engano.
- Verificação: `tsc --noEmit` limpo; suíte completa —
  **2232/2232 testes passando, 145 arquivos** (17 testes novos sobre os
  2215 de antes desta sprint). Duração da suíte subiu de ~8,6s para
  ~15,4s — custo de `jsdom` isolado nos 4 arquivos novos, suíte de domínio
  continua rápida.
- Consequências: `docs/ROADMAP.md` reordena as Sprints 13-16 e marca a 13
  como entrega inicial concluída, com o restante listado explicitamente.
  Padrão de teste de interação (pragma por arquivo, mock de `useAuth` via
  `vi.spyOn`, `afterEach(cleanup)` global) fica estabelecido para reuso —
  próxima peça (cancelamento de compra) tem exemplo direto a seguir, não
  precisa reinventar a abordagem.

## DEC-073 — Reconciliação documental e limpeza de código morto (Sprint 14)

- Data: 4 de agosto de 2026
- Status: Aceita, implementada parcialmente — item aberto registrado, não
  fechado por engano
- Contexto: `docs/PROJECT_HANDOFF.md` (seção 2) já admitia dívida
  documental conhecida em `README.md`, `docs/ARCHITECTURE.md` e
  `docs/SUPABASE_SCHEMA_PLAN.md`. Na prática, o próprio
  `docs/PROJECT_HANDOFF.md` estava mais desatualizado que os outros — sua
  última atualização (29-30 de julho) não refletia o fechamento do
  Sprint 9 nem nenhuma das Sprints 10 a 13 executadas nesta sessão.
- Decisão:
  1. **`README.md`** — "O que ainda falta" corrigido: afirmava que
     `official_asset_events` e `fundamental_snapshots` seguiam vazias,
     quando já estavam em 902 e 21 linhas respectivamente (`DEC-058`,
     `DEC-059`, ambas anteriores a esta sessão mas nunca refletidas aqui).
     Rotas `/recuperar-senha` e `/redefinir-senha` adicionadas à lista de
     rotas atuais. Bullets novos para recuperação de senha, configurações
     persistidas e observabilidade.
  2. **`docs/PROJECT_HANDOFF.md`** — décima quinta atualização adicionada
     ao log já existente no topo do documento (mesmo padrão das 14
     anteriores), cobrindo Sprint 9 (fechamento) a Sprint 13. Seção 1
     (resumo executivo), seção 2 (a nota de dívida documental, corrigida
     para não apontar mais para um `README.md` que já foi corrigido) e
     seção 14 (Próxima sequência recomendada, reescrita — a versão
     anterior ainda descrevia decisão de backfill gradual como pendente,
     quando o backfill amplo já tinha sido executado por completo).
  3. **`knip.json`** — dead-code scanner adicionado como devDependency,
     com pontos de entrada explícitos (`scripts/**`,
     `supabase/functions/*/index.ts`, `vite.config.ts`) porque a
     configuração padrão do knip, sem isso, sinalizava como "não usado"
     um arquivo que tinha acabado de ser editado na própria sessão
     (`explain-contribution-plan/index.ts`, Sprint 12) — confirmação
     concreta de que rodar a ferramenta sem configurar os pontos de
     entrada do projeto produz falso positivo, não sinal confiável.
     `npm run audit:dead-code` adicionado.
  4. **Um export removido**: `cloneTemporalValue`
     (`src/domain/context/official-events/internal.ts`) tinha `export`
     mas só é usado dentro do próprio arquivo — confirmado com grep antes
     de tocar, não só pelo knip.
- Decisão explícita de não fazer, registrada em vez de escondida: mesmo
  com `knip.json` configurado, ~190 reexportações de barrel
  (`fundamentals/index.ts`, `repositories/index.ts`, `cvm/fii/index.ts`,
  `sec/nport/index.ts`, `backfill/index.ts`) continuam sinalizadas como
  não consumidas via o próprio barrel. Verificado em pelo menos um caso
  que a causa é import direto do caminho profundo em vez do barrel (os
  scripts de ingestão importam de `../src/data/fundamentals/cvm/types`,
  não de `../src/data/fundamentals`) — os símbolos em si não estão mortos,
  a reexportação do barrel é que não tem consumidor hoje. Não removidas em
  massa: risco de quebrar um consumidor que a config atual do knip não
  mapeia, e a Sprint 16 vai expandir exatamente esses módulos de
  fundamentos em breve — prunar agora para reconstruir depois é
  desperdício de esforço, não limpeza.
- Verificação: `tsc --noEmit` limpo; suíte completa — 2232/2232 testes
  passando, 145 arquivos, sem mudança de contagem (a única remoção de
  código foi um `export` desnecessário, não lógica).
- Consequências: `docs/ROADMAP.md`, Sprint 14 marcada como entrega
  inicial concluída, com o que falta explícito na própria entrada — não
  fechada por engano. `knip.json` fica como ferramenta permanente do
  repositório para auditorias futuras, incluindo uma decisão futura
  sobre prunar barrels depois da Sprint 16.

## DEC-074 — Sprint 16, Fase 1: fundação de schema para o motor por score

- Data: 4 de agosto de 2026
- Status: Aceita, implementada, migrations aplicadas em produção
- Contexto: Fase 1 do plano da `DEC-068` — schema precisa existir antes de
  qualquer provider (Fase 2) ou motor de score (Fase 5) ter onde escrever
  ou ler.
- Decisão, em duas migrations:
  1. **`asset_type`/`asset_segment` em `assets`**
     (`20260804180000_add_asset_type_and_segment.sql`). `asset_type` só se
     aplica a FII (tijolo/papel/fof) — aplicar métrica de tijolo (vacância,
     WALE) num fundo de papel é o erro de categoria documentado em
     `docs/reference/FII_SEGMENTOS_E_METRICAS.md`. `asset_segment` cobre
     os três vocabulários (FII, ação por regime, ETF por índice) numa
     coluna só, sem ambiguidade porque cada ativo pertence a uma categoria.
     Antes de gravar, **verificado em fonte** (não assumido da memória)
     que KNRI11 é tijolo híbrido (lajes + logística) e XPLG11 é tijolo
     logística — os dois não tinham sido confirmados nos documentos de
     referência anteriores. Backfill dos 12 ativos já semeados no único
     usuário real, conferido linha por linha depois de aplicar.
  2. **`signal_rules` + `score_weight_basis_points`**
     (`20260804190000_create_signal_rules.sql`). Tabela por usuário
     (mesma RLS de `profiles`/`user_preferences`), faixas min/max → pontos
     por `signal_key` prefixado por categoria. **Deixada vazia de
     propósito** — as faixas de
     `docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md` são proposta para o
     usuário revisar, não fato pronto para gravar; população real
     acontece na Fase 5, quando a regra e o código que a consome nascem
     juntos. Peso do score (`desvioAjustado = desvioCandidato − score ×
peso`, seção 5 do rascunho) virou coluna em `user_preferences` em vez
     de tabela própria — é uma preferência única por usuário. Default de
     50 pontos-base por ponto é valor de partida mecânico, não julgamento
     financeiro.
- Decisão de design que evitou retrabalho grande: `assetType`/
  `assetSegment` em `Asset` (domínio) ficaram **opcionais**, não
  obrigatórios. Tentativa inicial como campos obrigatórios quebrou
  typecheck em ~30 arquivos de teste espalhados pela suíte inteira
  (fixtures ad hoc, sem builder compartilhado) — revertido antes de tentar
  corrigir todos, mesmo padrão já usado em `Purchase.notes?`.
- Verificação: `tsc --noEmit` limpo; suíte completa — 2232/2232 testes
  passando, 145 arquivos, em ambas as migrations (typecheck e suíte
  rodados após cada uma). Migrations aplicadas em produção (projeto
  `vxjrncwfysglinfktifz`); `database.types.ts` regenerado duas vezes.
  `get_advisors` rodado após cada migration: nenhum aviso de segurança
  novo nas duas — mesmos três avisos pré-existentes de sempre.
- Consequências: `docs/ROADMAP.md`, Sprint 16 Fase 1 marcada concluída.
  Fase 2 (providers CVM Trimestral + Tesouro Transparente) é o próximo
  passo natural, mas não iniciada nesta entrada — checkpoint pedido
  explicitamente antes de continuar.

## DEC-075 — Sprint 16, Fase 2 (parte 1): provider Tesouro Transparente (NTN-B)

- Data: 4 de agosto de 2026
- Status: Aceita, implementada, migration aplicada e Edge Function
  publicada em produção (versão 11)
- Contexto: Fase 2 cobre dois providers de FII — CVM Informe Trimestral
  Estruturado (6 tabelas, maior) e Tesouro Transparente (NTN-B, menor,
  autocontido). Esta entrada fecha só o segundo, deliberadamente, como
  fatia vertical completa antes de partir para o maior.
- Decisão:
  1. **Tabela global `market_reference_rates`**
     (`20260804200000_create_market_reference_rates.sql`), mesmo padrão
     de `market_exchange_rates` (`DEC-052`): sem `user_id`, sem RPC de
     escrita para `authenticated`, upsert transacional
     `upsert_market_reference_rates_v1` só para `service_role`, com
     `revoke` explícito de escrita direta na tabela até para
     `service_role` — só a RPC escreve. `series` deixa espaço para outra
     taxa de referência futura (ex.: TIPS via FRED, Fase 4) sem tabela
     nova.
  2. **`tesouroTransparenteProvider.ts`** — baixa o CSV público (sem
     chave), decodifica Latin-1 (confirmado que o arquivo real não é
     UTF-8 — decodificar errado corrompe o nome do título e a filtragem
     falha silenciosamente, zero linhas), filtra por
     `"Tesouro IPCA+ com Juros Semestrais"`, seleciona a `Data Base` mais
     recente e, dentro dela, o `Data Vencimento` mais longo — regra
     explícita em código, não vencimento fixo, porque o título mais longo
     muda com o tempo (`docs/reference/FII_SEGMENTOS_E_METRICAS.md`,
     seção 7.2).
  3. **Frescor por dia, não por hora.** Nova função
     `isReferenceRateFreshForToday` (`freshness.ts`) — o Tesouro publica
     uma linha por dia útil, não por segundo;
     `MARKET_DATA_FRESHNESS_MS` (60 min) rebaixaria o CSV de ~14 MB a cada
     disparo horário do cron à toa. "Fresco" aqui significa "já temos a
     linha de hoje".
  4. **Integrado em `refresh-market-data`**, não em função nova — reaproveita
     autenticação, `service_role`, e o mesmo cron horário já existente
     (a checagem diária evita refetch desnecessário).
  5. **Contrato do frontend atualizado com a mesma disciplina da
     `DEC-066`.** `'tesouro-transparente'` adicionado ao allowlist de
     `provider` em `parseMarketDataRefreshResult`
     (`src/data/repositories/supabaseRepositories.ts`) — faltar aqui
     repetiria exatamente o bug que a `DEC-066` corrigiu (`'storage'`
     ausente derrubava a resposta inteira). Verificado com teste
     dedicado, não só por inspeção.
- Verificação: `tsc --noEmit` limpo. Suíte de Edge Functions —
  **115/115 testes, incluindo 15 novos** (9 do parser/provider Tesouro
  Transparente com amostra real de CSV baixada e conferida em 31/07/2026,
  3 de frescor diário, 6 do fluxo completo em `core.test.ts`, cobrindo
  skip quando já fresco, insert quando novo, warning quando não é mais
  recente, warning quando o provider falha, warning de configuração
  quando ausente). Suíte do frontend — 2251/2251, 146 arquivos. Migration
  aplicada em produção; `get_advisors` sem aviso novo. Edge Function
  publicada (versão 11, `ACTIVE`); `market_reference_rates` ainda vazia
  no momento desta entrada — primeira população ocorre no próximo
  disparo do cron horário, não verificada ainda por não ter esperado o
  ciclo.
- Consequências: Fase 2 segue aberta — falta o provider CVM Informe
  Trimestral Estruturado (6 tabelas: `geral`, `imovel`,
  `imovel_renda_acabado_contrato`, `imovel_renda_acabado_inquilino`,
  `complemento`, `resultado_contabil_financeiro`), consideravelmente
  maior que este. Checkpoint pedido explicitamente antes de começá-lo.

## DEC-076 — Sprint 16, Fase 2 (parte 2): vacância trimestral de FII

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: primeiro sinal extraído do Informe Trimestral Estruturado
  (16 CSVs, não 6 — número corrigido nesta entrada após inspeção real do
  arquivo `inf_trimestral_fii_2026.zip`). Sinal escolhido explicitamente
  pelo usuário entre as opções levantadas: vacância, via tabela `imovel`
  (`Percentual_Vacancia`, `Percentual_Receitas_FII`). Escopo desta fatia é
  só vacância — WALE/indexador, concentração por inquilino, FFO/resultado
  recorrente e tipo de contrato ficam para entradas futuras.
- Decisão:
  1. **Média ponderada por participação na receita, nunca por 1 fixo.**
     `Percentual_Receitas_FII` de cada imóvel não soma 1 no dado real (a
     HGRU11, com 100 imóveis, soma ~0,868 — o resto é receita não alocada
     a imóvel específico). A fórmula é `Σ(vacância_i × peso_i) /
Σ(peso_i)`, com a soma real dos pesos no denominador — nunca
     assumida normalizada.
  2. **Aritmética inteira do início ao fim.** `Percentual_Vacancia` e
     `Percentual_Receitas_FII` vêm como frações decimais (0-1, separador
     ponto — diferente do Informe Mensal, que usa vírgula) com até 17
     casas de precisão observadas no dado real. Toda a agregação em
     `src/data/fundamentals/cvm/fii-trimestral/numbers.ts` usa `BigInt`
     em escala comum, nunca `number`/float — arredondamento final
     half-up, mesmo padrão de `divideToScaledSafeInteger`
     (`src/domain/fundamentals/derived/scaledArithmetic.ts`). A soma de
     pesos, guardada só para auditoria em provenance, é truncada para
     escala fixa de 6 casas antes de virar `Number` — a escala comum de
     entrada (até 17) presa a `BigInt` estouraria
     `Number.MAX_SAFE_INTEGER` se convertida direto.
  3. **Módulo paralelo, não genérico, ao provider do Informe Mensal.**
     `src/data/fundamentals/cvm/fii-trimestral/` replica a estrutura de
     `cvm/fii/` (`archive.ts`, `csv.ts`, `provider.ts`, parser de CSV
     orientado a cabeçalho, não posicional — os CSVs trimestrais têm 38
     colunas em `geral` e 19 em `imovel`) mas não compartilha tipos de
     record com ele: a forma de provenance dos dois informes é
     estruturalmente diferente (mensal tem 2 documentos e PL/cotas/
     cotistas; trimestral tem agregação ponderada por imóvel, com
     trilha de auditoria por imóvel). `CVM_REAL_ESTATE_FUNDS` (lista dos
     4 fundos) é reaproveitada como está — mesma identidade, fonte
     diferente.
  4. **Escrita isolada, leitura existente protegida.**
     `supabaseRealEstateFundSnapshotsTrimestral.ts` é um storage novo e
     separado (`source: 'cvm-fii-inf-trimestral'`, `period: 'quarterly'`,
     todas as colunas específicas do mensal explicitamente nulas). A
     função de leitura já em produção
     (`listRealEstateFundSnapshots`, usada pela tela `/fundamentos`
     real) ganhou um filtro `.eq('source', 'cvm-fii-inf-mensal')`
     explícito — sem ele, uma linha trimestral ingerida quebraria essa
     tela ao tentar mapear um formato que `mapRealEstateFundSnapshotRow`
     não entende. Leitura da vacância fica para quando o motor de score
     (Fase 5) precisar consumi-la.
  5. **Migration em tabela viva com dado real.**
     `20260804210000_add_vacancy_to_fundamental_snapshots.sql` adiciona
     `vacancy_basis_points integer` (CHECK 0-10000) e reescreve os dois
     CHECKs de identidade/metadados de `fundamental_snapshots` para um
     terceiro ramo (`kind='real-estate-fund' and
source='cvm-fii-inf-trimestral'`), exigindo `net_asset_value_minor`/
     `issued_shares_*`/`shareholder_count` nulos nesse ramo — espelha a
     mesma exigência inversa já existente para o ramo mensal. Aplicada
     em produção; confirmado por `execute_sql` que as 8 linhas mensais
     existentes (HGRU11, KNRI11, VISC11, XPLG11 × 2) continuam com
     `vacancy_basis_points = null`.
- Verificação: `tsc --noEmit` limpo. Suíte completa — 151/151 arquivos,
  2278/2278 testes (27 novos: `numbers.test.ts` cobre soma de pesos
  desigual a 1, arredondamento half-up na fronteira, vacância 100%,
  precisão real de 17 casas sem estouro; `csv.test.ts` e
  `archive.test.ts` usam o cabeçalho real de `geral`/`imovel` e a linha
  real da HGRU11 baixada e conferida nesta sessão; `provider.test.ts`
  cobre nome oficial inesperado, versão de filing desatualizada ignorada,
  e o resultado exato — 2645 pontos-base — para uma mistura de vacância
  de alta precisão e vacância total). Migration aplicada em produção;
  `get_advisors` sem aviso novo (mesmos três avisos pré-existentes de
  sempre).
- Consequências: `docs/ROADMAP.md` atualizado — vacância marcada
  concluída dentro da Fase 2, que segue aberta para os demais sinais do
  Informe Trimestral. Nenhum consumidor ainda lê `vacancy_basis_points`
  (nem dossiê, nem motor de score) — população acontece só quando a
  Fase 5 for construída, mesmo padrão já usado para `signal_rules`
  (`DEC-074`).

## DEC-077 — Sprint 16, Fase 2 (parte 3): indexador da carteira de FII

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: segundo sinal extraído do Informe Trimestral Estruturado,
  direto na sequência da vacância (`DEC-076`), mesma sessão, mesmo módulo.
  Fonte: tabela `complemento`, confirmada por download real do
  `inf_trimestral_fii_2026.zip` — `Percentual_Indexador_Receita_FII_IPCA`,
  `_IGPM`, `_INPC`, `_INCC` (fração decimal, separador ponto, mesma
  convenção da vacância). Confirmado com a HGRU11 real: IPCA=0,867201,
  IGP-M=0,002972, INPC=0, INCC=0 — soma 0,870173, não 1 (mesma lição da
  vacância: receita não indexada ou não alocada existe e não deve ser
  normalizada para 1).
- Decisão:
  1. **4 colunas independentes, não 1 indexador dominante.** A tabela
     `complemento` é 1 linha por fundo por trimestre — ao contrário da
     vacância, não há nada para agregar por peso; cada fração já é o
     valor final do fundo. Guardar só o indexador dominante perderia
     informação que o motor de score pode querer (ex.: fundo com 87% IPCA
     e 13% CDI é diferente de um puro-IPCA, mesmo que ambos tenham "IPCA"
     como dominante).
  2. **Conversão fração→pontos-base isolada, sem agregação.** Nova função
     `toBasisPoints` (`cvm/fii-trimestral/numbers.ts`), separada de
     `computeWeightedAverageVacancyInBasisPoints` — mesmo arredondamento
     half-up em `BigInt`, mas sem peso nem soma. Reaproveita o parser
     `parseNullableCvmFiiExactDecimalQuantity` já existente do módulo
     mensal (`../fii/numbers.ts`), sem duplicar a lógica de parsing de
     fração decimal.
  3. **Mesmo record, mesmo storage, mesma migration incremental.** Em vez
     de criar um terceiro módulo paralelo, o indexador entra nos MESMOS
     `CvmRealEstateFundVacancyRecord`/`CvmRealEstateFundVacancyFacts` e no
     mesmo `supabaseRealEstateFundSnapshotsTrimestral.ts` da vacância — o
     nome do tipo ficou histórico (só vacância na origem), documentado
     com comentário em vez de renomeado, para não gerar diff de renome
     sem ganho real numa fatia que já está testada e em produção.
     Migration nova (`20260804220000_add_indexador_to_fundamental_snapshots.sql`)
     segue o mesmo padrão da `DEC-076`: 4 colunas nullable com CHECK de
     range 0-10000 cada, e os 4 ramos do CHECK de metadados de
     `fundamental_snapshots` reescritos para exigir as 4 colunas nulas em
     todo `kind`/`source` exceto `real-estate-fund`/
     `cvm-fii-inf-trimestral`.
  4. **Leitura existente continua protegida.** Nenhuma mudança em
     `listRealEstateFundSnapshots` foi necessária além do filtro já
     aplicado na `DEC-076` (`source = 'cvm-fii-inf-mensal'`) — o
     indexador entra pelas mesmas colunas já fora do alcance dessa
     consulta.
- Verificação: `tsc --noEmit` limpo, `eslint` limpo nos arquivos tocados.
  Suíte completa — 151/151 arquivos, 2280/2280 testes (cobertura nova:
  fixture da HGRU11 real dando 8672/30/0/0 pontos-base para IPCA/IGP-M/
  INPC/INCC; indexador nulo quando não há linha `complemento` casando a
  identidade do filing; erro explícito para linha `complemento`
  ambígua — mais de uma para a mesma combinação CNPJ/data/versão).
  Migration aplicada em produção (`vxjrncwfysglinfktifz`);
  `generate_typescript_types` reexecutado e mesclado manualmente em
  `src/lib/database.types.ts`; `get_advisors` sem aviso novo (mesmos três
  avisos pré-existentes de sempre).
- Consequências: `docs/ROADMAP.md` atualizado — indexador marcado
  concluído dentro da Fase 2, que segue aberta para WALE, concentração
  por inquilino, FFO/resultado recorrente e tipo de contrato. Nenhum
  consumidor ainda lê as 4 colunas novas — mesmo padrão de população
  adiada até a Fase 5 já estabelecido na `DEC-076`.

## DEC-078 — Sprint 16, Fase 2 (parte 4): concentração por setor de inquilino

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: terceiro sinal do Informe Trimestral Estruturado, mesma sessão
  das duas anteriores. Fonte: tabela `imovel_renda_acabado_inquilino`,
  confirmada por download real — `Setor_Atuacao` (texto livre: "Serviço",
  "Comércio", ou o placeholder "-" quando o imóvel não reporta quebra por
  setor) e `Percentual_Receitas_FII` (mesma convenção de fração 0-1,
  separador ponto, das duas fatias anteriores). Achado importante: a CVM
  **não divulga inquilino nomeado**, só o setor de atuação — "concentração
  por inquilino" na prática é concentração por setor.
- Decisão:
  1. **Agregação por soma-e-máximo, não por peso.** Diferente da vacância
     (que pondera vacância por peso) e do indexador (que não agrega nada),
     este sinal soma `Percentual_Receitas_FII` agrupado por
     `Setor_Atuacao` — um fundo pode ter o mesmo setor em vários imóveis
     (ex.: "Varejo" no imóvel A e no imóvel B) e a concentração real é a
     soma, não o maior valor isolado. Depois de somar por setor, pega o
     maior grupo. Nova função `computeTenantConcentration`
     (`cvm/fii-trimestral/numbers.ts`), BigInt do início ao fim, mesmo
     arredondamento half-up das duas anteriores.
  2. **Overflow do peso agregado resolvido preventivamente.** A mesma
     armadilha de escala da vacância (`DEC-076`: converter para escala
     comum de até 17 casas pode estourar `Number.MAX_SAFE_INTEGER`) foi
     generalizada em `roundBigIntFractionToStorageScale`, reaproveitada
     tanto pela soma de pesos da vacância quanto pela soma por setor aqui
     — evita duplicar a mesma lógica de arredondamento para armazenamento
     de auditoria em escala fixa (1e-6).
  3. **Nome do setor só na provenance, não em coluna própria.** O setor é
     texto livre (não um enum fechado da CVM) — criar uma coluna
     `tenant_concentration_dominant_sector` fixaria um formato que pode
     variar entre arquivos/anos. Fica só como string dentro do jsonb de
     provenance, auditável mas não indexável por enquanto; se o motor de
     score (Fase 5) precisar filtrar por setor especificamente, decide-se
     então se vale promover a coluna própria.
  4. **Mesmo record, mesmo storage, mesma migration incremental** —
     terceira vez no mesmo padrão das `DEC-076`/`DEC-077`: 1 coluna nova
     (`tenant_concentration_basis_points`, CHECK 0-10000), exigida nula
     nos outros 3 ramos do CHECK de metadados de `fundamental_snapshots`.
  5. **Erro de otimização evitado nesta entrada:** ao adicionar a nova
     coluna ao `Insert` type manual em `database.types.ts`, a primeira
     tentativa (edição em lote via `replace_all`) marcou a coluna como
     obrigatória (sem `?`) no bloco `Insert` porque o texto-âncora era
     idêntico entre `Row` e `Insert` para essa combinação de campos — só
     `Row` deveria ficar sem `?`. Pego pelo `tsc` imediatamente (dois
     providers que nunca setam a coluna, stock e ETF, pararam de
     compilar) e corrigido antes de seguir. Lição: ao editar
     `database.types.ts` manualmente, conferir bloco por bloco em vez de
     `replace_all` quando `Row`/`Insert`/`Update` têm texto-âncora igual.
- Verificação: `tsc --noEmit` limpo, `eslint` limpo nos arquivos tocados.
  Suíte completa — 151/151 arquivos, 2293/2293 testes (cobertura nova:
  soma por setor repetido em imóveis diferentes, setor dominante entre
  múltiplos, concentração 100% num único setor, fundo sem linha de
  inquilino casando a identidade do filing). Migration aplicada em
  produção (`vxjrncwfysglinfktifz`); `generate_typescript_types`
  reexecutado e mesclado manualmente; `get_advisors` sem aviso novo
  (mesmos três avisos pré-existentes de sempre).
- Consequências: `docs/ROADMAP.md` atualizado — concentração por
  inquilino marcada concluída dentro da Fase 2, que segue aberta para
  WALE, FFO/resultado recorrente e tipo de contrato. Três sinais do
  Informe Trimestral concluídos nesta sessão (vacância, indexador,
  concentração) — nenhum ainda consumido fora da ingestão, população
  adiada até a Fase 5, mesmo padrão das duas entradas anteriores.

## DEC-079 — Sprint 16, Fase 2 (parte 5): resultado financeiro trimestral (FFO)

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: quarto sinal do Informe Trimestral Estruturado, quinta entrada
  consecutiva sobre o mesmo módulo nesta sessão. Fonte: tabela
  `resultado_contabil_financeiro` (95 colunas, confirmada por download
  real) — equivalente brasileiro de FFO citado em
  `docs/reference/FII_SEGMENTOS_E_METRICAS.md`.
- Decisão:
  1. **Campo escolhido: `Resultado_Trimestral_Liquido_Financeiro`, não
     `Resultado_Financeiro_Liquido_Acumulado`.** A tabela expõe os dois —
     um é o resultado do trimestre isolado, o outro é acumulado desde o
     início do exercício fiscal (reseta a cada início de ano, exigiria
     lógica extra para não confundir trimestres de anos fiscais
     diferentes). O trimestral isolado casa diretamente com
     `period: 'quarterly'`, sem ambiguidade de janela temporal. No dado
     real da HGRU11 (Q1, primeiro trimestre do exercício) os dois valores
     coincidem (56.879.214,47) — não dá para diferenciar as duas leituras
     só com esse dado; a escolha é por alinhamento conceitual com o
     schema, não por diferença observada nesta amostra.
  2. **Primeiro campo monetário absoluto desta fatia — os 3 sinais
     anteriores (vacância, indexador, concentração) são todos percentuais
     em pontos-base.** Reaproveita `parseNullableCvmFiiMoney` (já usado
     pelo provider mensal para PL) em vez de criar um parser novo — sem
     agregação, é conversão direta string-BRL → minor units. Pode ser
     negativo (déficit trimestral), sinal preservado pelo parser
     existente sem ajuste.
  3. **Coluna `bigint`, não `integer`.** Único ponto onde o tipo de coluna
     dos sinais desta fatia difere dos anteriores (todos `integer` 0-10000
     pontos-base) — resultado em centavos de fundos grandes ultrapassa o
     limite de `integer` do Postgres (~2,1 bilhões): o valor real da
     HGRU11 sozinho já é 5.687.921.447 centavos.
  4. **Mesmo record, mesmo storage, quinta migration incremental** no
     mesmo padrão das quatro anteriores — 1 coluna nova
     (`quarterly_net_financial_result_minor`), sem CHECK de range (é
     monetário, não pontos-base; pode ser negativo), exigida nula nos
     outros 3 ramos do CHECK de metadados.
  5. **Lição da `DEC-078` aplicada, sem repetir o erro.** Desta vez o
     merge manual de `database.types.ts` foi feito bloco por bloco
     (`Row`, depois `Insert`, depois `Update`), não por `replace_all` —
     `tsc --noEmit` limpo já na primeira tentativa, sem o erro de
     optionality que a entrada anterior cometeu e teve que corrigir.
- Verificação: `tsc --noEmit` limpo, `eslint` limpo nos arquivos tocados.
  Suíte completa — 151/151 arquivos, 2298/2298 testes (cobertura nova:
  valor real da HGRU11 convertido exatamente para minor units, resultado
  negativo preservado com sinal, fundo sem linha de resultado casando a
  identidade do filing). Migration aplicada em produção
  (`vxjrncwfysglinfktifz`); `generate_typescript_types` reexecutado;
  `get_advisors` sem aviso novo (mesmos três avisos pré-existentes de
  sempre).
- Consequências: `docs/ROADMAP.md` atualizado — resultado financeiro
  trimestral marcado concluído dentro da Fase 2, que segue aberta só para
  WALE e tipo de contrato. Quatro sinais do Informe Trimestral concluídos
  nesta sessão (vacância, indexador, concentração, resultado financeiro)
  — nenhum ainda consumido fora da ingestão, população adiada até a
  Fase 5, mesmo padrão das entradas anteriores.

## DEC-080 — Sprint 16, Fase 2 (parte 6): WALE + correção de notação científica

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: quinto e último sinal desta fatia do Informe Trimestral
  Estruturado — WALE (prazo médio ponderado de vencimento dos contratos),
  citado em `docs/reference/FII_SEGMENTOS_E_METRICAS.md` como "requer
  novo provider CVM trimestral". Fonte: mesma tabela `complemento` do
  indexador (`DEC-077`) — 13 faixas de vencimento
  (`Percentual_Vencimento_Receita_FII_Faixa_*`), já dentro do documento
  já ingerido, sem novo tipo de documento.
- Decisão:
  1. **Metodologia documentada, não dado exato da CVM.** A CVM não
     publica WALE pronto — só as 13 faixas. Média ponderada por receita
     usando o ponto médio de cada faixa (`Ate_3Meses`→1,5 mês,
     `3a6Meses`→4,5 meses, ..., `33a36Meses`→34,5 meses).
     `Acima_36Meses` (faixa aberta, sem limite superior) usa piso
     conservador de 36 meses — subestima o WALE real, nunca superestima.
     `Indeterminado` fica fora do cálculo (numerador e denominador) por
     não ter informação de prazo nenhuma — incluí-lo assumindo qualquer
     prazo seria inventar dado que a CVM não fornece.
  2. **Escala nova: meses x100, não pontos-base.** Diferente dos 4 sinais
     anteriores desta fatia (todos 0-10000 pontos-base), WALE é uma
     duração, não uma fração. Coluna `wale_months_x100` (2 casas
     decimais) — único ponto de escala distinta entre os 5 sinais.
  3. **Bug crítico descoberto e corrigido: notação científica no dado
     real da CVM.** Ao montar o fixture de teste com valores reais da
     HGRU11 para conferir o cálculo manualmente, a linha real trazia
     `Percentual_Vencimento_Receita_FII_Faixa_27a30Meses = "6.8E-05"` —
     confirmado por download direto do
     `inf_trimestral_fii_2026.zip` (13 ocorrências em `imovel`, 2+ em
     `complemento`, certamente mais ao todo). O parser compartilhado
     `parseNullableCvmFiiExactDecimalQuantity`
     (`src/data/fundamentals/cvm/fii/numbers.ts`) usava um regex sem
     suporte a expoente — rejeitaria essa linha real com
     `Invalid CVM FII ...: 6.8E-05`. **Isso não é bug só do WALE**: a
     mesma função é usada por vacância (`DEC-076`), indexador
     (`DEC-077`) e concentração por inquilino (`DEC-078`) — qualquer uma
     dessas, ao processar um fundo real cujo dado caísse em notação
     científica, quebraria em produção. Corrigido na função
     compartilhada (regex estendido para `[eE][+-]?\d+` opcional,
     convertendo mantissa+expoente para a mesma representação
     `{unscaledValue, scale}` já usada, incluindo o caso de expoente
     positivo que exige completar zeros à direita). `parseNullableCvmFiiMoney`
     e `parseNullableCvmFiiNonNegativeInteger` não foram alterados —
     valores monetários grandes e contagens de cotistas não têm exposição
     real a essa notação nos dados observados.
  4. **Nenhum novo tipo de documento, nenhuma nova migration de
     leitura.** WALE reaproveita o `complement` row já parseado para o
     indexador — só estendi `CvmFiiTrimestralComplementRow` com um mapa
     `maturityRevenueShare` (13 chaves) e os headers obrigatórios do CSV.
  5. **Mesmo record, mesmo storage, sexta migration incremental** no
     mesmo padrão das cinco anteriores — 1 coluna nova
     (`wale_months_x100`, CHECK 0-120000 = até 100 anos, generoso),
     exigida nula nos outros 3 ramos do CHECK de metadados. Merge de
     `database.types.ts` feito bloco por bloco novamente (padrão da
     `DEC-079`, sem repetir o erro da `DEC-078`).
- Verificação: `tsc --noEmit` limpo, `eslint` limpo nos arquivos tocados.
  Suíte completa — 152/152 arquivos, 2324/2324 testes. Cobertura nova
  inclui um arquivo de teste dedicado antes inexistente
  (`cvm/fii/numbers.test.ts`, 16 testes) especificamente para a correção
  de notação científica — mantissa com e sem ponto decimal, expoente
  positivo e negativo, `e`/`E` maiúsculo e minúsculo. WALE real da
  HGRU11 verificado batendo exatamente 3587 (35,87 meses), conferido por
  script Node independente antes de escrever a asserção. Migration
  aplicada em produção (`vxjrncwfysglinfktifz`); `generate_typescript_types`
  reexecutado; `get_advisors` sem aviso novo (mesmos três avisos
  pré-existentes de sempre).
- Consequências: `docs/ROADMAP.md` atualizado — WALE marcado concluído,
  Fase 2 do Informe Trimestral Estruturado praticamente fechada (só falta
  tipo de contrato, texto livre sem flag estruturada, fora do escopo
  desta fatia). Cinco sinais do Informe Trimestral concluídos nesta
  sessão (vacância, indexador, concentração, resultado financeiro, WALE)
  — nenhum ainda consumido fora da ingestão, população adiada até a
  Fase 5. A correção de notação científica é a mudança mais importante
  desta entrada: sem ela, a ingestão real de qualquer um dos 5 sinais
  poderia falhar silenciosamente em produção para fundos cujo dado
  caísse nessa notação.

## DEC-081 — Sprint 16, Fase 3: cotas emitidas de ação (composicao_capital)

- Data: 4 de agosto de 2026
- Status: Aceita e implementada
- Contexto: primeira entrada da Fase 3 (providers ação). Fecha o Sprint 16
  Fase 2 (Informe Trimestral de FII) e abre a Fase 3 com o insumo mais
  citado pelo rascunho de pontuação para ações: cotas emitidas, base de
  LPA e P/L. Fonte: tabela `composicao_capital` do DFP/ITR, confirmada com
  download real (`dfp_cia_aberta_composicao_capital_2025.csv`,
  `itr_cia_aberta_composicao_capital_2026.csv` — ambas existem, mesmo
  formato).
- Decisão:
  1. **Tabela estruturalmente diferente das demonstrações contábeis.**
     `composicao_capital` não tem `CD_CVM` (só `CNPJ_CIA` — casamento por
     CNPJ, não por código CVM como as demais), não tem
     `CD_CONTA`/`DS_CONTA`/`VL_CONTA` (colunas fixas de quantidade:
     `QT_ACAO_ORDIN_CAP_INTEGR`, `QT_ACAO_PREF_CAP_INTEGR`,
     `QT_ACAO_TOTAL_CAP_INTEGR`, mais as 3 variantes de tesouraria), e o
     nome do arquivo não segue o padrão `_con_YYYY.csv` das demonstrações
     — fica fora de `readCvmConsolidatedDocuments`/`parseCvmStatementCsv`
     de propósito, em módulo novo (`capitalComposition.ts`) com parser e
     seletor de filing próprios (`readCvmCapitalCompositionDocument` em
     `archive.ts`).
  2. **Qual quantidade representa o ticker negociado, verificado com dado
     real, não assumido.** Novo campo `CvmBrazilianStockCompany.shareClass`
     (`'ON' | 'PN' | 'unit-total'`). Confirmado nesta sessão com a linha
     real de cada uma das 5 empresas do universo: BBAS3 (ON=5.730.834.040,
     PN=0), WEGE3 (ON=4.197.317.998, PN=0) e PSSA3 (ON=646.586, PN=0) só
     têm classe ON — usam ON. ITSA4 tem as duas classes
     (ON=3.853.634, PN=7.360.053) mas o ticker do universo negocia a PN —
     usa PN. TAEE11 é unit (ON=590.714, PN=442.783, total=1.033.497) —
     bundle de ON+PN, usa o total. Errar essa classificação corromperia
     LPA/P-L silenciosamente (nenhum erro de parsing, só número errado) —
     por isso verificado contra dado real antes de codificar, mesmo
     padrão já usado para `asset_type`/`asset_segment` de FII (`DEC-074`)
     e `shareClass` errado seria exatamente o tipo de erro de categoria
     que `docs/reference/ACOES_BR_SETORES_E_METRICAS.md` alertou (seção
     3.2, armadilha de múltiplas classes).
  3. **Nenhuma coluna nova — reaproveita `issued_shares_unscaled`/
     `issued_shares_scale`.** Essas colunas já existiam (usadas por
     `cvm-fii-inf-mensal`) com a mesma representação `ExactDecimalQuantity`
     — quantidade de ações também não tem componente fracionário nos
     dados reais observados (scale sempre 0, mas o tipo aceita fração por
     consistência de domínio, não porque haja uma aqui). A migration desta
     entrada só remove a exigência de NULL dessas 2 colunas do ramo
     `brazilian-stock` do CHECK de metadados — os outros 3 ramos
     continuam exigindo NULL como antes.
  4. **Campo de domínio (`BrazilianStockFundamentalFacts.issuedShares`)
     tornado obrigatório, não opcional — ao contrário de
     `asset_type`/`asset_segment` (`DEC-074`).** A diferença de julgamento
     documentada naquela entrada (opcional quando o ripple custaria mais
     que o ganho) não se aplica aqui: o ripple ficou contido em ~8 sites
     de fixture de teste, valor pequeno e previsível — optou-se por
     tornar obrigatório para forçar todo call-site futuro a decidir
     explicitamente o valor, em vez de esquecer silenciosamente.
  5. **`composicao_capital` casado de forma independente das
     demonstrações contábeis, não pelo mesmo filing.** A data/versão da
     composição de capital pode divergir da data/versão do DRE/BPA/BPP do
     mesmo trimestre (arquivos publicados em datas diferentes) — a seleção
     usa a data mais recente disponível de `composicao_capital`
     isoladamente, casada só por CNPJ e nome oficial, sem exigir
     coincidência com `exerciseOrder` do filing financeiro (que nem existe
     nesta tabela).
- Verificação: `tsc --noEmit` limpo, `eslint` limpo. Suíte completa —
  153/153 arquivos, 2348/2348 testes. Cobertura nova em 3 camadas:
  `capitalComposition.test.ts` (parser dedicado, novo), `provider.test.ts`
  (describe block dedicado — ON puro, PN, unit-total, provenance real,
  fundo sem composição casando o filing, versão mais recente antes de
  comparar, filing ambíguo, nome divergente), `archive.test.ts` (extração
  do documento, arquivo ausente, arquivo duplicado),
  `supabaseFundamentalSnapshots.test.ts` (round-trip escrita/leitura,
  rejeição de par null/não-null divergente em ambas as direções). Dois
  testes pré-existentes precisaram de atualização mecânica por causa do
  campo `issuedShares` ter virado obrigatório (`supabaseRealEstateFundSnapshots.test.ts`
  e `ingestCvmBrazilianStocks.test.ts`) — corrigidos, sem mudança de
  comportamento. Migration aplicada em produção
  (`vxjrncwfysglinfktifz`); `get_advisors` sem aviso novo (mesmos três
  avisos pré-existentes de sempre); nenhuma regeneração de tipos
  necessária (colunas já existiam).
- Consequências: `docs/ROADMAP.md` atualizado — Fase 3 iniciada, cotas
  emitidas concluída. Resta na Fase 3: decidir a fonte de dividendo/JCP
  (checar CVM IPE antes de construir fonte nova) — não iniciado. Nenhum
  consumidor ainda lê `issuedShares` para calcular LPA/P-L de fato —
  cálculo derivado fica para a Fase 5 (motor de score), mesmo padrão de
  ingestão-antes-de-consumo já estabelecido nas entradas anteriores desta
  sessão.

## DEC-082 — Sprint 16, Fase 3: dividendo/JCP via CVM IPE (Relatório Proventos)

- Data: 5 de agosto de 2026
- Status: Aceita e implementada
- Contexto: segunda entrada da Fase 3, resolve a pergunta explicitamente
  deixada em aberto em `docs/reference/ACOES_BR_SETORES_E_METRICAS.md`,
  seção 6.2: "não verifiquei nesta sessão se o parser atual já mapeia
  [dividendo/JCP] — fica como item a checar antes de assumir que
  dividendo de ação já flui pelo pipeline existente."
- Decisão:
  1. **Resposta: sim, a categoria existe, e não, não estava mapeada.**
     Download real de `ipe_cia_aberta_2026.csv` (feed oficial CVM IPE)
     confirmou 55 valores distintos de `Categoria` — entre eles
     `Relatório Proventos`, com linhas reais para BBAS3
     (`00.000.000/0001-91`) e PSSA3 (`02.149.205/0001-69`) neste ano.
     `categoryMapping.ts` (`src/data/context/official-events/cvm/ipe/`)
     já tinha um mapeamento fechado de 14 categorias para os 8 tipos de
     evento do domínio, mas `Relatório Proventos` não estava entre elas —
     caía no `default: return null` e era descartada silenciosamente.
     `dividend-or-distribution` já existia como tipo de evento no domínio
     (`taxonomy.ts`) e já tinha label na camada de apresentação
     (`presentation.ts`: "Provento ou distribuição") — só nunca era
     emitido porque nenhuma categoria real apontava pra lá. Um teste
     existente (`provider.test.ts`, "never emits event types outside the
     closed approved mapping") até _proibia_ explicitamente esse tipo de
     evento, documentando o estado "ainda não implementado" com um teste
     que passava por ausência, não por design.
  2. **Mudança de uma linha no mapeamento fechado, não um provider
     novo.** `case 'Relatório Proventos': return 'dividend-or-distribution'`
     — o provider CVM IPE já cobre Fato Relevante/Comunicado ao Mercado
     para as mesmas 5 empresas do universo; dividendo/JCP passa a fluir
     pelo mesmo pipeline sem nova fonte de dados, sem nova migration
     (evento de ocorrência, não valor monetário — não toca
     `fundamental_snapshots`).
  3. **Escopo explícito: ocorrência do evento, não o valor do provento.**
     `Relatório Proventos` no CVM IPE aponta pra um documento/link, não
     traz o valor do dividendo/JCP como campo estruturado (`Tipo`/
     `Especie`/`Assunto` vêm vazios nessa categoria no dado real). Extrair
     o valor exigiria abrir o PDF referenciado — fora do escopo desta
     entrada, que só resolve "sabemos que o evento aconteceu e quando",
     não "quanto foi pago". Consistente com o que `official_asset_events`
     já faz para os outros tipos de evento (metadados, não dado
     financeiro estruturado).
- Verificação: `tsc --noEmit` limpo, `eslint` limpo. Suíte completa —
  153/153 arquivos, 2349/2349 testes. `Relatório Proventos` adicionado ao
  `CATEGORY_CASES` do teste de mapeamento fechado (cobertura idêntica às
  outras 14 categorias); removido da lista de tipos proibidos no teste
  "never emits event types outside the closed approved mapping" — as
  outras 5 proibições (`other-official-event`, `earnings-release`,
  `capital-structure-change`, `management-change`,
  `merger-acquisition-or-reorganization`) continuam vetadas, ainda sem
  categoria real mapeada. Nenhuma migration necessária (mudança é só
  código de mapeamento, não schema).
- Consequências: `docs/ROADMAP.md` atualizado — item de dividendo/JCP da
  Fase 3 resolvido. Fase 3 (providers ação) agora só tem cotas emitidas
  (`DEC-081`) e dividendo/JCP (`DEC-082`) concluídos nesta sessão — não há
  mais itens abertos conhecidos nela pelos documentos de referência
  atuais. Fases 4-9 do Sprint 16 seguem não iniciadas.

## DEC-083 — Sprint 16, Fase 4: providers ETF bloqueados, premissa corrigida

- Data: 5 de agosto de 2026
- Status: Aceita — decisão é **não implementar** nada nesta entrada, e
  documentar por quê, em vez de forçar código sobre premissa não
  verificada ou tomar decisão de dependência/credencial sem o usuário.
- Contexto: ao começar a Fase 4 (providers ETF), a primeira linha do
  `docs/ROADMAP.md` dizia "expandir parser SEC N-PORT para NAV por cota e
  cotas em circulação (campo já existe no formulário)". Antes de escrever
  qualquer parser novo, segui a mesma disciplina de "verificar contra
  fonte real antes de codificar" já aplicada a todas as entradas
  anteriores desta sessão — e a premissa se mostrou falsa.
- Decisão:
  1. **NAV por cota/cotas em circulação: não existe no N-PORT, ponto
     final.** Baixado um filing NPORT-P real da VOO direto da SEC
     (CIK `0000036405`, accession `0000036405-26-000325`,
     `primary_doc.xml` completo, não uma amostra) e listadas todas as
     tags XML distintas presentes no documento — cerca de 90 tags
     cobrindo `fundInfo` (`totAssets`/`totLiabs`/`netAssets`,já cobertos
     desde `DEC-051`), holdings (`invstOrSec`, derivativos, etc.) e
     `monthlyTotReturns`/`monthlyReturnCats` (retorno percentual mensal
     por classe, não cotas nem NAV). Nenhuma tag de NAV-por-cota ou
     cotas-em-circulação existe no formulário. A premissa do roadmap
     estava simplesmente errada — meses atrás alguém assumiu que o campo
     existia sem verificar contra o XML real, e essa suposição nunca foi
     testada até agora.
  2. **Não implementado — corrigido o roadmap em vez de inventar dado.**
     Sem o campo na fonte, não há o que expandir no parser N-PORT para
     essa métrica. `docs/ROADMAP.md` reescrito para registrar o achado
     (economiza a próxima sessão de repetir a mesma investigação) em vez
     de manter a instrução original, que levaria a outra tentativa de
     implementação sobre premissa falsa.
  3. **Shiller/Yale CAPE — fonte real, mas decisão de dependência não
     tomada.** Confirmado que `ie_data.xls` (Yale, ~1,6 MB) está
     publicamente acessível sem chave (`HTTP 200`, `Content-Type:
application/vnd.ms-excel`) — mas é `.xls` binário legado (formato
     OLE2/BIFF, não XML como `.xlsx`), não parseável com o padrão já
     usado no projeto (parser de texto/CSV/XML próprio, sem dependência
     externa). Adicionar uma biblioteca de parsing binário — ou escrever
     um parser BIFF próprio — é decisão de escopo/dependência maior que
     as fatias anteriores desta sessão, que não tomei sozinho.
  4. **FRED `DFII10` — bloqueio real de credencial, não código.** A API
     do FRED exige chave gratuita cadastrada pelo usuário — não é algo
     que um agente pode obter ou contornar. Sem a chave, não há
     implementação possível, só o esqueleto do provider esperando por
     ela (baixo valor sem poder testar contra dado real, quebrando a
     disciplina desta sessão inteira de verificar contra fonte real antes
     de declarar algo pronto).
  5. **Loop pausado aqui, não forçado adiante.** As três decisões
     restantes da Fase 4 exigem informação ou escolha que só o usuário
     tem (nova fonte de dado para NAV/cotas, aprovação de dependência
     nova para `.xls`, chave de API do FRED) — continuar codificando
     qualquer uma delas sem essa decisão seria trabalho descartável ou
     uma escolha de arquitetura unilateral que as sessões anteriores
     deste projeto sempre levaram para confirmação explícita (ver
     `DEC-051`, `DEC-066`, entre outras).
- Verificação: nenhuma mudança de código nesta entrada — achado
  verificado por download real e inspeção completa das tags XML, não por
  suposição. Suíte, typecheck e lint permanecem no estado da `DEC-082`
  (153/153 arquivos, 2349/2349 testes), intactos.
- Consequências: `docs/ROADMAP.md` atualizado com o achado e os 3
  bloqueios explícitos. Fase 4 fica pausada até o usuário decidir: (a)
  pesquisar outra fonte para NAV/cotas de ETF, (b) aprovar uma dependência
  para parsing de `.xls`, e/ou (c) fornecer uma chave de API do FRED.
  Sprint 16 Fases 5-9 (motor de score, integração, dossiê, docs, testes)
  seguem não iniciadas e não dependem destes 3 itens — são o próximo
  candidato natural de continuação caso o usuário prefira não resolver os
  bloqueios da Fase 4 agora.

## DEC-084 — Sprint 16, Fase 4: CAPE (Shiller P/E) do S&P 500

- Data: 5 de agosto de 2026
- Status: Aceita e implementada — um dos 3 bloqueios da `DEC-083`, resolvido
  após o usuário aprovar explicitamente (via `AskUserQuestion`) adicionar
  uma dependência de parsing `.xls` para este item específico. Os outros
  dois bloqueios (NAV/cotas de ETF via SEC N-PORT, FRED `DFII10`)
  permanecem não resolvidos e não fazem parte desta entrada.
- Contexto: `ie_data.xls` (Robert Shiller, Yale) é a fonte pública padrão
  do CAPE (cyclically adjusted P/E) do S&P 500 — usado como sinal de
  valuation de mercado agregado, não um fato por-ativo. É `.xls` binário
  legado (OLE2/BIFF), não `.xlsx`/XML, e portanto não parseável com os
  parsers de texto próprios já usados no projeto (CSV/XML da CVM e SEC).
- Decisão:
  1. **Dependência nova: `xlsx` (SheetJS).** Primeira dependência externa
     de parsing do projeto além de `fflate` (zip) — todo o resto usa
     parser próprio. Justificada porque reimplementar um parser BIFF a
     mão está fora do orçamento desta fatia; aprovação explícita do
     usuário registrada antes de instalar (`npm install xlsx --save`).
  2. **Tabela nova `market_valuation_ratios`, não reuso de
     `market_reference_rates` (`DEC-075`).** CAPE é um múltiplo
     adimensional sem conceito de vencimento; `market_reference_rates` tem
     `maturity_date not null`, que não tem sentido semântico para CAPE.
     Forçar o dado nessa tabela violaria a mesma disciplina de "não force
     um dado numa forma de schema que não bate semanticamente" já aplicada
     ao mapeamento de categoria/tipo de FII nesta sessão. Mesmo padrão de
     segurança de `market_reference_rates`: sem `user_id`, RLS
     autenticado-somente-leitura, escrita só via RPC
     `upsert_market_valuation_ratios_v1` (`SECURITY DEFINER`, lote ≤20,
     validação de forma exata das chaves, `pg_advisory_xact_lock`,
     `service_role` com INSERT/UPDATE/DELETE/TRUNCATE revogados no fim da
     migration).
  3. **Fetch fora do `safeFetch` de `official-events`.** O host da Yale
     (`econ.yale.edu`) só serve HTTP — confirmado por falha de conexão TLS
     — e não está no allowlist HTTPS-only de
     `OFFICIAL_EVENTS_ALLOWED_HOSTS_V1`, que é específico do bounded
     context de eventos oficiais. O padrão já estabelecido pelos demais
     providers de fundamentos (CVM, SEC, Tesouro Transparente) — `fetch`
     injetável com URL oficial hardcoded, sem passar por `safeFetch` — é o
     que se aplica aqui; usar HTTP puro para este host não é uma violação
     de política de segurança do projeto, é a única forma de acessar essa
     fonte pública específica.
  4. **Data do Shiller decodificada como float `AAAA.MM`, com quirk de
     zero à esquerda.** O mês não é sempre 2 dígitos: outubro colapsa de
     `2020.10` para `2020.1` como float (mesmo valor numérico, zero à
     direita insignificante) — confirmado contra uma série real completa
     de 12 meses. `year = Math.floor(date)`, `month = Math.round((date -
year) * 100)`.
  5. **`valueScaled` via `Math.round`, não parsing exato de texto — exceção
     documentada à disciplina de BigInt/decimal exato do resto do
     projeto.** Células numéricas do `xlsx` são `float` IEEE754 puro, sem
     texto-fonte exato para parsear (diferente de CSV/XML, onde sempre há
     uma string original). Aceitável porque CAPE não tem exigência legal
     ou financeira de exatidão (diferente de dinheiro ou contagem de
     cotas).
  6. **Um valor por ingestão: sempre o mais recente.** O provider extrai
     apenas a linha cronologicamente mais recente do arquivo (não o
     histórico completo) — mesmo padrão de "snapshot atual" já usado para
     outras séries de mercado agregadas.
  7. **CLI wiring**: `scripts/lib/buildFundamentalsIngestionPlan.ts` ganhou
     o provider `shiller-cape` (sem flags extras); `scripts/run-fundamentals-ingestion.ts`
     ganhou o branch de despacho correspondente e o preview agora reporta
     `targetTable: 'market_valuation_ratios'` para este provider
     especificamente (os demais continuam com `fundamental_snapshots`).
- Verificação: migration `20260805100000_create_market_valuation_ratios.sql`
  aplicada em produção (projeto `vxjrncwfysglinfktifz`) via `apply_migration`;
  `generate_typescript_types` confirmou a tabela e a função novas;
  `get_advisors` (tipo `security`) não apontou nenhum problema novo (mesmos
  4 avisos pré-existentes). Tipos manualmente mesclados em
  `src/lib/database.types.ts`. 5 arquivos de teste novos (`shiller/xls.test.ts`,
  `shiller/archive.test.ts`, `shiller/provider.test.ts`,
  `supabaseShillerCapeSnapshots.test.ts`, `ingestShillerCape.test.ts`, mais
  1 teste adicionado a `buildFundamentalsIngestionPlan.test.ts`). Suíte
  completa: 158/158 arquivos, 2374/2374 testes passando. Typecheck limpo
  em `tsconfig.app.json` e `tsconfig.node.json` (o único erro do segundo é
  pré-existente em `vite.config.ts`, não relacionado a esta entrada). Lint
  com 1 erro pré-existente em `src/pages/SettingsPage.tsx` (não tocado
  nesta sessão, não relacionado a esta entrada).
- Consequências: Fase 4 fica com 1 de 3 bloqueios resolvidos (CAPE). NAV/cotas
  de ETF via SEC N-PORT (sem fonte alternativa conhecida) e FRED `DFII10`
  (sem chave de API) seguem bloqueados, sem nova tentativa sem direção do
  usuário. Por aprovação explícita do usuário, a sessão segue direto para
  Sprint 16 Fase 5 (motor de score) em vez de insistir nos 2 bloqueios
  restantes.

## DEC-085 — Sprint 16, Fase 5, fatia 1: motor de score para FII tijolo

- Data: 5 de agosto de 2026
- Status: Aceita e implementada — primeira fatia da Fase 5, fatiada por
  classe de ativo por escolha explícita do usuário (`AskUserQuestion`: a
  Fase 5 completa cobre ~10 sinais em 3 classes de ativo, integração no
  laço guloso, dossiê, documentação e testes — grande demais para uma
  entrada só, mesma disciplina de fatiamento já usada em Fases 2-4).
- Contexto: `DEC-068` desenhou o mecanismo (score ajusta prioridade via
  `desvioAjustado = desvioCandidato − (score × peso)`, com trava de
  segurança) mas nunca foi implementado — `buildFundamentalFactsV1.ts` só
  expunha `vacancyInBasisPoints` para FII, e `listRealEstateFundSnapshots`
  filtrava deliberadamente `source='cvm-fii-inf-mensal'`, ignorando as
  linhas trimestrais (vacância, concentração, WALE) ingeridas nas Fases 2-3
  — comentário explícito no código apontava para esta fase: "leitura de
  vacância fica para quando o motor de score (Fase 5) precisar dela".
- Decisão, em três partes:
  1. **Leitura combinada mensal + trimestral.** `RealEstateFundFundamentalFacts`
     ganha `tenantConcentrationInBasisPoints` e `waleMonthsScaledBy100` (o
     terceiro, `vacancyInBasisPoints`, já existia desde a `DEC-076`).
     `listRealEstateFundSnapshots` passa a consultar as duas fontes
     (`.in('source', [...])` em vez de `.eq`) e escolhe o mapper por
     `source` — `mapRealEstateFundSnapshotRow` (mensal) ou o novo
     `mapRealEstateFundTrimestralSnapshotRow`. `buildFundamentalFactsV1.ts`
     e `buildFundamentalDerivedFactsV1.ts` tinham validação hard-coded que
     só aceitava `source='cvm-fii-inf-mensal'`/`period='monthly'` para FII
     — corrigida para aceitar também `cvm-fii-inf-trimestral`/`quarterly`.
  2. **Motor de score, fatia FII tijolo.** `src/domain/fundamentals/score/`
     (`buildFiiTijoloScoreV1`, puro, sem I/O) calcula os 3 sinais de FII
     tijolo com dado já ingerido e sem depender de cotação de mercado:
     vacância financeira, concentração do maior inquilino, WALE. Regime
     errado (FII papel/FOF, `assetType !== 'tijolo'`) sempre produz
     `status: 'wrong-regime'` para os 3 sinais, nunca um número — mesmo
     erro de fundo que a `DEC-068` corrigiu (tratar papel como tijolo)
     não pode voltar a acontecer silenciosamente. Dado ausente produz
     `status: 'missing-input'`, nunca 0 silencioso. Regras vêm de
     `SignalRuleV1[]` (mesma forma do `SignalRule` de repositório,
     repetida como tipo de domínio puro para não acoplar o motor ao
     contrato de repositório) — `DEFAULT_FII_TIJOLO_SIGNAL_RULES` documenta
     as faixas de partida do rascunho, convertidas para
     `minValue`/`maxValue` com min inclusivo e max exclusivo (convenção
     documentada para não haver ambiguidade de fronteira).
  3. **WALE como substituto documentado da "receita vencendo em 24 meses".**
     O rascunho original pede um bucket de receita por vencimento que não
     foi ingerido (Fase 2 ingeriu WALE em meses, métrica correlata mas
     não idêntica). Direção do sinal invertida (WALE mais longo = menos
     risco de vacância por vencimento = pontos positivos) e limiares
     (24/48 meses) marcados como ponto de partida tão arbitrário quanto os
     do rascunho original — o próprio documento já diz "limiares numéricos
     são ponto de partida proposto... edite livremente", então este é o
     tipo de substituição que o documento antecipa, não uma invenção
     silenciosa de dado.
  4. **P/VP e spread de DY ficam fora desta fatia, por decisão de escopo,
     não por bloqueio de dado.** P/VP precisa combinar o NAV/cota já
     derivado (`FiiNetAssetValuePerIssuedShareInputs`) com cotação de
     mercado — integração ainda não escrita. Spread de DY precisa do valor
     do provento, que a `DEC-082` só ingeriu como evento (data/título/link
     do Fato Relevante), não o valor numérico. Ambos ficam `unavailable`
     por enquanto — marcados explicitamente no rascunho, não escondidos.
  5. **Mecanismo de integração no laço guloso.** `ContributionInput` ganha
     `assetScores?: ContributionAssetScore[]` e
     `scoreWeightInBasisPoints?: number`, ambos opcionais — ausentes,
     `targetAllocationStrategy.ts` se comporta byte-a-byte como antes da
     Fase 5 (suíte de 34 testes existente passou sem nenhuma mudança).
     Quando presentes: dentro do laço, cada candidato afordável tem seu
     `candidateDeviation` calculado como sempre (BigInt exato); em
     paralelo, se `scoreWeightInBasisPoints > 0`, candidatos que já melhoram
     o desvio (`compareDeviation(candidateDeviation, currentDeviation) < 0`,
     ou qualquer um na primeira compra de carteira vazia) entram num
     segundo ranking por `deviationInBasisPoints(candidateDeviation) −
(score × peso)` — o candidato de menor rank ajustado é escolhido no
     lugar do candidato de menor desvio bruto. A conversão para
     pontos-base (via `deviationInBasisPoints`, já testado) evita misturar
     a fração exata `numerator/total` usada na trava com a escala de score
     — só a _escolha de qual candidato_ muda; o desvio real usado nas
     iterações seguintes continua sendo o valor exato do candidato
     escolhido, nunca o valor ajustado. Trava de segurança inalterada: o
     `stopReason: 'no-improving-purchase'` é decidido depois da escolha,
     comparando o desvio real (não ajustado) do candidato escolhido contra
     o desvio atual — testado explicitamente (`'never overrides
no-improving-purchase, even with a high score on the losing asset'`).
- Verificação: 12 testes novos (`buildFiiTijoloScoreV1.test.ts`: 9; 4 novos
  em `targetAllocationStrategy.test.ts` cobrindo comportamento inalterado
  sem score, reordenação de empate exato por score, score neutralizado com
  peso zero, e a trava de segurança) mais os testes de leitura combinada
  mensal/trimestral em `supabaseRealEstateFundSnapshots.test.ts`. Suíte
  completa: 159/159 arquivos, 2392/2392 testes passando. Typecheck limpo.
  Lint e format limpos.
- Consequências: `docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md` e
  `docs/ROADMAP.md` atualizados com o status real (3 sinais de FII tijolo
  implementados; P/VP, DY, ação e ETF pendentes). Próxima fatia natural:
  P/VP de FII (precisa combinar NAV/cota derivado com cotação de mercado,
  dado já existe nas duas pontas) ou a próxima classe de ativo (ação ou
  ETF) — decisão do usuário quando a Fase 5 continuar.

## DEC-086 — Sprint 16, Fase 5/6: P/VP de FII e conexão do motor de score ao aporte real

- Data: 5 de agosto de 2026
- Status: Aceita e implementada — fecha o P/VP pendente da `DEC-085` e
  conecta o motor ao fluxo real de aporte, revisando deliberadamente um
  isolamento arquitetural do Sprint 4 que não fazia mais sentido depois do
  Sprint 16.
- Decisão, em três partes:
  1. **P/VP de FII, quarto sinal da fatia 1.** `computeFiiPvpScaledV1`
     (`src/domain/fundamentals/score/computeFiiPvpScaledV1.ts`) combina o
     VP por cota já derivado (`FiiNetAssetValuePerIssuedShareInputs`,
     existente desde a Fase 1) com a cotação de mercado mais recente, em
     `BigInt` exato (mesma disciplina do resto do domínio — nunca ponto
     flutuante em razão financeira), escalado por
     `FUNDAMENTAL_RATIO_SCALE` (1e6), mesma convenção dos outros
     derivados. `buildFiiTijoloScoreV1` ganha o parâmetro opcional
     `derivedAsset` (fatos derivados, para o VP por cota) e
     `latestMarketPriceInMinorUnits` — ausentes, o sinal fica
     `unavailable`/`missing-input`, nunca um número inventado.
  2. **Motor conectado ao fluxo real de aporte, não só testado em
     isolamento.** `useContributionData.ts` ganha
     `loadContributionAssetScoresBestEffort`: lê os snapshots trimestrais
     de FII via `createSupabaseRealEstateFundSnapshotRepository` (leitura,
     `data/fundamentals`), monta `FundamentalFactsV1`/
     `FundamentalDerivedFactsV1` com os builders puros de domínio
     (`buildFundamentalFactsV1`/`buildFundamentalDerivedFactsV1`), semeia
     as faixas default de `signal_rules` na primeira vez que o usuário usa
     o motor (`getMissingDefaultFiiSignalRules` — identidade por
     `signalKey` inteiro: se o usuário já tem qualquer regra para um
     sinal, os defaults daquele sinal não são reinseridos, tratado como já
     customizado), lê `score_weight_basis_points` de `user_preferences`
     (`DEC-074`, default 50) e calcula o score por ativo
     (`buildContributionAssetScoresV1`). Tudo isso é **best-effort**, mesmo
     padrão de `refreshMarketDataBestEffort`/`explainContributionPlanBestEffort`
     já usados no mesmo arquivo: qualquer falha (dossiê indisponível, RPC
     de `signal_rules` fora do ar, etc.) retorna score vazio e peso zero —
     nunca trava a simulação de aporte. `assetScores`/
     `scoreWeightInBasisPoints` passam por `useContribution.ts` até
     `NewContributionPage.tsx`, que os encaminha para `calculateContribution`.
  3. **Boundary de isolamento do Sprint 4 revisado, não contornado.**
     `src/features/fundamentals/boundary.test.ts` continha, desde o
     commit `6618cce` (28/07/2026, quando fundamentos era só apresentação,
     "sem score/ranking/recomendação"), uma checagem que proibia qualquer
     menção à palavra "fundamentals" nos fluxos financeiros críticos
     (`contribution`/`portfolio`/`history`) — proteção correta _para aquele
     momento_, mas que hoje conflita diretamente com o objetivo explícito
     da Fase 5/6 (`DEC-068`): o motor de score _precisa_ ler dado de
     fundamentos para pontuar candidatos no laço guloso. Descoberto ao
     rodar a suíte completa após o wiring — não foi contornado nem
     enfraquecido sem entender a causa: a checagem foi reescrita para
     proibir especificamente a feature de apresentação opcional
     (`features/fundamentals`) e o runtime read-only dela
     (`application/context/fundamentals/runtime`, que tem seu próprio
     `boundary.test.ts` garantindo que nunca é importado por fluxo
     financeiro crítico) — o que continua proibido, sem exceção. O que
     passa a ser permitido, e é exatamente o caminho usado por esta
     entrada: os builders puros de domínio (`domain/fundamentals`) e o
     repositório de leitura (`data/fundamentals`), nunca o runtime nem a UI
     de apresentação. Pausei o trabalho e confirmei com o usuário antes de
     tocar num teste de arquitetura que não escrevi nesta sessão
     (`AskUserQuestion`) — resposta: atualizar o boundary, com decisão
     documentada.
- Verificação: 2 arquivos de teste novos
  (`computeFiiPvpScaledV1.test.ts`: 5 testes;
  `buildContributionAssetScores.test.ts`: 7 testes), mais testes novos em
  `buildFiiTijoloScoreV1.test.ts` (7, cobrindo P/VP) e
  `useContributionData.test.ts` (4, cobrindo semeadura de regras e
  degradação best-effort). Suíte completa: 161/161 arquivos, 2415/2415
  testes passando. Typecheck, lint e format limpos. Build de produção
  verificado (`npm run build`). Fluxo de aporte testado manualmente no
  navegador em modo demo (estratégia "Plano técnico multiativos", com
  `assetScores` vazio por padrão em demo) — sem erro de console, resultado
  técnico idêntico ao comportamento pré-Fase 5, confirmando que o
  parâmetro opcional não quebra o caminho que não o usa. O caminho real
  autenticado (leitura de `signal_rules`/fundamentos/preferências) não foi
  verificado em produção nesta entrada — cai sob o mesmo best-effort que
  já protege `refreshMarketDataBestEffort`.
- Consequências: fatia 1 de FII (Fase 5) fica com 4 de 5 sinais prontos e
  conectados ao motor real — só falta spread de DY sobre NTN-B, bloqueado
  em dado (valor do provento). Próximas fatias naturais: extrair o valor
  do provento (desbloqueia o 5º sinal de FII), ou a próxima classe de
  ativo (ação ou ETF) — decisão do usuário.

## DEC-087 — Sprint 16, Fase 7: score exposto no dossiê técnico

- Data: 5 de agosto de 2026
- Status: Aceita e implementada
- Contexto: o dossiê técnico (`TechnicalDossierV1`, consumido pela
  explicação de IA) carregava desde o Sprint 8 uma limitação explícita
  (`technical-ranking-not-exposed-v1`, ainda válida — o dossiê não expõe o
  histórico de candidatos avaliados a cada iteração do laço guloso), mas
  não tinha nenhum campo para o score em si, que agora existe e influencia
  a escolha de compra (`DEC-085`/`DEC-086`). Sem esse campo, a IA
  explicaria o plano técnico sem poder mencionar por que um FII foi
  priorizado sobre outro com desvio parecido.
- Decisão: `TechnicalDossierV1` ganha `signals: TechnicalDossierAssetSignals[]`
  — um item por ativo com score calculado (`assetId`, `ticker`,
  `totalPoints`, `signals[]`), cada sinal achatado em campos opcionais
  (`status`, `observedValue`/`points` quando `applied`,
  `unavailableReason` quando `unavailable`) em vez do union discriminado
  do domínio (`AssetScoreSignal`) — o dossiê é JSON simples consumido pela
  explicação de IA, não precisa do union. `BuildTechnicalDossierV1Input`
  ganha `assetFundamentalScores?: readonly AssetScoreV1[]`, opcional:
  ausente, `signals` sai `[]`, mesmo comportamento de antes desta entrada
  — nenhum teste existente quebrou. `useContributionData.ts` passa
  `assetFundamentalScores` (a forma completa, com a quebra por sinal) para
  `buildTechnicalDossierV1` dentro de `explainContributionPlan`; o laço
  guloso continua recebendo só a forma reduzida (`assetId`/`points`, via
  novo `toContributionAssetScores`) porque é tudo que
  `targetAllocationStrategy.ts` precisa. Ativo sem score calculado
  simplesmente não aparece em `signals` — mesmo critério de "ausência, não
  zero forçado" do resto do domínio de fundamentos; um score que referencia
  um `assetId` fora da lista de ativos conhecidos é descartado
  silenciosamente (defensivo, não deveria acontecer com os dados reais do
  fluxo).
- Verificação: 3 testes novos em `buildTechnicalDossierV1.test.ts`
  (signals vazio por padrão, achatamento de sinal aplicado/indisponível,
  descarte de score de ativo desconhecido) e 1 em
  `buildContributionAssetScores.test.ts` (`toContributionAssetScores`);
  testes existentes de `buildContributionAssetScoresV1` atualizados para o
  novo retorno (`AssetScoreV1[]` completo, não mais `{assetId,points}`).
  Suíte completa: 161/161 arquivos, 2419/2419 testes passando. Typecheck,
  lint e format limpos. Boundary tests de fundamentos (`DEC-086`)
  continuam passando sem alteração — `technicalDossier` importa só
  `domain/fundamentals/score` (builders puros), nunca o runtime nem a UI.
- Consequências: Fase 5-7 (motor, integração, dossiê) completas para a
  fatia FII tijolo. Restam: Fase 8 (docs — `PRODUCT.md`, `ARCHITECTURE.md`,
  revisar `no-fundamental-score`/`no-technical-plan-modification`, ambos
  desatualizados desde a `DEC-085`) e Fase 9 (testes adicionais de
  determinismo/segurança do laço guloso, já parcialmente cobertos pelos
  testes de `DEC-086`). Fora da Fase 5-9: spread de DY de FII (bloqueado em
  dado), ação e ETF (nenhum sinal ainda), NAV/cotas de ETF e FRED
  (bloqueados desde `DEC-083`).

## DEC-088 — Sprint 16, Fase 8: revisão de documentação desatualizada pelo motor de score

- Data: 5 de agosto de 2026
- Status: Aceita e implementada
- Contexto: `docs/ROADMAP.md` (item 8) já apontava `no-fundamental-score`,
  `no-technical-plan-modification` e `technical-ranking-not-exposed-v1`
  como códigos de limitação a revisar depois do motor de score. Na
  revisão, achado mais amplo do que o esperado: `PRODUCT.md` e
  `ARCHITECTURE.md` tinham várias afirmações que eram verdade quando
  escritas (Sprint 4-8) e se tornaram falsas com o Sprint 16 — não só nas
  limitações formais, mas em prosa descritiva ("fundamentos não modificam
  o Motor V2", "não há P/L, P/VP... ranking ou score", "a tabela global
  `fundamental_snapshots` continua vazia"). Achado também, sem relação com
  score: `PRODUCT.md` e `ARCHITECTURE.md` ainda diziam que a composição
  real de fundamentos permanecia `disabled`, quando na verdade está
  `read-only` em produção desde `DEC-060` (28 dias antes desta entrada) —
  dívida documental já existente, não introduzida pelo Sprint 16, corrigida
  no mesmo passe por estar no mesmo parágrafo.
- Decisão: revisão cirúrgica, não reescrita. Cada afirmação falsa foi
  corrigida apontando exatamente qual objeto continua com a limitação
  original (ex.: `FundamentalFactsV1`/`FundamentalDerivedFactsV1`, os
  contratos em si, continuam sem campo de score — o score é um módulo
  separado e downstream, `src/domain/fundamentals/score`, que consome
  esses fatos) em vez de simplesmente apagar a limitação. Afirmações ainda
  verdadeiras foram mantidas sem alteração — em particular,
  `technical-ranking-not-exposed-v1` e as frases correspondentes em
  `ARCHITECTURE.md`/`PRODUCT.md` continuam válidas: o motor ainda não expõe
  o histórico completo de candidatos avaliados a cada iteração do laço
  guloso, só o resultado final priorizado por score. `PRODUCT.md` ganhou
  uma seção nova, "Motor de score (Sprint 16)", resumindo o estado atual
  (fatia FII tijolo, 4 de 5 sinais, best-effort, exposto no dossiê) em vez
  de espalhar esse resumo em vários parágrafos preexistentes.
  `ARCHITECTURE.md` ganhou um parágrafo equivalente na seção de
  apresentação opcional de fundamentos, deixando explícito que aquela
  página (`/fundamentos`) continua isolada do motor de score — o score só
  aparece no fluxo de aporte.
- Verificação: nenhuma mudança de comportamento — só descrição em
  `PRODUCT.md`, `ARCHITECTURE.md` e nas mensagens de `limitations` de
  `buildFundamentalFactsV1.ts`/`buildFundamentalDerivedFactsV1.ts` (só os
  textos; os códigos, já testados por nome exato em
  `buildFundamentalFactsV1.test.ts`/`buildFundamentalDerivedFactsV1.test.ts`,
  não mudaram). Suíte completa: 161/161 arquivos, 2419/2419 testes
  passando, sem nenhum ajustado. Typecheck, lint e format limpos.
- Consequências: fecha a Fase 8 do plano de Sprint 16 para a fatia FII
  tijolo já implementada. Cada nova fatia (P/VP de ação, ETF, spread de DY)
  vai reabrir a mesma dívida documental nos mesmos arquivos — registrar
  isso explicitamente para a próxima sessão não esquecer de repetir esta
  revisão.

## DEC-089 — Sprint 16, Fase 9: frescor por fonte (estado `stale`) no motor de score

- Data: 5 de agosto de 2026
- Status: Aceita e implementada
- Contexto: o item 9 do roadmap listava "sinal `unavailable`/`stale` não
  quebra cálculo" como item de teste — mas `stale` nunca tinha sido
  implementado como comportamento, só previsto em texto na `DEC-068`
  ("o estado `stale` de cada sinal precisa de limiar por fonte, não um
  número global"). `AssetScoreSignal` só tinha `applied`/`unavailable` até
  esta entrada — dado desatualizado (CVM Trimestral de 8 meses atrás, por
  exemplo) seria tratado como `applied` normal, pontuando com um número
  velho sem qualquer sinalização.
- Decisão: escolha explícita de limiar, pausada para confirmação com o
  usuário antes de implementar (`AskUserQuestion` — frescor de fonte é
  julgamento de negócio, não mecânica determinística) — resposta: seguir
  com limiar padrão.
  1. **`CVM_FII_TRIMESTRAL_STALE_AFTER_DAYS = 180`**
     (`src/domain/fundamentals/score/staleness.ts`) — ponto de partida
     documentado como tal, não medição formal: cobre 1 ciclo trimestral
     de publicação normal mais 1 trimestre de folga para atraso. Mesmo
     espírito de "limiar editável, não verdade definitiva" já usado para
     os limiares de WALE (`DEC-085`) e as faixas de P/VP (`DEC-086`).
     `isReferenceDateStale(referenceDate, now, staleAfterDays)`: idade em
     dias inteiros (sem ponto flutuante), `now` é parâmetro injetado —
     nunca `Date.now()` interno, mesma disciplina de relógio explícito do
     resto do projeto (`now: () => new Date().toISOString()` em toda
     composição real).
  2. **`AssetScoreSignal` ganha o status `stale`** — `signalKey`,
     `observedValue`, `referenceDate`, `staleAfterDays`. Contribui 0
     pontos pro `totalPoints` (igual `unavailable`), mas expõe o valor
     observado — dado velho não pontua, mas não é escondido: o dossiê
     técnico (`DEC-087`) pode mostrar "sinal existe, está desatualizado
     desde X", diferente de "sinal nunca existiu".
  3. **`buildFiiTijoloScoreV1` ganha o parâmetro `now: string`,
     obrigatório.** Aplica-se aos 3 sinais trimestrais (vacância,
     concentração, WALE) e ao P/VP (que depende do VP por cota derivado
     do Informe Mensal, com sua própria `referenceDate` — a cotação de
     mercado em si não tem dimensão de frescor nesta camada). Quebra a
     assinatura da função (todo `now` passou a ser exigido) — atualizado
     em cascata: `buildContributionAssetScoresV1` (recebe `now` e repassa),
     `useContributionData.ts` (usa o mesmo `now` já lido para
     `buildFundamentalFactsV1`, sem ler o relógio duas vezes), e o dossiê
     técnico (`TechnicalDossierAssetSignal` ganha `status: 'stale'`,
     `referenceDate`, `staleAfterDays`).
- Verificação: `staleness.test.ts` (6 testes, incluindo fronteira exata de
  180 dias), 4 testes novos em `buildFiiTijoloScoreV1.test.ts` (sinal
  trimestral stale, P/VP stale, stale não conta pontos, fronteira exata
  fica `applied`), 1 teste novo em `buildTechnicalDossierV1.test.ts`
  (achatamento do `stale` com `points: null`). Suíte completa: 162/162
  arquivos, 2430/2430 testes passando. Typecheck, lint e format limpos.
- Consequências: fecha o item 9 do roadmap para a fatia FII tijolo — os 4
  sinais implementados agora cobrem `applied`/`stale`/`unavailable`
  explicitamente, nunca um número velho silencioso. Sprint 16 Fases 5-9
  completas para FII tijolo (4 de 5 sinais; spread de DY segue bloqueado
  em dado). Próxima fatia natural: ação, ETF, ou desbloquear o valor do
  provento de FII — decisão do usuário.

## DEC-090 — Sprint 16, Fase 5: ROE de ação + fechamento do inventário de sinais

- Data: 5 de agosto de 2026
- Status: Aceita e implementada — usuário pediu explicitamente terminar a
  Fase 5 por completo. Decisão, nesta entrada: implementar tudo que é
  tecnicamente viável com o dado já ingerido (ROE) e documentar, com
  motivo específico e verificado, cada um dos 6 sinais restantes que não
  são — em vez de forçar um número sobre premissa fraca só para marcar a
  fase como "completa".
- Decisão, em duas partes:
  1. **ROE implementado — único sinal de ação tecnicamente pronto hoje.**
     `computeStockRoeScaledV1` (`src/domain/fundamentals/score/`) —
     lucro líquido ÷ patrimônio líquido, `BigInt` exato, mesma disciplina
     de `computeFiiPvpScaledV1`. Usa patrimônio líquido de fim de período
     (não a média início+fim da fórmula acadêmica) — simplificação
     pragmática documentada no código, mesma prática de calculadoras
     públicas quando só há um snapshot por período disponível.
     `buildBrazilianStockScoreV1` aplica regime via `Asset.assetSegment`:
     `wrong-regime` para holding pura (ITSA4), aplicável aos demais
     (banco, seguradora, regulado, industrial) — ROE é a métrica mais
     universal da lista justamente por funcionar nos três regimes com
     patrimônio/lucro no mesmo sentido contábil
     (`ACOES_BR_SETORES_E_METRICAS.md`, 3.3). `DEFAULT_STOCK_SIGNAL_RULES`
     segue a mesma convenção min-inclusivo/max-exclusivo já usada em
     `defaultFiiSignalRules.ts`. `buildContributionAssetScoresV1`
     estendido para rotear por categoria (FII tijolo → `buildFiiTijoloScoreV1`,
     ação → `buildBrazilianStockScoreV1`) e `useContributionData.ts`
     passa a buscar snapshots de ação (`createSupabaseFundamentalSnapshotRepository`)
     junto dos de FII. Seed de `signal_rules` (`getMissingDefaultFiiSignalRules`,
     nome mantido por compatibilidade histórica do símbolo) agora cobre
     as faixas default de ambas as classes.
  2. **Os 6 sinais restantes ficam bloqueados, cada um com motivo
     verificado e específico — não a mesma causa genérica:**
     - **Payout de ação** — precisa do valor do provento; `DEC-082` só
       ingeriu o evento (data/título/link do Fato Relevante), não o
       número. Mesmo bloqueio do spread de DY de FII.
     - **Dívida líquida/EBITDA** — dívida financeira e depreciação/
       amortização não são extraídas do DFP/ITR hoje
       (`BrazilianStockFundamentalFacts` não tem esses campos). Não é
       falta de motor, é falta de provider — pesquisa de conta contábil
       real por empresa ainda não feita (mesmo tipo de trabalho da Fase
       2/3, não desta fase).
     - **P/L vs série histórica** — o mecanismo de cálculo é trivial
       (preço/EPS por período), mas só há 1-2 períodos ingeridos por
       empresa até agora. Um quartil de amostra com 1-2 pontos não é
       estatisticamente confiável — bloqueio de profundidade histórica
       real, não de engenharia.
     - **CAPE de ETF vs média de 10 anos** — achado ao investigar: a
       ingestão do Shiller (`DEC-084`) **descarta o histórico**. O
       arquivo baixado (`ie_data.xls`) contém a série completa desde
       1871, mas `extractShillerCapeRecord` deliberadamente extrai só o
       ponto mais recente (decisão correta _para o que a Fase 4 pedia
       então_ — só o valor atual). Calcular uma média de 10 anos precisa
       reingerir guardando o histórico, escrever um repositório de
       leitura de `market_valuation_ratios` (só o de escrita existe) e
       criar um módulo de score de ETF inteiro (nenhum existe ainda) —
       escopo de uma fatia própria, não um ajuste desta entrada.
     - **Spread de DY sobre TIPS (VNQ)** — segue bloqueado por chave de
       API do FRED, sem mudança desde `DEC-083`.
     - **Prêmio/desconto sobre NAV (ETF)** — segue bloqueado: o campo não
       existe no N-PORT, verificado por download real de filing
       (`DEC-083`), sem fonte alternativa conhecida.
- Verificação: 2 arquivos de teste novos
  (`computeStockRoeScaledV1.test.ts`: 7 testes;
  `buildBrazilianStockScoreV1.test.ts`: 9 testes, incluindo regime,
  `stale`, dado ausente e seleção do snapshot mais recente), mais testes
  novos em `buildContributionAssetScores.test.ts` (score de ação real,
  ETF sem sinal, seed combinado FII+ação) e ajustes nos testes existentes
  de seed que agora esperam as faixas das duas classes. Suíte completa:
  164/164 arquivos, 2449/2449 testes passando. Typecheck, lint e format
  limpos.
- Consequências: Fase 5 fechada no sentido literal pedido — todo sinal
  tecnicamente viável com o dado real já ingerido está implementado (5 de
  12: 4 de FII, 1 de ação). Os 7 restantes têm blockers reais e
  documentados, não “ainda não fizemos”. Trabalho futuro claro por
  blocker: extrair valor de provento (desbloqueia payout de ação + DY de
  FII de uma vez), pesquisar contas de dívida/D&A no DFP/ITR (desbloqueia
  dívida/EBITDA), acumular mais períodos de ingestão (desbloqueia P/L
  histórico com o tempo, sem trabalho novo), reingerir Shiller com
  histórico + módulo de score de ETF (fatia própria), chave FRED e nova
  fonte de NAV de ETF (decisões do usuário).

## DEC-091 — Sprint 16, Fase 5: valor de provento confirmado bloqueado + CAPE de ETF implementado

- Data: 5 de agosto de 2026
- Status: Aceita e implementada
- Contexto: usuário pediu explicitamente para extrair o valor do provento
  (desbloquearia spread de DY de FII e payout de ação, `DEC-090`). Em vez
  de assumir a partir da nota já registrada em `DEC-082`/`ACOES_BR_SETORES_E_METRICAS.md`,
  seção 6.2 ("extrair o valor exigiria ler o PDF/link"), esta entrada
  verificou de novo, com dado real baixado, se algum dataset estruturado
  novo tinha aparecido.
- Decisão, em duas partes:
  1. **Valor de provento — bloqueio reconfirmado com dado real, não
     assumido.** Uma busca inicial sugeriu um dataset CVM chamado
     `fre_cia_aberta_distribuicao_dividendos` — baixado o ZIP real
     (`fre_cia_aberta_2026.zip`, 34 arquivos) e conferido: esse arquivo
     não existe; o nome real mais próximo,
     `fre_cia_aberta_distribuicao_capital`, é estrutura societária (free
     float, nº de acionistas PF/PJ), não valor de dividendo — a sugestão
     da busca era imprecisa. Verificado também o Informe Mensal de FII
     (`geral`/`complemento`/`ativo_passivo`, os 3 únicos CSVs do pacote) e
     o DFIN de FII (`dfin_fii_2026.csv`, que é só índice de links pra
     documentos, sem linha estruturada). Nenhum dos três tem o valor do
     provento. Conclusão: o bloqueio documentado em `DEC-083`/`ACOES_BR_SETORES_E_METRICAS.md`
     estava correto — segue sem fonte estruturada, tanto pra FII quanto
     pra ação. B3 tem o dado, mas só via chamada interna não documentada
     (mesmo tipo de fonte não-oficial já rejeitado pra notícias,
     `DEC-036`) — não usado, mantendo o padrão de fonte regulatória
     oficial e estruturada do resto do projeto.
  2. **CAPE de VOO vs própria média de 10 anos — desbloqueado e
     implementado.** Ao investigar o bloqueio de ETF documentado em
     `DEC-090`, achado que o próprio arquivo do Shiller (`ie_data.xls`)
     já contém a série completa desde 1871 — a ingestão da `DEC-084` só
     descartava tudo exceto o ponto mais recente, decisão correta _para o
     que a Fase 4 pedia então_, mas não uma limitação da fonte.
     `extractShillerCapeHistoryV1` (`src/data/fundamentals/shiller/provider.ts`)
     extrai 11 anos de histórico (folga de 1 ano sobre a janela de 10
     anos usada no cálculo). `createSupabaseShillerCapeHistoryRepository`
     (`supabaseShillerCapeSnapshots.ts`) é o primeiro repositório de
     leitura de `market_valuation_ratios` — só `SELECT`, sob a mesma RLS
     autenticado-only da `DEC-084`. `upsertMany` do storage de escrita
     passou a quebrar em lotes de até 20 (limite do RPC, `DEC-084`) porque
     11 anos mensais somam ~132 linhas. `computeEtfCapeDeviationV1`
     calcula desvio = CAPE atual − média (`BigInt` exato, arredondamento
     half-away-from-zero, janela de 10 anos incluindo o ponto mais
     recente — convenção documentada, não inferida em silêncio).
     `buildInternationalEtfScoreV1` aplica o sinal só a VOO
     (`indice-amplo-us`) — VNQ e VEA recebem `wrong-regime`, nunca um
     número. Frescor próprio (`SHILLER_CAPE_STALE_AFTER_DAYS = 60`,
     Shiller publica mensalmente com pouco atraso, limiar mais apertado
     que o trimestral da CVM). `buildContributionAssetScoresV1` roteia
     ETF antes da checagem de `factsAsset` — CAPE não depende de
     `fundamental_snapshots`, vem de uma fonte de mercado agregada
     separada.
- Verificação: 5 arquivos de teste novos (`computeEtfCapeDeviationV1.test.ts`:
  6 testes; `buildInternationalEtfScoreV1.test.ts`: 6 testes; testes
  adicionados em `provider.test.ts`, `ingestShillerCape.test.ts` e
  `supabaseShillerCapeSnapshots.test.ts` para histórico, batching e
  leitura), mais testes atualizados em `buildContributionAssetScores.test.ts`
  e `useContributionData.test.ts` para as 3 classes de sinal seedadas.
  Suíte completa: 166/166 arquivos, 2472/2472 testes passando. Typecheck,
  lint e format limpos. Nenhuma escrita em produção nesta entrada (a
  reingestão real do histórico do Shiller exige rodar o CLI com
  `--confirm`, não executado nesta sessão).
- Consequências: Fase 5 fica com 6 de 12 sinais implementados (4 FII + 1
  ação + 1 ETF). Restam bloqueados: payout de ação e spread de DY de FII
  (sem fonte estruturada, `DEC-091`), dívida/EBITDA de ação (provider
  novo), P/L histórico de ação (profundidade de amostra), spread DY/TIPS
  de ETF (chave FRED) e prêmio/desconto NAV de ETF (campo ausente no
  N-PORT). Próximo passo prático antes do sinal de CAPE valer para um
  usuário real: rodar `npx tsx scripts/run-fundamentals-ingestion.ts
--provider=shiller-cape --confirm` para popular o histórico em produção
  — sem isso, `capeHistory` chega vazio e o sinal fica `unavailable`.

## DEC-093 — Sprint 16, Fase 4: provider FRED DFII10 (taxa TIPS de referência)

- Data: 6 de agosto de 2026
- Status: Aceita e implementada
- Contexto: usuário pediu para resolver o bloqueio de FRED (spread de DY de
  VNQ sobre TIPS 10 anos, `docs/reference/ETF_INTERNACIONAL_SEGMENTOS_E_METRICAS.md`
  seção 4.2, item 6.2) fornecendo a própria chave de API.
- Decisão: segunda série de `market_reference_rates` (`fred-dfii10`), mesmo
  padrão global da NTN-B (`DEC-075`). `maturity_date` passou a aceitar
  `null`, restrito por CHECK à série sem título real por trás — DFII10 é
  rendimento sintético de maturidade constante (10-Year TIPS, Constant
  Maturity), sem bond específico com vencimento, diferente da NTN-B
  (sempre "o título IPCA+ de vencimento mais longo disponível", com
  `maturity_date` real). Inventar uma data de vencimento violaria o
  princípio de não criar dado que a fonte não fornece. `fredProvider.ts`
  aceita valor **negativo** (rendimento real do TIPS já foi negativo
  historicamente) — diferente de `decimalToExchangeRateScaled` (preço,
  câmbio, NTN-B), positivo por contrato; parser dedicado (`parseFredDfii10Percent`)
  com sinal, mesma escala de 6 casas e arredondamento half-away-from-zero.
  Observações `"."` (dia sem publicação) ignoradas em favor da mais
  recente disponível. Contador `updatedReferenceRates`/
  `skippedFreshReferenceRates` do cron passou a ser compartilhado entre as
  duas séries.
  - **Escopo explícito: só a taxa TIPS, não o sinal de score.** O spread
    DY de VNQ sobre TIPS continua bloqueado — DY depende do valor do
    provento, mesmo bloqueio confirmado em `DEC-091` pra FII/ação. Este
    ciclo só guarda a taxa como infraestrutura, mesmo padrão da Fase 2
    (NTN-B chegou primeiro; vacância/WALE vieram depois).
  - Migration `20260806120000` aplicada em produção via MCP Supabase.
    Secret `FRED_API_KEY` configurado pelo usuário no painel (Project
    Settings → Edge Functions → Secrets, sem MCP pra isso — mesmo padrão
    do `OPENROUTER_API_KEY`, `DEC-056`). Edge Function `refresh-market-data`
    reimplantada (versão 13). Verificado com dado real em produção:
    `fred-dfii10` inserida com sucesso, DFII10 = 2,40% (2026-08-04) — a
    primeira tentativa de smoke test retornou 500 (mesmo padrão
    intermitente já presente na versão anterior da função, não
    relacionado a esta mudança); a segunda completou em produção (~25s,
    dentro da faixa normal de execução) e confirmou a linha inserida.
- Verificação: `fredProvider.test.ts` novo (parsing positivo/negativo/
  arredondamento/observação ausente, seleção da mais recente, montagem de
  URL, propagação de erro sem vazar a chave). `core.test.ts` ganhou seção
  "reference rate (FRED DFII10)" espelhando a cobertura de NTN-B; seção
  NTN-B existente ajustada pro contador compartilhado. Suíte completa:
  2505/2519 passando (14 falhas pré-existentes, migration/CRLF,
  confirmadas em clone limpo antes da mudança). `eslint` limpo.
- Consequências: infraestrutura de FRED pronta e operacional em produção.
  O sinal de score em si (`etf_dy_spread_over_tips`, item 4.2 do rascunho
  de pontuação) segue fora do motor até o valor do provento ter fonte —
  ver `DEC-091`/`DEC-094`.

## DEC-094 — Sprint 16, Fase 5: dívida líquida/EBITDA de ação implementado

- Data: 6 de agosto de 2026
- Status: Aceita e implementada
- Contexto: usuário pediu para avançar no próximo item codável da Sprint 16. `docs/reference/ACOES_BR_SETORES_E_METRICAS.md` seção 6.3 e
  `REGRAS_DE_PONTUACAO_RASCUNHO.md` linha do sinal diziam "requer provider
  novo" — verificado de novo com dado real antes de assumir: a premissa
  estava errada, os insumos vêm do mesmo `dfp_cia_aberta`/`itr_cia_aberta`
  já consumido por `cvm-stocks`, só campos ainda não extraídos.
- Decisão: baixado e inspecionado o DFP 2025 real (`dados.cvm.gov.br`)
  para os 5 tickers do universo, confirmando 4 linhas novas:
  - `BPP_con` `2.01.04`/`2.02.01` "Empréstimos e Financiamentos"
    (circulante/não circulante) — código soma automaticamente débito +
    debêntures + arrendamento financeiro (confirmado: valor do grupo =
    soma dos filhos em todos os 5 tickers).
  - `BPA_con` `1.01.01` "Caixa e Equivalentes de Caixa".
  - `DRE_con` `3.05` "Resultado Antes do Resultado Financeiro e dos
    Tributos" (EBIT) — código e descrição confirmados **idênticos** entre
    ITSA4, TAEE11, WEGE3 e PSSA3, mesmo padrão de universalidade já
    confirmado pro `3.11` (lucro líquido, Fase 1 original).
  - `DFC_MI_con`, linha de depreciação/amortização na reconciliação do
    lucro antes dos impostos — código de conta **varia por empresa**
    (`6.01.01.02` WEGE3, `6.01.01.06` ITSA4, `6.01.01.03` TAEE11/PSSA3),
    só a descrição é estável: allowlist fechada de 3 variantes reais
    ("Depreciação, Amortização e Exaustão", "Depreciação e Amortização",
    "Depreciações"). Confirmado que nenhum dos 5 tickers reporta por
    `DFC_MD` (método direto, sem a linha de reconciliação) — só `DFC_MI`.
  - **Banco (BBAS3) usa os mesmos códigos de conta pra conceitos
    estruturalmente diferentes** — `2.01.04`/`1.01.01` existem no dado
    real do banco, mas com descrição "Depósitos"/"Caixa", não
    "Empréstimos e Financiamentos"/"Caixa e Equivalentes de Caixa". Os 5
    fatos ficam `null` pra banco por regime errado, não por dado ausente
    — `selectOptionalFact` (nova variante de `selectFact` que devolve
    `null` em vez de lançar quando zero candidatos batem a descrição,
    preservando a rejeição de ambiguidade) formaliza essa diferença sem
    inventar dado nem tratar "banco" como anomalia.
  - `computeStockNetDebtToEbitdaScaledV1` (mesma disciplina de
    `computeStockRoeScaledV1`: `BigInt` exato, arredondamento
    half-away-from-zero, escala `FUNDAMENTAL_RATIO_SCALE`) calcula
    `(dívida circulante + não circulante − caixa) ÷ (EBIT + D&A)`. EBITDA
    não positivo lança (razão de alavancagem sem sentido pra empresa
    queimando caixa operacional) — o sinal degrada pra `unavailable` em
    vez de propagar, mesmo espírito best-effort do resto do motor.
    `buildBrazilianStockScoreV1` ganha o sinal `stock_net_debt_to_ebitda`,
    regime errado só pra banco (diferente de ROE, que não se aplica a
    holding) — cada sinal tem seu próprio regime. Faixas de pontuação
    (`DEFAULT_STOCK_SIGNAL_RULES`): >3x −1, <1x +1, 1x-3x neutro
    (`docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md`, seção 3.5).
  - 5 colunas novas em `fundamental_snapshots`
    (`financial_debt_current_minor`, `financial_debt_noncurrent_minor`,
    `cash_and_equivalents_minor`, `ebit_minor`,
    `depreciation_and_amortization_minor`), todas nullable — migration
    `20260806130000` aplicada em produção via MCP Supabase, `get_advisors`
    sem achado novo.
- Verificação: `computeStockNetDebtToEbitdaScaledV1.test.ts` novo (7
  testes). `buildBrazilianStockScoreV1.test.ts` reescrito — array de
  sinais passa a ter 2 posições, cobertura de aplicado (3 faixas), regime
  errado (banco), input ausente, EBITDA não positivo degradado e stale.
  `provider.test.ts` ganha novo describe com dado fixture espelhando os
  códigos/descrições reais confirmados, incluindo teste de ambiguidade
  rejeitada. `supabaseFundamentalSnapshots.test.ts` atualizado (29 colunas
  canônicas, antes 24). Suíte completa: 2526/2540 passando (14 falhas
  pré-existentes, migration/CRLF, não relacionadas). `tsc -b` e `eslint`
  limpos.
- Consequências: Fase 5 fica com 8 de 12 sinais implementados (4 FII + 2
  ação + 2 ETF). Único sinal de ação restante sem fonte codável no
  momento: payout (mesmo bloqueio de provento, `DEC-091`) e P/L
  histórico (profundidade de amostra).
- **Atualização (06/08/2026, mesmo dia):** backfill real das 8 linhas de
  ação existentes em produção (ITSA4/TAEE11/WEGE3/PSSA3 × DFP+ITR — BBAS3
  fica `null` por regime errado, correto) aplicado via `UPDATE` SQL
  direto pelo MCP Supabase, não pelo CLI de ingestão — o CLI exige
  `SUPABASE_SERVICE_ROLE_KEY`, que o agente não manuseia. Valores reais
  extraídos do DFP 2025 e do ITR 2025 (baixados e inspecionados nesta
  sessão) reaproveitando exatamente `reference_date`/`filing_version`/
  `exercise_order` de cada linha já persistida — provenance mesclada via
  `provenance || jsonb_build_object(...)`, preservando os 5 campos
  originais intactos. Confirmado com dado real plausível: WEGE3 em
  posição de caixa líquido (dívida líquida negativa, score +1), ITSA4
  com alavancagem moderada (~0,35x, score +1). Usuário aprovou
  explicitamente o UPDATE direto (fora do pipeline de ingestão
  versionado) depois do classificador de permissão bloquear a primeira
  tentativa. `get_advisors` (security) sem achado novo depois do
  UPDATE.

## DEC-095 — Sprint 16 pós-encerramento: backfill de cotas emitidas + dois extratores de PDF pra valor de provento

- Data: 6 de agosto de 2026
- Status: Aceita, parcialmente implementada (ver "Consequências")
- Contexto: usuário pediu pra investigar como resolver os 4 sinais que
  ficaram de fora do encerramento da Sprint 16 (spread DY de FII,
  payout e P/L histórico de ação, spread DY de ETF).
- Decisão, em três partes:
  1. **Backfill real de `composicao_capital` — concluído.** As 10 linhas
     de ação já persistidas (5 tickers × DFP/ITR) tinham
     `issued_shares_unscaled`/`scale` `null` mesmo com o provider já
     extraindo esse campo desde `DEC-081` — a ingestão original que
     gerou essas linhas rodou antes daquele ciclo. Valores reais
     confirmados baixando `dfp_cia_aberta_composicao_capital_2025.csv`
     e `itr_cia_aberta_composicao_capital_2025.csv` de novo nesta
     sessão (BBAS3 5.730.834.040 ON, ITSA4 7.360.053/7.215.738 PN,
     TAEE11 1.033.497 total ambos, WEGE3 4.197.317.998 ON, PSSA3
     646.586 ON) e aplicados via `UPDATE` direto pelo MCP Supabase,
     mesmo padrão de aprovação explícita da `DEC-094`. `get_advisors`
     sem achado novo. Resolve uma das três peças que faltavam pro
     sinal de P/L histórico (a outra é preço de fechamento por data,
     via B3 COTAHIST histórico, não investigado nesta entrada).
  2. **Extrator de prosa (Fato Relevante/Aviso aos Acionistas) —
     implementado, PR #156.** Primeiro parser de texto livre do
     projeto, aprovado explicitamente pelo usuário como risco aceito.
     `extractProventoValuePerShareV1` só aceita declaração ÚNICA (um
     valor bruto + um líquido "por ação"), falha fechada em qualquer
     formato de ratificação com múltiplas tranches. Verificado com 3
     documentos reais (ITSA4, PSSA3 × 2).
  3. **Fonte melhor achada e implementada — PR #157.** Investigando a
     categoria IPE `Relatório Proventos` (mapeada desde `DEC-082`,
     nunca backfillada em produção), achado que a CVM gera um PDF de
     **template fixo** próprio chamado "Provento" — tabela por ISIN
     com valor bruto, período base, exercício social, data de
     pagamento. `extractProventoFormV1` extrai essa tabela (blocos
     fixos de 5 linhas por ISIN no texto do `pdf-parse`). **Cross-
     validado**: valor de PSSA3 extraído deste formulário
     (`0,48320810620`) bate exatamente com o mesmo trimestre extraído
     independentemente da prosa (item 2) — duas fontes, mesmo número
     real. Nova dependência `pdf-parse` (JS puro, sem vulnerabilidade
     nova, aprovada explicitamente).
  4. **Risco de duplicata real descoberto e evitado.** Selecionar
     evento pelas categorias já em produção
     (`material-fact`/`market-communication`/`regulatory-filing`)
     duplica contagem em 3 dos 5 tickers — mesma declaração de JCP
     reportada 2 a 4 vezes sob tipos de filing diferentes (confirmado
     consultando `official_asset_events` real em produção). A
     categoria dedicada `dividend-or-distribution` não tem esse
     problema — confirmado construindo os 65 eventos reais (5 tickers,
     2025-2026) localmente com o provider já testado
     (`fetchCvmIpeStockEvents` + `prepareOfficialAssetEventStorageBatchV1`):
     zero duplicata interna.
- Verificação: `extractProventoValuePerShareV1.test.ts` (8 testes),
  `extractProventoFormV1.test.ts` (6 testes) — 14 testes novos, `tsc -b`
  e `eslint` limpos, suíte completa 2540/2554 (14 falhas pré-existentes
  não relacionadas). `composicao_capital`: conferido por consulta
  somente-leitura em produção, 10/10 linhas populadas corretamente.
- Consequências: **nenhum dos 4 sinais foi conectado ainda** — os dois
  extratores existem isolados, testados, sem wiring. Backfill real da
  categoria `dividend-or-distribution` em produção **não foi
  executado** nesta entrada: os 65 registros foram montados e
  validados localmente, mas persistir via SQL direto pelo MCP custaria
  ~65 mil tokens de contexto (cada registro carrega provenance
  completa e a mesma URL repetida em até 3 campos) — decisão de não
  gastar isso e usar o pipeline oficial já testado em vez de um bypass
  manual. Comando pra rodar quando o usuário tiver as credenciais:
  `node --env-file=.env.server.local --import tsx
scripts/run-official-events-backfill.ts --provider=cvm-ipe
--year=2025 --confirm` (repetir com `--year=2026`). Depois disso,
  a dedup por "Protocolo Provento" + Versão (mesmo padrão de
  `selectLatestFilingRows` do DFP/ITR) e a agregação trailing-12-meses
  (usuário já confirmou: qualquer trimestre não parseável marca o sinal
  inteiro `unavailable`, nunca soma parcial) ainda precisam ser
  escritas antes de qualquer um dos 4 sinais existir de fato. Preço de
  fechamento histórico por data (peça restante do P/L) também não foi
  investigado nesta entrada.

## DEC-096 — Sprint 16 pós-encerramento: backfill de eventos abandonado por custo de contexto; viabilidade de preço histórico confirmada

- Data: 6 de agosto de 2026
- Status: Aceita — duas conclusões de pesquisa, nenhuma implementação de código
- Contexto: continuação de `DEC-095`. Usuário pediu pra seguir depois
  do backfill de `dividend-or-distribution` não ter sido executado.
- Decisão, em duas partes:
  1. **Tentativa de persistir os 65 eventos via SQL direto pelo MCP —
     abandonada, definitivamente.** Duas tentativas reais confirmaram
     o mesmo resultado: ler/embutir um bloco de só 13 registros (dos 65) já custa ~26 mil tokens de contexto, truncando antes de
     terminar. Provenance completa por registro repete a mesma URL da
     CVM em até 3 campos (`event_id`, `deduplication_key`,
     `canonical_url`, `original_url`, `document_identity_value`),
     inflando cada registro pra ~4 KB. Decisão final: não vale o
     custo, usar o pipeline oficial (`scripts/run-official-events-backfill.ts`,
     comando em `DEC-095`) quando o usuário tiver as credenciais —
     sem alternativa de bypass razoável.
  2. **Dedup por "Protocolo Provento" + Versão não escrito — achado
     um caso real não resolvido.** Investigando 3 filings da ITSA4 no
     mesmo dia (09/02/2026) descobriu-se que são declarações
     genuinamente diferentes (uma "Anual 2025" com 2 valores, outra
     "4º Trimestre 2026" — confirmado baixando os 3 documentos reais),
     não duplicata simples. Mas não foi confirmado se dois desses
     documentos compartilham o mesmo "Protocolo Provento" interno (o
     ID dentro do próprio PDF, usado como chave de versão) — escrever
     a lógica de dedup em cima dessa suposição não confirmada
     repetiria o erro que este projeto sempre evitou (inventar
     comportamento sem dado real). Decisão: só escrever essa lógica
     depois do backfill real rodar, contra dado de produção de
     verdade, não fixture hipotética.
  3. **Preço de fechamento histórico — viabilidade confirmada, não
     implementada.** `COTAHIST_A<ano>.ZIP` da B3 é público, real, e
     usa o mesmo layout de largura fixa já parseado por
     `b3CotahistProvider.ts`/`b3CotahistParser.ts` pro preço atual —
     baixado e conferido o arquivo real de 2025 (89 MB compactado,
     784 MB descompactado): BBAS3 fecha o ano em 30/12/2025 (último
     pregão) a R$ 21,92. Resolve a última peça em aberto do P/L
     histórico (preço casado por data de exercício) — junto com
     `composicao_capital` (`DEC-095`) e mais anos de DFP ingeridos,
     completa os 3 insumos necessários. Nenhum provider ou wiring
     escrito ainda, só a fonte confirmada.
- Verificação: nenhuma mudança de código nesta entrada — só pesquisa
  com dado real baixado e descartado (arquivos temporários limpos do
  scratchpad ao final).
- Consequências: dos 4 sinais pendentes, nenhum ficou mais perto de
  existir de fato nesta entrada — mas o mapa do que falta em cada um
  ficou mais preciso e sem suposição não verificada. Nenhum próximo
  passo de código seguro sem: (a) usuário rodar o backfill oficial
  (`DEC-095`), (b) usuário decidir se aceita mais anos de DFP
  ingeridos e o custo de escrever o provider de preço histórico.

## DEC-097 — Backfill real de `dividend-or-distribution` executado; bug de chunking de persistência corrigido

- Data: 6 de agosto de 2026
- Status: Aceita — bug corrigido, 65 eventos reais persistidos em
  produção
- Contexto: usuário rodou o comando oficial recomendado em `DEC-096`
  (`scripts/run-official-events-backfill.ts --provider=cvm-ipe
--year=2025 --confirm`). Primeira tentativa devolveu
  `"claimedJobs": 0"` — o checkpoint (`official_event_backfill_runs`/
  `..._jobs`) já tinha o job `cvm-ipe:2025` marcado `succeeded` desde
  30/07/2026, antes da categoria `dividend-or-distribution` existir no
  código. `planId`/`planHash` são determinísticos só por
  provider+ano+failureMode+retryFailed+maxAttemptsPerJob (não pela
  categoria mapeada no executor), então o orquestrador reconhece
  "já feito" e devolve o snapshot antigo sem tocar rede nem
  Supabase — confirmado consultando `official_asset_events`
  diretamente (zero linhas da categoria). Checkpoint deletado via SQL
  direto pelo MCP (`DELETE` em produção, aprovado explicitamente pelo
  usuário três vezes — bloqueado duas vezes pelo classificador de
  permissão do Claude Code antes de passar).
- Segunda tentativa (já sem checkpoint velho): fetch real rodou (540
  eventos brutos), mas persistência falhou 100%
  (`persistedAttemptCount: 0`) com erro genérico
  `persistence-failed`. Log da API do Supabase confirmou que o RPC
  `upsert_official_asset_events_v1` nunca foi chamado. Causa raiz
  isolada rodando localmente o provider real
  (`fetchCvmIpeStockEvents`) contra a rede de verdade: o ano de 2025
  produz 540 registros únicos após dedup, acima do limite duro
  `OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1 = 500`
  (`supabaseStorage.ts`). `persistOfficialAssetEventsV1` sempre
  mandava o batch inteiro numa RPC só — **bug real de produção**, não
  falha de rede ou dado malformado: qualquer ano/provider que produza
  mais de 500 eventos únicos nunca conseguiria persistir nada, mesmo
  antes da categoria `dividend-or-distribution` existir (só não tinha
  sido notado porque nenhum job anterior tinha passado de 500).
- Decisão: `persistOfficialAssetEventsV1`
  (`src/data/context/official-events/storage/persist.ts`) ganhou
  parâmetro opcional `maxBatchSize` — fatia `uniqueRecords` em blocos
  e chama `storage.upsertMany` uma vez por bloco, mesclando os
  resultados por índice original. Comportamento default (sem o
  parâmetro) inalterado, preservando os testes existentes que
  validam atomicidade de uma chamada só para storages/fakes
  genéricos. `executor.ts` passa
  `maxBatchSize: OFFICIAL_ASSET_EVENTS_UPSERT_BATCH_LIMIT_V1` só na
  execução real (Supabase). O limite de 500 por chamada RPC em si não
  mudou — continua existindo, só deixou de ser um teto rígido pro job
  inteiro.
- Verificação: 215 testes do módulo `official-events` passando,
  `tsc --noEmit` limpo. Rodado de novo o backfill 2025 (checkpoint
  deletado outra vez, mesmo motivo): `succeededJobs: 1,
persistedAttemptCount: 540`. Rodado 2026 pela primeira vez com o
  código corrigido (checkpoint de uma execução anterior a 28/07, antes
  da categoria existir, também deletado):
  `persistedAttemptCount: 331`. Confirmado em produção via SQL:
  `official_asset_events` tem 65 linhas `dividend-or-distribution`
  (BBAS3 14, ITSA4 13, PSSA3 20, TAEE11 7, WEGE3 11) — bate exatamente
  com a contagem de 65 eventos únicos, sem duplicata, que a
  reconstrução local com o provider real já tinha confirmado em
  `DEC-095`.
- Achado adicional (não resolvido): consultando os eventos reais da
  ITSA4, a coluna `protocol_number` está `null` em todas as 13 linhas
  — o mapeamento atual do `cvm-ipe` não extrai o "Protocolo Provento"
  interno do formulário PDF, só o `numProtocolo`/`numSequencia` do
  URL de download do ENET (que já vira parte da identidade do
  evento). Datas com múltiplos filings no mesmo dia continuam reais
  (4 eventos em 10/02/2025, 3 em 09/02/2026) — a pergunta de dedup por
  protocolo interno de `DEC-096` segue em aberto, agora com uma
  informação a mais: a coluna que serviria pra isso nem está populada
  ainda, então a lógica de dedup exigiria primeiro estender o parser
  do formulário estruturado (`extractProventoFormV1.ts`, `DEC-095`)
  pra capturar esse campo, não só consultar o que já está no banco.
- Consequências: os 3 sinais bloqueados por valor de provento (spread
  DY de FII, payout de ação, spread DY de ETF) agora têm dado bruto
  real em produção pra trabalhar em cima — mas ainda faltam extrair o
  valor por evento (rodar `extractProventoFormV1.ts` contra os PDFs
  reais dessas 65 linhas), dedup por protocolo interno, e agregação
  trailing-12-meses (regra de `unavailable` no primeiro trimestre
  ilegível, confirmada com o usuário em `DEC-095`) antes de qualquer
  sinal de score ficar `applied`.

## DEC-098 — Sprint 13 fechada: teste de interação de cancelamento de compra em `HistoryPage`

- Data: 6 de agosto de 2026
- Status: Aceita
- Contexto: `DEC-072` deixou a Sprint 13 com entrega inicial (`LoginPage`,
  `ForgotPasswordPage`, `ResetPasswordPage`, `PurchaseForm`), faltando o
  único fluxo de orquestração de página inteira ainda sem teste:
  cancelamento de compra em `HistoryPage`.
- Decisão: `src/pages/HistoryPage.test.tsx` criado com 4 testes,
  mockando `useHistoryData` por inteiro via `vi.spyOn` (mesmo padrão de
  `LoginPage.test.tsx`): abre a confirmação e chama `cancelPurchase`
  com sucesso; fecha sem cancelar em "Voltar"; mostra a mensagem de
  erro do repositório quando `cancelPurchase` rejeita; oculta as ações
  de cancelamento em modo demo.
- Achado ao escrever o teste (comportamento real, não bug): a
  confirmação de cancelamento só fecha em caso de sucesso —
  `confirmCancellation` em `HistoryPage.tsx` só chama
  `setPurchaseToCancelId(null)` dentro do bloco `try`, nunca no
  `catch`. Primeira versão do teste assumia fechamento em ambos os
  casos e falhou; corrigida para refletir o comportamento real
  (usuário vê o erro com a confirmação ainda aberta, pode tentar de
  novo ou voltar).
- Achado estrutural: `HistoryTable` (desktop) e `HistoryCards`
  (mobile) renderizam os mesmos botões de ação simultaneamente no DOM
  — responsividade é só CSS (`hidden xl:block` / oposto), não
  montagem condicional. Testes usam `getAllByRole(...)[0]` para os
  botões de ação; não é duplicata acidental.
- Verificação: 4/4 testes novos passando, suíte completa 2544/2558
  (14 falhas pré-existentes de migration/CRLF, mesma baseline
  confirmada em clone limpo, não relacionadas), `tsc --noEmit` limpo.
- Consequências: Sprint 13 fechada por completo — não há mais fluxo de
  interação sem cobertura conhecido. Sprint 14 (reconciliação
  documental) e a integração do wiring de provento pendente
  (`DEC-097`) seguem como próximos itens.

## DEC-099 — Sprint 14 fechada: auditoria final de dead code e reconciliação documental

- Data: 6 de agosto de 2026
- Status: Aceita
- Contexto: `DEC-073` deixou a Sprint 14 com entrega inicial. Faltava uma
  passada final de `knip` + revisão de trechos desatualizados em
  `docs/ARCHITECTURE.md`/`docs/PRODUCT.md` mencionados como pendência no
  próprio `docs/PROJECT_HANDOFF.md`.
- Decisão e achados:
  1. `docs/ARCHITECTURE.md` corrigido: afirmava que o domínio de eventos
     oficiais ficava "sem persistência ou runtime" — falso desde
     `DEC-041` (runtime `read-only` ativo) e reforçado por `DEC-097`
     (backfill real recorrente). Texto agora aponta para as camadas
     irmãs (`src/data`, `src/server`, `src/application`) já em
     produção, preservando que a camada de domínio em si continua pura
     por design.
  2. Achado de cobertura real (não dead code): `fetchProventoDocumentText.ts`
     (`DEC-095`) tinha zero teste e zero consumidor em `src`, aparecendo
     em "Unused files" e arrastando `pdf-parse` para "Unused
     dependencies" no `knip`. Não é código morto — é código novo ainda
     não conectado, aguardando o wiring de `DEC-097`. Teste mínimo
     escrito (`fetchProventoDocumentText.test.ts`, 3 casos: allowlist de
     host `www.rad.cvm.gov.br`, status HTTP não-ok, limite defensivo de
     10 MB). Depois do teste, `knip` parou de sinalizar tanto o arquivo
     quanto `pdf-parse` — confirma que eram falso positivo por falta de
     alcance a partir de um consumidor real, não órfãos de fato.
  3. Confirmados como falso positivo do `knip`, sem ação necessária:
     `tailwindcss` (usado via `@import "tailwindcss"` em
     `src/styles/index.css`, extensão `.css` fora do alcance do `knip`
     por config própria do projeto) e `npm` como dependência não
     listada em três Edge Functions (é o especificador `npm:` do
     runtime Deno, não um pacote chamado literalmente `npm`).
  4. Reconfirmadas, sem mudança: as ~190 reexportações de barrel
     sinalizadas por `DEC-073` continuam não removidas em massa (risco
     de consumidor não mapeado, volume incompatível com revisão
     item-a-item responsável numa sprint) — decisão original mantida,
     não uma nova análise.
- Verificação: `npx knip` rodado do zero e após a mudança; 3 testes
  novos passando; suíte completa e `tsc --noEmit` sem regressão (mesma
  baseline de 14 falhas pré-existentes).
- Consequências: Sprint 14 fechada por completo. Não há mais trecho de
  arquitetura conhecido contradizendo o estado real de produção nem
  código novo desta sessão sem teste. Barrel reexports seguem como
  dívida documentada e deliberada, não pendência esquecida.

## DEC-100 — Sprint 15 (multiusuário) vira `NO-GO` permanente

- Data: 6 de agosto de 2026
- Status: Aceita
- Contexto: Sprint 15 estava condicionada a "somente se houver segundo
  usuário" desde o planejamento do ciclo de prontidão (`DEC-068`).
  Usuário confirmou explicitamente não ter pretensão de segundo usuário.
- Decisão: item retirado do roadmap de sprints ativas, movido para a
  lista de itens permanentemente fora de escopo (mesma categoria de
  notícias editoriais, `DEC-036`). Não reaberto a menos que o próprio
  usuário peça.
- Verificação: nenhuma mudança de código — decisão de escopo pura,
  `docs/ROADMAP.md` atualizado nos dois pontos onde o item aparecia.
- Consequências: das Sprints 13 a 15, restam encerradas 13 (`DEC-098`),
  14 (`DEC-099`) e agora 15 fechada por `NO-GO`, não por entrega. Ciclo
  de prontidão pós-uso (Sprints 9 a 15) está, portanto, completo. Único
  trabalho aberto do projeto é o wiring de provento (`DEC-097`, spread
  DY de FII/ETF e payout de ação) e a profundidade histórica de P/L.

## DEC-101 — Extrator do "Protocolo Provento" resolve a pergunta de dedup deixada em aberto por DEC-096

- Data: 6 de agosto de 2026
- Status: Aceita
- Contexto: `DEC-096`/`DEC-097` confirmaram, com dado real, que múltiplos
  filings ENET no mesmo dia para o mesmo ticker são declarações
  genuinamente diferentes na maioria dos casos, mas não estava confirmado
  se duas submissões diferentes podiam compartilhar uma identidade
  interna de declaração — escrever dedup em cima dessa suposição não
  verificada teria repetido o erro que o projeto sempre evitou.
- Decisão: inspecionado o texto bruto de 5 documentos "Provento" reais
  (ITSA4 x2 do mesmo dia com valor idêntico, BBAS3, TAEE11, WEGE3).
  Confirmado: toda submissão traz, antes da tabela de valores, a linha
  "Protocolo Provento Versão Data Envio" seguida de
  `<protocolo> <versão> <data de envio>`. As duas submissões ITSA4
  (`numProtocolo` ENET 1333427 versão 1 e 1333428 versão 2, valores
  idênticos) compartilham o mesmo Protocolo Provento (`1332829`) — são a
  mesma declaração da empresa, reenviada como correção, não duas
  declarações distintas. `extractProventoDeclarationIdentityV1.ts`
  implementado com o mesmo formato de falha fechada do resto do módulo
  (`null` se o cabeçalho não existir ou o valor seguinte não bater no
  formato exato).
- Verificação: 5 testes novos com fixtures derivadas exatamente do texto
  real capturado (não inventadas), incluindo o caso cruzado
  ITSA4 v1/v2 provando protocolo igual e versão diferente. 22/22 testes
  do módulo `provento` passando, `tsc --noEmit` limpo.
- Consequências: dedup por Protocolo Provento + Versão (mesmo padrão de
  `selectLatestFilingRows` já usado no DFP/ITR — versão mais alta vence)
  agora pode ser escrito contra uma regra confirmada, não uma suposição.
  Próximo passo do wiring de `DEC-097`: schema de armazenamento pro
  valor extraído por evento, depois integração dos 3 sinais de score.
  `extractProventoDeclarationIdentityV1.ts` ainda não tem consumidor em
  produção (esperado — aguarda o mesmo wiring de
  `fetchProventoDocumentText.ts`/`extractProventoFormV1.ts`).

## DEC-102 — Schema de armazenamento pro valor de provento extraído, aplicado em produção

- Data: 6 de agosto de 2026
- Status: Aceita
- Contexto: `DEC-097` deixou o wiring de provento bloqueado por falta de
  schema. `DEC-101` resolveu a pergunta de dedup. Faltava o lugar pra
  guardar o valor extraído por evento.
- Decisão: migration `20260806140000_create_provento_declaration_values.sql`
  aplicada em produção (usuário confirmou explicitamente, classificador
  de permissão bloqueou a primeira tentativa de `apply_migration`, passou
  na segunda após reconfirmação). Tabela `provento_declaration_values`,
  mesmo padrão de acesso de `market_etf_valuations` (`DEC-092`): global,
  RLS com select para `authenticated`, escrita só via RPC
  `upsert_provento_declaration_values_v1` (`security definer`, lock
  advisory, batch até 100 registros) para `service_role`, sem DML direto
  nem para `service_role` depois de criada a RPC.
  - Identidade de armazenamento: `(event_id, isin)` — cada
    `official_asset_event` é um documento só, pode ter mais de um ISIN
    (ON/PN, units).
  - Valor bruto por ação: `gross_value_per_share_unscaled` +
    `gross_value_per_share_scale` (decimal exato, mesmo padrão de
    `issued_shares_unscaled`/`issued_shares_scale`), não
    `FUNDAMENTAL_RATIO_SCALE` (1e6) — a fonte chega com até 11 casas
    decimais e o projeto nunca trunca precisão de fonte sem necessidade.
  - `protocol`/`version`: o Protocolo Provento interno confirmado por
    `DEC-101`, índice dedicado `(protocol, version desc)` pra facilitar a
    agregação "versão mais alta vence" na leitura.
  - FK pra `official_asset_events(event_id)` — mantém a garantia de que
    todo valor extraído aponta pra um evento oficial real já auditado.
- Verificação: `get_advisors` (security) sem novo achado além dos já
  conhecidos e pré-existentes. `generate_typescript_types` rodado e
  `src/lib/database.types.ts` regenerado por inteiro (não patch manual
  desta vez — schema novo, não extensão de tabela existente).
  `tsc --noEmit` limpo depois da regeneração.
- Consequências: schema pronto. Falta ainda: código de aplicação
  (storage adapter TypeScript espelhando `toOfficialAssetEventSupabaseRowV1`/
  `market_etf_valuations`, ligando `extractProventoFormV1` +
  `extractProventoDeclarationIdentityV1` + `fetchProventoDocumentText` num
  provider único), a agregação trailing-12-meses (regra `unavailable` no
  primeiro trimestre ilegível, confirmada com o usuário em `DEC-095`), e
  a integração nos 3 sinais de score (spread DY de FII, payout de ação,
  spread DY de ETF). Nenhum dado real ainda persistido nesta tabela —
  schema existe, backfill de valores ainda não rodou.

## DEC-103 — Dividend yield de ETF vem do N-CSR anual da SEC, não de evento de provento

- Data: 7 de agosto de 2026
- Status: Aceita
- Contexto: `etf_dy_tips_spread` (VNQ) era o último sinal bloqueado do
  motor de score. A taxa TIPS já estava resolvida (`DEC-093`, FRED
  `DFII10`, em produção). A metade que faltava — o dividend yield do
  próprio ETF — vinha sendo tratada como "mesmo bloqueio de payout":
  dependeria do valor do provento, a partir de um evento
  `dividend-or-distribution` em `official_asset_events`. Duas
  verificações com dado real derrubaram essa premissa:
  1. `official_asset_events` tem 1.511 linhas em produção, todas de CVM
     (5 ações + 4 FIIs). Zero eventos para `VOO`, `VNQ` ou `VEA` — o
     pipeline SEC EDGAR nunca rodou em produção. Não havia evento a
     enriquecer (SQL somente leitura, 07/08/2026).
  2. O número não precisa de evento nenhum. O N-CSR anual (relatório
     anual auditado) que o trust protocola na SEC publica, na tabela
     "Financial Highlights" da classe ETF de cada fundo, "Total
     Distributions" e "Net Asset Value, End of Period" por cota. Filing
     real baixado e inspecionado: VNQ, CIK `0000734383`, accession
     `0001104659-26-036013`, exercício encerrado em 31/01/2026,
     distribuições 3,472 e NAV 90,81.
- Decisão:
  - **Fonte**: N-CSR (form já na taxonomia fechada do provider SEC
    EDGAR). `N-CSRS` é semestral e é deliberadamente ignorado — meio
    exercício não é comparável com um exercício inteiro.
  - **Denominador do DY**: o NAV de fim de exercício do próprio filing,
    não a cotação de mercado. Numerador e denominador ficam com a mesma
    data de referência e a mesma fonte auditável — mesmo espírito do DY
    de FII, que vem pronto do Informe Mensal da CVM. As duas colunas são
    persistidas separadamente, então trocar o denominador depois não
    exige reextrair nada.
  - **Granularidade anual, sem agregação**: o documento já publica o
    total do exercício. Não existe trailing-12-meses a somar (ao
    contrário de FII e de ação), então a chave é
    `(ticker, fiscal_year_end_date)`, sem coluna de versão.
  - **Identidade documental por (nome do fundo, rótulo da classe ETF)**,
    versionada em `etfNcsrFundIdentityV1.ts`. Um N-CSR é o relatório do
    TRUST e empacota vários fundos, cada um com várias classes — pegar
    "a primeira tabela de Financial Highlights" traria outro fundo. O
    rótulo é dado do registry e não constante global porque `VEA` usa
    "FTSE Developed Markets ETF Shares", não "ETF Shares". O cabeçalho
    do bloco precisa vir precedido do número da página impressa
    (invariante confirmado nos três filings reais de 2026), senão
    "Real Estate Index Fund" casaria dentro de "Vanguard Real Estate
    Index Fund". Falha fechada (`null`) em tudo: zero ou mais de uma
    ocorrência, cabeçalho de período parcial, célula fora de formato.
  - **Armazenamento**: tabela global nova `etf_distribution_values`,
    mesmo padrão de acesso de `market_etf_valuations` (`DEC-092`) e
    `provento_declaration_values` (`DEC-102`) — RLS, select para
    `authenticated`, escrita só por `service_role` via
    `upsert_etf_distribution_values_v1`. **Sem FK para
    `official_asset_events`** (diferente de `provento_declaration_values`):
    amarrar o valor a um evento que não existe em produção bloquearia o
    sinal por uma dependência que não é dele. A identidade documental
    (CIK, accession, URL do arquivo) fica na própria linha.
  - **Escopo do sinal**: só `reit-us` (VNQ), como o rascunho de
    pontuação define. `VOO` e `VEA` recebem `wrong-regime`, não
    `missing-input` — o extrator cobre os três (com fixture real), mas
    índice amplo e mercados desenvolvidos não são instrumentos de renda
    comparáveis a uma TIPS. Faixas: > 1 p.p. → +2, < 0 → −2, entre 0 e 1
    → neutro (nenhuma regra bate, 0 ponto), exatamente o rascunho.
  - **Frescor**: `SEC_N_CSR_STALE_AFTER_DAYS = 450` (um exercício ~365
    dias mais ~55 de defasagem de protocolo observada no filing real,
    mais folga) e `FRED_DFII10_STALE_AFTER_DAYS = 5` (série diária de dia
    útil, mesmo limiar do prêmio/desconto da Vanguard). A ponta mais
    velha manda; o sinal vira `stale` e pontua 0 sem esconder o valor.
- Verificação: aritmética em `BigInt` com escala de 1e6, sem ponto
  flutuante em razão financeira; fixtures reais recortadas dos três
  filings de 2026 (URLs e accessions citados em `testFixtures.ts`),
  nenhum caractere inventado. Com o dado real: DY de 3,823367% contra
  TIPS de 2,41% (valor real em `market_reference_rates`, 05/08/2026) →
  spread de 1,413367 p.p. → +2 pontos.
- Consequências: 11 dos 12 sinais do rascunho estão implementados; só
  P/L vs série histórica de ação continua aberto, por profundidade de
  série temporal, não por fonte. A migration
  `20260807130000_create_etf_distribution_values.sql` está **versionada e
  não aplicada em produção**; nenhuma linha foi escrita e o backfill
  (`scripts/run-etf-distribution-values-backfill.ts`, preview por padrão,
  `--confirm` para escrita real) não rodou. Até lá o sinal fica
  `unavailable`, nunca zero silencioso.

## DEC-104 — P/L vs própria série histórica: mecanismo completo, aguardando dado real em duas frentes

- Data: 7 de agosto de 2026
- Status: Aceita
- Contexto: `stock_pl_vs_history` era o único sinal do rascunho de
  pontuação (docs/reference/REGRAS_DE_PONTUACAO_RASCUNHO.md, seção 3)
  ainda sem implementação nenhuma — os outros 11 já pontuam com dado real
  em produção. `composicao_capital` (ações emitidas) já estava real e
  populada (`DEC-095`), e a viabilidade do preço de fechamento B3 anual
  já tinha sido confirmada com dado real (`DEC-096`: BBAS3 fecha
  30/12/2025, último pregão do ano, a R$ 21,92). Faltava escrever o
  provider/wiring e confirmar se a profundidade real de DFP já
  bastava para um quartil confiável.
- Decisão:
  - **Fórmula**: P/L = preço de fechamento B3 no último pregão do
    exercício ÷ LPA do mesmo exercício (lucro líquido ÷ ações emitidas
    da classe negociada, mesma fonte `issuedShares` de
    `computeStockPayoutRatioScaledV1`). `computeStockPriceToEarningsScaledV1.ts`
    — BigInt exato, escala `FUNDAMENTAL_RATIO_SCALE` (1e6),
    arredondamento half-away-from-zero, mesma disciplina do resto do
    motor de score. Lucro líquido não positivo lança em vez de devolver
    P/L enganoso (a chamada degrada pra `unavailable` best-effort, como
    todo o resto do motor).
  - **Comparação com a própria série**: o rascunho pede "abaixo do
    próprio quartil inferior", não um limiar fixo universal. Quartil
    inferior calculado por "nearest-rank" (ordem estatística por índice,
    `rank = ceil(0.25 × n)`, sem interpolação) sobre os valores de P/L
    escalados da própria série, ordenados ascendentemente —
    `computeStockPlQuartilePositionV1.ts`. Aritmética inteira exata, sem
    ambiguidade de fronteira, adequada a amostras pequenas.
  - **Amostra mínima = 5 exercícios anuais**: decisão técnica direta
    (AGENTS.md seção 15), não de produto — com menos de 5 pontos o
    quartil degenera (`rank` sempre aponta pro próprio valor mais baixo
    ou perto dele, "abaixo do quartil inferior" fica quase sempre
    verdadeiro por construção, não por sinal real de barateamento).
    `STOCK_PL_HISTORY_MIN_POINTS = 5`, documentado no código, nunca
    inferido em silêncio.
  - **Reaproveitando `SignalRuleV1` com um marco dinâmico por ativo**: o
    quartil inferior varia por empresa, mas `SignalRuleV1` só compara
    contra faixas estáticas globais. Mesmo truque já usado por
    `computeEtfCapeDeviationV1`/CAPE (`DEC-091`): o `observedValue`
    exposto ao mecanismo de regras é o **desvio** (P/L atual − quartil
    inferior da própria série), e a regra default é um limiar estático
    em zero (`maxValue: 0 → +1`) — "abaixo" é sempre "desvio negativo",
    não importa o valor absoluto do marco.
  - **Regime**: não se aplica a banco (BBAS3) nem seguradora (PSSA3),
    exatamente como o rascunho define (diferente de payout, que se
    aplica a "Todos") — `wrong-regime`, nunca um número.
  - **Preço histórico casado por `referenceDate` exata**: cada
    exercício anual do DFP já tem `referenceDate` (sempre 31/12 neste
    universo); o preço de fechamento é buscado pela mesma data exata em
    `stock_historical_close_prices`. Exercício sem preço casado, sem
    lucro líquido positivo ou sem ações emitidas é descartado
    individualmente da amostra — nunca preenchido com um valor
    inventado, mesmo que isso reduza a amostra abaixo do mínimo.
  - **Provider de preço**: parser COTAHIST anual próprio em
    `src/data/fundamentals/b3/` (`b3CotahistAnnualCloseSeriesV1.ts` +
    `selectFiscalYearEndCloseV1.ts`) — mesmo layout de largura fixa e
    mesmas constantes de campo de
    `supabase/functions/refresh-market-data/b3CotahistParser.ts`, mas
    **duplicado deliberadamente, não importado**: os dois vivem em
    runtimes diferentes (Deno na Edge Function vs Node/Vite em `src`),
    sem precedente neste repositório de import cruzando essa fronteira.
    `selectFiscalYearEndCloseV1` escolhe o último pregão em OU ANTES da
    data de exercício dentro do mesmo ano-calendário — a data de
    exercício nem sempre é pregão (fim de semana, feriado), mesma
    convenção confirmada com dado real em `DEC-096`.
  - **Armazenamento**: tabela global nova `stock_historical_close_prices`
    (migration `20260807140000_create_stock_historical_close_prices.sql`),
    mesmo padrão de acesso de `etf_distribution_values` (`DEC-103`) — RLS,
    select para `authenticated`, escrita só por `service_role` via
    `upsert_stock_historical_close_prices_v1`. Chave
    `(ticker, fiscal_year_end_date)`; `trading_date` preservado
    separadamente (o pregão real usado, quando difere da data de
    exercício).
  - **Wiring**: `buildBrazilianStockScoreV1.ts` (novo signal key
    `stock_pl_vs_history`), `defaultStockSignalRules.ts` (faixa
    default), `buildContributionAssetScores.ts` e
    `useContributionData.ts` (leitura de
    `stock_historical_close_prices` por ticker, best-effort, mesmo
    padrão dos demais sinais) até o dossiê.
- Verificação: 34 testes novos/estendidos (`computeStockPriceToEarningsScaledV1.test.ts`,
  `computeStockPlQuartilePositionV1.test.ts`, `b3CotahistAnnualCloseSeriesV1.test.ts`,
  `selectFiscalYearEndCloseV1.test.ts`, `supabaseStockHistoricalClosePrices.test.ts`,
  extensão de `buildBrazilianStockScoreV1.test.ts`) cobrindo cálculo exato,
  arredondamento, amostra abaixo do mínimo, exercício sem preço casado,
  regime errado (banco/seguradora), staleness e o caso real de produção
  hoje (só 2 exercícios ingeridos). `npx tsc -b`, `npm run lint` e
  `npm run build` passam.
- Consequências: os 12 sinais do rascunho de pontuação têm mecanismo de
  cálculo completo — fecha o item 3 de "Itens abertos sem prazo" do
  `DEC-068`/`docs/ROADMAP.md`. O sinal `stock_pl_vs_history` continua
  `unavailable` em produção por dois motivos reais, verificados nesta
  sessão, não por falta de código:
  1. **Migration versionada e não aplicada em produção**: a tabela
     `stock_historical_close_prices` não existe em produção; nenhuma
     linha foi escrita. O script
     `scripts/run-stock-close-price-history-backfill.ts` roda em preview
     por padrão (baixa e extrai o COTAHIST anual real, não escreve
     nada) e exige `--confirm` mais `SUPABASE_URL`/
     `SUPABASE_SERVICE_ROLE_KEY` pra escrita real.
  2. **Profundidade de DFP insuficiente mesmo com a tabela aplicada**:
     SQL somente leitura em produção (07/08/2026) confirmou só 2
     exercícios anuais ingeridos por empresa hoje (`reference_date`
     2024-12-31 e 2025-12-31, `source = 'cvm-dfp'`), contra o mínimo de
     5 exigido pelo quartil. Aprofundar exige rodar
     `run-fundamentals-ingestion.ts --provider=cvm-stocks --source=DFP
--year=<ano>` pra 2019–2023, mesmo comando já usado pra 2024/2025 —
     decisão e execução do usuário, fora da autoridade deste ciclo.
     `src/lib/database.types.ts` permanece intocado (a tabela não existe em
     produção ainda) — mesma disciplina de `etf_distribution_values`
     (`DEC-103`), reforçada pela correção do PR #169 que precedeu este
     ciclo.
