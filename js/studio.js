/* Studio — full-control QR designer */
(function () {
  'use strict';
  var QRO = window.QRO, $ = QRO.$, $$ = QRO.$$;
  var DEF = QRO.defaultState();
  var SAMPLE = 'https://your-link.com';

  /* ======================================================== state */
  var st = load();
  var ex = { logoImg: null, logoThumb: '', bgImg: null, bgThumb: '' };
  var last = { matrix: null };

  function load() {
    var saved = QRO.store.get('studio', null) || {};
    var s = Object.assign({}, DEF, saved);
    s.fg = Object.assign({}, DEF.fg, saved.fg || {});
    s.all = saved.all && typeof saved.all === 'object' ? saved.all : {};
    s.fields = saved.fields && typeof saved.fields === 'object' ? saved.fields : {};
    s.all[s.type] = s.fields;
    if (s.logoKind === 'upload') { s.logoKind = ''; }           // uploads are not persisted
    if (s.logoKind === 'preset' && !s.logoId) s.logoKind = '';
    return s;
  }

  function getp(path) {
    if (path === 'hasLogo') return !!ex.logoImg;
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, st);
  }
  function setp(path, v) {
    var ks = path.split('.'), o = st;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
  }
  function isHex(v) { return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v); }

  /* ======================================================== rail + panes */
  var ICON = {
    content: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.7-1.7"/>',
    shapes: '<rect x="3" y="3" width="7" height="7" rx="2"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M6.5 14l3.5 7H3z"/><rect x="14" y="14" width="7" height="7" rx="3.5"/>',
    colors: '<path d="M12 3C7 8.5 5 11.5 5 14.5a7 7 0 0 0 14 0C19 11.5 17 8.5 12 3z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    background: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
    logo: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    frame: '<rect x="3" y="3" width="18" height="14" rx="3"/><path d="M7 21h10"/><path d="M9 10h6"/>',
    'export': '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'
  };
  var TABS = [['content', 'Content'], ['shapes', 'Shapes'], ['colors', 'Colours'], ['background', 'Backdrop'], ['logo', 'Logo'], ['frame', 'Label'], ['export', 'Export']];
  var rail = $('#rail');
  TABS.forEach(function (t, i) {
    var b = document.createElement('button');
    b.setAttribute('role', 'tab'); b.setAttribute('data-tab', t[0]); b.setAttribute('aria-selected', 'false');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[t[0]] + '</svg><span>' + t[1] + '</span>';
    rail.appendChild(b);
  });
  function showTab(id) {
    $$('.pane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== id; });
    $$('#rail button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === id)); });
    $('#panel').scrollTop = 0;
    QRO.store.set('studioTab', id);
  }
  rail.addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (b) showTab(b.getAttribute('data-tab')); });

  $('#brandMark').innerHTML = QRO.LOGO_SVG;

  /* ======================================================== content */
  function typeDef(id) { return QRO.CONTENT_TYPES.filter(function (t) { return t.id === id; })[0] || QRO.CONTENT_TYPES[0]; }
  function buildTypeChips() {
    var h = '';
    QRO.CONTENT_TYPES.forEach(function (t) { h += '<button data-type="' + t.id + '">' + t.name + '</button>'; });
    $('#typeChips').innerHTML = h;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderFields() {
    var def = typeDef(st.type), h = '';
    def.fields.forEach(function (f) {
      var id = 'f_' + f.k;
      h += '<div class="field"><label for="' + id + '">' + f.l + '</label>';
      if (f.t === 'textarea') h += '<textarea class="input" id="' + id + '" data-field="' + f.k + '" placeholder="' + esc(f.p || '') + '"></textarea>';
      else if (f.t === 'select') h += '<select class="input" id="' + id + '" data-field="' + f.k + '">' + f.o.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select>';
      else {
        var type = f.t === 'url' ? 'text' : f.t;
        h += '<input class="input" id="' + id + '" data-field="' + f.k + '" type="' + type + '"' + (f.t === 'url' ? ' inputmode="url" autocapitalize="off" spellcheck="false"' : '') + (f.t === 'number' ? ' step="any" min="0"' : '') + ' placeholder="' + esc(f.p || '') + '" autocomplete="off">';
      }
      h += '</div>';
    });
    $('#fields').innerHTML = h;
    $$('#fields [data-field]').forEach(function (el) {
      var v = st.fields[el.getAttribute('data-field')];
      if (v != null) el.value = v;
    });
  }
  function setType(id) {
    st.all[st.type] = st.fields;
    st.type = id; st.fields = st.all[id] || (st.all[id] = {});
    renderFields(); syncUI(); change();
  }
  function content() { return QRO.buildContent(st.type, st.fields); }

  /* ======================================================== grids (shapes, palettes, icons) */
  function shapeGrid(host, list, kind, previewFn) {
    var h = $(host);
    list.forEach(function (s) {
      var b = document.createElement('button');
      b.setAttribute('data-shape', kind); b.setAttribute('data-val', s[0]); b.title = s[1];
      var c = document.createElement('canvas'); c.width = c.height = 120;
      previewFn(c, s[0]);
      var l = document.createElement('span'); l.className = 'lbl'; l.textContent = s[1];
      b.appendChild(c); b.appendChild(l); h.appendChild(b);
    });
  }
  function buildGrids() {
    shapeGrid('#gBody', QRO.BODY_SHAPES, 'body', function (c, v) { QRO.previewBody(c, v, '#F7EFE7'); });
    shapeGrid('#gFrame', QRO.EYE_FRAMES, 'eyeFrame', function (c, v) { QRO.previewEye(c, v, 'square', '#F7EFE7'); });
    shapeGrid('#gBall', QRO.EYE_BALLS, 'eyeBall', function (c, v) { QRO.previewEye(c, 'square', v, '#F7EFE7'); });
    var pg = $('#palGrid'), h = '';
    QRO.PALETTES.forEach(function (p) {
      h += '<button data-pal="' + p.id + '" title="' + p.name + '" aria-label="' + p.name + '" style="background:' + p.bg + '"><i style="background:linear-gradient(135deg,' + p.c1 + ',' + p.c2 + ')"></i></button>';
    });
    pg.innerHTML = h; $('#palCount').textContent = QRO.PALETTES.length + ' combos';
    var ig = $('#iconGrid'), ih = '<button class="none" data-icon="" title="No logo">None</button>';
    QRO.ICONS.forEach(function (ic) { ih += '<button data-icon="' + ic.id + '" title="' + ic.name + '" aria-label="' + ic.name + '"><img src="' + ic.src + '" alt="" width="48" height="48"></button>'; });
    ig.innerHTML = ih;
    var fc = ['SCAN ME', 'FOLLOW US', 'VISIT WEBSITE', 'CHAT ON WHATSAPP', 'SCAN & PAY', 'VIEW MENU', 'JOIN WI-FI'];
    $('#frameChips').innerHTML = fc.map(function (t) { return '<button data-frametext="' + t + '">' + t + '</button>'; }).join('');
  }

  /* ======================================================== sync UI ← state */
  function evalWhen(expr) {
    return expr.split('|').some(function (term) {
      var m;
      if ((m = term.match(/^(.+?)!=(.+)$/))) return String(getp(m[1])) !== m[2];
      if ((m = term.match(/^(.+?)=(.+)$/))) return String(getp(m[1])) === m[2];
      return !!getp(term);
    });
  }
  var FMT = { pct: function (v) { return Math.round(v * 100) + '%'; }, deg: function (v) { return Math.round(v) + '°'; }, mod: function (v) { return v + ' modules'; } };

  function setRangeFill(el) {
    var min = +el.min, max = +el.max, v = +el.value;
    el.style.setProperty('--p', ((v - min) / (max - min) * 100) + '%');
  }

  function syncUI() {
    $$('[data-bind]').forEach(function (el) {
      var path = el.getAttribute('data-bind'), v = getp(path);
      if (el.type === 'color') el.value = isHex(v) ? v : (isHex(st.fg.c1) ? st.fg.c1 : '#000000');
      else if (el.type === 'range') { el.value = v * (parseFloat(el.getAttribute('data-scale')) || 1); setRangeFill(el); }
      else if (document.activeElement !== el) el.value = v == null ? '' : v;
    });
    $$('[data-hex]').forEach(function (el) {
      var v = getp(el.getAttribute('data-hex'));
      el.textContent = isHex(v) ? v : (el.getAttribute('data-empty') || '');
    });
    $$('[data-out]').forEach(function (el) { el.textContent = FMT[el.getAttribute('data-fmt')](getp(el.getAttribute('data-out'))); });
    $$('[data-set]').forEach(function (el) { el.classList.toggle('on', String(getp(el.getAttribute('data-set'))) === el.getAttribute('data-val')); });
    $$('[data-toggle]').forEach(function (el) { var on = !!getp(el.getAttribute('data-toggle')); el.classList.toggle('on', on); el.setAttribute('aria-checked', String(on)); });
    $$('[data-when]').forEach(function (el) { el.classList.toggle('gone', !evalWhen(el.getAttribute('data-when'))); });
    $$('[data-type]').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-type') === st.type); });
    $$('[data-shape]').forEach(function (el) { el.classList.toggle('on', st[el.getAttribute('data-shape')] === el.getAttribute('data-val')); });
    $$('[data-icon]').forEach(function (el) { el.classList.toggle('on', st.logoKind === 'preset' ? el.getAttribute('data-icon') === st.logoId : (!ex.logoImg && el.getAttribute('data-icon') === '')); });
    $$('[data-pal]').forEach(function (el) {
      var p = QRO.PALETTES[+el.getAttribute('data-pal')];
      el.classList.toggle('on', p.c1.toLowerCase() === st.fg.c1.toLowerCase() && (p.solid ? st.fg.type === 'solid' : p.c2.toLowerCase() === st.fg.c2.toLowerCase()) && p.bg.toLowerCase() === st.bg.toLowerCase());
    });
    $$('[data-frametext]').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-frametext') === st.frameText); });

    // thumbs
    var lt = $('#logoThumb'), bt = $('#bgThumb');
    var imgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>';
    lt.innerHTML = ex.logoThumb ? '<img alt="" src="' + ex.logoThumb + '">' : imgIcon;
    bt.innerHTML = ex.bgThumb ? '<img alt="" src="' + ex.bgThumb + '">' : imgIcon;
    $('#btnLogoClear').hidden = !(ex.logoImg && st.logoKind === 'upload');
    $('#btnBgClear').hidden = !ex.bgImg;

    // text
    $('#bgNote').textContent = { small: 'Tight card around the code on a coloured canvas.', center: 'Code sits on a floating card in the middle of a larger canvas.', full: 'The background colour fills the entire image.', none: 'Transparent PNG — no background at all.' }[st.bgMode];
    $('#dlLabel').textContent = 'Download ' + (st.exportFmt === 'jpg' ? 'JPG' : 'PNG');
    var lay = QRO.layout({ size: st.exportSize, frame: st.frameOn });
    $('#sizeInfo').textContent = lay.w + ' × ' + lay.h + ' px';
    var enc = content();
    $('#encoded').innerHTML = '<b>Encoded content</b>' + (enc ? esc(enc.length > 300 ? enc.slice(0, 300) + '…' : enc) : 'Nothing yet — fill in the fields above.');
    updateScanHealth();
    if (st.exportFmt === 'jpg' && st.bgMode === 'none') { /* jpg flattens onto white */ }
  }

  function updateScanHealth() {
    var box = $('#contrast'), badge = $('#statScan'), cls, text, r;
    if (st.bgMode === 'none') { cls = 'neutral'; text = 'Transparent background — place it on a plain, contrasting surface.'; }
    else {
      var cs = [QRO.contrast(st.fg.c1, st.bg)];
      if (st.fg.type !== 'solid') cs.push(QRO.contrast(st.fg.c2, st.bg));
      if (isHex(st.eyeFrameColor)) cs.push(QRO.contrast(st.eyeFrameColor, st.bg));
      if (isHex(st.eyeBallColor)) cs.push(QRO.contrast(st.eyeBallColor, st.bg));
      r = Math.min.apply(null, cs);
      var inverted = QRO.luminance(st.fg.c1) > QRO.luminance(st.bg);
      if (r >= 4.5) { cls = 'good'; text = 'Great contrast (' + r.toFixed(1) + ':1)' + (inverted ? ' — light on dark, most phones read this fine' : ' — scan-safe'); }
      else if (r >= 3) { cls = 'warn'; text = 'Okay contrast (' + r.toFixed(1) + ':1) — do a test scan before printing'; }
      else { cls = 'bad'; text = 'Low contrast (' + r.toFixed(1) + ':1) — may not scan. Darken the code or lighten the background.'; }
    }
    box.className = 'contrast ' + cls; box.innerHTML = '<i></i><span>' + text + '</span>';
    badge.innerHTML = '<i style="background:' + { good: '#7CE3A1', warn: '#F6C667', bad: '#FF7A8A', neutral: '#9E8189' }[cls] + '"></i>' + { good: 'Scan-safe', warn: 'Test scan', bad: 'Low contrast', neutral: 'Transparent' }[cls];
    badge.title = text;
  }

  /* ======================================================== painting */
  var stageArea = $('#stageArea'), prev = $('#preview'), checker = $('#checker'), raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); }); }
  function paint() {
    var text = content(), sample = !text, use = text || SAMPLE;
    var cs = getComputedStyle(stageArea);
    var availW = stageArea.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var availH = stageArea.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var lay = QRO.layout({ size: 1, frame: st.frameOn });
    var ratio = (1 + (lay.barH ? 0.17 : 0));
    var cssW = Math.max(160, Math.min(availW, availH / ratio, 720));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var px = Math.round(Math.min(1400, Math.max(320, cssW * dpr)));
    try {
      var res = QRO.renderState(prev, use, st, ex, px);
      last.matrix = res.matrix;
      prev.style.width = cssW + 'px'; prev.style.height = (cssW * prev.height / prev.width) + 'px';
      $('#statInfo').textContent = 'Version ' + res.matrix.version + ' · ' + res.matrix.size + '×' + res.matrix.size + ' modules · ECC ' + res.matrix.ecc;
    } catch (err) {
      $('#statInfo').textContent = err.message;
      QRO.toast(err.message);
    }
    $('#sampleBadge').hidden = !sample;
  }
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(stageArea); else window.addEventListener('resize', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

  /* ======================================================== persistence + history */
  var saveT, histT, hist = [], pos = -1, lastSnap = '';
  function snapshot() { return JSON.stringify(st); }
  function change() {
    schedule(); updateScanHealth(); syncLight();
    clearTimeout(saveT); saveT = setTimeout(function () { QRO.store.set('studio', st); }, 300);
    clearTimeout(histT); histT = setTimeout(pushHist, 380);
  }
  function syncLight() {
    // cheap updates for live dragging (no DOM rebuild)
    $$('[data-hex]').forEach(function (el) { var v = getp(el.getAttribute('data-hex')); el.textContent = isHex(v) ? v : (el.getAttribute('data-empty') || ''); });
    $$('[data-out]').forEach(function (el) { el.textContent = FMT[el.getAttribute('data-fmt')](getp(el.getAttribute('data-out'))); });
    $$('[data-when]').forEach(function (el) { el.classList.toggle('gone', !evalWhen(el.getAttribute('data-when'))); });
    var enc = content();
    $('#encoded').innerHTML = '<b>Encoded content</b>' + (enc ? esc(enc.length > 300 ? enc.slice(0, 300) + '…' : enc) : 'Nothing yet — fill in the fields above.');
  }
  function pushHist() {
    var s = snapshot(); if (s === lastSnap) return;
    hist.length = pos + 1; hist.push(s); if (hist.length > 80) hist.shift(); pos = hist.length - 1; lastSnap = s; updHistBtns();
  }
  function updHistBtns() { $('#btnUndo').disabled = pos <= 0; $('#btnRedo').disabled = pos >= hist.length - 1; }
  function restore(i) {
    var s = JSON.parse(hist[i]); pos = i; lastSnap = hist[i];
    if (s.logoKind === 'upload' && !ex.logoImg) { s.logoKind = ''; }
    st = s; st.all = st.all || {}; st.all[st.type] = st.fields;
    afterStyleChange(false);
  }
  $('#btnUndo').addEventListener('click', function () { clearTimeout(histT); pushHist(); if (pos > 0) restore(pos - 1); });
  $('#btnRedo').addEventListener('click', function () { if (pos < hist.length - 1) restore(pos + 1); });
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !/range|color|checkbox/.test(t.type)));
    if (!(e.ctrlKey || e.metaKey) || typing) return;
    var k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); $('#btnUndo').click(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); $('#btnRedo').click(); }
    else if (k === 's') { e.preventDefault(); exportNow(); }
  });

  /* ======================================================== helpers: logo/bg images */
  function afterStyleChange(addHist) {
    var jobs = [];
    if (st.logoKind === 'preset' && st.logoId) jobs.push(QRO.iconImage(st.logoId).then(function (im) { ex.logoImg = im; ex.logoThumb = ''; }));
    else if (st.logoKind !== 'upload') { ex.logoImg = null; ex.logoThumb = ''; }
    return Promise.all(jobs).then(function () {
      renderFields(); syncUI(); schedule();
      QRO.store.set('studio', st);
      if (addHist !== false) { clearTimeout(histT); pushHist(); } else updHistBtns();
    });
  }
  function readImage(file) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error('No file'));
      if (!/^image\//.test(file.type)) return rej(new Error('Please choose an image file'));
      if (file.size > 12 * 1024 * 1024) return rej(new Error('Image is too large (max 12 MB)'));
      var fr = new FileReader();
      fr.onload = function () { QRO.loadImage(fr.result).then(function (im) { res({ img: im, url: fr.result }); }, rej); };
      fr.onerror = function () { rej(new Error('Could not read the image')); };
      fr.readAsDataURL(file);
    });
  }
  function downscale(info, max) {
    // keep memory reasonable: draw to canvas if very large
    var im = info.img, w = im.naturalWidth, h = im.naturalHeight;
    if (Math.max(w, h) <= max) return info;
    var s = max / Math.max(w, h), c = document.createElement('canvas');
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return { img: c, url: c.toDataURL('image/png') };
  }

  $('#btnLogoPick').addEventListener('click', function () { $('#fileLogo').click(); });
  $('#fileLogo').addEventListener('change', function (e) {
    readImage(e.target.files[0]).then(function (r) {
      r = downscale(r, 1024);
      ex.logoImg = r.img; ex.logoThumb = r.url; st.logoKind = 'upload'; st.logoId = '';
      if (st.logoSize > 0.26) st.logoSize = 0.22;
      syncUI(); change(); QRO.toast('Logo added — error correction set to High');
    }).catch(function (er) { QRO.toast(er.message); });
    e.target.value = '';
  });
  $('#btnLogoClear').addEventListener('click', function () { st.logoKind = ''; st.logoId = ''; ex.logoImg = null; ex.logoThumb = ''; syncUI(); change(); });

  $('#btnBgPick').addEventListener('click', function () { $('#fileBg').click(); });
  $('#fileBg').addEventListener('change', function (e) {
    readImage(e.target.files[0]).then(function (r) {
      r = downscale(r, 2048);
      ex.bgImg = r.img; ex.bgThumb = r.url; syncUI(); change(); QRO.toast('Background image added');
    }).catch(function (er) { QRO.toast(er.message); });
    e.target.value = '';
  });
  $('#btnBgClear').addEventListener('click', function () { ex.bgImg = null; ex.bgThumb = ''; syncUI(); change(); });

  /* ======================================================== generic event wiring */
  var panel = $('#panel');
  panel.addEventListener('input', function (e) {
    var t = e.target, path = t.getAttribute && t.getAttribute('data-bind');
    if (path) {
      var v = t.value;
      if (t.type === 'range') { v = parseFloat(v) / (parseFloat(t.getAttribute('data-scale')) || 1); setRangeFill(t); }
      setp(path, v); change(); return;
    }
    var f = t.getAttribute && t.getAttribute('data-field');
    if (f) { st.fields[f] = t.value; change(); }
  });
  panel.addEventListener('change', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-field');
    if (f && e.target.tagName === 'SELECT') { st.fields[f] = e.target.value; change(); }
    if (e.target.getAttribute && e.target.getAttribute('data-bind')) syncUI();
  });
  panel.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-set]'))) {
      var v = el.getAttribute('data-val'); if (el.hasAttribute('data-num')) v = Number(v);
      var path = el.getAttribute('data-set');
      setp(path, v);
      if (path === 'fg.type' && v !== 'solid' && st.fg.c1.toLowerCase() === st.fg.c2.toLowerCase()) st.fg.c2 = st.bg === '#FFFFFF' ? '#9E8189' : st.bg;
      syncUI(); change(); return;
    }
    if ((el = e.target.closest('[data-toggle]'))) { var p = el.getAttribute('data-toggle'); setp(p, !getp(p)); syncUI(); change(); return; }
    if ((el = e.target.closest('[data-type]'))) { setType(el.getAttribute('data-type')); return; }
    if ((el = e.target.closest('[data-shape]'))) { setp(el.getAttribute('data-shape'), el.getAttribute('data-val')); syncUI(); change(); return; }
    if ((el = e.target.closest('[data-pal]'))) { applyPalette(QRO.PALETTES[+el.getAttribute('data-pal')]); return; }
    if ((el = e.target.closest('[data-icon]'))) { chooseIcon(el.getAttribute('data-icon')); return; }
    if ((el = e.target.closest('[data-frametext]'))) { st.frameText = el.getAttribute('data-frametext'); st.frameOn = true; syncUI(); change(); return; }
  });
  $('#btnEyeReset').addEventListener('click', function () { st.eyeFrameColor = ''; st.eyeBallColor = ''; syncUI(); change(); });

  function applyPalette(p) {
    st.fg = { type: p.solid ? 'solid' : (st.fg.type === 'radial' ? 'radial' : 'linear'), c1: p.c1, c2: p.c2, angle: st.fg.angle };
    st.bg = p.bg; st.eyeFrameColor = ''; st.eyeBallColor = '';
    st.frameColor = p.c1; st.frameTextColor = p.bg;
    syncUI(); change();
  }
  function chooseIcon(id) {
    if (!id) { st.logoKind = ''; st.logoId = ''; ex.logoImg = null; ex.logoThumb = ''; syncUI(); change(); return; }
    QRO.iconImage(id).then(function (im) {
      ex.logoImg = im; ex.logoThumb = ''; st.logoKind = 'preset'; st.logoId = id;
      if (st.logoSize > 0.26) st.logoSize = 0.22;
      syncUI(); change();
    });
  }

  /* ======================================================== top-bar actions */
  function rand(a) { return a[Math.floor(Math.random() * a.length)]; }
  $('#btnRandom').addEventListener('click', function () {
    var p = rand(QRO.PALETTES);
    st.body = rand(['square', 'rounded', 'liquid', 'classy', 'dots', 'pearl', 'diamond', 'bars', 'hbars', 'rounded', 'dots', 'liquid']);
    st.eyeFrame = rand(QRO.EYE_FRAMES)[0];
    st.eyeBall = rand(['square', 'rounded', 'circle', 'diamond', 'leaf', 'circle']);
    st.fg = { type: p.solid ? 'solid' : rand(['linear', 'radial', 'linear']), c1: p.c1, c2: p.c2, angle: rand([0, 45, 90, 135]) };
    st.bg = p.bg; st.eyeFrameColor = ''; st.eyeBallColor = '';
    st.bgMode = rand(['full', 'full', 'center', 'small']);
    st.outer = rand(['#C7A9A3', '#3E3239', '#E8D2C4', '#6B5560', p.c1]);
    st.frameColor = p.c1; st.frameTextColor = p.bg;
    syncUI(); change();
  });
  $('#btnReset').addEventListener('click', function () {
    var keep = { type: st.type, fields: st.fields, all: st.all };
    st = Object.assign({}, QRO.defaultState(), keep);
    ex.logoImg = null; ex.logoThumb = ''; ex.bgImg = null; ex.bgThumb = '';
    syncUI(); change(); QRO.toast('Style reset');
  });

  /* ======================================================== export */
  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([document.fonts.load('800 40px Syne'), new Promise(function (r) { setTimeout(r, 900); })]).catch(function () {});
  }
  function fileName() {
    var n = (st.filename || 'qr-code').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'qr-code';
    return n + '.' + (st.exportFmt === 'jpg' ? 'jpg' : 'png');
  }
  function makeBlob() {
    return ensureFonts().then(function () {
      var c = document.createElement('canvas');
      QRO.renderState(c, content(), st, ex, st.exportSize);
      return QRO.exportBlob(c, st.exportFmt, st.quality, '#ffffff').then(function (b) { return { blob: b, w: c.width, h: c.height }; });
    });
  }
  function needContent() {
    if (content()) return false;
    QRO.toast('Pehle content daalo, phir download karo');
    showTab('content');
    var first = $('#fields [data-field]'); if (first) first.focus();
    return true;
  }
  function exportNow() {
    if (needContent()) return;
    var btns = [$('#btnDownload'), $('#btnDownload2')]; btns.forEach(function (b) { b.disabled = true; });
    makeBlob().then(function (r) {
      if (!r.blob) throw new Error('Export failed — try a smaller size');
      var a = document.createElement('a'), url = URL.createObjectURL(r.blob);
      a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      QRO.toast('Downloaded ✓  ' + r.w + '×' + r.h + ' ' + (st.exportFmt === 'jpg' ? 'JPG' : 'PNG'));
    }).catch(function (er) { QRO.toast(er.message || 'Export failed'); })
      .then(function () { btns.forEach(function (b) { b.disabled = false; }); });
  }
  $('#btnDownload').addEventListener('click', exportNow);
  $('#btnDownload2').addEventListener('click', exportNow);
  $('#btnCopy').addEventListener('click', function () {
    if (needContent()) return;
    if (!(navigator.clipboard && window.ClipboardItem)) { QRO.toast('Copy is not supported here — use Download'); return; }
    var fmt = st.exportFmt; st.exportFmt = 'png';
    makeBlob().then(function (r) {
      st.exportFmt = fmt;
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': r.blob })]).then(function () { QRO.toast('Image copied to clipboard'); });
    }).catch(function () { st.exportFmt = fmt; QRO.toast('Could not copy — use Download'); });
  });

  /* ======================================================== init */
  function applyTemplate(tpl) {
    var s = QRO.templateToState(tpl);
    Object.keys(s).forEach(function (k) { if (k !== 'logoId') st[k] = s[k]; });
    if (s.logoId) { st.logoId = s.logoId; st.logoKind = 'preset'; } else if (st.logoKind === 'preset') { st.logoId = ''; st.logoKind = ''; }
    st.fg = Object.assign({}, st.fg);
  }
  function boot() {
    buildTypeChips(); buildGrids();
    var q = new URLSearchParams(location.search), touched = false;
    if (q.get('type') && QRO.CONTENT_TYPES.some(function (t) { return t.id === q.get('type'); })) {
      st.all[st.type] = st.fields; st.type = q.get('type'); st.fields = st.all[st.type] || (st.all[st.type] = {}); touched = true;
    }
    if (q.get('url')) { st.all[st.type] = st.fields; st.type = 'url'; st.fields = st.all.url || (st.all.url = {}); st.fields.url = q.get('url'); touched = true; }
    if (q.get('t')) { var tpl = QRO.TEMPLATES[(+q.get('t')) - 1]; if (tpl) { applyTemplate(tpl); touched = true; } }
    if (touched || q.get('go')) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
    st.all[st.type] = st.fields;

    var tab = QRO.store.get('studioTab', 'content');
    if (q.get('t') || q.get('go')) tab = q.get('go') ? 'shapes' : 'colors';
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = 'content';
    showTab(tab);
    renderFields();
    afterStyleChange(false).then(function () {
      lastSnap = snapshot(); hist = [lastSnap]; pos = 0; updHistBtns(); paint();
      QRO.onReady(function () { var y = document.activeElement; if (!content() && !('ontouchstart' in window)) { var f = $('#fields [data-field]'); if (f && tab === 'content') f.focus({ preventScroll: true }); } });
    });
  }
  boot();
  QRO._studio = { get st() { return st; }, ex: ex, paint: paint, content: content };
})();
