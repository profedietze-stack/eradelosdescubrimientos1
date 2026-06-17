import { getErrorLog, clearErrorLog } from './errorCapture.js';

let _timer = null;
let _expanded = false;

export function initErrorBanner() {
  const banner = document.getElementById('error-banner');
  if (!banner) return;

  window.addEventListener('error', () => actualizarBanner());
  window.addEventListener('unhandledrejection', () => actualizarBanner());
  const origError = console.error;
  console.error = (...args) => {
    origError.apply(console, args);
    actualizarBanner();
  };
}

export function actualizarBanner() {
  const errors = getErrorLog().filter(e => e.level === 'error');
  const banner = document.getElementById('error-banner');
  const badge = document.getElementById('error-badge');
  if (!banner || !badge) return;
  if (errors.length === 0) { banner.classList.add('hidden'); return; }
  badge.textContent = errors.length;
  banner.classList.remove('hidden');
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => {
    if (!_expanded) banner.classList.add('hidden');
  }, 15000);
}

export function toggleErrorPanel() {
  _expanded = !_expanded;
  const panel = document.getElementById('error-panel');
  const banner = document.getElementById('error-banner');
  if (!panel || !banner) return;
  if (_expanded) {
    const errors = getErrorLog().filter(e => e.level === 'error');
    panel.innerHTML = errors.slice(0, 20).map((e, i) =>
      `<div class="err-item">
        <div class="err-item-msg">${escapeHtml(e.message || '')}</div>
        <div class="err-item-src">${escapeHtml(e.source || '')} &middot; ${escapeHtml(e.time || '')}</div>
        ${e.stack ? `<pre class="err-item-stack">${escapeHtml(e.stack.slice(0, 300))}</pre>` : ''}
      </div>`
    ).join('') || '<div class="err-empty">Sin errores</div>';
    panel.style.display = 'block';
    banner.classList.add('expanded');
    banner.classList.remove('hidden');
    if (_timer) clearTimeout(_timer);
  } else {
    panel.style.display = 'none';
    banner.classList.remove('expanded');
  }
}

export function limpiarErrores() {
  clearErrorLog();
  _expanded = false;
  const panel = document.getElementById('error-panel');
  const banner = document.getElementById('error-banner');
  if (panel) panel.style.display = 'none';
  if (banner) {
    banner.classList.remove('expanded', 'hidden');
    banner.classList.add('hidden');
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
