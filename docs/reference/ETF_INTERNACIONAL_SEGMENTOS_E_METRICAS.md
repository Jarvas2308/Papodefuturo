# ETF Internacional — Segmentos e Métricas

Material de referência para embasar as regras de sinal do Papo de Futuro.
Mesma lógica dos documentos de [FII](FII_SEGMENTOS_E_METRICAS.md) e
[Ações BR](ACOES_BR_SETORES_E_METRICAS.md), adaptada ao que muda em ETF —
que é mais do que os outros dois.

**Versão:** 1 · **Escrito em:** 31 de julho de 2026

---

## Como ler este documento

Mesmas regras dos anteriores: referência estrutural, não recomendação,
ranking ou limiar pronto. Escolha de corte é sua. Não sou consultor de
valores mobiliários licenciado.

---

## 1. A divisão que vem antes de tudo — e por que muda de natureza aqui

Em FII a divisão era **tijolo vs papel**. Em ação, **regime do setor**. Em
ETF, a divisão é mais radical: **o fundo não tem opinião própria sobre
preço.**

VOO, VNQ e VEA são **fundos passivos de índice**. O gestor não escolhe ativo,
não decide entrar ou sair de posição, não tenta prever nada — o fundo apenas
replica uma cesta pré-definida por um índice de mercado (S&P 500 para VOO,
FTSE Nareit para VNQ, FTSE Developed ex-US para VEA).

**Consequência direta:** a pergunta "VOO está caro?" não é sobre o fundo. É
sobre **o S&P 500 inteiro**. Um ETF passivo não pode estar descontado ou caro
de forma independente do índice que ele replica — a arbitragem entre o preço
da cota e o valor dos ativos por trás (o mecanismo de criação/resgate de
cotas, operado por participantes autorizados) mantém os dois colados na
prática, salvo estresse de mercado pontual.

Isso divide as métricas em dois níveis que a v1 de FII nem precisou separar,
porque FII não tem esse problema:

- **Nível do fundo:** custo de manter a cota (taxa), o quanto ele replica o
  índice com fidelidade (tracking), e se o preço de mercado da cota está
  momentaneamente descolado do valor dos ativos que ela representa.
- **Nível do índice:** se o mercado que o índice representa está caro ou
  barato — isso é avaliação macro do S&P 500, do setor imobiliário
  americano, ou dos mercados desenvolvidos ex-EUA, não avaliação do fundo em
  si.

**Por que isso importa antes de configurar qualquer regra:** uma regra de
"P/VP" ou "desconto sobre patrimônio", que funciona bem em FII, é
**estruturalmente vazia em ETF passivo** — o desconto praticamente não existe
de forma persistente, porque a arbitragem fecha ele em horas, não em meses.
Aplicar a mesma lógica de FII aqui seria repetir, de novo, o erro de
categoria que atravessa os três documentos: usar a métrica certa no fundo
errado.

---

## 2. Verificação dos 3 tickers do universo

Diferente dos outros dois documentos, aqui não há erro de classificação
plausível a corrigir — são os três ETFs mais conhecidos e documentados da
Vanguard, replicados por milhões de investidores. Verificação de propósito,
não de ticker:

| Ticker  | Nome                                | Índice replicado                            | Categoria de ativo                                                         |
| ------- | ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| **VOO** | Vanguard S&P 500 ETF                | S&P 500                                     | Ações americanas, large cap, mercado amplo                                 |
| **VNQ** | Vanguard Real Estate ETF            | MSCI US Investable Market Real Estate 25/50 | REITs americanos — o equivalente americano do FII de tijolo                |
| **VEA** | Vanguard FTSE Developed Markets ETF | FTSE Developed All Cap ex US                | Ações de mercados desenvolvidos fora dos EUA (Europa, Japão, Canadá, etc.) |

**Achado que liga direto ao seu schema atual:** as 3 fórmulas já
implementadas (`etf-liabilities-to-assets`, `etf-net-assets-to-assets`,
`etf-balance-reconciliation-delta`) são conferência contábil — checam se
ativo, passivo e patrimônio batem. Isso é auditoria do relatório, **não**
avaliação de preço. Nenhuma das três responde "está barato". Esse ponto já
tinha sido levantado antes desta pesquisa; agora está confirmado com a
verificação do que o SEC N-PORT realmente entrega (seção 6).

---

## 3. Métricas de nível do fundo

O que se avalia no ETF em si, não no índice.

### 3.1 Expense ratio (taxa de administração)

**O que é:** percentual do patrimônio cobrado ao ano pelo gestor, descontado
diariamente do valor da cota — não é boleto separado, é embutido no preço.

**Por que importa:** é a única variável de custo garantida e previsível.
Diferente de retorno, que é incerto, a taxa **sempre** corrói o resultado, o
mercado subindo ou caindo.

**Situação real:** os três fundos da Vanguard neste universo são
historicamente conhecidos pela taxa muito baixa (fração de 0,1% ao ano) — é
o modelo de negócio da gestora. Não tenho o número exato e atual para
confirmar por fonte primária nesta sessão; ver seção 6 sobre onde esse dado
vive.

### 3.2 Tracking difference (diferença de rastreamento)

**Fórmula:** retorno do fundo − retorno do índice, no mesmo período.

**O que mede:** o quanto o fundo entrega a menos (ou a mais, raro) do que o
índice que promete replicar. Taxa de administração é o componente principal
da diferença, mas não o único — custo de rebalanceamento, tratamento fiscal
de dividendo estrangeiro e técnica de amostragem (fundo grande demais para
comprar as 4.000+ ações do FTSE Developed literalmente) também entram.

**Armadilha:** tracking difference persistente maior que a taxa de
administração sozinha é sinal de operação ineficiente do fundo — vale mais
que olhar só o número da taxa.

### 3.3 Prêmio/desconto sobre o NAV

**Fórmula:** preço de mercado da cota ÷ NAV (valor patrimonial líquido por
cota, calculado pelo próprio fundo).

**É o equivalente mais próximo do P/VP de FII que existe em ETF** — mas com
comportamento bem diferente. Em fundo líquido e replicando mercado líquido
(caso de VOO), o desvio normalmente fica em fração de centavo, corrigido em
minutos pela arbitragem. Desvio relevante e persistente costuma acontecer em
mercado de menor liquidez ou em estresse — no caso de VEA, isso pode
acontecer quando os mercados internacionais que ele replica estão fechados
enquanto a bolsa americana negocia a cota (fuso horário), então o preço da
cota reage a notícia nova antes do NAV (calculado sobre preço de fechamento
de mercados fora dos EUA) atualizar.

**Fonte (revisada, DEC-092):** o N-PORT foi inspecionado com filing real da
VOO (`accessionNumber 0000036405-26-000325`, `primary_doc.xml` completo,
~90 tags XML listadas) e **não contém** NAV por cota nem cotas em
circulação — a premissa original desta seção estava errada (ver 6.1/6.2
para o histórico). Fonte real implementada: o próprio site do emissor
(`investor.vanguard.com`), que a SEC obriga a publicar diariamente NAV,
preço de mercado e prêmio/desconto (Rule 6c-11) — endpoint JSON não
documentado por trás da página pública do fundo, sem autenticação,
confirmado com fetch direto devolvendo o mesmo dado exibido na página.
Diferente de CVM/SEC, sem accession number nem identidade documental
formal — a proveniência possível é a URL do endpoint e a
`referenceDate`/`effectiveDate` que a própria Vanguard atribui ao dado.
Risco aceito explicitamente: endpoint interno, sem contrato público, pode
mudar ou parar de responder sem aviso — a ingestão falha fechado (erro
estruturado, nunca dado silenciosamente errado) se o formato mudar.

### 3.4 Liquidez e AUM (patrimônio total sob gestão)

Volume negociado e patrimônio total. Os três fundos deste universo estão
entre os maiores do mundo em suas categorias — liquidez não é o ponto de
atenção aqui, ao contrário de FII pequeno ou ação de menor porte.

---

## 4. Métricas de nível do índice — a "está barato" de verdade

Aqui mora a resposta real à pergunta original sobre preço, porque o fundo
não tem preço próprio — herda o do índice.

### 4.1 CAPE / Shiller P/E (para VOO)

**Fórmula:** preço do índice ÷ média móvel de 10 anos do lucro por ação,
ajustada pela inflação.

**Por que essa versão e não o P/L comum:** lucro de 1 ano isolado é volátil
— um ano de recessão distorce o P/L pontual pra cima ou pra baixo. A média de
10 anos suaviza ciclo econômico, entregando leitura mais estável sobre se o
mercado amplo está caro em relação à própria história de longuíssimo prazo.

**Armadilha:** CAPE alto não prevê queda no curto prazo — é medida de ciclo
longo, não de timing. Mercado pode ficar "caro" por anos antes de qualquer
correção. Serve para calibrar expectativa de retorno de década, não para
decidir o aporte do mês.

**Fonte confirmada:** dataset de Robert Shiller (Yale), atualizado
mensalmente, aberto, sem chave, formato XLS, com histórico desde 1871.

### 4.2 Dividend yield do setor + spread sobre o título real americano (para VNQ)

**Mesma lógica do FII, adaptada pro mercado americano.** VNQ é uma cesta de
REITs — a estrutura é quase idêntica à do FII brasileiro (obrigação legal de
distribuir a maior parte do lucro tributável, renda vem de aluguel). A
armadilha de "DY alto pode ser sintoma de preço caindo" vale integralmente
aqui (ver seção 3.2 do documento de FII).

**A âncora muda:** no Brasil era NTN-B (título público indexado ao IPCA). Nos
EUA, o equivalente é o **TIPS de 10 anos** (Treasury Inflation-Protected
Securities) — título público americano indexado à inflação americana. O
spread entre o DY de VNQ e a taxa real do TIPS de 10 anos mede o mesmo
prêmio de risco imobiliário que o spread brasileiro mede, só que no mercado
americano.

**Fonte confirmada:** FRED (Federal Reserve Economic Data, Fed de St. Louis),
série `DFII10`. Diferença importante em relação ao Tesouro Transparente:
**FRED exige cadastro gratuito de chave de API** — não é CSV público sem
chave como o brasileiro. Detalhe de implementação a considerar, não
impedimento.

### 4.3 CAPE / P/L agregado para mercados desenvolvidos ex-US (para VEA)

**Aqui o documento fica honesto sobre um limite real.** Diferente do S&P 500,
que tem o dataset de Shiller como referência única e amplamente aceita, não
encontrei nesta sessão uma fonte pública única e igualmente estabelecida de
CAPE agregado para o índice FTSE Developed ex-US especificamente. Provedores
de índice (MSCI, FTSE Russell) publicam valuation de seus próprios índices,
mas atrás de licença comercial — não é dado aberto.

**Isso não significa que não dá pra avaliar VEA.** Significa que a fonte
exige mais pesquisa dedicada antes de prometer um número confiável — diferente
de VOO e VNQ, onde a fonte já está confirmada e aberta.

---

## 5. Tributação — o que muda em ativo estrangeiro

Diferente de FII e ação brasileira, aqui entra **imposto de renda
americano na fonte**, além da regra brasileira.

- **Dividendo pago por ETF americano a investidor brasileiro:** retenção na
  fonte nos EUA, tipicamente 30% (pode variar por tratado — Brasil não tem
  tratado de bitributação amplo com os EUA para esse fim, ao contrário de
  outros países).
- **Ganho de capital na venda, para pessoa física brasileira:** tributado
  como "ativo no exterior" pela legislação brasileira — regra distinta da
  isenção de R$ 20.000/mês que vale para ação negociada na B3. Câmbio na
  data da operação entra no cálculo.

**Mesmo aviso dos outros dois documentos, reforçado aqui:** esta é a área
tributária mais mutável dos três — regra de tributação de investimento no
exterior por pessoa física brasileira tem histórico de mudança frequente.
**Verifique com contador antes de qualquer decisão.** Não tratar nada desta
seção como vigente sem confirmação.

---

## 6. Ponte com o Papo de Futuro

### 6.1 O que o SEC N-PORT já entrega — e o que falta pedir a ele

Provider atual (`src/data/fundamentals/sec/nport/`) já busca e ingere N-PORT
para os 3 tickers, mas só extrai 3 campos:
`totalAssets`, `totalLiabilities`, `netAssets`. Confirmado lendo o código
(`src/data/fundamentals/sec/nport/types.ts` e `provider.ts`).

O formulário N-PORT, no entanto, foi originalmente presumido conter — na
Parte C, informação a nível de fundo — campos que o parser atual não lê
ainda: **NAV por cota** e **total de cotas em circulação**. **Premissa
derrubada em DEC-092**: filing real da VOO baixado e inspecionado por
completo (`accessionNumber 0000036405-26-000325`, ~90 tags XML) e nenhum
campo do N-PORT corresponde a NAV por cota nem cotas em circulação
(`totAssets`/`totLiabs`/`netAssets` no nível do fundo é tudo que existe;
`monthlyTotReturns` é retorno percentual, não cotas). Não é o mesmo padrão
do FII (campo estruturado esperando o parser) — é dado que genuinamente não
está nessa fonte. Fonte real implementada: site do próprio emissor, ver 3.3
e 6.2.

### 6.2 O que exige fonte nova

| Sinal                                          | Fonte                                        | Situação                                                                  |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| **Prêmio/desconto sobre NAV**                  | Site do emissor (`investor.vanguard.com`)    | **Resolvido e implementado (DEC-092)** — N-PORT confirmado sem esse campo |
| **Expense ratio**                              | Não confirmado nesta sessão                  | Ver 6.3                                                                   |
| **Tracking difference**                        | Retorno do fundo (preço) + retorno do índice | Requer série do índice, não confirmada nesta sessão                       |
| **CAPE do S&P 500 (VOO)**                      | Shiller Data, Yale                           | **Confirmado, aberto, sem chave**                                         |
| **Spread de VNQ sobre TIPS 10 anos**           | FRED, série `DFII10`                         | **Confirmado, requer chave gratuita**                                     |
| **CAPE de mercados desenvolvidos ex-US (VEA)** | —                                            | **Sem fonte aberta única confirmada** — pesquisa adicional necessária     |

### 6.3 Expense ratio — gap sinalizado, não resolvido

Diferente de todos os outros sinais deste e dos outros dois documentos, não
encontrei nesta sessão uma fonte **regulatória aberta e estruturada** para
taxa de administração corrente. O dado existe publicamente no prospecto do
fundo e no site da própria gestora (Vanguard), mas isso é fonte do emissor,
não órgão regulador — categoria de proveniência diferente do CVM/SEC N-PORT
que ancora o resto deste trabalho. Marcado como pendência de pesquisa, não
como resolvido.

### 6.4 Conclusão operacional

Padrão idêntico aos outros dois documentos se repete: **antes de qualquer
regra de veto, o schema precisa registrar se o ativo é fundo passivo de
índice** (o que já é verdade pela categoria `international-etf`, mas o
motor ainda não usa essa distinção para saber que "preço caro/barato" deve
olhar o índice, não o fundo). Sem essa distinção, uma regra desenhada com a
mentalidade de FII (desconto sobre patrimônio) seria aplicada a um fundo que
estruturalmente não tem esse tipo de desconto persistente — o mesmo erro de
categoria, pela terceira vez, em roupagem diferente.

---

## 7. Armadilhas frequentes

1. **Procurar desconto persistente sobre NAV em ETF líquido.** Arbitragem
   fecha isso rápido — não é onde mora o sinal de preço.
2. **Julgar o fundo pelo que é do índice.** "VOO está caro" é pergunta sobre
   o S&P 500, não sobre a Vanguard.
3. **CAPE alto como sinal de timing de curto prazo.** É medida de ciclo
   longo — ver 4.1.
4. **DY de VNQ sem comparar com TIPS.** Mesma armadilha de FII, mercado
   diferente.
5. **Assumir CAPE de VEA existe tão prontamente quanto o de VOO.** Não
   confirmado — ver 4.3 e 6.2.
6. **Ignorar retenção de imposto americano na fonte.** Diferente de FII e
   ação BR — ver seção 5.

---

## 8. Limitações deste documento

- **Não contém recomendação de compra, venda ou ranking**, por escolha.
- **Não sou consultor de valores mobiliários licenciado.**
- **NAV por cota e cotas em circulação não existem no N-PORT** (revisado em
  DEC-092, XML real inspecionado por completo) — a hipótese original desta
  seção estava errada. Prêmio/desconto sobre NAV foi resolvido por fonte
  diferente (site do próprio emissor, ver 3.3/6.2); cotas em circulação
  isoladas seguem sem fonte confirmada.
- **Expense ratio corrente dos três fundos não foi verificado contra fonte
  primária nesta sessão.**
- **CAPE para mercados desenvolvidos ex-US permanece sem fonte aberta única
  identificada.** Maior lacuna de pesquisa dos três documentos.
- **Seção de tributação é a mais sujeita a mudança dos três documentos** —
  confirmar sempre antes de qualquer decisão.

---

## Fontes consultadas

- [Robert Shiller — Online Data, Yale](http://www.econ.yale.edu/~shiller/data.htm) — dataset público, XLS, sem chave, CAPE do S&P 500
- FRED (Federal Reserve Bank of St. Louis) — série `DFII10`, taxa real do TIPS de 10 anos; exige chave de API gratuita
- Código-fonte do provider atual: `src/data/fundamentals/sec/nport/types.ts` e `provider.ts`, lido em 31/07/2026
- Conhecimento geral de mercado sobre VOO, VNQ, VEA (fundos amplamente documentados pela própria Vanguard) — não houve necessidade de correção de ticker como na v1 de FII
