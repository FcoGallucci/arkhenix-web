// Sesión del usuario master: cookie firmada con HMAC (sin base de datos).
import { b64urlDecode, b64urlEncode, hmac, json, safeEqual } from './util.js';

const COOKIE = 'akx_session';
const MAX_AGE = 60 * 60 * 12; // 12 horas

export function adminConfigured(env) {
  return Boolean(env.ADMIN_USER && env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);
}

export async function checkCredentials(env, user, password) {
  const okUser = await safeEqual(user, env.ADMIN_USER, env.SESSION_SECRET);
  const okPass = await safeEqual(password, env.ADMIN_PASSWORD, env.SESSION_SECRET);
  return okUser && okPass;
}

export async function sessionCookie(env, user) {
  const payload = b64urlEncode(JSON.stringify({ u: user, exp: Date.now() + MAX_AGE * 1000 }));
  const sig = await hmac(env.SESSION_SECRET, payload);
  return `${COOKIE}=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(request) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

export async function currentUser(request, env) {
  if (!adminConfigured(env)) return null;
  const token = readCookie(request);
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = await hmac(env.SESSION_SECRET, payload);
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload));
    if (!data.exp || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

// Devuelve { user } o una Response de error. Las peticiones que modifican
// datos deben traer la cabecera X-Requested-With (bloquea envíos desde otros sitios).
export async function requireAdmin(request, env) {
  if (!adminConfigured(env)) return { error: json({ error: 'El panel aún no está configurado.' }, 503) };
  const user = await currentUser(request, env);
  if (!user) return { error: json({ error: 'Sesión vencida. Vuelve a ingresar.' }, 401) };
  if (request.method !== 'GET' && request.headers.get('X-Requested-With') !== 'arkhenix') {
    return { error: json({ error: 'Petición no permitida.' }, 403) };
  }
  return { user };
}
