import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useApp } from './AppProvider';
import { request } from '../lib/api';

const ChatContext = createContext(null);
const DEMO_KEY = 'gamesocial-chat-demo-v1';
const startingMessages = [
  { id:'dm-demo-1', from:'p2', to:'demo', text:'Oi, Alex! Vai jogar TFT hoje? 🎮', at:new Date(Date.now()-7200000).toISOString(), read:false },
  { id:'dm-demo-2', from:'demo', to:'p2', text:'Vou entrar mais tarde! Qual composição você recomenda?', at:new Date(Date.now()-6900000).toISOString(), read:true },
  { id:'dm-demo-3', from:'p2', to:'demo', text:'Tem uma composição muito boa com Invocadores. Depois te conto!', at:new Date(Date.now()-6600000).toISOString(), read:false },
  { id:'dm-demo-4', from:'p3', to:'demo', text:'Partiu Valorant no fim de semana?', at:new Date(Date.now()-96000000).toISOString(), read:true }
];
function readDemoMessages(){
  try {
    const value=JSON.parse(localStorage.getItem(DEMO_KEY));
    if(Array.isArray(value) && value.length<1000) return value.filter(m=>m && typeof m.text==='string' && typeof m.from==='string');
  } catch { /* corrupted local demo storage */ }
  return startingMessages;
}
function lastOf(items){ return items.length ? items[items.length-1] : null; }

export function ChatProvider({ children }){
  const {user,profile,mode,players,blocked} = useApp();
  const [expanded,setExpanded]=useState(false);
  const [activeId,setActiveId]=useState(null);
  const [demoMessages,setDemoMessages]=useState(readDemoMessages);
  const [serverSummaries,setServerSummaries]=useState([]);
  const [serverThreads,setServerThreads]=useState({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const mine=profile?.id;
  useEffect(()=>{ if(mode==='demo') {
    try { localStorage.setItem(DEMO_KEY,JSON.stringify(demoMessages.slice(-900))); }
    catch { /* private browsing / quota */ }
  } },[mode,demoMessages]);
  // Keep multiple tabs of the local demo consistent without storing draft text.
  useEffect(()=>{
    if(mode!=='demo')return undefined;
    const sync=e=>{
      if(e.key!==DEMO_KEY||!e.newValue)return;
      try{
        const parsed=JSON.parse(e.newValue);
        if(Array.isArray(parsed)&&parsed.length<1000)setDemoMessages(old=>JSON.stringify(old)===JSON.stringify(parsed)?old:parsed);
      }catch{ /* ignore malformed data from another tab */ }
    };
    window.addEventListener('storage',sync);
    return ()=>window.removeEventListener('storage',sync);
  },[mode]);
  useEffect(()=>{ if(!user){setExpanded(false);setActiveId(null);setError('');} },[user]);
  const refreshInbox=useCallback(async()=>{
    if(mode!=='server'||!user)return;
    const result=await request('/chats');
    setServerSummaries(Array.isArray(result.conversations)?result.conversations:[]);
  },[mode,user]);
  const loadThread=useCallback(async(peerId)=>{
    if(mode!=='server'||!user)return;
    const result=await request('/chats/'+encodeURIComponent(peerId)+'/messages');
    setServerThreads(old=>({...old,[peerId]:result.messages||[]}));
    if((result.messages||[]).some(m=>m.to===user.id && !m.read)) {
      await request('/chats/'+encodeURIComponent(peerId)+'/read',{method:'POST'});
      setServerSummaries(old=>old.map(row=>row.peer.id===peerId?{...row,unreadCount:0}:row));
    }
  },[mode,user]);
  useEffect(()=>{
    if(mode!=='server'||!user)return undefined;
    refreshInbox().catch(()=>setError('Não foi possível carregar as mensagens.'));
    const interval=window.setInterval(()=>{
      if(document.visibilityState==='hidden'||!navigator.onLine)return;
      refreshInbox().catch(()=>{});
      if(expanded&&activeId)loadThread(activeId).catch(()=>{});
    },12000);
    return ()=>window.clearInterval(interval);
  },[mode,user,expanded,activeId,refreshInbox,loadThread]);
  const contacts=useMemo(()=>{
    const base=players.filter(p=>p?.id&&p.id!==mine&&!blocked.includes(p.id));
    if(mode!=='server')return base;
    const seen=new Set(base.map(p=>p.id));
    return [...base,...serverSummaries.map(c=>c.peer).filter(p=>p&&!seen.has(p.id)&&!blocked.includes(p.id))];
  },[players,mine,blocked,mode,serverSummaries]);
  const conversations=useMemo(()=>{
    if(mode==='server')return serverSummaries
      .filter(s=>s.peer&&!blocked.includes(s.peer.id))
      .map(s=>({peer:s.peer,lastMessage:s.lastMessage,unreadCount:s.unreadCount||0}))
      .sort((a,b)=>String(b.lastMessage?.at||'').localeCompare(String(a.lastMessage?.at||'')));
    return contacts.map(peer=>{
      const messages=demoMessages.filter(m=>m.from===peer.id||m.to===peer.id).sort((a,b)=>a.at.localeCompare(b.at));
      return {peer,lastMessage:lastOf(messages),unreadCount:messages.filter(m=>m.from===peer.id && m.to===mine && !m.read).length};
    }).filter(row=>row.lastMessage).sort((a,b)=>b.lastMessage.at.localeCompare(a.lastMessage.at));
  },[mode,contacts,serverSummaries,demoMessages,mine,blocked]);
  const unread=conversations.reduce((sum,c)=>sum+c.unreadCount,0);
  const thread=useMemo(()=>{
    if(!activeId)return [];
    if(mode==='server')return serverThreads[activeId]||[];
    return demoMessages.filter(m=>(m.from===activeId&&m.to===mine)||(m.from===mine&&m.to===activeId))
      .sort((a,b)=>a.at.localeCompare(b.at));
  },[mode,activeId,serverThreads,demoMessages,mine]);
  const activePeer=contacts.find(p=>p.id===activeId)||conversations.find(c=>c.peer.id===activeId)?.peer||null;
  const openInbox=()=>{setActiveId(null);setExpanded(true);setError('');};
  const openChat=async(id)=>{
    if(!id||id===mine||!contacts.some(p=>p.id===id))return;
    setActiveId(id);setExpanded(true);setError('');
    if(mode==='demo'){
      setDemoMessages(old=>old.map(m=>m.from===id&&m.to===mine?{...m,read:true}:m));
    }else{
      setBusy(true);
      try{await loadThread(id);await refreshInbox();}
      catch(e){setError(e.message);}
      finally{setBusy(false);}
    }
  };
  const sendChat=async(text)=>{
    const content=String(text||'').trim();
    if(!activeId||!content||content.length>1000||busy)return false;
    setBusy(true);setError('');
    try{
      if(mode==='demo')setDemoMessages(old=>[...old,{id:crypto.randomUUID(),from:mine,to:activeId,text:content,at:new Date().toISOString(),read:false}]);
      else{
        await request('/chats/'+encodeURIComponent(activeId)+'/messages',{method:'POST',body:{text:content}});
        await loadThread(activeId);await refreshInbox();
      }
      return true;
    }catch(e){setError(e.message);return false;}
    finally{setBusy(false);}
  };
  const deleteMessage=async id=>{
    const message=thread.find(m=>m.id===id);
    if(!message||message.from!==mine||busy)return false;
    setError('');setBusy(true);
    try{
      if(mode==='demo'){
        setDemoMessages(old=>old.filter(m=>m.id!==id));
      }else{
        await request('/chats/'+encodeURIComponent(activeId)+'/messages/'+encodeURIComponent(id),{method:'DELETE'});
        setServerThreads(old=>({...old,[activeId]:(old[activeId]||[]).filter(m=>m.id!==id)}));
        await refreshInbox();
      }
      return true;
    }catch(e){setError(e.message);return false;}
    finally{setBusy(false);}
  };
  const resetDemo=()=>{
    if(mode!=='demo')return;
    setDemoMessages(startingMessages.map(message=>({...message})));
    setActiveId(null);
    setError('');
  };
  const close=()=>{setExpanded(false);setError('');};
  const value={expanded,activeId,activePeer,contacts,conversations,unread,thread,busy,error,setError,openInbox,openChat,sendChat,deleteMessage,resetDemo,close,mode,mine,refreshInbox};
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
export function useChat(){const value=useContext(ChatContext);if(!value)throw Error('ChatProvider ausente');return value;}
