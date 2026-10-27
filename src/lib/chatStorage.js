/**
 * Normaliza backups de mensagens da demonstração local.
 * Não converte dados em HTML nem aceita estruturas imensas ou malformadas.
 */
export function normalizeDemoMessages(input) {
  if (!Array.isArray(input) || input.length >= 1000) return null;
  const seen = new Set();
  const result = [];
  for (const m of input) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) continue;
    if (typeof m.id !== 'string' || m.id.length < 1 || m.id.length > 120 || seen.has(m.id)) continue;
    if (typeof m.from !== 'string' || !m.from || m.from.length > 120) continue;
    if (typeof m.to !== 'string' || !m.to || m.to.length > 120) continue;
    if (typeof m.text !== 'string' || !m.text.trim() || m.text.length > 1000) continue;
    if (typeof m.at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(m.at) ||
        !Number.isFinite(Date.parse(m.at))) continue;
    seen.add(m.id);
    result.push({ id:m.id, from:m.from, to:m.to, text:m.text, at:m.at, read:Boolean(m.read) });
  }
  return result;
}
