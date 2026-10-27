import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const filename = process.env.DB_PATH || 'server/data/gamesocial.sqlite';
if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
export const db = new DatabaseSync(filename);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout=5000;');
db.exec(
  'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, handle TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, bio TEXT NOT NULL DEFAULT "", created_at TEXT NOT NULL, last_seen TEXT);' +
  'CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, game TEXT NOT NULL DEFAULT "", created_at TEXT NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS likes (post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(post_id,user_id));' +
  'CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, created_at TEXT NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS friends (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(user_id,friend_id));' +
  'CREATE TABLE IF NOT EXISTS joined (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, community_id TEXT NOT NULL, PRIMARY KEY(user_id,community_id));' +
  'CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);' +
  'CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, reason TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(reporter_id,post_id));' +
  'CREATE TABLE IF NOT EXISTS blocks (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(user_id,blocked_id));' +
  'CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, filename TEXT NOT NULL, mime TEXT NOT NULL, created_at TEXT NOT NULL);'
);
export const getUser = id => db.prepare('SELECT id,name,handle,bio,last_seen FROM users WHERE id=?').get(id);
export function publicUser(user) {
  if(!user) return null;
  return { id:user.id,name:user.name,handle:user.handle,bio:user.bio,avatar:user.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(),color:'#765af2',games:[],tag:'Comunidade',online:!!user.last_seen && Date.now()-new Date(user.last_seen).getTime()<5*60*1000 };
}
export function notify(id,text){
  db.prepare('INSERT INTO notifications (id,user_id,text,created_at) VALUES (?,?,?,?)').run(randomUUID(),id,text.slice(0,180),new Date().toISOString());
}
