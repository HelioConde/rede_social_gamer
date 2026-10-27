import { describe, expect, it } from 'vitest';
import { normalizeDemoMessages } from './chatStorage';

const valid={
  id:'dm-1',from:'p2',to:'demo',text:'Olá!',at:'2026-10-27T09:00:00.000Z',read:false
};
describe('dados locais do chat',()=>{
  it('mantém mensagens válidas com formato estável',()=>{
    expect(normalizeDemoMessages([valid])).toEqual([valid]);
    expect(normalizeDemoMessages([])).toEqual([]);
  });
  it('rejeita objetos perigosos, datas inválidas e IDs duplicados',()=>{
    const result=normalizeDemoMessages([
      null,{...valid,id:'invalido',at:'not-a-date'},
      {...valid,text:'a'.repeat(1001)},valid,{...valid,text:'repetida'},
      {...valid,id:'novo',text:'Outra mensagem',read:1}
    ]);
    expect(result).toEqual([valid,{...valid,id:'novo',text:'Outra mensagem',read:true}]);
  });
  it('não aceita conteúdo inesperado ou backups gigantes',()=>{
    expect(normalizeDemoMessages({messages:[]})).toBeNull();
    expect(normalizeDemoMessages(new Array(1000).fill(valid))).toBeNull();
  });
});
