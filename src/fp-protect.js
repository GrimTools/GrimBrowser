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
  def(navigator, 'vendor', () => '');
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

  // ── Mask the JS-visible user-agent to match the spoofed Firefox identity ──
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0';
  def(navigator, 'userAgent', () => UA);
  def(navigator, 'appVersion', () => '5.0 (Windows)');
  def(navigator, 'oscpu', () => 'Windows NT 10.0; Win64; x64');
})();
