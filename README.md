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

Essa missão descreve a direção do produto. O repositório atual ainda não possui
o domínio financeiro nem as integrações necessárias para cumpri-la por inteiro.

## Estado atual

- fundação visual concluída;
- experiências demonstrativas disponíveis para Dashboard, Minha Carteira, Novo
  Aporte, Histórico, Estratégia e Configurações;
- publicação inicial no Vercel concluída;
- ajustes iniciais da revisão geral de experiência aplicados;
- nenhuma integração real foi implementada;
- os dados exibidos não representam uma carteira real;
- não há autenticação, backend, Supabase, APIs financeiras ou persistência real.

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
- mocks e dados determinísticos para as experiências visuais;
- componentes básicos de interface;
- testes unitários e de componentes com Vitest;
- validações com Prettier, ESLint e build de produção;
- deploy inicial em `https://papodefuturo.vercel.app`.

## Funcionalidades ainda não implementadas

- autenticação real;
- Supabase;
- persistência;
- carteira funcional com dados persistidos;
- compras;
- cotações reais;
- cálculos financeiros reais baseados em dados de mercado;
- motor estratégico final de produto;
- APIs;
- IA;
- auditoria.

## Documentação

| Documento                                                  | Conteúdo                               |
| ---------------------------------------------------------- | -------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                         | Missão, estratégia e regras de produto |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | Arquitetura atual e planejada          |
| [docs/CHANGELOG-DECISIONS.md](docs/CHANGELOG-DECISIONS.md) | Registro das decisões                  |
| [docs/ROADMAP.md](docs/ROADMAP.md)                         | Sequência de evolução                  |

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
