import { verifyFirebaseToken, getAdminFirestore } from "./_firebaseAdmin.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_PROMPT = 12000;
const MAX_FILES = 35;
const MAX_FILE_CHARS = 350000;
const MAX_TOTAL_CHARS = 1800000;

const SYSTEM_PROMPT = `You are ATLAS, a senior product designer and full-stack web app engineer inside a no-code AI builder.
The user is non-technical and must never be asked to edit code. You create and maintain the complete application for them.

Return ONLY valid JSON with this shape:
{
 "projectName":"string",
 "description":"string",
 "assistantMessage":"clear user-facing summary without exposing source code",
 "files":[{"path":"index.html","content":"...","type":"text/html"}],
 "changeSummary":["short plain-language item"],
 "warnings":[]
}

Rules:
- Generate a complete, polished, working responsive web application, not a mockup.
- Include index.html, styles.css, script.js, manifest.webmanifest, service-worker.js, package.json and README.md.
- Use semantic accessible HTML, responsive CSS, and robust vanilla JavaScript unless the user's request requires another framework.
- Every visible button, form, link and interaction must work. Never create dead controls or pretend a backend feature works.
- Do not claim authentication, payments, database, email, AI, uploads, or deployment works unless it is genuinely implemented and configured.
- For features requiring external services, create a safe integration boundary and explain in warnings what configuration is needed. Never put API keys, credentials or secrets in client files.
- Use localStorage only for non-sensitive demo/local preferences. Never store passwords or secrets there.
- Make high-quality visual decisions: clear hierarchy, strong spacing, responsive layouts, coherent color system, polished empty/loading/error states.
- Preserve existing project structure and functionality when modifying an existing app. Return the complete updated file set needed to run the project, not fragments.
- Use relative paths. Do not use markdown fences around file content.
- No source-code snippets in assistantMessage; speak to the user in normal language.
- Keep generated file paths safe and relative. No absolute paths, parent traversal, or hidden files.
- The preview is an isolated browser preview. Backend/server features may not work in preview; identify this honestly in warnings.
`;

function send(res, status, body) {
  return res.status(status).json(body);
}

function safePath(path) {
  if (typeof path !== "string" || !path.trim()) return false;
  const p = path.replace(/\\/g, "/");
  return !p.startsWith("/") && !p.split("/").some(part => part === ".." || part === "") &&
    !p.startsWith(".") && /^[a-zA-Z0-9._/-]+$/.test(p);
}

function validateFiles(files) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_FILES) {
    throw new Error("The AI returned an invalid number of project files.");
  }
  let total = 0;
  const seen = new Set();
  const clean = [];
  for (const file of files) {
    if (!file || !safePath(file.path) || typeof file.content !== "string") {
      throw new Error("The AI returned an unsafe or invalid file.");
    }
    if (file.content.length > MAX_FILE_CHARS) throw new Error(`File ${file.path} is too large.`);
    if (seen.has(file.path)) throw new Error(`Duplicate file path: ${file.path}`);
    seen.add(file.path);
    total += file.content.length;
    clean.push({
      path: file.path,
      content: file.content,
      type: typeof file.type === "string" ? file.type.slice(0, 80) : "text/plain"
    });
  }
  if (total > MAX_TOTAL_CHARS) throw new Error("The generated project is too large to save.");
  for (const required of ["index.html", "styles.css", "script.js"]) {
    if (!seen.has(required)) throw new Error(`The AI did not provide required file: ${required}`);
  }
  return clean;
}

async function callGroq({ prompt, projectName, existingFiles, mode }) {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const context = Array.isArray(existingFiles) ? existingFiles.slice(0, MAX_FILES).map(f => ({
    path: String(f.path || "").slice(0, 180),
    content: String(f.content || "").slice(0, 80000)
  })) : [];
  const userContent = [
    `Project name: ${projectName || "My ATLAS Project"}`,
    `Task mode: ${mode === "edit" ? "Modify the existing project" : "Create a new project"}`,
    `User request: ${prompt}`,
    context.length ? `EXISTING PROJECT FILES (preserve and update them):\n${JSON.stringify(context)}` : ""
  ].filter(Boolean).join("\n\n");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      max_completion_tokens: 30000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    }),
    signal: AbortSignal.timeout(180000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `AI provider returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("The AI returned an empty response. Please try again.");
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error("The AI response could not be validated. Please try again."); }
  const files = validateFiles(parsed.files);
  return {
    projectName: String(parsed.projectName || projectName || "My ATLAS Project").slice(0, 100),
    description: String(parsed.description || "").slice(0, 500),
    assistantMessage: String(parsed.assistantMessage || "Your project has been updated.").slice(0, 5000),
    changeSummary: Array.isArray(parsed.changeSummary) ? parsed.changeSummary.slice(0, 20).map(x => String(x).slice(0, 240)) : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 20).map(x => String(x).slice(0, 500)) : [],
    files,
    model,
    usage: data.usage || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { success: false, error: "Method not allowed." });
  if (!process.env.GROQ_API_KEY) return send(res, 503, { success: false, error: "AI service is not configured." });
  try {
    const user = await verifyFirebaseToken(req);
    const body = req.body || {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return send(res, 400, { success: false, error: "Describe what you want ATLAS to build or change." });
    if (prompt.length > MAX_PROMPT) return send(res, 400, { success: false, error: `Your request is too long. Keep it under ${MAX_PROMPT} characters.` });

    const projectId = typeof body.projectId === "string" ? body.projectId : null;
    const db = getAdminFirestore();
    let existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
    if (projectId) {
      const projectRef = db.collection("projects").doc(projectId);
      const snap = await projectRef.get();
      if (snap.exists && snap.data().ownerId !== user.uid) {
        return send(res, 403, { success: false, error: "You do not have access to this project." });
      }
      if (!existingFiles.length && snap.exists) {
        const fileSnap = await projectRef.collection("files").get();
        existingFiles = fileSnap.docs.map(d => ({ path: d.id, content: d.data().content || "" }));
      }
    }

    const result = await callGroq({
      prompt,
      projectName: body.projectName,
      existingFiles,
      mode: body.mode
    });

    return send(res, 200, {
      success: true,
      ...result,
      fileCount: result.files.length,
      totalSize: result.files.reduce((n, f) => n + f.content.length, 0),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("ATLAS AI error:", error);
    return send(res, error.status || 500, {
      success: false,
      error: error.message || "Something went wrong while building your project."
    });
  }
}
