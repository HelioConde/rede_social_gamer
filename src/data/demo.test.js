import { describe, it, expect } from 'vitest';
import { players, initialPosts, communities } from './demo';
describe('dados de demonstração',()=>{
 it('tem jogadores com identificadores únicos',()=>{
  expect(new Set(players.map(x=>x.id)).size).toBe(players.length);
 });
 it('possui publicações com autores conhecidos',()=>{
  expect(initialPosts.length).toBeGreaterThan(0);
  for(const post of initialPosts)expect(players.some(p=>p.id===post.authorId)).toBe(true);
 });
 it('comunidades possuem IDs únicos',()=>{
  expect(new Set(communities.map(c=>c.id)).size).toBe(communities.length);
 });
});