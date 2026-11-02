
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* =========================================
   ATLAS AI BUILDER
   Firebase + Groq + Vercel API
========================================= */

const $ = (id) => document.getElementById(id);

const elements = {
  prompt: $("prompt"),
  buildBtn: $("build-btn"),
  conversation: $("conversation"),
  charCount: $("char-count"),

  projectName: $("project-name"),
  saveStatus: $("save-status"),

  previewFrame: $("preview-frame"),
  previewShell: $("preview-shell"),
  emptyPreview: $("empty-preview"),

  activityList: $("activity-list"),
  activityStatus: $("activity-status"),
  statusDot: $("status-dot"),

  historyBtn: $("history-btn"),
  historyModal: $("history-modal"),
  historyList: $("history-list"),

  settingsBtn: $("settings-btn"),
  settingsModal: $("settings-modal"),
  settingName: $("setting-name"),
  settingDescription: $("setting-description"),
  settingVisibility: $("setting-visibility"),
  saveSettingsBtn: $("save-settings-btn"),

  publishBtn: $("publish-btn"),
  publishModal: $("publish-modal"),
  publishName: $("publish-name"),
  publishVisibility: $("publish-visibility"),
  publishStatus: $("publish-status"),
  confirmPublishBtn: $("confirm-publish-btn"),

  toast: $("toast"),
  userAvatar: $("user-avatar")
};

const API = {
  generate: "/api/ai",
  publish: "/api/publish"
};

const state = {
  user: null,
  projectId: null,
  project: null,
  generatedHtml: "",
  currentPrompt: "",
  generating: false,
  publishing: false,
  saving: false,
  activityCount: 0,
  toastTimer: null
};

/* =========================================
   GENERAL UTILITIES
========================================= */

function showToast(message, duration = 3000) {
  if (!elements.toast) return;

  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(state.toastTimer);

  state.toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, duration);
}

function setSaveStatus(message) {
  if (elements.saveStatus) {
    elements.saveStatus.textContent = message;
  }
}

function setBusy(button, busy, busyText = "Working...") {
  if (!button) return;

  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent =
      button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = value.toDate
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function openModal(modal) {
  modal?.classList.add("open");
}

function closeModal(modal) {
  modal?.classList.remove("open");
}

function addMessage(type, author, content) {
  const message = document.createElement("div");

  message.className = `message ${type}`;

  const authorElement = document.createElement("div");
  authorElement.className = "message-author";
  authorElement.textContent = author;

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";
  contentElement.textContent = content;

  message.append(authorElement, contentElement);

  elements.conversation.appendChild(message);
  elements.conversation.scrollTop =
    elements.conversation.scrollHeight;

  return message;
}

/* =========================================
   ACTIVITY TIMELINE
   Only report events that actually happened.
========================================= */

function setActivityStatus(message, running = false) {
  elements.activityStatus.textContent = message;

  elements.statusDot.classList.toggle(
    "running",
    running
  );
}

function addActivity(title, description, status = "completed") {
  const empty = $("activity-empty");
  if (empty) empty.remove();

  const item = document.createElement("div");
  item.className = `activity-item ${status}`;

  const icon = document.createElement("div");
  icon.className = "activity-icon";

  icon.textContent =
    status === "completed" ? "✓" :
    status === "current" ? "◌" : "!";

  const info = document.createElement("div");
  info.className = "activity-info";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = description;

  const time = document.createElement("span");
  time.className = "activity-time";
  time.textContent = new Date().toLocaleTimeString();

  info.append(heading, paragraph, time);
  item.append(icon, info);

  elements.activityList.appendChild(item);

  state.activityCount++;

  elements.activityList.scrollTop =
    elements.activityList.scrollHeight;

  return item;
}

function clearActivity() {
  elements.activityList.innerHTML = "";
  state.activityCount = 0;
}

/* =========================================
   AUTHENTICATION
========================================= */

function getAuthToken() {
  if (!state.user) {
    throw new Error("Your login session has expired. Please log in again.");
  }

  return state.user.getIdToken();
}

async function authenticatedFetch(url, options = {}) {
  const token = await getAuthToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  if (
    options.body &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status}).`
    );
  }

  return data;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login");
    return;
  }

  state.user = user;

  if (elements.userAvatar) {
    const name =
      user.displayName ||
      user.email ||
      "A";

    elements.userAvatar.textContent =
      name.charAt(0).toUpperCase();
  }

  try {
    await initializeProject();
  } catch (error) {
    console.error("Builder initialization failed:", error);
    showToast(error.message);
  }
});

/* =========================================
   PROJECT INITIALIZATION
========================================= */

async function initializeProject() {
  const params = new URLSearchParams(window.location.search);

  const requestedId = params.get("id");

  if (requestedId) {
    await loadExistingProject(requestedId);
    return;
  }

  const projectRef = doc(
    collection(db, "projects")
  );

  state.projectId = projectRef.id;

  state.project = {
    name: "Untitled application",
    description: "",
    visibility: "private",
    ownerUid: state.user.uid,
    html: "",
    prompt: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(projectRef, state.project);

  const initialPrompt = params.get("prompt");
  const initialName = params.get("name");

  if (initialName) {
    elements.projectName.value = initialName;
    state.project.name = initialName;
  }

  setSaveStatus("Saved");

  if (initialPrompt) {
    elements.prompt.value = initialPrompt;
    updateCharacterCount();
    await generateApplication();
  }
}

async function loadExistingProject(projectId) {
  const projectRef = doc(db, "projects", projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    throw new Error("This project does not exist.");
  }

  const project = snapshot.data();

  if (project.ownerUid !== state.user.uid) {
    throw new Error("You do not have permission to access this project.");
  }

  state.projectId = projectId;
  state.project = project;
  state.generatedHtml = project.html || "";

  elements.projectName.value =
    project.name || "Untitled application";

  if (state.generatedHtml) {
    renderPreview(state.generatedHtml);
    setSaveStatus("Saved");
  }

  if (project.description) {
    elements.settingDescription.value =
      project.description;
  }

  if (project.visibility) {
    elements.settingVisibility.value =
      project.visibility;
  }

  setActivityStatus("Project loaded");

  addActivity(
    "Project loaded",
    "Your saved project was retrieved from Firestore."
  );

  if (project.publishedUrl) {
    addActivity(
      "Previously published",
      `Deployment URL: ${project.publishedUrl}`
    );
  }
}

/* =========================================
   AI GENERATION
========================================= */

async function generateApplication() {
  if (state.generating) return;

  const prompt = elements.prompt.value.trim();

  if (!prompt) {
    showToast("Describe what you want to build first.");
    elements.prompt.focus();
    return;
  }

  if (prompt.length > 6000) {
    showToast("Your prompt is too long.");
    return;
  }

  state.generating = true;
  state.currentPrompt = prompt;

  setBusy(elements.buildBtn, true, "Building...");
  setActivityStatus("Generating application", true);

  addMessage("user", "YOU", prompt);

  addActivity(
    "Generation requested",
    "Your instructions were submitted to the ATLAS AI API.",
    "current"
  );

  const currentActivity =
    elements.activityList.lastElementChild;

  try {
    const response = await authenticatedFetch(
      API.generate,
      {
        method: "POST",
        body: JSON.stringify({
          prompt,
          projectName:
            elements.projectName.value.trim() ||
            "Untitled application",
          projectId: state.projectId
        })
      }
    );

    const html =
      response.code ||
      response.html ||
      response.output ||
      response.content;

    if (
      typeof html !== "string" ||
      !/<html[\s>]/i.test(html)
    ) {
      throw new Error(
        "The AI response did not contain a valid HTML application."
      );
    }

    state.generatedHtml = html;

    currentActivity?.classList.remove("current");
    currentActivity?.classList.add("completed");

    addActivity(
      "AI generation completed",
      `The AI returned an application using ${response.model || "the configured model"}.`
    );

    renderPreview(html);

    addActivity(
      "Live preview updated",
      "The generated HTML is now loaded in the application preview."
    );

    addMessage(
      "assistant",
      "ATLAS AI",
      "Your application has been generated and loaded into the live preview. You can request changes whenever you're ready."
    );

    await saveProject({
      prompt,
      html,
      createVersion: true
    });

    setActivityStatus("Build completed");

    showToast("Application generated and saved.");

  } catch (error) {
    console.error("Generation error:", error);

    currentActivity?.classList.remove("current");
    currentActivity?.classList.add("error");

    addActivity(
      "Generation failed",
      error.message,
      "error"
    );

    addMessage(
      "error",
      "ATLAS AI",
      error.message
    );

    setActivityStatus("Build failed");

    showToast(error.message, 5000);

  } finally {
    state.generating = false;
    setBusy(elements.buildBtn, false);
  }
}

/* =========================================
   PREVIEW
========================================= */

function renderPreview(html) {
  elements.emptyPreview.style.display = "none";
  elements.previewFrame.style.display = "block";

  const blob = new Blob(
    [html],
    { type: "text/html;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const oldUrl = elements.previewFrame.dataset.blobUrl;

  elements.previewFrame.src = url;
  elements.previewFrame.dataset.blobUrl = url;

  if (oldUrl) {
    setTimeout(() => URL.revokeObjectURL(oldUrl), 30000);
  }
}

function refreshPreview() {
  if (!state.generatedHtml) {
    showToast("Generate an application first.");
    return;
  }

  renderPreview(state.generatedHtml);
  showToast("Preview refreshed.");
}

/* =========================================
   FIRESTORE PROJECT SAVING
========================================= */

async function saveProject({
  prompt,
  html,
  createVersion = false,
  settings = null
}) {
  if (!state.projectId || !state.user) {
    throw new Error("No active project to save.");
  }

  if (state.saving) return;

  state.saving = true;
  setSaveStatus("Saving...");

  try {
    const projectRef = doc(
      db,
      "projects",
      state.projectId
    );

    const snapshot = await getDoc(projectRef);

    if (!snapshot.exists()) {
      throw new Error("Project was not found.");
    }

    const existing = snapshot.data();

    if (existing.ownerUid !== state.user.uid) {
      throw new Error("You cannot edit this project.");
    }

    const updates = {
      name:
        elements.projectName.value.trim() ||
        "Untitled application",

      updatedAt: serverTimestamp()
    };

    if (typeof prompt === "string") {
      updates.prompt = prompt;
    }

    if (typeof html === "string") {
      updates.html = html;
    }

    if (settings) {
      updates.description = settings.description;
      updates.visibility = settings.visibility;
    }

    await updateDoc(projectRef, updates);

    state.project = {
      ...existing,
      ...updates
    };

    if (typeof html === "string") {
      state.generatedHtml = html;
    }

    if (createVersion && typeof html === "string") {
      const versionsRef = collection(
        db,
        "projects",
        state.projectId,
        "versions"
      );

      await addDoc(versionsRef, {
        prompt: prompt || "",
        html,
        name: updates.name,
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });
    }

    setSaveStatus("Saved");

    return true;

  } catch (error) {
    console.error("Save error:", error);
    setSaveStatus("Save failed");
    throw error;

  } finally {
    state.saving = false;
  }
}

/* =========================================
   PROJECT NAME AUTOSAVE
========================================= */

let nameSaveTimer;

elements.projectName.addEventListener("input", () => {
  setSaveStatus("Unsaved changes");

  clearTimeout(nameSaveTimer);

  nameSaveTimer = setTimeout(async () => {
    if (!state.projectId) return;

    try {
      await saveProject({});
    } catch (error) {
      console.error(error);
      showToast("Project name could not be saved.");
    }
  }, 900);
});

/* =========================================
   PROJECT HISTORY
========================================= */

async function openHistory() {
  openModal(elements.historyModal);

  elements.historyList.innerHTML =
    '<div class="empty-history">Loading history...</div>';

  try {
    if (!state.projectId) {
      throw new Error("No project is currently open.");
    }

    const versionsRef = collection(
      db,
      "projects",
      state.projectId,
      "versions"
    );

    const versionsQuery = query(
      versionsRef,
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const result = await getDocs(versionsQuery);

    elements.historyList.innerHTML = "";

    if (result.empty) {
      elements.historyList.innerHTML =
        '<div class="empty-history">No previous versions found. Generate an application to create your first version.</div>';
      return;
    }

    result.forEach((versionDoc) => {
      const version = versionDoc.data();

      const button = document.createElement("button");
      button.className = "history-item";

      const title = document.createElement("strong");
      title.textContent =
        version.name || "Application version";

      const date = document.createElement("small");
      date.textContent = formatDate(version.createdAt);

      const prompt = document.createElement("small");
      prompt.textContent =
        version.prompt || "No generation prompt recorded.";

      button.append(title, date, prompt);

      button.addEventListener("click", async () => {
        await restoreVersion(version);
      });

      elements.historyList.appendChild(button);
    });

  } catch (error) {
    console.error("History error:", error);

    elements.historyList.innerHTML = "";

    const message = document.createElement("div");
    message.className = "empty-history";
    message.textContent = error.message;

    elements.historyList.appendChild(message);
  }
}

async function restoreVersion(version) {
  if (!version.html) {
    showToast("This version has no saved application.");
    return;
  }

  const confirmed = window.confirm(
    "Restore this version? Your current application will be replaced."
  );

  if (!confirmed) return;

  try {
    state.generatedHtml = version.html;

    renderPreview(version.html);

    await saveProject({
      prompt: version.prompt || "",
      html: version.html,
      createVersion: false
    });

    elements.prompt.value = version.prompt || "";
    updateCharacterCount();

    closeModal(elements.historyModal);

    addActivity(
      "Previous version restored",
      "The selected version was restored and saved to your project."
    );

    showToast("Version restored.");

  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

/* =========================================
   PROJECT SETTINGS
========================================= */

async function openSettings() {
  if (!state.projectId) return;

  try {
    const snapshot = await getDoc(
      doc(db, "projects", state.projectId)
    );

    if (!snapshot.exists()) {
      throw new Error("Project not found.");
    }

    const project = snapshot.data();

    if (project.ownerUid !== state.user.uid) {
      throw new Error("You do not own this project.");
    }

    elements.settingName.value =
      project.name || "";

    elements.settingDescription.value =
      project.description || "";

    elements.settingVisibility.value =
      project.visibility || "private";

    openModal(elements.settingsModal);

  } catch (error) {
    showToast(error.message);
  }
}

async function saveSettings() {
  setBusy(elements.saveSettingsBtn, true, "Saving...");

  try {
    const name = elements.settingName.value.trim();
    const description =
      elements.settingDescription.value.trim();

    const visibility =
      elements.settingVisibility.value;

    if (!name) {
      throw new Error("Application name is required.");
    }

    elements.projectName.value = name;

    await saveProject({
      settings: {
        description,
        visibility
      }
    });

    addActivity(
      "Project settings saved",
      "Your project name, description and visibility settings were saved to Firestore."
    );

    closeModal(elements.settingsModal);
    showToast("Project settings saved.");

  } catch (error) {
    console.error(error);
    showToast(error.message);

  } finally {
    setBusy(elements.saveSettingsBtn, false);
  }
}

/* =========================================
   PUBLISHING
   Calls a real server endpoint.
   Requires api/publish.js to be implemented.
========================================= */

function openPublish() {
  if (!state.generatedHtml) {
    showToast("Generate an application before publishing.");
    return;
  }

  elements.publishName.value =
    elements.projectName.value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

  elements.publishStatus.textContent =
    "Your application is ready for deployment validation.";

  openModal(elements.publishModal);
}

async function publishApplication() {
  if (state.publishing) return;

  if (!state.projectId || !state.generatedHtml) {
    showToast("There is no generated project to publish.");
    return;
  }

  const name = elements.publishName.value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  if (!name) {
    showToast("Enter a valid application name.");
    return;
  }

  state.publishing = true;

  setBusy(
    elements.confirmPublishBtn,
    true,
    "Deploying..."
  );

  elements.publishStatus.textContent =
    "Sending deployment request to the server...";

  setActivityStatus("Publishing application", true);

  addActivity(
    "Deployment requested",
    "The project was submitted to the publishing API.",
    "current"
  );

  const activity =
    elements.activityList.lastElementChild;

  try {
    // Make sure the latest version is saved first.
    await saveProject({
      prompt: state.currentPrompt,
      html: state.generatedHtml,
      createVersion: false
    });

    const result = await authenticatedFetch(
      API.publish,
      {
        method: "POST",
        body: JSON.stringify({
          projectId: state.projectId,
          name,
          visibility: elements.publishVisibility.value
        })
      }
    );

    const deploymentUrl =
      result.url ||
      result.deploymentUrl ||
      result.deployment?.url;

    if (!deploymentUrl) {
      throw new Error(
        "The deployment service did not return a public URL."
      );
    }

    await updateDoc(
      doc(db, "projects", state.projectId),
      {
        publishedUrl: deploymentUrl,
        deploymentName: name,
        deploymentStatus: "ready",
        deployedAt: serverTimestamp()
      }
    );

    activity?.classList.remove("current");
    activity?.classList.add("completed");

    addActivity(
      "Deployment completed",
      `Your application was deployed successfully: ${deploymentUrl}`
    );

    elements.publishStatus.textContent =
      `Deployment successful: ${deploymentUrl}`;

    const link = document.createElement("a");
    link.href = deploymentUrl.startsWith("https://")
      ? deploymentUrl
      : `https://${deploymentUrl}`;

    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open published application ↗";
    link.style.cssText =
      "display:block;color:#65dfff;font-size:11px;margin-top:12px;";

    elements.publishStatus.appendChild(link);

    setActivityStatus("Deployment successful");

    showToast("Application published successfully.");

  } catch (error) {
    console.error("Publishing error:", error);

    activity?.classList.remove("current");
    activity?.classList.add("error");

    addActivity(
      "Deployment failed",
      error.message,
      "error"
    );

    elements.publishStatus.textContent =
      `Deployment failed: ${error.message}`;

    setActivityStatus("Deployment failed");

    showToast(error.message, 5000);

  } finally {
    state.publishing = false;

    setBusy(
      elements.confirmPublishBtn,
      false
    );
  }
}

/* =========================================
   CHARACTER COUNTER
========================================= */

function updateCharacterCount() {
  elements.charCount.textContent =
    `${elements.prompt.value.length} / 6000`;
}

elements.prompt.addEventListener(
  "input",
  updateCharacterCount
);

elements.prompt.addEventListener("keydown", event => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    generateApplication();
  }
});

/* =========================================
   SUGGESTION BUTTONS
========================================= */

document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    elements.prompt.value =
      button.dataset.prompt || "";

    updateCharacterCount();
    elements.prompt.focus();
  });
});

/* =========================================
   DEVICE PREVIEW
========================================= */

document.querySelectorAll("[data-device]").forEach(button => {
  button.addEventListener("click", () => {
    const device = button.dataset.device;

    elements.previewShell.classList.remove(
      "tablet",
      "mobile"
    );

    if (device !== "desktop") {
      elements.previewShell.classList.add(device);
    }

    document.querySelectorAll("[data-device]").forEach(item => {
      item.classList.toggle(
        "active",
        item === button
      );
    });
  });
});

/* =========================================
   FULLSCREEN AND REFRESH
========================================= */

$("refresh-btn").addEventListener(
  "click",
  refreshPreview
);

$("fullscreen-btn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await elements.previewShell.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    showToast("Fullscreen is not available in this browser.");
  }
});

/* =========================================
   MOBILE NAVIGATION
========================================= */

document.querySelectorAll(".mobile-tab").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.panel;

    document.querySelectorAll(
      ".chat-panel,.preview-panel,.activity-panel"
    ).forEach(panel => {
      panel.classList.remove("mobile-active");
    });

    $(target)?.classList.add("mobile-active");

    document.querySelectorAll(".mobile-tab").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });
  });
});

/* =========================================
   MODAL CONTROLS
========================================= */

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    closeModal($(button.dataset.close));
  });
});

document.querySelectorAll(".modal-backdrop").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.open").forEach(closeModal);
  }
});

/* =========================================
   MAIN BUTTON CONNECTIONS
========================================= */

elements.buildBtn.addEventListener(
  "click",
  generateApplication
);

elements.historyBtn.addEventListener(
  "click",
  openHistory
);

elements.settingsBtn.addEventListener(
  "click",
  openSettings
);

elements.saveSettingsBtn.addEventListener(
  "click",
  saveSettings
);

elements.publishBtn.addEventListener(
  "click",
  openPublish
);

elements.confirmPublishBtn.addEventListener(
  "click",
  publishApplication
);

/* =========================================
   INITIAL UI
========================================= */

updateCharacterCount();

setActivityStatus("Waiting for instructions");

console.log("ATLAS AI BUILDER initialized.");
