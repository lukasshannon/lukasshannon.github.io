/* Kept inline in each app so another app's edits cannot change this runtime. */
(() => {
  'use strict';
  const base = new URL('./', location.href);
  const prefix = `mobile-app:${base.pathname}:`;
  const logs = [];
  let panel, toggle, output, status, notice, updateButton, registration;
  let ready = false, dirty = false, currentErrors = 0, reloading = false;
  const runtime = { online: navigator.onLine, storage: 'available', offline: 'starting', version: 'unknown' };
  const describe = value => {
    try { return value instanceof Error ? (value.stack || value.message) : typeof value === 'string' ? value : JSON.stringify(value); }
    catch { return String(value); }
  };
  const render = () => {
    if (!output) return;
    output.textContent = logs.map(x => `${x.time} [${x.level}] ${x.message}`).join('\n');
    status.textContent = `${runtime.online ? 'Online' : 'Offline'} · Storage: ${runtime.storage} · Cache: ${runtime.offline}\nRevision: ${runtime.version}`;
    toggle.textContent = currentErrors ? `Debug (${currentErrors})` : 'Debug';
    toggle.dataset.error = String(currentErrors > 0);
    notice.hidden = currentErrors === 0;
  };
  const record = (level, values) => {
    logs.push({ time: new Date().toISOString(), level, message: values.map(describe).join(' ').slice(0, 2500) });
    if (logs.length > 60) logs.shift();
    if (level === 'error') currentErrors++;
    try { localStorage.setItem(prefix + 'debug', JSON.stringify(logs)); }
    catch { runtime.storage = 'unavailable'; }
    render();
  };
  try {
    const previous = JSON.parse(localStorage.getItem(prefix + 'debug') || '[]');
    if (Array.isArray(previous)) logs.push(...previous.slice(-30).filter(x => x && typeof x.message === 'string'));
  } catch { runtime.storage = 'unavailable'; }
  for (const level of ['error', 'warn']) {
    const original = console[level].bind(console);
    console[level] = (...values) => { original(...values); record(level, values); };
  }
  window.addEventListener('error', event => {
    record('error', [event.error || event.message || `Failed to load ${event.target?.src || event.target?.href || 'a resource'}`, event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : '']);
  }, true);
  window.addEventListener('unhandledrejection', event => record('error', [event.reason || 'Unhandled promise rejection']));
  const tryActivate = () => {
    if (!registration?.waiting) return;
    updateButton.hidden = false;
    if (!dirty && ready && currentErrors === 0 && document.visibilityState === 'visible') registration.waiting.postMessage({ type: 'ACTIVATE' });
  };
  window.Mobile = {
    ready() { ready = true; document.documentElement.dataset.mobileReady = 'true'; record('info', ['App ready']); tryActivate(); },
    setUnsaved(value) { dirty = Boolean(value); if (!dirty) tryActivate(); },
    log(...values) { record('info', values); },
    store: {
      get(key, fallback = null) {
        try { const value = localStorage.getItem(prefix + 'data:' + key); return value === null ? fallback : JSON.parse(value); }
        catch (error) { record('error', ['Cannot read saved data', error]); return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(prefix + 'data:' + key, JSON.stringify(value)); runtime.storage = 'available'; render(); return true; }
        catch (error) { runtime.storage = 'unavailable'; record('error', ['Could not save on this device', error]); return false; }
      },
      databaseName(name = 'data') { return prefix + name; }
    }
  };
  document.addEventListener('DOMContentLoaded', async () => {
    const host = document.createElement('div');
    host.id = 'mobile-tools';
    host.innerHTML = `<style>
      #mobile-tools{font:14px/1.5 system-ui,sans-serif;color:#eef4ff}
      #mobile-tools [hidden]{display:none!important}
      #mobile-debug-toggle,#mobile-update{position:fixed;z-index:99998;bottom:max(12px,env(safe-area-inset-bottom));min-height:44px;padding:8px 12px;background:#18253b;color:#e5edfa;border:1px solid #62718b;border-radius:12px;font:inherit;cursor:pointer}
      #mobile-debug-toggle{right:12px}#mobile-debug-toggle[data-error=true]{border-color:#ff8989;color:#ffd3d3}
      #mobile-update{left:12px;max-width:calc(100vw - 125px)}
      #mobile-debug-panel{position:fixed;z-index:99999;bottom:max(66px,calc(env(safe-area-inset-bottom) + 54px));right:12px;width:min(520px,calc(100vw - 24px));max-height:65dvh;box-sizing:border-box;overflow:auto;border:1px solid #62718b;border-radius:16px;background:#101827;padding:16px;box-shadow:0 12px 40px #0007}
      #mobile-debug-status,#mobile-debug-log{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,monospace;margin:10px 0 0}
      #mobile-error-notice{position:fixed;z-index:99997;bottom:70px;right:12px;max-width:calc(100vw - 48px);background:#571f32;color:#fff;padding:8px 12px;border-radius:8px}
    </style>
    <p id="mobile-error-notice" role="status" hidden>An error occurred. Open Debug for details.</p>
    <button id="mobile-update" type="button" hidden>Update ready · Reload</button>
    <aside id="mobile-debug-panel" aria-label="Debug console" hidden><strong>Debug console</strong><p id="mobile-debug-status"></p><pre id="mobile-debug-log"></pre></aside>
    <button id="mobile-debug-toggle" type="button" aria-controls="mobile-debug-panel" aria-expanded="false">Debug</button>`;
    document.body.append(host);
    panel = document.getElementById('mobile-debug-panel');
    toggle = document.getElementById('mobile-debug-toggle');
    output = document.getElementById('mobile-debug-log');
    status = document.getElementById('mobile-debug-status');
    notice = document.getElementById('mobile-error-notice');
    updateButton = document.getElementById('mobile-update');
    toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); };
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });
    updateButton.onclick = () => {
      if (dirty) { record('warn', ['Finish saving your current changes before reloading.']); panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); return; }
      if (registration?.waiting) registration.waiting.postMessage({ type: 'ACTIVATE' });
      else location.reload();
    };
    render();
    setTimeout(() => { if (!ready) record('error', ['App startup did not finish.']); }, 8000);
    if (document.documentElement.dataset.mobilePwa === 'off') { runtime.offline = 'not enabled for app directory'; render(); return; }
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      runtime.offline = 'unavailable in this browser context'; record('warn', ['Offline installation needs HTTPS and a browser with service workers.']); return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!navigator.serviceWorker.controller || reloading) return;
      if (dirty) { updateButton.hidden = false; return; }
      reloading = true; location.reload();
    });
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'STATUS') { runtime.version = event.data.revision; runtime.offline = 'ready'; render(); }
    });
    const check = async () => {
      runtime.online = navigator.onLine; render();
      if (!registration || !navigator.onLine) return;
      try { await registration.update(); tryActivate(); registration.active?.postMessage({ type: 'STATUS' }); }
      catch (error) { record('warn', ['Update check failed; keeping the cached app.', error]); }
    };
    try {
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname, updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') tryActivate(); });
      });
      registration.active?.postMessage({ type: 'STATUS' });
      await check();
    } catch (error) { runtime.offline = 'not ready'; record('warn', ['Offline setup failed', error]); }
    window.addEventListener('online', check);
    window.addEventListener('offline', () => { runtime.online = false; render(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  });
})();
