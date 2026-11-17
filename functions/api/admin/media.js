// POST /api/admin/media — subir un video o una imagen a R2.
// DELETE /api/admin/media?src=/media/... — borrar un archivo subido.
import { requireAdmin } from '../../../lib/auth.js';
import { json, randomId } from '../../../lib/util.js';

const TYPES = {
  'video/mp4': { ext: 'mp4', max: 60 * 1024 * 1024 },
  'video/webm': { ext: 'webm', max: 60 * 1024 * 1024 },
  'image/png': { ext: 'png', max: 5 * 1024 * 1024 },
  'image/jpeg': { ext: 'jpg', max: 5 * 1024 * 1024 },
  'image/webp': { ext: 'webp', max: 5 * 1024 * 1024 },
};

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!env.MEDIA) return json({ error: 'Falta conectar el almacenamiento de archivos (R2).' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'No se recibió el archivo.' }, 400);
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'No se recibió el archivo.' }, 400);
  const type = TYPES[file.type];
  if (!type) return json({ error: 'Formato no admitido. Usa MP4 o WebM para videos y PNG, JPG o WebP para imágenes.' }, 415);
  if (file.size > type.max) {
    return json({ error: `El archivo supera el máximo de ${Math.round(type.max / 1024 / 1024)} MB.` }, 413);
  }

  const folder = file.type.startsWith('video/') ? 'videos' : 'imagenes';
  const key = `${folder}/${Date.now()}-${randomId(8)}.${type.ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ ok: true, src: `/media/${key}` });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!env.MEDIA) return json({ error: 'Falta conectar el almacenamiento de archivos (R2).' }, 503);
  const src = new URL(request.url).searchParams.get('src') || '';
  if (!/^\/media\/(videos|imagenes)\/[A-Za-z0-9._-]+$/.test(src)) return json({ error: 'Archivo no válido.' }, 400);
  await env.MEDIA.delete(src.slice('/media/'.length));
  return json({ ok: true });
}
