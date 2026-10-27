# Arquitetura • Frontend e API

## Modos
- GitHub Pages: Vite/React em modo demonstração, usando localStorage e sessionStorage. Não há autenticação real, conteúdo compartilhado entre navegadores nem backend. Use apenas dados fictícios.
- API Node 24: servidor HTTP em server/index.js, banco SQLite em server/db.js. Tokens aleatórios de sessão têm hash SHA-256 no banco e são entregues ao navegador em cookies HttpOnly.
- Local: proxy Vite de /api para localhost:8787.
- Produção: hospedar Node 24 em um servidor separado, configurar HTTPS, VITE_API_URL, FRONTEND_ORIGINS e regras de cookies cross-site quando aplicável.

## Endpoints
Auth: GET /api/session, POST /api/register, /api/login e /api/logout.
Usuários: GET /api/users e /api/users/:handle, PATCH /api/profile.
Publicações: GET/POST /api/posts, PATCH/DELETE /api/posts/:id, POST /api/posts/:id/like e /api/posts/:id/comments.
Amigos e comunidades: GET /api/friends, POST /api/friends/:id, GET /api/communities/joined, POST /api/communities/:id/join.
Avisos/moderação: GET /api/notifications, POST /api/notifications/read, POST /api/reports, POST /api/blocks/:id.
Mídia e Riot: POST /api/media (até 1 MB em JSON base64), GET /api/riot/:name/:tag com chave exclusivamente no servidor.

## Segurança e limites
Banco usa instruções preparadas; senhas usam scrypt com salt aleatório; cookies usam HttpOnly, SameSite e Secure em produção; rate limits básicos protegem login, comentários e publicação. A API não oferece painel de análise de denúncias, remoção/exportação de dados, backups operacionais, re-encoding/antivírus de uploads ou moderação humana. Essa etapa é um protótipo de backend e **não está homologada para inscrições públicas**.

Consulta Riot ID retorna dados públicos quando a API key é configurada, mas não confirma que o usuário é dono dessa conta. Presença online é estimada pela atividade recente, sem WebSocket ou tempo real. A API de mídia está disponível no servidor, mas ainda não há composer de imagem no frontend.

GitHub Pages não executa PHP, Node ou SQLite. Somente o modo demonstração pode funcionar nele sem outra hospedagem.
## Mensagens privadas (chat)

Tabela `direct_messages` com participantes, data e leitura. `GET /api/chats`, `GET/POST /api/chats/:peerId/messages`, `POST /api/chats/:peerId/read`. Sessão obrigatória, bloqueio mútuo, limites de envio, consultas por participante. Atualização por polling a cada 12 segundos (sem WebSocket/criptografia ponta a ponta). Modo Pages contém somente mensagens fictícias locais.
