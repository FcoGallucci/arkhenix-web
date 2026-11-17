// POST /api/contact — formulario de contacto.
// Guarda cada mensaje en KV (visible en el panel) y lo envía por correo con Brevo.
import { clientIp, json, randomId, rateLimit } from '../../lib/util.js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const RETENTION_DAYS = 180;

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }

  // Trampa para robots: un campo oculto que las personas no completan.
  if (data.website) return json({ ok: true });
  // Envíos demasiado rápidos (menos de 3 s desde que se cargó el formulario).
  if (typeof data.elapsed === 'number' && data.elapsed < 3000) return json({ ok: true });

  const name = String(data.name || '').trim().slice(0, 120);
  const email = String(data.email || '').trim().slice(0, 200);
  const message = String(data.message || '').trim().slice(0, 5000);

  if (!name || !email || !message) return json({ error: 'Completa nombre, correo y mensaje.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'El correo no parece válido.' }, 400);
  if (data.consent !== true) return json({ error: 'Debes aceptar la política de privacidad.' }, 400);

  const ip = clientIp(request);
  if (!(await rateLimit(env, 'contact', ip, 5, 3600))) {
    return json({ error: 'Has enviado varios mensajes seguidos. Intenta de nuevo en una hora.' }, 429);
  }

  const now = new Date();
  const record = { name, email, message, createdAt: now.toISOString(), emailed: false };

  // 1) Envío por correo (si Brevo está configurado).
  if (env.BREVO_API_KEY && env.CONTACT_FROM) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Web Arkhenix', email: env.CONTACT_FROM },
          to: [{ email: env.CONTACT_TO || 'contacto@arkhenix.com' }],
          replyTo: { email, name },
          subject: `Nuevo mensaje desde arkhenix.com — ${name}`,
          textContent: `Nombre: ${name}\nCorreo: ${email}\nFecha: ${now.toISOString()}\n\n${message}`,
        }),
      });
      record.emailed = res.ok;
      if (!res.ok) record.emailError = `Brevo ${res.status}`;
    } catch (e) {
      record.emailError = 'No se pudo conectar con el servicio de correo';
    }
  }

  // 2) Copia en el panel de administración.
  if (env.CONTENT) {
    const inverted = String(9999999999999 - now.getTime()).padStart(13, '0');
    await env.CONTENT.put(`msg:${inverted}:${randomId(6)}`, JSON.stringify(record), {
      expirationTtl: RETENTION_DAYS * 24 * 3600,
    });
  }

  if (!record.emailed && !env.CONTENT) {
    return json({ error: 'El formulario aún no está configurado. Escríbenos directamente por correo.' }, 503);
  }
  return json({ ok: true });
}
