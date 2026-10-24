/*!
 * QR Generator — kit: default state, state → render options, cached matrices, icon images
 */
(function (root) {
  'use strict';
  var QRO = root.QRO = root.QRO || {};

  QRO.defaultState = function () {
    return {
      type: 'url', fields: { url: '' }, ecc: 'M',
      body: 'rounded', eyeFrame: 'rounded', eyeBall: 'rounded',
      fg: { type: 'solid', c1: '#3E3239', c2: '#9E8189', angle: 45 },
      eyeFrameColor: '', eyeBallColor: '',
      bgMode: 'full', bg: '#F7EFE7', outer: '#C7A9A3', margin: 2,
      logoId: '', logoKind: '', logoSize: 0.22, logoShape: 'circle', logoColor: '#FFFFFF',
      frameOn: false, frameText: 'SCAN ME', frameColor: '#3E3239', frameTextColor: '#F7EFE7',
      exportSize: 2048, exportFmt: 'png', quality: 0.95, filename: 'qr-code'
    };
  };

  /* ---- matrix cache ---- */
  var mcache = {}, mkeys = [];
  QRO.matrixFor = function (text, ecc) {
    var k = ecc + '|' + text;
    if (mcache[k]) return mcache[k];
    var m = QRO.createMatrix(text, ecc);
    mcache[k] = m; mkeys.push(k);
    if (mkeys.length > 40) delete mcache[mkeys.shift()];
    return m;
  };

  /* ---- icon images ---- */
  var icache = {};
  QRO.iconImage = function (id) {
    if (!id) return Promise.resolve(null);
    if (icache[id]) return icache[id];
    var ic = QRO.iconById(id);
    if (!ic) return Promise.resolve(null);
    icache[id] = QRO.loadImage(ic.src).catch(function () { return null; });
    return icache[id];
  };

  /* ---- state → render options ---- */
  QRO.stateToOpts = function (st, ex, size) {
    ex = ex || {};
    var hasLogo = !!ex.logoImg;
    var preset = st.logoKind === 'preset';
    return {
      opts: {
        size: size || 1024,
        margin: st.margin,
        body: st.body, eyeFrame: st.eyeFrame, eyeBall: st.eyeBall,
        fg: st.fg, eyeFrameColor: st.eyeFrameColor, eyeBallColor: st.eyeBallColor,
        bgMode: st.bgMode, bg: st.bg, outer: st.outer,
        bgImage: ex.bgImg || null,
        logo: hasLogo ? {
          img: ex.logoImg, size: st.logoSize,
          shape: preset ? 'circle' : st.logoShape,
          color: st.logoColor, pad: preset ? 0.03 : (st.logoShape === 'none' ? 0 : 0.14),
          clip: !preset
        } : null,
        frame: st.frameOn ? { text: st.frameText, color: st.frameColor, textColor: st.frameTextColor } : null
      },
      ecc: hasLogo ? 'H' : st.ecc
    };
  };

  QRO.renderState = function (canvas, text, st, ex, size) {
    var c = QRO.stateToOpts(st, ex, size);
    var matrix = QRO.matrixFor(text, c.ecc);
    QRO.render(canvas, matrix, c.opts);
    return { matrix: matrix, opts: c.opts };
  };

  /** Render a template (record from QRO.TEMPLATES) onto a canvas. */
  QRO.renderTemplate = function (canvas, tpl, text, size) {
    var st = Object.assign(QRO.defaultState(), QRO.templateToState(tpl));
    if (st.logoId) st.logoKind = 'preset';
    return QRO.iconImage(st.logoId).then(function (img) {
      return QRO.renderState(canvas, text, st, { logoImg: img }, size);
    });
  };
})(window);
