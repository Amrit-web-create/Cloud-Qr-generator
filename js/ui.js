/*!
 * QR Generator — shared UI behaviour
 * loader · pixel page transitions · nav/footer · reveal · split text · tilt · magnetic · counters · toast · store
 */
(function (root) {
  'use strict';
  var QRO = root.QRO = root.QRO || {};
  var doc = document, html = doc.documentElement;
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ safe storage */
  var mem = {};
  QRO.store = {
    get: function (k, d) {
      try { var v = root.localStorage.getItem('qro:' + k); return v ? JSON.parse(v) : d; }
      catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d; }
    },
    set: function (k, v) { try { root.localStorage.setItem('qro:' + k, JSON.stringify(v)); } catch (e) { mem[k] = v; } },
    del: function (k) { try { root.localStorage.removeItem('qro:' + k); } catch (e) { delete mem[k]; } }
  };
  function ss(k, v) {
    try { if (v === undefined) return root.sessionStorage.getItem(k); if (v === null) root.sessionStorage.removeItem(k); else root.sessionStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ------------------------------------------------ small helpers */
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  QRO.$ = $; QRO.$$ = $$;

  var toastEl, toastT;
  QRO.toast = function (msg) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  };

  var readyCbs = [], isReady = false;
  QRO.onReady = function (cb) { if (isReady) cb(); else readyCbs.push(cb); };
  function fireReady() {
    if (isReady) return; isReady = true; html.classList.add('ready');
    readyCbs.splice(0).forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
  }

  /* ------------------------------------------------ chrome (nav, footer, ambient) */
  var LOGO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 3h8v8H3zM5 5v4h4V5zM13 3h8v8h-8zM15 5v4h4V5zM3 13h8v8H3zM5 15v4h4v-4z"/><rect x="6" y="6" width="2" height="2" rx=".5"/><rect x="16" y="6" width="2" height="2" rx=".5"/><rect x="6" y="16" width="2" height="2" rx=".5"/><rect x="13" y="13" width="3.4" height="3.4" rx=".9"/><rect x="17.6" y="13" width="3.4" height="3.4" rx=".9"/><rect x="13" y="17.6" width="3.4" height="3.4" rx=".9"/><rect x="17.6" y="17.6" width="3.4" height="3.4" rx=".9"/></svg>';
  QRO.LOGO_SVG = LOGO;
  var ARROW = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  QRO.ARROW_SVG = ARROW;

  var PAGES = [['index.html', 'Home', 'home'], ['studio.html', 'Studio', 'studio'], ['templates.html', 'Templates', 'templates'], ['about.html', 'About', 'about']];

  function mountChrome() {
    var page = doc.body.getAttribute('data-page') || 'home';
    var amb = doc.createElement('div'); amb.className = 'ambient'; amb.setAttribute('aria-hidden', 'true');
    var gr = doc.createElement('div'); gr.className = 'grain'; gr.setAttribute('aria-hidden', 'true');
    var cg = doc.createElement('div'); cg.className = 'cursor-glow'; cg.setAttribute('aria-hidden', 'true');
    doc.body.insertBefore(cg, doc.body.firstChild); doc.body.insertBefore(gr, doc.body.firstChild); doc.body.insertBefore(amb, doc.body.firstChild);
    initCursor(cg);

    if (page === 'studio') return;   // studio has its own top bar

    var links = PAGES.map(function (p) { return '<a href="' + p[0] + '"' + (p[2] === page ? ' aria-current="page"' : '') + '>' + p[1] + '</a>'; }).join('');
    var nav = doc.createElement('header'); nav.className = 'nav'; nav.id = 'nav';
    nav.innerHTML = '<div class="container nav-in">' +
      '<a class="brand" href="index.html" aria-label="QR Generator home"><span class="brand-mark">' + LOGO + '</span><span>QR <span class="serif" style="font-weight:500;color:var(--dusty)">generator</span></span></a>' +
      '<nav class="nav-links" aria-label="Main">' + links + '</nav>' +
      '<div class="nav-cta"><a class="btn btn-primary btn-sm" href="studio.html" data-magnetic>Open Studio ' + ARROW + '</a>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="mmenu"><span></span></button></div></div>';
    cg.insertAdjacentElement('afterend', nav);
    var mm = doc.createElement('div'); mm.className = 'mobile-menu'; mm.id = 'mmenu';
    mm.innerHTML = links; doc.body.appendChild(mm);
    var bg = $('#burger');
    bg.addEventListener('click', function () {
      var open = !mm.classList.contains('open');
      mm.classList.toggle('open', open); bg.setAttribute('aria-expanded', String(open));
      html.style.overflow = open ? 'hidden' : '';
    });

    var last = 0;
    root.addEventListener('scroll', function () {
      var y = root.scrollY;
      nav.classList.toggle('scrolled', y > 20);
      nav.classList.toggle('hide', y > last && y > 400 && !mm.classList.contains('open'));
      last = y;
    }, { passive: true });

    var f = doc.createElement('footer'); f.className = 'footer';
    f.innerHTML = '<div class="container"><div class="footer-grid">' +
      '<div><a class="brand" href="index.html"><span class="brand-mark">' + LOGO + '</span><span>QR <span class="serif" style="font-weight:500;color:var(--dusty)">generator</span></span></a>' +
      '<p class="lead" style="margin-top:16px;font-size:15px">Design QR codes that look like your brand. Free, private and runs entirely in your browser.</p></div>' +
      '<div><h4>Explore</h4><ul><li><a href="index.html">Home</a></li><li><a href="studio.html">Studio</a></li><li><a href="templates.html">Templates</a></li><li><a href="about.html">About</a></li></ul></div>' +
      '<div><h4>Create</h4><ul><li><a href="studio.html?type=url">Website QR</a></li><li><a href="studio.html?type=whatsapp">WhatsApp QR</a></li><li><a href="studio.html?type=wifi">Wi-Fi QR</a></li><li><a href="studio.html?type=upi">UPI QR</a></li></ul></div></div>' +
      '<div class="footer-big" aria-hidden="true">QR GENERATOR</div>' +
      '<div class="footer-bot"><span>© <span id="yr">2026</span> QR Generator. All rights reserved.</span><span>Your data never leaves your device.</span></div></div>';
    doc.body.appendChild(f);
    var yr = $('#yr', f); if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------ cursor glow */
  function initCursor(el) {
    if (reduce || !root.matchMedia('(pointer: fine)').matches) return;
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    root.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; el.style.opacity = 1;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      x += (tx - x) * .12; y += (ty - y) * .12;
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > .5) ? requestAnimationFrame(loop) : 0;
    }
  }

  /* ------------------------------------------------ pixel transition */
  var px, pxMax = 0;
  function buildPx() {
    px = doc.createElement('div'); px.id = 'px'; px.setAttribute('aria-hidden', 'true');
    var size = root.innerWidth < 700 ? 56 : 84;
    var cols = Math.ceil(root.innerWidth / size), rows = Math.ceil(root.innerHeight / size);
    px.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    px.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    var frag = doc.createDocumentFragment();
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = doc.createElement('i'), d = Math.round((c + r) * 22 + Math.random() * 220);
      i.style.setProperty('--dl', d + 'ms'); pxMax = Math.max(pxMax, d); frag.appendChild(i);
    }
    px.appendChild(frag); doc.body.appendChild(px);
  }
  function pxCover(cb) {
    px.classList.add('on'); void px.offsetWidth; px.classList.add('cover');
    setTimeout(cb, pxMax + 480);
  }
  function pxReveal(done) {
    px.classList.remove('cover');
    setTimeout(function () { px.classList.remove('on'); if (done) done(); }, pxMax + 520);
  }

  function interceptLinks() {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname && u.search === location.search) return;
      if (u.pathname === location.pathname && u.hash) return;
      e.preventDefault();
      if (reduce) { location.href = a.href; return; }
      ss('qro-t', '1');
      var mm = $('#mmenu'); if (mm) mm.classList.remove('open');
      pxCover(function () { location.href = a.href; });
    });
    root.addEventListener('pageshow', function (e) {
      if (e.persisted && px) { px.classList.remove('cover', 'on'); html.style.overflow = ''; }
    });
  }
  QRO.navigate = function (href) {
    if (reduce || !px) { location.href = href; return; }
    ss('qro-t', '1'); pxCover(function () { location.href = href; });
  };

  /* ------------------------------------------------ loader */
  function runLoader() {
    var ld = $('#loader');
    var cameByTransition = html.classList.contains('px-in');
    var skip = cameByTransition || html.classList.contains('skip-loader') || reduce;
    ss('qro-seen', '1');

    if (skip) {
      if (ld) ld.parentNode.removeChild(ld);
      if (cameByTransition) {
        px.classList.add('on', 'nt', 'cover');    // start fully covered, no animation (matches ::before cover)
        void px.offsetWidth;
        html.classList.remove('px-in'); ss('qro-t', null);
        setTimeout(function () { px.classList.remove('nt'); pxReveal(); fireReady(); }, 90);
      } else { fireReady(); }
      return;
    }
    var bar = $('#loader-bar'), cnt = $('#loader-count'), p = 0, t0 = performance.now(), fontsOk = false, loaded = doc.readyState === 'complete';
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { fontsOk = true; }); else fontsOk = true;
    root.addEventListener('load', function () { loaded = true; });
    (function tick(now) {
      var el = now - t0;
      var target = Math.min(100, el / 1500 * 100);
      if (!(fontsOk && loaded) && target > 92) target = 92;
      if (el > 3500) target = 100;
      p += (target - p) * .18; if (target >= 100 && p > 99.2) p = 100;
      if (bar) bar.style.width = p + '%'; if (cnt) cnt.textContent = String(Math.round(p)).padStart(3, '0');
      if (p < 100) requestAnimationFrame(tick); else finish();
    })(t0);
    function finish() {
      setTimeout(function () {
        px.style.setProperty('--c', '#181215');
        px.classList.add('on', 'nt', 'cover'); void px.offsetWidth;
        if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
        requestAnimationFrame(function () { requestAnimationFrame(function () { px.classList.remove('nt'); pxReveal(function () { px.style.removeProperty('--c'); }); fireReady(); }); });
      }, 250);
    }
  }

  /* ------------------------------------------------ split text */
  function splitText(el) {
    var idx = 0;
    function walk(node, out) {
      node.childNodes.forEach(function (ch) {
        if (ch.nodeType === 3) {
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var s = doc.createElement('span'); s.style.setProperty('--i', idx++); s.textContent = part;
            w.appendChild(s); out.appendChild(w);
          });
        } else if (ch.nodeType === 1) {
          if (ch.tagName === 'BR') { out.appendChild(ch.cloneNode()); return; }
          var c = ch.cloneNode(false); walk(ch, c); out.appendChild(c);
        }
      });
    }
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var holder = doc.createDocumentFragment(); walk(el, holder);
    el.textContent = ''; el.appendChild(holder); el.setAttribute('aria-label', label);
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    el.classList.add('split');
  }

  /* ------------------------------------------------ reveal, counters, tilt, magnetic */
  function initReveal() {
    $$('[data-split]').forEach(splitText);
    var items = $$('[data-reveal], .split');
    if (!('IntersectionObserver' in root)) { items.forEach(function (i) { i.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        $$('[data-count]', e.target).forEach(countUp);
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (i) { io.observe(i); });
    $$('[data-count]').forEach(function (c) { if (!c.closest('[data-reveal]') && !c.hasAttribute('data-reveal')) io.observe(c); });
  }
  function countUp(el) {
    if (el._counted) return; el._counted = true;
    var end = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '', t0 = performance.now(), dur = 1600;
    (function f(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(end * e) + suf; if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  QRO.bindFx = function (scope) {
    scope = scope || doc;
    $$('[data-tilt]', scope).forEach(function (el) {
      if (el._tilt || reduce) return; el._tilt = true;
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 9) + 'deg) rotateY(' + ((x - .5) * 11) + 'deg) translateZ(0)';
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('[data-magnetic]', scope).forEach(function (el) {
      if (el._mag || reduce) return; el._mag = true;
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  };

  /* ------------------------------------------------ boot */
  function boot() {
    mountChrome();
    buildPx();
    interceptLinks();
    QRO.onReady(function () { initReveal(); QRO.bindFx(); });
    runLoader();
    // safety: never leave page blocked
    setTimeout(function () { if (!isReady) { var l = $('#loader'); if (l && l.parentNode) l.parentNode.removeChild(l); html.classList.remove('px-in'); fireReady(); } }, 6000);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
