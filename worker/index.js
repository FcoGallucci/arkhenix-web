// Punto de entrada para Cloudflare Workers.
// Sirve los archivos de /public y envía /api/* y /media/* a las mismas funciones
// que usaría Cloudflare Pages (carpeta functions/).
import * as content from '../functions/api/content.js';
import * as contact from '../functions/api/contact.js';
import * as quote from '../functions/api/quote.js';
import * as login from '../functions/api/admin/login.js';
import * as logout from '../functions/api/admin/logout.js';
import * as me from '../functions/api/admin/me.js';
import * as adminContent from '../functions/api/admin/content.js';
import * as adminMedia from '../functions/api/admin/media.js';
import * as messages from '../functions/api/admin/messages.js';
import * as media from '../functions/media/[[path]].js';

const ROUTES = {
  '/api/content': content,
  '/api/contact': contact,
  '/api/quote': quote,
  '/api/admin/login': login,
  '/api/admin/logout': logout,
  '/api/admin/me': me,
  '/api/admin/content': adminContent,
  '/api/admin/media': adminMedia,
  '/api/admin/messages': messages,
};

function handlerFor(mod, method) {
  const name = 'onRequest' + method.charAt(0) + method.slice(1).toLowerCase();
  return mod[name] || (method === 'HEAD' ? mod.onRequestGet : null);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (url.pathname.startsWith('/media/')) {
      if (method !== 'GET' && method !== 'HEAD') return new Response('Método no permitido', { status: 405 });
      return media.onRequestGet({ request, env, ctx, params: { path: url.pathname.slice('/media/'.length).split('/') } });
    }

    const mod = ROUTES[url.pathname];
    if (mod) {
      const handler = handlerFor(mod, method);
      if (!handler) return new Response('Método no permitido', { status: 405 });
      try {
        return await handler({ request, env, ctx, params: {} });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Error interno.' }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
