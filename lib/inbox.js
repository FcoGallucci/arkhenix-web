// Guarda una solicitud (mensaje o cotización) en el panel y la envía por correo con Brevo.
import { randomId } from './util.js';

const RETENTION_DAYS = 180;

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export async function deliver(env, { kind, name, email, subject, text, message, details }) {
  const now = new Date();
  const record = {
    kind: kind || 'mensaje',
    name, email,
    message: message || '',
    details: details || [],
    createdAt: now.toISOString(),
    emailed: false,
  };

  if (env.BREVO_API_KEY && env.CONTACT_FROM) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Web Arkhenix', email: env.CONTACT_FROM },
          to: [{ email: env.CONTACT_TO || 'contacto@arkhenix.com' }],
          replyTo: { email, name },
          subject,
          textContent: text,
        }),
      });
      record.emailed = res.ok;
      if (!res.ok) record.emailError = `Brevo ${res.status}`;
    } catch {
      record.emailError = 'No se pudo conectar con el servicio de correo';
    }
  }

  if (env.CONTENT) {
    const inverted = String(9999999999999 - now.getTime()).padStart(13, '0');
    await env.CONTENT.put(`msg:${inverted}:${randomId(6)}`, JSON.stringify(record), {
      expirationTtl: RETENTION_DAYS * 24 * 3600,
    });
  }

  return { saved: Boolean(env.CONTENT), emailed: record.emailed };
}
