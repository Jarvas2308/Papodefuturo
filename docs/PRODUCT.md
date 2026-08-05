# Papo de Futuro — Visão de Produto

## Visão geral

O Papo de Futuro é uma plataforma de apoio ao planejamento de aportes para
investidores de longo prazo. A proposta do produto é ajudar o usuário a avaliar
o próximo passo da carteira com base em estratégia, dados organizados e
explicações claras.

O produto não deve ser interpretado como:

- promessa de rentabilidade;
- plataforma de negociação automática;
- substituto de decisão pessoal;
- recomendador irrestrito de ativos.

## Missão

> Cada aporte deve representar o melhor próximo passo possível para a evolução
> da carteira, considerando simultaneamente a estratégia de alocação, o
> contexto disponível e o capital informado pelo usuário.

Essa missão descreve a direção do produto. Desde o Sprint 8 (agosto de
2026), o repositório cumpre a proposta ponta a ponta para o universo fechado
de 12 ativos: dados reais persistidos (carteira, compras, metas, plano de
aporte), Supabase Auth real, motor estratégico V2 determinístico integrado
ao Novo Aporte, dados de mercado e câmbio globais atualizados
automaticamente, e uma camada de IA explicativa interpretando o plano já
calculado. O modo demo permanece como fallback determinístico quando o
ambiente Supabase não está configurado. Notícias editoriais e sentimento
continuam fora de escopo (`NO-GO`, `DEC-036`) — o `NO-GO` cobria
especificamente score derivado de notícia/sentimento editorial, nunca score
de dado estruturado regulatório. Desde o Sprint 16 (`DEC-068`, `DEC-085` a
`DEC-087`), o motor consome score derivado de dado estruturado (CVM, SEC,
Tesouro Transparente, FRED, Shiller) para priorizar candidatos dentro do
universo fechado — ver "Motor de score" abaixo.

## Filosofia

1. Estratégia acima de opinião.
2. Dados acima de achismos.
3. Explicabilidade acima de caixa-preta.
4. Evolução contínua da carteira.
5. IA como consultora, não como decisora.

## Princípios de produto

1. A estratégia definida é soberana.
2. O universo de ativos é fechado.
3. O algoritmo calcula e classifica.
4. A IA interpreta e explica.
5. Toda decisão deve ser rastreável e explicável.
6. O usuário sempre possui a decisão final.
7. Nenhuma operação é executada automaticamente.

## Estratégia de alocação total

| Categoria           | Percentual da estratégia total |
| ------------------- | -----------------------------: |
| Ações brasileiras   |                            30% |
| Fundos imobiliários |                            30% |
| Internacional       |                            25% |
| Renda fixa          |                            15% |

- A renda fixa faz parte da estratégia total.
- A renda fixa é acompanhada fora do sistema.
- Não deve ser criada uma categoria de renda fixa no produto atual.
- Não devem ser criados campos para o usuário alterar essa parcela nesta fase.
- A parcela prevista para monitoramento pelo sistema corresponde aos 85% formados
  por ações, FIIs e internacional.

## Metas normalizadas da parcela monitorada

O produto deve distinguir claramente:

- percentual da estratégia total;
- percentual dentro da parcela monitorada.

| Categoria monitorada | Estratégia total | Meta normalizada sobre os 85% |
| -------------------- | ---------------: | ----------------------------: |
| Ações brasileiras    |              30% |                      35,2941% |
| Fundos imobiliários  |              30% |                      35,2941% |
| Internacional        |              25% |                      29,4118% |

Fórmula conceitual:

```text
meta monitorada = percentual total da categoria / 85%
```

A normalização não altera a estratégia original. Ela serve apenas para comparar
corretamente os ativos que são acompanhados dentro do sistema.

## Universo fechado de ativos

### Ações brasileiras

- BBAS3
- ITSA4
- TAEE11
- WEGE3
- PSSA3

Meta individual dentro da categoria: `20%`

### Fundos imobiliários

- KNRI11
- VISC11
- XPLG11
- HGRU11

Meta individual dentro da categoria: `25%`

### Internacional

- VOO
- VNQ
- VEA

Meta individual dentro da categoria: `33,3333%`

O universo fechado real atual soma 12 ativos: 5 ações brasileiras, 4 fundos
imobiliários e 3 ativos internacionais. O modo demo permanece disponível, mas
seus mocks não substituem a fonte de verdade do domínio autenticado.

## Estado real da reconstrução

### Atual

- Supabase Auth real com isolamento por usuário e fallback demo;
- contenção de falha na interface (`DEC-061`): uma falha inesperada em qualquer
  tela mostra um aviso nomeando a tela afetada e declarando que nenhum dado foi
  alterado, em vez de tela branca, preservando shell e navegação;
- compras reais persistidas e Histórico autenticado;
- carteira real derivada somente de compras confirmadas;
- Estratégia real persistida em pontos-base;
- câmbio USD/BRL persistido e conversão determinística;
- atualização automática de mercado para B3 e ativos internacionais;
- Novo Aporte conectado a compras, cotações, metas e câmbio reais;
- Motor Estratégico V2 multiativos determinístico;
- Dossiê Técnico V1 puro e determinístico, derivado em memória a partir do
  snapshot, estratégia, fatos de mercado e plano técnico já calculado;
- fundação de `FundamentalFactsV1` como contrato normalizado, determinístico e
  em memória para fatos contábeis de ações brasileiras, FIIs e ETFs
  internacionais;
- `FundamentalDerivedFactsV1` como camada auditável, determinística e em
  memória para razões e reconciliações derivadas dos snapshots factuais;
- política News & Events V1 aprovada como Eventos Oficiais Primeiro, com CVM e
  SEC como únicas fontes automatizadas V1, sem integração ao runtime;
- auditoria Editorial News Providers V2 concluída com `NO-GO`: nenhum provider
  editorial está aprovado e nenhum conteúdo editorial foi integrado, armazenado
  ou exibido;
- pacote local de preparação do deployment de eventos oficiais concluído, com
  manifesto, runbook, checks somente leitura e gates; a fase operacional ainda
  não foi executada e a experiência continua desativada;
- `OfficialAssetEventV1` implementado como contexto regulatório puro e não
  bloqueante, com 12 identidades fortes, 15 tipos fechados, tempo explícito,
  deduplicação documental e revisões históricas;
- provider CVM IPE V1 isolado para eventos oficiais das cinco ações, com
  identidade regulatória forte, categorias oficiais fechadas e deduplicação em
  memória, sem storage, runtime ou leitura dos documentos;
- provider CVM Fund Delivery FII Events V1 isolado para KNRI11, VISC11, XPLG11
  e HGRU11, com vínculo por CNPJ exato, relatórios periódicos em mapping fechado
  e competência civil preservada, sem storage, runtime ou leitura de documentos;
- provider SEC EDGAR ETF Events V1 isolado para VOO, VNQ e VEA, com confirmação
  obrigatória por CIK, série e classe na Filing Detail, seis forms fechados e
  fair access, sem storage, runtime ou leitura do primary document;
- contrato global de storage de eventos oficiais V1 concluído em memória, com
  record canônico lossless, validação estrita, deduplicação de batch e semântica
  de upsert idempotente;
- migration global de `official_asset_events` versionada com RLS, identidade
  regulatória discriminada, datas civis separadas de instantes e acesso de
  cliente autenticado somente para leitura, ainda sem aplicação remota ou
  runtime;
- adapter Supabase de eventos oficiais implementado com mapping lossless dos 58
  campos e RPC transacional exclusiva de contexto server-side;
- executor server-side V1 de eventos oficiais implementado localmente para CVM
  IPE, CVM Fund Delivery e SEC EDGAR, com jobs explícitos, ordem preservada,
  falha isolada e persistência canônica; não há scheduler, backfill, execução em
  produção ou integração com a interface;
- backfill controlado V1 implementado localmente com plano e jobs
  determinísticos, preview sem efeitos, checkpoint global, leases, resume,
  retries explícitos, política de falha e execução em passos limitados; nenhuma
  migration foi aplicada e nenhum backfill real foi executado;
- repository global de leitura de eventos oficiais V1 implementado localmente,
  com consulta por `eventId`, filtros fechados e timeline determinística por
  cursor;
- runtime opcional de eventos oficiais V1 implementado localmente, com modos
  explícitos `disabled` e `read-only`, leitura condicionada à autenticação e
  falhas isoladas;
- página autenticada de Eventos Oficiais implementada localmente com timeline
  read-only, filtros fechados, cursor, detalhes, revisões, fontes CVM/SEC e links
  externos seguros; a composição real permanece `disabled`, o item não aparece
  na navegação e a rota direta informa o estado sem chamar Supabase; não há
  migration aplicada, backfill executado ou eventos em produção;
- providers CVM V1 isolados para ações brasileiras e para KNRI11, VISC11,
  XPLG11 e HGRU11, sem conexão com telas ou scheduler;
- provider SEC N-PORT V1 e adapter Supabase global isolados para VOO, VNQ e
  VEA, sem ingestão real, scheduler ou conexão com telas;
- modo demo preservado com os mesmos fluxos, sem consumo de providers ou
  persistência.

### Planejado

- eventual reavaliação editorial somente diante de novo contrato comercial,
  direitos por campo, identidade forte e cobertura comprovada dos 12 ativos;
- camada futura de IA explicativa;
- auditoria e polimento.

### Em aberto

- desenho operacional dos providers CVM/SEC em ciclos próprios, sem alterar o
  plano determinístico.

## Funcionamento do planejamento de aporte

Fluxo real (Sprint 6, `DEC-055`):

1. usuário informa o capital disponível;
2. sistema consolida a carteira;
3. motor determinístico calcula os desvios;
4. motor gera alternativas de aporte;
5. regras estratégicas eliminam alternativas inválidas;
6. resultado técnico é apresentado ao usuário e persistido como
   `ContributionPlan` (status `presented`);
7. futuramente, a IA poderá interpretar o dossiê e explicar o plano;
8. usuário aceita ou rejeita o plano (`accepted`/`rejected`); ao registrar as
   compras realmente realizadas para um plano aceito, o plano é marcado como
   `confirmed` e cada item fica ligado à compra real correspondente.

O Novo Aporte autenticado já consome carteira, cotações, metas e câmbio reais.
O motor nunca executa ordens nem persiste um plano automaticamente — a
persistência acontece apenas quando o usuário explicitamente simula, aceita,
rejeita ou confirma.

## Motor estratégico

### V1 histórica

- participação atual;
- meta individual;
- diferença para a meta;
- ranking técnico;
- plano inicialmente limitado a um ativo.

### V2 atual

- metas globais individuais derivadas em basis points;
- simulação gulosa de uma unidade inteira por iteração;
- comparação exata do desvio total antes e depois;
- seleção somente de unidades que melhoram estritamente a carteira;
- limite operacional de até 3 ativos distintos por plano;
- saldo não alocado quando nenhuma nova unidade acessível melhora o desvio;
- desde o Sprint 16 (`DEC-085`/`DEC-086`): entre candidatos que já melhoram
  o desvio, o score do motor de fundamentos reordena a prioridade
  (`desvioAjustado = desvioCandidato − score × peso`) — nunca aprova uma
  compra que não melhora a carteira, essa trava é a mesma de sempre.

O Dossiê Técnico V1 recebe esses fatos sem recalcular ou modificar o plano
produzido pelo motor. Futuras camadas qualitativas deverão consumir esse
contrato ou uma evolução explicitamente versionada dele.

## Motor de score (Sprint 16)

Desde `DEC-068`, o motor deixou de ser só um veto e passa a pontuar
candidatos dentro do universo fechado — nunca um recomendador irrestrito
(usuário mantém confirmação obrigatória, item 6 da filosofia). Estado atual
(`DEC-085` a `DEC-087`):

- cobre só a fatia FII tijolo (KNRI11, VISC11, XPLG11, HGRU11) — ação e ETF
  ainda não têm nenhum sinal;
- 4 de 5 sinais do rascunho de pontuação implementados: P/VP, vacância
  financeira, WALE (substituto documentado de "receita vencendo em 24
  meses") e concentração do maior inquilino; spread de DY sobre NTN-B
  segue bloqueado (falta o valor do provento, só o evento foi ingerido);
- faixas de pontuação configuráveis por usuário (`signal_rules`), semeadas
  com valores de partida na primeira simulação de aporte técnico;
- score é best-effort: qualquer falha na leitura de fundamentos degrada
  para score vazio, nunca trava a simulação de aporte;
- exposto no Dossiê Técnico V1 (`signals`) para a IA poder explicar por que
  um ativo foi priorizado, sem a IA decidir nada sozinha.

## Dossiê Técnico V1

O estado atual inclui `TechnicalDossierV1`, um objeto puro, determinístico e
somente em memória que consolida:

- `PortfolioSnapshot` já calculado;
- estratégia e metas globais individuais já derivadas;
- últimas cotações e último câmbio USD/BRL selecionados pelos helpers do domínio;
- `TargetAllocationContributionResult` e impactos produzidos pelo Motor V2;
- cobertura dos fatos de mercado e limitações explícitas do plano;
- desde o Sprint 16 (`DEC-087`): `signals`, o score do motor de
  fundamentos por ativo (hoje só FII tijolo), quando calculado.

O dossiê não é persistido, não recalcula a carteira ou o plano, não expõe o
histórico de candidatos avaliados a cada iteração do laço guloso (isso
continua sem existir) e não chama IA, APIs ou serviços externos.

## Fundamental Facts V1

O estado atual inclui `FundamentalFactsV1` como contrato independente,
determinístico e derivado em memória. Ele normaliza fatos mínimos por classe de
ativo:

- ações brasileiras: receita, lucro líquido, ativos, patrimônio líquido e
  fluxo de caixa operacional;
- FIIs: patrimônio líquido, quantidade de cotas e número de cotistas;
- ETFs internacionais: ativos, passivos e patrimônio líquido.

Valores contábeis monetários usam unidades menores inteiras signed, preservando
BRL ou USD conforme a fonte normalizada. Ausência de fato permanece `null` e
não é convertida em zero.

O provider CVM V1 para BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3 lê DFP e ITR
consolidados oficiais, normaliza lucro líquido, ativo total, patrimônio líquido
e fluxo de caixa operacional e preserva proveniência do filing. `totalRevenue`
permanece `null`: a linha DRE 3.01 de BBAS3 não possui comparabilidade econômica
com a linha DRE 3.01 das demais companhias auditadas. Para o ITR, a mesma data
de fechamento pode trazer duas linhas oficiais para `netIncome` (3.11): o
trimestre isolado e o acumulado do ano até ali, diferindo apenas pela data de
início do período. `netIncome` trimestral significa o trimestre isolado — o
mesmo espírito de granularidade que o DFP anual já aplica ao ano inteiro,
decidido em 30 de julho de 2026.

O provider CVM V1 para FIIs lê os CSVs `geral` e `complemento` do Informe Mensal
oficial, valida CNPJ, denominação e ISIN do universo fechado e normaliza
patrimônio líquido, cotas emitidas e número de cotistas. Ausência oficial
permanece `null`; valores monetários precisam ser exatamente representáveis em
centavos, número de cotistas precisa ser inteiro seguro e cotas emitidas usam
coeficiente inteiro seguro mais escala. Assim, quantidades decimais publicadas
pela CVM são preservadas sem arredondamento, truncamento ou ponto flutuante.

O provider SEC N-PORT V1 cobre VOO, VNQ e VEA no universo fechado. Ele descobre
filings oficiais `NPORT-P` e `NPORT-P/A` pelo Submissions API, valida CIK,
registrant, series ID, class ID e nomes oficiais, e normaliza ativos totais,
passivos totais e patrimônio líquido em centavos de USD. Amendments têm
precedência determinística quando representam o mesmo período, e todo acesso à
SEC fica restrito a contexto server-side com User-Agent identificável e fair
access. Os fatos pertencem à série; a classe ETF esperada é validada entre todas
as classes publicadas e serve somente para associar a série ao ticker monitorado.

A tabela global foi aplicada no Supabase real, usa RLS e não possui `user_id`
nem relação com `assets.id`. A migration multi-kind integrada na PR #76 foi
aplicada como `20260716203927_generalize_fundamental_snapshots_for_sec_nport`,
preservando leitura para `authenticated` e escrita privilegiada para
`service_role` — desde `DEC-044`, exclusivamente via RPC transacional
`upsert_fundamental_snapshots_v1`. Os tipos Supabase e os adapters isolados de
ações, FIIs e ETFs estão sincronizados; os fluxos de FII e SEC foram integrados
nas PRs #75 e #77. Em 28 de julho de 2026 (`DEC-049`), a primeira ingestão
real trouxe a tabela de 0 para 9 linhas: 5 ações via `cvm-stocks` e 4 FIIs via
`cvm-fii`. Em 29 de julho de 2026 (`DEC-051`), corrigidos três bugs reais
independentes no provider `sec-nport`, a ingestão dos 3 ETFs internacionais
(VOO, VNQ, VEA) também teve sucesso — a tabela chega a 12 linhas, cobrindo as
três categorias do universo fechado pela primeira vez. Um runtime opcional
(`disabled`/`read-only`, mesmo padrão do runtime de eventos oficiais) e uma
apresentação autenticada existem em `src/application/context/fundamentals` e
`src/features/fundamentals`, rota `/fundamentos`, e a composição real está
ativa (`DEC-060`). Ainda não existe scheduler. `FundamentalFactsV1` em si
não modifica o Motor V2 nem `TechnicalDossierV1` — mas, desde o Sprint 16
(`DEC-085` a `DEC-087`), o motor de score (`src/domain/fundamentals/score`,
módulo separado que consome estes mesmos fatos) modifica a priorização de
compra e é exposto no dossiê, hoje só para FII tijolo.

## Fundamental Derived Facts V1

O estado atual inclui `FundamentalDerivedFactsV1` como contrato separado dos
fatos normalizados. Para cada snapshot factual, a camada produz apenas métricas
compatíveis com a classe do ativo:

- ações brasileiras: patrimônio líquido sobre ativos;
- FIIs: valor patrimonial em BRL por cota emitida;
- ETFs internacionais: passivos sobre ativos, patrimônio líquido sobre ativos
  e delta assinado de reconciliação do balanço em USD.

Razões usam escala fixa de 1.000.000, intermediários em `BigInt` e
arredondamento half-away-from-zero. Cotas decimais são consumidas pela
representação exata de coeficiente e escala. Ausência de input, denominador não
positivo, moeda divergente e aritmética fora do intervalo seguro são estados
explícitos de indisponibilidade, não valores inventados.

Os derivados preservam asset, período, fonte, data e documento do snapshot
factual. `FundamentalDerivedFactsV1` em si não usa preço de mercado, não
calcula crescimento nem recomendação, e não é persistido — mas P/VP de FII
tijolo (que combina o valor patrimonial por cota aqui derivado com a
cotação de mercado) e o score do motor (que consome estes derivados) já
existem desde o Sprint 16, em módulos separados
(`src/domain/fundamentals/score`), e o score modifica a priorização de
compra do Motor V2. O builder deste contrato em si permanece somente em
memória, sem runtime, UI, chamada externa ou alteração na tabela global
`fundamental_snapshots`.

## Papel da IA

Desde o Sprint 7 (`DEC-056`), a IA interpreta e explica, em texto, o plano
técnico já calculado pelo motor determinístico do Novo Aporte. Ela **não**
cria, seleciona nem modifica esse plano — recebe o resultado pronto
(`TechnicalDossierV1`) e devolve apenas interpretação.

A IA não é responsável por:

- calcular preço médio;
- calcular participação;
- calcular rentabilidade;
- definir metas;
- alterar regras;
- recomendar ativos fora do universo;
- executar operações.

A IA hoje faz:

- interpretar dados já calculados;
- contextualizar fatos;
- apresentar grau de convicção;
- explicar o plano;
- explicar por que os ativos do plano foram escolhidos e não outros do
  universo, com base nos desvios já calculados pelo motor.

Saída (`AiExplanationV1`, `ai-explanation.v1`):

- fatos;
- interpretação;
- grau de convicção (`low`/`medium`/`high`);
- apresentação do plano técnico calculado pelo motor determinístico;
- explicação comparativa.

A explicação é gerada server-side (Edge Function `explain-contribution-plan`,
via OpenRouter, roteando para `anthropic/claude-sonnet-4.5`), nunca no
navegador, e nunca é obrigatória: uma falha da IA
(rede, resposta malformada, chave ausente) degrada silenciosamente para o
plano técnico puro — o usuário nunca fica bloqueado pela IA.
