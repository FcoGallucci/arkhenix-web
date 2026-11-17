// GET/PUT /api/admin/content — leer y guardar el contenido editable.
import { requireAdmin } from '../../../lib/auth.js';
import { loadContent, saveContent } from '../../../lib/content.js';
import { json } from '../../../lib/util.js';

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  return json(await loadContent(env));
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!env.CONTENT) return json({ error: 'Falta conectar el almacenamiento de contenido (KV).' }, 503);
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }
  const saved = await saveContent(env, data);
  return json({ ok: true, content: saved });
}
