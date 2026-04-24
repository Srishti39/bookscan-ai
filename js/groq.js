// ==========================================================
//  BookScan AI — groq.js
//  Client for the /api/groq serverless proxy.
//  Builds the age-aware prompt, sends the request, and
//  parses a defensive JSON response.
// ==========================================================

const ENDPOINT = '/api/groq';

// Lightweight timeout wrapper for fetch.
function withTimeout(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

const AGE_PROFILE = {
  kid:   { label: 'Ages 6–10',  tone: 'very gentle, simple vocabulary, short sentences' },
  teen:  { label: 'Ages 11–15', tone: 'clear, encouraging, moderate vocabulary' },
  adult: { label: '16+',        tone: 'thoughtful, nuanced, full vocabulary' }
};

function buildPrompt({ book, age }) {
  const profile = AGE_PROFILE[age] || AGE_PROFILE.teen;
  const title = book?.title || 'Unknown title';
  const authors = (book?.authors || []).join(', ') || 'Unknown author';
  const year = book?.year || 'n/a';

  return [
    `You are BookScan AI, a careful and warm children's-literature guide.`,
    `A reader is asking about the book "${title}" by ${authors} (${year}).`,
    `They want guidance for ${profile.label}. Tone: ${profile.tone}.`,
    '',
    'Return ONLY a compact JSON object with these fields:',
    '{',
    '  "verdict": "appropriate" | "caution" | "not-recommended",',
    '  "one_liner": "short sentence for the reader",',
    '  "summary": "2-3 sentence plot summary, spoiler-free",',
    '  "themes": ["theme1", "theme2", "theme3"],',
    '  "content_notes": [',
    '    { "kind": "violence"|"language"|"scary"|"romance"|"drugs"|"other", "level": "none"|"mild"|"moderate"|"strong", "note": "one line" }',
    '  ],',
    '  "reading_level": "Grade K-2" | "Grade 3-5" | "Grade 6-8" | "Grade 9-12" | "Adult",',
    '  "estimated_hours": number,',
    '  "similar": ["Book 1 by Author", "Book 2 by Author"],',
    '  "discussion_questions": ["q1", "q2"]',
    '}',
    '',
    'Do not wrap it in markdown. Do not add commentary. JSON only.'
  ].join('\n');
}

// Extract the first JSON object from a text blob. LLMs sometimes prefix/suffix.
function parseJsonLoose(text) {
  if (!text) throw new Error('Empty response');
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {}

  const first = trimmed.indexOf('{');
  const last  = trimmed.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    return JSON.parse(slice);
  }
  throw new Error('Could not parse JSON from model output');
}

/**
 * Ask the Groq-backed serverless function about a book.
 * @param {object} args
 * @param {{title:string, authors?:string[], year?:string}} args.book
 * @param {'kid'|'teen'|'adult'} args.age
 * @param {number} [args.timeout=20000]
 * @returns {Promise<object>} parsed JSON response
 */
export async function analyzeBook({ book, age, timeout = 20000 }) {
  const t = withTimeout(timeout);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: t.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You answer with JSON only. No prose.' },
          { role: 'user',   content: buildPrompt({ book, age }) }
        ],
        temperature: 0.3,
        max_tokens: 900
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Server error ${res.status}: ${body || res.statusText}`);
    }

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content ??
      data?.content ??
      '';
    return parseJsonLoose(text);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request took too long. Please try again.');
    }
    throw err;
  } finally {
    t.done();
  }
}

export const __groqInternals = { buildPrompt, parseJsonLoose, AGE_PROFILE };
