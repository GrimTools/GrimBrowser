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

  // ── Canvas noise ──
  try {
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    const jitter = () => Math.floor(Math.random() * 3) - 1;
    const clamp = v => Math.max(0, Math.min(255, v));
    function noisify(ctx, w, h) {
      if (!w || !h) return;
      const img = origGetImageData.call(ctx, 0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i]     = clamp(img.data[i]     + jitter());
        img.data[i + 1] = clamp(img.data[i + 1] + jitter());
        img.data[i + 2] = clamp(img.data[i + 2] + jitter());
      }
      ctx.putImageData(img, 0, 0);
    }
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (t, q) {
      try { const c = this.getContext('2d'); if (c) noisify(c, this.width, this.height); } catch (_) {}
      return origToDataURL.call(this, t, q);
    };
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
