/* Home page behaviour */
(function () {
  'use strict';
  var QRO = window.QRO, $ = QRO.$;
  var SAMPLE = 'https://your-link.com';

  /* ---------- hero live QR (cycles through showcase templates, reacts to typing) ---------- */
  var heroCanvas = $('#heroqr'), input = $('#url'), nameEl = $('#tplName'), dotsEl = $('#tplDots');
  var SHOW = [1, 9, 24, 34, 11, 26].map(function (id) { return QRO.TEMPLATES[id - 1]; });  // curated ids
  var idx = 0, typed = '', timer = 0, busy = false;

  SHOW.forEach(function (_, i) { var d = document.createElement('i'); if (!i) d.className = 'on'; dotsEl.appendChild(d); });

  function text() { return QRO.normalizeUrl(typed) || SAMPLE; }
  function draw(animate) {
    if (busy) return; busy = true;
    var tpl = SHOW[idx];
    QRO.renderTemplate(heroCanvas, tpl, text(), 640).then(function () {
      nameEl.textContent = tpl.name;
      Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle('on', i === idx); });
      if (animate) { heroCanvas.classList.remove('pop'); void heroCanvas.offsetWidth; heroCanvas.classList.add('pop'); }
      busy = false;
    }).catch(function () { busy = false; });
  }
  function cycle() { clearInterval(timer); timer = setInterval(function () { idx = (idx + 1) % SHOW.length; draw(true); }, 3400); }
  draw(false); cycle();
  Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.style.cursor = 'pointer'; d.addEventListener('click', function () { idx = i; draw(true); cycle(); }); });

  var deb;
  input.addEventListener('input', function () {
    typed = input.value; clearTimeout(deb);
    deb = setTimeout(function () { try { draw(false); } catch (e) {} }, 140);
  });

  /* ---------- paste + submit ---------- */
  $('#paste').addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (t) {
        if (t) { input.value = t.trim(); typed = input.value; draw(false); input.focus(); } else QRO.toast('Clipboard is empty');
      }).catch(function () { QRO.toast('Allow clipboard access, or press Ctrl/⌘ + V in the box'); input.focus(); });
    } else { QRO.toast('Press Ctrl/⌘ + V in the box'); input.focus(); }
  });

  $('#urlform').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) {
      var f = $('#urlform'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      QRO.toast('Pehle apna link paste karo'); input.focus(); return;
    }
    var st = QRO.store.get('studio', null) || QRO.defaultState();
    st.type = 'url'; st.fields = { url: v };
    QRO.store.set('studio', st);
    QRO.navigate('studio.html?go=1');
  });

  /* ---------- bento mini visuals ---------- */
  var mock = $('#mockqr');
  if (mock) {
    QRO.renderTemplate(mock, QRO.TEMPLATES[0], SAMPLE, 320);
    var mi = 0, mt = [QRO.TEMPLATES[8], QRO.TEMPLATES[23], QRO.TEMPLATES[0], QRO.TEMPLATES[33]];
    setInterval(function () { mi = (mi + 1) % mt.length; QRO.renderTemplate(mock, mt[mi], SAMPLE, 320); }, 2600);
  }
  var sr = $('#shapeRow');
  QRO.BODY_SHAPES.forEach(function (s) {
    var c = document.createElement('canvas'); c.width = c.height = 96; c.title = s[1];
    QRO.previewBody(c, s[0], '#F7EFE7'); sr.appendChild(c);
  });
  var sg = $('#swGrid');
  QRO.PALETTES.forEach(function (p) {
    var i = document.createElement('i'); i.title = p.name;
    i.style.background = 'linear-gradient(135deg,' + p.c1 + ' 0 50%,' + (p.solid ? p.bg : p.c2) + ' 50% 100%)';
    sg.appendChild(i);
  });
  var ir = $('#iconRow');
  QRO.ICONS.slice(0, 12).forEach(function (ic) {
    var im = document.createElement('img'); im.src = ic.src; im.alt = ic.name; im.width = im.height = 42; ir.appendChild(im);
  });

  /* ---------- template teaser ---------- */
  var grid = $('#tplGrid');
  [2, 10, 25, 33, 34, 41, 48, 55].forEach(function (id) {
    var t = QRO.TEMPLATES[id - 1];
    var a = document.createElement('a'); a.className = 'tpl-card'; a.href = 'studio.html?t=' + t.id; a.setAttribute('data-reveal', '');
    var c = document.createElement('canvas'); c.width = c.height = 420;
    a.appendChild(c);
    var s = document.createElement('span'); s.innerHTML = '<b></b><em></em>'; s.firstChild.textContent = t.name; s.lastChild.textContent = t.cat; a.appendChild(s);
    grid.appendChild(a);
    QRO.renderTemplate(c, t, SAMPLE, 420);
  });
  var cards = grid.children;
  Array.prototype.forEach.call(cards, function (c, i) { c.style.setProperty('--d', (i % 4) * 0.07 + 's'); });
})();
