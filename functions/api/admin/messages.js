// GET /api/admin/messages — mensajes recibidos por el formulario (los más recientes primero).
// DELETE /api/admin/messages?key=msg:... — borrar un mensaje.
import { requireAdmin } from '../../../lib/auth.js';
import { json } from '../../../lib/util.js';

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!env.CONTENT) return json({ messages: [] });
  const list = await env.CONTENT.list({ prefix: 'msg:', limit: 100 });
  const messages = [];
  for (const k of list.keys) {
    const value = await env.CONTENT.get(k.name, 'json');
    if (value) messages.push({ key: k.name, ...value });
  }
  return json({ messages });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^msg:\d{13}:[A-Za-z0-9_-]+$/.test(key)) return json({ error: 'Mensaje no válido.' }, 400);
  await env.CONTENT.delete(key);
  return json({ ok: true });
}
