// POST /api/admin/login — ingreso del usuario master.
import { adminConfigured, checkCredentials, sessionCookie } from '../../../lib/auth.js';
import { clientIp, json, rateLimit } from '../../../lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!adminConfigured(env)) return json({ error: 'El panel aún no está configurado.' }, 503);
  if (request.headers.get('X-Requested-With') !== 'arkhenix') return json({ error: 'Petición no permitida.' }, 403);

  const ip = clientIp(request);
  if (!(await rateLimit(env, 'login', ip, 8, 900))) {
    return json({ error: 'Demasiados intentos. Espera 15 minutos.' }, 429);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }
  const ok = await checkCredentials(env, String(data.user || ''), String(data.password || ''));
  if (!ok) return json({ error: 'Usuario o contraseña incorrectos.' }, 401);

  return json({ ok: true, user: env.ADMIN_USER }, 200, { 'Set-Cookie': await sessionCookie(env, env.ADMIN_USER) });
}
