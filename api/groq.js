export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Groq-Key');
    if (req.method === 'OPTIONS') return res.status(200).end();
    const apiKey = req.headers['x-groq-key'];
    if (!apiKey) return res.status(401).json({ error: { message: 'NO_KEY' } });
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    try {
          const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + apiKey
                  },
                  body,
          });
          const json = await upstream.json();
          return res.status(upstream.status).json(json);
    } catch (e) {
          return res.status(500).json({ error: { message: e.message } });
    }
}
