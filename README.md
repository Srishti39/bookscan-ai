# 📚 BookScan AI

> Is this book right for your reader? Scan a title, author, or ISBN and get a warm, age-aware verdict with themes, content notes, and similar reads — in seconds.

**Live demo:** https://bookscan-ai.vercel.app/  
**Stack:** Vanilla JS (ES modules) · CSS custom properties · Groq LLM · Open Library · Vercel serverless

---

## ✨ Features

- 🔎 **Smart lookup** — search by title, author, or ISBN (auto-detected).
- 🎯 **Age-aware guidance** — three reading profiles (Kid 6–10, Teen 11–15, Adult 16+).
- 🧠 **AI verdict** — short summary, themes, content notes, reading level, and discussion questions.
- 📷 **Live ISBN scanner** — uses the browser BarcodeDetector API where available.
- 🕒 **Local scan history** — recent scans are saved to your browser (never a server).
- 🌗 **Dark / light theme** — toggle in the header, preference remembered.
- ⌨️ **Keyboard shortcuts** — \`/\` focuses search, \`Esc\` closes overlays, \`Ctrl/Cmd+Enter\` runs the scan.
- ♿ **Accessible by default** — ARIA roles, focus management, and reduced-motion support.

---

## 🗂️ Project structure

\`\`\`
bookscan-ai/
├── api/
│   └── groq.js          # Vercel serverless proxy for the Groq API
├── css/
│   └── styles.css       # Design tokens + layout + components
├── js/
│   ├── app.js           # Main controller (boots everything)
│   ├── scanner.js       # Open Library lookup + camera barcode
│   ├── groq.js          # Client for /api/groq (builds prompt, parses JSON)
│   ├── ui.js            # Rendering helpers (skeleton, verdict, history)
│   ├── toast.js         # Toast notification system
│   └── storage.js       # localStorage wrapper + scan history
├── index.html           # Semantic shell — loads CSS + JS modules
├── vercel.json          # Platform config
└── README.md
\`\`\`

All JS files are native ES modules (\`<script type="module">\`). No bundler required.

---

## 🚀 Deploy to Vercel (one-click)

1. Fork / clone this repo.
2. In Vercel, **Import Project** → select the repo.
3. Add an environment variable:
   - \`GROQ_API_KEY\` — your Groq API key (get one at https://console.groq.com).
4. Click **Deploy**.

The serverless function in \`api/groq.js\` reads \`GROQ_API_KEY\` from env and forwards the request so your key never ships to the browser.

---

## 💻 Local development

Because this app uses ES modules and a serverless function, the easiest way to run it locally is:

\`\`\`bash
npm i -g vercel
vercel dev
\`\`\`

Then open http://localhost:3000.

If you only want to preview the UI (no AI calls), any static server works:

\`\`\`bash
npx serve .
\`\`\`

---

## 🧩 How it works

\`\`\`
 ┌───────────────┐    1. lookup     ┌───────────────────┐
 │   Browser     │ ───────────────▶ │  Open Library     │
 │ (index.html)  │ ◀─────────────── │  book metadata    │
 └──────┬────────┘                  └───────────────────┘
        │ 2. POST /api/groq { book, age }
        ▼
 ┌───────────────────────────┐    3. /chat/completions   ┌──────────┐
 │ Vercel function api/groq  │ ───────────────────────▶ │   Groq   │
 │   (uses GROQ_API_KEY)     │ ◀─────────────────────── │  (LLM)   │
 └───────────────┬───────────┘                          └──────────┘
                 │ 4. JSON verdict
                 ▼
          rendered in the UI
\`\`\`

---

## 🔒 Privacy

- Your Groq API key lives **only** on the server as a Vercel env variable.
- Scan history is kept in \`localStorage\` in your browser.
- No analytics, no tracking, no third-party cookies.

---

## 🗺️ Roadmap

- [ ] Offline-friendly PWA install
- [ ] Export history as CSV / Markdown
- [ ] Parent / teacher profiles with multiple readers
- [ ] Reading-level comparison between books
- [ ] Multilingual UI

---

## 🤝 Contributing

Issues and PRs are welcome. The codebase is intentionally small and dependency-free, so it should be easy to dive in.

---

## 📄 License

MIT © 2026 Srishti
