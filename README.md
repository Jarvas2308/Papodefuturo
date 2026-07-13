# Papo de Futuro

Inteligência para o seu próximo aporte.

## Visão geral

O Papo de Futuro é uma plataforma em reconstrução para apoiar o planejamento de
aportes de longo prazo com clareza visual, estratégia definida e futura base
determinística para explicações e simulações.

## Missão

Cada aporte deve representar o melhor próximo passo possível para a evolução da
carteira, considerando simultaneamente a estratégia de alocação, o contexto
disponível e o capital informado pelo usuário.

Essa missão descreve a direção do produto. O repositório atual já possui
experiências demonstrativas e a primeira fundação tipada do domínio financeiro,
mas ainda não possui integrações reais, dados persistidos ou motor estratégico
final para cumpri-la por inteiro.

## Estado atual

- fundação visual concluída;
- experiências demonstrativas disponíveis para Dashboard, Minha Carteira, Novo
  Aporte, Histórico, Estratégia e Configurações;
- primeira fundação tipada do modelo de dados criada em `src/domain`;
- preparação inicial de Supabase criada, com factory isolada de cliente;
- tabelas reais `public.profiles`, `public.assets`, `public.purchases`,
  `public.asset_prices` e `public.allocation_targets` aplicadas no Supabase,
  ainda sem consumo pelas telas;
- advisors de segurança atuais limpos;
- publicação inicial no Vercel concluída;
- ajustes iniciais da revisão geral de experiência aplicados;
- nenhuma tela foi conectada a dados reais;
- os dados exibidos não representam uma carteira real;
- não há autenticação frontend real, backend, APIs financeiras ou persistência
  real no app.

## Funcionalidades atuais

- aplicação Vite com React e TypeScript;
- Tailwind CSS com integração do Vite;
- roteamento com React Router;
- layout principal responsivo;
- sidebar e menu móvel;
- cabeçalho compartilhado;
- página visual de login com navegação demonstrativa;
- Dashboard com composição visual própria e CTA principal para Novo Aporte;
- cards, gráfico visual, distribuição, movimentações e status no Dashboard;
- Minha Carteira demonstrativa com resumo, alocação, filtros, tabela desktop e
  cards mobile;
- Novo Aporte demonstrativo conectado ao engine local de simulação;
- Histórico demonstrativo com filtros, resumo, tabela e cards responsivos;
- Estratégia demonstrativa com metas em pontos-base e edição local sem
  persistência;
- Configurações demonstrativas com preferências locais aplicadas somente na
  sessão;
- fundação tipada do domínio financeiro com modelos isolados de Asset,
  PortfolioPosition, Purchase, AssetPrice, AllocationTarget e ContributionPlan;
- base técnica inicial de Supabase com variáveis públicas tipadas, factory
  isolada de cliente e migrations versionadas;
- `public.profiles`, `public.assets`, `public.purchases`,
  `public.asset_prices` e `public.allocation_targets` criadas no Supabase real
  com RLS habilitado;
- policies de `profiles`, `assets`, `purchases`, `asset_prices` e
  `allocation_targets` usando `(select auth.uid())`;
- advisors de segurança atuais limpos;
- primitivos compartilhados para IDs, dinheiro em unidades menores e metas em
  pontos-base;
- mocks e dados determinísticos para as experiências visuais;
- componentes básicos de interface;
- testes unitários e de componentes com Vitest;
- validações com Prettier, ESLint e build de produção;
- deploy inicial em `https://papodefuturo.vercel.app`.

## Funcionalidades ainda não implementadas

- autenticação real;
- conexão das telas com Supabase;
- persistência real no app;
- carteira funcional com dados persistidos;
- compras reais;
- cotações reais;
- cálculos financeiros reais conectados a dados persistidos ou de mercado;
- motor estratégico final de produto;
- APIs;
- IA;
- auditoria.

## Documentação

| Documento                                                    | Conteúdo                               |
| ------------------------------------------------------------ | -------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                           | Missão, estratégia e regras de produto |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                 | Arquitetura atual e planejada          |
| [docs/CHANGELOG-DECISIONS.md](docs/CHANGELOG-DECISIONS.md)   | Registro das decisões                  |
| [docs/ROADMAP.md](docs/ROADMAP.md)                           | Sequência de evolução                  |
| [docs/SUPABASE_SCHEMA_PLAN.md](docs/SUPABASE_SCHEMA_PLAN.md) | Estado e plano do schema Supabase      |

## Stack atual

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- Lucide React
- ESLint
- Prettier
- npm

## Requisitos

- Node.js 24 ou superior
- npm 11 ou superior

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Validações

```bash
npm test
npm run format:check
npm run lint
npm run build
```

## Rotas atuais

- `/`
- `/login`
- `/dashboard`
- `/carteira`
- `/novo-aporte`
- `/historico`
- `/estrategia`
- `/configuracoes`

## Estrutura resumida

```text
src/
├── app/
├── components/
│   ├── layout/
│   └── ui/
├── domain/
│   └── models/
├── features/
│   ├── contribution/
│   ├── dashboard/
│   ├── history/
│   ├── portfolio/
│   ├── settings/
│   └── strategy/
├── lib/
├── mocks/
├── pages/
└── styles/
```
