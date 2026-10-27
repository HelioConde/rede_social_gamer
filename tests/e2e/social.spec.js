import { test,expect } from '@playwright/test';
test('demonstração abre o feed',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Entrar na demonstração'}).click();
 await expect(page.getByText('Modo demonstração').first()).toBeVisible();
 await expect(page.getByRole('heading',{name:/Seu feed/i})).toBeVisible();
});
test('publicar, curtir e comentar',async({page})=>{
 await page.goto('/acesso');await page.getByRole('button',{name:'Entrar na demonstração'}).click();
 await page.getByRole('textbox',{name:'Escrever publicação'}).fill('Teste E2E de comunidade');
 await page.getByRole('button',{name:'Publicar'}).click();
 const card=page.getByRole('article').filter({hasText:'Teste E2E de comunidade'});
 await expect(card).toBeVisible();
 await card.getByRole('button',{name:'Curtir'}).click();
 await card.getByRole('button',{name:'Comentar'}).click();
 await card.getByRole('textbox',{name:'Seu comentário'}).fill('Belo post!');
 await card.getByRole('button',{name:'Enviar comentário'}).click();
 await expect(page.getByText('Belo post!')).toBeVisible();
});
test('layout não excede a largura',async({page})=>{
 await page.goto('/acesso');await page.getByRole('button',{name:'Entrar na demonstração'}).click();
 for(const width of [320,375,768,1024,1440]){
  await page.setViewportSize({width,height:812});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 }
});
test('navegação de comunidades e perfil',async({page})=>{
 await page.goto('/acesso');await page.getByRole('button',{name:'Entrar na demonstração'}).click();
 await page.goto('/comunidades');await expect(page.getByRole('heading',{name:'Comunidades',exact:true})).toBeVisible();
 await page.goto('/perfil');await expect(page.getByRole('heading',{name:'Alex Nova'})).toBeVisible();
});
test('navegação depois de rolar mantém títulos visíveis e não deixa toast fixo', async ({ page }, testInfo) => {
 test.setTimeout(45000);
 await page.goto('/acesso');
 await page.getByRole('button', { name: 'Entrar na demonstração' }).click();
 await expect(page.locator('.toast')).toHaveCount(0);
 const mobile = testInfo.project.use.viewport.width <= 760;
 async function navigateSidebar(label) {
  if (mobile) await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.locator('.sidebar').getByRole('link', { name: label, exact: true }).click();
 }
 for (const [item,title] of [
  ['Configurações','Configurações'],['Meu perfil','Alex Nova']
 ]) {
  await navigateSidebar('Feed');
  await expect(page.getByRole('heading', { name: /Seu feed/ })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(30);
  await navigateSidebar(item);
  await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  const positions = await page.evaluate(() => ({
   titleY: document.querySelector('.page-content h1')?.getBoundingClientRect().top,
   barBottom: document.querySelector('.topbar')?.getBoundingClientRect().bottom
  }));
  expect(positions.titleY, 'O título deve ficar abaixo do cabeçalho sticky').toBeGreaterThan(positions.barBottom);
 }
});
