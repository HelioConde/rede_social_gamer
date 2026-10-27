# 🎮 GameSocial — Comunidade gamer

Modernização do projeto histórico **rede_social_gamer**. Agora com Vite + React, layout responsivo, perfis, feed e uma API experimental.

## Dois modos de funcionamento

**Demonstração estática:** funciona no GitHub Pages sem banco de dados. Inclui publicações, curtidas, comentários, amigos, comunidades, perfis e preferências no próprio navegador. Os dados de demonstração não são compartilhados com outras pessoas, e o aviso de demonstração permanece visível.

**Servidor experimental:** Node 24 com SQLite, contas, login, sessão por cookie HttpOnly, API de posts e relacionamentos, denúncias e integração Riot ID opcional. Não disponibilize inscrições públicas nem utilize dados pessoais reais antes de revisão de segurança e LGPD.

## Executar somente a demonstração

1. Instale Node.js 24 e execute `npm install`.
2. No PowerShell: `$env:VITE_APP_MODE="demo"; npm run dev`.
3. Abra http://localhost:5173 e clique em **Entrar na demonstração**.

## Executar com banco local e API

Em um terminal: `npm run dev`.
Em outro terminal: `npm --prefix server start`.
A API escuta em http://127.0.0.1:8787 e o frontend encaminha /api para ela. O SQLite será criado em server/data, que é ignorado pelo Git. Para uma implantação com frontend e API em domínios diferentes, veja .env.example e docs/ARCHITECTURE.md.

## Testes

- `npm run lint`: lint do frontend.
- `npm test`: testes unitários.
- `npx playwright install chromium` e `npm run test:e2e`: testes E2E em desktop, celular e tablet.
- `npm --prefix server test`: testes da API em Node 24.
- `npm run build`: versão de produção.

## Publicação no GitHub Pages

O workflow de publicação envia o build demonstrativo à branch gh-pages, que já existe no repositório. O site pode ser acessado em https://helioconde.github.io/rede_social_gamer/ após merge na main. Nas configurações do repositório, selecione Deploy from a branch → gh-pages / (root) como origem do Pages. A API Node não é hospedada pelo Pages.

## Documentos

- [Design System](docs/DESIGN_SYSTEM.md)
- [Arquitetura, endpoints e segurança](docs/ARCHITECTURE.md)
- [Estado do roteiro de 20 etapas](docs/IMPLEMENTATION_STATUS.md)

Feito por [Hélio Conde](https://github.com/HelioConde).