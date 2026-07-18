// Fingerprint protection — injected into every page.
// Rewritten to be crash-safe: a re-entrancy guard prevents double-wrapping,
// and the aggressive Intl/timing overrides that broke SPAs (ChatGPT) are gone.
(function () {
  'use strict';
  if (window.__grimFP) return;            // never apply twice in one window
  try { Object.defineProperty(window, '__grimFP', { value: true }); } catch (_) { window.__grimFP = true; }

  const def = (obj, prop, getter) => {
    try { Object.defineProperty(obj, prop, { get: getter, configurable: true }); } catch (_) {}
  };

  // ── Canvas noise (non-destructive) ──
  // Every read of a canvas returns very slightly different pixels, so the classic
  // "draw hidden text → hash the pixels" fingerprint never produces a stable ID.
  // The real canvas is never modified, so pages still LOOK correct.
  try {
    const clamp = v => Math.max(0, Math.min(255, v));
    const jitter = () => Math.floor(Math.random() * 3) - 1;

    // 1. getImageData — noise the copy we hand back, leave the canvas untouched
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
      const img = origGetImageData.call(this, x, y, w, h);
      try {
        const d = img.data;
        // Stride on large canvases: altering a subset still breaks the hash,
        // but keeps games / photo editors fast instead of touching every pixel.
        const step = d.length > 400000 ? 40 : 4;
        for (let i = 0; i < d.length; i += step) {
          d[i] = clamp(d[i] + jitter());
          d[i + 1] = clamp(d[i + 1] + jitter());
          d[i + 2] = clamp(d[i + 2] + jitter());
        }
      } catch (_) {}
      return img;
    };

    // 2. toDataURL / toBlob — encode from a noised COPY so the original canvas stays clean
    const noisedCopy = (canvas) => {
      const c = document.createElement('canvas');
      c.width = canvas.width; c.height = canvas.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(canvas, 0, 0);
      if (canvas.width && canvas.height) {
        const img = origGetImageData.call(ctx, 0, 0, canvas.width, canvas.height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = clamp(d[i] + jitter());
          d[i + 1] = clamp(d[i + 1] + jitter());
          d[i + 2] = clamp(d[i + 2] + jitter());
        }
        ctx.putImageData(img, 0, 0);
      }
      return c;
    };

    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (t, q) {
      try { return origToDataURL.call(noisedCopy(this), t, q); } catch (_) {}
      return origToDataURL.call(this, t, q);
    };

    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    if (origToBlob) {
      HTMLCanvasElement.prototype.toBlob = function (cb, t, q) {
        try { return origToBlob.call(noisedCopy(this), cb, t, q); } catch (_) {}
        return origToBlob.call(this, cb, t, q);
      };
    }
  } catch (_) {}

  // ── AudioContext fingerprint noise ──
  // Sites render silent audio and hash the output — your sound stack produces a
  // unique signature. Tiny per-read noise makes that signature useless.
  try {
    const tiny = () => (Math.random() - 0.5) * 1e-7;

    if (window.AudioBuffer) {
      const origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function (ch) {
        const data = origGetChannelData.call(this, ch);
        try { for (let i = 0; i < data.length; i += 100) data[i] += tiny(); } catch (_) {}
        return data;
      };
    }
    if (window.AnalyserNode) {
      const origFreq = AnalyserNode.prototype.getFloatFrequencyData;
      AnalyserNode.prototype.getFloatFrequencyData = function (arr) {
        origFreq.call(this, arr);
        try { for (let i = 0; i < arr.length; i++) arr[i] += tiny(); } catch (_) {}
      };
    }
  } catch (_) {}

  // ── WebGL vendor/renderer mask ──
  try {
    const patch = (proto) => {
      const orig = proto.getParameter;
      proto.getParameter = function (p) {
        if (p === 0x9245 || p === 0x9246) return 'Generic Renderer';
        return orig.call(this, p);
      };
    };
    if (window.WebGLRenderingContext)  patch(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patch(WebGL2RenderingContext.prototype);
  } catch (_) {}

  // ── Block battery fingerprint ──
  try { if (navigator.getBattery) navigator.getBattery = () => Promise.reject(new Error('blocked')); } catch (_) {}

  // ── Spoof hardware / identity (getters only — safe) ──
  def(navigator, 'hardwareConcurrency', () => 4);
  def(navigator, 'deviceMemory', () => 4);
  def(navigator, 'webdriver', () => false);
  def(navigator, 'platform', () => 'Win32');
  def(navigator, 'vendor', () => 'Google Inc.');   // what real Chrome reports
  def(navigator, 'userAgentData', () => undefined);
  def(navigator, 'connection', () => undefined);
  def(navigator, 'plugins', () => []);
  def(navigator, 'mimeTypes', () => []);
  def(navigator, 'language', () => 'en-US');
  def(navigator, 'languages', () => ['en-US', 'en']);

  // ── Media devices / gamepads: report none ──
  try { if (navigator.mediaDevices) navigator.mediaDevices.enumerateDevices = () => Promise.resolve([]); } catch (_) {}
  try { navigator.getGamepads = () => []; } catch (_) {}

  // ── Disable DRM (EME / Widevine) — a common tracking vector via premium content ──
  try {
    if (navigator.requestMediaKeySystemAccess) {
      navigator.requestMediaKeySystemAccess = () =>
        Promise.reject(new DOMException('DRM disabled by Grim', 'NotSupportedError'));
    }
  } catch (_) {}

  // ── Present a consistent, ordinary Chrome identity ──
  // Grim IS Chromium, so it reports Chrome. Claiming Firefox while exposing
  // Chromium-only APIs is a mismatch sites can detect, and rare combinations are
  // easier to track than common ones. We keep the real major version so nothing
  // contradicts the engine, and blend in with the Chrome majority.
  const CHROME_MAJOR = (navigator.userAgent.match(/Chrome\/(\d+)/) || [, '140'])[1];
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/' + CHROME_MAJOR + '.0.0.0 Safari/537.36';
  def(navigator, 'userAgent', () => UA);
  def(navigator, 'appVersion', () => UA.replace('Mozilla/', ''));
  // NOTE: no `oscpu` override — that property only exists in Firefox, so defining
  // it on a Chromium browser would itself be a fingerprint.

  // ── Round screen size (Tor Browser's "letterboxing" idea) ──
  // Exact resolutions like 2560x1369 are near-unique. Rounding to a coarse grid
  // puts you in a big bucket of users sharing the same reported size.
  try {
    const round = (n) => Math.max(100, Math.floor(n / 100) * 100);
    def(screen, 'width',  () => round(window.screen.width));
    def(screen, 'height', () => round(window.screen.height));
    def(screen, 'availWidth',  () => round(window.screen.width));
    def(screen, 'availHeight', () => round(window.screen.height));
    def(screen, 'colorDepth', () => 24);   // the overwhelmingly common value
    def(screen, 'pixelDepth', () => 24);
  } catch (_) {}

  // ── Timezone → UTC ──
  // Your timezone narrows you to a region. Tor Browser reports UTC for everyone.
  // Kept deliberately narrow (offset + reported zone only) so date FORMATTING still
  // works — the aggressive Intl rewrites that broke SPAs are intentionally avoided.
  try {
    Date.prototype.getTimezoneOffset = function () { return 0; };
    const origResolved = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const o = origResolved.call(this);
      o.timeZone = 'UTC';
      return o;
    };
  } catch (_) {}

  // ── Font fingerprinting ──
  // Sites detect your installed fonts by measuring rendered text width — the exact
  // set of fonts you have is highly identifying. Sub-pixel noise on measurements
  // breaks the comparison while staying far too small to disturb layout.
  try {
    const origMeasure = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function (t) {
      const m = origMeasure.call(this, t);
      try {
        const w = m.width;
        Object.defineProperty(m, 'width', { get: () => w + (Math.random() - 0.5) * 0.01 });
      } catch (_) {}
      return m;
    };
  } catch (_) {}

  // ── Speech synthesis voices ──
  // The voice list installed on your machine varies by OS, language packs and apps,
  // which makes it a quietly strong fingerprint. Report none.
  try {
    if (window.speechSynthesis) speechSynthesis.getVoices = () => [];
  } catch (_) {}

  // ── WebGL pixel readback ──
  // Masking the GPU *name* isn't enough: a page can render a scene and read the
  // pixels back to fingerprint the actual GPU. Noise the returned pixels.
  try {
    const patchRead = (proto) => {
      const orig = proto.readPixels;
      if (!orig) return;
      proto.readPixels = function (x, y, w, h, fmt, type, pixels) {
        orig.call(this, x, y, w, h, fmt, type, pixels);
        try {
          if (pixels && pixels.length) {
            for (let i = 0; i < pixels.length; i += 97) {
              pixels[i] = Math.max(0, Math.min(255, pixels[i] + (Math.random() < 0.5 ? -1 : 1)));
            }
          }
        } catch (_) {}
      };
    };
    if (window.WebGLRenderingContext)  patchRead(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchRead(WebGL2RenderingContext.prototype);
  } catch (_) {}

  // ── Blunt high-resolution timers ──
  // Sub-millisecond timing lets sites fingerprint your CPU and mount timing
  // attacks. Clamping to 100µs keeps animations smooth but kills the signal.
  try {
    const origNow = performance.now.bind(performance);
    performance.now = () => Math.floor(origNow() * 10) / 10;
  } catch (_) {}
})();
