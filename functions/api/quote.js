// POST /api/quote — solicitud de cotización desde /cotiza.
import { deliver, EMAIL_RE } from '../../lib/inbox.js';
import { PRODUCT_NAMES, QUOTE_FIELDS } from '../../lib/quote-fields.js';
import { clientIp, json, rateLimit } from '../../lib/util.js';

function clean(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 12);
  return String(v == null ? '' : v).trim().slice(0, 3000);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }
  if (data.website) return json({ ok: true });
  if (typeof data.elapsed === 'number' && data.elapsed < 5000) return json({ ok: true });

  const a = data.answers && typeof data.answers === 'object' ? data.answers : {};
  const answers = {};
  for (const [key] of QUOTE_FIELDS) answers[key] = clean(a[key]);
  answers.productos = (answers.productos || []).filter((p) => PRODUCT_NAMES[p]);

  if (!answers.productos.length) return json({ error: 'Elige al menos una solución.' }, 400);
  if (!answers.nombre || !answers.correo) return json({ error: 'Completa tu nombre y tu correo.' }, 400);
  if (!EMAIL_RE.test(answers.correo)) return json({ error: 'El correo no parece válido.' }, 400);
  if (data.consent !== true) return json({ error: 'Debes aceptar la política de privacidad.' }, 400);

  if (!(await rateLimit(env, 'quote', clientIp(request), 5, 3600))) {
    return json({ error: 'Has enviado varias solicitudes seguidas. Intenta de nuevo en una hora.' }, 429);
  }

  const details = [];
  for (const [key, label] of QUOTE_FIELDS) {
    let v = answers[key];
    if (key === 'productos') v = v.map((p) => PRODUCT_NAMES[p]);
    const text = Array.isArray(v) ? v.join(', ') : v;
    if (text) details.push({ label, value: text });
  }

  const org = answers.org_nombre ? ` (${answers.org_nombre})` : '';
  const products = answers.productos.map((p) => PRODUCT_NAMES[p].split(' (')[0]).join(', ');
  const result = await deliver(env, {
    kind: 'cotizacion',
    name: answers.nombre,
    email: answers.correo,
    message: answers.comentarios,
    details,
    subject: `Solicitud de cotización — ${products} — ${answers.nombre}${org}`,
    text: `Nueva solicitud de cotización desde arkhenix.com\n\n` +
      details.map((d) => `${d.label}: ${d.value}`).join('\n') +
      `\n\nFecha: ${new Date().toISOString()}`,
  });

  if (!result.saved && !result.emailed) {
    return json({ error: 'El formulario aún no está configurado. Escríbenos a contacto@arkhenix.com.' }, 503);
  }
  return json({ ok: true });
}
