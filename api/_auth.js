/* Only logged-in Atlas users may spend your AI keys. Verifies the Firebase ID token with Google's Identity Toolkit. */
const seen = new Map(), hits = new Map();
async function verify(req) {
  if (process.env.REQUIRE_LOGIN === 'false') return { uid: 'anon' };
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''), key = process.env.FIREBASE_API_KEY;
  if (!t || !key) return null;
  const c = seen.get(t); if (c && c.exp > Date.now()) return c.u;
  try {
    const r = await fetch((process.env.IDENTITY_URL || 'https://identitytoolkit.googleapis.com/v1/accounts:lookup') + '?key=' + encodeURIComponent(key),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: t }) });
    if (!r.ok) return null;
    const j = await r.json(), u = j.users && j.users[0]; if (!u) return null;
    const out = { uid: u.localId }; seen.set(t, { u: out, exp: Date.now() + 300000 }); if (seen.size > 500) seen.clear();
    return out;
  } catch (e) { return null; }
}
/** Best-effort per-user limit (resets when the server instance restarts). */
function limited(uid) {
  const n = +process.env.RATE_LIMIT || 40, now = Date.now(), a = (hits.get(uid) || []).filter(x => now - x < 600000);
  a.push(now); hits.set(uid, a); return a.length > n;
}
module.exports = { verify, limited };
