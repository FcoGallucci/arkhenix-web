// POST /api/contact — formulario de contacto.
// Guarda cada mensaje en KV (visible en el panel) y lo envía por correo con Brevo.
import { deliver, EMAIL_RE } from '../../lib/inbox.js';
import { clientIp, json, rateLimit } from '../../lib/util.js';

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }

  // Trampa para robots y envíos demasiado rápidos: se aceptan en silencio y se descartan.
  if (data.website) return json({ ok: true });
  if (typeof data.elapsed === 'number' && data.elapsed < 3000) return json({ ok: true });

  const name = String(data.name || '').trim().slice(0, 120);
  const email = String(data.email || '').trim().slice(0, 200);
  const message = String(data.message || '').trim().slice(0, 5000);

  if (!name || !email || !message) return json({ error: 'Completa nombre, correo y mensaje.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'El correo no parece válido.' }, 400);
  if (data.consent !== true) return json({ error: 'Debes aceptar la política de privacidad.' }, 400);

  if (!(await rateLimit(env, 'contact', clientIp(request), 5, 3600))) {
    return json({ error: 'Has enviado varios mensajes seguidos. Intenta de nuevo en una hora.' }, 429);
  }

  const result = await deliver(env, {
    kind: 'mensaje',
    name, email, message,
    subject: `Nuevo mensaje desde arkhenix.com — ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\nFecha: ${new Date().toISOString()}\n\n${message}`,
  });

  if (!result.saved && !result.emailed) {
    return json({ error: 'El formulario aún no está configurado. Escríbenos directamente por correo.' }, 503);
  }
  return json({ ok: true });
}
