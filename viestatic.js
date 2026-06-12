(function () {

  
  function qrCanvas(text, size) {
    const QR = requireQR();
    const qr = new QR(text);
    const modules = qr.modules;
    const count = modules.length;
    const scale = Math.floor(size / count);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = count * scale;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (modules[r][c]) {
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  /* ---------------------------------------------------------
   * Tiny QR Engine (compressed, supports typical URLs)
   * --------------------------------------------------------- */

  function requireQR() {
    function QR8bit(data) { this.data = data; }
    QR8bit.prototype = {
      getLength: function () { return this.data.length; },
      write: function (buf) {
        for (let i = 0; i < this.data.length; i++)
          buf.put(this.data.charCodeAt(i), 8);
      }
    };

    function BitBuf() { this.buf = []; this.len = 0; }
    BitBuf.prototype = {
      put: function (num, length) {
        for (let i = 0; i < length; i++)
          this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      },
      putBit: function (bit) {
        const idx = Math.floor(this.len / 8);
        if (this.buf.length <= idx) this.buf.push(0);
        if (bit) this.buf[idx] |= (0x80 >>> (this.len % 8));
        this.len++;
      }
    };

    function QR(text) {
      this.text = text;
      this.modules = null;
      this.moduleCount = 0;
      this.make();
    }

    QR.prototype = {
      make: function () {
        const type = 4; // supports typical URLs
        this.moduleCount = type * 4 + 17;
        this.modules = Array.from({ length: this.moduleCount }, () =>
          Array(this.moduleCount).fill(false)
        );

        const placeFinder = (r, c) => {
          for (let i = -1; i <= 7; i++)
            for (let j = -1; j <= 7; j++) {
              const rr = r + i, cc = c + j;
              if (rr < 0 || rr >= this.moduleCount || cc < 0 || cc >= this.moduleCount) continue;
              const on =
                (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                (i >= 2 && i <= 4 && j >= 2 && j <= 4);
              this.modules[rr][cc] = on;
            }
        };

        placeFinder(0, 0);
        placeFinder(this.moduleCount - 7, 0);
        placeFinder(0, this.moduleCount - 7);

        const data = new QR8bit(this.text);
        const buf = new BitBuf();
        buf.put(4, 4); // mode
        buf.put(data.getLength(), 8);
        data.write(buf);

        while (buf.len % 8 !== 0) buf.putBit(false);
        while (buf.len < 64 * 8) buf.put(0xec, 8);

        let row = this.moduleCount - 1, col = this.moduleCount - 1, inc = -1;
        let bit = 0, byte = 0;
        const bytes = buf.buf;

        for (; col > 0; col -= 2) {
          if (col === 6) col--;
          while (true) {
            for (let c = 0; c < 2; c++) {
              if (this.modules[row][col - c] === false) {
                const dark = ((bytes[byte] >>> (7 - bit)) & 1) === 1;
                this.modules[row][col - c] = dark;
                bit++;
                if (bit === 8) { byte++; bit = 0; }
              }
            }
            row += inc;
            if (row < 0 || row >= this.moduleCount) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      }
    };

    return QR;
  }

  /* ---------------------------------------------------------
   * Badge + Modal UI
   * --------------------------------------------------------- */

  function createBadge(url, pos) {
    const badge = document.createElement("div");
    badge.className = "vs-badge vs-pos-" + pos;

    const icon = document.createElement("div");
    icon.className = "vs-badge-icon";
    badge.appendChild(icon);

    badge.onclick = () => openModal(url);
    document.body.appendChild(badge);
  }

  function openModal(url) {
    const backdrop = document.createElement("div");
    backdrop.className = "vs-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "vs-modal";

    const close = document.createElement("div");
    close.className = "vs-modal-close";
    close.innerHTML = "&times;";
    close.onclick = () => document.body.removeChild(backdrop);

    const title = document.createElement("div");
    title.className = "vs-modal-title";
    title.textContent = "Scan to open this page";

    const urlEl = document.createElement("div");
    urlEl.className = "vs-modal-url";
    urlEl.textContent = url;

    const qrWrap = document.createElement("div");
    qrWrap.className = "vs-modal-qr";
    qrWrap.appendChild(qrCanvas(url, 220));

    const footer = document.createElement("div");
    footer.className = "vs-modal-footer";
    footer.textContent = "Powered by VieStatic";

    modal.appendChild(close);
    modal.appendChild(title);
    modal.appendChild(urlEl);
    modal.appendChild(qrWrap);
    modal.appendChild(footer);

    backdrop.appendChild(modal);
    backdrop.onclick = e => { if (e.target === backdrop) document.body.removeChild(backdrop); };

    document.body.appendChild(backdrop);
  }

  /* ---------------------------------------------------------
   * Auto‑Init from <script data-pos data-url>
   * --------------------------------------------------------- */

  function detectScript() {
    return document.currentScript || [...document.getElementsByTagName("script")].pop();
  }

  function autoInit() {
    const script = detectScript();
    if (!script) return;

    const posAttr = script.getAttribute("data-pos");
    const urlAttr = script.getAttribute("data-url");

    let pos = parseInt(posAttr || "3", 10);
    if (!(pos >= 1 && pos <= 4)) pos = 3;

    const url = urlAttr || window.location.href;

    createBadge(url, pos);
  }

  /* ---------------------------------------------------------
   * Global API
   * --------------------------------------------------------- */

  window.VieStatic = {
    init(options = {}) {
      const url = options.url || window.location.href;
      let pos = options.position || 3;
      if (!(pos >= 1 && pos <= 4)) pos = 3;
      createBadge(url, pos);
    }
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", autoInit);
  else
    autoInit();

})();
