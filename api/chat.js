/* POST /api/chat  {provider, model, messages, max_tokens} -> streams the provider's SSE reply. The key never leaves the server. */
const { P, keysOf } = require('./_providers'), { verify, limited } = require('./_auth');
const err = (res, s, m) => res.status(s).json({ error: { message: m } });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return err(res, 405, 'POST only');
  if (process.env.REQUIRE_LOGIN !== 'false' && !process.env.FIREBASE_API_KEY)
    return err(res, 500, 'Server setup: set FIREBASE_API_KEY (or REQUIRE_LOGIN=false for local testing) in your environment.');
  const u = await verify(req); if (!u) return err(res, 401, 'Please log in again.');
  if (limited(u.uid)) return err(res, 429, 'Too many requests. Try again in a few minutes.');
  const b = req.body || {}, p = P[b.provider];
  if (!p) return err(res, 400, 'Unknown provider.');
  if (typeof b.model !== 'string' || !Array.isArray(b.messages) || JSON.stringify(b.messages).length > 600000) return err(res, 400, 'Bad request.');
  const keys = keysOf(p.id);
  if (!keys.length) return err(res, 503, p.name + ' has no key on the server. Add ' + p.id.toUpperCase() + '_API_KEY to your environment.');

  const ctl = new AbortController(); res.on('close', () => ctl.abort());
  const body = JSON.stringify({ model: b.model, messages: b.messages, temperature: .7, max_tokens: Math.min(+b.max_tokens || p.maxTokens, p.maxTokens), stream: true });
  const extra = p.id === 'openrouter' ? { 'HTTP-Referer': process.env.SITE_URL || 'https://localhost', 'X-Title': 'Atlas Ai Builder' } : {};
  let last = { s: 502, m: 'Upstream error' };
  for (const k of keys.sort(() => Math.random() - .5)) {              // rotate keys on auth / rate-limit / server errors
    try {
      const r = await fetch(p.endpoint, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + k, ...extra }, body });
      if (!r.ok) {
        const t = await r.text(); let m = t.slice(0, 300); try { const j = JSON.parse(t); m = (j.error && (j.error.message || j.error)) || m } catch (e) {}
        last = { s: r.status, m: typeof m === 'string' ? m : JSON.stringify(m) };
        if ([401, 402, 403, 429].includes(r.status) || r.status >= 500) continue; break;
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
      for await (const c of r.body) res.write(c);
      return res.end();
    } catch (e) { if (e.name === 'AbortError') return; last = { s: 502, m: 'Could not reach ' + p.name + '.' }; }
  }
  const bad = last.s === 401 || last.s === 403;                         // never reuse 401 for upstream keys (client treats 401 as "log in")
  err(res, bad ? 502 : last.s, (bad ? 'The server key for ' + p.name + ' was rejected. ' : '') + last.m);
};
