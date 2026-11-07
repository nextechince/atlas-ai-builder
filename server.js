/* Local dev server: reads .env, serves the site and the /api functions. Run: node server.js */
const fs = require('fs'), path = require('path'), http = require('http');
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }) } catch (e) {}
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  if (p.startsWith('/api/')) {
    const name = p.slice(5).replace(/[^\w-]/g, ''), f = path.join(__dirname, 'api', name + '.js');
    if (name.startsWith('_') || !fs.existsSync(f)) { res.writeHead(404); return res.end('Not found') }
    let raw = ''; for await (const c of req) raw += c;
    req.query = Object.fromEntries(u.searchParams); try { req.body = raw ? JSON.parse(raw) : {} } catch (e) { req.body = {} }
    res.status = c => { res.statusCode = c; return res }; res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) };
    try { return await require(f)(req, res) } catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end('Server error') } return }
  }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(__dirname, p);
  // never serve secrets or server code
  if (/(^|\/)\./.test(p) || /^\/(server\.js|api|node_modules|package|README)/i.test(p) || !file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found') }
  res.writeHead(200, { 'Content-Type': T[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('Atlas running on http://localhost:' + (process.env.PORT || 3000)));
