# Auditoria de providers de notícias editoriais V2

- Versão: `editorial-news-provider-audit.v2`
- Data de referência: 20 de julho de 2026
- Escopo: pesquisa, documentação e decisão arquitetural
- Decisão: **NO-GO — nenhum provider aprovado**

## 1. Resumo executivo

Nenhum dos oito providers auditados comprovou simultaneamente licença comercial
efetiva para uma aplicação multiusuário, direitos suficientes sobre os campos a
exibir, identidade forte do instrumento e cobertura dos 12 ativos do universo
fechado. A ausência de prova foi tratada como bloqueio, nunca como permissão.

GDELT possui licença aberta para seus datasets e custo zero, mas DOC 2.0 e
Context 2.0 associam conteúdo por texto e contexto lexical. NewsAPI e Alpha
Vantage também oferecem busca ou associação baseada em menção textual. Finnhub
documenta Company News apenas para companhias norte-americanas. Marketaux possui
schema de entidades promissor, porém seus termos públicos restringem uso
comercial e acesso automatizado sem aprovação. FMP, Massive com Benzinga e
Benzinga direta exigem acordo comercial específico e ainda não comprovam os
quatro FIIs e as identidades fortes dos 12 ativos.

Assim, não existe autorização para criar provider, contrato runtime, storage,
migration, repository, UI, IA, sentimento ou score editorial. O produto mantém
a política **Eventos Oficiais Primeiro**. A próxima ação permitida é apenas um
deployment controlado dos eventos oficiais mediante autorização separada.

Este documento não constitui aconselhamento jurídico. Qualquer contrato futuro
de dados deve receber revisão jurídica antes de assinatura ou implementação.

## 2. Escopo

A auditoria avaliou uso comercial, aplicação multiusuário, display,
redistribuição, armazenamento, cache, retenção, atribuição, copyright,
identidade, cobertura, histórico, atualização, rate limits, custo, segurança,
estabilidade e operação. Não foram criadas contas, trials, chaves, formulários
comerciais ou chamadas autenticadas.

Foram preservadas as fronteiras:

- `OfficialAssetEventV1`: fato regulatório, identidade oficial, storage e UI
  próprios;
- `EditorialAssetNewsV1`: contrato apenas conceitual, separado, sem
  implementação, storage ou UI;
- Motor V2 e Dossiê Técnico: permanecem independentes de notícias.

## 3. Universo fechado

| Classe              | Ativos                             |
| ------------------- | ---------------------------------- |
| Ações brasileiras   | BBAS3, ITSA4, TAEE11, WEGE3, PSSA3 |
| FIIs                | KNRI11, VISC11, XPLG11, HGRU11     |
| ETFs internacionais | VOO, VNQ, VEA                      |

TAEE11 foi tratada como ação/unit, nunca como FII. Cobertura de ADR, REIT,
Vanguard genericamente ou componente de índice não foi aceita como cobertura do
instrumento auditado.

## 4. Método

1. Leitura integral dos contratos, decisões e estado funcional do projeto.
2. Consulta apenas a termos, pricing, documentação e páginas oficiais.
3. Separação entre licença do agregador e direitos do publisher.
4. Classificação conservadora de licença: `PASS`, `CONDITIONAL`, `FAIL` ou
   `UNVERIFIED`.
5. Classificação de identidade: `exact`, `strong-provider-mapping`, `text-only`,
   `ambiguous` ou `unsupported`.
6. Cobertura somente considerada comprovada com reconhecimento da entidade e
   vínculo forte, não por retorno de busca textual.
7. Plano “contact sales” tratado como condicional.
8. Informação ausente tratada como não comprovada.

## 5. Gates obrigatórios

Um provider único precisa passar todos estes gates:

| Gate       | Critério de aprovação                                                |
| ---------- | -------------------------------------------------------------------- |
| Licença    | Produção comercial e aplicação multiusuário expressamente permitidas |
| Copyright  | Campos exibidos e retidos expressamente licenciados                  |
| Identidade | `exact` ou `strong-provider-mapping` para 12/12                      |
| Cobertura  | Cinco ações, quatro FIIs e três ETFs reconhecidos                    |
| Custo      | Preço e obrigações totais conhecidos e viáveis                       |
| Operação   | API server-side estável, segura, paginável e observável              |

Falhar ou permanecer inconclusivo em um único gate impede aprovação.

## 6. Fontes oficiais consultadas

Todas foram acessadas em 20 de julho de 2026.

| Provider      | Página oficial                                                                         | Entidade                | Evidência resumida                                                                          |
| ------------- | -------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| GDELT         | [Terms of Use](https://www.gdeltproject.org/about.html#termsofuse)                     | GDELT Project           | Datasets com uso comercial irrestrito e redistribuição com citação                          |
| GDELT         | [DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)                 | GDELT Project           | Busca full-text, frases, booleanos e janela móvel                                           |
| GDELT         | [Context 2.0 API](https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/) | GDELT Project           | Contexto por sentença, ainda lexical                                                        |
| NewsAPI       | [Terms](https://newsapi.org/terms)                                                     | News API                | Termos de 30/04/2020; Developer só dev/test; direitos de terceiros permanecem               |
| NewsAPI       | [Pricing](https://newsapi.org/pricing)                                                 | News API                | Business USD 449/mês; Advanced USD 1.749/mês; Enterprise sob consulta                       |
| NewsAPI       | [Everything](https://newsapi.org/docs/endpoints/everything)                            | News API                | Busca em título, descrição e conteúdo; sem identidade de instrumento                        |
| Finnhub       | [Terms](https://finnhub.io/terms-of-service)                                           | Finnhub                 | Planos listados são pessoais; redistribuição exige aprovação escrita; purge no término      |
| Finnhub       | [Pricing](https://finnhub.io/pricing)                                                  | Finnhub                 | Free e All-in-One pessoais; Company News e limites publicados                               |
| Finnhub       | [Startup/Enterprise](https://finnhub.io/pricing-startups-and-enterprise)               | Finnhub                 | Comercial e redistribuição, preço sob consulta                                              |
| Finnhub       | [Company News](https://finnhub.io/docs/api/company-news)                               | Finnhub                 | Endpoint documentado apenas para companhias norte-americanas                                |
| Marketaux     | [Terms](https://www.marketaux.com/tos)                                                 | Marketaux               | Uso pessoal/não comercial; automação e uso comercial dependem de aprovação                  |
| Marketaux     | [Pricing](https://www.marketaux.com/pricing)                                           | Marketaux               | USD 0 a 199/mês; custom sob consulta                                                        |
| Marketaux     | [Documentation](https://www.marketaux.com/documentation)                               | Marketaux               | Entidades com símbolo, exchange, país, tipo e match score; token obrigatório                |
| Alpha Vantage | [Terms](https://www.alphavantage.co/terms_of_service/)                                 | Alpha Vantage           | Licença padrão pessoal/não comercial; comercial exige acordo escrito                        |
| Alpha Vantage | [Premium](https://www.alphavantage.co/premium/)                                        | Alpha Vantage           | USD 49,99 a 249,99/mês nos planos mensais publicados; termos continuam aplicáveis           |
| Alpha Vantage | [NEWS_SENTIMENT](https://www.alphavantage.co/documentation/#news-sentiment)            | Alpha Vantage           | Filtro retorna artigos que “mencionam” ticker                                               |
| FMP           | [API docs](https://site.financialmodelingprep.com/developer/docs)                      | Financial Modeling Prep | Stock News, General News, Press Releases e busca por símbolo/nome                           |
| FMP           | [Pricing](https://site.financialmodelingprep.com/developer/docs/pricing)               | Financial Modeling Prep | Planos pessoais; display/redistribuição exigem acordo específico                            |
| FMP           | [Terms](https://site.financialmodelingprep.com/developer/docs/terms-of-service)        | Financial Modeling Prep | Termos de 01/08/2023; multiusuário e display dependem de aprovação                          |
| Massive       | [Terms](https://massive.com/legal/terms)                                               | Massive.com             | Termos separados para individual e business                                                 |
| Massive       | [Business terms](https://massive.com/legal/businesses-terms-of-service)                | Massive.com             | Uso em software permitido sob Order Form e acordos de terceiros; purge no término           |
| Massive       | [Partner APIs](https://massive.com/docs/rest/partners/overview)                        | Massive.com             | Benzinga News v2, USD 99/mês individual; business sob consulta                              |
| Massive       | [Business pricing](https://massive.com/business)                                       | Massive.com             | Benzinga business sob consulta; partner data sujeito a licença                              |
| Benzinga      | [Stock News API](https://www.benzinga.com/apis/cloud-product/stock-news-api/)          | Benzinga                | Conteúdo embutível mediante licença; cobertura declarada Wilshire 5000, TSX e 1.000 tickers |
| Benzinga      | [Newsfeed API](https://docs.benzinga.com/api-reference/news-api/overview)              | Benzinga                | Filtros por ticker, ISIN e CUSIP; remoções/correções; chave obrigatória                     |
| Benzinga      | [API suite](https://www.benzinga.com/apis/)                                            | Benzinga                | Licenciamento institucional e foco em corretoras norte-americanas                           |
| Benzinga      | [Site terms](https://www.benzinga.com/terms-and-conditions)                            | Benzinga                | Termos do site de outubro/2024 não substituem contrato da API                               |

## 7. Auditoria por provider

### 7.1 GDELT

- Licença do dataset: `PASS`, com atribuição e link ao GDELT.
- Direitos de publisher: `UNVERIFIED` para título, sentença, imagem e corpo.
- Identidade: `FAIL`, `text-only`; DOC e Context usam palavras, frases,
  proximidade e contexto, sem CNPJ, ISIN, CIK/série/classe ou entity ID estável.
- Cobertura: global e multilíngue em tese, mas não prova reconhecimento dos 12
  instrumentos.
- Custo: `PASS`, sem fee para datasets.
- Resultado: `REJECTED` para o uso pretendido.

### 7.2 NewsAPI

- Developer: `FAIL` para produção; permitido somente em desenvolvimento/teste.
- Business/Advanced: produção comercial anunciada, mas os termos proíbem
  republicar material protegido e não transferem direitos dos publishers.
- Identidade: `FAIL`, `text-only`; `/everything` busca palavras em conteúdo.
- Cobertura: 150 mil fontes não comprova 12/12 nem distingue FIIs e ETFs.
- Custo: USD 449/mês Business; USD 1.749/mês Advanced; Enterprise sob consulta.
- Resultado: `REJECTED`.

### 7.3 Finnhub

- Free e All-in-One: `FAIL`; licença pessoal, inclusive All-in-One de USD
  3.500/mês faturado anualmente.
- Enterprise: licença comercial e redistribuição anunciadas, mas preço e termos
  finais dependem de contrato.
- Company News: documentação oficial restringe o endpoint a companhias
  norte-americanas, excluindo a comprovação das ações e FIIs brasileiros.
- Identidade/cobertura: `unsupported` para o universo completo.
- Resultado: `REJECTED` como provider único.

### 7.4 Marketaux

- Schema: fornece símbolo, exchange, país, tipo, UUID e `match_score`; poderia
  sustentar uma investigação de mapping forte.
- Termos públicos: licença pessoal/não comercial, vedação a acesso automatizado
  e uso comercial sem aprovação específica.
- Cobertura: claims de 80+ mercados e 200 mil entidades, mas nenhum teste 12/12
  pôde ser feito sem token e contrato.
- Copyright/display/retention: `UNVERIFIED`.
- Resultado: `REJECTED` sob os termos públicos atuais.

### 7.5 Alpha Vantage

- Free/premium padrão: `FAIL` para empresa e multiusuário; comercial exige
  acordo escrito.
- NEWS_SENTIMENT: associação por artigos que “mencionam” ticker, portanto
  `text-only` e insuficiente.
- Cobertura global declarada em outros endpoints não prova cobertura editorial
  dos 12 ativos.
- Resultado: `REJECTED`.

### 7.6 Financial Modeling Prep

- Planos pessoais: `FAIL` para aplicação multiusuário.
- Enterprise/Data Display: `CONDITIONAL`; exige Data Display and Licensing
  Agreement e proposta comercial.
- Schema: Stock News devolve ticker, headline, snippet e URL, mas a documentação
  pública não prova exchange, classe ou identidade global inequívoca em cada
  notícia.
- Cobertura: global declarada no plano Ultimate/Enterprise, porém os quatro FIIs
  e 12/12 não foram comprovados.
- Resultado: `CONDITIONAL`, bloqueado por contrato, identidade e cobertura.

### 7.7 Massive

- Individual Benzinga News: `FAIL`; USD 99/mês e uso individual.
- Business: `CONDITIONAL`; preço sob consulta, Order Form e possíveis acordos
  adicionais com o third-party provider.
- Retenção: termos business exigem apagar a informação ao término, salvo regra
  diferente no contrato.
- Cobertura: produto parceiro Benzinga orientado a equities dos EUA; 12/12 e
  FIIs não comprovados.
- Resultado: `CONDITIONAL`, implementação bloqueada.

### 7.8 Benzinga direta

- API é comercial e construída para display, inclusive conteúdo completo e
  imagem, mas apenas sob licença específica.
- O contrato e preço não são públicos para este caso; onboarding exige contato.
- Cobertura pública declarada: Wilshire 5000, TSX e 1.000 tickers populares;
  isso não comprova B3 nem os quatro FIIs.
- Filtros por ticker/ISIN/CUSIP são tecnicamente promissores, mas não há prova
  autenticada das identidades dos 12 ativos.
- Resultado: `CONDITIONAL`, bloqueado por contrato e cobertura.

## 8. Auditoria por plano e gate de licença

Legenda: `P` PASS, `C` CONDITIONAL, `F` FAIL, `U` UNVERIFIED. Perguntas 1–20
seguem exatamente a ordem definida no escopo da auditoria.

| Provider/plano          | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20  |
| ----------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GDELT datasets          | P   | P   | C   | P   | P   | P   | C   | C   | P   | P   | U   | U   | P   | C   | U   | U   | C   | U   | U   | P   |
| NewsAPI Developer       | F   | F   | F   | C   | C   | C   | F   | F   | C   | C   | F   | F   | P   | C   | U   | U   | P   | U   | U   | F   |
| NewsAPI Business        | P   | P   | C   | C   | C   | C   | F   | F   | C   | C   | F   | F   | P   | C   | U   | U   | P   | U   | U   | C   |
| Finnhub personal        | F   | F   | F   | C   | C   | F   | F   | F   | F   | F   | F   | F   | U   | U   | P   | P   | C   | C   | P   | F   |
| Finnhub Enterprise      | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | P   | C   |
| Marketaux público       | F   | F   | F   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | U   | P   | F   |
| Alpha Vantage padrão    | F   | F   | F   | U   | U   | U   | F   | F   | U   | U   | F   | F   | U   | U   | U   | U   | U   | U   | P   | F   |
| Alpha Vantage comercial | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | P   | C   |
| FMP pessoal             | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | F   | U   | U   | U   | U   | P   | P   | P   | F   |
| FMP Enterprise/Display  | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | P   | P   | C   |
| Massive individual      | F   | F   | F   | C   | C   | F   | F   | F   | F   | F   | F   | F   | U   | U   | P   | P   | P   | C   | P   | F   |
| Massive business        | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | P   | P   | P   | P   | P   | C   |
| Benzinga direta         | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | C   | P   | P   | C   |

As perguntas são: empresa; multiusuário; display; armazenamento; cache;
histórico; título; descrição/resumo; URL; publisher; imagem; corpo; atribuição;
link; remoção no cancelamento; purge; publisher adicional; display agreement;
aprovação escrita; produção comercial. `C` não é autorização.

## 9. Matriz de campos e copyright

Legenda: `A` permitido com atribuição, `C` somente por contrato, `N` proibido no
escopo conservador, `U` não comprovado.

| Provider         | ID  | Publisher | Author | Título | Descrição/resumo | URL | Imagem | Publicação | Mapping | Corpo |
| ---------------- | --- | --------- | ------ | ------ | ---------------- | --- | ------ | ---------- | ------- | ----- |
| GDELT            | A   | A         | U      | U      | U                | A   | N      | A          | U       | N     |
| NewsAPI          | C   | C         | U      | U      | U                | C   | N      | C          | U       | N     |
| Finnhub          | C   | C         | C      | C      | C                | C   | C      | C          | C       | N     |
| Marketaux        | U   | U         | U      | U      | U                | U   | N      | U          | U       | N     |
| Alpha Vantage    | C   | C         | C      | C      | C                | C   | N      | C          | C       | N     |
| FMP              | C   | C         | C      | C      | C                | C   | N      | C          | C       | N     |
| Massive/Benzinga | C   | C         | C      | C      | C                | C   | C      | C          | C       | C     |
| Benzinga direta  | C   | C         | C      | C      | C                | C   | C      | C          | C       | C     |

Mesmo quando uma API retorna corpo ou imagem, o produto não os armazenará por
padrão. HTML, corpo integral e imagem permanecem proibidos até contrato e nova
decisão explícita. Não será feito scraping, bypass de paywall ou resumo por IA.

## 10. Matriz de cobertura documental

Legenda: `T` apenas busca/menção textual; `N` endpoint documentado sem cobertura
do mercado; `U` não comprovado sem credencial/contrato. Nenhuma célula é
`exact` ou `strong-provider-mapping` comprovada.

| Ativo  | GDELT | NewsAPI | Finnhub | Marketaux | Alpha Vantage | FMP | Massive | Benzinga |
| ------ | ----- | ------- | ------- | --------- | ------------- | --- | ------- | -------- |
| BBAS3  | T     | T       | N       | U         | T             | U   | U       | U        |
| ITSA4  | T     | T       | N       | U         | T             | U   | U       | U        |
| TAEE11 | T     | T       | N       | U         | T             | U   | U       | U        |
| WEGE3  | T     | T       | N       | U         | T             | U   | U       | U        |
| PSSA3  | T     | T       | N       | U         | T             | U   | U       | U        |
| KNRI11 | T     | T       | N       | U         | T             | U   | U       | U        |
| VISC11 | T     | T       | N       | U         | T             | U   | U       | U        |
| XPLG11 | T     | T       | N       | U         | T             | U   | U       | U        |
| HGRU11 | T     | T       | N       | U         | T             | U   | U       | U        |
| VOO    | T     | T       | U       | U         | T             | U   | U       | U        |
| VNQ    | T     | T       | U       | U         | T             | U   | U       | U        |
| VEA    | T     | T       | U       | U         | T             | U   | U       | U        |

### Ações brasileiras

Nenhum provider comprovou simultaneamente B3, sufixo/mercado, classe de
instrumento, vínculo com a companhia e licença. Menção em português ou inglês,
ADR e resultado por nome não são identidade.

### FIIs

Nenhum provider comprovou reconhecimento de KNRI11, VISC11, XPLG11 e HGRU11
como fundos imobiliários da B3, com entidade estável distinta de gestor ou ação.
Esse gate específico reprovou todos os candidatos a provider único.

### ETFs

Nenhum teste comprovou para VOO, VNQ e VEA a associação simultânea de ticker,
exchange, tipo ETF e identidade forte. Menção a Vanguard, holding do índice ou
palavra curta não foi aceita.

## 11. Matriz de identidade

| Provider         | Mecanismo público                              | Classificação                                       | Gate        |
| ---------------- | ---------------------------------------------- | --------------------------------------------------- | ----------- |
| GDELT            | query, frase, booleano, sentença/contexto      | `text-only`                                         | FAIL        |
| NewsAPI          | palavra em title/description/content           | `text-only`                                         | FAIL        |
| Finnhub          | símbolo para Company News norte-americana      | `unsupported` no universo                           | FAIL        |
| Marketaux        | símbolo + exchange + país + tipo + match score | `ambiguous` sem mapping auditado                    | UNVERIFIED  |
| Alpha Vantage    | artigo que menciona ticker                     | `text-only`                                         | FAIL        |
| FMP              | símbolo ou nome no Stock News                  | `ambiguous`                                         | UNVERIFIED  |
| Massive/Benzinga | tickers do partner feed                        | `ambiguous` sem contrato/teste 12/12                | UNVERIFIED  |
| Benzinga direta  | ticker, ISIN, CUSIP                            | `strong-provider-mapping` potencial, não comprovado | CONDITIONAL |

## 12. Matriz de custos

| Provider/plano              | Preço oficial        | Limite/histórico relevante                   | Status de custo                 |
| --------------------------- | -------------------- | -------------------------------------------- | ------------------------------- |
| GDELT                       | USD 0                | dataset aberto; API com limitações próprias  | PASS                            |
| NewsAPI Developer           | USD 0                | 100/dia; 24 h de atraso; 1 mês; sem produção | FAIL                            |
| NewsAPI Business            | USD 449/mês          | 250 mil/mês; 5 anos; sem SLA                 | conhecido, licença insuficiente |
| NewsAPI Advanced            | USD 1.749/mês        | 2 milhões/mês; 5 anos; SLA 99,95%            | conhecido, licença insuficiente |
| Finnhub Free                | USD 0                | 60/min; Company News 1 ano; pessoal          | FAIL                            |
| Finnhub All-in-One          | USD 3.500/mês, anual | 20 anos; pessoal                             | FAIL                            |
| Finnhub Enterprise          | sob consulta         | ilimitado; redistribuição anunciada          | CONDITIONAL                     |
| Marketaux Free–Pro50K       | USD 0–199/mês        | 100–50 mil chamadas/dia                      | FAIL sob termos públicos        |
| Alpha Vantage premium       | USD 49,99–249,99/mês | 75–1.200/min; licença padrão pessoal         | FAIL                            |
| Alpha Vantage comercial     | sob consulta         | contrato escrito                             | CONDITIONAL                     |
| FMP Ultimate pessoal        | USD 149/mês anual    | 3.000/min; global                            | FAIL para multiusuário          |
| FMP Enterprise/Display      | sob consulta         | 1 TB+ e acordo de display                    | CONDITIONAL                     |
| Massive Benzinga individual | USD 99/mês           | dataset parceiro; individual                 | FAIL                            |
| Massive Benzinga business   | sob consulta         | Order Form e possível third-party agreement  | CONDITIONAL                     |
| Benzinga direta             | sob consulta         | licença e canais customizados                | CONDITIONAL                     |

Cenário conservador de uma chamada por ativo: 360 chamadas/mês em consulta
diária, 1.440 em consulta a cada 6 horas e 8.640 em consulta horária. Esses
volumes cabem em vários limites publicados, mas rate limit não corrige licença,
identidade ou cobertura.

## 13. Matriz de riscos

| Provider      | Risco principal                                      | Severidade |
| ------------- | ---------------------------------------------------- | ---------- |
| GDELT         | falso positivo/negativo por associação lexical       | crítica    |
| NewsAPI       | copyright do publisher e busca textual               | crítica    |
| Finnhub       | Company News norte-americana e purge                 | crítica    |
| Marketaux     | termos incompatíveis com automação comercial         | crítica    |
| Alpha Vantage | licença pessoal e menção textual                     | crítica    |
| FMP           | acordo de display, identidade e FIIs não comprovados | alta       |
| Massive       | dependência Benzinga, contrato terceiro e purge      | alta       |
| Benzinga      | preço/contrato e cobertura B3/FII não comprovados    | alta       |

Riscos transversais: mudança unilateral de termos, remoção de publisher,
correção/remoção de item, URL quebrada, retenção incompatível, custo variável,
IDs ou mappings alterados e dependência de parceiro.

## 14. Resultados empíricos

Foi tentada uma consulta pública, de baixo volume, ao GDELT DOC 2.0 para BBAS3,
com timeout de 20 segundos e User-Agent identificável. O PowerShell falhou ao
receber a resposta; uma tentativa alternativa com `curl` falhou antes da
requisição por `SEC_E_NO_CREDENTIALS` no Schannel do sandbox. Nenhum payload foi
salvo. Não houve nova tentativa, pois a documentação já prova que a identidade é
textual e o teste não poderia aprovar o gate.

Nenhum outro endpoint foi chamado: todos exigiam API key, conta, trial ou
contrato. Não foram usadas credenciais existentes. As janelas de 30, 90 e 365
dias permaneceram `NOT EXECUTED`, e a cobertura empírica ficou `UNVERIFIED`.

## 15. Limitações

- Não houve acesso a Order Forms, anexos comerciais ou respostas de sales.
- Não houve prova autenticada de cobertura dos 12 ativos.
- Pricing “sob consulta” não foi estimado.
- Termos podem mudar após a data de referência.
- A auditoria não substitui revisão jurídica de contrato.
- Links foram validados por abertura das páginas oficiais; endpoints
  autenticados não foram executados.
- O ambiente Windows do sandbox impediu o único teste público do GDELT.

## 16. Questionário comercial obrigatório

Antes de qualquer reavaliação, o fornecedor deve responder por escrito:

1. Podemos exibir títulos para usuários autenticados?
2. Podemos exibir descrições?
3. Podemos armazenar metadados?
4. Por quanto tempo?
5. Podemos manter histórico após cancelamento?
6. Podemos exibir publisher e URL?
7. Podemos exibir imagem?
8. Há sublicenciamento de direitos do publisher?
9. Quais ativos da B3 são cobertos?
10. FIIs são cobertos por ticker e classe?
11. VOO, VNQ e VEA têm entity IDs auditáveis?
12. Há redistribuição para clientes finais?
13. Há limite de usuários?
14. Há limite de chamadas?
15. Há data purge?
16. Há obrigação de atribuição?
17. Há auditoria ou reporting de uso?
18. Qual é o preço total para este caso de uso?
19. Há contrato mínimo?
20. Há SLA?

Além disso, a resposta deve listar os identificadores exatos para os 12 ativos,
os campos licenciados, as regras de correção/remoção e um dataset de teste
autenticado que não dependa de texto livre.

## 17. Decisão final

### NO-GO — nenhum provider aprovado

- `APPROVED`: nenhum.
- `CONDITIONAL`: FMP Enterprise/Data Display, Massive Business com Benzinga e
  Benzinga direta.
- `REJECTED`: GDELT, NewsAPI, Finnhub, Marketaux e Alpha Vantage.
- `UNVERIFIED`: nenhum provider como status final; existem gates não verificados
  dentro dos candidatos condicionais.

Não há composição multiprovider elegível: nenhum conjunto de dois ou mais
providers passou individualmente licença e identidade para sua parcela do
universo com custo e contrato conhecidos.

Campos permitidos agora: nenhum campo editorial em produção, pois não há
provider aprovado. Em uma futura aprovação, o mínimo candidato seria ID do
provider, publisher, URL, horário e atribuição expressamente licenciados.
Título, descrição/resumo e mapping ficam condicionados ao contrato. Corpo,
HTML, imagem, scraping, paywall e resumo derivado sem licença permanecem
proibidos.

## 18. Condições para reavaliação

Reabrir somente quando existir pelo menos uma destas evidências:

- proposta e contrato comercial completos, com revisão jurídica;
- direitos explícitos de display, armazenamento, retenção e redistribuição por
  campo;
- identifiers estáveis para os 12 ativos, incluindo quatro FIIs;
- teste autenticado 12/12 em janelas acordadas;
- preço total, limites, SLA, purge, atribuição e política de remoção conhecidos;
- desenho posterior de contrato/storage editorial aprovado em novo roadmap.

Até lá, Eventos Oficiais Primeiro permanece a única política autorizada.

## 19. Evidências e referências

O artefato estruturado correspondente está em
`docs/audits/editorial-news-providers-v2-evidence.json`. Ele contém apenas
evidências resumidas, URLs oficiais, classificações e o universo fechado. Não
contém secrets, artigos, HTML, imagens, payloads ou dados de produção.

## 20. Impacto no roadmap

Os itens 1 a 17 da sequência de News & Events estão concluídos localmente. No
item 17, “concluído” significa auditoria executada e decisão registrada; não
significa provider editorial implementado. O roadmap de desenvolvimento atual
se encerra com Eventos Oficiais Primeiro. Migrations de eventos oficiais seguem
não aplicadas, backfill não executado e runtime real `disabled`.
