import { before,after,test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { server } from '../index.js';
let base='';
before(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise((ok,fail)=>server.close(err=>err?fail(err):ok()));});
async function call(path,method='GET',body,cookie){
 const response=await fetch(base+'/api'+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0],data:await response.json()};
}
test('healthcheck',async()=>{const r=await call('/health');assert.equal(r.status,200);assert.equal(r.data.ok,true);});
test('rotas privadas exigem sessão',async()=>{const r=await call('/posts');assert.equal(r.status,401);});
test('cadastro, sessão, postagem, interações e logout',async()=>{
 const create=await call('/register','POST',{name:'Pessoa QA',email:'qa_'+randomUUID()+'@example.com',password:'senha-forte-123'});
 assert.equal(create.status,201);assert.ok(create.cookie);
 const s=await call('/session','GET',null,create.cookie);assert.equal(s.data.user.name,'Pessoa QA');
 const post=await call('/posts','POST',{content:'Meu primeiro post',game:'TFT'},create.cookie);assert.equal(post.status,201);
 const list=await call('/posts','GET',null,create.cookie);assert.equal(list.data.posts.length,1);
 const like=await call('/posts/'+post.data.id+'/like','POST',{},create.cookie);assert.equal(like.data.liked,true);
 const comment=await call('/posts/'+post.data.id+'/comments','POST',{text:'Boas partidas!'},create.cookie);assert.equal(comment.status,201);
 const logout=await call('/logout','POST',{},create.cookie);assert.equal(logout.status,200);
 const blocked=await call('/posts','GET',null,create.cookie);assert.equal(blocked.status,401);
});
test('senha inválida é rejeitada',async()=>{
 const invalid=await call('/register','POST',{name:'X',email:'bad',password:'1'});assert.equal(invalid.status,400);
 const login=await call('/login','POST',{email:'unknown@example.com',password:'fake12345'});assert.equal(login.status,401);
});