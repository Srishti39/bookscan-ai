// ==========================================================
//  BookScan AI — scanner.js
//  Book lookup + optional ISBN camera scanner.
//  Uses Open Library for metadata and (if available) the
//  browser BarcodeDetector API for ISBN scanning.
// ==========================================================

const OL_SEARCH = 'https://openlibrary.org/search.json';
const OL_COVERS = (id, size = 'M') => `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
const OL_ISBN   = (isbn) => `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`;

// Detect a 10- or 13-digit ISBN (allow dashes/spaces).
const ISBN_RE = /^(?:\d[\s-]?){9,12}[\dXx]$/;

export function isIsbnLike(str) {
  if (!str) return false;
  const trimmed = String(str).trim();
  return ISBN_RE.test(trimmed);
}

function cleanIsbn(str) {
  return String(str).replace(/[^0-9Xx]/g, '').toUpperCase();
}

// ---------- Open Library helpers ----------
async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  return res.json();
}

export async function lookupByIsbn(isbn) {
  const clean = cleanIsbn(isbn);
  try {
    const data = await fetchJson(OL_ISBN(clean));
    return normalizeBook({
      title: data.title,
      authors: (data.authors || []).map(a => a.name || a.key),
      year: data.publish_date,
      covers: data.covers,
      isbn: clean
    });
  } catch (e) {
    return lookupByQuery(clean);
  }
}

export async function lookupByQuery(q) {
  const url = `${OL_SEARCH}?q=${encodeURIComponent(q)}&limit=1`;
  const data = await fetchJson(url);
  const hit = (data.docs || [])[0];
  if (!hit) throw new Error('No book found for that search.');
  return normalizeBook({
    title: hit.title,
    authors: hit.author_name || [],
    year: hit.first_publish_year,
    coverId: hit.cover_i,
    isbn: (hit.isbn || [])[0]
  });
}

function normalizeBook({ title, authors, year, covers, coverId, isbn }) {
  let cover = null;
  if (coverId)              cover = OL_COVERS(coverId, 'M');
  else if (covers?.length)  cover = OL_COVERS(covers[0], 'M');
  return {
    title: title || 'Unknown title',
    authors: Array.isArray(authors) ? authors.filter(Boolean) : [],
    year: year ? String(year) : '',
    cover,
    isbn: isbn || null
  };
}

// Unified entry-point: if the query looks like an ISBN, use the ISBN endpoint.
export async function lookup(query) {
  const q = String(query || '').trim();
  if (!q) throw new Error('Please enter a book title, author, or ISBN.');
  if (isIsbnLike(q)) return lookupByIsbn(q);
  return lookupByQuery(q);
}

// ==========================================================
//  Optional: live ISBN camera scanner via BarcodeDetector.
//  Gracefully no-ops when the API is unavailable.
// ==========================================================

export function isScannerSupported() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Start a live camera scan. Returns a controller with stop().
 * Calls onDetect(isbn) once per unique ISBN.
 */
export async function startCameraScan({ video, onDetect, onError } = {}) {
  if (!isScannerSupported()) {
    const err = new Error('This browser does not support live barcode scanning.');
    onError?.(err);
    throw err;
  }
  if (!video) throw new Error('A <video> element is required');

  const detector = new window.BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
  });

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
  } catch (e) {
    const err = new Error('Camera access was denied.');
    onError?.(err);
    throw err;
  }

  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  await video.play();

  const seen = new Set();
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const codes = await detector.detect(video);
      for (const c of codes) {
        const v = c.rawValue;
        if (v && !seen.has(v) && isIsbnLike(v)) {
          seen.add(v);
          onDetect?.(cleanIsbn(v));
          return; // consumer decides what to do next
        }
      }
    } catch (e) {
      // ignore transient detection errors
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    stop() {
      stopped = true;
      try { stream?.getTracks().forEach(t => t.stop()); } catch {}
      try { video.srcObject = null; } catch {}
    }
  };
}
