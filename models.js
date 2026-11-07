/* Atlas model picker: multi-provider config, live free-model lists, custom searchable picker. */
const Models = (() => {
  const J = k => JSON.parse(localStorage.getItem(k) || 'null'), S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const SKIP = /whisper|tts|speech|embed|guard|moderat|image|orpheus|playai|rerank|transcri|dall|flux|video|audio|diffusion|sdxl/i;
  const real = k => k && !/^YOUR/.test(k), TTL = 6 * 3600e3;
  let provs = [], sel = null, pf = 'all', q = '', freeOnly = true, built = false, down = false;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isFree = (p, m) => p.free === false ? false : p.free === 'openrouter' ? m.free === true || /:free$/.test(m.id) : true;
  const mk = (p, m) => ({ p: p.id, id: m.id, label: m.label || m.id, ctx: m.ctx || 0, free: isFree(p, m) });
  const fmtCtx = n => n ? (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : Math.round(n / 1000) + 'k') + ' ctx' : '';

  const freeOf = (p, m) => p.free === false ? false : p.free === 'openrouter' ? /:free$/.test(m.id) : true;
  /* Providers come from YOUR server (/api/providers): it says which ones have a key, never what the key is. */
  async function init() {
    build(); bind();
    try {
      const r = await fetch('/api/providers');
      if (!r.ok || !/json/.test(r.headers.get('content-type') || '')) throw 0;
      provs = (await r.json()).map(p => ({ ...p, list: (p.models || []).map(m => ({ p: p.id, id: m.id, label: m.label || m.id, ctx: 0, free: freeOf(p, m) })) }));
    } catch (e) { down = true }
    pick(); redraw(); provs.filter(p => p.hasKey && p.hasList).forEach(p => load(p));
  }
  const all = () => provs.flatMap(p => p.list);
  const provOf = id => provs.find(p => p.id === id);
  function pick() {
    const saved = J('atlas_model'), ok = m => m && provOf(m.p) && provOf(m.p).hasKey;
    const mine = all().find(m => saved && m.p === saved.p && m.id === saved.id);
    sel = ok(mine) ? mine : all().find(m => m.free && ok(m)) || all().find(ok) || all()[0] || null;
    label();
  }
  const label = () => document.querySelectorAll('.mdlbtn').forEach(b => { const p = sel && provOf(sel.p); b.textContent = down ? 'AI server offline' : sel ? (p ? p.name : '') + ' · ' + sel.label : 'Choose model'; b.title = sel ? sel.id : '' });
  const current = () => { if (!sel) return null; const p = provOf(sel.p); return p ? { provider: p, id: sel.id, label: sel.label, free: sel.free } : null };

  /* Live model list from /api/models (the server filters and flags free models), cached 6h in this browser. */
  async function load(p, force) {
    const ck = 'atlas_models_' + p.id, c = J(ck);
    if (!force && c && Date.now() - c.t < TTL) { p.list = c.list; pick(); return redraw() }
    p.loading = true; redraw();
    try {
      const r = await fetch('/api/models?provider=' + encodeURIComponent(p.id)); if (!r.ok) throw Error(r.status);
      const list = ((await r.json()).models || []).map(m => ({ p: p.id, id: m.id, label: m.label || m.id, ctx: m.ctx || 0, free: !!m.free }));
      if (list.length) { p.list = list; S(ck, { t: Date.now(), list }) }
    } catch (e) { p.err = true }
    p.loading = false; pick(); redraw();
  }

  /* Custom picker sheet */
  function build() {
    if (built) return; built = true;
    const d = document.createElement('div'); d.className = 'ov'; d.id = 'mpick'; d.hidden = true;
    d.innerHTML = `<div class="mod mp"><button class="x" id="mx">×</button><h3>Choose a model</h3><input class="search" id="mq" placeholder="Search models"><div class="mchips" id="mchips"></div><label class="frl"><input type="checkbox" id="mfree" checked> Free models only</label><div class="mlist" id="mlist"></div><p class="mfoot" id="mfoot"></p></div>`;
    document.body.append(d);
    d.onclick = e => { if (e.target === d) close() };
    $('#mx').onclick = close; $('#mq').oninput = e => { q = e.target.value.toLowerCase(); redraw() };
    $('#mfree').onchange = e => { freeOnly = e.target.checked; redraw() };
  }
  const bind = () => document.querySelectorAll('.mdlbtn').forEach(b => b.onclick = open);
  function open() { $('#mpick').hidden = false; $('#mq').value = ''; q = ''; redraw(); }
  function close() { $('#mpick').hidden = true }
  function redraw() {
    if (!built) return;
    const chips = [['all', 'All'], ...provs.map(p => [p.id, p.name])];
    $('#mchips').innerHTML = chips.map(([id, n]) => `<button class="chip${pf === id ? ' on' : ''}" data-p="${id}">${esc(n)}</button>`).join('');
    $('#mchips').querySelectorAll('.chip').forEach(b => b.onclick = () => { pf = b.dataset.p; redraw() });
    let h = '', shown = 0;
    provs.filter(p => pf === 'all' || p.id === pf).forEach(p => {
      const items = p.list.filter(m => (!freeOnly || m.free) && (m.label + ' ' + m.id).toLowerCase().includes(q));
      if (!items.length && !p.loading) return;
      h += `<div class="mg">${esc(p.name)} ${p.loading ? '· loading...' : '· ' + items.length}${p.hasKey ? '' : ' · no key'}${p.hasKey && p.hasList ? ` <a href="#" data-r="${p.id}">refresh</a>` : ''}</div>`;
      items.forEach(m => { shown++; h += `<button class="mi${sel && sel.p === m.p && sel.id === m.id ? ' on' : ''}" data-p="${m.p}" data-m="${esc(m.id)}"${p.hasKey ? '' : ' disabled'}><div><b>${esc(m.label)}</b><small>${esc(m.id)}</small></div>${m.ctx ? `<span class="tg nk">${fmtCtx(m.ctx)}</span>` : ''}<span class="tg${m.free ? '' : ' pd'}">${m.free ? 'FREE' : 'PAID'}</span></button>` });
    });
    $('#mlist').innerHTML = h || '<p class="empty">No models match.</p>';
    $('#mlist').querySelectorAll('.mi').forEach(b => b.onclick = () => { sel = all().find(m => m.p === b.dataset.p && m.id === b.dataset.m); S('atlas_model', { p: sel.p, id: sel.id }); label(); close() });
    $('#mlist').querySelectorAll('[data-r]').forEach(a => a.onclick = e => { e.preventDefault(); load(provOf(a.dataset.r), true) });
    const miss = provs.filter(p => !p.hasKey).map(p => p.name);
    $('#mfoot').textContent = down ? 'Could not reach the AI server (/api/providers). Deploy to Vercel or run "node server.js".' : miss.length ? 'Add keys to .env (or Vercel environment variables) to unlock: ' + miss.join(', ') + '.' : '';
  }
  return { init, current };
})();
