# Papo de Futuro — Roadmap

## Concluído

### Fundação técnica e visual

- Vite, React e TypeScript;
- Tailwind;
- rotas;
- layout responsivo;
- sidebar;
- menu móvel acessível;
- componentes básicos;
- login visual;
- placeholders das rotas.

### Visão Geral demonstrativa

- cards;
- gráfico visual;
- distribuição;
- movimentações;
- responsividade;
- acessibilidade;
- mocks centralizados.

### Fundação da tela Minha Carteira (UI demonstrativa)

- cards de resumo;
- distribuição por categoria;
- comparação entre participação atual e meta monitorada;
- filtros locais por categoria;
- tabela semântica para desktop;
- cards responsivos para telas menores;
- 12 ativos do universo documentado;
- estados visuais de ganho, perda e sobrealocação;
- acessibilidade;
- mocks centralizados.

### Fundação documental

- visão de produto;
- arquitetura;
- decisões;
- roadmap;
- reorganização do README e AGENTS.

### Fundação da tela Novo Aporte e motor demonstrativo

- formulário de valor e seleção de estratégia;
- simulação sem persistência;
- estratégia proporcional;
- estratégia por déficit projetado com base no total final da carteira;
- valores monetários representados em centavos;
- arredondamento pelo método dos maiores restos;
- preservação do total exato;
- engine determinístico;
- validação de metas e tratamento de estratégias inválidas;
- integração com as 12 posições mockadas;
- UI responsiva e mensagens de caráter demonstrativo;
- Vitest com 5 arquivos de teste e 60 testes aprovados.

Ainda não existem compra real, persistência, histórico real, Supabase,
autenticação, APIs, recomendação financeira ou IA.

### Publicação inicial no Vercel

- aplicação publicada no Vercel;
- produção ligada à branch `main`;
- configuração SPA por `vercel.json`;
- suporte a acesso direto e refresh das rotas;
- rotas atuais: `/`, `/dashboard`, `/carteira` e `/novo-aporte`;
- deploy sem variáveis de ambiente e ainda baseado em mocks;
- produção disponível em `https://papodefuturo.vercel.app`.

## Próximo

### Próximas telas

Ordem planejada:

1. Histórico;
2. Estratégia;
3. Configurações;
4. revisão geral da experiência;
5. modelo de dados;
6. Supabase.

Todas ainda com dados demonstrativos quando necessário.

## Planejado

### Fundação de dados e acesso

- projeto Supabase;
- variáveis de ambiente;
- Auth;
- esquema inicial;
- migrations;
- RLS;
- seed do universo fechado;
- testes de isolamento por usuário.

### Carteira funcional

- compras;
- edição;
- exclusão;
- consolidação;
- preço médio;
- valor investido;
- valor atual;
- rentabilidade;
- participação;
- histórico.

### Motor estratégico

#### V1

- metas;
- desvios;
- ranking;
- plano de um ativo;
- simulação;
- confirmação.

#### V2

- plano multiativos;
- comparação antes/depois;
- redução do desvio total;
- limites operacionais;
- testes de cenários.

### Comitê de IA

Planejado somente após o domínio determinístico:

- dossiê;
- fatos;
- interpretação;
- convicção;
- explicação comparativa;
- limites claros da IA.

### Auditoria

- plano gerado;
- versão do motor;
- dados utilizados;
- preços;
- câmbio;
- ranking;
- justificativa;
- decisão do usuário.

### Qualidade e operação

- testes;
- observabilidade;
- tratamento de erros;
- desempenho;
- segurança;
- acessibilidade;
- documentação operacional.

## Em avaliação

### Cotações e câmbio

- cotação manual inicial;
- preços automatizados;
- USD/BRL;
- fonte e horário;
- tratamento de falhas;
- política de atualização.

### Dados de contexto

- fundamentos;
- notícias;
- indicadores;
- provedores e licenças.

## Regra de avanço

> Uma etapa só muda para “Concluído” depois de implementação, validação,
> revisão e integração na branch principal.
