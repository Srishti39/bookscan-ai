// ==========================================================
//  BookScan AI — storage.js
//  Thin wrappers around localStorage with JSON support,
//  safe fallbacks, and a capped scan-history store.
// ==========================================================

const PREFIX = 'bookscan:';
const K_THEME = PREFIX + 'theme';
const K_HISTORY = PREFIX + 'history';
const K_AGE = PREFIX + 'age';
const K_ONBOARDED = PREFIX + 'onboarded';

const MAX_HISTORY = 50;

function canUseStorage() {
  try {
    const t = '__t__';
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

const ok = canUseStorage();

export function getItem(key, fallback = null) {
  if (!ok) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  if (!ok) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key) {
  if (!ok) return;
  try { localStorage.removeItem(key); } catch {}
}

// ---------- Theme ----------
export function getTheme() {
  return getItem(K_THEME, null); // 'light' | 'dark' | null
}
export function setTheme(theme) {
  setItem(K_THEME, theme);
}

// ---------- Age preference ----------
export function getAge() {
  return getItem(K_AGE, 'teen'); // 'kid' | 'teen' | 'adult'
}
export function setAge(age) {
  setItem(K_AGE, age);
}

// ---------- Onboarded flag ----------
export function isOnboarded() {
  return getItem(K_ONBOARDED, false) === true;
}
export function markOnboarded() {
  setItem(K_ONBOARDED, true);
}

// ---------- Scan history ----------
/**
 * Shape of a history entry:
 * {
 *   id: string,
 *   ts: number,
 *   query: string,        // title/author/isbn the user searched
 *   age: 'kid'|'teen'|'adult',
 *   book: { title, authors, cover, year },
 *   verdict: 'appropriate' | 'caution' | 'not-recommended',
 *   reasons: string[]
 * }
 */

function uid() {
  return 'h_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getHistory() {
  const list = getItem(K_HISTORY, []);
  return Array.isArray(list) ? list : [];
}

export function addHistory(entry) {
  const list = getHistory();
  const full = {
    id: entry.id || uid(),
    ts: entry.ts || Date.now(),
    ...entry
  };
  // De-dupe by query+age (keep the latest)
  const deduped = list.filter(e => !(e.query === full.query && e.age === full.age));
  deduped.unshift(full);
  const capped = deduped.slice(0, MAX_HISTORY);
  setItem(K_HISTORY, capped);
  return full;
}

export function removeHistory(id) {
  const list = getHistory().filter(e => e.id !== id);
  setItem(K_HISTORY, list);
}

export function clearHistory() {
  setItem(K_HISTORY, []);
}

export const STORAGE_AVAILABLE = ok;
