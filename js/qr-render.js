/*!
 * QR Generator — canvas renderer
 * QRO.render(canvas, matrix, opts) · QRO.defaults() · QRO.exportBlob() · QRO.loadImage()
 */
(function (root) {
  'use strict';
  var QRO = root.QRO = root.QRO || {};

  /* ------------------------------------------------------------ defaults */
  QRO.defaults = function () {
    return {
      size: 1024,
      margin: 2,
      body: 'rounded',
      eyeFrame: 'rounded',
      eyeBall: 'rounded',
      fg: { type: 'solid', c1: '#3E3239', c2: '#9E8189', angle: 45 },
      eyeFrameColor: '',
      eyeBallColor: '',
      bgMode: 'full',          // full | center | small | none
      bg: '#F7EFE7',
      outer: '#C7A9A3',
      bgImage: null,
      logo: null,              // {img, size, shape, color, pad}
      frame: null              // {text, color, textColor}
    };
  };

  /* ------------------------------------------------------------ helpers */
  function rr(ctx, x, y, w, h, r) {
    // r: number or [tl, tr, br, bl]
    var tl, tr, br, bl;
    if (typeof r === 'number') { tl = tr = br = bl = r; } else { tl = r[0]; tr = r[1]; br = r[2]; bl = r[3]; }
    var max = Math.min(w, h) / 2;
    tl = Math.min(tl, max); tr = Math.min(tr, max); br = Math.min(br, max); bl = Math.min(bl, max);
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr); else ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - br);
    if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br); else ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + bl, y + h);
    if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl); else ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + tl);
    if (tl) ctx.arcTo(x, y, x + tl, y, tl); else ctx.lineTo(x, y);
    ctx.closePath();
  }
  function circle(ctx, cx, cy, r) { ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); }
  function diamond(ctx, cx, cy, r) {
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
  }
  function sparkle(ctx, cx, cy, r) {
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.closePath();
  }
  function heart(ctx, cx, cy, r) {
    var s = r * 2, x = cx - r, y = cy - r;
    ctx.moveTo(x + s * 0.5, y + s * 0.92);
    ctx.bezierCurveTo(x - s * 0.15, y + s * 0.55, x + s * 0.02, y + s * 0.02, x + s * 0.28, y + s * 0.1);
    ctx.bezierCurveTo(x + s * 0.42, y + s * 0.14, x + s * 0.5, y + s * 0.28, x + s * 0.5, y + s * 0.28);
    ctx.bezierCurveTo(x + s * 0.5, y + s * 0.28, x + s * 0.58, y + s * 0.14, x + s * 0.72, y + s * 0.1);
    ctx.bezierCurveTo(x + s * 0.98, y + s * 0.02, x + s * 1.15, y + s * 0.55, x + s * 0.5, y + s * 0.92);
    ctx.closePath();
  }

  function makeFill(ctx, spec, x, y, w, h) {
    if (!spec || spec.type === 'solid') return (spec && spec.c1) || '#000';
    var g;
    if (spec.type === 'radial') {
      g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
    } else {
      var a = (spec.angle || 0) * Math.PI / 180, cx = x + w / 2, cy = y + h / 2;
      var len = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2;
      g = ctx.createLinearGradient(cx - Math.cos(a) * len, cy - Math.sin(a) * len, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    }
    g.addColorStop(0, spec.c1); g.addColorStop(1, spec.c2);
    return g;
  }

  function drawCover(ctx, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }
  function drawContain(ctx, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width || 1, ih = img.naturalHeight || img.height || 1;
    var s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  /* ------------------------------------------------------------ render */
  QRO.layout = function (o) {
    var S = o.size, barH = o.frame ? Math.round(S * 0.17) : 0;
    return { w: S, h: S + barH, S: S, barH: barH };
  };

  QRO.render = function (canvas, matrix, opts) {
    var o = Object.assign(QRO.defaults(), opts || {});
    var L = QRO.layout(o), S = L.S;
    canvas.width = L.w; canvas.height = L.h;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, L.w, L.h);

    var n = matrix.size, modules = matrix.modules;
    var N = n + o.margin * 2;

    // ---- area / card geometry
    var cardX = 0, cardY = 0, cardS = S, cardR = 0;
    if (o.bgMode === 'center') { cardS = S * 0.8; cardX = cardY = (S - cardS) / 2; cardR = S * 0.07; }
    else if (o.bgMode === 'small') { cardS = S * 0.92; cardX = cardY = (S - cardS) / 2; cardR = S * 0.05; }
    var m = cardS / N;                       // module size in px
    var qx = cardX + o.margin * m, qy = cardY + o.margin * m;   // QR origin
    var qs = n * m;                          // QR side

    // ---- backdrop
    if (o.bgMode === 'full') {
      if (o.bgImage) {
        drawCover(ctx, o.bgImage, 0, 0, S, S);
        ctx.save(); ctx.fillStyle = o.bg; ctx.globalAlpha = 0.93; ctx.beginPath();
        var padc = m * 0.9; rr(ctx, qx - padc, qy - padc, qs + padc * 2, qs + padc * 2, m * 1.6); ctx.fill(); ctx.restore();
      } else { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, S, S); }
    } else if (o.bgMode === 'center' || o.bgMode === 'small') {
      if (o.bgImage) drawCover(ctx, o.bgImage, 0, 0, S, S);
      else { ctx.fillStyle = o.outer; ctx.fillRect(0, 0, S, S); }
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = S * 0.045; ctx.shadowOffsetY = S * 0.014;
      ctx.fillStyle = o.bg; ctx.beginPath(); rr(ctx, cardX, cardY, cardS, cardS, cardR); ctx.fill();
      ctx.restore();
    }
    // 'none' → transparent

    // ---- logo knock-out region
    var ko = null;
    if (o.logo && o.logo.img) {
      var lside = Math.min(0.32, Math.max(0.08, o.logo.size)) * qs;
      var half = lside / 2 + m * 0.35;
      var cxq = qx + qs / 2, cyq = qy + qs / 2;
      ko = { cx: cxq, cy: cyq, half: half, round: o.logo.shape === 'circle', side: lside };
    }
    function knocked(px, py) {
      if (!ko) return false;
      var dx = Math.abs(px - ko.cx), dy = Math.abs(py - ko.cy);
      if (ko.round) return Math.sqrt(dx * dx + dy * dy) < ko.half + m * 0.4;
      return dx < ko.half + m * 0.45 && dy < ko.half + m * 0.45;
    }

    function dark(x, y) { return x >= 0 && y >= 0 && x < n && y < n && modules[y][x]; }
    function inEye(x, y) {
      return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    }

    // ---- fills
    var fgFill = makeFill(ctx, o.fg, qx, qy, qs, qs);
    var frameFill = o.eyeFrameColor ? o.eyeFrameColor : fgFill;
    var ballFill = o.eyeBallColor ? o.eyeBallColor : fgFill;

    // ---- body modules
    ctx.fillStyle = fgFill;
    ctx.beginPath();
    var x, y, px, py, r;
    var body = o.body;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (!modules[y][x] || inEye(x, y)) continue;
        px = qx + x * m; py = qy + y * m;
        if (knocked(px + m / 2, py + m / 2)) continue;
        bodyPath(ctx, body, px, py, m, { up: dark(x, y - 1), dn: dark(x, y + 1), lf: dark(x - 1, y), rt: dark(x + 1, y) });
      }
    }
    ctx.fill();

    // ---- eyes
    var eyes = [[0, 0], [n - 7, 0], [0, n - 7]];
    // frames
    ctx.fillStyle = frameFill;
    ctx.beginPath();
    eyes.forEach(function (e) {
      eyeFramePath(ctx, o.eyeFrame, qx + e[0] * m, qy + e[1] * m, 7 * m, m);
    });
    ctx.fill('evenodd');
    // balls
    ctx.fillStyle = ballFill;
    ctx.beginPath();
    eyes.forEach(function (e) {
      eyeBallPath(ctx, o.eyeBall, qx + (e[0] + 2) * m, qy + (e[1] + 2) * m, 3 * m);
    });
    ctx.fill();

    // ---- logo
    if (ko) {
      var ls = ko.side, lx = ko.cx - ls / 2, ly = ko.cy - ls / 2;
      var pad = o.logo.pad == null ? 0.12 : o.logo.pad;
      if (o.logo.shape !== 'none') {
        ctx.save();
        ctx.fillStyle = o.logo.color || '#fff';
        ctx.beginPath();
        if (o.logo.shape === 'circle') circle(ctx, ko.cx, ko.cy, ls / 2);
        else rr(ctx, lx, ly, ls, ls, o.logo.shape === 'rounded' ? ls * 0.24 : 0);
        ctx.fill();
        ctx.restore();
      }
      var inner = o.logo.shape === 'none' ? ls : ls * (1 - pad * 2);
      ctx.save();
      if (o.logo.shape === 'circle' && o.logo.clip) { ctx.beginPath(); circle(ctx, ko.cx, ko.cy, inner / 2); ctx.clip(); }
      drawContain(ctx, o.logo.img, ko.cx - inner / 2, ko.cy - inner / 2, inner, inner);
      ctx.restore();
    }

    // ---- frame bar (label)
    if (o.frame && L.barH) {
      var bh = L.barH, by0 = S;
      ctx.fillStyle = o.frame.color || '#3E3239';
      ctx.fillRect(0, by0, L.w, bh);
      var fs = bh * 0.42;
      ctx.fillStyle = o.frame.textColor || '#F7EFE7';
      ctx.font = '800 ' + fs + 'px Syne, "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var txt = (o.frame.text || 'SCAN ME').slice(0, 28);
      while (ctx.measureText(txt).width > L.w * 0.86 && fs > 10) { fs -= 2; ctx.font = '800 ' + fs + 'px Syne, Inter, system-ui, sans-serif'; }
      ctx.fillText(txt, L.w / 2, by0 + bh / 2 + fs * 0.04);
    }
    return canvas;
  };


  /* ------------------------------------------------------------ shape primitives (shared with UI previews) */
  function bodyPath(ctx, body, px, py, m, nb) {
    var cx = px + m / 2, cy = py + m / 2, r;
    switch (body) {
      case 'rounded': rr(ctx, px + m * 0.04, py + m * 0.04, m * 0.92, m * 0.92, m * 0.3); break;
      case 'liquid':
        r = m * 0.5;
        rr(ctx, px - 0.2, py - 0.2, m + 0.4, m + 0.4, [(!nb.up && !nb.lf) ? r : 0, (!nb.up && !nb.rt) ? r : 0, (!nb.dn && !nb.rt) ? r : 0, (!nb.dn && !nb.lf) ? r : 0]);
        break;
      case 'classy': rr(ctx, px + m * 0.02, py + m * 0.02, m * 0.96, m * 0.96, [m * 0.5, m * 0.08, m * 0.5, m * 0.08]); break;
      case 'dots': circle(ctx, cx, cy, m * 0.47); break;
      case 'pearl': circle(ctx, cx, cy, m * 0.34); break;
      case 'diamond': diamond(ctx, cx, cy, m * 0.58); break;
      case 'sparkle': sparkle(ctx, cx, cy, m * 0.68); break;
      case 'heart': heart(ctx, cx, cy, m * 0.58); break;
      case 'bars':
        r = m * 0.36;
        rr(ctx, px + m * 0.1, py - (nb.up ? 0.3 : 0), m * 0.8, m + (nb.up ? 0.3 : 0) + (nb.dn ? 0.3 : 0), [nb.up ? 0 : r, nb.up ? 0 : r, nb.dn ? 0 : r, nb.dn ? 0 : r]);
        break;
      case 'hbars':
        r = m * 0.36;
        rr(ctx, px - (nb.lf ? 0.3 : 0), py + m * 0.1, m + (nb.lf ? 0.3 : 0) + (nb.rt ? 0.3 : 0), m * 0.8, [nb.lf ? 0 : r, nb.rt ? 0 : r, nb.rt ? 0 : r, nb.lf ? 0 : r]);
        break;
      default: ctx.rect(px - 0.25, py - 0.25, m + 0.5, m + 0.5);
    }
  }
  function eyeFramePath(ctx, shape, ex, ey, s, t) {
    var i = s - 2 * t;
    switch (shape) {
      case 'circle': circle(ctx, ex + s / 2, ey + s / 2, s / 2); circle(ctx, ex + s / 2, ey + s / 2, s / 2 - t); break;
      case 'leaf': rr(ctx, ex, ey, s, s, [s * 0.5, 0, s * 0.5, 0]); rr(ctx, ex + t, ey + t, i, i, [i * 0.5, 0, i * 0.5, 0]); break;
      case 'rounded': rr(ctx, ex, ey, s, s, s * 0.3); rr(ctx, ex + t, ey + t, i, i, i * 0.28); break;
      case 'octagon': oct(ctx, ex, ey, s, s * 0.28); oct(ctx, ex + t, ey + t, i, i * 0.28); break;
      default: ctx.rect(ex, ey, s, s); ctx.rect(ex + t, ey + t, i, i);
    }
  }
  function eyeBallPath(ctx, shape, bx, by, s) {
    switch (shape) {
      case 'circle': circle(ctx, bx + s / 2, by + s / 2, s / 2); break;
      case 'diamond': diamond(ctx, bx + s / 2, by + s / 2, s * 0.62); break;
      case 'leaf': rr(ctx, bx, by, s, s, [s * 0.5, 0, s * 0.5, 0]); break;
      case 'rounded': rr(ctx, bx, by, s, s, s * 0.3); break;
      case 'heart': heart(ctx, bx + s / 2, by + s / 2, s * 0.58); break;
      case 'sparkle': sparkle(ctx, bx + s / 2, by + s / 2, s * 0.68); break;
      default: ctx.rect(bx, by, s, s);
    }
  }

  /** Tiny preview canvases for the Studio shape pickers. */
  QRO.previewBody = function (canvas, shape, color) {
    var d = canvas.width, g = 5, m = d / (g + 1), ctx = canvas.getContext('2d');
    var pat = ['10101', '01110', '11011', '01110', '10101'];
    ctx.clearRect(0, 0, d, d); ctx.fillStyle = color; ctx.beginPath();
    function k(x, y) { return x >= 0 && y >= 0 && x < g && y < g && pat[y][x] === '1'; }
    for (var y = 0; y < g; y++) for (var x = 0; x < g; x++) {
      if (k(x, y)) bodyPath(ctx, shape, m * 0.5 + x * m, m * 0.5 + y * m, m, { up: k(x, y - 1), dn: k(x, y + 1), lf: k(x - 1, y), rt: k(x + 1, y) });
    }
    ctx.fill();
  };
  QRO.previewEye = function (canvas, frame, ball, color) {
    var d = canvas.width, m = d / 8, ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, d, d); ctx.fillStyle = color;
    ctx.beginPath(); eyeFramePath(ctx, frame, m * 0.5, m * 0.5, 7 * m, m); ctx.fill('evenodd');
    ctx.beginPath(); eyeBallPath(ctx, ball, m * 2.5, m * 2.5, 3 * m); ctx.fill();
  };

  function oct(ctx, x, y, s, c) {
    ctx.moveTo(x + c, y); ctx.lineTo(x + s - c, y); ctx.lineTo(x + s, y + c); ctx.lineTo(x + s, y + s - c);
    ctx.lineTo(x + s - c, y + s); ctx.lineTo(x + c, y + s); ctx.lineTo(x, y + s - c); ctx.lineTo(x, y + c); ctx.closePath();
  }

  /* ------------------------------------------------------------ utils */
  QRO.loadImage = function (src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('Image load failed')); };
      im.src = src;
    });
  };

  QRO.exportBlob = function (canvas, fmt, quality, flattenColor) {
    return new Promise(function (resolve) {
      if (fmt === 'jpg' || fmt === 'jpeg') {
        var c2 = document.createElement('canvas');
        c2.width = canvas.width; c2.height = canvas.height;
        var x = c2.getContext('2d');
        x.fillStyle = flattenColor || '#ffffff'; x.fillRect(0, 0, c2.width, c2.height);
        x.drawImage(canvas, 0, 0);
        c2.toBlob(resolve, 'image/jpeg', quality || 0.95);
      } else {
        canvas.toBlob(resolve, 'image/png');
      }
    });
  };

  function lum(hex) {
    var h = (hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var v = [0, 2, 4].map(function (i) {
      var c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  QRO.luminance = lum;
  QRO.contrast = function (a, b) {
    var l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  };
})(typeof window !== 'undefined' ? window : globalThis);
