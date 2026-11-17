// Formulario por pasos de /cotiza.
(function () {
  'use strict';

  var form = document.getElementById('cz-form');
  if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll('.cz-step'));
  var bars = document.querySelectorAll('.cz-bars span');
  var label = document.getElementById('cz-step-label');
  var pct = document.getElementById('cz-step-pct');
  var back = document.getElementById('cz-back');
  var next = document.getElementById('cz-next');
  var submit = document.getElementById('cz-submit');
  var error = document.getElementById('cz-error');
  var summary = document.getElementById('cz-summary');
  var loadedAt = Date.now();
  var current = 0;

  var PRODUCTS = {
    cerven: { name: 'Cerven', color: '#0B84E3' },
    corte: { name: 'Corte Atlas', color: '#68D3A2' },
    verbato: { name: 'Verbato', color: '#10B77F' },
    his: { name: 'HIS', color: '' },
    medida: { name: 'Desarrollo a medida', color: '#0E1116' }
  };

  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());

  // Producto preseleccionado por enlace: /cotiza?marca=cerven
  var pre = new URLSearchParams(location.search).get('marca');
  if (pre) {
    var box = form.querySelector('input[name="productos"][value="' + pre.replace(/[^a-z]/g, '') + '"]');
    if (box) box.checked = true;
  }

  function values(name) {
    var els = form.querySelectorAll('[name="' + name + '"]');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if ((el.type === 'checkbox' || el.type === 'radio')) { if (el.checked) out.push(el.value); }
      else if (el.value.trim()) out.push(el.value.trim());
    }
    return out;
  }
  function value(name) { return values(name).join(', '); }
  function selected() { return values('productos'); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderSummary() {
    var sel = selected();
    if (!sel.length) { summary.innerHTML = '<p class="cz-muted">Todavía no elegiste ninguna solución.</p>'; return; }
    var html = sel.map(function (p) {
      var info = PRODUCTS[p];
      var sw = info.color ? '<span class="cz-swatch" style="background: ' + info.color + '"></span>' : '<span class="cz-swatch cz-swatch-empty"></span>';
      return '<div class="cz-summary-item">' + sw + '<span>' + esc(info.name) + '</span></div>';
    }).join('');
    var meta = [value('org_tipo'), value('pais'), value('usuarios') ? value('usuarios') + ' usuarios' : ''].filter(Boolean);
    if (meta.length) html += '<p class="cz-summary-meta">' + esc(meta.join(' · ')) + '</p>';
    summary.innerHTML = html;
  }

  function showSubsections() {
    var sel = selected();
    var subs = form.querySelectorAll('.cz-sub');
    for (var i = 0; i < subs.length; i++) subs[i].hidden = sel.indexOf(subs[i].getAttribute('data-for')) === -1;
  }

  function go(i, focus) {
    current = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    for (var b = 0; b < bars.length; b++) bars[b].className = b <= i ? 'on' : '';
    label.textContent = 'Paso ' + (i + 1) + ' de ' + steps.length + ' · ' + steps[i].getAttribute('data-title');
    pct.textContent = Math.round(((i + 1) / steps.length) * 100) + '%';
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    error.textContent = '';
    if (i === 2) showSubsections();
    if (focus) {
      var lg = steps[i].querySelector('legend');
      if (lg) lg.focus({ preventScroll: true });
      var top = document.getElementById('cz-card').getBoundingClientRect().top + window.scrollY - 110;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function validate(i) {
    if (i === 0 && !selected().length) return 'Elige al menos una solución para continuar.';
    if (i === 1 && !value('pais')) { document.getElementById('cz-pais').focus(); return 'Cuéntanos en qué país está tu organización.'; }
    if (i === 4) {
      if (!value('nombre')) { document.getElementById('cz-nombre').focus(); return 'Escribe tu nombre.'; }
      var mail = value('correo');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { document.getElementById('cz-correo').focus(); return 'Revisa el correo: no parece válido.'; }
      if (!document.getElementById('cz-consent').checked) { document.getElementById('cz-consent').focus(); return 'Debes aceptar la política de privacidad.'; }
    }
    return '';
  }

  next.addEventListener('click', function () {
    var msg = validate(current);
    if (msg) { error.textContent = msg; return; }
    go(current + 1, true);
  });
  back.addEventListener('click', function () { go(current - 1, true); });
  form.addEventListener('change', renderSummary);
  form.addEventListener('input', function (e) { if (e.target.name === 'pais') renderSummary(); });
  // Enter en un campo de texto avanza en lugar de enviar.
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && current < steps.length - 1) { e.preventDefault(); next.click(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = validate(4);
    if (msg) { error.textContent = msg; return; }
    var fields = ['productos', 'org_tipo', 'org_nombre', 'pais', 'ciudad', 'usuarios', 'cerven_estudios', 'cerven_modalidades',
      'cerven_urgencias', 'cerven_pacs', 'corte_tipo', 'corte_licencias', 'verbato_horas', 'verbato_uso', 'verbato_idiomas',
      'his_camas', 'his_modulos', 'his_actual', 'medida_desc', 'inicio', 'presupuesto', 'comentarios', 'nombre', 'cargo',
      'correo', 'telefono', 'via'];
    var multi = ['productos', 'cerven_modalidades', 'verbato_uso', 'his_modulos'];
    var sel = selected();
    var answers = {};
    fields.forEach(function (f) {
      var prod = f.split('_')[0];
      if (PRODUCTS[prod] && sel.indexOf(prod) === -1) return; // no enviar detalles de soluciones no elegidas
      answers[f] = multi.indexOf(f) !== -1 ? values(f) : value(f);
    });
    submit.disabled = true;
    error.style.color = '#3B3F45';
    error.textContent = 'Enviando…';
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: answers,
        consent: document.getElementById('cz-consent').checked,
        website: document.getElementById('cz-website').value,
        elapsed: Date.now() - loadedAt
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.error || 'No se pudo enviar. Intenta de nuevo.');
        form.hidden = true;
        document.querySelector('.cz-progress').hidden = true;
        document.getElementById('cz-done-name').textContent = answers.nombre.split(' ')[0];
        document.getElementById('cz-done-mail').textContent = answers.correo;
        var done = document.getElementById('cz-done');
        done.hidden = false;
        done.focus();
      })
      .catch(function (err) {
        error.style.color = '#B42318';
        error.textContent = err.message || 'No se pudo enviar. Revisa tu conexión o escríbenos a contacto@arkhenix.com.';
        submit.disabled = false;
      });
  });

  go(0, false);
  renderSummary();
})();
