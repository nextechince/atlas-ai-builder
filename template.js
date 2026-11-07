/* Real mini-sites rendered as template previews (1100x688 canvas, scaled down in the cards). */
const H = (css, body) => `<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box;margin:0;padding:0}body{width:1100px;height:688px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;${css}}.b{display:inline-block;padding:14px 28px;border-radius:99px;font-size:15px;font-weight:600}nav{display:flex;justify-content:space-between;align-items:center;padding:26px 64px;font-size:15px}nav b{font-size:21px}</style>${body}`;

const TPL_PAGES = {
  'SaaS landing': H('background:linear-gradient(180deg,#f3f0ff,#fff);color:#17143a;text-align:center',
    `<nav><b>relay</b><span>Features &nbsp;&nbsp; Pricing &nbsp;&nbsp; Stories</span><span class=b style="background:#fff;border:1px solid #ddd;padding:9px 20px">Get started</span></nav>
<p style="display:inline-block;margin-top:30px;background:#ece8ff;color:#6a4cff;padding:7px 16px;border-radius:99px;font-size:14px">The calm way to collaborate</p>
<h1 style="font-size:84px;line-height:1;margin:20px 0 16px;letter-spacing:-3px">One team.<br><span style="color:#6a4cff">Perfectly in sync.</span></h1>
<p style="font-size:19px;color:#6b6890;max-width:560px;margin:0 auto 26px">Relay brings your conversations, decisions and momentum into one beautifully simple workspace.</p>
<span class=b style="background:#6a4cff;color:#fff">Start for free</span> <span class=b style="background:#fff;border:1px solid #ddd">Explore features</span>
<div style="width:780px;height:190px;margin:40px auto 0;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -10px 60px #6a4cff30;display:flex;gap:16px;padding:26px">
<div style="flex:1;background:#f3f1ff;border-radius:14px"></div><div style="flex:1;background:#ffe3ec;border-radius:14px"></div><div style="flex:1;background:#dff7ea;border-radius:14px"></div></div>`),

  'Restaurant': H('background:#6f7f50;color:#f7f0dc;font-family:Georgia,serif',
    `<nav><b>Olive &amp; Thyme</b><span>Home &nbsp;&nbsp; Menu &nbsp;&nbsp; Visit us</span><span class=b style="background:#fff;color:#4a5a30;padding:9px 20px">Reserve a table</span></nav>
<div style="display:flex;align-items:center;padding:60px 64px 0">
<div style="flex:1"><p style="font-size:13px;letter-spacing:3px;opacity:.8">A TABLE IN THE SUN</p>
<h1 style="font-size:92px;line-height:1;margin:18px 0 22px;font-weight:400">Good food.<br><i style="color:#f1dca3">Good company.</i></h1>
<p style="font-size:18px;max-width:430px;opacity:.9;font-family:Helvetica;margin-bottom:28px">A neighborhood kitchen serving the bright, generous flavors of the Mediterranean, made slowly and shared gladly.</p>
<span class=b style="background:#fff;color:#4a5a30">Explore the menu</span> <span class=b style="border:1px solid #f7f0dc">Find us</span></div>
<div style="width:300px;height:360px;background:#f1dca3;border:10px solid #c9a24d;border-radius:12px;transform:rotate(4deg);color:#4a3a14;display:grid;place-items:center;text-align:center;font-size:30px;font-style:italic;box-shadow:0 30px 60px #0004">From our<br>kitchen<br>with love</div></div>`),

  'Online store': H('background:#faf2e8;color:#3a2a22;font-family:Georgia,serif',
    `<nav><b>Ember &amp; Oak</b><span style="font-family:Helvetica;font-size:14px">Shop candles &nbsp;&nbsp; Cart</span></nav>
<div style="display:flex;align-items:center;padding:30px 64px;gap:50px">
<div style="flex:1"><p style="font-size:13px;letter-spacing:3px;color:#c0623a;font-family:Helvetica">LIGHT WELL. LIVE SLOWLY.</p>
<h1 style="font-size:86px;line-height:1.02;font-weight:400;margin:18px 0 22px">A little warmth for every room.</h1>
<p style="font-family:Helvetica;font-size:18px;color:#7a665a;max-width:430px;margin-bottom:26px">Hand-poured candles made from thoughtful ingredients and a love of the everyday.</p>
<span class=b style="background:#c0623a;color:#fff;font-family:Helvetica">Explore the collection</span></div>
<div style="width:420px;height:470px;border-radius:18px;background:radial-gradient(circle at 30% 25%,#fff6ec,#e7cdb6);position:relative">
<div style="position:absolute;left:120px;top:130px;width:180px;height:240px;background:#f6ecdf;border-radius:10px;box-shadow:0 20px 40px #8a5a3a40"></div>
<div style="position:absolute;left:200px;top:96px;width:20px;height:38px;border-radius:50% 50% 50% 50%/70% 70% 30% 30%;background:#ff9c3a;box-shadow:0 0 30px #ffb55a"></div>
<div style="position:absolute;left:24px;bottom:24px;background:#fff;padding:12px 18px;border-radius:12px;font-family:Helvetica;font-size:14px">Made by hand<br><small style="color:#999">in small batches</small></div></div></div>`),

  'Portfolio': H('background:#f7f7ff;color:#14143a',
    `<nav><b>alex.</b><span>Home &nbsp;&nbsp; Projects</span><span class=b style="background:#6a4cff;color:#fff;padding:9px 20px">Let's talk</span></nav>
<div style="padding:50px 64px 0"><p style="display:inline-block;background:#fff;border:1px solid #e3e3f5;padding:6px 14px;border-radius:99px;font-size:13px;color:#555">Available for select projects</p>
<h1 style="font-size:96px;line-height:1;letter-spacing:-4px;margin:20px 0 18px">Digital experiences<br><span style="color:#6a4cff">with purpose.</span></h1>
<p style="font-size:19px;color:#666;max-width:520px;margin-bottom:26px">I'm Alex Rivera, a web developer who turns complex ideas into clear, useful and memorable products.</p>
<span class=b style="background:#6a4cff;color:#fff">Explore my work</span> <span class=b style="background:#fff;border:1px solid #ddd">Get in touch</span></div>
<div style="display:flex;gap:18px;padding:34px 64px"><div style="flex:1;height:130px;border-radius:16px;background:linear-gradient(135deg,#c7b8ff,#ffd3e0)"></div><div style="flex:1;height:130px;border-radius:16px;background:linear-gradient(135deg,#bfe9d6,#cfe0ff)"></div><div style="flex:1;height:130px;border-radius:16px;background:linear-gradient(135deg,#ffe3b8,#ffc9d9)"></div></div>`),

  'Event page': H('background:#0b0c10;color:#fff',
    `<nav><b>SIGNAL/26</b><span style="opacity:.7">Schedule &nbsp;&nbsp; Speakers &nbsp;&nbsp; Venue</span><span class=b style="background:#c6ff3d;color:#0b0c10;padding:9px 20px">Get tickets</span></nav>
<div style="position:absolute;right:-80px;top:80px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,#c6ff3d33,transparent 65%)"></div>
<div style="padding:50px 64px;position:relative"><p style="font-size:13px;letter-spacing:3px;color:#c6ff3d">ONE DAY &middot; LIVE SOUND &middot; FUTURE THINKING</p>
<h1 style="font-size:116px;line-height:.95;letter-spacing:-4px;margin:20px 0 22px;text-transform:uppercase">Music<br><span style="color:#c6ff3d">meets</span><br>machine.</h1>
<p style="font-size:18px;opacity:.7;max-width:480px;margin-bottom:28px">A one-day collision of live sound and the people building what comes next.</p>
<span class=b style="background:#c6ff3d;color:#0b0c10">Explore the signal</span></div>
<div style="position:absolute;right:64px;bottom:60px;width:250px;border:1px solid #333;border-radius:18px;padding:22px;background:#14161c"><small style="color:#c6ff3d">SAT 14 OCT</small><h3 style="margin:6px 0">Pier 9 Warehouse</h3><small style="opacity:.6">Doors 4pm &middot; 3 stages</small></div>`),

  'Link in bio': H('background:linear-gradient(160deg,#ffe9dc,#fff6f0 55%,#f7c9bd);color:#3b2a28;text-align:center;font-family:Georgia,serif',
    `<div style="width:92px;height:92px;border-radius:50%;background:#e7a58f;margin:46px auto 14px;display:grid;place-items:center;font-size:34px;color:#fff;box-shadow:0 0 0 8px #fff8">ML</div>
<p style="font-family:Helvetica;font-size:12px;letter-spacing:3px;color:#c4694d">PHOTOGRAPHER &middot; EDUCATOR &middot; STORYTELLER</p>
<h1 style="font-size:50px;font-weight:400;margin:8px 0">Maya Lane</h1>
<p style="font-family:Helvetica;color:#8a6e66;margin-bottom:26px">Finding the light in ordinary places.</p>
<div style="width:560px;margin:0 auto;font-family:Helvetica;text-align:left">
<div style="background:#fff;border-radius:14px;padding:18px 22px;margin-bottom:12px;box-shadow:0 4px 18px #c4694d1a"><b>View my portfolio</b><br><small style="color:#999">A collection of light-filled stories</small></div>
<div style="background:#fff;border-radius:14px;padding:18px 22px;margin-bottom:12px;box-shadow:0 4px 18px #c4694d1a"><b>The soft light presets</b><br><small style="color:#999">My signature editing toolkit</small></div>
<div style="background:#fff;border-radius:14px;padding:18px 22px;margin-bottom:12px;box-shadow:0 4px 18px #c4694d1a"><b>Notes from behind the lens</b><br><small style="color:#999">A monthly letter for curious creatives</small></div></div>`)
};
