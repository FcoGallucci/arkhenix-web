// Panel del usuario master de Arkhenix.
(function () {
  'use strict';

  var app = document.getElementById('app');
  var topActions = document.getElementById('top-actions');
  var state = null;        // contenido en edición
  var saved = '';          // última versión guardada (JSON)
  var pendingDeletes = []; // archivos a borrar después de guardar
  var tab = 'textos';
  var storage = {};

  // ---------- Utilidades ----------
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function api(method, url, body, isForm) {
    var opts = { method: method, headers: { 'X-Requested-With': 'arkhenix' }, credentials: 'same-origin' };
    if (body !== undefined) {
      if (isForm) opts.body = body;
      else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    }
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || ('Error ' + r.status));
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function getPath(obj, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, obj); }
  function setPath(obj, path, value) {
    var parts = path.split('.');
    var last = parts.pop();
    var target = parts.reduce(function (a, k) { return a[k]; }, obj);
    target[last] = value;
  }

  var statusEl = null;
  function dirty() { return state && JSON.stringify(state) !== saved; }
  function updateStatus(msg, kind) {
    if (!statusEl) return;
    if (msg) { statusEl.textContent = msg; statusEl.className = 'status ' + (kind || ''); return; }
    if (dirty()) { statusEl.textContent = 'Hay cambios sin guardar.'; statusEl.className = 'status warn'; }
    else { statusEl.textContent = 'Todo guardado.'; statusEl.className = 'status ok'; }
  }

  function textField(label, path, opts) {
    opts = opts || {};
    var id = 'f-' + path.replace(/\./g, '-');
    var input = opts.multiline
      ? h('textarea', { id: id, rows: opts.rows || 4 })
      : h('input', { id: id, type: opts.type || 'text' });
    input.value = getPath(state, path) || '';
    input.addEventListener('input', function () { setPath(state, path, input.value); updateStatus(); });
    return h('div', { class: 'field' }, [
      h('label', { for: id, text: label }), input,
      opts.hint ? h('span', { class: 'hint', text: opts.hint }) : null,
    ]);
  }

  window.addEventListener('beforeunload', function (e) {
    if (dirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  // ---------- Pantallas ----------
  function screenNotConfigured() {
    app.innerHTML = '';
    app.appendChild(h('div', { class: 'card login' }, [
      h('h1', { text: 'Panel no configurado' }),
      h('p', { text: 'Faltan las claves del usuario master en Cloudflare (ADMIN_USER, ADMIN_PASSWORD y SESSION_SECRET). Revisa el archivo README del repositorio.' }),
    ]));
  }

  function screenLogin(message) {
    topActions.hidden = true;
    app.innerHTML = '';
    var err = h('p', { class: 'error', role: 'alert', text: message || '' });
    var user = h('input', { id: 'l-user', type: 'text', autocomplete: 'username', required: true });
    var pass = h('input', { id: 'l-pass', type: 'password', autocomplete: 'current-password', required: true });
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: 'Ingresar' });
    var form = h('form', { class: 'card login', onsubmit: function (e) {
      e.preventDefault();
      btn.disabled = true;
      err.textContent = '';
      api('POST', '/api/admin/login', { user: user.value, password: pass.value })
        .then(function () { boot(); })
        .catch(function (e2) { err.textContent = e2.message; btn.disabled = false; pass.value = ''; pass.focus(); });
    } }, [
      h('h1', { text: 'Ingresar' }),
      h('p', { class: 'muted', text: 'Acceso del usuario master para editar el sitio.' }),
      h('div', { class: 'field' }, [h('label', { for: 'l-user', text: 'Usuario' }), user]),
      h('div', { class: 'field' }, [h('label', { for: 'l-pass', text: 'Contraseña' }), pass]),
      err, btn,
    ]);
    app.appendChild(form);
    user.focus();
  }

  function screenEditor() {
    topActions.hidden = false;
    app.innerHTML = '';
    var tabs = [
      ['textos', 'Inicio'], ['marcas', 'Marcas y videos'], ['nosotros', 'Nosotros'],
      ['contacto', 'Contacto y pie'], ['legal', 'Datos legales'], ['mensajes', 'Mensajes'],
    ];
    var warnings = [];
    if (!storage.content) warnings.push('Falta conectar el almacenamiento de textos (KV «CONTENT»): los cambios no se podrán guardar.');
    if (!storage.media) warnings.push('Falta conectar el almacenamiento de archivos (R2 «MEDIA»): no se podrán subir videos ni logos.');
    if (!storage.email) warnings.push('El envío de correos del formulario no está configurado: los mensajes solo quedarán en la pestaña «Mensajes».');
    warnings.forEach(function (w) { app.appendChild(h('p', { class: 'notice', text: w })); });

    var tabBar = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
      return h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': tab === t[0] ? 'true' : 'false', text: t[1],
        onclick: function () { tab = t[0]; screenEditor(); } });
    }));
    app.appendChild(tabBar);
    var panel = h('section', { class: 'panel', role: 'tabpanel' });
    app.appendChild(panel);
    ({ textos: panelTextos, marcas: panelMarcas, nosotros: panelNosotros, contacto: panelContacto, legal: panelLegal, mensajes: panelMensajes })[tab](panel);

    if (tab !== 'mensajes') {
      statusEl = h('span', { class: 'status' });
      var saveBtn = h('button', { class: 'btn btn-primary', type: 'button', text: 'Guardar cambios', onclick: save });
      app.appendChild(h('div', { class: 'savebar' }, [statusEl, saveBtn]));
      updateStatus();
    } else {
      statusEl = null;
    }
  }

  function save() {
    updateStatus('Guardando…');
    api('PUT', '/api/admin/content', state)
      .then(function (res) {
        state = res.content;
        delete state.updatedAt;
        saved = JSON.stringify(state);
        var toDelete = pendingDeletes.slice();
        pendingDeletes = [];
        toDelete.forEach(function (src) { api('DELETE', '/api/admin/media?src=' + encodeURIComponent(src)).catch(function () {}); });
        screenEditor();
        updateStatus('Guardado. El sitio ya muestra los cambios (puede tardar hasta un minuto en verse en todas partes).', 'ok');
      })
      .catch(function (e) {
        if (e.status === 401) return screenLogin('Tu sesión venció. Ingresa de nuevo; tus cambios siguen en esta pestaña hasta que la cierres.');
        updateStatus(e.message, 'err');
      });
  }

  // ---------- Paneles ----------
  function panelTextos(p) {
    p.appendChild(h('h2', { text: 'Portada' }));
    p.appendChild(h('p', { class: 'muted', text: 'Lo primero que se ve al entrar al sitio.' }));
    p.appendChild(textField('Texto pequeño superior', 'hero.eyebrow'));
    p.appendChild(textField('Título principal', 'hero.title', { multiline: true, rows: 2, hint: 'Cada salto de línea se respeta. El punto azul final se agrega solo.' }));
    p.appendChild(textField('Texto bajo el título', 'hero.text', { multiline: true, rows: 3 }));
    p.appendChild(textField('Botón', 'hero.cta'));
    p.appendChild(h('h2', { text: 'Sección de marcas', style: 'margin-top: 28px' }));
    p.appendChild(h('div', { class: 'row' }, [
      textField('Título', 'brandsSection.title'),
      textField('Subtítulo', 'brandsSection.subtitle'),
    ]));
    p.appendChild(textField('Lema de la barra final', 'lema', { hint: 'Ej.: ORIGEN TECNOLÓGICO · SOLUCIONES DE SOFTWARE' }));
  }

  function uploadButton(label, accept, onDone) {
    var input = h('input', { type: 'file', accept: accept, 'aria-label': label });
    var btn = h('span', { class: 'btn btn-small upload' }, [label, input]);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var fd = new FormData();
      fd.append('file', file);
      updateStatus('Subiendo «' + file.name + '»…');
      api('POST', '/api/admin/media', fd, true)
        .then(function (res) { onDone(res.src, file); updateStatus(); })
        .catch(function (e) { updateStatus(e.message, 'err'); })
        .then(function () { input.value = ''; });
    });
    return btn;
  }

  function panelMarcas(p) {
    p.appendChild(h('h2', { text: 'Marcas' }));
    p.appendChild(h('p', { class: 'muted', text: 'Cada marca muestra sus videos en orden, uno tras otro. Si una marca no tiene videos se ve la animación de demostración. Formatos: MP4 o WebM, idealmente de 5 a 15 segundos, sin sonido, en horizontal (16:9).' }));

    state.brands.forEach(function (b, i) {
      var base = 'brands.' + i + '.';
      var box = h('div', { class: 'brand-box' });
      var move = function (d) {
        var j = i + d;
        if (j < 0 || j >= state.brands.length) return;
        var tmp = state.brands[i]; state.brands[i] = state.brands[j]; state.brands[j] = tmp;
        screenEditor();
      };
      box.appendChild(h('div', { class: 'brand-head' }, [
        h('h3', { text: 'MOD-' + (i < 9 ? '0' : '') + (i + 1) + ' · ' + (b.name || 'Marca') }),
        h('div', { class: 'brand-tools' }, [
          h('button', { class: 'btn btn-small', type: 'button', text: '↑ Subir', disabled: i === 0, onclick: function () { move(-1); } }),
          h('button', { class: 'btn btn-small', type: 'button', text: '↓ Bajar', disabled: i === state.brands.length - 1, onclick: function () { move(1); } }),
          h('button', { class: 'btn btn-small btn-danger', type: 'button', text: 'Quitar marca', onclick: function () {
            if (!confirm('¿Quitar «' + b.name + '» del sitio?')) return;
            state.brands.splice(i, 1); screenEditor();
          } }),
        ]),
      ]));
      var colorInput = h('input', { type: 'color', id: 'f-' + b.id + '-color', style: 'width: 64px; min-height: 44px; padding: 2px' });
      colorInput.value = b.color || '#0E1116';
      var colorNone = h('label', { style: 'display: inline-flex; align-items: center; gap: 6px; font-size: 14px' }, [
        h('input', { type: 'checkbox', checked: !b.color }), 'Sin color',
      ]);
      colorInput.addEventListener('input', function () { b.color = colorInput.value.toUpperCase(); colorNone.firstChild.checked = false; updateStatus(); });
      colorNone.firstChild.addEventListener('change', function () { b.color = colorNone.firstChild.checked ? '' : colorInput.value.toUpperCase(); updateStatus(); });
      box.appendChild(h('div', { class: 'row' }, [
        textField('Nombre', base + 'name'),
        textField('Etiqueta', base + 'tag'),
        h('div', { class: 'field', style: 'flex: 0 1 200px' }, [
          h('label', { for: 'f-' + b.id + '-color', text: 'Color de la marca' }),
          h('div', { style: 'display: flex; align-items: center; gap: 12px' }, [colorInput, colorNone]),
          h('span', { class: 'hint', text: 'Se usa en la órbita y en la tarjeta.' }),
        ]),
      ]));
      box.appendChild(textField('Descripción', base + 'description', { multiline: true, rows: 2 }));
      var statusSel = h('select', { id: 'f-' + b.id + '-status' }, [
        h('option', { value: 'activa', text: 'Activa (con enlace)' }),
        h('option', { value: 'pronto', text: 'En desarrollo / próximamente' }),
      ]);
      statusSel.value = b.status;
      statusSel.addEventListener('change', function () { b.status = statusSel.value; updateStatus(); });
      box.appendChild(h('div', { class: 'row' }, [
        textField('Dirección web', base + 'url', { type: 'url', hint: 'Debe empezar con https://' }),
        h('div', { class: 'field' }, [h('label', { for: 'f-' + b.id + '-status', text: 'Estado' }), statusSel]),
      ]));

      // Logo
      box.appendChild(h('div', { class: 'field' }, [h('label', { text: 'Logo' })]));
      var logoRow = h('div', { class: 'media-item' });
      if (b.logo) logoRow.appendChild(h('img', { class: 'logo-prev', src: b.logo, alt: 'Logo actual de ' + b.name }));
      else logoRow.appendChild(h('span', { class: 'muted', text: 'Sin logo (se muestra un espacio reservado).' }));
      logoRow.appendChild(uploadButton(b.logo ? 'Cambiar logo' : 'Subir logo', 'image/png,image/jpeg,image/webp', function (src) {
        if (b.logo && b.logo.indexOf('/media/') === 0) pendingDeletes.push(b.logo);
        b.logo = src; screenEditor();
      }));
      if (b.logo) logoRow.appendChild(h('button', { class: 'btn btn-small btn-danger', type: 'button', text: 'Quitar logo', onclick: function () {
        if (b.logo.indexOf('/media/') === 0) pendingDeletes.push(b.logo);
        b.logo = ''; screenEditor();
      } }));
      box.appendChild(logoRow);

      // Videos
      box.appendChild(h('div', { class: 'field', style: 'margin-top: 16px' }, [h('label', { text: 'Videos (' + b.videos.length + ' de 6)' })]));
      var list = h('div', { class: 'media-list' });
      b.videos.forEach(function (v, k) {
        var lab = h('input', { type: 'text', id: 'v-' + b.id + '-' + k, maxlength: '40' });
        lab.value = v.label || '';
        lab.addEventListener('input', function () { v.label = lab.value; updateStatus(); });
        var swap = function (d) {
          var j = k + d;
          if (j < 0 || j >= b.videos.length) return;
          var t = b.videos[k]; b.videos[k] = b.videos[j]; b.videos[j] = t; screenEditor();
        };
        list.appendChild(h('div', { class: 'media-item' }, [
          h('video', { src: v.src, muted: true, playsinline: true, preload: 'metadata', controls: true }),
          h('div', { class: 'field' }, [h('label', { for: 'v-' + b.id + '-' + k, text: 'Nombre de la escena' }), lab]),
          h('div', { class: 'brand-tools' }, [
            h('button', { class: 'btn btn-small', type: 'button', text: '↑', 'aria-label': 'Mover antes', disabled: k === 0, onclick: function () { swap(-1); } }),
            h('button', { class: 'btn btn-small', type: 'button', text: '↓', 'aria-label': 'Mover después', disabled: k === b.videos.length - 1, onclick: function () { swap(1); } }),
            h('button', { class: 'btn btn-small btn-danger', type: 'button', text: 'Quitar', onclick: function () {
              if (v.src.indexOf('/media/') === 0) pendingDeletes.push(v.src);
              b.videos.splice(k, 1); screenEditor();
            } }),
          ]),
        ]));
      });
      box.appendChild(list);
      if (b.videos.length < 6) {
        box.appendChild(uploadButton('+ Subir video', 'video/mp4,video/webm', function (src, file) {
          b.videos.push({ src: src, label: file.name.replace(/\.[^.]+$/, '').slice(0, 40) });
          screenEditor();
        }));
      }
      p.appendChild(box);
    });

    p.appendChild(h('button', { class: 'btn', type: 'button', text: '+ Agregar marca', onclick: function () {
      state.brands.push({ id: 'marca-' + Date.now().toString(36), name: 'Nueva marca', tag: '', color: '', description: '', url: '', status: 'pronto', logo: '', videos: [] });
      screenEditor();
    } }));
  }

  function panelNosotros(p) {
    p.appendChild(h('h2', { text: 'Sobre nosotros' }));
    p.appendChild(textField('Título', 'about.title'));
    var id = 'f-about-paragraphs';
    var ta = h('textarea', { id: id, rows: 14 });
    ta.value = state.about.paragraphs.join('\n\n');
    ta.addEventListener('input', function () {
      state.about.paragraphs = ta.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      updateStatus();
    });
    p.appendChild(h('div', { class: 'field' }, [
      h('label', { for: id, text: 'Texto' }), ta,
      h('span', { class: 'hint', text: 'Deja una línea en blanco entre párrafos.' }),
    ]));
  }

  function panelContacto(p) {
    p.appendChild(h('h2', { text: 'Contacto' }));
    p.appendChild(textField('Título', 'contact.title'));
    p.appendChild(textField('Texto', 'contact.text', { multiline: true, rows: 3 }));
    p.appendChild(textField('Correo visible', 'contact.email', { type: 'email', hint: 'Se muestra en la página. Los mensajes del formulario llegan al correo configurado en Cloudflare (CONTACT_TO).' }));
    p.appendChild(h('h2', { text: 'Pie de página', style: 'margin-top: 28px' }));
    p.appendChild(textField('Descripción', 'footer.description', { multiline: true, rows: 3 }));
    p.appendChild(h('div', { class: 'row' }, [
      textField('LinkedIn', 'footer.social.linkedin', { type: 'url' }),
      textField('Instagram', 'footer.social.instagram', { type: 'url' }),
    ]));
    p.appendChild(h('div', { class: 'row' }, [
      textField('YouTube', 'footer.social.youtube', { type: 'url' }),
      textField('X', 'footer.social.x', { type: 'url' }),
    ]));
    p.appendChild(h('p', { class: 'muted', text: 'Las redes que dejes vacías no se muestran.' }));
  }

  function panelLegal(p) {
    p.appendChild(h('h2', { text: 'Datos para las páginas legales' }));
    p.appendChild(h('p', { class: 'muted', text: 'Se completan automáticamente en Aviso legal, Privacidad, Términos y Cookies.' }));
    p.appendChild(h('div', { class: 'row' }, [textField('Razón social', 'legal.company'), textField('RIF / número fiscal', 'legal.taxId')]));
    p.appendChild(textField('Dirección', 'legal.address'));
    p.appendChild(h('div', { class: 'row' }, [
      textField('País', 'legal.country'),
      textField('Correo legal', 'legal.email', { type: 'email' }),
      textField('Fecha de última actualización', 'legal.updated'),
    ]));
  }

  function panelMensajes(p) {
    p.appendChild(h('h2', { text: 'Mensajes recibidos' }));
    p.appendChild(h('p', { class: 'muted', text: 'Copia de lo que llega por el formulario de contacto. Se borran solos a los 180 días.' }));
    var box = h('div', {}, [h('p', { class: 'muted', text: 'Cargando…' })]);
    p.appendChild(box);
    api('GET', '/api/admin/messages').then(function (res) {
      box.innerHTML = '';
      if (!res.messages.length) { box.appendChild(h('p', { text: 'Todavía no hay mensajes.' })); return; }
      res.messages.forEach(function (m) {
        var item = h('article', { class: 'msg' }, [
          h('div', { class: 'msg-head' }, [
            h('strong', { text: m.name }),
            h('span', { class: 'mono muted', text: new Date(m.createdAt).toLocaleString('es') + (m.emailed ? ' · enviado por correo' : ' · solo en el panel') }),
          ]),
          h('p', { text: m.message }),
          h('div', { class: 'brand-tools' }, [
            h('a', { class: 'btn btn-small', href: 'mailto:' + m.email, text: 'Responder a ' + m.email }),
            h('button', { class: 'btn btn-small btn-danger', type: 'button', text: 'Borrar', onclick: function () {
              if (!confirm('¿Borrar este mensaje?')) return;
              api('DELETE', '/api/admin/messages?key=' + encodeURIComponent(m.key)).then(function () { item.remove(); });
            } }),
          ]),
        ]);
        box.appendChild(item);
      });
    }).catch(function (e) { box.innerHTML = ''; box.appendChild(h('p', { class: 'error', text: e.message })); });
  }

  // ---------- Arranque ----------
  document.getElementById('logout').addEventListener('click', function () {
    if (dirty() && !confirm('Hay cambios sin guardar. ¿Salir igual?')) return;
    api('POST', '/api/admin/logout', {}).then(function () { state = null; screenLogin(); });
  });

  function boot() {
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
      .then(function (res) {
        if (!res.d.configured) return screenNotConfigured();
        if (res.status !== 200) return screenLogin();
        storage = res.d.storage || {};
        if (state) { screenEditor(); return; }
        return api('GET', '/api/admin/content').then(function (c) {
          delete c.updatedAt;
          state = c;
          saved = JSON.stringify(c);
          screenEditor();
        });
      })
      .catch(function () {
        app.innerHTML = '';
        app.appendChild(h('p', { class: 'error', text: 'No se pudo conectar con el servidor.' }));
      });
  }
  boot();
})();
