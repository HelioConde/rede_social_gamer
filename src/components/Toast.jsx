import { X } from 'lucide-react';
import { useApp } from '../state/AppProvider';
export function Toast(){ const { message,setMessage }=useApp(); return message?<div className="toast" role="status"><span>{message}</span><button className="icon-button" type="button" onClick={()=>setMessage('')} aria-label="Fechar aviso"><X size={18}/></button></div>:null; }