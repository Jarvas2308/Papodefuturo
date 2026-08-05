# Regras de Pontuação — Rascunho

Proposta de estrutura para o motor virar recomendador (Desenho B, escolhido em
31/07/2026): dado externo pontua cada ativo elegível, não só veta.

**Versão:** 1 · **Escrito em:** 31 de julho de 2026
**Status:** rascunho para edição. Limiares numéricos são ponto de partida
proposto, não recomendação — escolha de corte é sua, edite livremente.
**Depende de:** [FII](FII_SEGMENTOS_E_METRICAS.md),
[Ações BR](ACOES_BR_SETORES_E_METRICAS.md) e
[ETF](ETF_INTERNACIONAL_SEGMENTOS_E_METRICAS.md) — cada linha remete à seção
correspondente.

---

## Como este documento funciona

Cada sinal contribui de **-2 a +2** pontos para o ativo. A soma dos pontos
disponíveis é o score do ativo naquele aporte.

**Regra central:** sinal sem provider construído ainda não conta como 0 —
fica em estado `unavailable`, explícito, do mesmo jeito que o resto do
sistema trata dado ausente (`fundamental-derived-facts`,
`no-fundamental-score` etc.). Zero pontos por omissão seria confundir "não
sei" com "neutro", que são coisas diferentes.

**Coluna Status:**

- **Pronto hoje** — calculável com dado já ingerido, sem provider novo
- **Precisa provider X** — dado existe na fonte confirmada nos documentos de
  referência, falta construir o parser/ingestão
- **Gap de pesquisa** — fonte ainda não confirmada, não é só questão de
  codar

---

## 1. FII — tijolo

| Sinal                                                   | Regra proposta             | Pontos | Status                                                  | Referência   |
| ------------------------------------------------------- | -------------------------- | ------ | ------------------------------------------------------- | ------------ |
| P/VP                                                    | < 0,90                     | +2     | **Implementado (DEC-086)**                              | FII 3.1      |
| P/VP                                                    | 0,90 – 1,00                | +1     | idem                                                    | FII 3.1      |
| P/VP                                                    | 1,00 – 1,10                | 0      | idem                                                    | FII 3.1      |
| P/VP                                                    | > 1,10                     | -2     | idem                                                    | FII 3.1      |
| Spread DY sobre NTN-B longa                             | > 1,5 p.p.                 | +2     | Precisa valor de provento (so evento ingerido, DEC-082) | FII 3.2, 7.2 |
| Spread DY sobre NTN-B longa                             | 0 – 1,5 p.p.               | 0      | idem                                                    | FII 3.2      |
| Spread DY sobre NTN-B longa                             | < 0                        | -2     | idem                                                    | FII 3.2      |
| Vacância financeira                                     | < 5%                       | +1     | **Implementado (DEC-085)**                              | FII 3.3, 7.1 |
| Vacância financeira                                     | 5% – 15%                   | 0      | idem                                                    | FII 3.3      |
| Vacância financeira                                     | > 15%                      | -1     | idem                                                    | FII 3.3      |
| WALE (substitui "receita vencendo em 24m", ver DEC-085) | > 48 meses                 | +1     | **Implementado (DEC-085)**                              | FII 3.4, 7.1 |
| WALE                                                    | 24 – 48 meses              | 0      | idem                                                    | FII 3.4      |
| WALE                                                    | < 24 meses                 | -1     | idem                                                    | FII 3.4      |
| Concentração do maior inquilino                         | > 40% da receita do imóvel | -1     | **Implementado (DEC-085)**                              | FII 3.5, 7.1 |

## 2. FII — papel

Métricas de tijolo (vacância, WALE, concentração de inquilino) não se
aplicam — permanecem `unavailable` por definição, não por falta de dado.

| Sinal                                      | Regra proposta | Pontos                              | Status           | Referência |
| ------------------------------------------ | -------------- | ----------------------------------- | ---------------- | ---------- |
| P/VP                                       | < 0,98         | +1                                  | Pronto hoje      | FII 3.1, 5 |
| P/VP                                       | 0,98 – 1,02    | 0                                   | Pronto hoje      | FII 3.1    |
| P/VP                                       | > 1,02         | -1                                  | Pronto hoje      | FII 3.1    |
| Spread DY sobre NTN-B longa                | > 1,5 p.p.     | +2                                  | Precisa provider | FII 3.2    |
| Spread DY sobre NTN-B longa                | < 0            | -2                                  | idem             | FII 3.2    |
| Indexador da carteira (CDI/IPCA/prefixado) | —              | 0 (informativo, não pontua sozinho) | Precisa provider | FII 5      |

---

## 3. Ações BR — por regime

Aplicar métrica fora do regime correto é o erro central documentado em
Ações BR, seção 1. Tabela abaixo já filtra por regime.

| Sinal                           | Regra proposta                                | Pontos | Aplica a                      | Status                                                                                                                                                 | Referência     |
| ------------------------------- | --------------------------------------------- | ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| ROE                             | > 15%                                         | +2     | Todos exceto holding pura     | **Implementado (DEC-090)**                                                                                                                             | Ações 3.3, 6.1 |
| ROE                             | 8% – 15%                                      | 0      | idem                          | idem                                                                                                                                                   | Ações 3.3      |
| ROE                             | < 8%                                          | -1     | idem                          | idem                                                                                                                                                   | Ações 3.3      |
| Payout, variação ano contra ano | queda > 10 p.p.                               | -2     | Todos                         | Precisa valor de provento (so evento ingerido, DEC-082, mesmo bloqueio de FII)                                                                         | Ações 3.7      |
| Payout, variação ano contra ano | dentro de ±5 p.p. do padrão do próprio regime | 0      | Todos                         | idem                                                                                                                                                   | Ações 3.7      |
| Dívida líquida / EBITDA         | > 3x                                          | -1     | Todos exceto banco            | Bloqueado - divida financeira e D&A nao sao extraidos do DFP/ITR ainda (provider novo, nao so o motor)                                                 | Ações 3.5      |
| Dívida líquida / EBITDA         | < 1x                                          | +1     | idem                          | idem                                                                                                                                                   | Ações 3.5      |
| P/L vs própria série histórica  | abaixo do próprio quartil inferior            | +1     | Todos exceto banco/seguradora | Bloqueado - so 1-2 periodos ingeridos por empresa ate agora, quartil de amostra tao pequena nao e' confiavel (mecanismo existiria, dado historico nao) | Ações 3.1      |

**Nota deliberada:** nenhum limiar fixo de nível de payout (ex.: "payout <
X% é ruim"). TAEE11 (90–100% normal) e WEGE3 (baixo normal) quebrariam régua
fixa — ver Ações 3.7. Por isso a regra usa **variação**, não nível absoluto.

**Pendente de decisão:** métricas específicas de banco (Basileia, NIM, NPL),
seguradora (índice combinado) e regulado (RAB) não têm linha nesta tabela —
Ações 3.8 não confirmou fonte estruturada para elas nesta sessão. Ficam de
fora do score até pesquisa dedicada.

**Atualização (DEC-090):** ROE implementado — único sinal de ação
tecnicamente viável com o dado já ingerido hoje. Os 3 restantes ficam
bloqueados por motivos diferentes, não pela mesma causa: payout precisa do
valor do provento (mesmo bloqueio de FII, DEC-082); dívida/EBITDA precisa
de um provider novo (dívida financeira e D&A não são extraídos do
DFP/ITR); P/L histórico precisa de mais períodos acumulados por empresa do
que os 1-2 já ingeridos (o mecanismo de cálculo existiria, só falta
profundidade histórica real).

---

## 4. ETF

| Sinal                                      | Regra proposta               | Pontos        | Aplica a | Status                                                                                                                                                                                                                     | Referência   |
| ------------------------------------------ | ---------------------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| CAPE vs própria média histórica de 10 anos | abaixo da média              | +2            | VOO      | Bloqueado — ingestão atual (DEC-084) guarda só o ponto mais recente, descarta o histórico já presente no mesmo arquivo baixado; precisa reingestão + repositório de leitura + módulo de score de ETF (nenhum existe ainda) | ETF 4.1, 6.2 |
| CAPE vs própria média histórica de 10 anos | acima da média               | -1            | VOO      | idem                                                                                                                                                                                                                       | ETF 4.1      |
| Spread DY sobre TIPS 10 anos               | > 1 p.p.                     | +2            | VNQ      | Fonte confirmada (FRED), bloqueado por chave de API (usuário)                                                                                                                                                              | ETF 4.2, 6.2 |
| Spread DY sobre TIPS 10 anos               | < 0                          | -2            | VNQ      | idem                                                                                                                                                                                                                       | ETF 4.2      |
| Prêmio/desconto sobre NAV                  | \|desvio\| > 0,5%            | -1            | Todos    | Precisa expandir parser N-PORT                                                                                                                                                                                             | ETF 3.3, 6.1 |
| —                                          | sem sinal de preço confiável | `unavailable` | VEA      | Gap de pesquisa — sem fonte de CAPE fechada                                                                                                                                                                                | ETF 4.3, 6.2 |

---

## 5. Como o score entra no motor — decidido em 31/07/2026

**Escolhida: Opção 2 — score ajusta prioridade, não só desempate.**

### Mecanismo proposto

O laço guloso hoje (`targetAllocationStrategy.ts`) escolhe o candidato que
mais reduz `calculateDeviation` (em pontos-base, aritmética `BigInt` exata).
Para o score influenciar prioridade sem introduzir ponto flutuante nem
segunda escala de comparação, a proposta é converter score em **ajuste no
próprio espaço de pontos-base**:

```
desvioAjustado = desvioCandidato − (score × pesoDoScoreEmPontosBase)
```

`pesoDoScoreEmPontosBase` é uma constante configurável — você decide quanto
1 ponto de score vale em pontos-base de desvio. Isso mantém toda a
comparação dentro do mesmo `compareDeviation` já testado, sem criar
normalização nova entre escalas diferentes.

### Trava de segurança obrigatória

Score **não pode** fazer o motor comprar um ativo que já está acima da
meta — isso quebraria o propósito de rebalanceamento e o princípio 6 do
produto ("usuário sempre possui a decisão final" pressupõe que o motor
rebalanceia, não que persegue score puro).

Regra: o ajuste de score só se aplica **depois** que um candidato já passou
no teste de melhora existente (`compareDeviation(bestDeviation,
currentDeviation) < 0` — a mesma condição que hoje gera `stopReason:
'no-improving-purchase'`). Score reordena **quem, entre os que já melhoram a
carteira, é priorizado primeiro** — nunca decide sozinho que uma compra que
piora ou não muda o desvio deve entrar.

### Consequência para os testes

Muda o comportamento central do motor (60+ testes existentes cobrem
`targetAllocationStrategy.ts`). Precisa de nova bateria específica: mesmo
desvio + scores diferentes deve mudar a ordem de compra; score não deve
nunca produzir `stopReason` diferente de `no-improving-purchase` para uma
compra que reduz desvio.

---

## 6. Limitações deste documento

- Pontos e limiares são proposta inicial — não é conselho de investimento,
  edite cada linha livremente.
- Metade das linhas depende de provider que ainda não existe. Este documento
  não avança nada tecnicamente até os providers da seção "Status" serem
  construídos.
- Métricas setoriais de banco, seguradora e regulado (ação), e CAPE de VEA e
  expense ratio (ETF), ficam fora da tabela até pesquisa adicional — não
  finja disponibilidade que os documentos de referência já marcaram como gap.
- A decisão da seção 5 bloqueia início de implementação do motor em si.
- **Atualização (DEC-085/DEC-086):** o mecanismo da seção 5 está implementado
  desde a Fase 5, fatia 1 — `desvioAjustado`, trava de segurança e 4 sinais
  de FII tijolo com dado pronto (vacância, WALE, concentração, P/VP). O
  motor está conectado ao fluxo real de aporte (`useContributionData.ts`),
  com semeadura automática das faixas default na primeira vez que o
  usuário simula um aporte técnico. Ação e ETF ainda não têm nenhum sinal
  calculado; spread de DY sobre NTN-B segue pendente dentro da própria
  fatia FII (precisa do valor do provento, não só o evento — ver seção 1).
