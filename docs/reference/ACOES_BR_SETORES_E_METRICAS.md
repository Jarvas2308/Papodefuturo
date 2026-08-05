# Ações BR — Setores e Métricas

Material de referência para embasar as regras de sinal do Papo de Futuro.
Mesma lógica do [FII_SEGMENTOS_E_METRICAS.md](FII_SEGMENTOS_E_METRICAS.md),
adaptada ao que muda em ação: não existe documento v1 com erro de ticker para
corrigir aqui — os 5 tickers do seu universo foram verificados do zero.

**Versão:** 2 · **Escrito em:** 31 de julho de 2026
**v2 acrescenta:** seção 3.8, sobre por que os 5 tickers do universo não são
pagadores de dividendo homogêneos, com um achado concreto sobre BBAS3.

---

## Como ler este documento

Mesmas regras do documento de FII: isto é referência estrutural, não
recomendação de compra, ranking ou lista de limiares para seguir. Escolha de
corte é sua. Não sou consultor de valores mobiliários licenciado.

---

## 1. A divisão que vem antes de tudo: regime do setor

Em FII, a divisão que evitava erro de categoria era **tijolo vs papel vs FOF**.
Em ação, o equivalente é **o regime contábil e regulatório do setor**. Empresa
industrial, banco, seguradora, holding e concessionária regulada preenchem o
mesmo formulário CVM, mas os números significam coisas diferentes.

### Industrial / operacional "padrão"

Vende produto ou serviço, tem custo direto, margem, capital de giro. É o caso
em que P/L, margem líquida e ROE funcionam do jeito descrito em manual.

**No seu universo: WEGE3.**

### Banco

Não tem "receita" no sentido comum — tem margem financeira (diferença entre o
que cobra e o que paga por captação) mais tarifas. Balanço é
predominantemente ativo e passivo financeiro, não estoque e imobilizado.

Métrica de margem operacional tradicional não se aplica. O que importa:
**ROE** (aqui sim central), **índice de Basileia** (capital regulatório
mínimo), **inadimplência da carteira de crédito**, **NIM** (margem financeira
líquida).

**No seu universo: BBAS3.**

### Seguradora

Também não tem "receita" comum — tem prêmio emitido, sinistro pago, e o
resultado depende de quanto ela paga de indenização em relação ao que
arrecadou.

Métrica própria: **índice combinado** (sinistros + despesas ÷ prêmio ganho;
abaixo de 100% = lucro na operação de seguro em si, sem contar resultado
financeiro), **sinistralidade**.

**No seu universo: PSSA3** (Porto Seguro atua majoritariamente em seguros,
com operação also em outros serviços financeiros).

### Concessionária / setor regulado

Receita não é livre — é fixada ou tetada por agência reguladora (ANEEL, no
caso de energia). Existe o conceito de **RAP** (Receita Anual Permitida, para
transmissoras) ou tarifa regulada, revisada em ciclos definidos por contrato
de concessão, não pelo mercado.

Isso muda o que "crescimento" significa: não vem de vender mais, vem de novos
ativos entrando em operação ou de revisão tarifária. Métrica própria:
**RAB** (Base de Ativos Regulatória), prazo remanescente da concessão.

**No seu universo: TAEE11** (Taesa, transmissão de energia).

### Holding

Não opera nada diretamente — é dona de participação em outras empresas. O
resultado dela reflete o resultado das controladas, e o valor de mercado dela
tende a negociar com **desconto sobre a soma das partes** (a soma do valor de
mercado das participações, proporcional à fatia que a holding detém).

P/L de holding compara preço com lucro consolidado que já carrega o lucro das
controladas — pode enganar se comparado direto com P/L de operacional puro.

**Armadilha extra de holding:** múltiplas classes de ação. **ITSA4** é a
classe **preferencial (PN)** de Itaúsa — a empresa também tem ação ordinária
(ON). Cada classe pode ter cotação, liquidez e até direito a dividendo
diferentes. Calcular lucro por ação (LPA) exige saber **qual classe** está no
denominador — dividir lucro total pelo total de ações (ON+PN) dá número
diferente de dividir pelo total de PN. Confirmado nos dados reais: Itaúsa
reporta 3.853.634 mil ações ON e 7.360.053 mil ações PN separadamente (ver
seção 6).

**No seu universo: ITSA4.**

### Por que isso importa antes de configurar qualquer regra

Uma regra "vetar se margem líquida < X%" aplicada a BBAS3 é erro de
categoria — banco não reporta margem líquida sobre receita do jeito que
indústria reporta. Aplicada a TAEE11, ignora que a receita é regulada, não de
mercado. É o mesmo erro que a v1 de FII cometeu tratando fundo de papel como
se tivesse vacância.

---

## 2. Verificação dos 5 tickers do universo

Diferente da FII, não havia documento anterior com erro para corrigir — mas
verifiquei os 5 contra CNPJ real da CVM antes de assumir qualquer coisa.

| Ticker | Empresa | Setor | CNPJ confirmado |
|---|---|---|---|
| **BBAS3** | Banco do Brasil | Banco | 00.000.000/0001-91 |
| **ITSA4** | Itaúsa | Holding (ação PN) | 61.532.644/0001-15 |
| **TAEE11** | Taesa | Transmissão de energia (regulado) | verificado por fonte de mercado, CNPJ não baixado nesta sessão |
| **WEGE3** | WEG | Industrial (motores/equipamentos) | 84.429.695/0001-11 |
| **PSSA3** | Porto Seguro | Seguros | verificado por fonte de mercado, CNPJ não baixado nesta sessão |

Todos batem com o nome já cadastrado em `assetUniverse.ts`. Nenhum erro de
categoria encontrado — ao contrário da v1 de FII, aqui o cadastro já nasceu
correto.

---

## 3. Métricas — o que medem e onde enganam

### 3.1 P/L (Preço sobre Lucro)

**Fórmula:** cotação ÷ lucro por ação (LPA), ou preço × total de ações ÷ lucro
líquido total.

**O que mede:** quantos anos de lucro atual o mercado está pagando pela ação.

**Armadilhas:**

1. **Lucro contábil pode ter evento não recorrente.** Venda de ativo, reversão
   de provisão, ganho cambial não operacional — infla o lucro de um trimestre
   e some depois. P/L calculado sobre esse lucro fica artificialmente baixo
   (parece barato) por um motivo que não se repete.
2. **Não serve para comparar setores diferentes.** P/L de banco e P/L de
   industrial partem de estruturas de capital e risco completamente distintas.
   Comparação só faz sentido dentro do mesmo setor.
3. **Empresa com lucro negativo não tem P/L.** Fica indefinido, não é
   "infinito bom" nem "ruim" — é ausência de sinal.
4. **Em holding, mistura o resultado das controladas.** Ver seção 1.

### 3.2 P/VP (ação)

**Fórmula:** cotação ÷ patrimônio líquido por ação.

Mesma lógica do FII, com uma diferença importante: em ação industrial, o
patrimônio contábil raramente reflete o valor de mercado do negócio (marca,
tecnologia, posição competitiva não entram no balanço pelo custo histórico).
**P/VP de ação operacional é bem menos informativo que P/VP de FII** — o ativo
do FII é o imóvel, com valor comparável a mercado; o ativo da empresa
operacional é a capacidade de gerar lucro futuro, que o balanço não capta.

**Exceção:** em banco, o patrimônio é majoritariamente ativo financeiro
(empréstimos, títulos), mais próximo de valor de mercado. P/VP tem mais
informação em banco do que em industrial.

### 3.3 ROE (Retorno sobre Patrimônio)

**Fórmula:** lucro líquido ÷ patrimônio líquido médio.

**O que mede:** quanto a empresa devolve de lucro para cada real de capital
próprio investido nela.

**Por que é a métrica mais universal da lista:** funciona em banco, industrial
e seguradora — os três têm patrimônio e lucro líquido no mesmo sentido
contábil. É o ponto de partida mais seguro para comparar empresas de setores
diferentes, mais seguro que P/L.

**Armadilha:** ROE alto pode vir de **alavancagem alta**, não de operação
eficiente. Empresa com pouco patrimônio próprio e muita dívida financiando o
ativo mostra ROE inflado. Sempre olhar junto com dívida/patrimônio ou
dívida/EBITDA.

### 3.4 Margem líquida e margem EBITDA

**Fórmula:** lucro líquido ÷ receita; EBITDA ÷ receita.

**Só se aplica a operacional "padrão".** Banco e seguradora não têm linha de
receita no sentido de faturamento por venda — pular essa métrica para os dois.

**Armadilha:** EBITDA exclui depreciação — empresa capital-intensiva
(industrial com fábrica grande) tem depreciação relevante que representa
desgaste real de ativo que será reposto. EBITDA bonito não significa que o
caixa sobra depois de manter a fábrica funcionando.

### 3.5 Dívida líquida / EBITDA

**Fórmula:** (dívida total − caixa e equivalentes) ÷ EBITDA.

**O que mede:** quantos anos de geração de caixa operacional seriam
necessários para quitar a dívida líquida.

**Não se aplica a banco.** Banco por natureza opera com "dívida" (captação de
depósitos) financiando ativo — a métrica de alavancagem correta ali é índice
de Basileia, não dívida/EBITDA.

### 3.6 Dividend Yield e Payout

**Fórmula:** DY = dividendos + JCP pagos em 12 meses ÷ cotação. Payout =
dividendos + JCP ÷ lucro líquido do período.

**Mesma armadilha do FII:** DY alto pode ser sintoma de preço em queda, não
prêmio. Ver seção 3.2 do documento de FII — vale integralmente aqui.

**Diferença em relação a FII:** FII é obrigado a distribuir 95% do lucro
caixa. Ação **não tem obrigação legal de distribuir** (a Lei das S.A. exige um
dividendo mínimo estatutário, tipicamente 25% do lucro ajustado, mas cada
empresa define o próprio percentual no estatuto, e pode reter mais para
reinvestir). **Payout baixo não é defeito** — pode ser empresa investindo em
crescimento em vez de distribuir. Payout precisa ser lido junto com ROE: payout
baixo e ROE alto pode ser bom sinal (reinveste com retorno melhor do que você
conseguiria fazer sozinho com o dinheiro).

### 3.7 Os 5 tickers não são pagadores de dividendo homogêneos

Pergunta natural olhando o universo: as 5 ações pagam dividendo, então dá pra
tratar como um grupo e aplicar a mesma régua de DY? **Não.** Verificado com
dado de mercado em 31/07/2026:

| Ticker | DY 12m (aprox.) | Padrão de payout |
|---|---|---|
| **TAEE11** | ~8,4% | Estatuto mínimo 90%, frequentemente 100% |
| **WEGE3** | ~4,4% | Baixo por escolha — dividendo por ação cresce ~19% a.a. via crescimento do lucro, não via % maior |
| **BBAS3** | — | **Caiu de média histórica ~45% para 30% neste ano** |

**TAEE11 distribui quase tudo porque a estrutura obriga, não porque é
"melhor pagadora".** É concessão de transmissão — sem licitar concessão nova,
não tem onde reinvestir o lucro. Payout alto aqui é consequência do regime
regulado (seção 1), não sinal de qualidade superior.

**WEGE3 tem DY baixo de propósito.** Reinveste boa parte do lucro, e o
dividendo por ação cresce por causa do lucro crescendo, não por elevar o
percentual distribuído. É o padrão descrito na armadilha 3 da seção 5 —
"payout baixo lido como problema" — só que agora com ticker real do seu
universo. Uma regra "vetar DY abaixo de X%" cortaria WEGE3 pelo motivo errado.

**BBAS3 é o caso que exige atenção contínua, não classificação fixa.** Banco
do Brasil é controlado pela União (~50% de participação). Achado em pesquisa
de mercado: o payout **caiu de média histórica de ~45% para 30% neste ano**,
e a leitura corrente liga a queda a risco de controle estatal — decisão de
distribuição de banco estatal pode responder a necessidade fiscal do governo
controlador, não só a fundamento do banco. Isso é mudança recente e concreta
no comportamento do próprio ativo testado na sua carteira, não ruído de fundo.

**Consequência de desenho:** "é pagador de dividendo" não pode ser rótulo
fixo por ticker. Precisa de duas coisas que uma DY estática de 12 meses não
entrega:

1. **Tendência de payout**, não só nível — queda brusca é sinal por si só,
   mesmo sem o motor julgar se é bom ou ruim.
2. **Comparação dentro do mesmo perfil**, não do grupo inteiro — DY alto de
   TAEE11 é normal para o regime dela; DY baixo de WEGE3 é normal para o
   dela. Comparar as duas com a mesma régua é o mesmo erro de categoria de
   aplicar margem líquida em banco.

Existe ainda um terceiro fator, fora do que é métrica financeira: **risco de
controle** (estatal em BBAS3, familiar/holding em ITSA4). Não é number que
entra em fórmula — é estrutura de governança que muda o que dividendo futuro
significa, e nenhuma das fontes CVM estruturadas confirmadas na seção 6
captura isso.

**Nota de proveniência, diferente do resto do documento:** o achado sobre
BBAS3 vem de leitura de mercado atual (blog e notícia financeira), não de
dado primário CVM verificado como o resto deste documento. Muda rápido e não
foi validado contra fonte regulatória. Tratar como sinal de atenção a
monitorar, não como fato estabelecido do mesmo peso que CNPJ ou DRE.

### 3.8 Métricas setoriais específicas

- **Banco:** índice de Basileia, inadimplência da carteira (NPL), margem
  financeira líquida (NIM), índice de eficiência (despesas administrativas ÷
  receita).
- **Seguradora:** índice combinado, sinistralidade, índice de despesas.
- **Concessionária regulada:** RAB, prazo remanescente de concessão, WACC
  regulatório definido pela agência.
- **Holding:** desconto sobre soma das partes, valor de mercado de cada
  participação.

Nenhuma dessas está no schema atual (`BrazilianStockFundamentalFacts` só tem
receita, lucro líquido, ativo total, patrimônio, caixa operacional) — ver
seção 6.

---

## 4. Tributação

Regra geral vigente até onde consigo verificar:

- **Dividendo:** isento de IR para pessoa física (regra vigente há décadas).
- **JCP (Juros sobre Capital Próprio):** tributado na fonte em **15%**,
  diferente de dividendo — empresa escolhe entre os dois instrumentos.
- **Ganho de capital na venda:** isento até **R$ 20.000 em vendas no mês**
  para ações negociadas em bolsa (soma de todas as vendas do mês, não por
  ativo). Acima disso, **15%** sobre o ganho (day trade tem alíquota própria,
  20%).

**Mesmo aviso do documento de FII: verifique antes de decidir qualquer coisa
com base nisto.** Havia reforma tributária em tramitação com potencial de
alterar tratamento de dividendo. Confirme na Receita Federal ou com contador.

---

## 5. Armadilhas frequentes

1. **Comparar P/L entre setores diferentes.** Ver 3.1.
2. **Usar margem líquida em banco ou seguradora.** Métrica de categoria
   errada — mesmo erro estrutural da v1 de FII aplicando vacância a fundo de
   papel.
3. **Ler payout baixo como problema.** Pode ser reinvestimento com ROE bom.
4. **ROE alto sem checar alavancagem.** Pode ser risco, não eficiência.
5. **LPA de holding sem saber a classe de ação.** ON e PN podem ter economics
   diferentes.
6. **P/VP de operacional lido como em FII.** Ativo intangível não capturado
   no balanço reduz a informação da métrica.
7. **Lucro de evento não recorrente inflando P/L.** Sempre checar se o
   resultado teve venda de ativo, reversão de provisão ou efeito cambial
   pontual.
8. **Tratar DY do grupo todo com a mesma régua.** Ver 3.7 — TAEE11 e WEGE3
   têm DY estruturalmente diferente por razões opostas.
9. **Ignorar queda de payout como se fosse nível estático.** Ver 3.7, caso
   BBAS3.

---

## 6. Ponte com o Papo de Futuro

### 6.1 Fonte confirmada — mesmo provedor CVM, dataset diferente

Baixei e conferi com dado real de 31/07/2026 o dataset **DFP estruturada**
(`dados.cvm.gov.br`), equivalente ao Informe Trimestral de FII mas para
companhias abertas em geral — inclusive as versões trimestrais existem
(`ITR`, já usado como fonte no seu schema atual: `cvm-itr`).

19 arquivos por ano, entre eles:

| Arquivo CVM | O que contém |
|---|---|
| `dfp_cia_aberta_BPA_con` / `BPP_con` | Balanço Patrimonial Ativo/Passivo, consolidado |
| `dfp_cia_aberta_DRE_con` | Demonstração de Resultado — inclui a linha `3.11` "Lucro/Prejuízo Consolidado do Período", **confirmada idêntica** para WEG (industrial) e Banco do Brasil (banco) |
| `dfp_cia_aberta_DFC_MD_con` / `DFC_MI_con` | Fluxo de Caixa, método direto/indireto |
| `dfp_cia_aberta_composicao_capital` | **Número de ações** — ON, PN, total, e em tesouraria |
| `dfp_cia_aberta_DVA_con` | Valor Adicionado |

**Achado confirmado com dado real:** o código `3.11` da DRE é padronizado pela
CVM e idêntico para os três tipos de empresa testados — WEG (industrial),
Banco do Brasil (banco) e, por extensão de estrutura, deve valer para os
demais. Isso significa que **lucro líquido é extraível com a mesma lógica de
parser para qualquer setor**, mesmo que o resto do balanço difira.

**Composição de capital confirmada com dado real:**

```
Banco do Brasil: 5.730.834.040 ações ON, 0 PN, 22.370.399 em tesouraria
Itaúsa:          3.853.634 mil ações ON, 7.360.053 mil ações PN, 2.340 mil em tesouraria
```

Itaúsa reporta ON e PN separadamente — confirma na prática a armadilha da
seção 1. **Calcular LPA de ITSA4 exige usar o total de ações PN, não o total
geral**, e essa distinção só aparece quando se lê a linha certa do CSV.

### 6.2 O que ainda falta — dividendos

FII usa `dividend-or-distribution` como tipo de evento já capturado pelo
`official_asset_events`. Para ação, **não encontrei fonte pública oficial
estruturada e aberta equivalente ao Tesouro Transparente**. B3 tem os dados,
mas o acesso é via chamada interna do site (não documentada como API aberta) —
provedores terceiros (brapi.dev e similares) replicam isso, com a mesma
ressalva de dependência de terceiro que descartei para NTN-B.

**Caminho mais consistente com o que você já tem:** o provider CVM IPE
(`src/data/context/official-events/cvm/ipe/`) já existe no seu código para
capturar Fato Relevante e Comunicado ao Mercado de companhias abertas — ele
não é específico de FII. Dividendo e JCP de companhia aberta são divulgados
via esse mesmo canal regulatório. Não verifiquei nesta sessão se o parser
atual já mapeia esse tipo de comunicado para `dividend-or-distribution` —
fica como item a checar antes de assumir que dividendo de ação já flui pelo
pipeline existente.

### 6.3 Quadro consolidado

| Sinal | Insumos | Situação |
|---|---|---|
| **Lucro líquido** | DRE código `3.11` | Confirmado, universal entre setores testados |
| **LPA** | lucro líquido ÷ `composicao_capital` (classe certa) | Confirmado, requer atenção à classe ON/PN |
| **P/L** | preço (`asset_prices`) + LPA | Requer novo provider CVM DFP/ITR |
| **ROE** | lucro líquido ÷ patrimônio (`BPP_con`) | Requer novo provider |
| **P/VP** | preço + patrimônio ÷ ações | Requer novo provider |
| **Margem líquida/EBITDA** | DRE completa | Requer novo provider; só aplicável a industrial |
| **Dívida líquida/EBITDA** | `BPP_con` + DRE | Requer novo provider; não aplicável a banco |
| **Dividend Yield / Payout** | dividendos pagos | **Sem fonte aberta confirmada** — ver 6.2 |
| Basileia, NIM, NPL (banco) | — | Não confirmado nos datasets CVM padrão nesta sessão |
| Índice combinado (seguradora) | — | Não confirmado nos datasets CVM padrão nesta sessão |
| RAB, prazo de concessão (regulado) | — | Fonte provavelmente ANEEL, não pesquisada nesta sessão |

**Conclusão operacional, no mesmo padrão do FII:** antes de qualquer regra de
veto, o schema precisa de um campo de **setor/regime** (banco, seguradora,
regulado, holding, industrial) — sem ele, uma regra de margem líquida
aplicada a BBAS3 repete o erro estrutural que a divisão tijolo/papel evita em
FII.

**Diferença em relação ao FII:** o dado de preço e qualidade básica (lucro,
patrimônio, ações) está mais avançado — mesma fonte CVM, mesmo padrão de
parser, achado com dado real nesta sessão. O que está genuinamente em aberto é
**dividendo** (sem fonte oficial tão limpa quanto o FII tem) e as **métricas
setoriais profundas de banco/seguradora/regulado**, que não pesquisei a fundo
ainda.

---

## 7. Limitações deste documento

- **Não contém recomendação de compra, venda ou ranking**, por escolha.
- **Não sou consultor de valores mobiliários licenciado.**
- **TAEE11 e PSSA3 não tiveram CNPJ baixado e conferido no CSV real** nesta
  sessão — setor confirmado por busca externa, não por dado primário como os
  outros três. Verificar antes de codar.
- **Métricas setoriais de banco, seguradora e regulado não foram
  confirmadas contra dataset real** — descritas por conhecimento geral, não
  testadas como as da seção 6.1.
- **Fonte de dividendo de ação segue em aberto.** Não afirmar que está
  resolvida até confirmar se o CVM IPE já cobre isso ou se precisa de fonte
  nova.
- Mesmo aviso do documento de FII sobre corte de conhecimento e verificação
  de ticker antes de qualquer decisão.

---

## Fontes consultadas

- [CVM — Portal de Dados Abertos, DFP estruturada](https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp) — CSVs de 2025 baixados e verificados em 31/07/2026 com dado real de WEG, Banco do Brasil e Itaúsa
- Busca de mercado para confirmação setorial de BBAS3, ITSA4, TAEE11, WEGE3, PSSA3 (fontes: Genial Investimentos, brapi.dev, iValor, Wikipedia — não primárias, sinalizado na seção 7)
