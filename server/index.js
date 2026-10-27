import http from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { db, getUser, publicUser, notify } from './db.js';

const PORT=Number(process.env.PORT||8787);
const origins=new Set(['http://localhost:5173','http://127.0.0.1:5173',...(process.env.FRONTEND_ORIGINS||'').split(',').filter(Boolean).map(s=>s.trim())]);
const production=process.env.NODE_ENV==='production';
const allowCrossSite=process.env.CROSS_SITE_COOKIES==='true';
const uploads=resolve(process.env.UPLOAD_DIR||'server/data/uploads'); mkdirSync(uploads,{recursive:true});
const attempts=new Map();
const games=new Set(['League of Legends','Valorant','Minecraft','TFT','Jogos indie','']);
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const fail=(res,status,error)=>json(res,status,{error});
const sha=text=>createHash('sha256').update(text).digest('hex');
const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
const cookieValue=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('gs_session='))?.slice('gs_session='.length)||'';
const cookieOptions=(maxAge)=>'HttpOnly; Path=/; SameSite='+(allowCrossSite?'None':'Lax')+(production||allowCrossSite?'; Secure':'')+(maxAge?'; Max-Age='+maxAge:'');
function session(req){
  const token=cookieValue(req);
  if(!token)return null;
  const row=db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires>?').get(sha(token),Date.now());
  if(!row)return null;
  db.prepare('UPDATE users SET last_seen=? WHERE id=?').run(new Date().toISOString(),row.user_id);
  return getUser(row.user_id);
}
function issueSession(res,id,remember){
  const token=randomBytes(32).toString('hex');
  const maxAge=remember?60*60*24*30:60*60*12;
  db.prepare('INSERT INTO sessions (token_hash,user_id,expires) VALUES (?,?,?)').run(sha(token),id,Date.now()+maxAge*1000);
  res.setHeader('Set-Cookie','gs_session='+token+'; '+cookieOptions(remember?maxAge:0));
}
function withinLimit(req,key,limit=15,windowMs=60000){
  const now=Date.now(),value=attempts.get(key)||{count:0,until:now+windowMs};
  if(value.until<now){value.count=0;value.until=now+windowMs;}
  value.count++;attempts.set(key,value);
  return value.count<=limit;
}
async function body(req,max=32768){
  if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(Error('Envie JSON.'),{status:415});
  let text='';
  for await(const chunk of req){text+=chunk.toString('utf8');if(Buffer.byteLength(text)>max)throw Object.assign(Error('Corpo muito grande.'),{status:413});}
  try{return JSON.parse(text||'{}');}catch{throw Object.assign(Error('JSON inválido.'),{status:400});}
}
function postList(uid){
  const posts=db.prepare('SELECT p.* FROM posts p WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id=? AND b.blocked_id=p.author_id) AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id=p.author_id AND b.blocked_id=?) ORDER BY p.created_at DESC LIMIT 100').all(uid,uid);
  const allLikes=db.prepare('SELECT user_id FROM likes WHERE post_id=?'),allComments=db.prepare('SELECT id,author_id,text FROM comments WHERE post_id=? ORDER BY created_at LIMIT 100');
  return posts.map(p=>({id:p.id,authorId:p.author_id,content:p.content,game:p.game,createdAt:p.created_at,likes:allLikes.all(p.id).map(l=>l.user_id),comments:allComments.all(p.id).map(c=>({id:c.id,authorId:c.author_id,text:c.text}))}));
}
function validText(v,max=600){return typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;}
const denied=(res)=>fail(res,401,'Faça login para continuar.');
async function handler(req,res){
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
  const origin=req.headers.origin;
  if(origin&&origins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE, OPTIONS');}
  if(req.method==='OPTIONS'){res.writeHead(origin&&!origins.has(origin)?403:204);res.end();return;}
  if(!['GET','HEAD','POST','PATCH','DELETE'].includes(req.method))return fail(res,405,'Método não permitido.');
  if(!['GET','HEAD'].includes(req.method)&&origin&&!origins.has(origin))return fail(res,403,'Origem não autorizada.');
  const url=new URL(req.url,'http://localhost'),path=url.pathname,method=req.method;
  if(path==='/api/health'&&method==='GET')return json(res,200,{ok:true,service:'GameSocial API'});
  if(path.startsWith('/uploads/')&&method==='GET'){
    const filename=path.slice('/uploads/'.length);
    if(!/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(filename))return fail(res,404,'Arquivo não encontrado.');
    const found=db.prepare('SELECT mime FROM media WHERE filename=?').get(filename);
    if(!found||!existsSync(join(uploads,filename)))return fail(res,404,'Arquivo não encontrado.');
    res.writeHead(200,{'Content-Type':found.mime,'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'});res.end(readFileSync(join(uploads,filename)));return;
  }
  if(!path.startsWith('/api/'))return fail(res,404,'Rota desconhecida.');
  if(!withinLimit(req,req.socket.remoteAddress+':all',180,60000))return fail(res,429,'Muitas solicitações. Tente mais tarde.');
  if(path==='/api/register'&&method==='POST'){
    if(!withinLimit(req,req.socket.remoteAddress+':register',5,3600000))return fail(res,429,'Limite de cadastros atingido.');
    const b=await body(req);
    const name=typeof b.name==='string'?b.name.trim():'',email=typeof b.email==='string'?b.email.toLowerCase().trim():'',password=b.password;
    if(!validText(name,40)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180||typeof password!=='string'||password.length<8||password.length>128)return fail(res,400,'Informe nome, e-mail válido e senha de 8 a 128 caracteres.');
    const handle='player_'+randomBytes(4).toString('hex'),id=randomUUID(),salt=randomBytes(16).toString('hex');
    try{db.prepare('INSERT INTO users (id,name,handle,email,password_hash,salt,created_at) VALUES (?,?,?,?,?,?,?)').run(id,name,handle,email,passwordHash(password,salt),salt,new Date().toISOString());}
    catch{return fail(res,409,'Este e-mail já está cadastrado.');}
    issueSession(res,id,true);return json(res,201,{user:publicUser(getUser(id))});
  }
  if(path==='/api/login'&&method==='POST'){
    if(!withinLimit(req,req.socket.remoteAddress+':login',10,900000))return fail(res,429,'Muitas tentativas. Tente em 15 minutos.');
    const b=await body(req),email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
    const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const supplied=typeof b.password==='string'?b.password:'';
    const actual=row?Buffer.from(row.password_hash,'hex'):Buffer.alloc(64);
    const computed=Buffer.from(passwordHash(supplied.slice(0,128),row?.salt||'00000000000000000000000000000000'),'hex');
    if(!row||supplied.length>128||!timingSafeEqual(actual,computed))return fail(res,401,'E-mail ou senha inválidos.');
    issueSession(res,row.id,!!b.remember);return json(res,200,{user:publicUser(getUser(row.id))});
  }
  const user=session(req),uid=user?.id;
  if(path==='/api/session'&&method==='GET')return json(res,200,{user:publicUser(user)});
  if(path==='/api/logout'&&method==='POST'){
    db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(cookieValue(req)));
    res.setHeader('Set-Cookie','gs_session=; '+cookieOptions(0)+'; Max-Age=0');
    return json(res,200,{ok:true});
  }
  if(!uid)return denied(res);
  if(path==='/api/users'&&method==='GET'){
    const people=db.prepare('SELECT id,name,handle,bio,last_seen FROM users WHERE id!=? AND id NOT IN (SELECT blocked_id FROM blocks WHERE user_id=?) ORDER BY created_at DESC LIMIT 100').all(uid,uid).map(publicUser);
    return json(res,200,{users:people});
  }
  const publicMatch=path.match(/^\/api\/users\/([^/]+)$/);
  if(publicMatch&&method==='GET')return json(res,200,{user:publicUser(db.prepare('SELECT id,name,handle,bio,last_seen FROM users WHERE handle=?').get(decodeURIComponent(publicMatch[1])))});
  if(path==='/api/profile'&&method==='PATCH'){
    const b=await body(req);if(!validText(b.name,40)||typeof b.bio!=='string'||b.bio.length>220)return fail(res,400,'Nome ou biografia inválidos.');
    db.prepare('UPDATE users SET name=?,bio=? WHERE id=?').run(b.name.trim(),b.bio.trim(),uid);return json(res,200,{user:publicUser(getUser(uid))});
  }
  if(path==='/api/posts'&&method==='GET')return json(res,200,{posts:postList(uid)});
  if(path==='/api/posts'&&method==='POST'){
    if(!withinLimit(req,uid+':post',10,60000))return fail(res,429,'Publicações muito frequentes.');
    const b=await body(req);if(!validText(b.content)||!games.has(b.game||''))return fail(res,400,'Publicação inválida.');
    const id=randomUUID();db.prepare('INSERT INTO posts (id,author_id,content,game,created_at) VALUES (?,?,?,?,?)').run(id,uid,b.content.trim(),b.game||'',new Date().toISOString());
    return json(res,201,{id});
  }
  const postMatch=path.match(/^\/api\/posts\/([0-9a-f-]{36})$/);
  if(postMatch&&['PATCH','DELETE'].includes(method)){
    const post=db.prepare('SELECT author_id FROM posts WHERE id=?').get(postMatch[1]);if(!post)return fail(res,404,'Publicação não encontrada.');if(post.author_id!==uid)return fail(res,403,'Sem permissão.');
    if(method==='DELETE'){db.prepare('DELETE FROM posts WHERE id=?').run(postMatch[1]);return json(res,200,{ok:true});}
    const b=await body(req);if(!validText(b.content))return fail(res,400,'Texto inválido.');
    db.prepare('UPDATE posts SET content=? WHERE id=?').run(b.content.trim(),postMatch[1]);return json(res,200,{ok:true});
  }
  const likeMatch=path.match(/^\/api\/posts\/([0-9a-f-]{36})\/like$/);
  if(likeMatch&&method==='POST'){
    const p=db.prepare('SELECT author_id FROM posts WHERE id=?').get(likeMatch[1]);if(!p)return fail(res,404,'Publicação não encontrada.');
    const liked=db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(likeMatch[1],uid);
    if(liked)db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(likeMatch[1],uid);
    else{db.prepare('INSERT INTO likes (post_id,user_id) VALUES (?,?)').run(likeMatch[1],uid);if(p.author_id!==uid)notify(p.author_id,user.name+' curtiu sua publicação.');}
    return json(res,200,{liked:!liked});
  }
  const commentMatch=path.match(/^\/api\/posts\/([0-9a-f-]{36})\/comments$/);
  if(commentMatch&&method==='POST'){
    const p=db.prepare('SELECT author_id FROM posts WHERE id=?').get(commentMatch[1]);if(!p)return fail(res,404,'Publicação não encontrada.');
    if(!withinLimit(req,uid+':comments',20,60000))return fail(res,429,'Comentários muito frequentes.');
    const b=await body(req);if(!validText(b.text,300))return fail(res,400,'Comentário inválido.');
    const id=randomUUID();db.prepare('INSERT INTO comments (id,post_id,author_id,text,created_at) VALUES (?,?,?,?,?)').run(id,commentMatch[1],uid,b.text.trim(),new Date().toISOString());
    if(p.author_id!==uid)notify(p.author_id,user.name+' comentou sua publicação.');
    return json(res,201,{id});
  }
  if(path==='/api/friends'&&method==='GET')return json(res,200,{friends:db.prepare('SELECT friend_id FROM friends WHERE user_id=?').all(uid).map(x=>x.friend_id)});
  const friendMatch=path.match(/^\/api\/friends\/([0-9a-f-]{36})$/);
  if(friendMatch&&method==='POST'){
    const id=friendMatch[1];if(id===uid||!getUser(id))return fail(res,400,'Jogador inválido.');
    const found=db.prepare('SELECT 1 FROM friends WHERE user_id=? AND friend_id=?').get(uid,id);
    if(found)db.prepare('DELETE FROM friends WHERE user_id=? AND friend_id=?').run(uid,id);
    else{db.prepare('INSERT INTO friends (user_id,friend_id) VALUES (?,?)').run(uid,id);notify(id,user.name+' adicionou você aos amigos.');}
    return json(res,200,{friend:!found});
  }
  if(path==='/api/communities/joined'&&method==='GET')return json(res,200,{joined:db.prepare('SELECT community_id FROM joined WHERE user_id=?').all(uid).map(x=>x.community_id)});
  const communityMatch=path.match(/^\/api\/communities\/([a-z]+)\/join$/);
  if(communityMatch&&method==='POST'){
    const id=communityMatch[1];if(!['lol','valorant','minecraft','tft','indie'].includes(id))return fail(res,404,'Comunidade não encontrada.');
    const found=db.prepare('SELECT 1 FROM joined WHERE user_id=? AND community_id=?').get(uid,id);
    if(found)db.prepare('DELETE FROM joined WHERE user_id=? AND community_id=?').run(uid,id);
    else db.prepare('INSERT INTO joined (user_id,community_id) VALUES (?,?)').run(uid,id);
    return json(res,200,{joined:!found});
  }
  if(path==='/api/notifications'&&method==='GET')return json(res,200,{notifications:db.prepare('SELECT id,text,is_read FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(uid).map(x=>({id:x.id,text:x.text,read:!!x.is_read}))});
  if(path==='/api/notifications/read'&&method==='POST'){db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(uid);return json(res,200,{ok:true});}
  if(path==='/api/reports'&&method==='POST'){
    if(!withinLimit(req,uid+':reports',8,3600000))return fail(res,429,'Limite de denúncias atingido.');
    const b=await body(req);if(!validText(b.reason,180)||typeof b.postId!=='string'||!db.prepare('SELECT 1 FROM posts WHERE id=?').get(b.postId))return fail(res,400,'Denúncia inválida.');
    db.prepare('INSERT OR IGNORE INTO reports (id,reporter_id,post_id,reason,created_at) VALUES (?,?,?,?,?)').run(randomUUID(),uid,b.postId,b.reason.trim(),new Date().toISOString());
    return json(res,201,{ok:true});
  }
  const blockMatch=path.match(/^\/api\/blocks\/([0-9a-f-]{36})$/);
  if(blockMatch&&method==='POST'){
    const id=blockMatch[1];if(id===uid||!getUser(id))return fail(res,400,'Jogador inválido.');
    const found=db.prepare('SELECT 1 FROM blocks WHERE user_id=? AND blocked_id=?').get(uid,id);
    if(found)db.prepare('DELETE FROM blocks WHERE user_id=? AND blocked_id=?').run(uid,id);
    else db.prepare('INSERT INTO blocks (user_id,blocked_id) VALUES (?,?)').run(uid,id);
    return json(res,200,{blocked:!found});
  }
  if(path==='/api/media'&&method==='POST'){
    if(!withinLimit(req,uid+':media',8,3600000))return fail(res,429,'Limite de uploads atingido.');
    const b=await body(req,2*1024*1024);
    if(typeof b.data!=='string'||b.data.length>1400000||!['image/png','image/jpeg','image/webp'].includes(b.mime))return fail(res,400,'Imagem inválida ou maior que 1 MB.');
    const bytes=Buffer.from(b.data,'base64');
    const looksLike=(b.mime==='image/png'&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))||
       (b.mime==='image/jpeg'&&bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex')))||
       (b.mime==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');
    if(!looksLike||bytes.length>1024*1024)return fail(res,400,'Formato de imagem não suportado.');
    const id=randomUUID(),ext=b.mime==='image/png'?'.png':b.mime==='image/jpeg'?'.jpg':'.webp',filename=id+ext;
    writeFileSync(join(uploads,filename),bytes,{flag:'wx'});
    db.prepare('INSERT INTO media (id,user_id,filename,mime,created_at) VALUES (?,?,?,?,?)').run(id,uid,filename,b.mime,new Date().toISOString());
    return json(res,201,{id,url:'/uploads/'+filename});
  }
  const riotMatch=path.match(/^\/api\/riot\/([^/]+)\/([^/]+)$/);
  if(riotMatch&&method==='GET'){
    if(!process.env.RIOT_API_KEY)return fail(res,503,'Integração Riot não configurada.');
    if(!withinLimit(req,uid+':riot',10,60000))return fail(res,429,'Limite de consultas atingido.');
    const [gameName,tagLine]=riotMatch.slice(1).map(decodeURIComponent);
    if(gameName.length>24||tagLine.length>8||!gameName||!tagLine)return fail(res,400,'Riot ID inválido.');
    const upstream=await fetch('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/'+encodeURIComponent(gameName)+'/'+encodeURIComponent(tagLine),{headers:{'X-Riot-Token':process.env.RIOT_API_KEY},signal:AbortSignal.timeout(6000)});
    if(!upstream.ok)return fail(res,upstream.status===404?404:502,'Não foi possível consultar esse Riot ID.');
    const r=await upstream.json();return json(res,200,{gameName:r.gameName,tagLine:r.tagLine,puuid:r.puuid,verifiedOwnership:false});
  }
  return fail(res,404,'Rota desconhecida.');
}
export const server=http.createServer(async(req,res)=>{try{await handler(req,res);}catch(err){console.error('API request failed:',err.message);if(!res.headersSent)fail(res,err.status||500,err.status?err.message:'Erro interno.');else res.end();}});
if(process.env.NODE_ENV!=='test')server.listen(PORT,process.env.HOST||'127.0.0.1',()=>console.log('GameSocial API listening on '+PORT));
