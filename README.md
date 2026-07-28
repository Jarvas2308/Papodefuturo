# Papo de Futuro

Inteligência para o seu próximo aporte.

## Visão geral

O Papo de Futuro é uma aplicação de inteligência para aportes de longo prazo em
um universo fechado de 12 ativos. O produto combina dados financeiros reais por
usuário, um motor determinístico de alocação e contratos auditáveis para fatos
fundamentalistas e eventos regulatórios.

## Missão

Cada aporte deve representar o melhor próximo passo possível para a evolução da
carteira, considerando simultaneamente a estratégia de alocação, o contexto
disponível e o capital informado pelo usuário.

O estado consolidado abaixo descreve o que já está integrado e verificado em
produção. `docs/PROJECT_HANDOFF.md` é a fonte detalhada e mais recente sobre o
estado real; este README resume.

## Estado atual

- autenticação Supabase real, com fallback demo determinístico quando as
  variáveis públicas não estão configuradas;
- carteira, compras, histórico, estratégia, cotações e câmbio conectados por
  repositories reais nos fluxos autenticados, com isolamento por RLS;
- Motor Estratégico V2 multiativos integrado ao fluxo de Novo Aporte;
- Dossiê Técnico V1, Fundamental Facts V1 e Fundamental Derived Facts V1 como
  contratos puros e determinísticos, ainda sem consumidor de UI;
- providers oficiais CVM e SEC implementados para fundamentos e para eventos
  regulatórios, com o domínio puro de eventos oficiais e os três providers
  (CVM IPE, CVM Fund Delivery, SEC EDGAR) aplicados em produção;
- infraestrutura completa de eventos oficiais aplicada ao Supabase real, com
  runtime ativado em `read-only` e verificado com sessão autenticada real
  (`DEC-041`, `DEC-042`);
- runner gradual de backfill de eventos oficiais e RPC transacional de upsert
  de fundamentos disponíveis; nenhum backfill amplo nem ingestão real de
  fundamentos foi executado ainda;
- notícias editoriais em `NO-GO` (`DEC-036`); IA explicativa, sentimento e
  score não foram integrados;
- modo demo preservado, sem fallback silencioso após erro de consulta real.

Nenhuma ordem financeira é executada automaticamente. O plano de aporte é uma
simulação e a decisão permanece com o usuário.

## O que ainda falta

- backfill amplo dos providers de eventos oficiais e ingestão real de
  fundamentos (hoje as tabelas seguem vazias);
- runtime e UI consumindo os contratos de fundamentos já construídos;
- agendamento automático de atualização de mercado (`pg_cron`);
- persistência do plano de aporte aceito pelo usuário;
- IA explicativa consumindo o Dossiê Técnico;
- notícias editoriais (sem provider aprovado).

Ver `docs/ROADMAP.md` § Próximo para o detalhe operacional de cada item.

## Documentação

| Documento                                                    | Conteúdo                                     |
| ------------------------------------------------------------ | -------------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                           | Missão, estratégia e regras de produto       |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                 | Arquitetura atual                            |
| [docs/CHANGELOG-DECISIONS.md](docs/CHANGELOG-DECISIONS.md)   | Registro das decisões                        |
| [docs/ROADMAP.md](docs/ROADMAP.md)                           | Sequência de evolução                        |
| [docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md)           | Estado real detalhado, fonte mais atualizada |
| [docs/SUPABASE_SCHEMA_PLAN.md](docs/SUPABASE_SCHEMA_PLAN.md) | Estado e histórico do schema Supabase        |

## Stack atual

- Node.js 24+, npm 11+
- React 19, TypeScript 6, Vite 8
- Tailwind CSS 4, React Router 7
- Supabase JS 2 (Auth, Postgres, RLS, Edge Functions)
- Vitest, ESLint, Prettier
- Lucide React

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
- `/eventos-oficiais`
- `/fundamentos`
- `/estrategia`
- `/configuracoes`

A rota `/eventos-oficiais` está ativada em `read-only`; o item de navegação
aparece para sessões autenticadas reais. A rota `/fundamentos` tem o mesmo
runtime opcional (`disabled`/`read-only`), mas permanece `disabled` — ativação
em produção é decisão separada.

## Estrutura resumida

```text
src/
├── app/                     composição e roteamento
├── auth/                    sessão e fronteira demo/real
├── application/context/     runtime browser-compatible de eventos oficiais e fundamentos
├── components/
│   ├── layout/
│   └── ui/
├── data/
│   ├── repositories/        repositories financeiros e mappers Supabase
│   ├── fundamentals/        providers e adapters de fundamentos
│   └── context/             providers, storage e leitura de eventos oficiais
├── domain/
│   ├── models/
│   ├── fundamentals/
│   ├── technicalDossier/
│   └── context/
├── features/
│   ├── contribution/
│   ├── dashboard/
│   ├── fundamentals/
│   ├── history/
│   ├── official-events/
│   ├── portfolio/
│   ├── settings/
│   └── strategy/
├── lib/                     ambiente, client e types Supabase
├── mocks/                   dados do modo demo
├── pages/
├── server/context/          executor e backfill server-side de eventos oficiais
└── styles/
```

Ver `docs/ARCHITECTURE.md` para o mapa completo de diretórios e fronteiras.
