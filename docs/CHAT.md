# Chat flutuante — GameSocial

## Interface
O botão **Mensagens** fica no canto inferior direito no desktop e acima da barra móvel no celular. Ao clicar, abre uma janela de conversa em estilo mensageiro, com lista pesquisável, avatares, indicador de mensagens não lidas, histórico e envio com Enter (Shift+Enter para uma nova linha). Escape fecha a janela. O chat não muda a rota do usuário. Há botões **Mensagem** em perfis e cartões de jogadores.

No celular a janela ocupa toda a altura disponível, evitando ficar por cima do menu inferior. O estado é preservado entre rotas SPA, e o histórico da demonstração fica salvo em \`gamesocial-chat-demo-v1\` no localStorage.

## Demonstração (GitHub Pages)
Existem mensagens **fictícias** de Luna Pixel e Kai Storm para ilustrar o sistema. Enviar uma mensagem grava apenas dados no próprio navegador. Não há entregas reais, respostas automáticas nem acesso a contas de terceiros; os avisos no chat deixam isso claro. Quando o usuário recarrega o site, suas mensagens de demonstração permanecem.

## Backend experimental
Quando a API Node 24 está conectada, chat usa:
- \`GET /api/chats\` — lista de conversas e quantidades não lidas.
- \`GET /api/chats/:peerId/messages\` — até 100 mensagens entre dois usuários autenticados.
- \`POST /api/chats/:peerId/messages\` — mensagem com até 1.000 caracteres e limite por conta.
- \`POST /api/chats/:peerId/read\` — marca mensagens recebidas como lidas.

O banco SQLite armazena remetente, destinatário, data e leitura. O servidor só retorna mensagens para participantes da conversa e rejeita conversas com usuários bloqueados. O cliente atualiza as conversas por consulta periódica de 12 segundos; **não é entrega realtime via WebSocket**, e não existe criptografia de ponta a ponta.

Não implantar o servidor para usuários reais sem revisar privacidade/LGPD, retenção/exclusão, moderação, limites e escalabilidade.

## QA
\`npm run test:e2e\` verifica envio, persistência, pesquisa, acesso por perfil e layout nas cinco resoluções. A auditoria visual também gera capturas com o chat aberto nas telas pequenas e grandes, além do feed normal.
