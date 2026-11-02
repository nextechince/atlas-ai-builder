
import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

const promptInput = $("prompt");
const buildBtn = $("build-btn");
const saveBtn = $("save-btn");
const exportBtn = $("export-btn");
const previewFrame = $("preview-frame");
const emptyPreview = $("empty-preview");
const codeOutput = $("code-output");
const activityStatus = $("activity-status");

let generatedCode = "";
let currentProjectId = null;
let currentProjectName = "Untitled project";
let currentView = "desktop";
let isBuilding = false;

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}

function setActivity(step, status) {
  const items = [...document.querySelectorAll(".activity-item")];

  items.forEach((item, index) => {
    item.classList.remove("active", "done");

    if (index < step) {
      item.classList.add("done");
      item.querySelector(".step-icon").textContent = "✓";
    } else {
      item.querySelector(".step-icon").textContent = String(index + 1);
    }

    if (index === step) {
      item.classList.add("active");
    }
  });

  activityStatus.textContent = status;
}

function finishActivity() {
  const items = [...document.querySelectorAll(".activity-item")];

  items.forEach((item) => {
    item.classList.remove("active");
    item.classList.add("done");
    item.querySelector(".step-icon").textContent = "✓";
  });

  activityStatus.textContent = "Build complete";
}

function setCode(code) {
  generatedCode = code;
  codeOutput.value = code;
  $("code-status").textContent = `${code.length.toLocaleString()} characters`;
  emptyPreview.style.display = "none";
  previewFrame.srcdoc = code;
}

function setPreviewSize(view) {
  currentView = view;

  const widths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px"
  };

  previewFrame.style.width = widths[view] || "100%";
  previewFrame.style.margin = "0 auto";

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function showPreview() {
  $("preview-shell").style.display = "flex";
  $("code-panel").style.display = "none";

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.style.display = "";
  });

  $("code-tab").classList.remove("active");
}

function showCode() {
  $("preview-shell").style.display = "none";
  $("code-panel").style.display = "flex";

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.remove("active");
  });

  $("code-tab").classList.add("active");
}

function extractCode(data) {
  let code =
    data.code ||
    data.html ||
    data.output ||
    data.content ||
    "";

  if (!code && data.choices?.[0]?.message?.content) {
    code = data.choices[0].message.content;
  }

  code = String(code).trim();

  // Remove Markdown fences if the model included them.
  code = code
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return code;
}

async function generateWebsite() {
  if (isBuilding) return;

  const prompt = promptInput.value.trim();

  if (!prompt) {
    toast("Describe your website first.");
    promptInput.focus();
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    toast("Please log in to use the builder.");
    location.href = "/login";
    return;
  }

  isBuilding = true;
  buildBtn.disabled = true;
  buildBtn.innerHTML = "◌ Building your website...";
  setActivity(0, "Preparing request");

  try {
    setActivity(1, "Sending request");

    const token = await user.getIdToken();

    // The API key stays on the server, never in this browser code.
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt,
        projectName: currentProjectName
      })
    });

    setActivity(2, "Waiting for AI generation");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "AI generation failed.");
    }

    const code = extractCode(data);

    if (!code || !code.includes("<")) {
      throw new Error("The AI returned an invalid website response. Try a more detailed prompt.");
    }

    setActivity(3, "Rendering website preview");

    setCode(code);
    showPreview();
    setPreviewSize(currentView);
    finishActivity();

    toast("Your website has been generated!");

  } catch (error) {
    console.error("ATLAS build error:", error);
    activityStatus.textContent = "Build failed";
    toast(error.message || "Something went wrong while building.");
  } finally {
    isBuilding = false;
    buildBtn.disabled = false;
    buildBtn.innerHTML = "<span>✦</span> Build with ATLAS AI";
  }
}

async function saveProject() {
  const user = auth.currentUser;

  if (!user) {
    toast("Please log in first.");
    return;
  }

  if (!generatedCode) {
    toast("Generate a website before saving.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const projectData = {
      name: currentProjectName,
      prompt: promptInput.value.trim(),
      code: generatedCode,
      ownerUid: user.uid,
      updatedAt: serverTimestamp()
    };

    if (currentProjectId) {
      await updateDoc(doc(db, "projects", currentProjectId), projectData);
    } else {
      projectData.createdAt = serverTimestamp();

      const saved = await addDoc(collection(db, "projects"), projectData);
      currentProjectId = saved.id;
    }

    toast("Project saved successfully.");
  } catch (error) {
    console.error("Save error:", error);
    toast("Could not save project. Check your Firestore rules.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
}

function exportProject() {
  if (!generatedCode) {
    toast("Generate a website before exporting.");
    return;
  }

  const blob = new Blob([generatedCode], {
    type: "text/html;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${currentProjectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "atlas-website"}.html`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  toast("HTML file exported.");
}

async function loadExistingProject(projectId) {
  const user = auth.currentUser;
  if (!user || !projectId) return;

  try {
    const snapshot = await getDoc(doc(db, "projects", projectId));

    if (!snapshot.exists()) {
      toast("Project not found.");
      return;
    }

    const project = snapshot.data();

    if (project.ownerUid !== user.uid) {
      toast("You do not have permission to open this project.");
      return;
    }

    currentProjectId = projectId;
    currentProjectName = project.name || "Untitled project";

    $("project-name").textContent = currentProjectName;
    promptInput.value = project.prompt || "";
    $("char-count").textContent = `${promptInput.value.length} / 6000`;

    if (project.code) {
      setCode(project.code);
      finishActivity();
    }
  } catch (error) {
    console.error("Project loading error:", error);
    toast("Could not load this project.");
  }
}

function setupEvents() {
  buildBtn.addEventListener("click", generateWebsite);
  saveBtn.addEventListener("click", saveProject);
  exportBtn.addEventListener("click", exportProject);

  promptInput.addEventListener("input", () => {
    $("char-count").textContent = `${promptInput.value.length} / 6000`;
  });

  promptInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      generateWebsite();
    }
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      promptInput.value = button.dataset.prompt;
      promptInput.dispatchEvent(new Event("input"));
      promptInput.focus();
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      showPreview();
      setPreviewSize(button.dataset.view);
    });
  });

  $("code-tab").addEventListener("click", showCode);

  $("refresh-btn").addEventListener("click", () => {
    if (!generatedCode) {
      toast("There is no preview to refresh yet.");
      return;
    }

    previewFrame.srcdoc = generatedCode;
    toast("Preview refreshed.");
  });

  $("fullscreen-btn").addEventListener("click", async () => {
    const shell = $("preview-shell");

    try {
      if (!document.fullscreenElement) {
        await shell.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast("Full screen is not available in this browser.");
    }
  });
}

async function initializeBuilder() {
  setupEvents();

  const params = new URLSearchParams(location.search);
  const projectId = params.get("id");
  const templatePrompt = params.get("prompt");
  const templateName = params.get("name");

  if (templateName) {
    currentProjectName = templateName;
    $("project-name").textContent = templateName;
  }

  if (templatePrompt) {
    promptInput.value = templatePrompt;
    $("char-count").textContent = `${templatePrompt.length} / 6000`;
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      location.href = "/login";
      return;
    }

    if (projectId) {
      await loadExistingProject(projectId);
    }
  });
}

initializeBuilder();
