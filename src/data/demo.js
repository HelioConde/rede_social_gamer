export const players = [
  { id: 'demo', name: 'Alex Nova', handle: 'alexnova', tag: 'FPS • RPG', avatar: 'AN', color: '#765af2', online: true, bio: 'Explorando mundos, conhecendo pessoas e colecionando conquistas.', games: ['League of Legends', 'Valorant', 'Minecraft'] },
  { id: 'p2', name: 'Luna Pixel', handle: 'lunapixel', tag: 'LoL • TFT', avatar: 'LP', color: '#e25ba5', online: true, bio: 'Main suporte e estrategista.', games: ['League of Legends', 'TFT'] },
  { id: 'p3', name: 'Kai Storm', handle: 'kaistorm', tag: 'FPS competitivo', avatar: 'KS', color: '#258f99', online: false, bio: 'Sempre procurando o próximo clutch.', games: ['Valorant', 'CS2'] },
  { id: 'p4', name: 'Nina Quest', handle: 'ninaquest', tag: 'Cozy games', avatar: 'NQ', color: '#e7a03f', online: true, bio: 'Uma aventura de cada vez.', games: ['Stardew Valley', 'Minecraft'] }
];
export const initialPosts = [
  { id: 'post1', authorId: 'p2', content: 'Quem topa uma partida de TFT hoje? Estou testando composições novas! ✨', game: 'TFT', createdAt: new Date(Date.now()-1000*60*38).toISOString(), likes: ['demo','p3'], comments: [{ id:'c1',authorId:'p4',text:'Eu topo! 🎮' }] },
  { id: 'post2', authorId: 'p3', content: 'Finalmente alcancei meu objetivo no competitivo! Qual foi sua maior conquista da semana?', game: 'Valorant', createdAt: new Date(Date.now()-1000*60*60*4).toISOString(), likes: ['p2'], comments: [] },
  { id: 'post3', authorId: 'p4', content: 'Descobri um cantinho incrível no meu mundo de Minecraft. Alguém mais gosta de construir bases aconchegantes?', game: 'Minecraft', createdAt: new Date(Date.now()-1000*60*60*26).toISOString(), likes:['demo'], comments: [] }
];
export const communities = [
  { id:'lol', name:'League of Legends', icon:'⚔️', label:'MOBA', members:'12,4 mil' },
  { id:'valorant', name:'Valorant', icon:'🎯', label:'FPS', members:'8,9 mil' },
  { id:'minecraft', name:'Minecraft', icon:'🧱', label:'Sandbox', members:'16,2 mil' },
  { id:'tft', name:'TFT', icon:'♟️', label:'Estratégia', members:'5,1 mil' },
  { id:'indie', name:'Jogos indie', icon:'🌱', label:'Comunidade', members:'3,4 mil' }
];
export const initialNotifications = [{ id:'n1', text:'Luna Pixel curtiu uma publicação.', read:false },{ id:'n2', text:'Bem-vindo à comunidade GameSocial!', read:false }];