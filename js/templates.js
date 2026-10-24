/* Templates gallery */
(function () {
  'use strict';
  var QRO = window.QRO, $ = QRO.$;
  var saved = QRO.store.get('studio', null);
  var userText = '';
  try { if (saved && saved.fields) userText = QRO.buildContent(saved.type, saved.fields); } catch (e) {}
  var text = userText || 'https://your-link.com';
  if (userText) $('#tLead').textContent = 'Previews below use your own content. Click a template to open it in the studio and fine-tune everything.';

  var cat = 'All', q = '';
  var chips = $('#tChips'), grid = $('#tGrid'), count = $('#tCount'), empty = $('#tEmpty');

  QRO.TEMPLATE_CATS.forEach(function (c) {
    var n = c === 'All' ? QRO.TEMPLATES.length : QRO.TEMPLATES.filter(function (t) { return t.cat === c; }).length;
    var b = document.createElement('button'); b.setAttribute('role', 'tab'); b.setAttribute('data-cat', c);
    b.innerHTML = c + '<sup>' + n + '</sup>'; chips.appendChild(b);
  });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]'); if (!b) return;
    cat = b.getAttribute('data-cat'); render();
  });
  var deb; $('#tSearch').addEventListener('input', function (e) { clearTimeout(deb); deb = setTimeout(function () { q = e.target.value.trim().toLowerCase(); render(); }, 120); });

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      var c = e.target, tpl = QRO.TEMPLATES[+c.getAttribute('data-id') - 1];
      QRO.renderTemplate(c, tpl, text, 520).then(function () { c.classList.add('ready'); });
    });
  }, { rootMargin: '300px' }) : null;

  function render() {
    Array.prototype.forEach.call(chips.children, function (b) {
      var on = b.getAttribute('data-cat') === cat; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on));
    });
    var list = QRO.TEMPLATES.filter(function (t) {
      return (cat === 'All' || t.cat === cat) && (!q || (t.name + ' ' + t.cat + ' ' + t.body).toLowerCase().indexOf(q) > -1);
    });
    grid.innerHTML = '';
    list.forEach(function (t, i) {
      var a = document.createElement('a'); a.className = 't-card'; a.href = 'studio.html?t=' + t.id; a.style.setProperty('--n', Math.min(i, 14));
      a.setAttribute('aria-label', 'Use template ' + t.name);
      a.innerHTML = '<span class="num"></span><div class="pv"><canvas width="520" height="520"></canvas></div>' +
        '<div class="meta"><div><b></b><em></em></div><span class="use"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>';
      a.querySelector('.num').textContent = String(t.id).padStart(2, '0');
      a.querySelector('b').textContent = t.name; a.querySelector('em').textContent = t.cat;
      var c = a.querySelector('canvas'); c.setAttribute('data-id', t.id);
      grid.appendChild(a);
      if (io) io.observe(c); else QRO.renderTemplate(c, t, text, 520).then(function () { c.classList.add('ready'); });
    });
    count.textContent = list.length + (list.length === 1 ? ' template' : ' templates') + (cat !== 'All' ? ' in ' + cat : '');
    empty.hidden = list.length > 0;
  }
  render();
})();
