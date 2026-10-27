import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROUTES = [
  { path: '/acesso', key: 'login', public: true },
  { path: '/registro', key: 'cadastro', public: true },
  { path: '/inicio', key: 'feed' },
  { path: '/explorar', key: 'explorar' },
  { path: '/amigos', key: 'amigos' },
  { path: '/comunidades', key: 'comunidades' },
  { path: '/notificacoes', key: 'notificacoes' },
  { path: '/perfil', key: 'perfil' },
  { path: '/jogador/lunapixel', key: 'perfil-publico' },
  { path: '/configuracoes', key: 'configuracoes' },
  { path: '/privacidade', key: 'privacidade', public: true }
];

const REQUIRED = {
  '/acesso': 'Entre no seu universo',
  '/registro': 'Crie seu perfil',
  '/inicio': 'Seu feed',
  '/explorar': 'Explorar jogadores',
  '/amigos': 'Meus amigos',
  '/comunidades': 'Comunidades',
  '/notificacoes': 'Notificações',
  '/perfil': 'Alex Nova',
  '/jogador/lunapixel': 'Luna Pixel',
  '/configuracoes': 'Configurações',
  '/privacidade': 'Privacidade e uso responsável'
};

test('auditoria visual completa, erros JS e layout em todas as páginas', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const project = testInfo.project.name;
  const folder = join(process.cwd(), 'visual-audit', project);
  await mkdir(folder, { recursive: true });
  const captures = [];
  let current = 'startup';
  let errors = [];
  const base = new URL(testInfo.project.use.baseURL || 'http://127.0.0.1:4173');

  // These hooks stay attached across full navigations and reloads.
  page.on('pageerror', err => errors.push({ route: current, type: 'javascript', message: String(err.message).slice(0, 600) }));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    errors.push({ route: current, type: 'console', message: msg.text().slice(0, 600) });
  });
  page.on('requestfailed', req => {
    if (req.url().startsWith(base.origin) && !/ERR_ABORTED/.test(req.failure()?.errorText || ''))
      errors.push({ route: current, type: 'network', message: req.url() + ': ' + (req.failure()?.errorText || 'failed') });
  });
  page.on('response', response => {
    if (response.url().startsWith(base.origin) && response.status() >= 400)
      errors.push({ route: current, type: 'http', message: response.status() + ' ' + response.url() });
  });

  await page.context().addInitScript(() => {
    window.__visualAuditRejections = [];
    window.addEventListener('unhandledrejection', event => {
      window.__visualAuditRejections.push(String(event.reason?.message || event.reason).slice(0, 600));
    });
  });

  async function take(route, theme = 'dark') {
    current = route.key + (theme === 'light' ? '-claro' : '');
    const url = route.path;
    const file = current + '.png';
    const viewportFile = current + '-viewport.png';
    const row = { route: url, key: current, theme, screenshot: file, issues: [], errors: [], measurements: {} };
    const from = errors.length;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await expect(page.getByRole('heading', { name: REQUIRED[url], exact: url !== '/inicio' }).first()).toBeVisible({ timeout: 12000 });
      if (!route.public) await expect(page.getByText('Modo demonstração').first()).toBeVisible();
      if (theme === 'light') {
        const button = page.getByRole('button', { name: 'Ativar tema claro' });
        if (await button.count()) await button.first().click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      }
      await page.evaluate(() => document.fonts?.ready);
      const check = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight;
        const visible = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0;
        };
        const items = [...document.querySelectorAll('a, button, input, select, textarea')].filter(visible).filter(el => !el.closest('.sidebar:not(.is-open)'));
        const outside = items
          .filter(el => { const r = el.getBoundingClientRect(); return r.right > vw + 3 || r.left < -3; })
          .slice(0, 12).map(el => ({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 55), x: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right) }));
        const clipped = [...document.querySelectorAll('h1,h2,h3,.button,.nav-item')]
          .filter(visible).filter(el => !el.closest('.sidebar:not(.is-open)'))
          .filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 4 && getComputedStyle(el).overflowX !== 'visible')
          .slice(0, 12).map(el => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 60) }));
        const missingImages = [...document.querySelectorAll('img')].filter(visible).filter(el => el.complete && el.naturalWidth === 0).map(el => el.currentSrc);
        const header = document.querySelector('.topbar');
        const actions = header ? [...header.querySelectorAll('a,button')].filter(visible) : [];
        const overlappingControls = [];
        for (let i=0; i<actions.length; i++) for (let j=i+1; j<actions.length; j++){
          const a=actions[i].getBoundingClientRect(), b=actions[j].getBoundingClientRect();
          const intersection = Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
          if(intersection>20)overlappingControls.push([actions[i].getAttribute('aria-label')||actions[i].textContent.trim().slice(0,35),actions[j].getAttribute('aria-label')||actions[j].textContent.trim().slice(0,35)]);
        }
        return {
          viewportWidth: vw, viewportHeight,
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight,
          horizontalOverflow: Math.max(0,document.documentElement.scrollWidth-vw),
          outside, clipped, missingImages, overlappingControls,
          unhandled: window.__visualAuditRejections || []
        };
      });
      row.measurements = check;
      if (check.horizontalOverflow > 2) row.issues.push({ type: 'overflow-horizontal', details: check.horizontalOverflow + 'px além da viewport' });
      if (check.outside.length) row.issues.push({ type: 'controls-fora-da-tela', details: check.outside });
      if (check.clipped.length) row.issues.push({ type: 'texto-cortado', details: check.clipped });
      if (check.missingImages.length) row.issues.push({ type: 'imagens-quebradas', details: check.missingImages });
      if (check.overlappingControls.length) row.issues.push({ type: 'controles-sobrepostos', details: check.overlappingControls });
      if (check.unhandled.length) row.issues.push({ type: 'promise-rejection', details: check.unhandled });
    } catch(err) {
      row.issues.push({ type: 'navegacao-ou-renderizacao', details: String(err.message).slice(0, 1200) });
    } finally {
      try {
        await page.screenshot({ path: join(folder, file), fullPage: true, animations: 'disabled', timeout: 15000 });
      } catch (err) {
        row.issues.push({ type: 'screenshot-falhou', details: String(err.message).slice(0, 700) });
      }
      try {
        await page.screenshot({ path: join(folder, viewportFile), fullPage: false, animations: 'disabled', timeout: 15000 });
        row.viewportScreenshot = viewportFile;
      } catch (err) {
        row.issues.push({ type: 'viewport-screenshot-falhou', details: String(err.message).slice(0, 700) });
      }
      row.errors = errors.slice(from);
      captures.push(row);
    }
  }

  await take(ROUTES[0]);
  await take(ROUTES[1]);
  current = 'entrar-demo';
  await page.goto('/acesso', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Entrar na demonstração' }).click();
  await expect(page.getByRole('heading', { name: 'Seu feed' })).toBeVisible();

  for (const route of ROUTES.filter(r => !['login', 'cadastro'].includes(r.key))) await take(route);
  // Test both palettes for two visually important screens.
  await take(ROUTES[2], 'light');
  await take(ROUTES[7], 'light');

  const summary = {
    project, viewport: testInfo.project.use.viewport, date: new Date().toISOString(),
    captures, totalIssues: captures.reduce((n, x) => n + x.issues.length, 0),
    totalErrors: captures.reduce((n, x) => n + x.errors.length, 0)
  };
  await writeFile(join(folder, 'manifest.json'), JSON.stringify(summary, null, 2));
  expect.soft(summary.totalIssues, 'Falhas de layout ou renderização registradas no relatório visual').toBe(0);
  expect.soft(summary.totalErrors, 'Erros de JS ou rede local registrados no relatório visual').toBe(0);
});
