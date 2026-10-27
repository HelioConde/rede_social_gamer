# Revisão visual — Capturas reais (27/10/2026)

## Diagnóstico
Os testes anteriores navegavam diretamente para cada URL; por isso não detectavam problemas de rolagem entre rotas. Nas capturas enviadas pelo usuário, Configurações, Explorar, Amigos, Comunidades e perfis aparecem parcialmente escondidos por trás da topbar quando uma página é aberta depois de rolar outra.

Outro problema é a notificação flutuante "Modo demonstração" persistente, que compete com o banner permanente e pode tampar campos de comentário ou botões.

## Correções incluídas
- Reposicionamento no topo após mudanças de rota via React Router.
- Espaçamento de rolagem para elementos sob o cabeçalho fixo.
- Remoção do aviso flutuante redundante ao entrar na demonstração.
- Avisos de ações/erros temporários com fechamento automático; no celular, acima da barra inferior.
- Testes Playwright que navegam de verdade depois de rolar; capturas de transições para inspeção.

## QA
A suíte roda no CI em 320, 375, 768, 1024 e 1440 pixels. Evidências ficam no artefato `gamesocial-auditoria-visual` da execução do GitHub Actions. Limitações: checagens geométricas não substituem revisão visual humana.
