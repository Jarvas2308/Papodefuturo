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

Essa missão descreve a direção do produto. O repositório atual já possui
experiências demonstrativas, engines locais de simulação e a primeira fundação
tipada do domínio financeiro, mas ainda não possui dados persistidos,
integrações reais nem o motor estratégico final necessários para cumprir toda
essa proposta.

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
- `OfficialAssetEventV1` implementado como contexto regulatório puro e não
  bloqueante, com 12 identidades fortes, 15 tipos fechados, tempo explícito,
  deduplicação documental e revisões históricas;
- provider CVM IPE V1 isolado para eventos oficiais das cinco ações, com
  identidade regulatória forte, categorias oficiais fechadas e deduplicação em
  memória, sem storage, runtime ou leitura dos documentos;
- providers CVM V1 isolados para ações brasileiras e para KNRI11, VISC11,
  XPLG11 e HGRU11, sem conexão com telas ou scheduler;
- provider SEC N-PORT V1 e adapter Supabase global isolados para VOO, VNQ e
  VEA, sem ingestão real, scheduler ou conexão com telas;
- modo demo preservado com os mesmos fluxos, sem consumo de providers ou
  persistência.

### Planejado

- providers oficiais restantes em ciclos independentes, começando pelo provider
  CVM de eventos de FIIs e depois pelo provider SEC de eventos de ETFs;
- storage, banco e runtime de eventos somente após os três providers;
- notícias editoriais adiadas até nova auditoria de provider, cobertura,
  identidade e licença comercial;
- camada futura de IA explicativa;
- auditoria e polimento.

### Em aberto

- desenho operacional dos providers CVM/SEC em ciclos próprios, sem alterar o
  plano determinístico.

## Funcionamento futuro do planejamento de aporte

Fluxo conceitual planejado:

1. usuário informa o capital disponível;
2. sistema consolida a carteira;
3. motor determinístico calcula os desvios;
4. motor gera alternativas de aporte;
5. regras estratégicas eliminam alternativas inválidas;
6. resultado técnico é apresentado ao usuário;
7. futuramente, a IA poderá interpretar o dossiê e explicar o plano;
8. usuário aceita, ajusta ou rejeita o plano.

O Novo Aporte autenticado já consome carteira, cotações, metas e câmbio reais.
Seu resultado continua sendo uma simulação em memória: não executa ordens e não
persiste automaticamente um plano.

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
- saldo não alocado quando nenhuma nova unidade acessível melhora o desvio.

O Dossiê Técnico V1 recebe esses fatos sem recalcular ou modificar o plano
produzido pelo motor. Futuras camadas qualitativas deverão consumir esse
contrato ou uma evolução explicitamente versionada dele.

## Dossiê Técnico V1

O estado atual inclui `TechnicalDossierV1`, um objeto puro, determinístico e
somente em memória que consolida:

- `PortfolioSnapshot` já calculado;
- estratégia e metas globais individuais já derivadas;
- últimas cotações e último câmbio USD/BRL selecionados pelos helpers do domínio;
- `TargetAllocationContributionResult` e impactos produzidos pelo Motor V2;
- cobertura dos fatos de mercado e limitações explícitas do plano.

O dossiê não é persistido, não recalcula a carteira ou o plano, não expõe um
ranking técnico inexistente e não chama IA, APIs ou serviços externos.

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
com a linha DRE 3.01 das demais companhias auditadas.

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

A tabela global foi aplicada no Supabase real, permanece vazia, usa RLS e não
possui `user_id` nem relação com `assets.id`. A migration multi-kind integrada
na PR #76 foi aplicada como
`20260716203927_generalize_fundamental_snapshots_for_sec_nport`, preservando
leitura para `authenticated` e escrita privilegiada para `service_role`. Os
tipos Supabase e os adapters isolados de ações, FIIs e ETFs estão sincronizados;
os fluxos de FII e SEC foram integrados nas PRs #75 e #77. Ainda não existem
ingestão real, scheduler ou integração runtime e UI para fundamentos. A tabela
permanece vazia, e fundamentos não modificam o Motor V2 nem
`TechnicalDossierV1`.

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
factual. Não usam preço de mercado, não calculam crescimento, score, ranking ou
recomendação, não alteram o Motor V2 e não são persistidos. Neste ciclo, o
builder permanece somente em memória, sem runtime, UI, chamada externa ou
alteração na tabela global vazia `fundamental_snapshots`.

## Papel futuro da IA

A IA não cria, seleciona nem modifica o plano técnico. Ela recebe o resultado
produzido pelo motor determinístico e pode interpretá-lo e explicá-lo ao usuário.

A IA não será responsável por:

- calcular preço médio;
- calcular participação;
- calcular rentabilidade;
- definir metas;
- alterar regras;
- recomendar ativos fora do universo;
- executar operações.

A IA poderá futuramente:

- interpretar dados já calculados;
- contextualizar fatos;
- apresentar grau de convicção;
- explicar o plano;
- comparar alternativas;
- explicar por que uma alternativa foi escolhida e outras não.

Saída prevista:

- fatos;
- interpretação;
- grau de convicção;
- apresentação do plano técnico calculado pelo motor determinístico;
- explicação comparativa.
