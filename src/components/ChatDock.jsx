import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, MessageCircle, MessagesSquare, Search, SendHorizontal, X } from 'lucide-react';
import { useChat } from '../state/ChatProvider';
import { Avatar } from './Avatar';

function timeLabel(iso){
  if(!iso)return '';
  const date=new Date(iso);
  return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(date);
}
export function ChatDock(){
  const chat=useChat(),[search,setSearch]=useState(''),[draft,setDraft]=useState('');
  const endRef=useRef(null),fieldRef=useRef(null),launcherRef=useRef(null);
  const opened=chat.expanded,active=chat.activePeer;
  const thread=chat.thread;
  const activeId=chat.activeId;
  useEffect(()=>{setDraft('');},[activeId]);
  useEffect(()=>{if(opened&&activeId)if(endRef.current?.parentElement){const area=endRef.current.parentElement;area.scrollTop=area.scrollHeight;}},[opened,activeId,thread.length]);
  useEffect(()=>{if(opened)fieldRef.current?.focus();},[opened,activeId]);
  useEffect(()=>{
    if(!opened)return undefined;
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();chat.close();launcherRef.current?.focus();}};
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[opened,chat.close]);
  const send=async e=>{
    e.preventDefault();
    if(!draft.trim()||chat.busy)return;
    if(await chat.sendChat(draft))setDraft('');
  };
  const candidates=chat.conversations.filter(c=>(c.peer.name+' '+c.peer.handle).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const others=chat.contacts.filter(p=>!chat.conversations.some(c=>c.peer.id===p.id))
    .filter(p=>(p.name+' '+p.handle).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <div className="chat-dock">
    {!opened&&<button ref={launcherRef} type="button" className="chat-launcher" aria-label={'Abrir mensagens'+(chat.unread?' ('+chat.unread+' não lidas)':'')} onClick={chat.openInbox}>
      <MessageCircle size={24} aria-hidden="true"/><span>Mensagens</span>{chat.unread>0&&<b className="chat-launcher-count">{chat.unread>99?'99+':chat.unread}</b>}
    </button>}
    {opened&&<section className="chat-window" role="dialog" aria-label={active?'Conversa com '+active.name:'Mensagens'} aria-modal="false">
      <header className="chat-window-head">
        {active?<><button type="button" className="chat-icon" aria-label="Voltar para conversas" onClick={chat.openInbox}><ArrowLeft size={19}/></button>
          <Avatar person={active} size="sm"/><div className="chat-head-title"><strong>{active.name}</strong><small>{chat.mode==='demo'?'Conversa fictícia':active.online?'Ativo recentemente':'Mensagem privada'}</small></div></>
        :<><span className="chat-title-icon"><MessagesSquare size={20}/></span><div className="chat-head-title"><strong>Mensagens</strong><small>{chat.mode==='demo'?'Demonstração local':'Conversas privadas'}</small></div>{chat.unread>0&&<span className="chat-unread-header">{chat.unread} não lidas</span>}</>}
        <button type="button" className="chat-icon" aria-label="Fechar chat" onClick={()=>{chat.close();launcherRef.current?.focus();}}><X size={19}/></button>
      </header>
      {chat.error&&<p className="chat-error" role="alert">{chat.error}<button type="button" onClick={()=>chat.setError('')}>Fechar</button></p>}
      {active?<><div className="chat-messages" aria-label={'Mensagens de '+active.name} role="log" aria-live="polite" aria-relevant="additions text">
          {thread.length===0&&<div className="chat-empty-thread"><Avatar person={active} size="lg"/><strong>Diga oi para {active.name}!</strong><span>Comece uma conversa por mensagem.</span></div>}
          {thread.map(message=><div className={'chat-message '+(message.from===chat.mine?'mine':'theirs')} key={message.id}>
            {message.from!==chat.mine&&<Avatar person={active} size="sm"/>}
            <div className="chat-message-body"><div className="chat-bubble">{message.text}</div><time className="chat-time" dateTime={message.at}>{timeLabel(message.at)} {message.from===chat.mine&&<CheckCheck size={12} aria-label="Enviada"/>}</time></div>
          </div>)}
          <div ref={endRef}/>
        </div>
        <form className="chat-compose" onSubmit={send}>
          {chat.mode==='demo'&&<p className="chat-demo-note">Simulação: outras pessoas não receberão suas mensagens.</p>}
          <label className="sr-only" htmlFor="chat-compose-text">Sua mensagem para {active.name}</label>
          <textarea id="chat-compose-text" ref={fieldRef} rows={1} maxLength={1000} required placeholder="Escreva uma mensagem…" value={draft}
            onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/>
          <button className="chat-send" type="submit" disabled={chat.busy||!draft.trim()} aria-label="Enviar mensagem"><SendHorizontal size={19}/></button>
        </form></>:
        <><label className="chat-search"><Search size={16}/><span className="sr-only">Buscar conversas</span>
          <input ref={fieldRef} type="search" placeholder="Buscar uma conversa…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <div className="chat-contacts">
            {candidates.map(c=><button type="button" className="chat-contact" key={c.peer.id} onClick={()=>chat.openChat(c.peer.id)}>
              <Avatar person={c.peer}/><span className="chat-contact-info"><strong>{c.peer.name}</strong><small>{c.lastMessage?.text||'Iniciar conversa'}</small></span>
              <span className="chat-contact-side"><small>{timeLabel(c.lastMessage?.at)}</small>{c.unreadCount>0&&<b>{c.unreadCount}</b>}</span>
            </button>)}
            {others.length>0&&<div className="chat-contacts-label">Iniciar conversa</div>}
            {others.map(p=><button type="button" className="chat-contact" key={p.id} onClick={()=>chat.openChat(p.id)}>
              <Avatar person={p}/><span className="chat-contact-info"><strong>{p.name}</strong><small>Enviar mensagem</small></span>
            </button>)}
            {!candidates.length&&!others.length&&<p className="chat-empty-list">Nenhum jogador encontrado.</p>}
          </div>
          <footer className="chat-list-footer">{chat.mode==='demo'?'Mensagens salvas apenas neste navegador':'Atualização automática a cada 12 segundos'}</footer>
        </>}
    </section>}
  </div>;
}
