import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectBackend, request } from '../lib/api';
import { communities, initialNotifications, initialPosts, players } from '../data/demo';

const AppContext = createContext(null);
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const storageKey = 'gamesocial-demo-v2';
const defaultData = { posts: initialPosts, friends:['p2','p3'], joined:['lol','tft'], notifications:initialNotifications, blocked:[], reports:[], profile:players[0] };
const stored = read(storageKey, defaultData);

export function AppProvider({ children }) {
  const [mode, setMode] = useState('loading');
  const [user, setUser] = useState(null);
  const [serverUsers, setServerUsers] = useState([]);
  const [data, setData] = useState(stored);
  const [theme, setTheme] = useState(() => localStorage.getItem('gamesocial-theme') || 'dark');
  const [message, setMessage] = useState('');
  const update = useCallback(fn => setData(old => fn(old)), []);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('gamesocial-theme',theme); },[theme]);
  useEffect(() => { if (mode === 'demo') localStorage.setItem(storageKey,JSON.stringify(data)); },[data,mode]);
  useEffect(() => {
    let active = true;
    (async () => {
      const connected = await detectBackend();
      if (!active) return;
      if (!connected) {
        setMode('demo');
        const remembered = localStorage.getItem('gamesocial-demo-session') === 'yes' || sessionStorage.getItem('gamesocial-demo-session') === 'yes';
        if (remembered) setUser(read(storageKey,defaultData).profile);
        return;
      }
      try {
        const res = await request('/session');
        if (active && res.user) setUser(res.user);
      } catch { /* a missing session is expected */ }
      if (active) setMode('server');
    })();
    return () => { active = false; };
  }, []);
  const refresh = useCallback(async () => {
    if (mode !== 'server') return;
    try {
      const [feed, friends, notifications, joined, profile, users] = await Promise.all([
        request('/posts'), request('/friends'), request('/notifications'), request('/communities/joined'), request('/session'), request('/users')
      ]);
      setServerUsers(users.users || []);
      setData(old=>({ ...old,posts:feed.posts,friends:friends.friends,notifications:notifications.notifications,joined:joined.joined,profile:profile.user || old.profile }));
    } catch (err) { setMessage(err.message); }
  },[mode]);
  useEffect(()=> { if (mode === 'server' && user) refresh(); },[mode,user?.id,refresh]);
  const enterDemo = (remember = false) => {
    if(mode !== 'demo') return;
    (remember ? localStorage : sessionStorage).setItem('gamesocial-demo-session','yes');
    setUser(data.profile);
    setMessage('Modo demonstração: os dados ficam apenas neste navegador.');
  };
  const login = async (email,password,remember) => {
    if (mode !== 'server') throw Error('Autenticação real indisponível. Use o modo demonstração.');
    const res = await request('/login',{method:'POST',body:{email,password,remember}});
    setUser(res.user);
    return res.user;
  };
  const register = async (payload) => {
    if (mode !== 'server') throw Error('Cadastro real indisponível. Explore a demonstração sem criar conta.');
    const res = await request('/register',{method:'POST',body:payload});
    setUser(res.user); return res.user;
  };
  const logout = async () => {
    if(mode==='server') await request('/logout',{method:'POST'}).catch(()=>{});
    localStorage.removeItem('gamesocial-demo-session');
    sessionStorage.removeItem('gamesocial-demo-session'); setUser(null);
  };
  const action = async (path, body, localChange, method='POST') => {
    if(mode === 'server') { await request(path,{method,body}); await refresh(); }
    else update(localChange);
  };
  const createPost = (content,game) => action('/posts',{content,game},old=>({...old,posts:[{id:crypto.randomUUID(),authorId:old.profile.id,content,game,createdAt:new Date().toISOString(),likes:[],comments:[]},...old.posts]}));
  const editPost = (id,content) => action('/posts/'+encodeURIComponent(id),{content},old=>({...old,posts:old.posts.map(p=>p.id===id?{...p,content}:p)}),'PATCH');
  const deletePost = id => action('/posts/'+encodeURIComponent(id),null,old=>({...old,posts:old.posts.filter(p=>p.id!==id)}),'DELETE');
  const toggleLike = id => action('/posts/'+encodeURIComponent(id)+'/like',{},old=>({...old,posts:old.posts.map(p=>p.id===id?{...p,likes:p.likes.includes(old.profile.id)?p.likes.filter(x=>x!==old.profile.id):[...p.likes,old.profile.id]}:p)}));
  const comment = (id,text) => action('/posts/'+encodeURIComponent(id)+'/comments',{text},old=>({...old,posts:old.posts.map(p=>p.id===id?{...p,comments:[...p.comments,{id:crypto.randomUUID(),authorId:old.profile.id,text}]}:p)}));
  const toggleFriend = id => action('/friends/'+encodeURIComponent(id),{},old=>({...old,friends:old.friends.includes(id)?old.friends.filter(x=>x!==id):[...old.friends,id]}));
  const toggleJoin = id => action('/communities/'+encodeURIComponent(id)+'/join',{},old=>({...old,joined:old.joined.includes(id)?old.joined.filter(x=>x!==id):[...old.joined,id]}));
  const markRead = () => action('/notifications/read',{},old=>({...old,notifications:old.notifications.map(n=>({...n,read:true}))}));
  const saveProfile = fields => action('/profile',fields,old=>({...old,profile:{...old.profile,...fields}}),'PATCH');
  const reportPost = (id,reason) => action('/reports',{postId:id,reason},old=>({...old,reports:[...old.reports,{postId:id,reason}]}));
  const blockUser = id => action('/blocks/'+encodeURIComponent(id),{},old=>({...old,blocked:old.blocked.includes(id)?old.blocked.filter(x=>x!==id):[...old.blocked,id]}));
  const profile = mode==='demo' ? data.profile : (data.profile?.id === user?.id ? data.profile : user || data.profile);
  const value = useMemo(()=>({ mode,user,profile,theme,setTheme,message,setMessage,posts:data.posts.filter(p=>!data.blocked.includes(p.authorId)),friends:data.friends,joined:data.joined,notifications:data.notifications,blocked:data.blocked,players:mode==='demo'?[{...players[0],...data.profile},...players.slice(1)]:[profile,...serverUsers].filter(Boolean),communities,enterDemo,login,register,logout,createPost,editPost,deletePost,toggleLike,comment,toggleFriend,toggleJoin,markRead,saveProfile,reportPost,blockUser,refresh }),[mode,user,profile,theme,message,data,serverUsers]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { const value = useContext(AppContext); if(!value) throw Error('AppProvider ausente'); return value; }