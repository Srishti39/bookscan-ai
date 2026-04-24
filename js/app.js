// ==========================================================
//  BookScan AI — app.js
//  Main application controller. Wires together UI, storage,
//  scanner, and groq modules.
// ==========================================================

import { analyzeBook }        from './groq.js';
import { lookup, isScannerSupported, startCameraScan } from './scanner.js';
import { toast }              from './toast.js';
import {
  $, $$, renderSkeleton, renderResult, renderEmpty, renderHistory,
  setBusy, debounce
} from './ui.js';
import {
  getTheme, setTheme,
  getAge, setAge,
  getHistory, addHistory, removeHistory, clearHistory,
  isOnboarded, markOnboarded
} from './storage.js';

// ---------- State ----------
const state = {
  age: getAge() || 'teen',
  lastBook: null,
  lastAnalysis: null,
  scanner: null
};

// ---------- Theme ----------
function applyTheme(theme) {
  const resolved = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', resolved);
  const btn = $('#themeToggle');
  if (btn) btn.setAttribute('aria-pressed', resolved === 'dark');
}

function initTheme() {
  applyTheme(getTheme());
  $('#themeToggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  });
}

// ---------- Age selector ----------
function initAge() {
  const group = $('#ageSegments');
  if (!group) return;
  const buttons = $$('[data-age]', group);
  const sync = () => buttons.forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.age === state.age)
  );
  buttons.forEach(b => b.addEventListener('click', () => {
    state.age = b.dataset.age;
    setAge(state.age);
    sync();
  }));
  sync();
}

// ---------- Main flow ----------
async function runScan(query) {
  const resultHost = $('#result');
  const q = String(query || '').trim();
  if (!q) { toast.warn('Please enter a title, author, or ISBN.'); return; }

  setBusy($('#scanBtn'), true);
  renderSkeleton(resultHost);

  let book;
  try {
    book = await lookup(q);
  } catch (err) {
    resultHost.innerHTML = '';
    toast.error(err.message || 'Could not find that book.');
    setBusy($('#scanBtn'), false);
    return;
  }

  let analysis;
  try {
    analysis = await analyzeBook({ book, age: state.age });
  } catch (err) {
    resultHost.innerHTML = '';
    toast.error(err.message || 'The AI service is unavailable.');
    setBusy($('#scanBtn'), false);
    return;
  }

  state.lastBook = book;
  state.lastAnalysis = analysis;

  renderResult(resultHost, {
    book, analysis, age: state.age,
    onSave:  () => saveCurrent(q),
    onShare: () => shareCurrent(),
    onReset: () => resetScan()
  });

  // Auto-save to history
  saveCurrent(q, { silent: true });
  refreshHistory();
  setBusy($('#scanBtn'), false);
}

function saveCurrent(query, { silent = false } = {}) {
  if (!state.lastBook || !state.lastAnalysis) return;
  addHistory({
    query,
    age: state.age,
    book: state.lastBook,
    verdict: state.lastAnalysis.verdict,
    reasons: state.lastAnalysis.themes || []
  });
  if (!silent) toast.success('Saved to history');
}

async function shareCurrent() {
  if (!state.lastBook) return;
  const text = `BookScan AI — ${state.lastBook.title}: ${state.lastAnalysis?.one_liner || ''}`;
  const shareData = { title: 'BookScan AI', text, url: location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(text + ' ' + location.href);
      toast.success('Link copied to clipboard');
    }
  } catch {
    // user cancelled share
  }
}

function resetScan() {
  state.lastBook = null;
  state.lastAnalysis = null;
  $('#result').innerHTML = '';
  $('#query').value = '';
  $('#query').focus();
}

// ---------- History panel ----------
function refreshHistory() {
  const host = $('#history');
  if (!host) return;
  renderHistory(host, getHistory(), {
    onOpen: (entry) => {
      state.age = entry.age || state.age;
      setAge(state.age);
      initAge();
      $('#query').value = entry.query;
      runScan(entry.query);
    },
    onRemove: (id) => { removeHistory(id); refreshHistory(); },
    onClear: () => { clearHistory(); refreshHistory(); toast.info('History cleared'); }
  });
}

// ---------- Scanner overlay ----------
function openScanner() {
  const overlay = $('#scannerOverlay');
  if (!overlay) return;
  overlay.hidden = false;
  overlay.classList.add('is-open');

  if (!isScannerSupported()) {
    toast.warn('Live camera scanning isn\'t supported in this browser. Please type the ISBN.');
  } else {
    startCameraScan({
      video: $('#scannerVideo'),
      onDetect: (isbn) => {
        closeScanner();
        $('#query').value = isbn;
        runScan(isbn);
      },
      onError: (e) => toast.error(e.message)
    }).then(ctrl => { state.scanner = ctrl; })
      .catch(() => {});
  }
}

function closeScanner() {
  const overlay = $('#scannerOverlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.hidden = true;
  state.scanner?.stop?.();
  state.scanner = null;
}

// ---------- Keyboard shortcuts ----------
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const tag = (e.target?.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea';

    if (e.key === '/' && !typing) {
      e.preventDefault();
      $('#query')?.focus();
    } else if (e.key === 'Escape') {
      closeScanner();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runScan($('#query').value);
    }
  });
}

// ---------- Onboarding ----------
function showOnboardingIfNeeded() {
  if (isOnboarded()) return;
  toast.info('👋 Tip: press "/" to focus search, then try "Harry Potter" or an ISBN.', { duration: 6000 });
  markOnboarded();
}

// ---------- Boot ----------
function boot() {
  initTheme();
  initAge();
  initShortcuts();

  const form = $('#scanForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    runScan($('#query').value);
  });

  $('#openScanner')?.addEventListener('click', openScanner);
  $('#closeScanner')?.addEventListener('click', closeScanner);

  refreshHistory();
  showOnboardingIfNeeded();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
