// GET /api/content — contenido público del sitio.
import { loadContent } from '../../lib/content.js';

export async function onRequestGet({ env }) {
  const content = await loadContent(env);
  return new Response(JSON.stringify(content), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
