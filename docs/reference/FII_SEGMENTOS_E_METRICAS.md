# FII — Segmentos e Métricas

Material de referência para embasar as regras de sinal do Papo de Futuro.

**Versão:** 3 · **Escrito em:** 31 de julho de 2026
**Substitui:** `Analise_Completa_Categorias_FII.docx` (v1), que continha erros de
classificação de ticker documentados na seção "Correções da v1".
**v3 corrige a v2:** a v2 afirmava que vacância, contrato e concentração por
inquilino só existiam em "relatório gerencial" (PDF de layout livre por
gestora). Errado — a CVM publica um segundo informe, estruturado, com esses
campos prontos. Ver seção 7.

---

## Como ler este documento

**O que ele é:** referência estrutural sobre como fundos imobiliários
brasileiros funcionam, quais métricas existem, o que cada uma mede, de onde o
dado vem e onde ela engana.

**O que ele não é:** recomendação de compra, ranking de ativos ou lista de
limiares para seguir. A v1 trazia frases como "não recomendo", "próximas
adições sugeridas" e um "ranqueamento por segurança" — removidos aqui de
propósito. Ranquear segmento por "segurança" sem definir horizonte, sem preço
de entrada e sem o resto da carteira produz uma ordem que parece objetiva e não
é. Segmento não determina risco; contrato, inquilino, alavancagem e preço pago
determinam.

**Escolha de limiar é sua.** Este documento explica o que a métrica significa
para você decidir o corte com base própria.

---

## 1. A divisão que vem antes de tudo: tipo de fundo

A v1 pulou esta seção, e foi a causa direta dos seus erros de ticker. Antes de
perguntar "qual segmento?", pergunte "qual tipo?".

### Tijolo

O fundo é dono de imóvel físico. Recebe aluguel. Existe metro quadrado,
inquilino, contrato, vacância.

Métricas que fazem sentido: vacância, ocupação, cap rate, qualidade do
inquilino, prazo de contrato, localização.

### Papel

O fundo não é dono de imóvel nenhum. Ele compra **CRI** (Certificado de
Recebíveis Imobiliários) e outros títulos de crédito com lastro imobiliário. É
crédito, não propriedade.

Métricas de tijolo simplesmente não existem aqui. Perguntar a vacância de um
fundo de papel é erro de categoria — não há imóvel para ficar vazio.

Métricas que fazem sentido: indexador da carteira (CDI, IPCA, prefixado),
qualidade de crédito dos devedores, LTV das operações, inadimplência da
carteira de CRI, duration.

### FOF (Fundo de Fundos)

Compra cotas de outros FIIs. Métrica própria: taxa em dois níveis (paga a taxa
do FOF e indiretamente a dos fundos investidos), e o P/VP dele reflete o P/VP
médio da carteira.

### Por que isso derrubou a v1

A v1 classificou **MXRF11** como "Logística ABCD" e **KNCR11** como "Varejo
multi-inquilino" e depois como "Híbrido". Os dois são fundos de papel. Não têm
galpão, não têm loja, não têm vacância. A v1 também se contradisse: o mesmo
ticker apareceu em duas categorias diferentes em seções distintas.

**Consequência prática:** se você configurasse no motor uma regra do tipo
"vetar FII de varejo com ocupação abaixo de X", o KNCR11 seria julgado por uma
métrica que não existe para ele. A regra rodaria, produziria um número, e o
número seria lixo com aparência de análise.

---

## 2. Correções da v1

Verificado em 31 de julho de 2026 contra Funds Explorer, Investidor10, Clube
FII e fiis.com.br.

| Ticker | v1 dizia | Correto |
|---|---|---|
| **MXRF11** | Logística ABCD (tijolo) | **Papel** — carteira de CRI, gestão XP |
| **KNCR11** | Varejo / Híbrido (tijolo) | **Papel** — CRI indexado a CDI, gestão Kinea |
| **GGRC11** | "Corporativo Paulista excelente" | **Tijolo — logística/industrial** (hoje Zagros Renda Imobiliária) |
| **BRCR11** | "Galpões distribuição" | **Tijolo — lajes corporativas** (BC Fund) |
| **ABCP11** | "Absoluto Agro — terras arrendadas" | **Tijolo — shopping** (Grand Plaza Shopping) |
| **FLRV11** | "Fleury — laboratório/farmácia" | Ticker não localizado. Fleury é **ação (FLRY3)**, não FII |
| **HGJH11** | "Magia — prédios classe A" | Ticker não confirmado |
| **BBPO11** | "B3 Properties — prédios modulares" | Nome incorreto; BB Progressivo II, agências bancárias |

Acertos da v1, para registro: **PMLL11** (Pátria Malls — shopping) e o
enquadramento geral de shopping/logística/lajes como segmentos distintos.

Sobre a sua carteira, a v1 afirmava "PMLL11 + GGRC11 + KNCR11". O teste real do
motor mostrou **VEA, VNQ e HGRU11**. Não sei de onde a v1 tirou aquela
composição — provavelmente inventou. **HGRU11** é Pátria Renda Urbana, tijolo,
segmento renda urbana (varejo e educação), gestão Pátria.

---

## 3. Métricas — o que medem e onde enganam

Para cada uma: o que é, como se calcula, de onde vem o dado, e a armadilha.

### 3.1 P/VP (Preço sobre Valor Patrimonial)

**Fórmula:** cotação de mercado ÷ (patrimônio líquido ÷ cotas emitidas)

**Fonte:** cotação vem da B3. Patrimônio e cotas emitidas vêm do **Informe
Mensal CVM**.

**O que mede:** quanto o mercado paga em relação ao valor contábil do fundo.
Abaixo de 1,00, negocia com desconto sobre o patrimônio; acima, com ágio.

**Armadilhas:**

1. **Significa coisas diferentes em papel e em tijolo.** Fundo de papel marca a
   carteira de CRI a mercado com frequência, então o VP é atual e o P/VP tende a
   orbitar 1,00 — desvio grande ali é sinal forte. Fundo de tijolo avalia imóvel
   por laudo, tipicamente anual. O VP pode estar meses defasado da realidade.
   **O mesmo P/VP de 0,85 não quer dizer a mesma coisa nos dois.**
2. **Desconto pode ser correto.** Mercado às vezes precifica abaixo do laudo
   porque o laudo está otimista — vacância subindo, inquilino saindo, região
   deteriorando. Desconto não é sinônimo de barato.
3. **Laudo é opinião de avaliador**, não preço de transação.

**No Papo de Futuro:** calculável hoje. Você tem cotação em `asset_prices` e o
VP por cota já derivado em `fii-net-asset-value-per-issued-share.v1`. É a
métrica mais forte disponível sem fonte nova.

### 3.2 Dividend Yield

**Fórmula:** rendimentos distribuídos em 12 meses ÷ cotação atual

**Fonte:** distribuições são fato oficial — aparecem no Informe Mensal CVM e nos
comunicados. No seu banco, o tipo de evento `dividend-or-distribution` já
existe.

**Armadilhas — esta é a métrica que mais engana:**

1. **DY alto costuma ser sintoma, não prêmio.** O denominador é o preço. Preço
   caiu 30% porque o mercado viu problema? DY sobe 43% sozinho, sem nenhuma
   melhora no fundo. DY subindo rápido merece investigação, não entusiasmo.
2. **DY olha para trás.** Doze meses passados não são doze meses futuros.
3. **Distribuição não é lucro.** FII pode distribuir ganho de capital de venda
   de imóvel, ou receita não recorrente. O caixa some depois. Compare com o
   resultado recorrente, não com o valor distribuído.
4. **Número fixo não serve como corte.** A v1 dizia "6-8% saudável para varejo"
   sem citar fonte. O patamar razoável de DY **se move com o ciclo de juros**.
   Com Selic alta, o investidor exige mais prêmio; com Selic baixa, menos. Uma
   régua fixa de 6% significa coisas opostas em ciclos opostos.

   Referência mais estável: comparar o DY com a **NTN-B de prazo longo** (título
   público indexado ao IPCA). A diferença entre os dois é o prêmio que você está
   recebendo para aceitar risco imobiliário em vez de risco soberano. Se o
   prêmio some, você está assumindo risco de imóvel sem ser pago por isso.

### 3.3 Vacância — física e financeira

**São duas coisas distintas, e a v1 tratou como uma.**

- **Vacância física:** % da área locável desocupada.
- **Vacância financeira:** % da receita potencial não realizada.

**Por que a diferença importa:** um galpão vazio de 10.000 m² que valia aluguel
baixo pesa muito na vacância física e pouco na financeira. Uma laje pequena de
inquilino âncora premium é o inverso. **Vacância financeira geralmente informa
melhor sobre o caixa.**

Existe ainda a **carência**: inquilino já assinou, ainda não paga. Conta como
ocupado fisicamente e rende zero. Um fundo recém-locado pode mostrar ocupação
excelente e receita fraca por meses.

**Fonte:** CVM Informe Trimestral Estruturado, tabela `imovel`, campos
`Percentual_Vacancia` e `Percentual_Locado`, por imóvel. Estruturado, CSV,
público. Não está no seu schema hoje — ver seção 7.

### 3.4 Contrato típico vs atípico

Omissão grave da v1, e provavelmente a variável mais determinante de risco em
FII de tijolo.

- **Típico:** contrato comum de locação (Lei do Inquilinato). Após 3 anos cabe
  **ação revisional** para reajustar aluguel a mercado. Inquilino pode sair
  pagando multa proporcional, geralmente baixa.
- **Atípico:** built-to-suit ou sale-leaseback. Imóvel construído sob medida ou
  comprado do próprio ocupante. Prazo longo (10–15 anos), **multa de rescisão
  costuma cobrir os aluguéis remanescentes**, sem revisional.

**Consequência:** dois fundos com a mesma ocupação de 100% e o mesmo DY podem
ter risco completamente diferente. O de contrato atípico tem receita
contratada e blindada por anos. O de contrato típico está exposto à renovação.

**A pergunta que importa:** qual % da receita vence nos próximos 24 meses? Um
fundo com 100% de ocupação e 60% dos contratos vencendo ano que vem não é um
fundo estável.

**Fonte:** CVM Informe Trimestral Estruturado. A tabela `complemento` traz o
percentual da receita e do valor total vencendo em 13 faixas de tempo (até 3
meses, 3-6, 6-9 ... acima de 36 meses e indeterminado) — é o insumo direto para
calcular WALE. A tabela `imovel_renda_acabado_contrato` traz o texto livre das
características contratuais (típico/atípico), mas sem flag estruturada — a
classificação típico/atípico ainda exige ler o texto. Não está no seu schema
hoje — ver seção 7.

### 3.5 Concentração

Três eixos, e a v1 só mencionou um:

- **Por inquilino:** um inquilino com 40% da receita é um ponto único de falha.
- **Por imóvel:** um ativo com 50% do patrimônio idem.
- **Por região/setor:** logística inteira no mesmo eixo rodoviário concentra
  risco regional.

Diversificação numérica engana: "20+ inquilinos" (número da v1) com um deles
valendo 45% da receita não é diversificado.

**Fonte:** CVM Informe Trimestral Estruturado, tabela
`imovel_renda_acabado_inquilino` — uma linha por inquilino por imóvel, com
`Percentual_Receita_Imovel`, `Percentual_Receitas_FII` e `Setor_Atuacao`.
Estruturado. Não está no seu schema hoje — ver seção 7.

### 3.6 Alavancagem

Relevante sobretudo em fundos que compram imóvel com dívida (CRI emitido contra
o próprio ativo) e em fundos de papel com operações compromissadas.

Alavancagem amplifica os dois lados. Em ciclo de juros alto, custo de dívida
indexada pode comer a distribuição.

**Onde ver:** passivo no Informe Mensal CVM já ingerido. Detalhamento por
indexador (IPCA, IGP-M, INCC, INPC) na tabela `complemento` do Informe
Trimestral Estruturado.

### 3.7 Liquidez

Volume médio diário negociado. Não diz nada sobre qualidade do fundo — diz
sobre a sua capacidade de sair sem derrubar o preço.

Para aporte mensal pequeno, importa pouco. Para posição grande, importa muito.

### 3.8 Taxas

Administração + gestão, e em alguns casos **taxa de performance** sobre o que
exceder um benchmark (comum: IFIX ou IPCA + spread). Incide sobre patrimônio,
todo ano, independente de resultado.

Em FOF, cobrança em dois níveis.

---

## 4. Segmentos de tijolo

Para cada um: o que caracteriza, o que estruturalmente pesa, e quais métricas
da seção 3 mais importam.

### Shopping / Varejo

Receita tem componente fixo (aluguel mínimo) e variável (% sobre vendas do
lojista), mais aluguel em dobro em dezembro na maioria dos contratos. Isso torna
a receita **sazonal por construção** — comparar mês contra mês do ano anterior,
nunca mês contra mês anterior.

Métricas próprias do setor: **vendas por m²**, **custo de ocupação** (quanto o
aluguel representa do faturamento do lojista — se sobe demais, o lojista sai) e
NOI.

Pressões estruturais: e-commerce, dependência de renda discricionária, shopping
sem investimento em atualização perde fluxo de forma lenta e difícil de
reverter.

Exemplos verificados: PMLL11, ABCP11, XPML11, VISC11.

### Lajes corporativas / Escritório

Inquilino é empresa. Contratos típicos são comuns, então o risco de renovação
pesa.

Fatores dominantes: **localização** (regiões premium e periféricas se comportam
como mercados separados, não como graus do mesmo mercado), **classe do prédio**,
e custo de **retrofit** — prédio envelhecido exige capital pesado para
continuar competitivo.

Pressão estrutural relevante: trabalho híbrido alterou demanda por área. O
efeito não foi uniforme — imóvel bem localizado e moderno sofreu bem menos que
o resto.

Exemplos verificados: BRCR11, PVBI11.

### Logística e industrial

Galpões de armazenagem e distribuição. Contratos **atípicos são mais frequentes**
aqui, o que costuma dar previsibilidade maior de receita.

Fator dominante: **distância do centro consumidor**. Galpão em anel próximo a
capital e galpão distante são produtos diferentes com inquilinos diferentes.

Riscos: oferta nova pode saturar um eixo específico rapidamente — o ciclo de
construção de galpão é curto comparado ao de shopping.

Exemplos verificados: GGRC11, HGLG11, BTLG11.

### Renda urbana

Imóveis urbanos de uso comercial variado — varejo de rua, supermercados,
instituições de ensino — geralmente com contratos longos e atípicos.

É o segmento do **HGRU11**, que está na sua carteira.

### Residencial

Pouco representativo no mercado brasileiro de FII listado. Inquilino pessoa
física, ticket pulverizado, custo administrativo alto por contrato, prazo de
despejo longo em caso de inadimplência.

### Agro, saúde, educação, hotelaria, infraestrutura

Segmentos menores. O padrão comum: a receita depende fortemente da saúde
financeira de **um operador ou poucos operadores** do setor específico. O risco
não é imobiliário — é do setor do inquilino. Um fundo de hospital com um único
operador é, na prática, uma exposição de crédito àquele operador.

---

## 5. FII de papel — ausente na v1

Como não é tijolo, precisa de leitura própria.

**Indexador da carteira** é a variável mais determinante:

- **CDI:** acompanha juro de curto prazo. Distribui mais em Selic alta, menos
  quando cai. KNCR11 é o exemplo clássico.
- **IPCA + spread:** protege poder de compra, tem marcação a mercado mais
  volátil.
- **Prefixado:** perde se juro sobe.

**Qualidade de crédito:** CRI *high grade* (devedor grande, garantia sólida)
rende menos e quebra menos. *High yield* rende mais porque o risco é maior.
Um DY alto num fundo de papel frequentemente significa carteira high yield —
o prêmio está pagando risco de inadimplência, não é almoço grátis.

**LTV** (loan-to-value): valor da dívida sobre valor da garantia. Quanto menor,
mais protegida a operação.

**Inadimplência da carteira:** aqui a métrica existe e é central — mas é
inadimplência dos devedores dos CRIs, não de inquilino.

---

## 6. Tributação

Regra geral vigente até onde consigo verificar:

- **Rendimentos mensais:** isentos de IR para pessoa física, desde que o fundo
  tenha no mínimo **100 cotistas**, seja negociado exclusivamente em bolsa ou
  balcão organizado, e o cotista detenha **menos de 10%** das cotas.
- **Ganho de capital na venda:** tributado em **20%**, sem faixa de isenção —
  diferente de ações. Apuração e DARF mensais por conta do investidor.

**Verifique antes de decidir qualquer coisa com base nisto.** Meu corte de
conhecimento é anterior à data deste documento e havia reforma tributária em
tramitação no Brasil com potencial de alterar exatamente este ponto. Confirme na
Receita Federal ou com contador.

---

## 7. Ponte com o Papo de Futuro

### 7.1 Duas fontes CVM, não uma

O provider atual (`cvm-fii-inf-mensal`) lê o **Informe Mensal**. Existe um
**segundo informe**, separado: o **Informe Trimestral Estruturado** (Anexo
39-II da Instrução CVM 571/2015), publicado como CSV aberto em
`dados.cvm.gov.br`, atualizado semanalmente, com 5 anos de histórico. Achado em
31/07/2026, baixando e conferindo dado real de HGRU11 (CNPJ
29.641.226/0001-53), trimestre encerrado em 31/03/2026.

Ele vem em 6 tabelas relacionadas por CNPJ e data de referência:

| Tabela CVM | Granularidade | Campos relevantes |
|---|---|---|
| `geral` | 1 linha/fundo/trimestre | segmento declarado pelo próprio fundo, mandato, tipo de gestão |
| `imovel` | 1 linha/imóvel | `Percentual_Vacancia`, `Percentual_Inadimplencia`, `Percentual_Locado`, `Percentual_Receitas_FII`, área, endereço |
| `imovel_renda_acabado_contrato` | 1 linha/imóvel | `Caracteristicas_Contratuais` (texto livre) |
| `imovel_renda_acabado_inquilino` | 1 linha/inquilino/imóvel | `Setor_Atuacao`, `Percentual_Receita_Imovel`, `Percentual_Receitas_FII` |
| `complemento` | 1 linha/fundo/trimestre | 13 faixas de vencimento de receita e de valor total (insumo de WALE), percentual por indexador (IPCA/IGP-M/INCC/INPC) |
| `resultado_contabil_financeiro` | 1 linha/fundo/trimestre | `Resultado_Liquido_Total_Financeiro`, `Resultado_Financeiro_Liquido_Acumulado`, `Receita_Aluguel_Investimento_Financeiro` — resultado caixa, equivalente brasileiro de FFO |

Confirmado com HGRU11 real: 3 imóveis com vacância 0% e inadimplência 0%,
inquilinos identificados (Sam's Club Morumbi — 3,53% da receita do fundo,
setor Varejo), texto de contrato citando "lei do inquilinato... contratos
atípicos", e 94,3% da receita vencendo na faixa de 24-27 meses.

**O que isso não resolve:** valor de mercado do imóvel não é campo do informe
— cap rate exato fica sem fonte aberta. Leasing spread e same-store growth
exigem comparar o **mesmo imóvel entre trimestres diferentes**: não é campo
único, é histórico acumulado ao longo de várias execuções do provider.

### 7.2 NTN-B — Tesouro Transparente

Fonte oficial, sem chave, sem cadastro:

```
https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv
```

Colunas: `Tipo Titulo; Data Vencimento; Data Base; Taxa Compra Manha; Taxa
Venda Manha; PU Compra; PU Venda; PU Base`. Filtrar por
`Tipo Titulo = 'Tesouro IPCA+ com Juros Semestrais'` (nome atual da NTN-B
clássica) e pela `Data Base` mais recente.

Confirmado com dado real de 30/07/2026: vencimento 15/08/2060 negociando a
7,65% a.a. de taxa de compra — esse é o número que ancora o spread da seção
3.2.

**Decisão de implementação necessária:** "vencimento mais longo disponível"
muda com o tempo, conforme o Tesouro emite novos títulos. A regra de seleção
precisa ficar explícita no código, não fixada num vencimento que expira.

### 7.3 Quadro consolidado

| Sinal | Insumos | Situação |
|---|---|---|
| **P/VP** | `asset_prices` + `fii-net-asset-value-per-issued-share.v1` | Pronto para implementar |
| **DY 12m** | eventos `dividend-or-distribution` + Informe Trimestral | Requer novo provider CVM trimestral |
| **FFO / resultado recorrente** | `resultado_contabil_financeiro` | Requer novo provider CVM trimestral |
| **Spread sobre NTN-B** | DY + Tesouro Transparente CSV | Requer novo provider Tesouro |
| **Vacância física e financeira** | tabela `imovel` | Requer novo provider CVM trimestral |
| **Concentração por inquilino** | tabela `imovel_renda_acabado_inquilino` | Requer novo provider CVM trimestral |
| **WALE (vencimento de contrato)** | faixas de `complemento` | Requer novo provider CVM trimestral |
| **Indexador da carteira** | `complemento` | Requer novo provider CVM trimestral |
| Contrato típico/atípico | texto livre de `imovel_renda_acabado_contrato` | Campo existe, mas exige leitura de texto — não é flag pronta |
| Cap rate exato | NOI ÷ valor de mercado do imóvel | Sem fonte aberta para valor de mercado |
| Leasing spread, same-store | comparação entre trimestres | Exige série própria acumulada, não campo único |
| **Tipo do fundo (papel/tijolo/FOF)** | — | **Não existe no schema** |
| **Segmento** | — | **Não existe no schema** |

**Conclusão operacional, mantida da v2:** antes de qualquer regra de veto, o
schema precisa de **tipo** e **segmento**. Sem eles uma regra de tijolo
(vacância, WALE) seria aplicada a um fundo de papel, que não tem imóvel —
exatamente o erro que a v1 cometeu no papel e que o código repetiria com
números reais em vez de ticker errado.

Diferença central em relação à v2: quase tudo que parecia exigir parser de PDF
de layout livre por gestora na verdade é **CSV estruturado da CVM**, mesmo
padrão de ingestão que o provider mensal já usa, só que juntando 6 tabelas em
vez de 1.

---

## 8. Armadilhas frequentes

1. **DY alto tratado como qualidade.** Ver 3.2.
2. **P/VP comparado entre tipos diferentes.** Ver 3.1.
3. **Ocupação sem olhar vencimento de contrato.** 100% ocupado com metade
   vencendo em 12 meses não é estabilidade.
4. **Distribuição não recorrente lida como recorrente.** Venda de imóvel infla
   a distribuição de um mês e não se repete.
5. **Comparar mês contra mês em shopping.** Sazonalidade estrutural.
6. **Assumir que segmento define risco.** Contrato, inquilino, alavancagem e
   preço definem. Segmento é contexto, não veredito.
7. **Confiar em ticker de fonte secundária sem verificar.** Foi o que produziu a
   v1.

---

## 9. Limitações deste documento

- **Não contém recomendação de compra, venda ou ranking de ativos**, por
  escolha. Limiar é decisão sua.
- **Não sou consultor de valores mobiliários licenciado.** Isto é material
  educacional sobre estrutura de mercado.
- **Meu conhecimento tem corte anterior a esta data.** Classificações de ticker
  foram verificadas em 31/07/2026 nas fontes citadas, mas fundos mudam de
  gestora, nome e mandato — GGRC11 já mudou de nome. **Verifique contra CVM ou
  B3 antes de escrever qualquer ticker em código.**
- **Fontes secundárias** (Funds Explorer, Investidor10, Clube FII) são
  convenientes e às vezes divergem entre si. Fonte primária é CVM e o
  regulamento do fundo.
- **Faixas numéricas foram evitadas de propósito** onde não têm fonte
  verificável. A v1 apresentava números precisos sem origem; um número inventado
  com aparência de precisão é pior que a ausência dele.

---

## Fontes consultadas

- [Funds Explorer — MXRF11](https://www.fundsexplorer.com.br/funds/mxrf11)
- [Investidor10 — KNCR11](https://investidor10.com.br/fiis/kncr11/)
- [Funds Explorer — GGRC11 (Zagros Renda Imobiliária)](https://www.fundsexplorer.com.br/funds/ggrc11)
- [Clube FII — BRCR11 (BTG Pactual Corporate Office Fund)](https://www.clubefii.com.br/fiis/BRCR11)
- [Clube FII — HGRU11 (Pátria Renda Urbana)](https://www.clubefii.com.br/fiis/HGRU11)
- [Clube FII — PMLL11 (Pátria Malls)](https://www.clubefii.com.br/fiis/PMLL11)
- [Investidor10 — FIIs de tijolo](https://investidor10.com.br/fiis/tipos/tijolo/)
- [fiis.com.br — lista de fundos imobiliários](https://fiis.com.br/lista-de-fundos-imobiliarios/)
- [CVM — Portal de Dados Abertos, Informe Trimestral Estruturado FII](https://dados.cvm.gov.br/dataset/fii-doc-inf_trimestral) — dicionário de dados e CSVs baixados e verificados em 31/07/2026 com dado real de HGRU11
- [Tesouro Transparente — Preços e Taxas dos Títulos Públicos](https://www.tesourotransparente.gov.br/temas/divida-publica-federal/tesouro-direto) — CSV baixado e verificado em 31/07/2026, taxa de 30/07/2026
