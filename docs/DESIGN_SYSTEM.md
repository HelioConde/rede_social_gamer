# GameSocial • Design System v1

## Direção
Comunidade gamer com conteúdo em primeiro lugar, estética dark moderna, sem animações ou efeitos pesados. O tema claro também é suportado.

## Referências conceituais
- Discord: estrutura de comunidades e estados de presença.
- Steam Community: perfis e descoberta por jogo.
- Reddit: hierarquia do feed e interações em publicações.

Nenhuma interface de terceiros foi copiada pixel a pixel. A etapa Image to Code utiliza as referências como ponto de partida, enquanto revisões reais devem comparar capturas geradas pelo Playwright.

## Tokens
Fonte principal: DM Sans. Títulos: Space Grotesk. Espaçamento: escala de 4/8/12/16/24/32 pixels. Raio padrão de card: 18 pixels. Paleta primária violeta com tokens de superfície, borda, texto, texto secundário e foco. Tokens CSS definidos em src/styles.css.

## Layouts
Desktop: topbar + sidebar + feed central + painel de comunidade. Tablet: topo + sidebar + feed. Mobile até 760px: menu recolhido + navegação inferior. Regressão visual: testar 320, 375, 768, 1024 e 1440px, com nenhuma rolagem horizontal.

## Componentes
Brand, Avatar, Empty, Toast, Buttons (primary/secondary/ghost), PostCard, PostComposer, PlayerCard, CommunityCard e menu de navegação.

## Acessibilidade
Inputs com labels associados; estados de foco visíveis; eventos por teclado com botões reais; aria-pressed para like e comunidade; aria-expanded nos menus; uso de prefers-reduced-motion; erros anunciados por role=alert.

## Image to Code: revisão
Cada screenshot deve ser revisado para hierarquia, alinhamento, consistência de espaços, clipping, legibilidade em 320px e contraste. Capturas de falha do Playwright servem de base para revisões CSS. Sem screenshots reais, não declarar validação pixel-perfect ou conformidade WCAG certificada.
## Messenger — etapa complementar
- Painel flutuante com indicador de mensagens não lidas, cabeçalho, busca e filtros por conversa.
- Anéis de foco explícitos nos botões de conversa e na busca; transformações decorativas desativadas com movimento reduzido.
- Confirmações de exclusão e reinício utilizam Escape como cancelar, antes de fechar a janela.
- Dados de demonstração são validados e descartam entradas malformadas, sem depender de SQL, servidor ou contas reais.
