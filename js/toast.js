// ==========================================================
//  BookScan AI — toast.js
//  Tiny, dependency-free toast notification system.
//  Usage: import { toast } from './toast.js';
//         toast.success('Saved!'), toast.error('Oops'), etc.
// ==========================================================

const CONTAINER_ID = 'bs-toast-container';
const DEFAULT_DURATION = 3500;

function ensureContainer() {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.className = 'toast-container';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(el);
  }
  return el;
}

function iconFor(kind) {
  switch (kind) {
    case 'success': return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M9 16.2l-3.5-3.6L4 14.1 9 19l11-11-1.5-1.5z"/></svg>';
    case 'error':   return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>';
    case 'warn':    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z"/></svg>';
    default:        return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M11 9h2V7h-2zm1-7a10 10 0 100 20 10 10 0 000-20zm-1 15h2v-6h-2z"/></svg>';
  }
}

function show(message, { kind = 'info', duration = DEFAULT_DURATION, action } = {}) {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');

  el.innerHTML = `
    <span class="toast__icon">${iconFor(kind)}</span>
    <span class="toast__msg"></span>
    <button class="toast__close" aria-label="Dismiss">×</button>
  `;
  el.querySelector('.toast__msg').textContent = message;

  if (action && action.label && typeof action.onClick === 'function') {
    const btn = document.createElement('button');
    btn.className = 'toast__action';
    btn.type = 'button';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      try { action.onClick(); } finally { dismiss(); }
    });
    el.insertBefore(btn, el.querySelector('.toast__close'));
  }

  const dismiss = () => {
    el.classList.add('toast--leaving');
    setTimeout(() => el.remove(), 240);
  };

  el.querySelector('.toast__close').addEventListener('click', dismiss);
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--enter'));

  if (duration > 0) setTimeout(dismiss, duration);
  return dismiss;
}

export const toast = {
  success: (msg, opts = {}) => show(msg, { ...opts, kind: 'success' }),
  error:   (msg, opts = {}) => show(msg, { ...opts, kind: 'error' }),
  warn:    (msg, opts = {}) => show(msg, { ...opts, kind: 'warn' }),
  info:    (msg, opts = {}) => show(msg, { ...opts, kind: 'info' }),
  show
};

export default toast;
