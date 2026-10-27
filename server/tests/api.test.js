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

let sharedChatAccounts;
test('mensagens privadas: envio, leitura, isolamento e bloqueio',async()=>{
 const register=async(name)=>{
  const r=await call('/register','POST',{name,email:'chat_'+randomUUID()+'@example.com',password:'senha-forte-123'});
  assert.equal(r.status,201);
  return {id:r.data.user.id,cookie:r.cookie};
 };
 const alex=await register('Teste Alex'),bia=await register('Teste Bia'),intruso=await register('Teste Intruso');
 sharedChatAccounts={a:alex,b:intruso,c:bia};
 const denied=await call('/chats','GET');assert.equal(denied.status,401);
 const missing=await call('/chats/'+alex.id+'/messages','POST',{text:'Oi!'},alex.cookie);
 assert.equal(missing.status,404);
 const empty=await call('/chats/'+bia.id+'/messages','POST',{text:'   '},alex.cookie);
 assert.equal(empty.status,400);
 const sent=await call('/chats/'+bia.id+'/messages','POST',{text:'Vamos jogar hoje?'},alex.cookie);
 assert.equal(sent.status,201);
 assert.equal(sent.data.message.from,alex.id);
 const unread=await call('/chats','GET',null,bia.cookie);
 assert.equal(unread.status,200);
 assert.equal(unread.data.conversations[0].peer.id,alex.id);
 assert.equal(unread.data.conversations[0].unreadCount,1);
 const thread=await call('/chats/'+alex.id+'/messages','GET',null,bia.cookie);
 assert.equal(thread.data.messages.length,1);
 assert.equal(thread.data.messages[0].text,'Vamos jogar hoje?');
 const privateThread=await call('/chats/'+alex.id+'/messages','GET',null,intruso.cookie);
 assert.equal(privateThread.data.messages.length,0);
 const marked=await call('/chats/'+alex.id+'/read','POST',{},bia.cookie);assert.equal(marked.status,200);
 const readInbox=await call('/chats','GET',null,bia.cookie);assert.equal(readInbox.data.conversations[0].unreadCount,0);
 const blocked=await call('/blocks/'+alex.id,'POST',{},bia.cookie);assert.equal(blocked.status,200);
 const noSend=await call('/chats/'+bia.id+'/messages','POST',{text:'Não deve chegar'},alex.cookie);
 assert.equal(noSend.status,403);
 const noInbox=await call('/chats','GET',null,bia.cookie);
 assert.equal(noInbox.data.conversations.length,0);
});

test('somente o remetente pode excluir uma mensagem privada',async()=>{
 const {a,b,c}=sharedChatAccounts;
 const send=await call('/chats/'+b.id+'/messages','POST',{text:'mensagem a ser apagada'},a.cookie);
 assert.equal(send.status,201);
 const id=send.data.message.id;
 const denied=await call('/chats/'+a.id+'/messages/'+id,'DELETE',null,b.cookie);
 assert.equal(denied.status,404);
 const unrelated=await call('/chats/'+a.id+'/messages/'+id,'DELETE',null,c.cookie);
 assert.equal(unrelated.status,404);
 const deleted=await call('/chats/'+b.id+'/messages/'+id,'DELETE',null,a.cookie);
 assert.equal(deleted.status,200);
 const after=await call('/chats/'+a.id+'/messages','GET',null,b.cookie);
 assert.deepEqual(after.data.messages,[]);
 const repeated=await call('/chats/'+b.id+'/messages/'+id,'DELETE',null,a.cookie);
 assert.equal(repeated.status,404);
});
