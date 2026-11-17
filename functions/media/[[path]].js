// GET /media/... — sirve los videos e imágenes subidos desde el panel (R2).
// Admite peticiones por rangos para que los videos funcionen en Safari y iPhone.

export async function onRequestGet({ request, env, params }) {
  if (!env.MEDIA) return new Response('No encontrado', { status: 404 });
  const key = (Array.isArray(params.path) ? params.path : [params.path]).join('/');
  if (!/^(videos|imagenes)\/[A-Za-z0-9._-]+$/.test(key)) return new Response('No encontrado', { status: 404 });

  const hasRange = request.headers.has('Range');
  let object;
  try {
    object = await env.MEDIA.get(key, hasRange ? { range: request.headers } : {});
  } catch {
    return new Response('Rango no válido', { status: 416 });
  }
  if (!object) return new Response('No encontrado', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');

  if (hasRange && object.range) {
    const r = object.range;
    const offset = 'suffix' in r ? object.size - r.suffix : r.offset || 0;
    const length = 'suffix' in r ? r.suffix : r.length ?? object.size - offset;
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('Content-Length', String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { headers });
}
