# Estado de implementação do roadmap (branch de modernização)

1. Autenticação/sessão: implementada na API, com manter login via cookie persistente; requer deploy e revisão de segurança.
2. API por ambiente: implementada em src/lib/api.js e .env.example.
3. Redux, erros e formulários: legado substituído por Context; validação HTML e feedback visual.
4. Demonstração: implementada, com aviso explícito e dados locais.
5. Design tokens: implementados em CSS.
6. Login/cadastro acessíveis: implementados para API; demo não exige credenciais.
7. Home: reconstruída com sidebar, feed e painel lateral.
8. Perfil/dark mode/componentes: implementados.
9. Design system: documentado; revisão visual com Playwright ainda depende de execução e análise de screenshots.
10. Feed CRUD: implementado no demo e na API.
11. Curtidas/comentários/amigos: implementados no demo e na API.
12. Perfis, busca e comunidades: interface e endpoints disponíveis; comunidades têm dados estáticos.
13. Notificações/presença: notificações na API; presença aproximada pelo último acesso, sem tempo real.
14. Banco e autenticação: SQLite + scrypt + sessões; revisão LGPD e operacional pendente.
15. Endpoints: principais endpoints implementados, incluindo mídia básica (sem UI de upload).
16. Riot ID: endpoint opcional de consulta por Riot ID, sem verificação de propriedade.
17. Denúncias e bloqueios: persistência e rate limiting básicos; moderação humana/admin pendente.
18. Vite e assets: migração realizada; fontes e imagem de background pesado do legado não são carregadas no novo app.
19. Playwright: suíte de navegação, feed e viewport adicionada; execução em CI deve validar.
20. GitHub Actions: workflows CI e deploy demo adicionados; merge depende de revisão e checks verdes.

Não considerar status de produção concluído apenas porque há implementação inicial; ver docs/ARCHITECTURE.md.