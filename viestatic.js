(function () {

  /* ---------------------------------------------------------
   * QR Math (Galois field operations)
   * --------------------------------------------------------- */

  const QRMath = {
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256),

    glog(n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },

    gexp(n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    }
  };

  for (let i = 0; i < 8; i++) {
    QRMath.EXP_TABLE[i] = 1 << i;
  }
  for (let i = 8; i < 256; i++) {
    QRMath.EXP_TABLE[i] =
      QRMath.EXP_TABLE[i - 4] ^
      QRMath.EXP_TABLE[i - 5] ^
      QRMath.EXP_TABLE[i - 6] ^
      QRMath.EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) {
    QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
  }

  /* ---------------------------------------------------------
   * Polynomial for Reed–Solomon
   * --------------------------------------------------------- */

  class QRPolynomial {
    constructor(num, shift) {
      if (!num.length) throw new Error("no num");
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i++) {
        this.num[i] = num[i + offset];
      }
    }

    get(index) {
      return this.num[index];
    }

    getLength() {
      return this.num.length;
    }

    multiply(e) {
      const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(
            QRMath.glog(this.get(i)) + QRMath.glog(e.get(j))
          );
        }
      }
      return new QRPolynomial(num, 0);
    }

    mod(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = this.num.slice();
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  }

  /* ---------------------------------------------------------
   * RS Block (Reed–Solomon block info)
   * --------------------------------------------------------- */

  class QRRSBlock {
    constructor(totalCount, dataCount) {
      this.totalCount = totalCount;
      this.dataCount = dataCount;
    }

    static getRSBlocks(typeNumber, errorCorrectLevel) {
      // We’ll support a reasonable range of versions and ECC levels.
      // For VieStatic, we mostly care about URLs, so versions 1–10 are enough.
      const RS_BLOCK_TABLE = [
        // 1
        [1, 26, 19], // L
        [1, 26, 16], // M
        [1, 26, 13], // Q
        [1, 26, 9],  // H
        // 2
        [1, 44, 34],
        [1, 44, 28],
        [1, 44, 22],
        [1, 44, 16],
        // 3
        [1, 70, 55],
        [1, 70, 44],
        [2, 35, 17],
        [2, 35, 13],
        // 4
        [1, 100, 80],
        [2, 50, 32],
        [2, 50, 24],
        [4, 25, 9],
        // 5
        [1, 134, 108],
        [2, 67, 43],
        [2, 33, 15, 2, 34, 16],
        [2, 33, 11, 2, 34, 12],
        // 6
        [2, 86, 68],
        [4, 43, 27],
        [4, 43, 19],
        [4, 43, 15],
        // 7
        [2, 98, 78],
        [4, 49, 31],
        [2, 32, 14, 4, 33, 15],
        [4, 39, 13, 1, 40, 14],
        // 8
        [2, 121, 97],
        [2, 60, 38, 2, 61, 39],
        [4, 40, 18, 2, 41, 19],
        [4, 40, 14, 2, 41, 15],
        // 9
        [2, 146, 116],
        [3, 58, 36, 2, 59, 37],
        [4, 36, 16, 4, 37, 17],
        [4, 36, 12, 4, 37, 13],
        // 10
        [2, 86, 68, 2, 87, 69],
        [4, 69, 43, 1, 70, 44],
        [6, 43, 19, 2, 44, 20],
        [6, 43, 15, 2, 44, 16]
      ];

      const EC_LEVEL_MAP = { L: 0, M: 1, Q: 2, H: 3 };
      const ecIndex = EC_LEVEL_MAP[errorCorrectLevel] ?? 0;

      const index = (typeNumber - 1) * 4 + ecIndex;
      const rsData = RS_BLOCK_TABLE[index];
      if (!rsData) throw new Error("No RS block for type " + typeNumber);

      const list = [];
      if (rsData.length === 3) {
        const [count, total, data] = rsData;
        for (let i = 0; i < count; i++) {
          list.push(new QRRSBlock(total, data));
        }
      } else {
        // pattern: count1, total1, data1, count2, total2, data2
        const [c1, t1, d1, c2, t2, d2] = rsData;
        for (let i = 0; i < c1; i++) list.push(new QRRSBlock(t1, d1));
        for (let i = 0; i < c2; i++) list.push(new QRRSBlock(t2, d2));
      }
      return list;
    }
  }

  /* ---------------------------------------------------------
   * Bit buffer
   * --------------------------------------------------------- */

  class QRBitBuffer {
    constructor() {
      this.buffer = [];
      this.length = 0;
    }

    get(index) {
      const bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
    }

    put(num, length) {
      for (let i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      }
    }

    putBit(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) {
        this.buffer.push(0);
      }
      if (bit) {
        this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      }
      this.length++;
    }
  }

  /* ---------------------------------------------------------
   * 8-bit data
   * --------------------------------------------------------- */

  class QR8bitByte {
    constructor(data) {
      this.mode = 4; // 8-bit byte mode
      this.data = data;
    }

    getLength() {
      return this.data.length;
    }

    write(buffer) {
      for (let i = 0; i < this.data.length; i++) {
        buffer.put(this.data.charCodeAt(i), 8);
      }
    }
  }

  /* ---------------------------------------------------------
   * Utility functions (BCH, patterns, etc.)
   * --------------------------------------------------------- */

  const QRUtil = {
    PATTERN_POSITION_TABLE: [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54]
    ],

    getPatternPosition(typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    },

    getBCHTypeInfo(data) {
      let d = data << 10;
      const g = 0b10100110111;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(g) >= 0) {
        d ^= g << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(g));
      }
      return ((data << 10) | d) ^ 0b101010000010010;
    },

    getBCHTypeNumber(data) {
      let d = data << 12;
      const g = 0b1111100100101;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(g) >= 0) {
        d ^= g << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(g));
      }
      return (data << 12) | d;
    },

    getBCHDigit(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },

    getMask(maskPattern, i, j) {
      switch (maskPattern) {
        case 0: return (i + j) % 2 === 0;
        case 1: return i % 2 === 0;
        case 2: return j % 3 === 0;
        case 3: return (i + j) % 3 === 0;
        case 4: return ((Math.floor(i / 2) + Math.floor(j / 3)) % 2) === 0;
        case 5: return ((i * j) % 2 + (i * j) % 3) === 0;
        case 6: return (((i * j) % 2 + (i * j) % 3) % 2) === 0;
        case 7: return (((i + j) % 2 + (i * j) % 3) % 2) === 0;
        default: return false;
      }
    }
  };

  const QRMaskPattern = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };

  /* ---------------------------------------------------------
   * QRCode core
   * --------------------------------------------------------- */

  class QRCode {
    constructor(typeNumber, errorCorrectLevel) {
      this.typeNumber = typeNumber;
      this.errorCorrectLevel = errorCorrectLevel; // 'L','M','Q','H'
      this.modules = null;
      this.moduleCount = 0;
      this.dataList = [];
    }

    addData(data) {
      this.dataList.push(new QR8bitByte(data));
    }

    isDark(row, col) {
      if (!this.modules || this.modules[row][col] == null) return false;
      return this.modules[row][col];
    }

    getModuleCount() {
      return this.moduleCount;
    }

    make() {
      // Try increasing typeNumber until data fits
      for (let type = this.typeNumber; type <= 10; type++) {
        this.typeNumber = type;
        if (this._tryMake()) return;
      }
      throw new Error("Data too long for supported QR versions");
    }

    _tryMake() {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount).fill(null);
      }

      this._setupPositionProbePattern(0, 0);
      this._setupPositionProbePattern(this.moduleCount - 7, 0);
      this._setupPositionProbePattern(0, this.moduleCount - 7);
      this._setupPositionAdjustPattern();
      this._setupTimingPattern();
      this._setupTypeNumber();
      // type info + mask will be set after data mapping

      const data = this._createData();
      let bestMask = 0;
      let minLostPoint = Infinity;

      for (let mask = 0; mask < 8; mask++) {
        this._mapData(data, mask);
        const lostPoint = this._getLostPoint();
        if (lostPoint < minLostPoint) {
          minLostPoint = lostPoint;
          bestMask = mask;
        }
        // reset modules except function patterns
        for (let r = 0; r < this.moduleCount; r++) {
          for (let c = 0; c < this.moduleCount; c++) {
            if (this.modules[r][c] !== null && this.modules[r][c].fixed) {
              this.modules[r][c] = this.modules[r][c].value;
            } else if (this.modules[r][c] !== null && this.modules[r][c].func) {
              this.modules[r][c] = this.modules[r][c].value;
            } else {
              this.modules[r][c] = null;
            }
          }
        }
      }

      // Final mapping with best mask
      this._mapData(data, bestMask);
      this._setupTypeInfo(bestMask);
      return true;
    }

    _setupPositionProbePattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          const isDark =
            (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4);
          this.modules[row + r][col + c] = { value: isDark, func: true };
        }
      }
    }

    _setupTimingPattern() {
      for (let i = 0; i < this.moduleCount; i++) {
        if (this.modules[6][i] == null) {
          this.modules[6][i] = { value: i % 2 === 0, func: true };
        }
        if (this.modules[i][6] == null) {
          this.modules[i][6] = { value: i % 2 === 0, func: true };
        }
      }
    }

    _setupPositionAdjustPattern() {
      const pos = QRUtil.getPatternPosition(this.typeNumber);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (this.modules[row][col] != null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              const isDark =
                (r === -2 || r === 2 || c === -2 || c === 2) ||
                (r === 0 && c === 0);
              this.modules[row + r][col + c] = { value: isDark, func: true };
            }
          }
        }
      }
    }

    _setupTypeNumber() {
      const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (let i = 0; i < 18; i++) {
        const mod = ((bits >> i) & 1) === 1;
        const r = Math.floor(i / 3);
        const c = i % 3;
        this.modules[r][this.moduleCount - 11 + c] = { value: mod, func: true };
        this.modules[this.moduleCount - 11 + c][r] = { value: mod, func: true };
      }
    }

    _setupTypeInfo(maskPattern) {
      const EC_LEVEL_MAP = { L: 1, M: 0, Q: 3, H: 2 };
      const ecBits = EC_LEVEL_MAP[this.errorCorrectLevel] ?? 1;
      const data = (ecBits << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (let i = 0; i < 15; i++) {
        const mod = ((bits >> i) & 1) === 1;
        if (i < 6) {
          this.modules[i][8] = { value: mod, func: true };
        } else if (i < 8) {
          this.modules[i + 1][8] = { value: mod, func: true };
        } else {
          this.modules[this.moduleCount - 15 + i][8] = { value: mod, func: true };
        }
      }

      // horizontal
      for (let i = 0; i < 15; i++) {
        const mod = ((bits >> i) & 1) === 1;
        if (i < 8) {
          this.modules[8][this.moduleCount - i - 1] = { value: mod, func: true };
        } else if (i < 9) {
          this.modules[8][15 - i - 1 + 1] = { value: mod, func: true };
        } else {
          this.modules[8][15 - i - 1] = { value: mod, func: true };
        }
      }

      this.modules[this.moduleCount - 8][8] = { value: true, func: true };
    }

    _createData() {
      const rsBlocks = QRRSBlock.getRSBlocks(this.typeNumber, this.errorCorrectLevel);
      const buffer = new QRBitBuffer();

      for (let i = 0; i < this.dataList.length; i++) {
        const data = this.dataList[i];
        buffer.put(4, 4); // mode: 8-bit byte
        buffer.put(data.getLength(), 8);
        data.write(buffer);
      }

      // terminator
      let totalDataCount = 0;
      for (let i = 0; i < rsBlocks.length; i++) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.length + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // pad to byte
      while (buffer.length % 8 !== 0) {
        buffer.putBit(false);
      }

      // pad to capacity
      const PAD0 = 0xec;
      const PAD1 = 0x11;
      let padFlag = true;
      while (buffer.length < totalDataCount * 8) {
        buffer.put(padFlag ? PAD0 : PAD1, 8);
        padFlag = !padFlag;
      }

      // split into blocks
      const dataBytes = new Array(totalDataCount);
      for (let i = 0; i < dataBytes.length; i++) {
        dataBytes[i] = 0;
      }
      for (let i = 0; i < buffer.length; i++) {
        dataBytes[Math.floor(i / 8)] |= (buffer.get(i) ? (0x80 >>> (i % 8)) : 0);
      }

      let offset = 0;
      const dcdata = [];
      const ecdata = [];

      for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount;
        const ecCount = rsBlocks[r].totalCount - dcCount;

        const dc = new Array(dcCount);
        for (let i = 0; i < dcCount; i++) {
          dc[i] = dataBytes[offset + i];
        }
        offset += dcCount;

        const rsPoly = QRCode._getErrorCorrectPolynomial(ecCount);
        const rawPoly = new QRPolynomial(dc, rsPoly.getLength() - 1);
        const modPoly = rawPoly.mod(rsPoly);

        const ec = new Array(ecCount);
        const modLen = modPoly.getLength();
        for (let i = 0; i < ecCount; i++) {
          ec[i] = modPoly.get(i + modLen - ecCount);
        }

        dcdata.push(dc);
        ecdata.push(ec);
      }

      const totalCodeCount = rsBlocks.reduce((sum, b) => sum + b.totalCount, 0);
      const dataOut = new Array(totalCodeCount);
      let idx = 0;

      const maxDcCount = Math.max(...dcdata.map(d => d.length));
      const maxEcCount = Math.max(...ecdata.map(e => e.length));

      for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) {
            dataOut[idx++] = dcdata[r][i];
          }
        }
      }

      for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) {
            dataOut[idx++] = ecdata[r][i];
          }
        }
      }

      return dataOut;
    }

    static _getErrorCorrectPolynomial(ecCount) {
      let poly = new QRPolynomial([1], 0);
      for (let i = 0; i < ecCount; i++) {
        poly = poly.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return poly;
    }

    _mapData(data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 0;
      let byteIndex = 0;

      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;

        while (true) {
          for (let c = 0; c < 2; c++) {
            const r = row;
            const cc = col - c;
            if (this.modules[r][cc] == null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = ((data[byteIndex] >>> (7 - bitIndex)) & 1) === 1;
              }
              if (QRUtil.getMask(maskPattern, r, cc)) {
                dark = !dark;
              }
              this.modules[r][cc] = { value: dark, fixed: true };
              bitIndex++;
              if (bitIndex === 8) {
                byteIndex++;
                bitIndex = 0;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }

    _getLostPoint() {
      const moduleCount = this.moduleCount;
      let lostPoint = 0;

      // Adjacent modules in row/column
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          const dark = this.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) continue;
              if (r === 0 && c === 0) continue;
              if (dark === this.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      }

      // 2x2 blocks
      for (let row = 0; row < moduleCount - 1; row++) {
        for (let col = 0; col < moduleCount - 1; col++) {
          const count =
            (this.isDark(row, col) ? 1 : 0) +
            (this.isDark(row + 1, col) ? 1 : 0) +
            (this.isDark(row, col + 1) ? 1 : 0) +
            (this.isDark(row + 1, col + 1) ? 1 : 0);
          if (count === 0 || count === 4) {
            lostPoint += 3;
          }
        }
      }

      // Finder-like patterns in rows
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount - 6; col++) {
          if (
            this.isDark(row, col) &&
            !this.isDark(row, col + 1) &&
            this.isDark(row, col + 2) &&
            this.isDark(row, col + 3) &&
            this.isDark(row, col + 4) &&
            !this.isDark(row, col + 5) &&
            this.isDark(row, col + 6)
          ) {
            lostPoint += 40;
          }
        }
      }

      // Finder-like patterns in columns
      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount - 6; row++) {
          if (
            this.isDark(row, col) &&
            !this.isDark(row + 1, col) &&
            this.isDark(row + 2, col) &&
            this.isDark(row + 3, col) &&
            this.isDark(row + 4, col) &&
            !this.isDark(row + 5, col) &&
            this.isDark(row + 6, col)
          ) {
            lostPoint += 40;
          }
        }
      }

      // Dark module ratio
      let darkCount = 0;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (this.isDark(row, col)) darkCount++;
        }
      }

      const totalCount = moduleCount * moduleCount;
      const ratio = Math.abs((100 * darkCount) / totalCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    }
  }

  /* ---------------------------------------------------------
   * Helper: create QR canvas for a given text + size
   * --------------------------------------------------------- */

  function VS_createQRCanvas(text, size) {
    const qr = new QRCode(4, "L"); // start at version 4, ECC L
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const scale = Math.floor(size / count) || 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = count * scale;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }

    return canvas;
  }
  function VS_createBadge(url, pos) {
    const badge = document.createElement("div");
    badge.className = "vs-badge vs-pos-" + pos;

    const icon = document.createElement("div");
    icon.className = "vs-badge-icon";
    badge.appendChild(icon);

    badge.addEventListener("click", function () {
      VS_openModal(url);
    });

    document.body.appendChild(badge);
  }

  function VS_openModal(url) {
    const backdrop = document.createElement("div");
    backdrop.className = "vs-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "vs-modal";

    const close = document.createElement("div");
    close.className = "vs-modal-close";
    close.innerHTML = "&times;";

    close.addEventListener("click", function () {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });

    const title = document.createElement("div");
    title.className = "vs-modal-title";
    title.textContent = "Scan to open this page";

    const urlEl = document.createElement("div");
    urlEl.className = "vs-modal-url";
    urlEl.textContent = url;

    const qrWrap = document.createElement("div");
    qrWrap.className = "vs-modal-qr";

    const canvas = VS_createQRCanvas(url, 220);
    qrWrap.appendChild(canvas);

    const footer = document.createElement("div");
    footer.className = "vs-modal-footer";
    footer.textContent = "Powered by VieStatic";

    modal.appendChild(close);
    modal.appendChild(title);
    modal.appendChild(urlEl);
    modal.appendChild(qrWrap);
    modal.appendChild(footer);

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }
    /* ---------------------------------------------------------
   * VieStatic Init — Auto-detect <script> tag
   * --------------------------------------------------------- */

  function VS_detectScriptTag() {
    // Prefer currentScript when available
    if (document.currentScript) return document.currentScript;

    // Fallback: last <script> in DOM
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1] || null;
  }

  function VS_autoInit() {
    const script = VS_detectScriptTag();
    if (!script) return;

    // Read attributes
    const posAttr = script.getAttribute("data-pos");
    const urlAttr = script.getAttribute("data-url");

    let pos = parseInt(posAttr || "3", 10);
    if (!(pos >= 1 && pos <= 4)) pos = 3;

    const url = urlAttr || window.location.href;

    VS_createBadge(url, pos);
  }

  /* ---------------------------------------------------------
   * VieStatic Global API
   * --------------------------------------------------------- */

  window.VieStatic = {
    init(options = {}) {
      const url = options.url || window.location.href;
      let pos = options.position || 3;
      if (!(pos >= 1 && pos <= 4)) pos = 3;

      VS_createBadge(url, pos);
    }
  };

  /* ---------------------------------------------------------
   * Auto-run on DOM ready
   * --------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", VS_autoInit);
  } else {
    VS_autoInit();
  }

})(); 

