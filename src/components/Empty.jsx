import { Compass } from 'lucide-react';
export function Empty({ title='Nada por aqui', description='Explore a comunidade para começar.', action }) {
  return <div className="empty"><Compass size={32} aria-hidden="true"/><h3>{title}</h3><p>{description}</p>{action}</div>;
}