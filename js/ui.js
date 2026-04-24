// ==========================================================
//  BookScan AI — ui.js
//  Rendering helpers for the main card, verdict view,
//  skeleton loader, history list, and small utilities.
// ==========================================================

// ---------- DOM helpers ----------
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    }
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null || c === false) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

export function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- Skeleton loader ----------
export function renderSkeleton(host) {
  host.innerHTML = `
    <div class="skeleton-card" aria-busy="true" aria-live="polite">
      <div class="sk sk--cover"></div>
      <div class="sk-body">
        <div class="sk sk--line lg"></div>
        <div class="sk sk--line md"></div>
        <div class="sk sk--line sm"></div>
        <div class="sk-row">
          <div class="sk sk--chip"></div>
          <div class="sk sk--chip"></div>
          <div class="sk sk--chip"></div>
        </div>
      </div>
    </div>
  `;
}

// ---------- Empty state ----------
export function renderEmpty(host, { title = 'Nothing here yet', hint = '' } = {}) {
  host.innerHTML = `
    <div class="empty">
      <div class="empty__art" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="64" height="64"><path fill="currentColor" d="M12 8h28a6 6 0 016 6v36a6 6 0 01-6 6H18a6 6 0 01-6-6V8zm4 4v38a2 2 0 002 2h22a2 2 0 002-2V14a2 2 0 00-2-2H16zm4 8h20v4H20zm0 8h20v4H20zm0 8h14v4H20z"/></svg>
      </div>
      <h3 class="empty__title"></h3>
      <p class="empty__hint"></p>
    </div>
  `;
  host.querySelector('.empty__title').textContent = title;
  host.querySelector('.empty__hint').textContent = hint;
}

// ---------- Verdict card ----------
const VERDICT_META = {
  'appropriate':    { label: 'Recommended',    cls: 'v--ok',   icon: '✅' },
  'caution':        { label: 'Read together',  cls: 'v--warn', icon: '⚠️' },
  'not-recommended':{ label: 'Not recommended',cls: 'v--bad',  icon: '⛔' }
};

export function renderResult(host, { book, analysis, age, onSave, onShare, onReset }) {
  const meta = VERDICT_META[analysis.verdict] || VERDICT_META['caution'];
  const cover = book.cover
    ? `<img class="book__cover" src="${escapeHtml(book.cover)}" alt="Cover of ${escapeHtml(book.title)}" loading="lazy">`
    : `<div class="book__cover book__cover--ph" aria-hidden="true">📘</div>`;

  const notes = (analysis.content_notes || [])
    .filter(n => n.level && n.level !== 'none')
    .map(n => `
      <li class="note note--${escapeHtml(n.level)}">
        <span class="note__kind">${escapeHtml(n.kind || 'note')}</span>
        <span class="note__level">${escapeHtml(n.level)}</span>
        <span class="note__text">${escapeHtml(n.note || '')}</span>
      </li>`).join('');

  const themes = (analysis.themes || []).slice(0, 6)
    .map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('');

  const similar = (analysis.similar || []).slice(0, 4)
    .map(s => `<li>${escapeHtml(s)}</li>`).join('');

  const questions = (analysis.discussion_questions || []).slice(0, 4)
    .map(q => `<li>${escapeHtml(q)}</li>`).join('');

  host.innerHTML = `
    <article class="verdict ${meta.cls}" role="region" aria-label="Book verdict">
      <header class="verdict__head">
        ${cover}
        <div class="verdict__titleblock">
          <span class="verdict__badge">${meta.icon} ${meta.label}</span>
          <h2 class="verdict__title"></h2>
          <p class="verdict__byline"></p>
          <p class="verdict__oneliner"></p>
        </div>
      </header>

      <section class="verdict__section">
        <h3>Summary</h3>
        <p class="verdict__summary"></p>
      </section>

      ${themes ? `<section class="verdict__section"><h3>Themes</h3><div class="chips">${themes}</div></section>` : ''}

      ${notes ? `<section class="verdict__section"><h3>Heads-up</h3><ul class="notes">${notes}</ul></section>` : ''}

      <section class="verdict__meta">
        <div><span class="label">Reading level</span><span class="val">${escapeHtml(analysis.reading_level || '—')}</span></div>
        <div><span class="label">Est. hours</span><span class="val">${Number(analysis.estimated_hours || 0) || '—'}</span></div>
        <div><span class="label">For</span><span class="val">${escapeHtml(age)}</span></div>
      </section>

      ${similar ? `<section class="verdict__section"><h3>You may also like</h3><ul class="list">${similar}</ul></section>` : ''}

      ${questions ? `<section class="verdict__section"><h3>Discussion questions</h3><ul class="list">${questions}</ul></section>` : ''}

      <footer class="verdict__actions">
        <button class="btn btn--ghost" data-act="share">🔗 Share</button>
        <button class="btn btn--ghost" data-act="save">💾 Save to history</button>
        <button class="btn btn--primary" data-act="reset">Scan another</button>
      </footer>
    </article>
  `;

  host.querySelector('.verdict__title').textContent = book.title || 'Untitled';
  host.querySelector('.verdict__byline').textContent =
    (book.authors || []).join(', ') + (book.year ? ` · ${book.year}` : '');
  host.querySelector('.verdict__oneliner').textContent = analysis.one_liner || '';
  host.querySelector('.verdict__summary').textContent = analysis.summary || '';

  host.querySelector('[data-act="share"]').addEventListener('click', () => onShare?.());
  host.querySelector('[data-act="save"]').addEventListener('click',  () => onSave?.());
  host.querySelector('[data-act="reset"]').addEventListener('click', () => onReset?.());
}

// ---------- History list ----------
export function renderHistory(host, entries, { onOpen, onRemove, onClear }) {
  if (!entries.length) {
    renderEmpty(host, { title: 'No scans yet', hint: 'Your recent books will appear here.' });
    return;
  }

  host.innerHTML = `
    <div class="history__head">
      <h3>Recent</h3>
      <button class="linkish" data-act="clear">Clear all</button>
    </div>
    <ul class="history__list"></ul>
  `;
  const list = host.querySelector('.history__list');
  entries.forEach(e => {
    const li = document.createElement('li');
    li.className = 'history__item';
    li.innerHTML = `
      <button class="history__row" aria-label="Open">
        <span class="history__title"></span>
        <span class="history__meta"></span>
      </button>
      <button class="iconbtn" data-remove aria-label="Remove">×</button>
    `;
    li.querySelector('.history__title').textContent = e.book?.title || e.query;
    li.querySelector('.history__meta').textContent =
      `${e.age} · ${new Date(e.ts).toLocaleDateString()}`;
    li.querySelector('.history__row').addEventListener('click', () => onOpen?.(e));
    li.querySelector('[data-remove]').addEventListener('click', (ev) => {
      ev.stopPropagation();
      onRemove?.(e.id);
    });
    list.appendChild(li);
  });
  host.querySelector('[data-act="clear"]').addEventListener('click', () => onClear?.());
}

// ---------- Misc ----------
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function setBusy(node, busy) {
  if (!node) return;
  node.toggleAttribute('disabled', !!busy);
  node.setAttribute('aria-busy', busy ? 'true' : 'false');
}
