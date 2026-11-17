// Completa los datos de la empresa en las páginas legales con lo cargado en el panel.
(function () {
  'use strict';
  function fill(legal) {
    if (!legal) return;
    var nodes = document.querySelectorAll('[data-legal]');
    for (var i = 0; i < nodes.length; i++) {
      var v = legal[nodes[i].getAttribute('data-legal')];
      if (typeof v === 'string' && v) nodes[i].textContent = v;
    }
    if (legal.email) {
      var mails = document.querySelectorAll('[data-legal-email]');
      for (var m = 0; m < mails.length; m++) {
        mails[m].textContent = legal.email;
        mails[m].setAttribute('href', 'mailto:' + legal.email);
      }
    }
  }
  var years = document.querySelectorAll('[data-year]');
  for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());
  if (location.protocol.indexOf('http') !== 0) return;
  fetch('/api/content', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) { if (c) fill(c.legal); })
    .catch(function () {});
})();
