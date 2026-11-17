// Lectura, validación y guardado del contenido editable.
import { DEFAULT_CONTENT } from './default-content.js';

export const CONTENT_KEY = 'content';

const str = (v, max, fallback = '') => (typeof v === 'string' ? v.trim().slice(0, max) : fallback);

function safeUrl(v, { allowEmpty = true } = {}) {
  const s = str(v, 500);
  if (!s) return allowEmpty ? '' : null;
  if (s.startsWith('/media/') || s.startsWith('/assets/')) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

function cleanBrand(b, i) {
  const id = str(b && b.id, 32).toLowerCase().replace(/[^a-z0-9-]/g, '') || `marca-${i + 1}`;
  const videos = Array.isArray(b && b.videos) ? b.videos : [];
  return {
    id,
    name: str(b.name, 60) || 'Marca',
    tag: str(b.tag, 40),
    color: /^#[0-9a-fA-F]{6}$/.test(str(b.color || '')) ? b.color.toUpperCase() : '',
    description: str(b.description, 300),
    url: safeUrl(b.url),
    status: b.status === 'pronto' ? 'pronto' : 'activa',
    logo: safeUrl(b.logo),
    videos: videos
      .map((v) => ({ src: safeUrl(v && v.src), label: str(v && v.label, 40) }))
      .filter((v) => v.src)
      .slice(0, 6),
  };
}

// Devuelve un objeto de contenido completo y seguro a partir de cualquier entrada.
export function sanitizeContent(input) {
  const d = DEFAULT_CONTENT;
  const c = input && typeof input === 'object' ? input : {};
  const hero = c.hero || {};
  const bs = c.brandsSection || {};
  const about = c.about || {};
  const contact = c.contact || {};
  const footer = c.footer || {};
  const social = footer.social || {};
  const legal = c.legal || {};
  const brands = Array.isArray(c.brands) && c.brands.length ? c.brands : d.brands;
  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs : d.about.paragraphs;
  const seen = new Set();

  return {
    version: 1,
    hero: {
      eyebrow: str(hero.eyebrow, 80, d.hero.eyebrow),
      title: str(hero.title, 120, d.hero.title) || d.hero.title,
      text: str(hero.text, 400, d.hero.text),
      cta: str(hero.cta, 40, d.hero.cta) || d.hero.cta,
    },
    brandsSection: {
      title: str(bs.title, 60, d.brandsSection.title) || d.brandsSection.title,
      subtitle: str(bs.subtitle, 80, d.brandsSection.subtitle),
    },
    lema: str(c.lema, 90, d.lema),
    brands: brands.slice(0, 12).map(cleanBrand).filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    }),
    about: {
      title: str(about.title, 80, d.about.title) || d.about.title,
      paragraphs: paragraphs.map((p) => str(p, 1500)).filter(Boolean).slice(0, 8),
    },
    contact: {
      title: str(contact.title, 80, d.contact.title) || d.contact.title,
      text: str(contact.text, 400, d.contact.text),
      email: str(contact.email, 120, d.contact.email),
    },
    footer: {
      description: str(footer.description, 500, d.footer.description),
      social: {
        linkedin: safeUrl(social.linkedin),
        instagram: safeUrl(social.instagram),
        youtube: safeUrl(social.youtube),
        x: safeUrl(social.x),
      },
    },
    legal: {
      company: str(legal.company, 160, d.legal.company),
      taxId: str(legal.taxId, 80, d.legal.taxId),
      address: str(legal.address, 300, d.legal.address),
      country: str(legal.country, 80, d.legal.country),
      email: str(legal.email, 120, d.legal.email),
      updated: str(legal.updated, 60, d.legal.updated),
    },
  };
}

export async function loadContent(env) {
  if (!env.CONTENT) return sanitizeContent(DEFAULT_CONTENT);
  const raw = await env.CONTENT.get(CONTENT_KEY, 'json');
  return sanitizeContent(raw || DEFAULT_CONTENT);
}

export async function saveContent(env, content) {
  const clean = sanitizeContent(content);
  clean.updatedAt = new Date().toISOString();
  await env.CONTENT.put(CONTENT_KEY, JSON.stringify(clean));
  return clean;
}
