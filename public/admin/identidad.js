// Identidad de Arkhenix: guía y archivos descargables (logotipo, ícono, colores, tipografía, marcas).
// Los logotipos se generan en el navegador con la tipografía oficial (IBM Plex Sans Bold).
(function () {
  'use strict';

  var COLORS = [
    { group: 'Arkhenix', name: 'Tinta', hex: '#0E1116', use: 'Textos, fondos oscuros, botones principales.' },
    { group: 'Arkhenix', name: 'Papel', hex: '#F4F4F1', use: 'Fondo general y cuadrícula.' },
    { group: 'Arkhenix', name: 'Cobalto', hex: '#2F5BEA', use: 'Acento: el punto del logotipo, enlaces y botones de acción.' },
    { group: 'Arkhenix', name: 'Cobalto claro', hex: '#8EA9FF', use: 'Acento sobre fondos oscuros.' },
    { group: 'Arkhenix', name: 'Grafito', hex: '#3B3F45', use: 'Texto de párrafos.' },
    { group: 'Arkhenix', name: 'Gris', hex: '#555A61', use: 'Etiquetas y textos secundarios.' },
    { group: 'Arkhenix', name: 'Línea', hex: '#D9D9D3', use: 'Bordes y divisiones.' },
    { group: 'Arkhenix', name: 'Blanco', hex: '#FFFFFF', use: 'Tarjetas y superficies.' },
    { group: 'Marcas', name: 'Cerven', hex: '#0B84E3', use: 'Color de Cerven en la órbita y las tarjetas.' },
    { group: 'Marcas', name: 'Corte', hex: '#68D3A2', use: 'Color de Corte Atlas.' },
    { group: 'Marcas', name: 'Verbato', hex: '#10B77F', use: 'Color de Verbato.' },
  ];

  var LOGOS = [
    { id: 'claro', name: 'Principal · sobre fondo claro', fg: '#0E1116', dot: '#2F5BEA', preview: '#F4F4F1' },
    { id: 'oscuro', name: 'Principal · sobre fondo oscuro', fg: '#FFFFFF', dot: '#8EA9FF', preview: '#0E1116' },
    { id: 'negro', name: 'Monocromo negro', fg: '#0E1116', dot: '#0E1116', preview: '#FFFFFF' },
    { id: 'blanco', name: 'Monocromo blanco', fg: '#FFFFFF', dot: '#FFFFFF', preview: '#2F5BEA' },
  ];

  var STATIC_FILES = [
    ['marcas/cerven-logo.png', '/assets/marca/cerven-logo.png'],
    ['marcas/cerven-icono.png', '/assets/logos/cerven.png'],
    ['marcas/corte-logo.png', '/assets/marca/corte-logo.png'],
    ['marcas/corte-icono.png', '/assets/logos/corte.png'],
    ['marcas/verbato-logo.png', '/assets/marca/verbato-logo.png'],
    ['marcas/verbato-icono.png', '/assets/logos/verbato.png'],
    ['graficos/orbita.svg', '/assets/marca/orbita.svg'],
    ['graficos/cuadricula.svg', '/assets/marca/cuadricula.svg'],
  ];

  var FONT = '"IBM Plex Sans", sans-serif';
  var TRACK = -0.03; // espaciado entre letras del logotipo (em)
  var fontDataCache = null;

  // ---------- Utilidades ----------
  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function download(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function fontsReady() {
    return Promise.all([
      document.fonts.load('700 100px "IBM Plex Sans"', 'arkhenix.'),
      document.fonts.load('500 20px "IBM Plex Mono"'),
    ]).then(function () { return document.fonts.check('700 100px "IBM Plex Sans"'); });
  }
  function canvasToBlob(c) {
    return new Promise(function (res) { c.toBlob(res, 'image/png'); });
  }

  // Mide el logotipo con la tipografía oficial.
  function measure(size) {
    var c = document.createElement('canvas').getContext('2d');
    c.font = '700 ' + size + 'px ' + FONT;
    if ('letterSpacing' in c) c.letterSpacing = (TRACK * size) + 'px';
    var word = c.measureText('arkhenix');
    var dot = c.measureText('.');
    return {
      word: word.width, dot: dot.width,
      ascent: word.actualBoundingBoxAscent, descent: Math.max(word.actualBoundingBoxDescent, dot.actualBoundingBoxDescent),
      tracked: 'letterSpacing' in c,
    };
  }

  // ---------- Logotipo en PNG ----------
  function logoPng(v, opts) {
    var size = opts.size || 400;
    var m = measure(size);
    var pad = Math.round(size * 0.35);
    var w = Math.ceil(m.word + m.dot + pad * 2);
    var h = Math.ceil(m.ascent + m.descent + pad * 2);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    if (opts.bg) { x.fillStyle = opts.bg; x.fillRect(0, 0, w, h); }
    x.font = '700 ' + size + 'px ' + FONT;
    if ('letterSpacing' in x) x.letterSpacing = (TRACK * size) + 'px';
    x.textBaseline = 'alphabetic';
    x.fillStyle = v.fg;
    x.fillText('arkhenix', pad, pad + m.ascent);
    x.fillStyle = v.dot;
    x.fillText('.', pad + m.word, pad + m.ascent);
    return canvasToBlob(c);
  }

  // ---------- Ícono «a.» ----------
  function iconCanvas(dark, px) {
    var c = document.createElement('canvas');
    c.width = px; c.height = px;
    var x = c.getContext('2d');
    var k = px / 64;
    x.fillStyle = dark ? '#0E1116' : '#F4F4F1';
    x.fillRect(0, 0, px, px);
    x.font = '700 ' + (40 * k) + 'px ' + FONT;
    x.textBaseline = 'alphabetic';
    x.fillStyle = dark ? '#FFFFFF' : '#0E1116';
    x.fillText('a', 12 * k, 46 * k);
    x.fillStyle = dark ? '#8EA9FF' : '#2F5BEA';
    x.fillRect(44 * k, 38 * k, 8 * k, 8 * k);
    return c;
  }

  // ---------- SVG con la tipografía incrustada ----------
  function fontData() {
    if (fontDataCache) return Promise.resolve(fontDataCache);
    return fetch('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@700&text=' + encodeURIComponent('arkhenix.a'))
      .then(function (r) { return r.text(); })
      .then(function (css) {
        var m = /url\((https:[^)]+)\)/.exec(css);
        if (!m) throw new Error('sin fuente');
        return fetch(m[1]).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var bytes = new Uint8Array(buf);
          var bin = '';
          for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          var fmt = /format\('([^']+)'\)/.exec(css);
          fontDataCache = { b64: btoa(bin), format: fmt ? fmt[1] : 'woff2' };
          return fontDataCache;
        });
      });
  }
  function fontFace(fd) {
    return '<style>@font-face{font-family:"Arkhenix Plex";font-weight:700;src:url(data:font/' + fd.format +
      ';base64,' + fd.b64 + ') format("' + fd.format + '")}</style>';
  }
  function logoSvg(v) {
    var size = 200;
    var m = measure(size);
    var pad = 70;
    var w = Math.ceil(m.word + m.dot + pad * 2);
    var h = Math.ceil(m.ascent + m.descent + pad * 2);
    return fontData().then(function (fd) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
        '<title>arkhenix.</title>' + fontFace(fd) +
        '<text x="' + pad + '" y="' + (pad + m.ascent).toFixed(1) + '" font-family="\'Arkhenix Plex\', \'IBM Plex Sans\', sans-serif" font-weight="700" font-size="' + size + '" letter-spacing="' + (TRACK * size) + '" fill="' + v.fg + '">arkhenix<tspan fill="' + v.dot + '">.</tspan></text></svg>';
      return new Blob([svg], { type: 'image/svg+xml' });
    });
  }
  function iconSvg(dark) {
    return fontData().then(function (fd) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512"><title>arkhenix · ícono</title>' + fontFace(fd) +
        '<rect width="64" height="64" fill="' + (dark ? '#0E1116' : '#F4F4F1') + '"/>' +
        '<text x="12" y="46" font-family="\'Arkhenix Plex\', \'IBM Plex Sans\', sans-serif" font-weight="700" font-size="40" fill="' + (dark ? '#FFFFFF' : '#0E1116') + '">a</text>' +
        '<rect x="44" y="38" width="8" height="8" fill="' + (dark ? '#8EA9FF' : '#2F5BEA') + '"/></svg>';
      return new Blob([svg], { type: 'image/svg+xml' });
    });
  }

  // ---------- Colores ----------
  function colorsCss() {
    var lines = COLORS.map(function (c) {
      return '  --akx-' + c.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-') + ': ' + c.hex + '; /* ' + c.use + ' */';
    });
    return ':root {\n' + lines.join('\n') + '\n}\n';
  }
  function colorsJson() {
    return JSON.stringify(COLORS.map(function (c) { return { nombre: c.name, grupo: c.group, hex: c.hex, rgb: rgb(c.hex), uso: c.use }; }), null, 2);
  }
  function readme() {
    return [
      'ARKHENIX · IDENTIDAD',
      '====================',
      '',
      'Lema: ORIGEN TECNOLÓGICO · SOLUCIONES DE SOFTWARE',
      'Frase: Donde empieza la tecnología.',
      '',
      'LOGOTIPO',
      '- Palabra «arkhenix» en minúsculas, IBM Plex Sans Bold, espaciado -3 %, seguida de un punto.',
      '- El punto es siempre cobalto (#2F5BEA) o cobalto claro (#8EA9FF) sobre fondos oscuros.',
      '- Área de protección: deja libre alrededor un espacio igual a la altura de la letra «a».',
      '- Tamaño mínimo: 80 px de ancho en pantalla, 20 mm impreso.',
      '- No deformar, rotar, contornear, agregar sombras ni cambiar la tipografía o los colores.',
      '',
      'TIPOGRAFÍA (licencia libre SIL Open Font License)',
      '- IBM Plex Sans: títulos y textos (400, 500, 600, 700). https://fonts.google.com/specimen/IBM+Plex+Sans',
      '- IBM Plex Mono: etiquetas y datos técnicos (400, 500). https://fonts.google.com/specimen/IBM+Plex+Mono',
      '- Párrafos siempre justificados, sin cortar palabras con guion.',
      '',
      'COLORES',
    ].concat(COLORS.map(function (c) { return '- ' + c.name + ' ' + c.hex + ' · RGB ' + rgb(c.hex).join(', ') + ' · ' + c.use; }))
      .concat(['', 'Los SVG del logotipo llevan la tipografía incrustada: se ven bien en navegadores y en la mayoría de los programas.',
        'Para imprenta, pide la versión en trazos o usa los PNG de alta resolución.', '']).join('\n');
  }

  // ---------- ZIP (sin compresión) ----------
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name);
      var data = f.data;
      var crc = crc32(data);
      var local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
      parts.push(new Uint8Array(local.buffer), name, data);
      var cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true); cen.setUint16(12, 0, true); cen.setUint16(14, 0x21, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
      cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cenSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }
  function blobBytes(b) { return b.arrayBuffer().then(function (buf) { return new Uint8Array(buf); }); }

  function buildAll(onProgress) {
    var tasks = [];
    var enc = new TextEncoder();
    var add = function (name, promise) {
      tasks.push(promise.then(function (blob) { return blobBytes(blob); }).then(function (data) { onProgress(name); return { name: 'arkhenix-identidad/' + name, data: data }; }));
    };
    LOGOS.forEach(function (v) {
      add('logotipo/arkhenix-' + v.id + '.png', logoPng(v, { size: 400 }));
      add('logotipo/arkhenix-' + v.id + '.svg', logoSvg(v));
    });
    add('logotipo/arkhenix-claro-con-fondo.png', logoPng(LOGOS[0], { size: 400, bg: '#F4F4F1' }));
    add('logotipo/arkhenix-oscuro-con-fondo.png', logoPng(LOGOS[1], { size: 400, bg: '#0E1116' }));
    [true, false].forEach(function (dark) {
      var tag = dark ? 'oscuro' : 'claro';
      add('icono/arkhenix-icono-' + tag + '-1024.png', canvasToBlob(iconCanvas(dark, 1024)));
      add('icono/arkhenix-icono-' + tag + '-512.png', canvasToBlob(iconCanvas(dark, 512)));
      add('icono/arkhenix-icono-' + tag + '.svg', iconSvg(dark));
    });
    add('colores/arkhenix-colores.css', Promise.resolve(new Blob([colorsCss()])));
    add('colores/arkhenix-colores.json', Promise.resolve(new Blob([colorsJson()])));
    STATIC_FILES.forEach(function (f) {
      add(f[0], fetch(f[1]).then(function (r) { if (!r.ok) throw new Error(f[1]); return r.blob(); }));
    });
    add('LEEME.txt', Promise.resolve(new Blob([enc.encode(readme())])));
    return Promise.all(tasks).then(makeZip);
  }

  // ---------- Interfaz ----------
  function render(p, h) {
    p.classList.add('id-panel');
    var status = h('p', { class: 'id-status', role: 'status' });
    var setStatus = function (t, kind) { status.textContent = t || ''; status.className = 'id-status ' + (kind || ''); };

    p.appendChild(h('div', { class: 'id-head' }, [
      h('div', {}, [
        h('h2', { text: 'Identidad de Arkhenix' }),
        h('p', { class: 'muted', text: 'Logotipo, ícono, colores, tipografía y logos de las marcas, listos para descargar.' }),
      ]),
      h('div', { class: 'brand-tools' }, [
        h('button', { class: 'btn btn-primary', type: 'button', text: 'Descargar todo (ZIP)', onclick: function (e) {
          var btn = e.currentTarget;
          btn.disabled = true;
          setStatus('Preparando archivos…');
          fontsReady().then(function (ok) {
            if (!ok) throw new Error('No se pudo cargar la tipografía IBM Plex Sans. Revisa tu conexión.');
            return buildAll(function (n) { setStatus('Preparando ' + n + '…'); });
          }).then(function (zip) {
            download('arkhenix-identidad.zip', zip);
            setStatus('Listo: arkhenix-identidad.zip', 'ok');
          }).catch(function (err) { setStatus(err.message || 'No se pudo preparar el ZIP.', 'err'); })
            .then(function () { btn.disabled = false; });
        } }),
        h('button', { class: 'btn', type: 'button', text: 'Imprimir o guardar en PDF', onclick: function () { window.print(); } }),
      ]),
    ]));
    p.appendChild(status);

    // Logotipo
    p.appendChild(h('h3', { class: 'id-h3', text: '1 · Logotipo' }));
    p.appendChild(h('p', { class: 'id-text', text: 'La palabra «arkhenix» en minúsculas, en IBM Plex Sans Bold, seguida de un punto. El punto es el sello de la marca: siempre en cobalto, o en cobalto claro sobre fondos oscuros.' }));
    var grid = h('div', { class: 'id-grid' });
    LOGOS.forEach(function (v) {
      var prev = h('div', { class: 'id-logo', style: 'background: ' + v.preview + '; color: ' + v.fg }, [
        h('span', { class: 'id-word', text: 'arkhenix' }), h('span', { class: 'id-word', style: 'color: ' + v.dot, text: '.' }),
      ]);
      var dl = function (fmt) {
        return h('button', { class: 'btn btn-small', type: 'button', text: fmt.toUpperCase(), onclick: function () {
          setStatus('Generando…');
          fontsReady().then(function () { return fmt === 'png' ? logoPng(v, { size: 400 }) : logoSvg(v); })
            .then(function (b) { download('arkhenix-' + v.id + '.' + fmt, b); setStatus(''); })
            .catch(function () { setStatus('No se pudo generar el archivo. Revisa tu conexión.', 'err'); });
        } });
      };
      grid.appendChild(h('div', { class: 'id-card' }, [prev, h('div', { class: 'id-card-foot' }, [h('span', { text: v.name }), h('div', { class: 'brand-tools' }, [dl('png'), dl('svg')])])]));
    });
    p.appendChild(grid);
    p.appendChild(h('ul', { class: 'id-rules' }, [
      h('li', { text: 'Área de protección: deja libre alrededor del logotipo un espacio igual a la altura de la letra «a».' }),
      h('li', { text: 'Tamaño mínimo: 80 px de ancho en pantalla y 20 mm impreso.' }),
      h('li', { text: 'No deformar, rotar, contornear ni agregar sombras. No cambiar la tipografía ni el color del punto.' }),
    ]));

    // Ícono
    p.appendChild(h('h3', { class: 'id-h3', text: '2 · Ícono' }));
    p.appendChild(h('p', { class: 'id-text', text: 'Versión corta para espacios cuadrados: foto de perfil en redes, ícono del navegador y aplicaciones.' }));
    var icons = h('div', { class: 'id-grid id-grid-icons' });
    [true, false].forEach(function (dark) {
      var cv = h('canvas', { class: 'id-icon', width: '128', height: '128', 'aria-label': 'Ícono ' + (dark ? 'oscuro' : 'claro') });
      fontsReady().then(function () { cv.getContext('2d').drawImage(iconCanvas(dark, 256), 0, 0, 128, 128); });
      var tag = dark ? 'oscuro' : 'claro';
      icons.appendChild(h('div', { class: 'id-card' }, [
        h('div', { class: 'id-logo id-logo-icon', style: 'background: #E9E9E4' }, [cv]),
        h('div', { class: 'id-card-foot' }, [h('span', { text: 'Ícono ' + tag }), h('div', { class: 'brand-tools' }, [
          h('button', { class: 'btn btn-small', type: 'button', text: 'PNG 1024', onclick: function () {
            fontsReady().then(function () { return canvasToBlob(iconCanvas(dark, 1024)); }).then(function (b) { download('arkhenix-icono-' + tag + '-1024.png', b); });
          } }),
          h('button', { class: 'btn btn-small', type: 'button', text: 'SVG', onclick: function () {
            iconSvg(dark).then(function (b) { download('arkhenix-icono-' + tag + '.svg', b); })
              .catch(function () { setStatus('No se pudo generar el archivo. Revisa tu conexión.', 'err'); });
          } }),
        ])]),
      ]));
    });
    p.appendChild(icons);

    // Colores
    p.appendChild(h('h3', { class: 'id-h3', text: '3 · Colores' }));
    p.appendChild(h('p', { class: 'id-text', text: 'Toca un color para copiar su código.' }));
    ['Arkhenix', 'Marcas'].forEach(function (group) {
      p.appendChild(h('p', { class: 'mono muted id-group', text: group === 'Arkhenix' ? 'COLORES DE ARKHENIX' : 'COLORES DE LAS MARCAS' }));
      var sw = h('div', { class: 'id-swatches' });
      COLORS.filter(function (c) { return c.group === group; }).forEach(function (c) {
        sw.appendChild(h('button', { type: 'button', class: 'id-swatch', title: 'Copiar ' + c.hex, onclick: function () {
          if (navigator.clipboard) navigator.clipboard.writeText(c.hex).then(function () { setStatus(c.name + ' ' + c.hex + ' copiado.', 'ok'); });
        } }, [
          h('span', { class: 'id-chip', style: 'background: ' + c.hex }),
          h('span', { class: 'id-swatch-name', text: c.name }),
          h('span', { class: 'mono', text: c.hex }),
          h('span', { class: 'mono muted', text: 'RGB ' + rgb(c.hex).join(' ') }),
          h('span', { class: 'id-swatch-use', text: c.use }),
        ]));
      });
      p.appendChild(sw);
    });
    p.appendChild(h('div', { class: 'brand-tools', style: 'margin-top: 12px' }, [
      h('button', { class: 'btn btn-small', type: 'button', text: 'Descargar CSS', onclick: function () { download('arkhenix-colores.css', new Blob([colorsCss()], { type: 'text/css' })); } }),
      h('button', { class: 'btn btn-small', type: 'button', text: 'Descargar JSON', onclick: function () { download('arkhenix-colores.json', new Blob([colorsJson()], { type: 'application/json' })); } }),
    ]));

    // Tipografía
    p.appendChild(h('h3', { class: 'id-h3', text: '4 · Tipografía' }));
    var typo = h('div', { class: 'id-grid' });
    [['IBM Plex Sans', 'Títulos y textos · 400, 500, 600, 700', 'id-sample-sans', 'Donde empieza la tecnología.', 'https://fonts.google.com/specimen/IBM+Plex+Sans'],
      ['IBM Plex Mono', 'Etiquetas y datos técnicos · 400, 500', 'id-sample-mono', 'ORIGEN TECNOLÓGICO · SOLUCIONES DE SOFTWARE', 'https://fonts.google.com/specimen/IBM+Plex+Mono']].forEach(function (t) {
      typo.appendChild(h('div', { class: 'id-card' }, [
        h('div', { class: 'id-type' }, [h('p', { class: t[2], text: t[3] })]),
        h('div', { class: 'id-card-foot' }, [h('span', {}, [h('strong', { text: t[0] }), h('br'), h('span', { class: 'muted', text: t[1] })]),
          h('a', { class: 'btn btn-small', href: t[4], target: '_blank', rel: 'noopener', text: 'Descargar ↗' })]),
      ]));
    });
    p.appendChild(typo);
    p.appendChild(h('p', { class: 'id-text', text: 'Ambas son gratuitas y de licencia libre (SIL Open Font License). Regla de la casa: los párrafos van siempre justificados, sin cortar palabras con guion.' }));

    // Marcas
    p.appendChild(h('h3', { class: 'id-h3', text: '5 · Marcas del grupo' }));
    var brands = h('div', { class: 'id-grid id-grid-brands' });
    [['Cerven', '/assets/marca/cerven-logo.png', '/assets/logos/cerven.png', '#0B84E3'],
      ['Corte Atlas', '/assets/marca/corte-logo.png', '/assets/logos/corte.png', '#68D3A2'],
      ['Verbato', '/assets/marca/verbato-logo.png', '/assets/logos/verbato.png', '#10B77F']].forEach(function (b) {
      brands.appendChild(h('div', { class: 'id-card' }, [
        h('div', { class: 'id-logo id-logo-brand' }, [h('img', { src: b[1], alt: 'Logo de ' + b[0] })]),
        h('div', { class: 'id-card-foot' }, [h('span', {}, [h('span', { class: 'id-chip id-chip-sm', style: 'background: ' + b[3] }), b[0]]), h('div', { class: 'brand-tools' }, [
          h('a', { class: 'btn btn-small', href: b[1], download: '', text: 'Logo' }),
          h('a', { class: 'btn btn-small', href: b[2], download: '', text: 'Ícono' }),
        ])]),
      ]));
    });
    p.appendChild(brands);

    // Gráficos
    p.appendChild(h('h3', { class: 'id-h3', text: '6 · Elementos gráficos' }));
    var gfx = h('div', { class: 'id-grid id-grid-brands' });
    [['Órbita', '/assets/marca/orbita.svg', 'Representa a Arkhenix como núcleo y a cada marca como un punto de color en órbita.'],
      ['Cuadrícula', '/assets/marca/cuadricula.svg', 'Fondo técnico de celdas de 32 px. Se repite en mosaico.']].forEach(function (g) {
      gfx.appendChild(h('div', { class: 'id-card' }, [
        h('div', { class: 'id-logo id-logo-brand', style: 'background: #F4F4F1' }, [h('img', { src: g[1], alt: g[0] })]),
        h('div', { class: 'id-card-foot' }, [h('span', {}, [h('strong', { text: g[0] }), h('br'), h('span', { class: 'muted', text: g[2] })]),
          h('a', { class: 'btn btn-small', href: g[1], download: '', text: 'SVG' })]),
      ]));
    });
    p.appendChild(gfx);

    // Frases
    p.appendChild(h('h3', { class: 'id-h3', text: '7 · Frases' }));
    p.appendChild(h('div', { class: 'id-phrases' }, [
      h('div', {}, [h('p', { class: 'mono muted', text: 'LEMA' }), h('p', { class: 'id-phrase mono', text: 'ORIGEN TECNOLÓGICO · SOLUCIONES DE SOFTWARE' })]),
      h('div', {}, [h('p', { class: 'mono muted', text: 'FRASE PRINCIPAL' }), h('p', { class: 'id-phrase', text: 'Donde empieza la tecnología.' })]),
    ]));
  }

  window.AkxIdentidad = { render: render };
})();
