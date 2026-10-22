(function () {
  var RU = window.__RU || {};
  var MAIL = window.__MAIL || '';
  var doc = document.documentElement;
  var lv = null; // Latvian originals, captured on the first switch
  var lang = 'lv';

  function capture() {
    lv = { title: document.title, desc: '', text: [], attr: [] };
    var md = document.querySelector('meta[name="description"]');
    lv.desc = md ? md.getAttribute('content') : '';
    document.querySelectorAll('[data-i]').forEach(function (el) { lv.text.push([el, el.innerHTML]); });
    document.querySelectorAll('[data-ia]').forEach(function (el) {
      el.getAttribute('data-ia').split(';').forEach(function (pair) {
        var p = pair.split(':');
        lv.attr.push([el, p[0], p[1], el.getAttribute(p[0])]);
      });
    });
  }

  function setLang(l, push) {
    if (!lv) capture();
    lang = l;
    var ru = l === 'ru';
    doc.lang = ru ? 'ru' : 'lv';
    document.title = ru ? RU._title : lv.title;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', ru ? RU._desc : lv.desc);
    // RU strings come from the page's own build, not from user input
    lv.text.forEach(function (t) {
      var k = t[0].getAttribute('data-i');
      t[0].innerHTML = ru && RU[k] != null ? RU[k] : t[1];
    });
    lv.attr.forEach(function (a) {
      a[0].setAttribute(a[1], ru && RU[a[2]] != null ? RU[a[2]] : a[3]);
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l));
    });
    var cta = document.getElementById('cta-mail');
    if (cta) cta.setAttribute('href', 'mailto:' + MAIL + '?subject=' + encodeURIComponent(ru ? 'Запрос' : 'Pieprasījums'));
    if (push) {
      try {
        var u = new URL(location.href);
        if (ru) u.searchParams.set('lang', 'ru'); else u.searchParams.delete('lang');
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) {}
    }
  }

  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q === 'ru') setLang('ru', false);
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  // small-screen menu
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  function closeMenu() { if (!nav) return; nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1120) closeMenu(); });
  }

  // contact form: composes an e-mail in the visitor's own mail program
  var form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      ['name', 'contact', 'msg'].forEach(function (n) {
        var f = form.elements[n], bad = !f.value.trim();
        f.classList.toggle('bad', bad);
        f.setAttribute('aria-invalid', String(bad));
        if (bad) { ok = false; if (!first) first = f; }
      });
      if (!ok) { first.focus(); return; }
      var ru = lang === 'ru';
      var subj = (ru ? 'Запрос с сайта: ' : 'Pieprasījums no mājaslapas: ') + form.elements.name.value.trim();
      var body = form.elements.msg.value.trim() + '\n\n' + form.elements.name.value.trim() + '\n' + form.elements.contact.value.trim();
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    });
    form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('bad'); });
  }
})();
