/*!
 * QR Generator — core encoder (dependency free)
 * Byte-mode QR Code Model 2, versions 1-40, ECC L/M/Q/H, automatic mask choice.
 * Exposes: window.QRO.createMatrix(text, ecc)
 */
(function (root) {
  'use strict';

  var ECC_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };
  var ECC_INDEX = { L: 0, M: 1, Q: 2, H: 3 };

  var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];

  var NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(str));
    var s = unescape(encodeURIComponent(str)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function numRawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }

  function numDataCodewords(ver, ei) {
    return Math.floor(numRawDataModules(ver) / 8) -
      ECC_CODEWORDS_PER_BLOCK[ei][ver] * NUM_ERROR_CORRECTION_BLOCKS[ei][ver];
  }

  /* ---------- Reed-Solomon over GF(256/0x11D) ---------- */
  function rsMultiply(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var result = [], i, j;
    for (i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var rootv = 1;
    for (i = 0; i < degree; i++) {
      for (j = 0; j < result.length; j++) {
        result[j] = rsMultiply(result[j], rootv);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      rootv = rsMultiply(rootv, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= rsMultiply(coef, factor); });
    });
    return result;
  }

  /* ---------- Matrix builder ---------- */
  function Builder(version, eccName, dataCodewords) {
    this.version = version;
    this.ecc = eccName;
    this.ei = ECC_INDEX[eccName];
    this.size = version * 4 + 17;
    var n = this.size, row;
    this.modules = [];
    this.isFunc = [];
    for (var y = 0; y < n; y++) {
      row = []; var fr = [];
      for (var x = 0; x < n; x++) { row.push(false); fr.push(false); }
      this.modules.push(row); this.isFunc.push(fr);
    }
    this.drawFunctionPatterns();
    var all = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(all);

    var best = 0, minPenalty = Infinity;
    for (var m = 0; m < 8; m++) {
      this.applyMask(m);
      this.drawFormatBits(m);
      var p = this.penalty();
      if (p < minPenalty) { best = m; minPenalty = p; }
      this.applyMask(m); // undo
    }
    this.mask = best;
    this.applyMask(best);
    this.drawFormatBits(best);
    this.isFunc = null;
  }

  Builder.prototype.setFunc = function (x, y, dark) {
    this.modules[y][x] = dark;
    this.isFunc[y][x] = true;
  };

  Builder.prototype.drawFunctionPatterns = function () {
    var n = this.size, i, dx, dy;
    for (i = 0; i < n; i++) {
      this.setFunc(6, i, i % 2 === 0);
      this.setFunc(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(n - 4, 3);
    this.drawFinder(3, n - 4);
    var pos = this.alignPositions(), num = pos.length;
    for (i = 0; i < num; i++) {
      for (var j = 0; j < num; j++) {
        if (!((i === 0 && j === 0) || (i === 0 && j === num - 1) || (i === num - 1 && j === 0))) {
          this.drawAlign(pos[i], pos[j]);
        }
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  };

  Builder.prototype.drawFinder = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunc(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  Builder.prototype.drawAlign = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        this.setFunc(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  Builder.prototype.alignPositions = function () {
    var ver = this.version;
    if (ver === 1) return [];
    var num = Math.floor(ver / 7) + 2;
    var step = (ver === 32) ? 26 : Math.ceil((ver * 4 + 4) / (num * 2 - 2)) * 2;
    var result = [6];
    for (var pos = this.size - 7; result.length < num; pos -= step) result.splice(1, 0, pos);
    return result;
  };

  Builder.prototype.drawFormatBits = function (mask) {
    var data = (ECC_FORMAT_BITS[this.ecc] << 3) | mask;
    var rem = data, i;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    var n = this.size;
    for (i = 0; i <= 5; i++) this.setFunc(8, i, getBit(bits, i));
    this.setFunc(8, 7, getBit(bits, 6));
    this.setFunc(8, 8, getBit(bits, 7));
    this.setFunc(7, 8, getBit(bits, 8));
    for (i = 9; i < 15; i++) this.setFunc(14 - i, 8, getBit(bits, i));
    for (i = 0; i < 8; i++) this.setFunc(n - 1 - i, 8, getBit(bits, i));
    for (i = 8; i < 15; i++) this.setFunc(8, n - 15 + i, getBit(bits, i));
    this.setFunc(8, n - 8, true);
  };

  Builder.prototype.drawVersion = function () {
    if (this.version < 7) return;
    var rem = this.version, i;
    for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = (this.version << 12) | rem;
    for (i = 0; i < 18; i++) {
      var c = getBit(bits, i);
      var a = this.size - 11 + (i % 3), b = Math.floor(i / 3);
      this.setFunc(a, b, c);
      this.setFunc(b, a, c);
    }
  };

  Builder.prototype.addEccAndInterleave = function (data) {
    var ver = this.version, ei = this.ei;
    var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ei][ver];
    var blockEccLen = ECC_CODEWORDS_PER_BLOCK[ei][ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShort = numBlocks - rawCodewords % numBlocks;
    var shortLen = Math.floor(rawCodewords / numBlocks);
    var blocks = [], div = rsDivisor(blockEccLen);
    for (var i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortLen - blockEccLen + (i < numShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < numShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var result = [];
    for (var c = 0; c < blocks[0].length; c++) {
      for (var j = 0; j < blocks.length; j++) {
        if (c !== shortLen - blockEccLen || j >= numShort) result.push(blocks[j][c]);
      }
    }
    return result;
  };

  Builder.prototype.drawCodewords = function (data) {
    var n = this.size, i = 0;
    for (var right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < n; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? n - 1 - vert : vert;
          if (!this.isFunc[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  Builder.prototype.applyMask = function (mask) {
    var n = this.size;
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!this.isFunc[y][x] && inv) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  Builder.prototype.penalty = function () {
    var n = this.size, m = this.modules, score = 0, x, y, run, prev, line, k;
    var P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function finderHits(arr) {
      var hits = 0;
      for (var s = 0; s + 11 <= arr.length; s++) {
        var a = true, b = true;
        for (var t = 0; t < 11; t++) {
          var v = arr[s + t] ? 1 : 0;
          if (v !== P1[t]) a = false;
          if (v !== P2[t]) b = false;
          if (!a && !b) break;
        }
        if (a) hits++;
        if (b) hits++;
      }
      return hits;
    }
    for (var pass = 0; pass < 2; pass++) {
      for (y = 0; y < n; y++) {
        line = []; run = 0; prev = null;
        for (x = 0; x < n; x++) {
          var c = pass === 0 ? m[y][x] : m[x][y];
          line.push(c);
          if (c === prev) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
          else { prev = c; run = 1; }
        }
        score += finderHits(line) * 40;
      }
    }
    var dark = 0;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (m[y][x]) dark++;
        if (x < n - 1 && y < n - 1) {
          var v = m[y][x];
          if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) score += 3;
        }
      }
    }
    var total = n * n;
    k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    score += k * 10;
    return score;
  };

  /* ---------- Public API ---------- */
  function createMatrix(text, ecc, minVersion) {
    ecc = (ecc && ECC_INDEX.hasOwnProperty(ecc)) ? ecc : 'M';
    var bytes = utf8Bytes(String(text));
    var ei = ECC_INDEX[ecc], ver, usedBits = 0, ccBits;
    for (ver = Math.max(1, minVersion || 1); ver <= 40; ver++) {
      ccBits = ver <= 9 ? 8 : 16;
      usedBits = 4 + ccBits + bytes.length * 8;
      if (bytes.length < (1 << ccBits) && usedBits <= numDataCodewords(ver, ei) * 8) break;
    }
    if (ver > 40) throw new Error('Content is too long for a QR code. Please shorten it.');

    var bits = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    push(4, 4);
    push(bytes.length, ccBits);
    bytes.forEach(function (b) { push(b, 8); });
    var capBits = numDataCodewords(ver, ei) * 8;
    push(0, Math.min(4, capBits - bits.length));
    push(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < capBits; pad ^= 0xEC ^ 0x11) push(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      data.push(v);
    }
    var b = new Builder(ver, ecc, data);
    return { size: b.size, version: ver, ecc: ecc, mask: b.mask, modules: b.modules };
  }

  root.QRO = root.QRO || {};
  root.QRO.createMatrix = createMatrix;
  root.QRO._capacity = numDataCodewords; // exposed for tests
})(typeof window !== 'undefined' ? window : globalThis);
