# News & Events V1 — desenho e política de dados

Data da auditoria: 16 de julho de 2026.

## 1. Resumo executivo

Este documento registra a decisão aprovada **Eventos Oficiais Primeiro**. As
únicas fontes autorizadas para automação na V1 são CVM, para ações brasileiras e
FIIs, e SEC EDGAR, para VOO, VNQ e VEA. Notícias editoriais estão formalmente
adiadas até uma nova auditoria aprovar provider, cobertura dos 12 ativos,
identidade forte, licença comercial, retenção e redistribuição.

Eventos oficiais e notícias editoriais terão contratos, storage e deduplicação
separados. Nenhum deles altera carteira, metas, Motor Estratégico V2, plano de
aporte, `FundamentalFactsV1`, `FundamentalDerivedFactsV1` ou
`TechnicalDossierV1`. Contexto indisponível nunca bloqueia o produto.

O desenho permanece a política de referência. O domínio puro e os três
providers oficiais V1 — CVM IPE para ações, CVM Fund Delivery para FIIs e SEC
EDGAR para ETFs — foram implementados em ciclos isolados; migration, tabela,
storage, scheduler, ingestão real, UI e IA continuam ausentes.

## 2. Estado atual

- Fundamental Facts V1 e Fundamental Derived Facts V1 estão concluídos.
- Providers CVM para ações e FIIs e provider SEC N-PORT para ETFs estão
  isolados, sem scheduler ou integração de fundamentos ao runtime.
- A PR #78 integrou os derivados fundamentalistas auditáveis.
- A tabela `fundamental_snapshots` permanece vazia; nenhuma ingestão factual real
  foi executada.
- O Motor V2 e o Dossiê Técnico V1 continuam sendo as fronteiras determinísticas
  do plano técnico.
- `OfficialAssetEventV1`, o provider CVM IPE V1 das cinco ações e o provider
  CVM Fund Delivery V1 dos quatro FIIs estão implementados sem persistência ou
  UI. O provider SEC EDGAR ETF Events V1 cobre VOO, VNQ e VEA por CIK, série e
  classe, também sem persistência ou runtime. `EditorialAssetNewsV1` continua
  apenas conceitual.

## 3. Objetivos

- separar fato contextual oficial de documento editorial;
- definir fontes auditáveis para o universo fechado;
- definir identidade forte, relevância determinística e proveniência;
- definir taxonomia pequena e fechada para eventos oficiais;
- definir deduplicação, amendments, datas, retenção e segurança;
- projetar contratos e persistência futura sem escrever SQL;
- estabelecer gates objetivos antes de iniciar implementação.

## 4. Não objetivos

- não decidir compra, venda, oportunidade ou risco;
- não produzir sentimento, score, ranking ou recomendação;
- não resumir conteúdo por IA;
- não recalcular fatos contábeis ou derivados;
- não alterar o Motor V2, o plano técnico, a carteira ou as metas;
- não armazenar artigo, HTML ou imagem editorial integral;
- não contornar paywall, robots, rate limit ou termos de uso;
- não definir cron ou infraestrutura de produção neste ciclo.

## 5. Universo fechado

| Classe              | Ativos                              |
| ------------------- | ----------------------------------- |
| Ações brasileiras   | BBAS3, ITSA4, TAEE11, WEGE3 e PSSA3 |
| Fundos imobiliários | KNRI11, VISC11, XPLG11 e HGRU11     |
| ETFs internacionais | VOO, VNQ e VEA                      |

Qualquer expansão exige nova auditoria de identidade e cobertura.

## 6. Separação entre eventos oficiais e notícias

### Eventos oficiais

São documentos ou metadados publicados por fonte oficial. Representam fatos
contextuais com proveniência, mas não substituem o documento original nem viram
fato contábil. Na automação V1, fonte oficial significa exclusivamente CVM ou SEC
EDGAR. B3, emissores, administradores, gestores e Vanguard permanecem apenas para
verificação humana e investigação.

### Notícias editoriais

São documentos produzidos por veículo jornalístico ou agregador. Podem
contextualizar um fato, mas permanecem editoriais mesmo quando citam fonte
oficial. Não são convertidos em evento oficial, fundamento, sinal ou regra do
motor.

Os contratos não compartilham um identificador genérico que apague essa origem.
Uma matéria e o filing que ela comenta são registros distintos e podem ser
relacionados apenas por referência explícita.

`OfficialAssetEventV1` é o único contrato aprovado para o próximo ciclo técnico.
`EditorialAssetNewsV1` permanece adiado, apenas conceitual e sem autorização para
provider, tabela, storage, repository, ingestão, scheduler, runtime, UI, IA,
sentimento ou score.

## 7. Fontes auditadas

Todas as conclusões abaixo foram auditadas em 16 de julho de 2026, usando links
diretos das organizações responsáveis. O documento resume termos sem reproduzir
trechos extensos. Afirmações explicitamente presentes na fonte são tratadas como
fatos confirmados; ausência de API, licença comum, cobertura ou permissão é
registrada como não confirmada, risco inferido ou dependência de validação
jurídica/comercial. Nenhum silêncio da fonte é interpretado como autorização.

### Brasil — reguladores e sistemas oficiais

- [CVM — documentos periódicos e eventuais de companhias](https://dados.cvm.gov.br/dataset/cia_aberta-doc-ipe): ZIPs por ano, atualização semanal,
  histórico móvel de cinco anos e licença ODbL.
- [CVM — documentos eventuais de fundos](https://dados.cvm.gov.br/dataset/fi-doc-eventual): CSVs, histórico desde 2005, atualização semanal e licença ODbL.
- [CVM — metadados de entrega de documentos de fundos](https://dados.cvm.gov.br/dataset/fi-doc-entrega): janela corrente de doze meses, M/M-1 diário, histórico desde 2021 e licença ODbL.
- [Plano de Dados Abertos da CVM](https://www.gov.br/cvm/pt-br/acesso-a-informacao-cvm/dados-abertos): confirma o propósito público de descoberta e uso das bases.
- [B3 — Empresas.Net e Fundos.Net](https://www.b3.com.br/pt_br/produtos-e-servicos/solucoes-para-emissores/suporte-emissores/prestacao-de-informacoes/): canais oficiais de informações periódicas e eventuais.
- [Termos de uso da B3](https://www.b3.com.br/pt_br/termos-de-uso-e-protecao-de-dados/termos-de-uso/): uso do conteúdo do site é pessoal; exploração comercial exige autorização escrita.

### Brasil — emissores, administradores e gestores

- ações: [Banco do Brasil](https://ri.bb.com.br/publicacoes-e-comunicados/fatos-relevantes-comunicados-e-avisos/), [Itaúsa](https://ri.itausa.com.br/), [TAESA](https://ri.taesa.com.br/), [WEG](https://ri.weg.net/publicacoes-e-comunicados/avisos-comunicados-e-fatos-relevantes/) e [Porto](https://ri.portoseguro.com.br/);
- FIIs: [KNRI11/Kinea](https://www.kinea.com.br/fundos/fundo-imobiliario-kinea-renda-knri11/), [VISC11/Vinci](https://www.vincifundoslistados.com/), [XPLG11/XP Asset](https://www.xpasset.com.br/fundos/xp-log/) e [HGRU11/Pátria](https://realestate.patria.com/tijolo/hgru11/).

Essas páginas confirmam disponibilidade de documentos e são úteis para
verificação humana. API pública estável, coleta automatizada, armazenamento,
redistribuição e licença comercial comum para os nove ativos não foram
confirmados. Qualquer uso exige auditoria por host e, quando aplicável, validação
jurídica ou contato comercial. Essas páginas estão fora da automação V1.

### Estados Unidos — regulador e gestor

- [SEC EDGAR Submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces): JSON sem chave, atualização em tempo real, histórico recente e arquivos auxiliares; `data.sec.gov` não oferece CORS.
- [SEC Developer Resources](https://www.sec.gov/about/developer-resources): RSS, índices e arquivos; fair access limitado a até 10 requisições por segundo e User-Agent identificável.
- [SEC — N-PORT e N-CEN](https://www.sec.gov/rules-regulations/2025/04/s7-26-22): formulários oficiais de fundos registrados.
- [Vanguard — VOO](https://investor.vanguard.com/investment-products/etfs/profile/voo), [VNQ](https://investor.vanguard.com/investment-products/etfs/profile/vnq) e [VEA](https://investor.vanguard.com/investment-products/etfs/profile/vea): páginas oficiais e documentos do gestor.
- [Termos da Vanguard](https://investor.vanguard.com/ts/pdf/terms_and_conditions.pdf): uso pessoal e não comercial; acesso automatizado repetido não oferecido pela Vanguard é vedado.

### Providers editoriais

- [GDELT — termos](https://www.gdeltproject.org/about.html): datasets gratuitos para uso acadêmico, comercial e governamental, com atribuição obrigatória; [DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) com JSON/JSONP, RSS e CORS.
- [Finnhub — preços e cobertura](https://api.finnhub.io/pricing): cobertura dos
  12 ativos, licença comercial, retenção, redistribuição, histórico e limites
  aplicáveis ao produto não foram confirmados de forma suficiente na
  documentação pública auditada; exige contato comercial e está fora da V1.
- [Alpha Vantage — News & Sentiment](https://www.alphavantage.co/documentation/#news-sentiment), [limites](https://www.alphavantage.co/support/) e [termos](https://www.alphavantage.co/terms_of_service/): 25 chamadas/dia no padrão; licença padrão pessoal e não comercial, uso comercial somente por acordo.
- [Marketaux — documentação](https://www.marketaux.com/documentation), [preços](https://www.marketaux.com/pricing) e [termos](https://www.marketaux.com/tos): 100 chamadas/dia e três artigos por resposta no plano gratuito, mas termos concedem uso pessoal/não comercial e restringem automação não autorizada.
- [NewsAPI — preços](https://newsapi.org/pricing) e [termos](https://newsapi.org/terms): plano gratuito apenas para desenvolvimento, 100 chamadas/dia, 24 horas de atraso e um mês de histórico; produção exige plano comercial e conteúdo de terceiros mantém direitos próprios.

### Conclusão da auditoria de fontes

- **Aprovadas para automação V1:** CVM IPE, CVM Fund Delivery e SEC
  EDGAR, observadas licença, proveniência, fair access e execução server-side.
- **Somente verificação humana:** B3, RI, administradores, gestores e Vanguard;
  automação, armazenamento e uso comercial exigem nova auditoria e eventual
  autorização escrita.
- **Somente pesquisa exploratória:** GDELT; a licença do dataset é favorável,
  mas metadados textuais não fornecem identidade forte suficiente para associação
  automática definitiva aos ativos.
- **Adiadas/rejeitadas na V1:** Finnhub, Alpha Vantage, Marketaux e NewsAPI;
  cobertura, identidade, licença ou direitos editoriais não atendem conjuntamente
  aos gates. Pontos não confirmados exigem validação jurídica ou contato comercial.

## 8. Matriz comparativa

### 8.1 Acesso, cobertura e operação

| Fonte                        | Tipo                  | Mercado/cobertura do universo                                                    | Conteúdo                                | Acesso e autenticação                           | Custo e limite auditado                                             | Histórico/latência                                       | PT/CORS/server-side                                 | Recomendação                     |
| ---------------------------- | --------------------- | -------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| CVM IPE                      | Regulador             | BR; cinco ações                                                                  | Eventos oficiais                        | ZIP/CSV, sem login                              | Licença ODbL; semanal; rate limit não publicado para arquivos       | Cinco anos correntes; semanal                            | PT; CORS não contratado; preferir server-side/batch | Adotar                           |
| CVM fundos                   | Regulador             | BR; quatro FIIs                                                                  | Eventos oficiais                        | CSV/ZIP, sem login                              | Licença ODbL; Entrega diária/semanal e Eventuais semanal            | Desde 2005 em Eventuais; metadados desde 2021            | PT; preferir server-side/batch                      | Adotar                           |
| Empresas.Net/Fundos.Net/B3   | Bolsa/sistema oficial | BR; nove ativos                                                                  | Eventos oficiais                        | HTML/documentos; APIs comerciais B3 por licença | Portal público; automação/comercial exige autorização               | Histórico variável; publicação pelo emissor              | PT; páginas não são contrato de API                 | Fallback humano, não automatizar |
| RI de companhias             | Emissor               | Cinco ações                                                                      | Eventos oficiais e materiais do emissor | HTML/PDF/mailing                                | Público; termos variam por host                                     | Variável; latência do emissor                            | PT; sem API/CORS uniforme                           | Fallback após auditoria por host |
| Gestores/administradores FII | Gestor                | Quatro FIIs                                                                      | Eventos oficiais e relatórios           | HTML/PDF/mailing                                | Público; termos variam por host                                     | Variável; latência do gestor                             | PT; sem API/CORS uniforme                           | Fallback após auditoria por host |
| SEC EDGAR                    | Regulador             | EUA; VOO, VNQ e VEA por CIK/série/classe                                         | Filings oficiais                        | REST JSON, RSS e arquivos; sem chave            | Sem autenticação/API key; fair access de até 10 req/s               | Tempo real; Submissions recente + arquivos históricos    | EN; sem CORS; server-side obrigatório               | Adotar                           |
| Vanguard                     | Gestor                | EUA; três ETFs                                                                   | Documentos oficiais do gestor           | HTML/PDF/RSS quando oferecido                   | Público para uso pessoal; automação/comercial restritos             | Variável                                                 | EN; não usar como crawler                           | Fallback humano; SEC é primária  |
| GDELT                        | Agregador             | Global; menções possíveis, sem cobertura forte comprovada dos 12                 | Notícias editoriais                     | API/RSS/arquivos; sem chave                     | Dataset aberto; limites/SLA da API não confirmados para produção    | DOC API em janela móvel; datasets desde 1979             | Multilíngue; adequação operacional não confirmada   | Somente pesquisa                 |
| Finnhub                      | Agregador             | Cobertura individual dos 12 não confirmada                                       | Notícias editoriais                     | API key                                         | Limites/licença aplicáveis não confirmados; exige contato comercial | Histórico aplicável não confirmado                       | Server-side por segredo                             | Rejeitar para V1                 |
| Alpha Vantage                | Agregador             | Global declarada; cobertura individual dos 12 não comprovada                     | Notícias e sentimento                   | API key                                         | 25/dia; padrão pessoal/não comercial                                | Histórico consultável por intervalo, sem SLA público     | Idioma depende da fonte; server-side por segredo    | Rejeitar para V1                 |
| Marketaux                    | Agregador             | 80+ mercados; cobertura individual dos 12 não comprovada                         | Notícias, entidades e sentimento        | API token                                       | Free 100/dia, três itens; termos pessoais/não comerciais            | Instantâneo; paginação até 20 mil resultados             | 30+ idiomas; server-side por segredo                | Rejeitar até licença escrita     |
| NewsAPI                      | Agregador             | Fontes globais, sem identidade financeira forte e sem cobertura dos 12 garantida | Notícias editoriais                     | API key                                         | Free dev 100/dia; produção a partir de US$ 449/mês na auditoria     | Free: 24 h de atraso/um mês; pago: tempo real/cinco anos | CORS localhost no free e amplo no pago              | Rejeitar para V1                 |

Preços e limites são retratos de 16 de julho de 2026 e devem ser reauditados
antes de contratação ou implementação.

### 8.2 Identidade, conteúdo, direitos e risco

| Fonte         | Identificadores e datas                                                       | Corpo/metadados                                   | Armazenamento, redistribuição e atribuição                                                    | Uso comercial                                  | Estabilidade/qualidade                           | Riscos principais                                              |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| CVM IPE       | CD_CVM, CNPJ/nome no cadastro, categoria, protocolo/link, entrega/referência  | Metadados e documentos oficiais                   | Dataset ODbL; manter atribuição, licença e URL; armazenar metadados mínimos                   | Compatível com licença aberta, sujeito à ODbL  | Alta autoridade; atualização semanal             | Reapresentações, links removidos e schema de arquivo           |
| CVM fundos    | CNPJ, denominação, categoria, protocolo/link, entrega/referência              | Metadados e documentos oficiais                   | Dataset ODbL; preservar origem e licença                                                      | Compatível com licença aberta, sujeito à ODbL  | Alta autoridade                                  | Mudança regulatória, classes/subclasses e versões              |
| B3/sistemas   | Ticker, CNPJ, ISIN e documentos ligados ao emissor                            | Documento e metadados                             | Conteúdo do site não pode ser explorado comercialmente sem autorização                        | Não aprovado sem contrato                      | Alta autoridade, acesso técnico não uniforme     | Termos, HTML instável, produto de dados licenciado             |
| RI/gestores   | Ticker/CNPJ/ISIN/nome oficial quando publicados                               | Documento, título e data                          | Regras por host; guardar só URL/metadados após autorização                                    | Não presumido                                  | Autoridade alta, padronização baixa              | Automação/termos não confirmados, mudança de CMS e correções   |
| SEC EDGAR     | CIK, series ID, class ID, accession, form, filed/accepted/report date         | Metadados e documentos públicos                   | Preservar SEC/filing e respeitar fair access; retenção exige política específica              | Licença comercial específica não confirmada    | Alta autoridade e APIs estáveis                  | Amendments, múltiplas classes, limites e indisponibilidade     |
| Vanguard      | Ticker, CUSIP/identidade do fundo, nome, data do documento                    | Página e documentos                               | Termos restringem cópia, redistribuição e acesso automatizado                                 | Não sem autorização escrita                    | Alta autoridade, baixa adequação automatizada    | Termos e automação repetida vedada                             |
| GDELT         | URL, domínio, data e metadados textuais; sem CNPJ/CIK/ISIN confiável por item | Metadados, links e campos derivados               | Dataset redistribuível com citação ao GDELT; direitos do artigo original continuam relevantes | Sim para dataset                               | Escala alta, identidade financeira baixa         | Falsos positivos, ticker ambíguo, conteúdo de terceiros        |
| Finnhub       | Símbolo e item/provider ID; cobertura dos 12 não confirmada                   | Metadados e links; conteúdo pode vir de terceiros | Armazenamento/redistribuição não confirmados para o produto                                   | Exige contato comercial                        | Adequação operacional não confirmada             | Licença, custo, retenção, histórico e cobertura                |
| Alpha Vantage | Ticker, URL, fonte, publicação e campos de relevância/sentimento              | Metadados e resumo do feed                        | Contrato comercial necessário; direitos dos veículos não são transferidos                     | Não no padrão                                  | API estável; cobertura dos 12 não provada        | 25/dia, ticker mapping e licença                               |
| Marketaux     | UUID, símbolo, exchange, URL e publicação                                     | Título, descrição, snippet e análise              | Termos pessoais/não comerciais; automação e conteúdo de terceiros geram ambiguidade           | Não aprovado                                   | Metadados ricos; identidade precisa ser validada | Termos contraditórios com API, cobertura e score indesejado    |
| NewsAPI       | URL, source ID, autor e publicação; sem identidade forte de ativo             | Metadados; não fornece artigo completo            | Proíbe republicar conteúdo protegido; atribuição/origem obrigatórias                          | Produção exige plano pago; direitos permanecem | API documentada; identidade financeira fraca     | Custo, licença do publisher e sugestão de scraping não adotada |

## 9. Decisão aprovada

Fica aprovada a política **Eventos Oficiais Primeiro**:

1. CVM Dados Abertos é a fonte primária para as cinco ações e quatro FIIs.
2. SEC EDGAR é a fonte primária para VOO, VNQ e VEA.
3. B3, páginas de RI e páginas de gestores são verificação/fallback humano; só
   entram em automação após auditoria específica de API, robots e termos.
4. Vanguard é verificação oficial humana; SEC permanece primária para filings.
5. `EditorialAssetNewsV1` é apenas conceitual e está formalmente adiado, sem
   implementação ou persistência aprovada.

Nenhum provider editorial gratuito auditado satisfaz simultaneamente cobertura
dos 12 ativos, identidade forte, uso comercial, armazenamento permitido e
estabilidade. GDELT tem licença favorável, mas a associação por texto não atende
ao gate de identidade. Os demais exigem contrato comercial ou têm termos
incompatíveis/ambíguos.

## 10. Arquitetura

Fronteiras futuras, sem arquivos criados neste ciclo:

```text
src/domain/context/
  officialAssetEvent.ts
  editorialAssetNews.ts
  assetContextIdentity.ts
  eventTaxonomy.ts
  deduplication.ts

src/data/context/
  mappings/
  providers/official/
  providers/editorial/
  normalization/
  storage/
  repositories/
  aggregation/
```

Fluxo previsto:

```text
CVM / SEC / fonte oficial aprovada
                ↓
provider → validação → normalização → deduplicação → storage global
                                                        ↓
                                             repository global
                                                        ↓
                                      agregador de contexto opcional

provider editorial aprovado futuramente → contrato/storage independentes
```

O domínio não depende de Supabase, React, browser, API específica ou IA. O
agregador não altera fatos, dossiê ou plano.

## 11. Contratos conceituais

### `OfficialAssetEventV1`

| Campo                       | Regra                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| `schemaVersion`             | literal `official-asset-event.v1`                                      |
| `eventId`                   | identidade determinística interna                                      |
| `assetIdentity`             | união fechada por classe                                               |
| `eventType`                 | valor da taxonomia V1                                                  |
| `occurredAt`                | instante ou data civil do efeito, opcional quando a fonte não informa  |
| `publishedAt`               | publicação/entrega da fonte                                            |
| `temporalPrecision`         | `date`, `minute`, `second` ou `unknown` por campo temporal             |
| `source` / `sourceType`     | sistema e classe da fonte oficial                                      |
| `sourceDocumentId`          | protocolo, accession ou ID oficial                                     |
| `canonicalUrl`              | URL validada no host permitido                                         |
| `title` / `summary`         | somente texto oficial permitido; resumo pode ser `null`                |
| `language` / `jurisdiction` | valores explícitos                                                     |
| `provenance`                | campos brutos mínimos, versões e hash                                  |
| `relatedDocuments`          | IDs/URLs oficiais relacionados                                         |
| `status`                    | `original`, `amendment`, `correction`, `replacement` ou `cancellation` |
| `supersedesEventId`         | relação explícita, nunca dedução destrutiva                            |

### `EditorialAssetNewsV1`

Status: **deferred / conceptual only**. Este contrato preserva a separação
arquitetural, mas não autoriza implementação, provider, tabela, storage,
repository, ingestão, scheduler, runtime, UI, IA, sentimento ou score na V1.

| Campo                               | Regra                                                    |
| ----------------------------------- | -------------------------------------------------------- |
| `schemaVersion`                     | literal `editorial-asset-news.v1`                        |
| `newsId`                            | identidade determinística interna                        |
| `assetIdentity`                     | união fechada por classe                                 |
| `publishedAt` / `temporalPrecision` | data da publicação e precisão factual                    |
| `source` / `publisher`              | provider e veículo, separados                            |
| `canonicalUrl`                      | URL do publisher, normalizada sem parâmetros de tracking |
| `title` / `summary`                 | somente se licenciados; nunca artigo completo            |
| `language`                          | idioma da publicação                                     |
| `providerItemId`                    | ID estável do provider                                   |
| `attribution`                       | texto/link exigido pelo contrato                         |
| `associationReason`                 | razão determinística de associação                       |
| `provenance`                        | payload mínimo permitido, versões e hash                 |

Os contratos não possuem sentimento, score, ranking, recomendação ou campo que
possa modificar o plano.

## 12. Taxonomia de eventos

| Tipo                                   | Definição objetiva                                           | Fontes V1 | Kinds aplicáveis                 | Inclusão                                     | Exclusão                                |
| -------------------------------------- | ------------------------------------------------------------ | --------- | -------------------------------- | -------------------------------------------- | --------------------------------------- |
| `regulatory-filing`                    | Filing regulatório entregue                                  | CVM/SEC   | Todos; N-PORT/N-CEN              | ID regulatório e identidade forte            | Documento apenas hospedado por terceiro |
| `earnings-release`                     | Divulgação oficial de resultado                              | CVM/SEC   | Ações/ETFs quando aplicável      | Categoria/form e período explícitos          | Matéria sobre o resultado               |
| `periodic-report`                      | Relatório periódico obrigatório                              | CVM/SEC   | Todos; ITR, relatório FII, N-CSR | Tipo e período oficiais                      | Relatório editorial                     |
| `material-fact`                        | Fato relevante formal                                        | CVM       | Ações/FIIs                       | Categoria oficial da CVM                     | Comunicado sem classificação formal     |
| `market-communication`                 | Comunicado regulatório não classificado como fato relevante  | CVM/SEC   | Todos quando aplicável           | Categoria/form e ativo identificado          | Notícia ou marketing genérico           |
| `dividend-or-distribution`             | Deliberação ou anúncio oficial de provento                   | CVM/SEC   | Todos                            | Datas e ativo no documento oficial           | Estimativa de veículo                   |
| `capital-structure-change`             | Desdobramento, grupamento, recompra ou mudança de capital    | CVM/SEC   | Todos quando aplicável           | Ato oficial concluído ou anunciado           | Variação de preço                       |
| `offering-or-issuance`                 | Oferta ou emissão de ações, cotas ou classes                 | CVM/SEC   | Todos quando aplicável           | Documento regulatório com identidade forte   | Rumor de captação                       |
| `shareholder-meeting`                  | Convocação, ata ou resultado de assembleia                   | CVM/SEC   | Todos quando aplicável           | Documento oficial com data                   | Agenda editorial                        |
| `management-change`                    | Mudança formal de administração                              | CVM/SEC   | Todos quando aplicável           | Filing/comunicado regulatório com vigência   | Especulação sobre executivo             |
| `merger-acquisition-or-reorganization` | Fusão, aquisição, cisão, incorporação ou reorganização       | CVM/SEC   | Todos                            | Documento regulatório vinculado ao ativo     | Discussão setorial sem ato              |
| `legal-or-regulatory-action`           | Ação de autoridade diretamente ligada ao ativo               | CVM/SEC   | Todos                            | Filing regulatório e identidade forte        | Regulação genérica sem vínculo          |
| `fund-policy-change`                   | Mudança formal de política ou regulamento do fundo           | CVM/SEC   | FIIs/ETFs                        | Regulamento ou filing oficial                | Comentário sem mudança formal           |
| `fund-manager-or-administrator-change` | Troca formal de gestor, administrador ou serviço equivalente | CVM/SEC   | FIIs/ETFs                        | Documento oficial e vigência                 | Mudança de equipe sem efeito formal     |
| `other-official-event`                 | Evento regulatório relevante fora das classes anteriores     | CVM/SEC   | Todos                            | Identidade forte e justificativa estruturada | Categoria de conveniência para notícia  |

`other-official-event` exige revisão humana e não autoriza taxonomia aberta.

## 13. Identidade e associação

### União fechada por classe

- ação brasileira: ticker do mapping fechado, category `brazilian-stock`, market
  `BR`, CNPJ, identidade CVM e nome oficial;
- FII: ticker do mapping fechado, category `real-estate-fund`, market `BR`, CNPJ,
  denominação oficial e ISIN quando disponível e aplicável;
- ETF internacional: ticker do mapping fechado, category `international-etf`,
  market `US`, registrant CIK, series ID, class/contract ID e nome oficial.

O mapping fechado cobre somente os 12 ativos e deve reutilizar identidades
oficiais já auditadas no projeto. Não há associação definitiva por nome livre,
substring ou fuzzy matching.

## 14. Relevância determinística

Um item só pode ser associado quando uma destas razões for comprovada:

- `exact-regulatory-identity`;
- `exact-ticker-provider-mapping`;
- `exact-cnpj`;
- `exact-cik-series-class`;
- `exact-isin`;
- `issuer-official-source`.

Cada vínculo preserva a razão e os valores comparados. Ticker isolado só vale
quando o provider fornece mapping fechado para mercado e classe. Nome parecido,
título ou corpo textual não bastam. Não existe score numérico de relevância.
Sem identidade forte, o item é rejeitado, o motivo estruturado é registrado e
nenhuma associação ao ativo é criada.

## 15. Deduplicação

### Eventos oficiais

Prioridade:

1. `sourceDocumentId` oficial, no namespace da fonte;
2. identificador do regulador;
3. accession number;
4. protocolo;
5. URL canônica;
6. fingerprint determinístico de metadados oficiais normalizados.

O hash usa campos estáveis e não inclui `ingestedAt`. Um novo conteúdo com ID
oficial igual atualiza proveniência e `updatedAt`; um amendment recebe registro
próprio e relação explícita.

### Notícias editoriais

Prioridade futura:

1. `provider + providerItemId`;
2. URL canônica;
3. `publisher + normalizedTitle + publishedAt`;
4. fingerprint determinístico de metadados licenciados.

Artigos de publishers diferentes não são duplicados apenas por narrar o mesmo
evento.

## 16. Amendments e correções

- `original`: primeira publicação autônoma;
- `amendment`: complementa ou reapresenta sem apagar o original;
- `correction`: corrige erro identificado pela fonte;
- `replacement`: substitui formalmente o documento anterior;
- `cancellation`: cancela efeito ou publicação, sem excluir histórico.

`supersedesEventId` e os IDs oficiais formam a cadeia. O estado mais recente pode
ser projetado em leitura, mas todos os registros permanecem auditáveis. Ausência
de relação oficial não autoriza inferir substituição.

## 17. Datas e precisão temporal

- `occurredAt`: quando o evento ocorreu ou passa a valer;
- `publishedAt`: quando a fonte publicou/entregou;
- `ingestedAt`: quando o sistema coletou;
- `updatedAt`: quando o registro interno mudou.

Instantes são normalizados para UTC na persistência e o texto/timezone bruto é
preservado na proveniência. Datas sem horário são datas civis com precisão
`date`; nunca se inventa meia-noite. Precisões permitidas: `date`, `minute`,
`second`, `unknown`. O timezone ausente permanece uma limitação explícita.

## 18. Proveniência

Todo item preserva:

- provider/sistema e indicação `official` ou `editorial`;
- documento/item original e identificador oficial;
- URL original e URL canônica;
- datas publicada, ocorrida e coletada, com textos brutos relevantes;
- identidade e razão usadas para vincular o ativo;
- campos brutos mínimos necessários para auditoria;
- versão do parser e do mapping;
- licença/atribuição aplicável e data de auditoria dos termos;
- hash ou identidade determinística;
- documento relacionado e cadeia de amendment, quando existente.

## 19. Direitos autorais e atribuição

É obrigatório não republicar texto editorial protegido.

- Não armazenar artigo, HTML ou imagem editorial integral.
- Armazenar título/resumo editorial apenas se o contrato autorizar.
- Manter URL canônica, publisher, provider e atribuição.
- Não contornar paywall nem fazer scraping proibido.
- Não criar resumo a partir de conteúdo obtido sem autorização.
- Para fontes oficiais, separar metadados, documento, texto extraído, arquivo
  original, trecho permitido, hash e proveniência; cada artefato segue a licença
  da fonte.
- CVM/GDELT exigem registro de licença/atribuição; conteúdo editorial de terceiros
  continua sujeito aos direitos do publisher.
- Vanguard, B3 e páginas privadas não entram em automação comercial sem
  autorização específica.

Retenção proposta: metadados oficiais e relações de versão por prazo
indeterminado enquanto a licença permitir; arquivos/textos oficiais somente se
necessários e licenciados; metadados editoriais pelo prazo contratual, com purge
após término quando exigido. Nunca reter corpo/imagem editorial por padrão.

## 20. Persistência conceitual

A arquitetura mantém `official_asset_events` e `editorial_asset_news`
conceitualmente separados. Somente a primeira tabela poderá ser proposta em ciclo
futuro; a segunda não está aprovada para implementação.

### `official_asset_events`

- finalidade: histórico global e auditável de eventos oficiais;
- colunas: IDs/schema, identidade normalizada por classe, taxonomia, datas e
  precisão, source/type/document ID, URLs, textos permitidos, status/relação,
  idioma/jurisdição, proveniência JSON validada, parser/mapping version, hash e
  timestamps internos;
- chaves/unicidade: PK interna; única por `source_type + source_document_id`;
  índices por identidade global, `published_at desc`, `occurred_at desc`,
  `event_type`, `source` e relação;
- constraints: discriminante de identidade completo por kind, enumerações
  fechadas, URL/host permitido e coerência entre status e relação;
- atualizações: upsert idempotente de metadados; histórico de amendments não é
  sobrescrito.

### `editorial_asset_news`

Tabela apenas conceitual e não aprovada para implementação. Qualquer evolução
depende de nova auditoria de provider, cobertura, identidade, licença, retenção e
redistribuição.

- finalidade: metadados editoriais globais, somente após provider aprovado;
- colunas: IDs/schema, identidade, provider/publisher/item ID, publicação,
  URL, título/resumo licenciados, idioma, attribution, razão de associação,
  proveniência mínima, hash e timestamps;
- chaves/unicidade: provider item e URL canônica; índices por identidade,
  publicação e publisher;
- constraints: provider aprovado, razão forte, ausência de corpo/HTML/imagem;
- atualizações/retenção: conforme contrato do provider, incluindo purge.

Ambas são globais, sem `user_id` e sem FK para `assets.id`. A associação runtime
usa a identidade normalizada. Em eventual migration futura, grants são explícitos
e separados de RLS: somente `authenticated` recebe leitura; escrita fica em
contexto server-side privilegiado; `anon` não recebe acesso. A política deve ser
revalidada contra [RLS e grants do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e a [mudança de exposição de novas tabelas](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). Não há SQL neste ciclo.

## 21. Segurança

- API keys e service role somente server-side;
- User-Agent identificável para SEC e demais fontes que exigirem;
- rate limit por host, timeout e retry exponencial com jitter e limite;
- limite de payload, streaming e proteção contra ZIP bomb;
- allowlist HTTPS de hosts e caminhos; bloquear redirects para host não
  permitido, IP privado, loopback e esquemas não HTTP(S);
- prevenção de SSRF e resolução DNS controlada no executor server-side;
- sanitização e renderização somente como texto; nunca HTML não confiável;
- logs sem secrets, payload editorial ou conteúdo protegido;
- atribuição e versão de termos preservadas;
- validação runtime de todos os contratos antes de persistir.

## 22. Política de falhas

| Estado estruturado     | Tratamento                                                           |
| ---------------------- | -------------------------------------------------------------------- |
| `provider-unavailable` | Manter checkpoint; retry limitado; fluxo financeiro segue            |
| `rate-limited`         | Honrar `Retry-After`, reduzir concorrência e adiar checkpoint        |
| `partial-response`     | Aceitar apenas itens válidos completos; registrar cobertura parcial  |
| `invalid-item`         | Quarentena com razão estruturada; não associar nem exibir            |
| `ambiguous-identity`   | Rejeitar; exigir atualização do mapping fechado                      |
| `removed-document`     | Preservar metadados e marcar indisponibilidade; não apagar histórico |
| `broken-url`           | Preservar identidade/proveniência e registrar falha de resolução     |
| `duplicate`            | Upsert idempotente pela hierarquia de IDs                            |
| `superseded`           | Preservar registro e relação estruturada com a revisão posterior     |
| `unsupported-language` | Preservar metadados; não traduzir nem resumir automaticamente        |
| `unsupported-asset`    | Rejeitar sem busca textual ou expansão implícita do universo         |
| `stale-checkpoint`     | Sinalizar atraso e retomar do último checkpoint válido               |

Nenhuma falha impede login, carregamento da carteira, consolidação das posições,
Motor V2, geração do plano, Novo Aporte ou confirmação de compra. Eventos
oficiais são enriquecimento opcional.

## 23. Freshness e ingestão futura

Não há cron, frequência de coleta ou SLA interno aprovado. A implementação
futura deve respeitar somente as cadências publicadas pelas fontes:

| Fonte              | Fato confirmado em 16/07/2026                                 | Checkpoint futuro                             |
| ------------------ | ------------------------------------------------------------- | --------------------------------------------- |
| SEC EDGAR          | APIs atualizadas ao longo do dia; fair access de até 10 req/s | accession + acceptedAt; índices para backfill |
| CVM Entrega fundos | M/M-1 diário; meses anteriores da janela corrente semanal     | competência/entrega + protocolo               |
| CVM IPE            | ano corrente e anterior atualizados semanalmente              | ano/última entrega + protocolo                |
| CVM Eventuais      | anos corrente e A-4 atualizados semanalmente                  | ano/última entrega + protocolo                |

Toda ingestão futura é paginada, idempotente, reiniciável e orientada a
checkpoint. Reprocessamento não muda IDs estáveis. Frequência, timeout e limites
operacionais serão aprovados no ciclo de cada provider sem exceder a documentação
oficial. B3, RI, gestores, Vanguard e providers editoriais não participam desse
planejamento V1.

## 24. Riscos

- **Jurídico:** termos de B3, Vanguard e providers privados não autorizam o uso
  comercial pretendido sem contrato; direitos dos publishers não são transferidos
  pelo agregador.
- **Identidade:** ticker e texto livre produzem falsos positivos; GDELT e NewsAPI
  não entregam identidade forte suficiente por item.
- **Cobertura:** nenhum provider editorial auditado comprovou os 12 ativos.
- **Mudança de fonte:** categorias, schemas, links e políticas de atualização de
  CVM/SEC podem evoluir.
- **Amendments:** reapresentações não podem apagar o histórico.
- **Operação:** rate limit, indisponibilidade e CORS exigem execução server-side.
- **Produto:** usuário pode confundir notícia com fato ou recomendação; UI futura
  precisa exibir origem e rótulo de forma inequívoca.
- **Retenção:** guardar conteúdo além do permitido cria risco autoral e
  contratual.

## 25. Alternativas rejeitadas

- **Eventos oficiais + um provider editorial agora:** rejeitada porque nenhum
  candidato passou cobertura, identidade e licença simultaneamente.
- **Agregador único:** rejeitado porque mistura origem editorial e oficial e não
  substitui identidades regulatórias.
- **GDELT como provider V1:** licença é adequada, mas busca por texto não cumpre a
  associação forte do universo fechado.
- **Scraping de RI, gestores, B3 ou Vanguard:** rejeitado sem API/permissão
  explícita e auditoria individual dos termos.
- **NewsAPI/Marketaux/Finnhub/Alpha Vantage free:** rejeitados para produção por
  licença pessoal/dev, cobertura insuficiente ou termos ambíguos.
- **IA/sentimento para resolver identidade ou relevância:** rejeitado por não ser
  determinístico nem auditável na V1.

## 26. Sequência de implementação

1. Contratos puros de domínio de `OfficialAssetEventV1` — concluído.
2. Mapping fechado de identidade dos 12 ativos — concluído.
3. Taxonomia e validações estruturais — concluído.
4. Normalização temporal — concluído.
5. Deduplicação e relações entre revisões — concluído.
6. Provider CVM para eventos de ações — concluído.
7. Provider CVM para eventos de FIIs — concluído.
8. Provider SEC para eventos de ETFs — concluído.
9. Contrato de storage global.
10. Migration de `official_asset_events`.
11. Adapter Supabase.
12. Execução real server-side.
13. Backfill controlado.
14. Repository de leitura.
15. Integração runtime opcional.
16. Apresentação na UI.
17. Nova auditoria antes de qualquer notícia editorial.

Cada item é um ciclo independente; não há autorização implícita para os itens
seguintes. Os itens 1 a 5 foram implementados como domínio puro. O item 6 usa o
arquivo anual oficial IPE; o item 7 usa somente o CSV mensal Fund Delivery; e o
item 8 usa Submissions como índice e Filing Detail como confirmação obrigatória
de CIK, série e classe. Os três providers usam mapping fechado e deduplicação em
memória, sem banco, Supabase ou runtime. O próximo ciclo é somente o item 9,
contrato de storage global.

### Provider SEC EDGAR ETF Events V1

O provider cobre exclusivamente VOO, VNQ e VEA. Submissions fornece o índice de
filings recentes e a página Filing Detail confirma obrigatoriamente a combinação
canônica de registrant CIK, series ID e class/contract ID. O prefixo do accession
serve somente para construir a URL do Archives e não identifica o ETF.

O mapping fechado aceita `NPORT-P`, `N-CEN`, `N-CSR` e `N-CSRS` como
`periodic-report`, e `DEF 14A` e `DEFA14A` como `shareholder-meeting`. Forms
ambíguos e todos os `/A` ficam fora desta V1. Todos os eventos são `original`,
sem supersedes; `acceptanceDateTime` UTC fornece `publishedAt`, enquanto
`reportDate` ou o fallback `filingDate` fornece `occurredAt`. O accession é a
identidade documental e a Filing Detail é a URL original e canônica. O primary
document nunca é baixado.

A execução exige User-Agent identificável, usa chamadas sequenciais com
intervalo mínimo de 500 ms e cache por URL. Somente `filings.recent` é suportado:
qualquer sobreposição necessária em `filings.files` bloqueia o lote antes dos
detalhes. SGML permanece fallback futuro e `index.json` não é usado, pois não
fornece identidade de série e classe. Indisponibilidade ou mudança estrutural da
Filing Detail aborta sem omissão silenciosa. Não há storage, Supabase, runtime ou
ingestão real, e qualquer falha permanece isolada do Motor V2.

## 27. Gate para iniciar código

O domínio puro foi concluído após a aprovação da política de fontes. Antes de
qualquer provider ou infraestrutura, ainda devem ser
confirmados os gates aplicáveis:

- decisão formal por Eventos Oficiais Primeiro registrada neste documento;
- mapping forte dos 12 ativos revisado, sem fuzzy matching;
- inventário de categorias/colunas CVM e formulários SEC fechado com fixtures;
- termos, licença, atribuição, retenção e User-Agent registrados por fonte;
- allowlist de hosts e orçamento de requisições aprovados;
- contratos e taxonomia deste documento aceitos;
- deduplicação e amendments aceitos;
- política de falha não bloqueante aceita;
- desenho de grants/RLS revisado em ciclo de migration separado, antes do item
  10;
- nenhuma dependência de IA, score, sentimento ou alteração do Motor V2.

Se qualquer gate falhar, a implementação permanece bloqueada sem fallback por
scraping, texto livre, artigo integral ou provider não licenciado.
