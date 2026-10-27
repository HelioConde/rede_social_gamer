import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../state/AppProvider';

export function Toast() {
  const { message, setMessage } = useApp();
  // Only exceptional/action feedback uses this floating notice.
  // Never leave an overlay covering the user's content indefinitely.
  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [message, setMessage]);
  return message ? (
    <div className="toast" role="status">
      <span>{message}</span>
      <button className="icon-button" type="button" onClick={() => setMessage('')} aria-label="Fechar aviso">
        <X size={18}/>
      </button>
    </div>
  ) : null;
}
