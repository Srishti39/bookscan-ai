# 📚 BookScan AI

> Scan any book. Get an instant summary and an age-appropriateness verdict powered by AI.

BookScan AI is a lightweight web app that helps you decide if a book is a good fit for a specific age group — perfect for parents picking gifts, teachers building reading lists, or anyone who wants a quick vibe-check on a book before buying.

Point your phone's camera at the barcode, upload a photo of the cover, or just type the title — the app calls a free Groq LLM to fetch book metadata, summarise the plot, surface the major themes, and deliver a clear ✅ green or 🚫 red age verdict with supporting evidence.

**🌐 Live demo:** [bookscan-ai.vercel.app](https://bookscan-ai.vercel.app) *(or your own Vercel URL)*

---

## ✨ Features

- **📷 Live barcode scanner** — real-time ISBN detection via the browser's native `BarcodeDetector` API (works best on mobile Chrome / Android)
- **🖼️ Photo upload** — drag or snap a photo of the barcode, cover, or spine; a vision model reads it for you (great on desktop where webcams struggle with barcodes)
- **⌨️ Manual search** — type any title, author, or ISBN
- **👤 Age targeting** — pick from Child (6-8), Preteen (9-12), Teen (13-17), or Adult 18+
- **✅ / 🚫 Color-coded verdict** — the whole result card turns green when appropriate, red when not
- **📝 Rich analysis** — plot summary, content themes as chips, reasoning, and specific evidence passages
- **🔐 Bring-your-own-key** — each visitor enters their own Groq API key, stored only in their browser's localStorage

---

## 🧰 Tech Stack

| Layer    | Choice                                                           |
|----------|------------------------------------------------------------------|
| Frontend | Vanilla HTML / CSS / JS — zero build, zero dependencies          |
| Scanner  | Native `BarcodeDetector` Web API                                  |
| LLM      | Groq ([llama-3.3-70b-versatile](https://groq.com))               |
| Vision   | Groq (`meta-llama/llama-4-scout-17b-16e-instruct`)               |
| Backend  | Single Vercel Serverless Function (`api/groq.js`) as CORS proxy  |
| Hosting  | Vercel (Hobby tier, free)                                        |

---

## 📁 Project Structure

```
bookscan-ai/
├── index.html       # Entire frontend (UI + scanner + analysis logic)
├── api/
│   └── groq.js      # Serverless proxy → forwards requests to Groq
├── vercel.json      # Vercel config (empty {}; auto-detection)
└── README.md
```

---

## 🚀 Deploy Your Own Copy

### 1. Fork or clone this repo

```bash
git clone https://github.com/Srishti39/bookscan-ai.git
```

### 2. Get a free Groq API key

1. Go to [console.groq.com](https://console.groq.com) → **API Keys** → **Create API Key**
2. Copy the key (starts with `gsk_...`)
3. Keep it private — never commit it to Git

### 3. Deploy to Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub
2. Click **Add New → Project** and import your fork
3. Leave all defaults (framework: *Other*, root dir: `./`) and click **Deploy**
4. Your app goes live in ~30 seconds

No environment variables required — each visitor pastes their own Groq key on the first-launch screen.

---

## 💻 Run Locally

Because everything is static HTML + one serverless function, you can run it with the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Then open [http://localhost:3000](http://localhost:3000).

Or, if you just want to hack on the UI without the proxy, you can open `index.html` directly in a browser — the Groq calls will fail (CORS), but everything else renders.

---

## 🔄 How It Works

```
┌───────────┐   ISBN / title / photo    ┌──────────────────────┐
│  Browser  │ ────────────────────────▶ │  /api/groq (Vercel)  │
│  (HTML)   │                           │   serverless proxy   │
└───────────┘                           └──────────┬───────────┘
      ▲                                             │
      │                                             ▼
      │           JSON verdict + summary     ┌─────────────┐
      └───────────────────────────────────── │  Groq API   │
                                             │  Llama 3.3  │
                                             └─────────────┘
```

1. User enters an ISBN / title, or uploads a photo
2. If it's a photo, the vision model extracts ISBN / title / author
3. The proxy forwards a chat-completion request to Groq with the user's API key (via `X-Groq-Key` header)
4. Groq replies with a strict-JSON verdict: `{ book, summary, themes, ageCheck }`
5. The UI renders it green (appropriate) or red (not recommended)

---

## 🔐 Privacy & Security

- **Your Groq API key stays on your device.** It's stored in your browser's `localStorage` and sent to the Vercel proxy only as a request header (never logged, never committed).
- **The proxy doesn't persist anything** — it's a stateless pass-through to Groq.
- **No analytics, no cookies, no third-party trackers.**
- If you share your live URL with a friend, they'll be prompted to enter *their own* Groq key on first launch.

---

## 🗺️ Roadmap

- [ ] Save scan history locally so you can revisit past lookups
- [ ] Offline mode for the UI shell (PWA)
- [ ] Book-cover image results pulled from Open Library
- [ ] Multi-language support for summaries
- [ ] Shareable verdict cards (export as PNG)

---

## 🤝 Contributing

PRs and issues welcome! If you find a book where the AI's verdict feels off, open an issue with the title, your target age, and the response you got — it really helps tune the prompts.

---

## 📄 License

MIT — do whatever you want, just don't blame me if the AI gives a weird reading recommendation. 😉

---

*Built with curiosity by [@Srishti39](https://github.com/Srishti39) · Powered by Groq + Llama 3.3*
