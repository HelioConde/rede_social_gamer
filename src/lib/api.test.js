import { afterEach, describe, it, expect, vi } from 'vitest';
import { ApiError, request } from './api';
afterEach(()=>vi.unstubAllGlobals());
describe('cliente API',()=>{
 it('envia cookie e corpo JSON corretamente',async()=>{
  const fetchMock=vi.fn(async()=>({ok:true,json:async()=>({ok:true})}));
  vi.stubGlobal('fetch',fetchMock);
  expect(await request('/example',{method:'POST',body:{x:1}})).toEqual({ok:true});
  expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  expect(fetchMock.mock.calls[0][1].body).toBe('{"x":1}');
 });
 it('propaga erro HTTP legível',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:400,json:async()=>({error:'Dados inválidos'})})));
  await expect(request('/example')).rejects.toEqual(new ApiError('Dados inválidos',400));
 });
});