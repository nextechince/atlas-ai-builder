import {
  auth, db, firebaseReady, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp
} from "./firebase.js";

const $ = s => document.querySelector(s);
const messages = $("#messages"), promptBox = $("#prompt"), sendBtn = $("#sendBtn");
const layout = $("#layout"), previewFrame = $("#previewFrame"), previewEmpty = $("#previewEmpty");
let user = null, projectId = new URLSearchParams(location.search).get("project");
let files = [], busy = false, currentPreviewUrl = null, abortController = null;

/* ───────── Activity feed (replaces the single spinner line) ───────── */
const STEPS = [
  { id: "read",    label: "Studying your request", done: "Studied your request" },
  { id: "plan",    label: "Planning the changes",  done: "Planned the changes" },
  { id: "write",   label: "Writing your files",    done: "Wrote your files" },
  { id: "save",    label: "Saving your project",   done: "Saved your project" },
  { id: "preview", label: "Updating the preview",  done: "Preview updated" }
];

const feed = (() => {
  const css = document.createElement("style");
  css.textContent = `
  #activity.feed{padding:0;overflow:hidden}
  .fhead{display:flex;align-items:center;gap:10px;width:100%;padding:11px 13px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer}
  .fhead:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
  .ftitle{flex:1;font-weight:700}.fs{display:block;font-weight:400;font-size:12px;color:var(--muted)}
  .fchev{color:var(--muted);transition:transform .2s;transform:rotate(90deg)}
  #activity.collapsed .fchev{transform:none}
  .fbar{height:3px;background:var(--line)}.fbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--blue),var(--cyan));transition:width .5s}
  .fsteps{list-style:none;margin:0;padding:6px 13px 10px}
  .fstep{display:flex;gap:10px;padding:6px 0;opacity:.42;transition:opacity .3s}
  .fstep.active,.fstep.done,.fstep.fail{opacity:1}
  .fico{flex:none;width:19px;height:19px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;font-size:11px;margin-top:1px}
  .fstep.active .fico{border-top-color:var(--cyan);animation:spin .8s linear infinite}
  .fstep.done .fico{background:#34d399;border-color:#34d399;color:#04140d;font-weight:800}
  .fstep.fail .fico{background:#f87171;border-color:#f87171;color:#1a0505;font-weight:800}
  .flabel{font-weight:600}.fdetail{font-size:12.5px;color:var(--muted);overflow-wrap:anywhere}
  .ffiles{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
  .ffile{font:11.5px ui-monospace,monospace;border:1px solid var(--line);border-radius:6px;padding:2px 7px;color:var(--muted)}
  .flog{border-top:1px solid var(--line);padding:9px 13px;font:12px/1.7 ui-monospace,monospace;color:var(--muted);max-height:150px;overflow:auto}
  .flog b{color:var(--text);font-weight:600}
  #activity.collapsed .fsteps,#activity.collapsed .flog{display:none}
  @media(prefers-reduced-motion:reduce){.fstep.active .fico{animation:none}.fbar i,.fchev,.fstep{transition:none}}`;
  document.head.append(css);

  const root = $("#activity");
  root.classList.add("feed");
  root.innerHTML = `<button class="fhead" type="button" aria-expanded="true"><span class="ftitle"><span class="ft"></span><span class="fs"></span></span><span class="fchev" aria-hidden="true">▸</span></button><div class="fbar" aria-hidden="true"><i></i></div><ol class="fsteps" aria-live="polite"></ol><div class="flog" role="log" aria-label="Activity log"></div>`;
  const head = root.querySelector(".fhead"), ft = root.querySelector(".ft"), fs = root.querySelector(".fs");
  const fill = root.querySelector(".fbar i"), list = root.querySelector(".fsteps"), logEl = root.querySelector(".flog");
  let t0 = 0, timers = [], items = {}, state = {}, active = null, finished = false, open = true;

  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";
  const log = msg => {
    const d = document.createElement("div"), b = document.createElement("b");
    b.textContent = stamp(); d.append(b, "  " + msg);
    logEl.append(d); logEl.scrollTop = logEl.scrollHeight;
  };
  const setOpen = o => {
    open = o; root.classList.toggle("collapsed", !o); head.setAttribute("aria-expanded", o);
    if (finished && fs.dataset.total) fs.textContent = `Finished in ${fs.dataset.total} · tap to ${o ? "hide" : "see what ATLAS did"}`;
  };
  head.addEventListener("click", () => setOpen(!open));

  const api = {
    start() {
      timers.forEach(clearTimeout); timers = [];
      list.textContent = ""; logEl.textContent = ""; fill.style.width = "0";
      items = {}; state = {}; active = null; finished = false; fs.dataset.total = "";
      STEPS.forEach(s => {
        const li = document.createElement("li"); li.className = "fstep";
        li.innerHTML = `<span class="fico" aria-hidden="true"></span><div><div class="flabel"></div><div class="fdetail"></div></div>`;
        li.querySelector(".flabel").textContent = s.label + "…";
        list.append(li); items[s.id] = li;
      });
      t0 = Date.now(); root.classList.add("show"); setOpen(true);
      api.begin("read");
      // The first two stages are staged (the server sends one response at the end).
      timers.push(setTimeout(() => { api.complete("read"); api.begin("plan"); }, 1200));
      timers.push(setTimeout(() => { api.complete("plan"); api.begin("write"); }, 2800));
    },
    begin(id) {
      if (state[id]) return;
      state[id] = "active"; active = id;
      const i = STEPS.findIndex(s => s.id === id);
      items[id].classList.add("active");
      ft.textContent = STEPS[i].label + "…"; fs.textContent = `Step ${i + 1} of ${STEPS.length}`;
      log("Started: " + STEPS[i].label.toLowerCase());
    },
    complete(id, detail = "", paths = []) {
      if (state[id] === "done") return;
      if (!state[id]) api.begin(id);
      state[id] = "done";
      const i = STEPS.findIndex(s => s.id === id), li = items[id];
      li.classList.remove("active"); li.classList.add("done");
      li.querySelector(".fico").textContent = "✓";
      li.querySelector(".flabel").textContent = STEPS[i].done;
      li.querySelector(".fdetail").textContent = detail;
      if (paths.length) {
        const box = document.createElement("div"); box.className = "ffiles";
        paths.slice(0, 12).forEach(p => { const c = document.createElement("span"); c.className = "ffile"; c.textContent = p; box.append(c); });
        li.querySelector(".fdetail").append(box);
        paths.forEach(p => log("Wrote " + p));
      }
      fill.style.width = Math.round((i + 1) / STEPS.length * 100) + "%";
      log("Finished: " + STEPS[i].done.toLowerCase());
    },
    catchUp() { // server answered: settle any staged steps right away
      timers.forEach(clearTimeout); timers = [];
      api.complete("read"); api.complete("plan"); api.begin("write");
    },
    fail(message) {
      timers.forEach(clearTimeout); timers = [];
      if (active && state[active] === "active") {
        const li = items[active]; li.classList.remove("active"); li.classList.add("fail");
        li.querySelector(".fico").textContent = "✕";
        li.querySelector(".fdetail").textContent = message;
        state[active] = "fail";
      }
      finished = true; ft.textContent = "Stopped before finishing"; fs.textContent = message;
      log("Stopped: " + message);
    },
    finish() {
      finished = true; fs.dataset.total = stamp();
      ft.textContent = "Done · preview ready"; log("All steps complete");
      setTimeout(() => setOpen(false), 900);
    },
    // Ready for streaming later: feed.event({ step, state: "start"|"done", detail, files })
    event({ step, state: s, detail, files: p }) { s === "start" ? api.begin(step) : api.complete(step, detail, p); }
  };
  return api;
})();
window.atlasFeed = feed;


function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;
}
function status(text) { $("#saveStatus").textContent = text; }
function safeId() { return crypto.randomUUID(); }

async function createProject() {
  projectId = safeId();
  const name = "Untitled project";
  await setDoc(doc(db, "projects", projectId), {
    ownerId: user.uid, name, description: "", status: "draft",
    published: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  history.replaceState({}, "", `/builder?project=${encodeURIComponent(projectId)}`);
  $("#projectName").value = name;
  status("Project created");
  addActivity("Project created");
}

async function loadProject() {
  try {
    const ref = doc(db, "projects", projectId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().ownerId !== user.uid) {
      addMessage("ai", "I couldn't find that project in your account.");
      projectId = null;
      return createProject();
    }
    const data = snap.data();
    $("#projectName").value = data.name || "My project";
    const fileSnap = await getDocs(collection(db, "projects", projectId, "files"));
    files = fileSnap.docs.map(d => ({ path: d.id, ...d.data() }));
    files = files.filter(f => typeof f.content === "string");
    if (files.length) updatePreview();
    addMessage("ai", `Welcome back. Your project "${data.name || "My project"}" is ready. Tell me what you'd like to improve.`);
    status("Project loaded");
  } catch (error) {
    addMessage("ai", `I couldn't load this project: ${error.message}`);
  }
}

async function addActivity(label, details = "") {
  try {
    await addDoc(collection(db, "projects", projectId, "activity"), {
      ownerId: user.uid, label, details, createdAt: new Date().toISOString()
    });
  } catch {}
}

async function saveFiles(newFiles, summary) {
  const batchLimit = 400;
  // Use Firestore batched writes via REST-free SDK write calls. Each document is kept small.
  for (let i = 0; i < newFiles.length; i += batchLimit) {
    await Promise.all(newFiles.slice(i, i + batchLimit).map(file =>
      setDoc(doc(db, "projects", projectId, "files", file.path), {
        content: file.content, type: file.type || "text/plain", updatedAt: new Date().toISOString()
      })
    ));
  }
  const keep = new Set(newFiles.map(f => f.path));
  const old = await getDocs(collection(db, "projects", projectId, "files"));
  await Promise.all(old.docs.filter(d => !keep.has(d.id)).map(d => import("./firebase.js").then(m => m.deleteDoc(d.ref))));
  files = newFiles;
  await updateDoc(doc(db, "projects", projectId), {
    name: $("#projectName").value.trim() || "My project",
    description: summary || "",
    updatedAt: new Date().toISOString(),
    fileCount: files.length
  });
  await addDoc(collection(db, "projects", projectId, "versions"), {
    ownerId: user.uid, summary: summary || "Project updated",
    filePaths: files.map(f => f.path), createdAt: new Date().toISOString()
  });
  status("All changes saved");
}

async function build() {
  const prompt = promptBox.value.trim();
  if (!prompt || busy) return;
  if (!user || !projectId) { addMessage("ai", "Still connecting to your account. Give it a moment and try again."); return; }
  busy = true;
  sendBtn.disabled = true;
  promptBox.disabled = true;
  addMessage("user", prompt);
  promptBox.value = "";
  feed.start();
  abortController = new AbortController();
  try {
    const token = await user.getIdToken();
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        prompt, projectName: $("#projectName").value,
        projectId, existingFiles: files, mode: files.length ? "edit" : "create"
      }),
      signal: abortController.signal
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "ATLAS couldn't complete this request.");

    // Real stages from here on
    feed.catchUp();
    const paths = (result.files || []).map(f => f.path);
    feed.complete("write", `${paths.length} file${paths.length === 1 ? "" : "s"}`, paths);

    feed.begin("save");
    await saveFiles(result.files, result.description);
    feed.complete("save");

    feed.begin("preview");
    $("#projectName").value = result.projectName || $("#projectName").value;
    updatePreview();
    feed.complete("preview");

    addMessage("ai", result.assistantMessage || "Your project has been updated.");
    if (result.changeSummary?.length) addMessage("ai", "What changed:\n• " + result.changeSummary.join("\n• "));
    if (result.warnings?.length) addMessage("ai", "A few things to know:\n• " + result.warnings.join("\n• "));
    await addActivity("AI updated project", result.assistantMessage || "");
    feed.finish();
  } catch (error) {
    const message = error.name === "AbortError" ? "Request cancelled." : error.message;
    addMessage("ai", `I couldn't finish that request. ${message}`);
    feed.fail(message);
  } finally {
    busy = false; sendBtn.disabled = false; promptBox.disabled = false;
    promptBox.focus(); abortController = null;
  }
}

function updatePreview() {
  const byPath = new Map(files.map(f => [f.path, f.content]));
  const html = byPath.get("index.html") || "";
  const css = byPath.get("styles.css") || "";
  const js = byPath.get("script.js") || "";
  if (!html) return;
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  const injected = html.includes("</head>")
    ? html.replace("</head>", `<style>${safeCss}</style></head>`)
    : `<style>${safeCss}</style>${html}`;
  const finalHtml = injected.includes("</body>")
    ? injected.replace("</body>", `<script>${safeJs}<\/script></body>`)
    : `${injected}<script>${safeJs}<\/script>`;
  const blob = new Blob([finalHtml], { type: "text/html" });
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(blob);
  previewFrame.src = currentPreviewUrl;
  previewFrame.classList.remove("hidden");
  previewEmpty.classList.add("hidden");
}
function showPreview() { layout.classList.add("show-preview"); $("#mobilePreview").classList.add("active"); $("#mobileChat").classList.remove("active"); }
function showChat() { layout.classList.remove("show-preview"); $("#mobileChat").classList.add("active"); $("#mobilePreview").classList.remove("active"); }

sendBtn.addEventListener("click", build);
promptBox.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); build(); } });
$("#mobileChat").addEventListener("click", showChat);
$("#mobilePreview").addEventListener("click", showPreview);
$("#refreshPreview").addEventListener("click", updatePreview);
$("#openPreview").addEventListener("click", () => {
  if (!currentPreviewUrl) return addMessage("ai", "Generate a project first to open its preview.");
  window.open(currentPreviewUrl, "_blank", "noopener");
});
$("#codeToggle").addEventListener("click", () => {
  $("#projectMeta").textContent = `${files.length} managed project files · ATLAS handles all source code.`;
  $("#codePanel").classList.add("open");
});
$("#closeCode").addEventListener("click", () => $("#codePanel").classList.remove("open"));
$("#projectName").addEventListener("change", async () => {
  if (!projectId || !user) return;
  try { await updateDoc(doc(db, "projects", projectId), { name: $("#projectName").value.trim() || "My project", updatedAt: new Date().toISOString() }); status("Name saved"); }
  catch (e) { status("Save failed"); }
});
$("#publishBtn").addEventListener("click", async () => {
  addMessage("ai", "Publishing is not enabled yet. This build will not pretend a project is live. Configure the complete Vercel deployment pipeline before enabling publishing.");
});
$("#historyBtn").addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(collection(db, "projects", projectId, "versions"), orderBy("createdAt", "desc")));
    if (snap.empty) return addMessage("ai", "No saved versions yet. ATLAS creates a version after each successful update.");
    const lines = snap.docs.slice(0, 8).map((d, i) => `${i + 1}. ${d.data().summary || "Saved version"} — ${new Date(d.data().createdAt).toLocaleString()}`);
    addMessage("ai", "Recent saved versions:\n" + lines.join("\n") + "\nVersion restore is not enabled in this interface yet.");
  } catch (e) { addMessage("ai", `Couldn't load versions: ${e.message}`); }
});
$("#downloadZip").addEventListener("click", () => addMessage("ai", "ZIP export is not included in this version yet."));
window.addEventListener("beforeunload", () => { if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl); });

// Start up after every button is wired, so the UI never freezes while connecting.
(async function init() {
  try {
    status("Connecting…");
    await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error("timed out")), 12000))]);
    onAuthStateChanged(auth, async current => {
      try {
        if (!current) return location.replace("/login");
        user = current;
        if (projectId) await loadProject();
        else await createProject();
      } catch (e) {
        status("Couldn't save");
        addMessage("ai", `I couldn't set up your project: ${e.message}`);
      }
    });
  } catch (e) {
    status("Not connected");
    addMessage("ai", `I couldn't connect to your account (${e.message}). Check your Firebase setup, then refresh.`);
  }
})();
