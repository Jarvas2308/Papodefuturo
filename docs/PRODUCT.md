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
experiências demonstrativas e engines locais de simulação, mas ainda não possui
o domínio financeiro completo, dados persistidos, integrações reais nem o motor
estratégico final necessários para cumprir toda essa proposta.

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

- SANB11
- SAPR4
- TAEE11
- CXSE3
- CPLE3
- ITSA4
- PSSA3
- FLRY3
- BBAS3
- WEG3

Meta individual dentro da categoria: `10%`

### Fundos imobiliários

- KNRI11
- VISC11
- XPLG11
- KNCR11
- RECR11
- HGRU11
- HGCR11
- GARE11

Meta individual dentro da categoria: `12,5%`

### Internacional

- VOO
- VNQ
- VEA

Meta individual dentro da categoria: `33,3333%`

Observações importantes:

- os mocks visuais atuais não são fonte de verdade do domínio;
- ativos, quantidades e totais exibidos no Dashboard são demonstrativos;
- divergências entre mocks e o universo estratégico serão corrigidas quando as
  telas forem conectadas ao domínio real.

O universo monitorado previsto soma 21 ativos:

- 10 ações;
- 8 FIIs;
- 3 ativos internacionais.

## Estado real da reconstrução

### Atual

- fundação com Vite, React e TypeScript;
- Tailwind CSS;
- React Router;
- layout principal responsivo;
- sidebar;
- menu móvel;
- cabeçalho compartilhado;
- página visual de login;
- rotas para Dashboard, Minha Carteira, Novo Aporte, Histórico, Estratégia e
  Configurações;
- componentes básicos de interface;
- Dashboard demonstrativo;
- Minha Carteira demonstrativa;
- Novo Aporte demonstrativo com engine local;
- Histórico demonstrativo;
- Estratégia demonstrativa com metas em pontos-base e edição local;
- Configurações demonstrativas com preferências locais;
- publicação inicial no Vercel;
- dados exclusivamente demonstrativos, sem backend, autenticação, Supabase, APIs
  financeiras ou persistência real.

### Planejado

- domínio financeiro;
- carteira funcional com dados persistidos;
- planejamento de aporte conectado ao domínio real;
- motor estratégico determinístico final;
- persistência;
- autenticação real;
- integrações de mercado;
- camada futura de IA explicativa.

### Em aberto

- critérios definitivos de priorização do roadmap após a fundação visual;
- desenho final do dossiê técnico para explicação futura pela IA;
- regras operacionais da futura versão multiativos do plano.

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

O repositório atual possui uma simulação demonstrativa de Novo Aporte conectada a
um engine local. O fluxo completo acima ainda não está implementado como
funcionalidade de produto, pois não há carteira persistida, cotações reais,
confirmação de operações, backend, Supabase ou APIs.

## Motor estratégico

### V1 planejada

- participação atual;
- meta individual;
- diferença para a meta;
- ranking técnico;
- plano inicialmente limitado a um ativo.

### V2 planejada

- distribuição do aporte entre múltiplos ativos;
- comparação do desvio antes e depois;
- seleção da combinação que mais reduz o desvio total;
- limite operacional de ativos por plano a ser definido na implementação.

As estratégias demonstrativas existentes preparam a arquitetura, mas nenhuma das
versões finais do motor estratégico de produto está concluída nesta fase.

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
