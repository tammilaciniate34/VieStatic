(function () {
  "use strict";

  /* ---------------------------------------------------------
   * QR → Canvas using qrcode-generator (CDN)
   * --------------------------------------------------------- */

  function VS_createQRCanvas(text, size) {
    if (typeof qrcode !== "function") {
      console.error("[VieStatic] qrcode-generator not found. Make sure the CDN script is loaded before viestatic.js.");
      const fallback = document.createElement("canvas");
      fallback.width = fallback.height = size || 220;
      const ctx = fallback.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, fallback.width, fallback.height);
      ctx.fillStyle = "#000";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("QR lib missing", fallback.width / 2, fallback.height / 2);
      return fallback;
    }

    // typeNumber = 0 (auto), errorCorrectLevel = 'L'
    const qr = qrcode(0, "L");
    qr.addData(String(text || ""));
    qr.make();

    const count = qr.getModuleCount();
    const targetSize = size || 220;
    const scale = Math.max(1, Math.floor(targetSize / count));

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

  /* ---------------------------------------------------------
   * VieStatic UI — Badge + Modal
   * --------------------------------------------------------- */

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
   * Script tag detection + auto-init
   * --------------------------------------------------------- */

  function VS_detectScriptTag() {
    if (document.currentScript) return document.currentScript;
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1] || null;
  }

  function VS_autoInit() {
    const script = VS_detectScriptTag();
    if (!script) return;

    const posAttr = script.getAttribute("data-pos");
    const urlAttr = script.getAttribute("data-url");

    let pos = parseInt(posAttr || "3", 10);
    if (!(pos >= 1 && pos <= 4)) pos = 3;

    const url = urlAttr && urlAttr.trim().length > 0
      ? urlAttr
      : window.location.href;

    VS_createBadge(url, pos);
  }

  /* ---------------------------------------------------------
   * Global API
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
