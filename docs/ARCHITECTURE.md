# Papo de Futuro — Arquitetura

## Estado atual

### Frontend

- Vite;
- React;
- TypeScript;
- Tailwind CSS;
- React Router;
- Lucide React;
- ESLint;
- Prettier;
- npm.

### Organização atual

- `src/app`: configuração de aplicação e roteamento principal.
- `src/components/layout`: shell compartilhado, sidebar, cabeçalho e menu móvel.
- `src/components/ui`: componentes básicos reutilizáveis de interface.
- `src/features`: componentes específicos de domínio visual por área funcional.
- `src/mocks`: dados demonstrativos utilizados pelas telas visuais.
- `src/pages`: páginas de rota e composição das telas.
- `src/lib`: utilidades leves e definições auxiliares.
- `src/styles`: tokens, estilos base e estilos globais.

No estado atual:

- as páginas demonstrativas ficam em `src/pages` e compõem as rotas principais;
- componentes específicos de cada área ficam em `src/features`;
- Dashboard, Minha Carteira, Histórico, Estratégia e Configurações possuem
  componentes de feature próprios;
- Novo Aporte possui engine, estratégias, utilitários e UI demonstrativa em
  `src/features/contribution`;
- dados demonstrativos compartilhados ficam em `src/mocks` quando são usados por
  mais de uma área;
- não existe camada real de dados, backend, autenticação, Supabase, APIs ou
  persistência.

### Situação funcional atual

#### Atual

- login visual demonstrativo;
- layout principal responsivo;
- rotas demonstrativas para Dashboard, Minha Carteira, Novo Aporte, Histórico,
  Estratégia e Configurações;
- telas responsivas com dados determinísticos e mensagens demonstrativas;
- engine local de simulação do Novo Aporte, sem backend e sem persistência;
- edição local demonstrativa em Estratégia e Configurações;
- publicação inicial no Vercel com suporte a acesso direto e refresh das rotas;
- testes automatizados com Vitest para regras e utilitários já extraídos.

#### Planejado

- domínio financeiro;
- persistência de dados;
- autenticação real;
- motor estratégico final de produto;
- integrações externas.

#### Em aberto

- desenho final das fronteiras entre `domain`, `services` e `integrations`;
- formato definitivo das futuras entidades persistidas;
- estratégia operacional para auditoria e histórico financeiro.

## Arquitetura planejada

### Apresentação

Responsável por:

- páginas;
- componentes;
- formulários;
- estados de carregamento;
- feedback ao usuário;
- acessibilidade;
- responsividade.

Não deve conter regras financeiras relevantes.

### Domínio

Responsável futuramente por:

- consolidação de posições;
- preço médio;
- valor investido;
- valor atual;
- participação;
- rentabilidade;
- metas;
- desvios;
- ranking;
- simulação de aportes;
- comparação antes e depois.

As funções de domínio devem ser:

- puras quando possível;
- determinísticas;
- independentes de React;
- testáveis;
- sem dependência direta de Supabase ou APIs.

### Infraestrutura

Responsável futuramente por:

- Supabase;
- autenticação;
- banco;
- migrations;
- RLS;
- APIs de mercado;
- câmbio;
- notícias;
- persistência;
- auditoria.

### IA

Responsável futuramente apenas por interpretação e explicação.

Nunca deve ser a fonte oficial dos cálculos.

## Princípio de persistência

> O banco armazena fatos. Valores derivados são calculados pelo domínio.

### Fatos que poderão ser armazenados

- cadastro mestre de ativos;
- compras;
- preços e respectivas fontes;
- taxas de câmbio e respectivas fontes;
- data e hora das informações;
- planos confirmados;
- dados de auditoria futuramente.

### Valores que não devem ser armazenados como fonte primária

- preço médio;
- quantidade consolidada;
- valor investido;
- valor atual;
- participação;
- rentabilidade;
- diferença da meta;
- ranking técnico.

Todos devem ser recalculáveis a partir dos fatos.

## Modelo de dados conceitual planejado

Este modelo é conceitual e não deve ser interpretado como migration definitiva.

### `assets`

Cadastro mestre do universo permitido.

Possíveis responsabilidades:

- ticker;
- nome;
- categoria;
- mercado;
- moeda;
- status ativo/inativo.

### `purchases`

Fatos de compras pertencentes ao usuário.

Possíveis responsabilidades:

- usuário;
- ativo;
- quantidade;
- preço pago;
- data da compra;
- data de criação.

### `asset_prices`

Cotações com:

- ativo;
- preço;
- moeda;
- fonte;
- data e hora.

Decisão em aberto:

- se cotações de mercado serão globais;
- como serão separados preços de mercado e substituições manuais por usuário;
- política de histórico e retenção.

Não há justificativa, nesta fase, para assumir automaticamente o modelo antigo
com `user_id` em todas as cotações.

## Precisão financeira

Princípios planejados:

- não usar números de ponto flutuante comuns como fonte de verdade monetária;
- valores monetários devem usar representação decimal segura ou unidades
  inteiras adequadas;
- quantidades fracionárias precisam de precisão explícita;
- arredondamentos devem ser centralizados no domínio;
- componentes visuais apenas formatam valores já calculados.

## Moeda e ativos internacionais

- a visualização consolidada da carteira será expressa em reais;
- ativos internacionais mantêm a moeda original da cotação;
- a conversão deve usar uma taxa USD/BRL identificada por fonte e horário;
- o valor original e o valor convertido devem ser rastreáveis;
- a implementação ainda é futura.

## Supabase planejado

Supabase aparece nesta arquitetura como solução planejada, não atual:

- Supabase Auth;
- PostgreSQL;
- Row Level Security;
- migrations versionadas;
- políticas por usuário;
- variáveis de ambiente;
- separação entre cliente e domínio.

## Segurança planejada

- nenhuma chave secreta no frontend;
- nenhuma credencial no repositório;
- RLS obrigatória para dados de usuário;
- validação de entrada;
- princípio do menor privilégio;
- secrets somente em ambiente seguro;
- logs sem dados sensíveis.

## Integrações futuras

Integrações candidatas sob avaliação:

- BRAPI para mercado brasileiro;
- Twelve Data para mercado internacional;
- Finnhub para notícias;
- Financial Modeling Prep para fundamentos;
- provedor de USD/BRL ainda a definir.

Nenhuma integração está aprovada apenas por estar listada.

Critérios futuros de avaliação:

- cobertura;
- licença;
- custo;
- limite gratuito;
- confiabilidade;
- atraso;
- termos de uso;
- disponibilidade histórica.

## Testes

### Atual

- Vitest cobre utilitários, engines locais e regras demonstrativas já extraídas;
- os testes atuais não dependem de backend, Supabase, APIs ou dados reais;
- validações de formato, lint e build fazem parte do ciclo de entrega.

### Planejado

- testes unitários para domínio financeiro;
- testes de casos-limite;
- testes de arredondamento;
- testes de normalização das metas;
- testes adicionais do motor de aportes quando ele for conectado ao domínio real;
- testes de autorização e RLS;
- testes de integração para adaptadores;
- testes de acessibilidade para fluxos principais.

## Estrutura futura indicativa

```text
src/
├── app/
├── components/
├── domain/
├── features/
├── integrations/
├── lib/
├── pages/
├── services/
└── styles/

supabase/
└── migrations/
```

As pastas futuras acima não devem ser criadas nesta tarefa.

## Decisões em aberto

- formato definitivo das tabelas;
- escopo global ou individual das cotações;
- provedor de câmbio;
- provedores financeiros;
- frequência de atualização;
- histórico de cotações;
- armazenamento de planos não confirmados;
- modelo de auditoria;
- limite definitivo de ativos no plano multiativos.
