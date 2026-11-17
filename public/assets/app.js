// Sitio de Arkhenix: aplica el contenido editable, arma las tarjetas de marcas,
// anima las demostraciones, reproduce los videos subidos y envía el formulario.
(function () {
  'use strict';

  var ACCENT = '#2F5BEA';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [];
  var observers = [];
  var lastJson = '';

  var SCENES = {
    corte: { ms: 4200, labels: ['Atlas', 'Cortes', 'Medición'], on: '#8EA9FF', off: 'rgba(255,255,255,0.22)' },
    cerven: { ms: 4800, labels: ['Lista de trabajo', 'Informe', 'Firma'], on: ACCENT, off: '#CFCFC8' },
    verbato: { ms: 5400, labels: ['Grabar', 'Transcribir', 'Exportar'], on: ACCENT, off: '#CFCFC8' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(obj, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, obj);
  }
  function hostOf(url) {
    try { return new URL(url).host.replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  var ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M8 7h9v9"></path></svg>';

  // ---------- Textos ----------
  function applyTexts(c) {
    var nodes = document.querySelectorAll('[data-k]');
    for (var i = 0; i < nodes.length; i++) {
      var v = get(c, nodes[i].getAttribute('data-k'));
      if (typeof v === 'string') nodes[i].textContent = v;
    }
    var title = document.querySelector('[data-k-title]');
    if (title) {
      title.innerHTML = c.hero.title.split('\n').map(esc).join('<br>') + '<span style="color: ' + ACCENT + '">.</span>';
    }
    var about = document.getElementById('about-paragraphs');
    if (about) {
      about.innerHTML = c.about.paragraphs.map(function (p) {
        return '<p style="margin: 0; font-size: 19px; line-height: 1.7; color: #3B3F45">' + esc(p) + '</p>';
      }).join('');
    }
    var mails = document.querySelectorAll('[data-email]');
    for (var m = 0; m < mails.length; m++) {
      mails[m].textContent = c.contact.email;
      mails[m].setAttribute('href', 'mailto:' + c.contact.email);
    }
    var mailTexts = document.querySelectorAll('[data-email-text]');
    for (var t = 0; t < mailTexts.length; t++) mailTexts[t].textContent = c.contact.email;
    var panelTitle = document.getElementById('akx-panel-title');
    if (panelTitle) panelTitle.textContent = c.contact.title;
    var years = document.querySelectorAll('[data-year]');
    for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());

    var fb = document.getElementById('footer-brands');
    if (fb) {
      fb.innerHTML = c.brands.map(function (b, i) {
        var last = i === c.brands.length - 1 ? ' akx-flast' : '';
        if (b.url) {
          return '<a class="akx-flink' + last + '" href="' + esc(b.url) + '">' + esc(b.name) +
            '<span class="akx-fmuted">' + esc(hostOf(b.url)) + '</span></a>';
        }
        return '<p class="akx-flink' + last + '" style="margin: 0; color: #A9ADB3">' + esc(b.name) +
          '<span class="akx-fmuted">' + (b.status === 'pronto' ? 'próximamente' : '') + '</span></p>';
      }).join('');
    }
    var social = document.getElementById('footer-social');
    if (social) {
      var names = { linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube', x: 'X' };
      social.innerHTML = Object.keys(names).filter(function (k) { return c.footer.social[k]; }).map(function (k) {
        return '<a class="akx-social" href="' + esc(c.footer.social[k]) + '" rel="noopener" target="_blank">' + names[k] + '</a>';
      }).join('');
    }
  }

  // ---------- Tarjetas de marcas ----------
  function cardHtml(b, i) {
    var soon = b.status === 'pronto';
    var line = soon ? '1px dashed #8C9096' : '1px solid #0E1116';
    var logo = b.logo
      ? '<div style="flex: 0 0 44px; height: 44px; background: #FFFFFF; border: 1px solid #D9D9D3; box-sizing: border-box; overflow: hidden; display: flex; align-items: center; justify-content: center"><img src="' + esc(b.logo) + '" alt="Logo de ' + esc(b.name) + '" style="width: 100%; height: 100%; object-fit: contain"></div>'
      : '<div style="flex: 0 0 44px; height: 44px; box-sizing: border-box; border: 1.5px dashed #A9ABA4; display: flex; align-items: center; justify-content: center"><span style="font-family: \'IBM Plex Mono\', monospace; font-size: 9px; color: #555A61">LOGO</span></div>';
    var foot = b.url
      ? '<a href="' + esc(b.url) + '" style="display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 16px; background: #0E1116; color: #FFFFFF; font-family: \'IBM Plex Mono\', monospace; font-size: 14px; text-decoration: none">' + esc(hostOf(b.url) || 'Visitar') + ARROW + '</a>'
      : '<span style="display: flex; align-items: center; min-height: 48px; padding: 0 16px; border-top: ' + line + '; color: #3B3F45; font-family: \'IBM Plex Mono\', monospace; font-size: 14px">' + (soon ? 'EN DESARROLLO' : '') + '</span>';
    var link = soon
      ? '<div class="akx-link" aria-hidden="true" style="width: 0; height: 56px; margin: 0 auto; border-left: 2px dashed #8C9096"></div>'
      : '<div class="akx-link" aria-hidden="true" style="position: relative; overflow: hidden; width: 2px; height: 56px; margin: 0 auto; background: #0E1116"><div class="akx-pulse" style="width: 2px; height: 18px; background: ' + ACCENT + '; animation-delay: ' + (i * 0.7).toFixed(1) + 's"></div></div>';

    return '<article style="flex: 1 1 auto; background: ' + (soon ? '#EDEDE8' : '#FFFFFF') + '; border: ' + line + '; display: flex; flex-direction: column">' +
      '<div style="display: flex; justify-content: space-between; gap: 8px; padding: 10px 14px; border-bottom: ' + line + '; font-family: \'IBM Plex Mono\', monospace; font-size: 12px"><span>MOD-' + pad(i + 1) + '</span><span style="color: #555A61; text-align: right">' + esc(b.tag) + '</span></div>' +
      '<div data-media></div>' +
      '<div style="padding: 20px; display: flex; flex-direction: column; gap: 10px; flex: 1 1 auto">' +
      '<div style="display: flex; align-items: center; gap: 12px">' + logo + '<h3 style="margin: 0; font-size: 24px; font-weight: 600' + (soon ? '; color: #3B3F45' : '') + '">' + esc(b.name) + '</h3></div>' +
      '<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #3B3F45">' + esc(b.description) + '</p>' +
      '</div>' + foot + '</article>' + link;
  }

  function startScenes(root, id) {
    var cfg = SCENES[id];
    var bars = root.querySelector('[data-bars]');
    if (bars && !bars.children.length) {
      for (var i = 0; i < 28; i++) {
        var s = document.createElement('span');
        s.className = 'akx-wave';
        s.style.cssText = 'flex: 1 1 0; height: ' + (14 + ((i * 37) % 46)) + 'px; background: ' + ACCENT + '; animation-delay: ' + ((i * 0.137) % 1).toFixed(2) + 's';
        bars.appendChild(s);
      }
    }
    if (!cfg) return;
    var n = 0;
    function show(idx) {
      var scenes = root.querySelectorAll('[data-scene]');
      for (var j = 0; j < scenes.length; j++) {
        if (j === idx) {
          var fresh = scenes[j].cloneNode(true);
          fresh.removeAttribute('data-off');
          scenes[j].parentNode.replaceChild(fresh, scenes[j]);
        } else {
          scenes[j].setAttribute('data-off', '');
        }
      }
      var label = root.querySelector('[data-label]');
      if (label) label.textContent = cfg.labels[idx];
      var dots = root.querySelectorAll('[data-dot]');
      for (var d = 0; d < dots.length; d++) dots[d].style.background = d === idx ? cfg.on : cfg.off;
    }
    show(0);
    if (!reduce) timers.push(setInterval(function () { n = (n + 1) % 3; show(n); }, cfg.ms));
  }

  function mountVideos(slot, b) {
    var list = b.videos;
    var dots = list.length > 1 ? list.map(function () { return '<span data-dot style="width: 12px; height: 3px; background: rgba(255,255,255,0.22)"></span>'; }).join('') : '';
    slot.innerHTML = '<div style="position: relative; height: 210px; background: #0B0D11; overflow: hidden; display: flex; flex-direction: column">' +
      '<div style="flex: 0 0 26px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 10px; background: #161920; font-family: \'IBM Plex Mono\', monospace; font-size: 10px; color: #9AA0A9">' +
      '<span>' + esc(hostOf(b.url) || b.name) + ' · <span data-label></span></span><span style="display: flex; gap: 3px">' + dots + '</span></div>' +
      '<video muted playsinline preload="metadata" style="flex: 1 1 auto; min-height: 0; width: 100%; object-fit: cover; display: block; background: #0B0D11"></video></div>';
    var video = slot.querySelector('video');
    var label = slot.querySelector('[data-label]');
    var dotEls = slot.querySelectorAll('[data-dot]');
    var idx = 0;
    var visible = true;
    video.setAttribute('aria-label', 'Video de ' + b.name + ' en uso');
    if (list.length === 1) video.loop = true;
    if (reduce) video.controls = true;
    function load(k) {
      idx = k;
      video.src = list[k].src;
      label.textContent = list[k].label || ('Video ' + (k + 1));
      for (var d = 0; d < dotEls.length; d++) dotEls[d].style.background = d === k ? '#8EA9FF' : 'rgba(255,255,255,0.22)';
      if (!reduce && visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    video.addEventListener('ended', function () { load((idx + 1) % list.length); });
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause();
        });
      }, { threshold: 0.2 });
      io.observe(video);
      observers.push(io);
    }
    load(0);
  }

  function mountMedia(slot, b) {
    if (b.videos && b.videos.length) return mountVideos(slot, b);
    var tpl = document.getElementById('sim-' + b.id) || (b.status === 'pronto' ? document.getElementById('sim-his') : null);
    if (tpl) {
      slot.appendChild(tpl.content.cloneNode(true));
      startScenes(slot, b.id);
      return;
    }
    slot.innerHTML = '<div style="height: 210px; background: #0B0D11; display: flex; align-items: center; justify-content: center">' +
      (b.logo ? '<img src="' + esc(b.logo) + '" alt="" style="max-width: 70%; max-height: 150px; object-fit: contain">'
        : '<span style="font-family: \'IBM Plex Mono\', monospace; color: #9AA0A9; font-size: 13px">' + esc(b.name) + '</span>') + '</div>';
  }

  function renderBrands(c) {
    timers.forEach(clearInterval); timers = [];
    observers.forEach(function (o) { o.disconnect(); }); observers = [];
    var grid = document.getElementById('brand-grid');
    if (!grid) return;
    grid.innerHTML = '';
    c.brands.forEach(function (b, i) {
      var col = document.createElement('div');
      col.style.cssText = 'flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column';
      col.innerHTML = cardHtml(b, i);
      grid.appendChild(col);
      mountMedia(col.querySelector('[data-media]'), b);
    });
  }

  function apply(c) {
    var j = JSON.stringify(c);
    if (j === lastJson) return;
    lastJson = j;
    applyTexts(c);
    renderBrands(c);
  }

  // ---------- Formulario ----------
  function setupForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var loadedAt = Date.now();
    var status = document.getElementById('cf-status');
    var btn = document.getElementById('cf-submit');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var el = form.elements;
      var data = {
        name: el.namedItem('name').value.trim(),
        email: el.namedItem('email').value.trim(),
        message: el.namedItem('message').value.trim(),
        consent: el.namedItem('consent').checked,
        website: el.namedItem('website').value,
        elapsed: Date.now() - loadedAt
      };
      status.style.color = '#B42318';
      if (!data.name || !data.email || !data.message) { status.textContent = 'Completa nombre, correo y mensaje.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { status.textContent = 'Revisa el correo: no parece válido.'; el.namedItem('email').focus(); return; }
      if (!data.consent) { status.textContent = 'Debes aceptar la política de privacidad.'; el.namedItem('consent').focus(); return; }
      btn.disabled = true;
      status.style.color = '#3B3F45';
      status.textContent = 'Enviando…';
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.style.color = '#0F7B3F';
            status.textContent = 'Mensaje enviado. Te responderemos pronto.';
          } else {
            status.style.color = '#B42318';
            status.textContent = res.body.error || 'No se pudo enviar. Intenta de nuevo.';
          }
        })
        .catch(function () {
          status.style.color = '#B42318';
          status.textContent = 'No se pudo enviar. Revisa tu conexión o escríbenos por correo.';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  // ---------- Panel de contacto flotante ----------
  function setupPanel() {
    var fab = document.getElementById('akx-fab');
    var panel = document.getElementById('akx-panel');
    var closeBtn = document.getElementById('akx-panel-close');
    if (!fab || !panel) return;
    function open() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    }
    function close(returnFocus) {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      if (returnFocus) fab.focus();
    }
    fab.addEventListener('click', function () { if (panel.hidden) open(); else close(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(true); });
    document.addEventListener('mousedown', function (e) {
      if (panel.hidden) return;
      var t = e.target;
      if (panel.contains(t) || fab.contains(t) || (t.closest && t.closest('[data-open-contact]'))) return;
      close(false);
    });
    var openers = document.querySelectorAll('[data-open-contact]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener('click', function (e) { e.preventDefault(); open(); });
    }
  }

  // ---------- Inicio ----------
  if (window.AKX_DEFAULT) apply(window.AKX_DEFAULT);
  setupForm();
  setupPanel();
  if (location.protocol.indexOf('http') === 0) {
    fetch('/api/content', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) { if (c && c.brands) apply(c); })
      .catch(function () {});
  }
})();
