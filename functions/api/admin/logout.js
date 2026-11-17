// POST /api/admin/logout — cerrar sesión.
import { clearCookie } from '../../../lib/auth.js';
import { json } from '../../../lib/util.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}
