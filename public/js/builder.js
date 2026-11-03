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

await firebaseReady;
onAuthStateChanged(auth, async current => {
  if (!current) return location.replace("/login");
  user = current;
  if (projectId) await loadProject();
  else await createProject();
});

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;
}
function status(text) { $("#saveStatus").textContent = text; }
function setActivity(text, show = true) {
  $("#activityText").textContent = text;
  $("#activity").classList.toggle("show", show);
}
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
  busy = true;
  sendBtn.disabled = true;
  promptBox.disabled = true;
  addMessage("user", prompt);
  promptBox.value = "";
  setActivity("Sending your request to ATLAS…");
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
    setActivity("Saving the completed project…");
    await saveFiles(result.files, result.description);
    $("#projectName").value = result.projectName || $("#projectName").value;
    updatePreview();
    addMessage("ai", result.assistantMessage || "Your project has been updated.");
    if (result.changeSummary?.length) addMessage("ai", "What changed:\n• " + result.changeSummary.join("\n• "));
    if (result.warnings?.length) addMessage("ai", "A few things to know:\n• " + result.warnings.join("\n• "));
    await addActivity("AI updated project", result.assistantMessage || "");
    setActivity("Project saved and preview refreshed.", true);
    setTimeout(() => setActivity("", false), 3500);
  } catch (error) {
    const message = error.name === "AbortError" ? "Request cancelled." : error.message;
    addMessage("ai", `I couldn't finish that request. ${message}`);
    setActivity("Request ended without saving.", true);
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
