import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const root = join(process.cwd(), 'visual-audit');
const escape = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
await mkdir(root,{recursive:true});
const dirs = await readdir(root,{withFileTypes:true});
const reports = [];
for(const dir of dirs.filter(d=>d.isDirectory())){
  try { reports.push(JSON.parse(await readFile(join(root,dir.name,'manifest.json'),'utf8'))); }
  catch { /* a run may be interrupted before producing a manifest */ }
}
reports.sort((a,b)=>a.project.localeCompare(b.project));
const captures=reports.flatMap(report=>report.captures.map(item=>({...item,project:report.project})));
const screenshots=captures.filter(c=>c.screenshot&&!c.issues.some(i=>i.type==='screenshot-falhou')).length;
const issues=captures.flatMap(c=>c.issues.map(i=>({project:c.project,key:c.key,...i})));
const errors=captures.flatMap(c=>c.errors.map(e=>({project:c.project,key:c.key,...e})));
const summary = [
  '# Auditoria visual — GameSocial',
  '',
  'Data: '+new Date().toISOString(),
  '',
  '| Indicador | Resultado |',
  '| --- | ---: |',
  '| Viewports concluídas | '+reports.length+' |',
  '| Páginas/temas fotografados | '+screenshots+' |',
  '| Problemas de layout/renderização | '+issues.length+' |',
  '| Erros de console, JavaScript ou rede | '+errors.length+' |',
  '',
  'Imagens integrais em pastas por resolução. HTML navegável em `visual-audit/index.html`.',
  '',
  ...issues.slice(0,100).map(i=>'- **'+i.project+' / '+i.key+'** — '+i.type+': '+JSON.stringify(i.details)),
  ...errors.slice(0,100).map(e=>'- **'+e.project+' / '+e.key+'** — '+e.type+': '+e.message)
].join('\n');
await writeFile(join(root,'summary.md'),summary);
await writeFile(join(root,'summary.json'),JSON.stringify({date:new Date().toISOString(),projects:reports.length,screenshots,issues,errors},null,2));
const cards = captures.map(c=>{
 const failing=c.issues.length>0||c.errors.length>0;
 const note=[...c.issues.map(i=>i.type+': '+JSON.stringify(i.details)),...c.errors.map(e=>e.type+': '+e.message)];
 return '<article class="card '+(failing?'fail':'pass')+'"><a href="'+escape(c.project+'/'+c.screenshot)+'"><img loading="lazy" src="'+escape(c.project+'/'+c.screenshot)+'" alt="Captura integral da página '+escape(c.key)+' em '+escape(c.project)+'"></a><div class="info"><h2>'+escape(c.key)+'</h2><p>'+escape(c.project)+' · '+escape(c.route)+' · '+escape(c.theme)+'</p><p class="status">'+(failing?'⚠ Problemas encontrados':'✓ Sem falhas detectadas')+'</p>'+note.map(n=>'<p class="problem">'+escape(n)+'</p>').join('')+'</div></article>';
}).join('\n');
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auditoria visual · GameSocial</title><style>body{margin:0;background:#0c1020;color:#f5f5ff;font:15px system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:24px}h1{margin:0 0 12px}.metrics{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 28px}.metrics span{padding:12px 18px;background:#1a2440;border-radius:12px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}.card{background:#171d31;border:1px solid #35405d;border-radius:14px;overflow:hidden}.card.fail{border-color:#ec8080}.card img{display:block;width:100%;height:255px;object-fit:cover;object-position:top;background:#080b13}.info{padding:14px}.info h2{font-size:17px}.info p{font-size:12px;color:#aebbd7;overflow-wrap:anywhere}.info .status{color:#7ee3b2}.fail .status{color:#ffaaaa}.problem{color:#ffc4c4!important}</style></head><body><main><h1>GameSocial · Auditoria visual automática</h1><p>Capturas completas do Playwright, erros de JavaScript e rede, e verificações de integridade de layout. Clique nas miniaturas para ampliar.</p><div class="metrics"><span>'+reports.length+' resoluções</span><span>'+screenshots+' capturas</span><span>'+issues.length+' problemas de layout</span><span>'+errors.length+' mensagens de erro</span></div><section class="gallery">'+cards+'</section></main></body></html>';
await writeFile(join(root,'index.html'),html);
console.log(summary);
if(reports.length===0){console.error('Nenhuma captura encontrada.');process.exitCode=1;}
