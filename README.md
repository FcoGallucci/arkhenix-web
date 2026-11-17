# arkhenix.com

Sitio web de Arkhenix, empresa matriz de Corte Atlas, Cerven, Verbato y el HIS (en desarrollo).

## Estructura

- `public/`: lo que se publica (página, panel, páginas legales, estilos y scripts).
  - `index.html`, `assets/app.js`, `assets/site.css`: la página principal.
  - `admin/`: panel del usuario master («Ingresar»).
  - `legal/`: aviso legal, privacidad, términos y cookies.
- `functions/`: código del servidor (contenido, contacto, acceso, archivos).
- `lib/`: utilidades compartidas y contenido inicial (`default-content.js`).
- `worker/index.js` y `wrangler.jsonc`: publicación en Cloudflare Workers.

Si se cambia `lib/default-content.js`, ejecutar `node tools/sync-default.mjs`.

## Publicación

Cloudflare Workers está conectado a este repositorio: cada cambio en la rama `main`
se publica solo (comando `npx wrangler deploy`, sin build).

## Activar el panel, los videos y el formulario (una sola vez)

1. **Almacenamiento de textos (KV).** En Cloudflare: *Storage & Databases → Workers KV →
   Create instance* con el nombre `arkhenix-content`. Copiar su **ID** y agregarlo en `wrangler.jsonc`:

   ```jsonc
   "kv_namespaces": [{ "binding": "CONTENT", "id": "<ID>" }]
   ```

2. **Almacenamiento de videos y logos (R2).** *Storage & Databases → R2 → Create bucket*
   con el nombre `arkhenix-media`. Luego en `wrangler.jsonc`:

   ```jsonc
   "r2_buckets": [{ "binding": "MEDIA", "bucket_name": "arkhenix-media" }]
   ```

3. **Claves (secretos).** En el Worker: *Settings → Variables and Secrets → Add*, tipo **Secret**:

   | Nombre | Valor |
   | --- | --- |
   | `ADMIN_USER` | usuario del master |
   | `ADMIN_PASSWORD` | contraseña larga y única |
   | `SESSION_SECRET` | texto aleatorio de 48 caracteres o más |
   | `BREVO_API_KEY` | clave de API de Brevo (para enviar el formulario por correo) |
   | `CONTACT_FROM` | remitente verificado en Brevo, por ejemplo `web@arkhenix.com` |

   `CONTACT_TO` (destino de los mensajes) ya está en `wrangler.jsonc`: `contacto@arkhenix.com`.

Sin estos pasos el sitio funciona igual, pero el panel no deja ingresar, no se pueden subir
videos y los mensajes del formulario no se guardan ni se envían.

## Pendientes

- Logos de Cerven, Verbato y HIS (se suben desde el panel).
- Datos de la empresa para las páginas legales (pestaña «Datos legales» del panel).
- Grabaciones reales de pantalla para reemplazar las animaciones (se suben desde el panel).
- Revisión de los textos legales por un abogado.
