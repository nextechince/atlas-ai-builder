const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const LS = (k, v) => v === undefined ? JSON.parse(localStorage.getItem(k) || 'null') : localStorage.setItem(k, JSON.stringify(v));
const LANGS = ['English', 'Español', 'Français', 'Português', 'Deutsch', 'العربية', '中文', 'हिन्दी', 'Kiswahili', 'Yorùbá'];
const TPL = [['🚀', 'SaaS landing', 'Business', 'a modern SaaS landing page for a team collaboration tool with pricing and FAQ', 'var(--l)'], ['🍝', 'Restaurant', 'Business', 'a warm Mediterranean restaurant site with menu, reservations and gallery', 'var(--pe)'], ['🕯️', 'Online store', 'Store', 'an online candle store with product grid, cart and checkout flow', 'var(--p)'], ['🎨', 'Portfolio', 'Personal', 'a designer portfolio with case studies and contact form', 'var(--m)'], ['🎶', 'Event page', 'Events', 'an event page for a one-day music and tech festival with schedule and tickets', 'var(--l)'], ['🔗', 'Link in bio', 'Personal', 'a link-in-bio page for a photographer with featured links', 'var(--p)']];
let user, mode = 'build', proj = null, busy = false;

LANGS.forEach(l => $$('.lang').forEach(s => s.add(new Option(l))));
$$('.lang').forEach(s => s.onchange = () => $$('.lang').forEach(x => x.value = s.value));

(async () => {
  await Atlas.ready; await Atlas.authReady; user = Atlas.user;
  Models.init();
  ui();
  if (user) { try { const a = await Atlas.listProjects(), l = projs(); a.forEach(p => { if (!l.find(x => x.id === p.id)) l.push(p) }); LS(key(), l); renderGrid() } catch (e) {} }
  const p = sessionStorage.getItem('pending');
  if (p && user) { sessionStorage.removeItem('pending'); startProject(p) }
})();

function ui() {
  $('#who').textContent = user ? user.name : '';
  $('#lg').hidden = $('#sg').hidden = !!user; $('#out').hidden = !user; renderGrid();
}
$('#out').onclick = async () => { await Atlas.logout(); location.reload() };
$('#homeBtn').onclick = () => show('home');
function show(w) { $('#homeView').hidden = w !== 'home'; $('#ws').hidden = w === 'home'; $('#homeBtn').hidden = w === 'home'; if (w === 'home') renderGrid() }

/* projects */
const key = () => 'p_' + (user ? user.uid || user.email : 'guest');
const projs = () => LS(key()) || [];
function save() {
  const a = projs().filter(p => p.id !== proj.id); a.unshift(proj); LS(key(), a.slice(0, 30));
  try { Promise.resolve(Atlas.saveProject(proj)).catch(() => {}) } catch (e) {}
}
const pvBundle = f => Atlas.bundle(f, true); // preview-safe bundle (fixes #links inside srcdoc frames)
let tf = 'All', tq = '';
const CATS = ['All', 'Business', 'Store', 'Personal', 'Events'];
const ro = new ResizeObserver(es => es.forEach(e => { const f = e.target.firstChild; if (f) f.style.transform = `scale(${e.target.clientWidth / 1100})` }));
const seen = new WeakSet();
const fitThumbs = () => $$('.thumb').forEach(t => { if (!seen.has(t)) { seen.add(t); ro.observe(t) } });
/* Scaled live preview of a page (1100px canvas shrunk to the card width). */
const thumb = (html, cls = '', scripts = false) => `<div class="thumb ${cls}"><iframe sandbox="${scripts ? 'allow-scripts' : ''}" tabindex="-1" loading="lazy" srcdoc="${esc(html)}"></iframe></div>`;
const blank = '<body style="margin:0;background:linear-gradient(135deg,#eef1ff,#ffe9f0);font:600 40px system-ui;color:#9aa3c7;display:grid;place-items:center;height:100vh">New project</body>';

function renderGrid() {
  const g = $('#grid'), t = $('.tabs .on').dataset.t; g.innerHTML = ''; $('#tfilter').hidden = t !== 'tpl';
  if (t === 'tpl') {
    TPL.filter(x => (tf === 'All' || x[2] === tf) && (x[1] + ' ' + x[3]).toLowerCase().includes(tq)).forEach(x => {
      const c = document.createElement('div'); c.className = 'card';
      c.innerHTML = thumb(TPL_PAGES[x[1]] || blank) + `<div class=ct><b>${x[1]}</b> <small>${x[2]}</small><p class=cd>${(TDET[x[1]] || {}).d || ''}</p></div>`;
      c.onclick = () => openView({ t: 'tpl', x }); g.append(c);
    });
    if (!g.children.length) g.innerHTML = '<p class=empty>No templates match your search.</p>';
  } else {
    const a = user ? projs() : [];
    if (!a.length) g.innerHTML = '<p class=empty>' + (user ? 'No apps yet. Describe one above or start from a template.' : 'Login to see your apps.') + '</p>';
    a.forEach(p => {
      const c = document.createElement('div'); c.className = 'card'; const n = Object.keys(p.files).length;
      c.innerHTML = thumb(p.files['index.html'] ? pvBundle(p.files) : blank, '', true) + `<div class=ct><b>${esc(p.name)}</b> ${p.published ? '<small class=live2>● Live</small>' : '<small>Draft</small>'}<p class=cd>${n} file${n === 1 ? '' : 's'}${p.created ? ' · ' + new Date(p.created).toLocaleDateString() : ''}</p></div>`;
      c.onclick = () => openView({ t: 'app', p }); g.append(c);
    });
  }
  fitThumbs(); renderDash();
}
function renderDash() {
  const d = $('#dash'); if (!user) { d.hidden = true; return } d.hidden = false;
  const a = projs(), live = a.filter(p => p.published).length, files = a.reduce((n, p) => n + Object.keys(p.files).length, 0), last = a[0];
  const hr = new Date().getHours(), gr = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  d.innerHTML = `<div class=dgreet><div><h2>${gr}, ${esc(user.name)}</h2><p class=muted>${a.length ? 'Pick up where you left off or start something new.' : 'Create your first app in under a minute.'}</p></div><button class="btn pri" id=dnew>+ New app</button></div>
<div class=stats><div class=stat style="background:var(--l)"><b data-n=${a.length}>0</b><span>Projects</span></div><div class=stat style="background:var(--m)"><b data-n=${live}>0</b><span>Published</span></div><div class=stat style="background:var(--p)"><b data-n=${files}>0</b><span>Files built</span></div><div class=stat style="background:var(--pe)"><b data-n=${a.reduce((n, p) => n + p.chat.filter(m => m.r === 'u').length, 0)}>0</b><span>Prompts sent</span></div></div>
${last ? `<div class=cont id=dcont>${thumb(last.files['index.html'] ? pvBundle(last.files) : blank, '', true)}<div><small class=muted>CONTINUE WHERE YOU LEFT OFF</small><h3>${esc(last.name)}</h3><p class=muted>${Object.keys(last.files).length} files · ${last.published ? 'Live' : 'Draft'}</p><button class="btn pri">Open project</button></div></div>` : ''}`;
  $('#dnew').onclick = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); $('#hp').focus() };
  const dc = $('#dcont'); if (dc) dc.onclick = () => openProject(last);
  $$('.stat b').forEach(b => { const n = +b.dataset.n, t0 = performance.now(); (function s(t) { const k = Math.min(1, (t - t0) / 700); b.textContent = Math.round(n * k); if (k < 1) requestAnimationFrame(s) })(t0) });
  fitThumbs();
}
$('#tfilter').innerHTML = '<input class=search id=tsearch placeholder="Search templates">' + CATS.map(c => `<button class="chip${c === 'All' ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
$('#tsearch').oninput = e => { tq = e.target.value.toLowerCase(); renderGrid() };
$$('#tfilter .chip').forEach(b => b.onclick = () => { tf = b.dataset.c; $$('#tfilter .chip').forEach(x => x.classList.toggle('on', x === b)); renderGrid() });
$$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); renderGrid() });
['Portfolio', 'Solar System', 'Restaurant Menu', 'Calculator', 'Minimal Blog'].forEach(n => { const c = document.createElement('button'); c.className = 'chip'; c.textContent = n; c.onclick = () => { $('#hp').value = 'Build a beautiful ' + n.toLowerCase() + ' website'; $('#hp').focus() }; $('#chips').append(c) });
$('#hgo').onclick = () => { const v = $('#hp').value.trim(); if (v) startProject(v + (selStyle ? `. Art direction "${selStyle[0]}": ${selStyle[1]}. Palette: ${selStyle[2]}. Font feel: ${selStyle[3]}.` : '')) };

function startProject(text) {
  if (!user) { sessionStorage.setItem('pending', text); location.href = 'login.html'; return }
  proj = { id: Date.now().toString(36), name: text.replace(/^Build (a |an )?/i, '').split(/[.,]/)[0].slice(0, 40), created: Date.now(), files: {}, history: [], chat: [] };
  openProject(proj); setMode('build'); send(text);
}
function openProject(p) {
  proj = p; show('ws'); $('#pn').textContent = p.name; $('#msgs').innerHTML = '';
  p.chat.forEach(m => bubble(m.r, m.r === 'u' ? esc(m.t) : md(m.t)));
  if (!p.chat.length) bubble('a', '<b>Hi! I\'m Atlas.</b> Tell me what to build, or switch to <b>Discuss</b> to plan first.');
  preview(); $('#ws').classList.toggle('pvmode', !!Object.keys(p.files).length);
}
function setMode(m) { mode = m; $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#tx').placeholder = m === 'build' ? 'Describe a change or what to build...' : 'Ask for ideas, advice, comparisons...' }
$$('.seg button').forEach(b => b.onclick = () => setMode(b.dataset.m));
$('#toPv').onclick = () => $('#ws').classList.add('pvmode');
$('#toChat').onclick = () => $('#ws').classList.remove('pvmode');
$$('[data-w]').forEach(b => b.onclick = () => $('#pv').style.width = b.dataset.w);

/* rich message rendering */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inl = s => esc(s)
  .replace(/!\[(.*?)\]\((https?:[^)\s]+)\)/g, '<figure><img src="$2" alt="$1" loading="lazy" onerror="this.parentNode.style.display=\'none\'"><figcaption>$1</figcaption></figure>')
  .replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?![\s*])(.+?)\*(?!\*)/g, '$1<i>$2</i>')
  .replace(/\x60(.+?)\x60/g, '<code>$1</code>');
function rich(t, d) {
  if (t === 'cards') return '<div class=cards>' + d.map(c => `<div><span class=e>${esc(c.emoji || '✨')}</span><b>${esc(c.title || '')}</b>${inl(c.text || '')}</div>`).join('') + '</div>';
  const it = d.items || d;
  return `<div class=opts>${d.q ? '<b>' + esc(d.q) + '</b>' : ''}${it.map(i => `<button data-o="${esc(i)}">${esc(i)}</button>`).join('')}</div>`;
}
/* Markdown subset: headings, bold/italic/code, links, images, lists, quotes, tables, code blocks, hr + cards/options blocks. Safe while streaming. */
function md(s) {
  const fo = [...s.matchAll(new RegExp(T + '(cards|options)\\n', 'g'))].pop();
  if (fo && s.indexOf(T, fo.index + fo[0].length) < 0) s = s.slice(0, fo.index); // hide a half-streamed block
  const B = []; s = s.replace(new RegExp(T + '(cards|options)\\n([\\s\\S]*?)' + T, 'g'), (m, t, j) => { let x = ''; try { x = rich(t, JSON.parse(j)) } catch (e) {} B.push(x); return '\n@@' + (B.length - 1) + '@@\n' });
  const L = s.split('\n'); let o = '', i = 0, list = null; const close = () => { if (list) { o += '</' + list + '>'; list = null } };
  while (i < L.length) {
    const l = L[i];
    if (/^\x60\x60\x60/.test(l)) { close(); const c = []; i++; while (i < L.length && !/^\x60\x60\x60/.test(L[i])) c.push(L[i++]); i++; o += '<pre><code>' + esc(c.join('\n')) + '</code></pre>'; continue }
    if (/^\|/.test(l) && /^\|[\s:|-]+\|?$/.test(L[i + 1] || '')) { close(); const r = []; while (i < L.length && /^\|/.test(L[i])) r.push(L[i++]); const c = x => x.replace(/^\||\|$/g, '').split('|').map(y => y.trim()); o += '<div class=tw><table><tr>' + c(r[0]).map(x => '<th>' + inl(x) + '</th>').join('') + '</tr>' + r.slice(2).map(x => '<tr>' + c(x).map(y => '<td>' + inl(y) + '</td>').join('') + '</tr>').join('') + '</table></div>'; continue }
    const h = l.match(/^(#{1,3}) (.*)/), ul = l.match(/^\s*[-*] (.*)/), ol = l.match(/^\s*\d+[.)] (.*)/), bq = l.match(/^> ?(.*)/);
    if (ul || ol) { const t = ul ? 'ul' : 'ol'; if (list !== t) { close(); o += '<' + t + '>'; list = t } o += '<li>' + inl((ul || ol)[1]) + '</li>' }
    else {
      close();
      if (h) o += `<h${h[1].length + 1}>${inl(h[2])}</h${h[1].length + 1}>`;
      else if (/^---+$/.test(l.trim())) o += '<hr>';
      else if (bq) o += '<blockquote>' + inl(bq[1]) + '</blockquote>';
      else if (/^@@\d+@@$/.test(l.trim())) o += B[+l.trim().slice(2, -2)];
      else if (l.trim()) o += '<p>' + inl(l) + '</p>';
    }
    i++;
  }
  close(); return o;
}
function bubble(r, h) { const d = document.createElement('div'); d.className = 'm ' + r; d.dataset.m = mode; d.innerHTML = h; $('#msgs').append(d); $('#msgs').scrollTop = 1e9; return d }
$('#msgs').onclick = e => { const b = e.target.closest('[data-o]'); if (b && !busy) { setMode(b.closest('.m').dataset.m || mode); send(b.dataset.o) } };

/* chat + build (real streaming) */
let ctl = null;
const SP = '<span class=sp></span>', CK = '<span class=ck>✓</span>';
$('#send').onclick = () => { if (busy) { ctl && ctl.abort(); return } const v = $('#tx').value.trim(); if (v) { $('#tx').value = ''; send(v) } };
$('#tx').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!busy) $('#send').click() } };
const setBusy = b => { busy = b; $('#send').textContent = b ? '■' : '↑'; $('#send').classList.toggle('stop', b); $('#send').title = b ? 'Stop' : 'Send' };
const stream = (msgs, onDelta, temp) => {
  const m = Models.current();
  if (!m) return Promise.reject(Error('No AI provider is available. Check that your server is running (see README.md).'));
  if (!m.provider.hasKey) return Promise.reject(Error('Add ' + m.provider.id.toUpperCase() + '_API_KEY to your .env (or Vercel environment variables), or pick another model.'));
  return aiStream(m.provider.id, m.id, msgs, onDelta, ctl.signal, m.provider.maxTokens || 16000, temp);
};
const role = n => /^readme/i.test(n) ? 'docs' : /\.html$/i.test(n) ? 'app shell' : /\.css$/i.test(n) ? 'styles' : /pages?\//i.test(n) ? 'page' : /store|state/i.test(n) ? 'state' : /router/i.test(n) ? 'router' : /api/i.test(n) ? 'data layer' : /\.js$/i.test(n) ? 'logic' : 'file';
const unfence = c => c.trim().replace(/^\x60\x60\x60\w*\n/, '').replace(/\n?\x60\x60\x60$/, '');
const tail = s => s.replace(/\n?<{1,3}[A-Z:\w./-]*$/, '');
/* Parse the model's streamed text into intro / files (done or in-progress) / outro. */
function parseStream(t) {
  const re = /<<<FILE:([\w./-]+)>>>\n?/g, st = []; let m;
  while (m = re.exec(t)) st.push({ n: m[1], i: m.index, c: m.index + m[0].length });
  const files = st.map((s, k) => { const rest = t.slice(s.c, k + 1 < st.length ? st[k + 1].i : undefined), e = rest.indexOf('<<<END>>>'); return { n: s.n, done: e >= 0 || k + 1 < st.length, c: e >= 0 ? rest.slice(0, e) : rest } });
  const intro = st.length ? t.slice(0, st[0].i) : t;
  const last = files[files.length - 1], le = t.lastIndexOf('<<<END>>>');
  return { intro: tail(intro).trim(), files, outro: last && last.done && le >= 0 ? tail(t.slice(le + 9)).trim() : '' };
}


/* ---- AI guardrails: model tier, context budget, syntax check, self-repair ---- */
const FIX = 'Fix the preview errors', RETRY = 'Retry with the full project context';
let runErrs = [], shownErrs = 0, errTimer = 0, lastReq = '', forceFull = false;
/** Small output budgets or small models get the compact "lite" build prompt. */
function tierOf() {
  const m = Models.current(); if (!m) return 'full';
  return (m.provider.maxTokens || 16000) <= 8000 || /(^|[^0-9.])([1-9]|1[0-4])b\b|instant|nano|-mini\b/i.test(m.id) ? 'lite' : 'full';
}
/** Send as much of the project as the model can handle. Big projects: relevant files in full, the rest only as an outline. */
function projectContext(req, tier) {
  const names = Object.keys(proj.files); if (!names.length) return { ctx: '', omitted: [] };
  const budget = tier === 'lite' ? 14000 : 48000, total = names.reduce((n, k) => n + proj.files[k].length, 0), block = n => `<<<FILE:${n}>>>\n${proj.files[n]}\n<<<END>>>`;
  if (forceFull || total <= budget) return { ctx: 'CURRENT FILES:\n' + names.map(block).join('\n') + '\n\n', omitted: [] };
  const words = (req.toLowerCase().match(/[a-z0-9]{4,}/g) || []), score = n => (n === 'index.html' ? 1e6 : 0) + words.reduce((s, w) => s + (n.toLowerCase().includes(w) ? 50 : 0) + (proj.files[n].toLowerCase().split(w).length - 1), 0);
  let used = 0; const full = [], omitted = [];
  names.sort((x, y) => score(y) - score(x)).forEach(n => { if (used + proj.files[n].length <= budget || !full.length) { used += proj.files[n].length; full.push(n) } else omitted.push(n) });
  const outline = n => proj.files[n].split('\n').filter(l => /^\s*(function|const|class|async function|\.|#|<section|<h[1-3]|<nav|<main)/.test(l)).slice(0, 14).map(l => '  ' + l.trim().slice(0, 80)).join('\n');
  return { omitted, ctx: 'CURRENT FILES (the project is large, so some files are shown only as an outline; you may ONLY edit files shown in full):\n' + full.map(block).join('\n') + '\n' + omitted.map(n => `OMITTED ${n} (${proj.files[n].split('\n').length} lines), outline:\n${outline(n)}`).join('\n') + '\n\n' };
}
/** Compile-check every JS file without running it. */
const syntaxErrors = files => files.filter(f => /\.js$/i.test(f.n) && f.c !== '__DELETE__').flatMap(f => { try { new Function(f.c); return [] } catch (e) { return [f.n + ': ' + e.message] } });
const fixPrompt = errs => 'The app reports runtime errors in the preview. Find the root cause and fix ONLY what is needed; keep everything else identical. Errors:\n' + errs.join('\n');

/* Runtime errors reported by the preview frame -> one-tap fix */
addEventListener('message', e => {
  if (!e.data || !e.data.atlasErr || !proj || e.source !== $('#pv').contentWindow) return;
  if (!runErrs.includes(e.data.atlasErr) && runErrs.length < 5) runErrs.push(e.data.atlasErr);
  clearTimeout(errTimer);
  errTimer = setTimeout(() => {
    if (busy || runErrs.length <= shownErrs) return; shownErrs = runErrs.length;
    bubble('a', md('⚠️ The preview reported ' + runErrs.length + ' error' + (runErrs.length > 1 ? 's' : '') + ':\n' + runErrs.map(x => '- `' + x.replace(/`/g, "'") + '`').join('\n') + '\n' + T + 'options\n{"items":["' + FIX + '"]}\n' + T));
  }, 1200);
});

async function send(text, aiText) {
  if (busy) return;
  if (text === FIX && runErrs.length) aiText = fixPrompt(runErrs);
  if (text === RETRY) { aiText = lastReq; forceFull = true }
  const req = aiText || text; if (!aiText && mode === 'build') lastReq = text;
  setBusy(true); ctl = new AbortController(); const lang = $('.lang').value, tier = tierOf();
  bubble('u', esc(text)); proj.chat.push({ r: 'u', t: text });
  const has = Object.keys(proj.files).length, { ctx, omitted } = projectContext(req, tier); forceFull = false;
  const hist = proj.chat.slice(-7, -1).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t.slice(0, 800) }));
  try {
    if (mode === 'chat') {
      const w = bubble('a', '<span class=typing><i></i><i></i><i></i></span>'); let raf = 0, txt = '';
      const paint = () => { raf = 0; w.innerHTML = md(txt); $('#msgs').scrollTop = 1e9 };
      try {
        const r = await stream([{ role: 'system', content: SYS_CHAT(lang, has) }, ...hist, { role: 'user', content: req }], (d, full) => { txt = full; if (!raf) raf = requestAnimationFrame(paint) }, .7);
        txt = r.text;
      } finally { cancelAnimationFrame(raf); if (txt) { w.innerHTML = md(txt); proj.chat.push({ r: 'a', t: txt }) } else w.remove() }
    } else await buildFlow(req, lang, ctx, hist, omitted, tier);
    save();
  } catch (e) { if (e.name === 'AbortError') bubble('a', 'Stopped. Anything already finished was kept.'); else bubble('a', '⚠️ ' + esc(e.message)) }
  setBusy(false); ctl = null;
}

async function buildFlow(text, lang, ctxFiles, hist, omitted, tier) {
  const t0 = Date.now(), secs = () => ((Date.now() - t0) / 1000).toFixed(0), model = (Models.current() || {}).label || 'the model';
  const intro = bubble('a', ''); intro.hidden = true;
  const box = bubble('steps', ''); box.className = 'steps';
  const outro = bubble('a', ''); outro.hidden = true;
  let full = '', got = false, raf = 0, fin = false, note = '';
  const row = (c, ic, l, n) => `<div class="st ${c}">${ic}<span class=sl>${l}</span><small>${n || ''}</small></div>`;
  function paint() {
    raf = 0; const p = parseStream(full);
    if (p.intro) { intro.hidden = false; intro.innerHTML = md(p.intro) }
    let h = row('d', CK, 'Connected to ' + esc(model), '');
    if (!got) h += row('r', SP, 'Waiting for the model', secs() + 's');
    else if (!p.files.length) h += row('r', SP, 'Planning the architecture', secs() + 's');
    p.files.forEach(f => { const ln = f.c.split('\n').length, kb = (f.c.length / 1024).toFixed(1); h += row(f.done ? 'd' : 'r', f.done ? CK : SP, (f.done ? 'Created ' : 'Writing ') + '<b>' + esc(f.n) + '</b> <em>' + role(f.n) + '</em>', ln + ' lines · ' + kb + ' KB') });
    h += note;
    if (fin) h += row('d', CK, 'Bundled live preview', '');
    box.innerHTML = '<div class=sh><span>Building</span><span>' + secs() + 's</span></div>' + h;
    if (p.outro) { outro.hidden = false; outro.innerHTML = md(p.outro) }
    $('#msgs').scrollTop = 1e9;
  }
  const iv = setInterval(paint, 1000); paint();
  let r, aborted = false;
  try {
    r = await stream([{ role: 'system', content: SYS_BUILD(lang, tier) }, ...hist, { role: 'user', content: ctxFiles + 'REQUEST: ' + text }], (d, f) => { full = f; got = true; if (!raf) raf = requestAnimationFrame(paint) }, .4);
    full = r.text;
  } catch (e) { if (e.name !== 'AbortError') { clearInterval(iv); box.remove(); throw e } aborted = true }
  finally { clearInterval(iv); cancelAnimationFrame(raf) }
  const p = parseStream(full), cut = p.files.filter(f => !f.done).map(f => f.n);
  let ok = p.files.filter(f => f.done).map(f => ({ n: f.n, c: unfence(f.c) }));
  // Files that were NOT sent in full must never be overwritten by a guess.
  const blocked = ok.filter(f => omitted.includes(f.n)).map(f => f.n); ok = ok.filter(f => !omitted.includes(f.n));
  if (!ok.length) { box.remove(); if (aborted) { const ab = Error('stopped'); ab.name = 'AbortError'; throw ab } if (blocked.length) { bubble('a', md('⚠️ Atlas tried to rewrite **' + blocked.join(', ') + '** without seeing it, so I blocked that to protect your project.\n' + T + 'options\n{"items":["' + RETRY + '"]}\n' + T)); return } throw Error(full.trim() ? 'Atlas did not return any files. Try again or rephrase.' : 'Nothing came back from the model.') }

  // Compile-check the JavaScript; if something is broken, ask once for a repair before saving.
  let errs = aborted ? [] : syntaxErrors(ok);
  if (errs.length) {
    const bad = ok.filter(f => errs.some(e => e.startsWith(f.n + ':')));
    note = row('r', SP, 'Found ' + errs.length + ' JavaScript error' + (errs.length > 1 ? 's' : '') + ' in <b>' + esc(bad.map(f => f.n).join(', ')) + '</b>, repairing', ''); paint();
    const msg = 'These files have JavaScript SYNTAX errors. Fix ONLY the errors and return the fixed files IN FULL in the same format.\nERRORS:\n' + errs.join('\n') + '\n\n' + bad.map(f => `<<<FILE:${f.n}>>>\n${f.c}\n<<<END>>>`).join('\n');
    try {
      const r2 = await stream([{ role: 'system', content: SYS_BUILD(lang, tier) }, { role: 'user', content: msg }], () => {}, .2);
      parseStream(r2.text).files.filter(f => f.done).forEach(f => { const k = ok.findIndex(x => x.n === f.n); if (k >= 0) ok[k] = { n: f.n, c: unfence(f.c) } });
      errs = syntaxErrors(ok);
    } catch (e) { if (e.name === 'AbortError') aborted = true }
    note = errs.length ? row('r', '<span class=ck style="color:#d6336c">!</span>', 'Could not fully repair ' + errs.length + ' error' + (errs.length > 1 ? 's' : ''), '') : row('d', CK, 'Repaired ' + bad.length + ' file' + (bad.length > 1 ? 's' : ''), '');
  }
  const prev = JSON.stringify(proj.files); proj.history.push(prev); if (proj.history.length > 15) proj.history.shift();
  ok.forEach(f => { if (f.c === '__DELETE__') delete proj.files[f.n]; else proj.files[f.n] = f.c });
  fin = true; paint(); preview(); $('#ws').classList.add('pvmode');
  const summary = [p.intro, p.outro].filter(Boolean).join('\n\n'); proj.chat.push({ r: 'a', t: summary || 'Done.' });
  if (errs.length) { runErrs = errs.slice(); shownErrs = runErrs.length; bubble('a', md('⚠️ Some JavaScript still has errors:\n' + errs.map(x => '- `' + x.replace(/`/g, "'") + '`').join('\n') + '\n' + T + 'options\n{"items":["' + FIX + '"]}\n' + T)) }
  if (blocked.length) bubble('a', md('Skipped **' + blocked.join(', ') + '** (not included in full this time).\n' + T + 'options\n{"items":["' + RETRY + '"]}\n' + T));
  if (cut.length || (r && r.finish === 'length'))
    bubble('a', md((aborted ? 'Stopped.' : '⚠️ The reply was cut off') + (cut.length ? (aborted ? ' **' : ' while writing **') + cut.join(', ') + '**' + (aborted ? ' was left unfinished.' : '') : '') + ' Finished files were kept.\n' + T + 'options\n{"items":["Continue building: write these missing files now and return only them: ' + (cut.join(', ') || 'whatever is unfinished') + '"]}\n' + T));
}
$('#undo').onclick = () => { if (!proj || !proj.history.length) return bubble('a', 'Nothing to undo yet.'); proj.files = JSON.parse(proj.history.pop()); preview(); save(); bubble('a', 'Reverted the last change.') };
function preview() {
  runErrs = []; shownErrs = 0;
  $('#pv').srcdoc = proj.files['index.html'] ? pvBundle(proj.files)
    : '<body style="font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#6b7494;background:linear-gradient(135deg,#f3f5ff,#ffe9f0)">Your preview appears here</body>';
}

/* publish */
const slug = s => (s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 3).join('-').slice(0, 30) || 'my-site';
$('#pub').onclick = () => {
  if (!proj.files['index.html']) return bubble('a', 'Build something first, then publish it.');
  $('#pdom').textContent = '.' + ((Atlas.C.publish && Atlas.C.publish.baseDomain) || 'yourdomain.com');
  $('#psub').value = proj.published || slug(proj.name); $('#perr').textContent = ''; $('#pres').innerHTML = ''; $('#pubm').hidden = false;
};
$('#px').onclick = () => $('#pubm').hidden = true;
$('#pgo').onclick = async () => {
  const sub = $('#psub').value.trim().toLowerCase(); $('#perr').textContent = ''; $('#pgo').disabled = true;
  try {
    const r = await Atlas.publish(proj, sub); proj.published = sub; save(); renderGrid();
    $('#pres').innerHTML = `<div class=live>🎉 Live at <a href="${r.url}" target="_blank">${r.url}</a><br><small>Test link: <a href="${r.test}" target="_blank">${r.test}</a></small></div>`;
  } catch (e) { $('#perr').textContent = e.message }
  $('#pgo').disabled = false;
};

/* "Built by" popup */
setTimeout(() => {
  if (LS('noad')) return; const a = $('#ad'); a.hidden = false;
  requestAnimationFrame(() => $('#adpg').style.width = '0');
  const close = () => { if ($('#noad').checked) LS('noad', 1); a.hidden = true };
  $('#adx').onclick = close; setTimeout(close, 10000);
}, 2500);

/* styles gallery */
let selStyle = null;
const STYLES = [['Soft Bloom', 'Pastel florals, rounded shapes, friendly serif', '#ffd3e0,#e1d6ff,#c8f1dc,#fff7f0', 'Fraunces'], ['Clean Studio', 'Lots of white space with crisp blue accents', '#2f5bff,#eef2ff,#101a3a,#ffffff', 'Inter'], ['Midnight Neon', 'Dark canvas with electric glow', '#0b0f24,#7c4dff,#22d3ee,#f5f7ff', 'Space Grotesk'], ['Warm Editorial', 'Magazine layout in earthy tones', '#f6efe6,#b4552d,#2f3b2f,#fffaf3', 'Playfair Display'], ['Bold Pop', 'Big type and flat color blocks', '#ffde59,#ff5c8a,#1a1a1a,#ffffff', 'Bricolage Grotesque'], ['Garden Fresh', 'Botanical greens and organic curves', '#d9f2e1,#2f7d57,#f7c6d0,#fffdf8', 'DM Serif Display']];
STYLES.forEach(s => {
  const c = document.createElement('div'); c.className = 'scard';
  c.innerHTML = `<div class=sw>${s[2].split(',').map(x => `<i style="background:${x}"></i>`).join('')}</div><b>${s[0]}</b><small>${s[1]}</small><small>Font: ${s[3]}</small>`;
  c.onclick = () => {
    const on = selStyle === s; selStyle = on ? null : s;
    $$('.scard').forEach(x => x.classList.remove('on')); if (!on) c.classList.add('on');
    $('#sty').innerHTML = on ? '' : `<span class=chip>Style: ${s[0]} ✕</span>`;
    if (!on) { $('#sty').firstChild.onclick = () => c.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); $('#hp').focus() }
  };
  $('#sgrid').append(c);
});

/* project view modal */
const TDET = {
  'SaaS landing': { d: 'A confident product page that explains your tool and turns visitors into sign-ups.', s: ['Hero', 'Features', 'Pricing', 'FAQ', 'Footer'], st: 'Clean Studio' },
  'Restaurant': { d: 'A warm, appetizing site with a full menu, reservation form and photo-style gallery.', s: ['Hero', 'Menu', 'Reservations', 'Gallery', 'Hours'], st: 'Warm Editorial' },
  'Online store': { d: 'A product grid with working cart and a simple checkout flow.', s: ['Hero', 'Products', 'Cart', 'Checkout', 'Reviews'], st: 'Soft Bloom' },
  'Portfolio': { d: 'Show your work with case studies, an about section and a contact form.', s: ['Intro', 'Case studies', 'About', 'Contact'], st: 'Garden Fresh' },
  'Event page': { d: 'Everything attendees need: schedule, speakers and ticket options.', s: ['Hero', 'Schedule', 'Speakers', 'Tickets', 'Venue'], st: 'Midnight Neon' },
  'Link in bio': { d: 'A single, shareable page with your best links and a short bio.', s: ['Profile', 'Links', 'Socials'], st: 'Soft Bloom' }
};
const closeView = () => $('#viewm').hidden = true;
$('#vx').onclick = closeView;
function openView(v) {
  const b = $('#vbody'); $('#viewm').hidden = false;
  if (v.t === 'tpl') {
    const x = v.x, d = TDET[x[1]] || {};
    b.innerHTML = thumb(TPL_PAGES[x[1]] || blank, 'big') + `<h2>${x[1]}</h2><p class=muted>${d.d || x[3]}</p>
<div class=tags>${(d.s || []).map(s => `<span>${s}</span>`).join('')}</div>
<div class=meta><div><small>Category</small><b>${x[2]}</b></div><div><small>Suggested style</small><b>${d.st || 'Custom'}</b></div><div><small>Build time</small><b>About 1 minute</b></div></div>
<div class=vact><button class="btn pri" id=vuse>Use this template</button></div>`;
    $('#vuse').onclick = () => { closeView(); startProject('Build ' + x[3]) };
    fitThumbs(); return;
  }
  const p = v.p, f = Object.keys(p.files), kb = (JSON.stringify(p.files).length / 1024).toFixed(1);
  b.innerHTML = `<h2>${esc(p.name)}</h2><p class=muted>${p.published ? '● Live' : 'Not published yet'}</p>
${f.length ? '<iframe class=vpv sandbox="allow-scripts"></iframe>' : '<div class=thumb-empty>No files yet</div>'}
<div class=meta><div><small>Created</small><b>${p.created ? new Date(p.created).toLocaleDateString() : 'Earlier'}</b></div><div><small>Files</small><b>${f.length}</b></div><div><small>Size</small><b>${kb} KB</b></div><div><small>Messages</small><b>${p.chat.length}</b></div></div>
${f.length ? `<div class=tags>${f.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
<div class=vact><button class="btn pri" id=ved>Open and edit</button>${p.published ? `<a class=btn target=_blank href="https://${p.published}.${(Atlas.C.publish && Atlas.C.publish.baseDomain) || 'yourdomain.com'}">Visit live site</a>` : ''}<button class=btn id=vdup>Duplicate</button><button class="btn dan" id=vdel>Delete</button></div>`;
  const fr = b.querySelector('.vpv'); if (fr) fr.srcdoc = pvBundle(p.files);
  $('#ved').onclick = () => { closeView(); openProject(p) };
  $('#vdup').onclick = () => { const c = JSON.parse(JSON.stringify(p)); c.id = Date.now().toString(36); c.name += ' copy'; c.published = null; c.created = Date.now(); proj = c; save(); closeView(); renderGrid() };
  $('#vdel').onclick = () => {
    if (!confirm('Delete this project?')) return;
    LS(key(), projs().filter(x => x.id !== p.id));
    try { Atlas.db && user && user.uid && Atlas.db.collection('users').doc(user.uid).collection('projects').doc(p.id).delete() } catch (e) {}
    closeView(); renderGrid();
  };
}
