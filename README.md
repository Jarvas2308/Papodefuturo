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
- Dashboard demonstrativo disponível;
- demais páginas ainda são etapas visuais ou placeholders;
- nenhuma integração real foi implementada;
- os dados exibidos não representam uma carteira real.

## Funcionalidades atuais

- aplicação Vite com React e TypeScript;
- Tailwind CSS com integração do Vite;
- roteamento com React Router;
- layout principal responsivo;
- sidebar e menu móvel;
- cabeçalho compartilhado;
- página visual de login com navegação demonstrativa;
- Dashboard com composição visual própria;
- cards, gráfico visual, distribuição, movimentações e status no Dashboard;
- mocks centralizados para o Dashboard;
- componentes básicos de interface;
- validações com Prettier, ESLint e build de produção.

## Funcionalidades ainda não implementadas

- autenticação real;
- Supabase;
- persistência;
- carteira funcional;
- compras;
- cotações reais;
- cálculos reais;
- motor estratégico;
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
│   └── dashboard/
├── lib/
├── mocks/
├── pages/
└── styles/
```
