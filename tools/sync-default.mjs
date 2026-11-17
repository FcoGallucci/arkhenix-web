// Copia el contenido inicial (lib/default-content.js) al navegador (public/assets/default-content.js).
// Uso: node tools/sync-default.mjs
import { writeFileSync } from 'node:fs';
import { DEFAULT_CONTENT } from '../lib/default-content.js';

const out = new URL('../public/assets/default-content.js', import.meta.url);
writeFileSync(out, `// Generado por tools/sync-default.mjs. No editar a mano.\nwindow.AKX_DEFAULT = ${JSON.stringify(DEFAULT_CONTENT, null, 2)};\n`);
console.log('ok');
