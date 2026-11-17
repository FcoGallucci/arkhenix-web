// GET /api/admin/me — estado de la sesión y de la configuración.
import { adminConfigured, currentUser } from '../../../lib/auth.js';
import { json } from '../../../lib/util.js';

export async function onRequestGet({ request, env }) {
  const user = await currentUser(request, env);
  return json({
    configured: adminConfigured(env),
    user,
    storage: { content: Boolean(env.CONTENT), media: Boolean(env.MEDIA), email: Boolean(env.BREVO_API_KEY && env.CONTACT_FROM) },
  }, user ? 200 : 401);
}
