/* GET /api/providers -> which providers exist and whether the SERVER has a key (never the key itself). */
const { P, keysOf } = require('./_providers');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(Object.values(P).map(p => ({ id: p.id, name: p.name, free: p.free, maxTokens: p.maxTokens, hasKey: keysOf(p.id).length > 0, hasList: !!p.modelsUrl, models: p.models })));
};
