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
- modo demo preservado com os mesmos fluxos, sem provider ou persistência.

### Planejado

- Dossiê Técnico V1;
- fundamentos, notícias e eventos;
- camada futura de IA explicativa;
- auditoria e polimento.

### Em aberto

- desenho final do dossiê técnico para explicação futura pela IA;
- critérios de fundamentos, notícias e eventos que poderão contextualizar fatos
  sem alterar o plano determinístico.

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

O futuro dossiê e a IA recebem esses fatos técnicos sem recalcular ou modificar
o plano produzido pelo motor.

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
