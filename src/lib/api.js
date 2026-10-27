// Same-origin /api works with Vite proxy in development and a reverse proxy in production.
// For a split deployment set VITE_API_URL to the HTTPS API origin.
const root = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}
export async function request(path, options = {}) {
  const {timeoutMs = 9000, ...init} = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(root + '/api' + path, {
      ...init,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      signal: options.signal || controller.signal,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data.error || 'Não foi possível concluir a solicitação.', response.status);
    return data;
  } finally { clearTimeout(timeout); }
}
export async function detectBackend() {
  if (import.meta.env.VITE_APP_MODE === 'demo') return false;
  try { const data = await request('/health', { timeoutMs: 1700 }); return data.ok === true; }
  catch { return false; }
}