/* Atlas core: config loading, Firebase auth, cloud projects, publishing. */
(function () {
  const A = window.Atlas = { C: {}, user: JSON.parse(localStorage.getItem('atlas_user') || 'null') };
  const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'login', 'signup', 'atlas', 'site', 'static', 'cdn'];

  // Config.html is loaded in a hidden iframe; we read window.ATLAS_CONFIG from it.
  A.ready = new Promise(res => {
    const f = document.createElement('iframe');
    f.hidden = true;
    f.onload = () => { try { A.C = f.contentWindow.ATLAS_CONFIG || {}; } catch (e) {} init(); res(A); };
    f.src = 'Config.html';
    document.body.appendChild(f);
  });

  function init() {
    const fb = A.C.firebase;
    if (!fb || /^YOUR/.test(fb.apiKey || 'YOUR')) { A.off = true; A.authReady = Promise.resolve(); return; }
    firebase.initializeApp(fb);
    A.auth = firebase.auth();
    A.db = firebase.firestore();
    A.authReady = new Promise(r => A.auth.onAuthStateChanged(u => {
      A.user = u ? { uid: u.uid, name: u.displayName || u.email.split('@')[0], email: u.email } : null;
      localStorage.setItem('atlas_user', JSON.stringify(A.user));
      r();
    }));
  }
  const need = () => { if (location.protocol === 'file:') throw Error('Open this site from a web address (Vercel or localhost), not as a local file, so Config.html can load.'); if (A.off) throw Error('Add your Firebase config in Config.html first.'); };
  const clean = e => Error((e.message || String(e)).replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/, '').trim() || 'Something went wrong');

  A.signup = async (name, email, pw) => {
    need(); if (!name) throw Error('Enter a username');
    try {
      const c = await A.auth.createUserWithEmailAndPassword(email, pw);
      await c.user.updateProfile({ displayName: name });
      await A.db.collection('users').doc(c.user.uid).set({ name, email, created: Date.now() });
      A.user = { uid: c.user.uid, name, email };
      localStorage.setItem('atlas_user', JSON.stringify(A.user));
    } catch (e) { throw clean(e); }
  };
  A.login = async (email, pw) => { need(); try { await A.auth.signInWithEmailAndPassword(email, pw); } catch (e) { throw clean(e); } };
  A.reset = async email => { need(); try { await A.auth.sendPasswordResetEmail(email); } catch (e) { throw clean(e); } };
  A.logout = async () => { if (A.auth) await A.auth.signOut(); localStorage.removeItem('atlas_user'); A.user = null; };

  A.saveProject = p => A.db && A.user && A.db.collection('users').doc(A.user.uid).collection('projects').doc(p.id).set({ data: JSON.stringify(p) });
  A.listProjects = async () => {
    if (!A.db || !A.user) return [];
    const s = await A.db.collection('users').doc(A.user.uid).collection('projects').get();
    return s.docs.map(d => JSON.parse(d.data().data));
  };

  // Publish to a subdomain: stored in Firestore "sites/{sub}", served by site.html on a wildcard domain.
  A.publish = async (p, sub) => {
    need(); if (!A.user) throw Error('Login first');
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(sub) || RESERVED.includes(sub)) throw Error('Use 3-30 letters, numbers or dashes (not a reserved word).');
    const ref = A.db.collection('sites').doc(sub);
    try {
      await A.db.runTransaction(async t => {
        const s = await t.get(ref);
        if (s.exists && s.data().owner !== A.user.uid) throw Error('That name is taken. Try another.');
        t.set(ref, { owner: A.user.uid, name: p.name, files: JSON.stringify(p.files), updated: Date.now() });
      });
    } catch (e) { throw clean(e); }
    const base = (A.C.publish && A.C.publish.baseDomain) || 'yourdomain.com';
    return { url: `https://${sub}.${base}`, test: location.href.replace(/[^/]*$/, '') + 'site.html?s=' + sub };
  };

  // Bundle a multi-file project into ONE document: css inlined in place, local scripts moved (in order) to the end of <body>.
  A.bundle = (f, preview) => {
    let h = f['index.html'] || ''; const js = [], norm = p => p.replace(/^\.?\//, '').split(/[?#]/)[0];
    h = h.replace(/<link\b[^>]*>/gi, t => { const m = t.match(/href=["']([^"']+)["']/i), n = m && norm(m[1]); return n && f[n] && /\.css$/i.test(n) ? '<style>' + f[n] + '</style>' : t; });
    h = h.replace(/<script\b(?![^>]*type=["']module)[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (t, s) => { const n = norm(s); if (f[n] && /\.js$/i.test(n)) { js.push(f[n]); return ''; } return t; });
    const code = js.map(c => '<script>' + c.replace(/<\/script/gi, '<\\/script') + '<\/script>').join('\n');
    if (code) h = /<\/body>/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => code + '</body>') : h + code;
    // Preview frames block localStorage; this in-memory fallback stops generated sites from crashing there.
    const SHIM = '<script>try{localStorage.getItem("x")}catch(e){var mk=function(){var d={};return{getItem:function(k){return k in d?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}};["localStorage","sessionStorage"].forEach(function(n){Object.defineProperty(window,n,{value:mk(),configurable:true})})}<\/script>';
    // In a srcdoc preview, "#links" would otherwise resolve against the builder's URL and load it inside the frame.
    const head = (preview ? '<base href="about:srcdoc">' : '') + SHIM;
    return /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, m => m + head) : head + h;
  };
})();
