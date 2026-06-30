# Papo de Futuro

Inteligência para o seu próximo aporte.

## Objetivo

Este repositório contém a fundação técnica e visual do Papo de Futuro, uma
plataforma em português do Brasil para evoluir a experiência de organização,
planejamento e acompanhamento de aportes.

## Stack atual

- Vite
- React
- TypeScript
- Tailwind CSS com integração oficial do Vite
- React Router em modo declarativo
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

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

## Estrutura inicial

```text
src/
├── app/
│   └── router/
├── components/
│   ├── layout/
│   └── ui/
├── lib/
├── pages/
├── styles/
└── types/
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

## Estado do projeto

`Fundação visual concluída, com a primeira versão visual da Visão Geral disponível em dados demonstrativos e sem integrações reais.`

## Funcionalidades deliberadamente não implementadas

- autenticação real
- banco de dados
- Supabase
- cálculos financeiros
- carteira funcional
- compras
- cotações
- gráficos
- APIs financeiras
