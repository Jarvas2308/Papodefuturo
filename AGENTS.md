# AGENTS

1. Ler `README.md`, `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`,
   `docs/CHANGELOG-DECISIONS.md` e `docs/ROADMAP.md` antes de mudanças
   relevantes.
2. Implementar apenas o escopo solicitado.
3. Não declarar funcionalidade planejada como implementada.
4. Não alterar regras de produto silenciosamente.
5. Registrar decisão relevante em `docs/CHANGELOG-DECISIONS.md`.
6. Quando uma decisão for substituída, preservar o histórico.
7. Atualizar o roadmap somente após implementação, validação, revisão e
   integração.
8. Mocks não são fonte de verdade do domínio.
9. Cálculos financeiros pertencem ao domínio, não aos componentes visuais.
10. IA não pode substituir o motor determinístico.
11. Não adicionar banco, Supabase ou APIs sem solicitação explícita.
12. Alterações futuras no banco exigem migrations.
13. Dados persistidos de usuário no banco exigem RLS.
14. Não adicionar ativos fora do universo definido sem decisão registrada.
15. Não criar categoria de renda fixa nesta fase.
16. Manter regras de negócio separadas da interface.
17. Evitar arquivos grandes e responsabilidades misturadas.
18. Manter toda a interface em português do Brasil.
19. Não inserir segredos, chaves ou credenciais no repositório.
20. Usar npm e manter o `package-lock.json`.
21. Executar `npm run format:check`, `npm run lint` e `npm run build` antes de
    concluir.
22. Não avançar espontaneamente para escopos não solicitados.
