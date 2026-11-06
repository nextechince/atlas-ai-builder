const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const LS = (k, v) => v === undefined ? JSON.parse(localStorage.getItem(k) || 'null') : localStorage.setItem(k, JSON.stringify(v));
const LANGS = ['English', 'Español', 'Français', 'Português', 'Deutsch', 'العربية', '中文', 'हिन्दी', 'Kiswahili', 'Yorùbá'];
const TPL = [['🚀', 'SaaS landing', 'Business', 'a modern SaaS landing page for a team collaboration tool with pricing and FAQ', 'var(--l)'], ['🍝', 'Restaurant', 'Business', 'a warm Mediterranean restaurant site with menu, reservations and gallery', 'var(--pe)'], ['🕯️', 'Online store', 'Store', 'an online candle store with product grid, cart and checkout flow', 'var(--p)'], ['🎨', 'Portfolio', 'Personal', 'a designer portfolio with case studies and contact form', 'var(--m)'], ['🎶', 'Event page', 'Events', 'an event page for a one-day music and tech festival with schedule and tickets', 'var(--l)'], ['🔗', 'Link in bio', 'Personal', 'a link-in-bio page for a photographer with featured links', 'var(--p)']];
let user, mode = 'build', proj = null, busy = false;

LANGS.forEach(l => $$('.lang').forEach(s => s.add(new Option(l))));
$$('.mdl').forEach(s => s.onchange = () => $$('.mdl').forEach(x => x.value = s.value));
$$('.lang').forEach(s => s.onchange = () => $$('.lang').forEach(x => x.value = s.value));

(async () => {
  await Atlas.ready; await Atlas.authReady; user = Atlas.user;
  (Atlas.C.models || [{ id: 'grok-4-fast', label: 'Grok' }]).forEach(m => $$('.mdl').forEach(s => s.add(new Option(m.label, m.id))));
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
function show(w) { $('#homeView').hidden = w !== 'home'; $('#ws').hidden = w === 'home'; $('#homeBtn').hidden = w === 'home' }

/* projects */
const key = () => 'p_' + (user ? user.uid || user.email : 'guest');
const projs = () => LS(key()) || [];
function save() {
  const a = projs().filter(p => p.id !== proj.id); a.unshift(proj); LS(key(), a.slice(0, 30));
  try { Promise.resolve(Atlas.saveProject(proj)).catch(() => {}) } catch (e) {}
}
function renderGrid() {
  const g = $('#grid'), t = $('.tabs .on').dataset.t; g.innerHTML = '';
  if (t === 'tpl') TPL.forEach(x => { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = `<div class=th style="background:${x[4]}">${x[0]}</div><div class=ct><b>${x[1]}</b> <small>${x[2]}</small></div>`; c.onclick = () => openView({ t: 'tpl', x }); g.append(c) });
  else {
    const a = user ? projs() : [];
    if (!a.length) g.innerHTML = '<p class=empty>' + (user ? 'No apps yet. Describe one above.' : 'Login to see your apps.') + '</p>';
    a.forEach(p => { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = `<div class=th style="background:var(--l)">🌐</div><div class=ct><b>${esc(p.name)}</b>${p.published ? ' <small>● live</small>' : ''}</div>`; c.onclick = () => openView({ t: 'app', p }); g.append(c) });
  }
}
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
  preview();
}
function setMode(m) { mode = m; $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#tx').placeholder = m === 'build' ? 'Describe a change or what to build...' : 'Ask for ideas, advice, comparisons...' }
$$('.seg button').forEach(b => b.onclick = () => setMode(b.dataset.m));
$$('[data-w]').forEach(b => b.onclick = () => $('#pv').style.width = b.dataset.w);

/* rich message rendering */
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const inl = s => esc(s).replace(/!\[(.*?)\]\((https?:[^)\s]+)\)/g, '<img src="$2" alt="$1">').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\x60(.+?)\x60/g, '<code>$1</code>');
function rich(t, d) {
  if (t === 'cards') return '<div class=cards>' + d.map(c => `<div><span class=e>${esc(c.emoji || '✨')}</span><b>${esc(c.title || '')}</b>${inl(c.text || '')}</div>`).join('') + '</div>';
  const it = d.items || d;
  return `<div class=opts>${d.q ? '<b>' + esc(d.q) + '</b>' : ''}${it.map(i => `<button data-o="${esc(i).replace(/"/g, '&quot;')}">${esc(i)}</button>`).join('')}</div>`;
}
function md(s) {
  const B = []; s = s.replace(new RegExp(T + '(cards|options)\\n([\\s\\S]*?)' + T, 'g'), (m, t, j) => { let x = ''; try { x = rich(t, JSON.parse(j)) } catch (e) {} B.push(x); return '\n@@' + (B.length - 1) + '@@\n' });
  const L = s.split('\n'); let o = '', i = 0;
  while (i < L.length) {
    const l = L[i];
    if (/^\|/.test(l) && /^\|[\s:|-]+\|?$/.test(L[i + 1] || '')) { const r = []; while (i < L.length && /^\|/.test(L[i])) r.push(L[i++]); const c = x => x.replace(/^\||\|$/g, '').split('|').map(y => y.trim()); o += '<div class=tw><table><tr>' + c(r[0]).map(x => '<th>' + inl(x) + '</th>').join('') + '</tr>' + r.slice(2).map(x => '<tr>' + c(x).map(y => '<td>' + inl(y) + '</td>').join('') + '</tr>').join('') + '</table></div>'; continue }
    const h = l.match(/^(#{1,3}) (.*)/);
    if (h) o += `<h${h[1].length + 1}>${inl(h[2])}</h${h[1].length + 1}>`;
    else if (/^[-*] /.test(l)) o += '<li>' + inl(l.slice(2)) + '</li>';
    else if (/^@@\d+@@$/.test(l.trim())) o += B[+l.trim().slice(2, -2)];
    else if (l.trim()) o += '<p>' + inl(l) + '</p>';
    i++;
  }
  return o;
}
function bubble(r, h) { const d = document.createElement('div'); d.className = 'm ' + r; d.innerHTML = h; $('#msgs').append(d); $('#msgs').scrollTop = 1e9; return d }
$('#msgs').onclick = e => { const b = e.target.closest('[data-o]'); if (b) { setMode('chat'); send(b.dataset.o) } };

/* chat + build */
$('#send').onclick = () => { const v = $('#tx').value.trim(); if (v) { $('#tx').value = ''; send(v) } };
$('#tx').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#send').click() } };
const callAI = msgs => ai($('.mdl').value, msgs, Atlas.C.xai && Atlas.C.xai.keys, Atlas.C.xai && Atlas.C.xai.endpoint);

async function send(text) {
  if (busy) return; busy = true; const lang = $('.lang').value;
  bubble('u', esc(text)); proj.chat.push({ r: 'u', t: text });
  const has = Object.keys(proj.files).length;
  const ctx = has ? 'CURRENT FILES:\n' + Object.entries(proj.files).map(([n, c]) => `<<<FILE:${n}>>>\n${c}\n<<<END>>>`).join('\n') + '\n\n' : '';
  const hist = proj.chat.slice(-7, -1).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t.slice(0, 600) }));
  try {
    if (mode === 'chat') {
      const w = bubble('a', '<i>Thinking...</i>');
      const r = await callAI([{ role: 'system', content: SYS_CHAT(lang, has) }, ...hist, { role: 'user', content: text }]);
      w.innerHTML = md(r); proj.chat.push({ r: 'a', t: r });
    } else {
      const names = ['Understanding your idea', 'Designing layout and palette', 'Writing index.html', 'Writing style.css', 'Writing script.js', 'Polishing details'];
      const box = bubble('steps', names.map(n => `<div class=st><span class=sp style=visibility:hidden></span>${n}</div>`).join('')); box.className = 'steps'; let k = 0; const rows = box.children;
      const tick = () => { if (k > 0) { rows[k - 1].className = 'st d'; rows[k - 1].firstChild.outerHTML = '<span>✓</span>' } if (k < names.length - 1) { rows[k].className = 'st r'; rows[k].firstChild.style.visibility = 'visible'; k++ } };
      tick(); const iv = setInterval(tick, 4500);
      let r; try { r = await callAI([{ role: 'system', content: SYS_BUILD(lang) }, ...hist, { role: 'user', content: ctx + 'REQUEST: ' + text }]) } finally { clearInterval(iv) }
      const re = /<<<FILE:([\w./-]+)>>>\n?([\s\S]*?)<<<END>>>/g; let m; const got = []; const prev = JSON.stringify(proj.files);
      while (m = re.exec(r)) got.push([m[1], m[2].trim().replace(/^\x60\x60\x60\w*\n/, '').replace(/\n?\x60\x60\x60$/, '')]);
      if (!got.length) throw Error('Atlas did not return any files. Try again or rephrase.');
      proj.history.push(prev); if (proj.history.length > 15) proj.history.shift();
      got.forEach(([n, c]) => proj.files[n] = c);
      box.innerHTML = got.map(([n, c]) => `<div class="st d"><span>✓</span>${esc(n)} <small>(${(c.length / 1024).toFixed(1)} KB)</small></div>`).join('');
      const sum = r.split('<<<FILE:')[0].trim() || 'Done! Your site is ready in the preview.';
      bubble('a', md(sum)); proj.chat.push({ r: 'a', t: sum }); preview();
    }
    save();
  } catch (e) { bubble('a', '⚠️ ' + esc(e.message)) }
  busy = false;
}
$('#undo').onclick = () => { if (!proj || !proj.history.length) return bubble('a', 'Nothing to undo yet.'); proj.files = JSON.parse(proj.history.pop()); preview(); save(); bubble('a', 'Reverted the last change.') };
function preview() {
  $('#pv').srcdoc = proj.files['index.html'] ? Atlas.bundle(proj.files)
    : '<body style="font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#6b7494;background:linear-gradient(135deg,#f3f5ff,#ffe9f0)">Your preview appears here</body>';
}

/* publish */
const slug = s => (s || 'my-site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
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
    b.innerHTML = `<div class=vhero style="background:${x[4]}">${x[0]}</div><h2>${x[1]}</h2><p class=muted>${d.d || x[3]}</p>
<div class=tags>${(d.s || []).map(s => `<span>${s}</span>`).join('')}</div>
<div class=meta><div><small>Category</small><b>${x[2]}</b></div><div><small>Suggested style</small><b>${d.st || 'Custom'}</b></div><div><small>Build time</small><b>About 1 minute</b></div></div>
<div class=vact><button class="btn pri" id=vuse>Use this template</button></div>`;
    $('#vuse').onclick = () => { closeView(); startProject('Build ' + x[3]) };
    return;
  }
  const p = v.p, f = Object.keys(p.files), kb = (JSON.stringify(p.files).length / 1024).toFixed(1);
  b.innerHTML = `<h2>${esc(p.name)}</h2><p class=muted>${p.published ? '● Live' : 'Not published yet'}</p>
${f.length ? '<iframe class=vpv sandbox="allow-scripts"></iframe>' : '<div class=vhero style="background:var(--l)">🌐</div>'}
<div class=meta><div><small>Created</small><b>${p.created ? new Date(p.created).toLocaleDateString() : 'Earlier'}</b></div><div><small>Files</small><b>${f.length}</b></div><div><small>Size</small><b>${kb} KB</b></div><div><small>Messages</small><b>${p.chat.length}</b></div></div>
${f.length ? `<div class=tags>${f.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
<div class=vact><button class="btn pri" id=ved>Open and edit</button>${p.published ? `<a class=btn target=_blank href="https://${p.published}.${(Atlas.C.publish && Atlas.C.publish.baseDomain) || 'yourdomain.com'}">Visit live site</a>` : ''}<button class=btn id=vdup>Duplicate</button><button class="btn dan" id=vdel>Delete</button></div>`;
  const fr = b.querySelector('.vpv'); if (fr) fr.srcdoc = Atlas.bundle(p.files);
  $('#ved').onclick = () => { closeView(); openProject(p) };
  $('#vdup').onclick = () => { const c = JSON.parse(JSON.stringify(p)); c.id = Date.now().toString(36); c.name += ' copy'; c.published = null; c.created = Date.now(); proj = c; save(); closeView(); renderGrid() };
  $('#vdel').onclick = () => {
    if (!confirm('Delete this project?')) return;
    LS(key(), projs().filter(x => x.id !== p.id));
    try { Atlas.db && user && user.uid && Atlas.db.collection('users').doc(user.uid).collection('projects').doc(p.id).delete() } catch (e) {}
    closeView(); renderGrid();
  };
}
