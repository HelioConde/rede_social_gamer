import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, MessageCircle, MessagesSquare, RotateCcw, Search, SendHorizontal, Trash2, X } from 'lucide-react';
import { useChat } from '../state/ChatProvider';
import { Avatar } from './Avatar';

const timeLabel=iso=>{
  if(!iso)return '';
  const d=new Date(iso);
  return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(d);
};
const dayLabel=iso=>{
  const d=new Date(iso);
  if(Number.isNaN(d.getTime()))return '';
  const today=new Date(),yesterday=new Date();
  yesterday.setDate(today.getDate()-1);
  if(d.toDateString()===today.toDateString())return 'Hoje';
  if(d.toDateString()===yesterday.toDateString())return 'Ontem';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(d);
};

export function ChatDock(){
  const chat=useChat(),[search,setSearch]=useState(''),[filter,setFilter]=useState('all');
  const [drafts,setDrafts]=useState({}),[pendingDelete,setPendingDelete]=useState(null),[resetConfirm,setResetConfirm]=useState(false);
  const scrollRef=useRef(null),fieldRef=useRef(null),launcherRef=useRef(null),lastConversation=useRef(null),nearEnd=useRef(true);
  const opened=chat.expanded,active=chat.activePeer,activeId=chat.activeId;
  const draft=drafts[activeId]||'';
  useEffect(()=>{setPendingDelete(null);nearEnd.current=true;},[activeId]);
  useEffect(()=>{
    if(!opened||!activeId||!scrollRef.current)return;
    if(lastConversation.current!==activeId||nearEnd.current){
      scrollRef.current.scrollTop=scrollRef.current.scrollHeight;
      lastConversation.current=activeId;
    }
  },[opened,activeId,chat.thread.length]);
  useEffect(()=>{if(opened)fieldRef.current?.focus();},[opened,activeId]);
  useEffect(()=>{
    if(!opened)return undefined;
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();chat.close();launcherRef.current?.focus();}};
    document.addEventListener('keydown',onKey);
    document.body.classList.add('chat-open');
    return ()=>{document.removeEventListener('keydown',onKey);document.body.classList.remove('chat-open');};
  },[opened,chat.close]);
  const send=async e=>{
    e.preventDefault();
    if(!draft.trim()||chat.busy)return;
    const peerId=activeId;
    if(await chat.sendChat(draft)){
      setDrafts(old=>({...old,[peerId]:''}));
      nearEnd.current=true;
    }
  };
  const query=search.trim().toLocaleLowerCase('pt-BR');
  const candidates=chat.conversations
    .filter(c=>filter!=='unread'||c.unreadCount>0)
    .filter(c=>(c.peer.name+' '+c.peer.handle).toLocaleLowerCase('pt-BR').includes(query));
  const others=filter==='unread'?[]:chat.contacts.filter(p=>!chat.conversations.some(c=>c.peer.id===p.id))
    .filter(p=>(p.name+' '+p.handle).toLocaleLowerCase('pt-BR').includes(query));
  let lastDay='';
  return <div className="chat-dock">
    {!opened&&<button ref={launcherRef} type="button" className="chat-launcher" aria-label={'Abrir mensagens'+(chat.unread?' ('+chat.unread+' não lidas)':'')} onClick={chat.openInbox}>
      <MessageCircle size={24} aria-hidden="true"/><span>Mensagens</span>{chat.unread>0&&<b className="chat-launcher-count">{chat.unread>99?'99+':chat.unread}</b>}
    </button>}
    {opened&&<section className="chat-window" role="dialog" aria-label={active?'Conversa com '+active.name:'Mensagens'} aria-modal="false">
      <header className="chat-window-head">
        {active?<><button type="button" className="chat-icon" aria-label="Voltar para conversas" onClick={()=>{chat.openInbox();setPendingDelete(null);}}><ArrowLeft size={19}/></button>
          <Avatar person={active} size="sm"/><div className="chat-head-title"><strong>{active.name}</strong><small>{chat.mode==='demo'?'Conversa fictícia':active.online?'Ativo recentemente':'Mensagem privada'}</small></div></>
        :<><span className="chat-title-icon"><MessagesSquare size={20}/></span><div className="chat-head-title"><strong>Mensagens</strong><small>{chat.mode==='demo'?'Demonstração local':'Conversas privadas'}</small></div>{chat.unread>0&&<span className="chat-unread-header">{chat.unread} não lidas</span>}</>}
        <button type="button" className="chat-icon" aria-label="Fechar chat" onClick={()=>{chat.close();launcherRef.current?.focus();}}><X size={19}/></button>
      </header>
      {chat.error&&<p className="chat-error" role="alert">{chat.error}<button type="button" onClick={()=>chat.setError('')}>Fechar</button></p>}
      {active?<><div className="chat-messages" ref={scrollRef} aria-label={'Mensagens de '+active.name} role="log" aria-live="polite" aria-relevant="additions text"
        onScroll={e=>{const el=e.currentTarget;nearEnd.current=el.scrollHeight-el.scrollTop-el.clientHeight<90;}}>
          {chat.thread.length===0&&<div className="chat-empty-thread"><Avatar person={active} size="lg"/><strong>Diga oi para {active.name}!</strong><span>Comece uma conversa por mensagem.</span></div>}
          {chat.thread.map(message=>{
            const today=dayLabel(message.at),separator=today!==lastDay;
            lastDay=today;
            const mine=message.from===chat.mine;
            return <div className="chat-message-group" key={message.id}>
              {separator&&<div className="chat-day-separator"><span>{today}</span></div>}
              <div className={'chat-message '+(mine?'mine':'theirs')}>
                {!mine&&<Avatar person={active} size="sm"/>}
                <div className="chat-message-body"><div className="chat-bubble">{message.text}</div>
                  <time className="chat-time" dateTime={message.at}>{timeLabel(message.at)} {mine&&(message.read?<CheckCheck size={12} aria-label="Lida"/>:<Check size={12} aria-label="Enviada"/>)}</time>
                  {mine&&<div className="chat-message-tools">{pendingDelete===message.id?
                    <span className="chat-delete-confirm"><span>Excluir para todos?</span>
                      <button type="button" disabled={chat.busy} onClick={async()=>{if(await chat.deleteMessage(message.id))setPendingDelete(null);}}>Excluir</button>
                      <button type="button" onClick={()=>setPendingDelete(null)}>Cancelar</button>
                    </span>:
                    <button type="button" className="chat-delete-button" aria-label={'Excluir mensagem: '+message.text.slice(0,35)} onClick={()=>setPendingDelete(message.id)} title="Excluir esta mensagem"><Trash2 size={13}/> Excluir</button>
                  }</div>}
                </div>
              </div>
            </div>;
          })}
        </div>
        <form className="chat-compose" onSubmit={send}>
          {chat.mode==='demo'&&<p className="chat-demo-note">Simulação: outras pessoas não receberão suas mensagens.</p>}
          <label className="sr-only" htmlFor="chat-compose-text">Sua mensagem para {active.name}</label>
          <textarea id="chat-compose-text" ref={fieldRef} rows={1} maxLength={1000} required placeholder="Escreva uma mensagem…" value={draft}
            onChange={e=>setDrafts(old=>({...old,[activeId]:e.target.value}))}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/>
          <button className="chat-send" type="submit" disabled={chat.busy||!draft.trim()} aria-label="Enviar mensagem"><SendHorizontal size={19}/></button>
          {chat.busy&&<span className="chat-send-status" role="status">Processando…</span>}
        </form></>:
        <><label className="chat-search"><Search size={16}/><span className="sr-only">Buscar conversas</span>
          <input ref={fieldRef} type="search" placeholder="Buscar uma conversa…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <div className="chat-filters" aria-label="Filtrar conversas">
            <button type="button" aria-pressed={filter==='all'} className={filter==='all'?'selected':''} onClick={()=>setFilter('all')}>Todas</button>
            <button type="button" aria-pressed={filter==='unread'} className={filter==='unread'?'selected':''} onClick={()=>setFilter('unread')}>Não lidas {chat.unread>0&&<span>{chat.unread}</span>}</button>
          </div>
          <div className="chat-contacts">
            {candidates.map(c=><button type="button" className={'chat-contact '+(c.unreadCount?'has-unread':'')} key={c.peer.id} onClick={()=>chat.openChat(c.peer.id)}>
              <Avatar person={c.peer}/><span className="chat-contact-info"><strong>{c.peer.name}</strong><small>{c.lastMessage?.text||'Iniciar conversa'}</small></span>
              <span className="chat-contact-side"><small>{timeLabel(c.lastMessage?.at)}</small>{c.unreadCount>0&&<b>{c.unreadCount}</b>}</span>
            </button>)}
            {others.length>0&&<div className="chat-contacts-label">Iniciar conversa</div>}
            {others.map(p=><button type="button" className="chat-contact" key={p.id} onClick={()=>chat.openChat(p.id)}>
              <Avatar person={p}/><span className="chat-contact-info"><strong>{p.name}</strong><small>Enviar mensagem</small></span>
            </button>)}
            {!candidates.length&&!others.length&&<p className="chat-empty-list">{filter==='unread'?'Nenhuma conversa não lida.':'Nenhum jogador encontrado.'}</p>}
          </div>
          <footer className="chat-list-footer">
            {chat.mode==='demo'?<>{resetConfirm?
              <span className="chat-reset-confirm"><span>Restaurar conversas fictícias?</span><button type="button" onClick={()=>{chat.resetDemo();setFilter('all');setSearch('');setDrafts({});setResetConfirm(false);}}>Restaurar</button><button type="button" onClick={()=>setResetConfirm(false)}>Cancelar</button></span>:
              <button type="button" className="chat-reset" onClick={()=>setResetConfirm(true)}><RotateCcw size={13}/> Reiniciar demonstração</button>}
              <span>Mensagens salvas somente neste navegador</span></>:
              'Atualização automática a cada 12 segundos'}
          </footer>
        </>}
    </section>}
  </div>;
}
