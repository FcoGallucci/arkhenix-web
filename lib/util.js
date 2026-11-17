// Utilidades compartidas por las funciones de Cloudflare Pages.

const enc = new TextEncoder();
const dec = new TextDecoder();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function b64urlFromBytes(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlEncode(str) {
  return b64urlFromBytes(enc.encode(str));
}

export function b64urlDecode(s) {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return dec.decode(arr);
}

export async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return b64urlFromBytes(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Comparación en tiempo constante: compara los HMAC de ambos valores.
export async function safeEqual(a, b, secret) {
  const [x, y] = await Promise.all([hmac(secret, String(a)), hmac(secret, String(b))]);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'local';
}

// Límite simple de intentos guardado en KV (ventana fija).
export async function rateLimit(env, bucket, ip, max, windowSeconds) {
  if (!env.CONTENT) return true;
  const key = `rl:${bucket}:${ip}`;
  const current = parseInt((await env.CONTENT.get(key)) || '0', 10);
  if (current >= max) return false;
  await env.CONTENT.put(key, String(current + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return true;
}

export function randomId(len = 12) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return b64urlFromBytes(bytes).slice(0, len);
}
