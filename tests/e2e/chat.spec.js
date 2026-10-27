import { test, expect } from '@playwright/test';

async function enterDemo(page) {
 await page.goto('/acesso');
 await page.getByRole('button',{name:'Entrar na demonstração'}).click();
 await expect(page.getByRole('heading',{name:/Seu feed/})).toBeVisible();
}

test('chat flutuante abre a lista e conversa; persiste mensagens após atualizar',async({page})=>{
 await enterDemo(page);
 const launcher=page.getByRole('button',{name:/Abrir mensagens/});
 await expect(launcher).toBeVisible();
 await launcher.click();
 await expect(page.getByRole('dialog',{name:'Mensagens'})).toBeVisible();
 await expect(page.getByText('Conversa fictícia')).toHaveCount(0);
 await expect(page.locator('.chat-contacts .chat-contact').filter({hasText:'Luna Pixel'})).toBeVisible();
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await expect(page.getByRole('dialog',{name:'Conversa com Luna Pixel'})).toBeVisible();
 await expect(page.getByText('Oi, Alex! Vai jogar TFT hoje?')).toBeVisible();
 await page.getByRole('textbox',{name:'Sua mensagem para Luna Pixel'}).fill('Bora jogar no fim de semana!');
 await page.getByRole('button',{name:'Enviar mensagem'}).click();
 await expect(page.getByText('Bora jogar no fim de semana!')).toBeVisible();
 await expect(page.locator('.chat-launcher')).toHaveCount(0);
 await page.reload();
 await expect(page.getByRole('heading',{name:/Seu feed/})).toBeVisible();
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await expect(page.getByText('Bora jogar no fim de semana!')).toBeVisible();
});

test('chat pesquisa, ação por perfil e fechamento com Escape',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.getByRole('searchbox',{name:'Buscar conversas'}).fill('Nina');
 await expect(page.locator('.chat-contact').filter({hasText:'Nina Quest'})).toBeVisible();
 await expect(page.locator('.chat-contact').filter({hasText:'Kai Storm'})).toHaveCount(0);
 await page.locator('.chat-contact').filter({hasText:'Nina Quest'}).click();
 await expect(page.getByRole('dialog',{name:'Conversa com Nina Quest'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.goto('/jogador/lunapixel');
 await page.getByRole('button',{name:'Mensagem',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Conversa com Luna Pixel'})).toBeVisible();
});

test('janela do chat cabe na tela e não cria overflow',async({page},testInfo)=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 const dimensions=await page.locator('.chat-window').evaluate(el=>{
  const rect=el.getBoundingClientRect();
  return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,windowWidth:innerWidth,windowHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth};
 });
 expect(dimensions.left).toBeGreaterThanOrEqual(-1);
 expect(dimensions.right).toBeLessThanOrEqual(dimensions.windowWidth+1);
 expect(dimensions.top).toBeGreaterThanOrEqual(-1);
 expect(dimensions.bottom).toBeLessThanOrEqual(dimensions.windowHeight+1);
 expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.windowWidth+2);
 if(testInfo.project.use.viewport.width<=760){
  expect(dimensions.width).toBe(dimensions.windowWidth);
  expect(dimensions.height).toBe(dimensions.windowHeight);
 }
});

test('chat funciona entre rotas sem fechar enquanto navega',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Kai Storm'}).click();
 await expect(page.getByRole('dialog',{name:'Conversa com Kai Storm'})).toBeVisible();
 await page.goto('/amigos');
 await expect(page.getByRole('heading',{name:'Meus amigos'})).toBeVisible();
 // Navegação pelo app mantém o estado do chat, mas uma recarga completa pode minimizar.
 await expect(page.getByRole('button',{name:/Abrir mensagens/})).toBeVisible();
});


test('filtro de conversas não lidas atualiza quando a conversa é aberta',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.getByRole('button',{name:/Não lidas/}).click();
 await expect(page.locator('.chat-contact').filter({hasText:'Luna Pixel'})).toBeVisible();
 await expect(page.locator('.chat-contact').filter({hasText:'Kai Storm'})).toHaveCount(0);
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await page.getByRole('button',{name:'Voltar para conversas'}).click();
 await expect(page.getByText('Nenhuma conversa não lida.')).toBeVisible();
 await page.getByRole('button',{name:'Todas',exact:true}).click();
 await expect(page.locator('.chat-contact').filter({hasText:'Luna Pixel'})).toBeVisible();
});

test('rascunhos são preservados ao trocar de conversa e não vazam para outras',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Nina Quest'}).click();
 await page.getByRole('textbox',{name:'Sua mensagem para Nina Quest'}).fill('Rascunho particular');
 await page.getByRole('button',{name:'Voltar para conversas'}).click();
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await expect(page.getByRole('textbox',{name:'Sua mensagem para Luna Pixel'})).toHaveValue('');
 await page.getByRole('button',{name:'Voltar para conversas'}).click();
 await page.locator('.chat-contact').filter({hasText:'Nina Quest'}).click();
 await expect(page.getByRole('textbox',{name:'Sua mensagem para Nina Quest'})).toHaveValue('Rascunho particular');
 await page.reload();
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Nina Quest'}).click();
 await expect(page.getByRole('textbox',{name:'Sua mensagem para Nina Quest'})).toHaveValue('');
});

test('exclusão exige confirmação e permanece após recarregar',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await page.getByRole('textbox',{name:'Sua mensagem para Luna Pixel'}).fill('Mensagem temporária para excluir');
 await page.getByRole('button',{name:'Enviar mensagem'}).click();
 await expect(page.getByText('Mensagem temporária para excluir')).toBeVisible();
 await page.getByRole('button',{name:/Excluir mensagem: Mensagem temporária/}).click();
 await expect(page.getByText('Excluir para todos?')).toBeVisible();
 await page.getByRole('button',{name:'Cancelar'}).click();
 await expect(page.getByText('Mensagem temporária para excluir')).toBeVisible();
 await page.getByRole('button',{name:/Excluir mensagem: Mensagem temporária/}).click();
 await page.getByRole('button',{name:'Excluir',exact:true}).click();
 await expect(page.getByText('Mensagem temporária para excluir')).toHaveCount(0);
 await page.reload();
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Luna Pixel'}).click();
 await expect(page.getByText('Mensagem temporária para excluir')).toHaveCount(0);
});

test('reiniciar demonstração exige confirmação e restaura mensagens fictícias',async({page})=>{
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await page.locator('.chat-contact').filter({hasText:'Kai Storm'}).click();
 await page.getByRole('textbox',{name:'Sua mensagem para Kai Storm'}).fill('Esta conversa será reiniciada');
 await page.getByRole('button',{name:'Enviar mensagem'}).click();
 await page.getByRole('button',{name:'Voltar para conversas'}).click();
 await page.getByRole('button',{name:'Reiniciar demonstração'}).click();
 await page.getByRole('button',{name:'Cancelar'}).click();
 await expect(page.getByText('Esta conversa será reiniciada')).toBeVisible();
 await page.getByRole('button',{name:'Reiniciar demonstração'}).click();
 await page.getByRole('button',{name:'Restaurar'}).click();
 await page.locator('.chat-contact').filter({hasText:'Kai Storm'}).click();
 await expect(page.getByText('Esta conversa será reiniciada')).toHaveCount(0);
 await expect(page.getByText('Partiu Valorant no fim de semana?')).toBeVisible();
});

test('ao abrir o chat no celular, a página por baixo não rola',async({page},testInfo)=>{
 if(testInfo.project.use.viewport.width>760)test.skip();
 await enterDemo(page);
 await page.getByRole('button',{name:/Abrir mensagens/}).click();
 await expect.poll(()=>page.locator('body').evaluate(el=>el.classList.contains('chat-open'))).toBeTruthy();
 await page.getByRole('button',{name:'Fechar chat'}).click();
 await expect.poll(()=>page.locator('body').evaluate(el=>el.classList.contains('chat-open'))).toBeFalsy();
});
