/* Atlas core: config loading, Firebase auth, cloud projects, publishing. */
(function () {
  const A = window.Atlas = { C: {}, user: JSON.parse(localStorage.getItem('atlas_user') || 'null') };
  const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'login', 'signup', 'atlas', 'site', 'static', 'cdn'];

  // Config.html is loaded in a hidden iframe; we read window.ATLAS_CONFIG from it.
  A.ready = new Promise(res => {
    const f = document.createElement('iframe');
    f.hidden = true;
    f.onload = () => { try { A.C = f.contentWindow.ATLAS_CONFIG || {}; } catch (e) {} init(); res(A); };
    f.src = 'config.html';
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
  const need = () => { if (A.off) throw Error('Add your Firebase config in Config.html first.'); };
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

  // Inline style.css / script.js into index.html so the page renders from one document.
  A.bundle = f => {
    let h = f['index.html'] || '';
    for (const n in f) {
      if (n === 'index.html') continue;
      const q = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (/\.css$/.test(n)) h = h.replace(new RegExp('<link[^>]*href=["\']\\.?/?' + q + '["\'][^>]*>', 'i'), () => '<style>' + f[n] + '</style>');
      if (/\.js$/.test(n)) h = h.replace(new RegExp('<script[^>]*src=["\']\\.?/?' + q + '["\'][^>]*>\\s*</script>', 'i'), () => '<script>' + f[n].replace(/<\/script/gi, '<\\/script') + '<\/script>');
    }
    return h;
  };
})();
