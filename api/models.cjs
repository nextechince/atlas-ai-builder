/* GET /api/models?provider=id -> live chat-model list with a free flag (cached 6h). */
const { P, keysOf } = require('./_providers');
const SKIP = /whisper|tts|speech|embed|guard|moderat|image|orpheus|playai|rerank|transcri|dall|flux|video|audio|diffusion|sdxl/i;
const cache = new Map();
module.exports = async (req, res) => {
  const p = P[(req.query && req.query.provider) || ''];
  if (!p || !p.modelsUrl) return res.status(400).json({ error: { message: 'Unknown provider' } });
  const hit = cache.get(p.id); res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate');
  if (hit && hit.exp > Date.now()) return res.json({ models: hit.list });
  const keys = keysOf(p.id);
  if (p.free !== 'openrouter' && !keys.length) return res.status(503).json({ error: { message: 'No key for ' + p.name } });
  try {
    const r = await fetch(p.modelsUrl, { headers: keys.length ? { Authorization: 'Bearer ' + keys[0] } : {} });
    if (!r.ok) throw Error(r.status);
    const j = await r.json(), arr = j.data || j.models || j;
    const list = arr.filter(m => m && m.id && !SKIP.test(m.id) && m.active !== false && !(m.architecture && m.architecture.output_modalities && !m.architecture.output_modalities.includes('text')))
      .map(m => ({ id: m.id, label: m.name || m.id, ctx: m.context_length || m.context_window || 0,
        free: p.free === false ? false : p.free === 'openrouter' ? (/:free$/.test(m.id) || !!(m.pricing && +m.pricing.prompt === 0 && +m.pricing.completion === 0)) : true }))
      .sort((a, b) => a.label.localeCompare(b.label));
    cache.set(p.id, { list, exp: Date.now() + 6 * 3600e3 });
    res.json({ models: list });
  } catch (e) { res.status(502).json({ error: { message: 'Could not load the model list.' } }); }
};
