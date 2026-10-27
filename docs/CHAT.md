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


## Melhorias da versão 2

A lista agora pode filtrar **Todas** e **Não lidas**, com indicadores mais claros. O histórico agrupa mensagens por dia e diferencia estado "Enviada" de "Lida" quando a API informa leitura. Ao alternar entre conversas, o texto ainda não enviado fica preservado enquanto o aplicativo estiver aberto; por privacidade, rascunhos **não são armazenados no navegador**.

Mensagens próprias podem ser excluídas mediante confirmação inline. No backend, a exclusão só é aceita do próprio remetente, na conversa correspondente. Existe um botão para **reiniciar os dados fictícios**, também com confirmação; isso não altera nenhum dado de contas reais.

Quando o chat está aberto em dispositivos móveis, a rolagem da página por baixo é bloqueada. Para evitar chamadas desnecessárias, o polling não acontece quando a aba está em segundo plano ou offline.

Os testes automatizados incluem exclusão autorizada/não autorizada, filtro de não lidas, rascunhos e reinicialização da demonstração.

## Confiabilidade e navegação (outubro de 2026)
- Mensagens da demonstração são normalizadas ao ler o armazenamento local e ao receber sincronização entre abas. Registros sem data válida, IDs repetidos e textos acima de 1.000 caracteres são descartados.
- O chat mantém o modo estático sem backend no GitHub Pages. O armazenamento de demonstração não significa comunicação entre usuários.
- Escape cancela primeiro exclusão ou reinício pendente; pressionado novamente fecha o painel e devolve foco ao lançador.
- Foco de teclado reforçado na busca e nos contatos. Testes Vitest e Playwright exercitam cenários de dados corrompidos e confirmações.
