import {
  COLLECTIONS,
  TRAITS,
  ACCENTS,
  FIELD_LIMITS,
  DEFAULT_IDENTITY,
  normalizeIdentity,
  safeSlug,
  validateIdentity,
  voiceDescription,
  voiceSample,
  avatarPrompt,
  createKitFiles,
  zipFiles,
} from "./identity.js";

import {
  normalizeAvatar,
  avatarDataURL,
  renderAvatarSVG,
  randomizeAvatar,
  applyExpression,
  AppearanceHistory,
  isHexColor,
} from "./avatar.js";
import {
  renderBuilderStage,
  renderInspector,
  renderHandles,
  stageHint,
  getPath,
  setPath,
} from "./avatar-editor.js";

const appearanceHistory = new AppearanceHistory();
const creatorUI = {
  panel: "body",
  selectedPart: -1,
  eyeSide: "leftEye",
  linkEyes: false,
  locks: new Set(),
};

// Retain the original key so the Identity Studio rename keeps existing drafts.
const STORAGE_KEY = "taste-vault.identity.v1";
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const steps = [
  ["The look", "A face to remember"],
  ["The name", "Make the introduction"],
  ["The personality", "Find their voice"],
  ["The brain", "Give them a point of view"],
  ["The identity kit", "Ready for what’s next"],
];
const icons = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  shuffle:
    '<path d="m3 5 4 0 10 14h4m-4-4 4 4-4 4M3 19h4l4-5m2-4 4-5h4m-4-4 4 4-4 4"/>',
  file: '<path d="M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
let state = normalizeIdentity(),
  storageError = false,
  toastTimer,
  savingTimer,
  exporting = false;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = normalizeIdentity(JSON.parse(saved));
} catch {
  storageError = true;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageError = false;
  } catch {
    storageError = true;
  }
  $("#save-status").textContent = storageError
    ? "Draft not saved — download your kit"
    : "Saved on this device";
}
function scheduleSave() {
  clearTimeout(savingTimer);
  savingTimer = setTimeout(save, 250);
}
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4500);
}
function avatarMarkup() {
  if (state.avatarMode === "builder")
    return `<img class="procedural-avatar" src="${escapeHTML(avatarDataURL(state.avatarDesign))}" alt="Your custom avatar" />`;
  if (state.avatarMode === "upload")
    return `<span class="avatar-image custom-avatar" style="background-image:url('${escapeHTML(state.customAvatar)}')" role="img" aria-label="Your uploaded avatar"></span>`;
  return `<span class="avatar-image" style="background-image:url('/assets/${state.collection}.png');background-position:${state.avatar % 2 ? "100%" : "0%"} ${state.avatar > 1 ? "100%" : "0%"}" role="img" aria-label="Your earlier saved avatar"></span>`;
}
function heading(kicker, title, subtitle) {
  return `<div class="step-heading"><div class="eyebrow">${kicker}</div><h1 id="step-title" tabindex="-1">${title}</h1><p>${subtitle}</p></div>`;
}
function renderNavigation() {
  $("#step-nav").innerHTML = steps
    .map(
      ([title, note], i) =>
        `<button class="nav-step ${state.step === i ? "active" : ""}" data-step="${i}" ${state.step === i ? 'aria-current="step"' : ""}><span class="step-number">${String(i + 1).padStart(2, "0")}</span><span><strong>${title}</strong><small>${note}</small></span>${state.step === i ? '<span class="nav-dot" aria-hidden="true"></span>' : ""}</button>`,
    )
    .join("");
}
function renderPreview() {
  document.querySelector(".preview-label > span:first-child").textContent =
    state.step === 0 ? "MAKE IT YOURS" : "THE FIRST IMPRESSION";
  document.querySelector(".preview-footnote").hidden = state.step === 0;
  if (state.step === 0) {
    $("#employee-preview").innerHTML = renderInspector(state, creatorUI);
    return;
  }
  const name = escapeHTML(state.name || "Your teammate");
  $("#employee-preview").innerHTML =
    `<article class="identity-card" style="--card-accent:${state.accent}"><div class="card-top"><span>TEAM MEMBER<br><strong>IDENTITY CARD</strong></span><img class="card-emblem" src="/assets/ai-employee-lab.jpg" alt="" width="32" height="32" /></div><div class="card-portrait">${avatarMarkup()}</div><div class="card-info"><span class="card-hello">HELLO, I’M</span><h2>${name}<span class="name-dot">.</span></h2><p>${escapeHTML(state.role || "Your next AI employee")}</p></div><div class="card-traits">${
      state.traits
        .slice(0, 3)
        .map((t) => `<span>${escapeHTML(t)}</span>`)
        .join("") || "<span>A personality in progress</span>"
    }</div><div class="card-bottom"><span>AI EMPLOYEE</span><span>EST. ${new Date().getFullYear()}</span><span class="barcode" aria-hidden="true"></span></div></article><div class="in-the-wild"><div class="tiny-avatar" style="background:${state.accent}">${avatarMarkup()}</div><div><strong>${name} <span>in your workspace</span></strong><p>${escapeHTML(state.role || "Your next AI employee")} · AI teammate</p></div><span class="workspace-star" aria-hidden="true">✧</span></div>`;
}
function renderLook() {
  return (
    heading(
      "01 / THE AVATAR STUDIO",
      "Create <em>your character.</em>",
      "Build their shape. Find their expression. Make every detail yours.",
    ) + renderBuilderStage(state, creatorUI, appearanceHistory)
  );
}
function field(key, label, hint, multiline = false, rows = 3) {
  return `<div class="field"><label for="${key}">${label}</label>${hint ? `<p id="${key}-hint" class="field-hint">${hint}</p>` : ""}${multiline ? `<textarea id="${key}" name="${key}" rows="${rows}" maxlength="${FIELD_LIMITS[key]}" ${hint ? `aria-describedby="${key}-hint"` : ""}>${escapeHTML(state[key])}</textarea>` : `<input id="${key}" name="${key}" value="${escapeHTML(state[key])}" maxlength="${FIELD_LIMITS[key]}" autocomplete="off" ${hint ? `aria-describedby="${key}-hint"` : ""} />`}</div>`;
}
function renderName() {
  return (
    heading(
      "02 / THE NAME",
      "Make a proper<br><em>introduction.</em>",
      "A name that feels like someone on your team.",
    ) +
    `<div class="form-content">${field("name", "What should we call them?", "Short, memorable, and easy to say out loud.")}<div class="name-suggestions"><span>A few starting points</span><div>${["Milo", "Atlas", "Nova", "Sage", "Remy", "Cleo"].map((n) => `<button class="name-chip ${state.name === n ? "selected" : ""}" data-name="${n}">${n}</button>`).join("")}</div></div>${field("role", "And what’s their role?", "The employee you chose to build. Think “content strategist” or “inbox assistant”.")}${field("pronouns", "Pronouns", "Optional. Use whatever feels right for this identity.")}<div class="editor-note">${icon("spark")}<p>A role gives the identity context. You’ll set up what your employee actually does in the next stage of the build.</p></div></div>`
  );
}
function renderPersonality() {
  const slider = (key, label, low, high) =>
    `<div class="voice-control"><div class="voice-control-title"><label for="${key}">${label}</label><output for="${key}" id="${key}-value">${state[key]}</output></div><input id="${key}" type="range" min="0" max="100" value="${state[key]}" style="--range-value:${state[key]}%" /><div class="range-labels"><span>${low}</span><span>${high}</span></div></div>`;
  return (
    heading(
      "03 / THE PERSONALITY",
      "Good company.<br><em>Great chemistry.</em>",
      "Shape how your teammate shows up and sounds.",
    ) +
    `<div class="section-label"><h2>Their defining traits</h2><span id="trait-count">${state.traits.length} of 5 selected</span></div><div class="trait-grid" role="group" aria-label="Personality traits, choose up to five">${TRAITS.map((t) => `<button data-trait="${t}" class="trait-chip ${state.traits.includes(t) ? "selected" : ""}" aria-pressed="${state.traits.includes(t)}">${state.traits.includes(t) ? icon("check") : '<span aria-hidden="true">+</span>'}${t}</button>`).join("")}</div><div class="voice-controls">${slider("warmth", "Warmth", "Composed", "Conversational")}${slider("detail", "Detail", "Keep it concise", "Talk me through it")}${slider("energy", "Energy", "Calm & steady", "Bright & expressive")}</div><div class="voice-sample"><div><span class="eyebrow">SOUNDS A LITTLE LIKE</span><span class="sample-label">Sample introduction</span></div><p id="voice-sample-text">${escapeHTML(voiceSample(state))}</p><small>A tone preview from your settings.</small></div>`
  );
}
function renderBrain() {
  return (
    heading(
      "04 / THE BRAIN",
      "A point of view.<br><em>A way of working.</em>",
      "Give your employee a few things to keep in mind.",
    ) +
    `<div class="form-content brain-form">${field("purpose", "Why does this employee exist?", "Describe the difference you want them to make.", true)}${field("audience", "Who are they working with?", "A little context about you, your team, or your audience.", true, 2)}${field("principles", "How should they approach their work?", "A few principles. One per line works well.", true, 4)}${field("boundaries", "What should they always keep in mind?", "Your preferences, boundaries, and when they should check with you.", true, 4)}<div class="editor-note">${icon("file")}<p>This becomes BRAIN.md: written context for your future build. Tools, workflows, and permissions come later.</p></div></div>`
  );
}
function renderKit() {
  const errors = validateIdentity(state);
  const files = [
    ["IDENTITY.md", "Their name, role, and personality"],
    ["BRAIN.md", "Purpose, principles, and boundaries"],
    ["VOICE.md", "A voice that feels familiar"],
    [
      "avatar.png",
      `A ${state.avatarResolution} × ${state.avatarResolution} profile picture`,
    ],
    ...(state.avatarMode === "builder"
      ? [
          ["avatar.svg", "Scalable artwork"],
          ["avatar-design.json", "Your editable shapes, face, and colors"],
        ]
      : []),
    ["avatar-prompt.md", "Keep their future look consistent"],
    ["identity.json", "An editable, portable profile"],
    ["START-HERE.md", "A little guidance for the next step"],
  ];
  return (
    heading(
      "05 / THE IDENTITY KIT",
      `Meet ${escapeHTML(state.name || "your teammate")}.<br><em>Your next chapter.</em>`,
      "A little more than a tool. A teammate taking shape.",
    ) +
    `<div class="kit-summary"><span class="kit-stamp">${icon("check")}</span><div><strong>${errors.length ? "Almost ready to meet the team" : "An identity, ready to build on."}</strong><p>${errors.length ? "Finish these details before downloading your kit." : "Everything you’ve chosen, in one tidy download."}</p></div></div>${errors.length ? `<div class="validation-list">${errors.map((e) => `<button class="text-link" data-step="${e.step}">${escapeHTML(e.message)} ${icon("arrow")}</button>`).join("")}</div>` : ""}<div class="kit-files">${files.map(([name, note]) => `<div class="kit-file">${icon("file")}<span><strong>${name}</strong><small>${note}</small></span><span class="file-check">${icon("check")}</span></div>`).join("")}</div><button class="download-button" data-action="download" ${errors.length ? "disabled" : ""}>${icon("download")} Download identity kit <span>.zip</span></button><div class="kit-secondary"><button class="text-link" data-action="copy">${icon("copy")} Copy the brain</button><button class="text-link" data-action="prompt">Copy avatar prompt ${icon("arrow")}</button></div><div class="next-note"><span class="eyebrow">WHAT COMES NEXT</span><p>Bring this kit into your AI employee project. You’ve shaped who they are. Next, you’ll build what they do.</p></div><div class="import-row"><span>Coming back to an earlier identity?</span><button class="text-link" data-action="import">Import identity.json</button><input id="identity-import" type="file" accept=".json,application/json" hidden /></div>`
  );
}
function renderStep() {
  document.body.classList.toggle("creator-open", state.step === 0);
  $("#step-content").innerHTML = [
    renderLook,
    renderName,
    renderPersonality,
    renderBrain,
    renderKit,
  ][state.step]();
  $("#step-footer").innerHTML =
    `<div class="step-progress" aria-label="Step ${state.step + 1} of 5">${steps.map((_, i) => `<span class="${i <= state.step ? "filled" : ""}"></span>`).join("")}<small>${state.step + 1} / 5</small></div><div class="step-actions">${state.step > 0 ? '<button class="quiet-button" data-action="back">Back</button>' : ""}${state.step < 4 ? `<button class="primary-button" data-action="next">${["Give them a name", "Find their voice", "Shape their brain", "Meet your teammate"][state.step]} ${icon("arrow")}</button>` : '<button class="secondary-button" data-step="0">Fine-tune the look ↗</button>'}</div>`;
}
function render() {
  renderNavigation();
  renderStep();
  renderPreview();
}
function goToStep(step) {
  if (!Number.isInteger(step) || step < 0 || step > 4) return;
  state.step = step;
  save();
  render();
  $("#step-title").focus({ preventScroll: true });
  if (window.innerWidth < 850)
    $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}
function rerenderKeepingFocus(selector) {
  renderStep();
  renderPreview();
  $(selector)?.focus({ preventScroll: true });
  save();
}
function next() {
  const error = validateIdentity(state).find((e) => e.step === state.step);
  if (error) {
    toast(error.message);
    (state.step === 1
      ? !state.name.trim()
        ? $("#name")
        : $("#role")
      : state.step === 3
        ? $("#purpose")
        : $("#step-title")
    )?.focus();
    return;
  }
  goToStep(state.step + 1);
}
async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast(
      "Clipboard access is unavailable. Download the kit to get these files.",
    );
  }
}
async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
async function avatarBlob(identity) {
  const img = await loadImage(
    identity.avatarMode === "builder"
      ? avatarDataURL(identity.avatarDesign, {
          size: identity.avatarResolution,
        })
      : identity.avatarMode === "upload"
        ? identity.customAvatar
        : `/assets/${identity.collection}.png`,
  );
  const canvas = document.createElement("canvas");
  const resolution = identity.avatarResolution;
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Your browser could not create the profile picture.");
  if (identity.avatarMode === "legacy") {
    ctx.fillStyle = identity.accent;
    ctx.fillRect(0, 0, resolution, resolution);
  }
  if (identity.avatarMode !== "legacy") {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      resolution,
      resolution,
    );
  } else {
    const width = img.naturalWidth / 2,
      height = img.naturalHeight / 2;
    ctx.drawImage(
      img,
      (identity.avatar % 2) * width,
      Math.floor(identity.avatar / 2) * height,
      width,
      height,
      0,
      0,
      resolution,
      resolution,
    );
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not export the profile picture.")),
      "image/png",
    ),
  );
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function downloadKit() {
  if (exporting) return;
  const errors = validateIdentity(state);
  if (errors.length) {
    goToStep(errors[0].step);
    toast(errors[0].message);
    return;
  }
  exporting = true;
  const button = $('[data-action="download"]');
  if (button) {
    button.disabled = true;
    button.textContent = "Putting your kit together…";
  }
  try {
    const snapshot = structuredClone(state),
      files = createKitFiles(snapshot),
      avatar = await avatarBlob(snapshot);
    files["avatar.png"] = await avatar.arrayBuffer();
    downloadBlob(
      zipFiles(files),
      `${safeSlug(snapshot.name)}-identity-kit.zip`,
    );
    toast(`${snapshot.name}’s identity kit is ready. Check your downloads.`);
  } catch (error) {
    toast(error.message || "Could not create your kit. Please try again.");
  } finally {
    exporting = false;
    if (state.step === 4) renderStep();
  }
}
async function uploadAvatar(file) {
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    toast("Choose a PNG, JPEG, or WebP image.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast("Choose an image smaller than 10 MB.");
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (img.naturalWidth * img.naturalHeight > 50000000)
      throw new Error("Choose an image smaller than 50 megapixels.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser could not process your image.");
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      512,
      512,
    );
    const processedAvatar = canvas.toDataURL("image/png");
    if (processedAvatar.length >= 1600000)
      throw new Error(
        "This image is too complex to save. Try a smaller image.",
      );
    beginAppearance();
    state.customAvatar = processedAvatar;
    state.avatarMode = "upload";
    finishAppearance();
    save();
    renderStep();
    renderPreview();
    toast("A new face for your teammate.");
  } catch (error) {
    toast(
      error.message || "We couldn’t read that image. Try a different file.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function importIdentity(file) {
  if (!file) return;
  if (file.size > 2000000) {
    toast("Choose an identity.json file smaller than 2 MB.");
    return;
  }
  try {
    const data = JSON.parse(await file.text());
    if (
      !data ||
      ![1, 2].includes(data.version) ||
      typeof data.name !== "string" ||
      typeof data.role !== "string"
    )
      throw new Error("That isn’t a supported Identity Studio identity file.");
    state = normalizeIdentity(data);
    appearanceHistory.clear();
    creatorUI.selectedPart = -1;
    state.step = 4;
    save();
    render();
    toast(`${state.name || "Your identity"} is back in the studio.`);
  } catch (error) {
    toast(
      error instanceof SyntaxError
        ? "That file isn’t valid JSON. Choose identity.json from an Identity Studio kit."
        : error.message,
    );
  }
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (handleCreatorClick(button)) return;
  if (button.hasAttribute("data-step"))
    return goToStep(Number(button.dataset.step));
  if (button.dataset.name) {
    state.name = button.dataset.name;
    rerenderKeepingFocus(`[data-name="${state.name}"]`);
    return;
  }
  if (button.dataset.trait) {
    const trait = button.dataset.trait;
    if (state.traits.includes(trait))
      state.traits = state.traits.filter((t) => t !== trait);
    else if (state.traits.length < 5) state.traits.push(trait);
    else {
      toast("Keep it focused: choose up to five traits.");
      return;
    }
    rerenderKeepingFocus(`[data-trait="${trait}"]`);
    return;
  }
  switch (button.dataset.action) {
    case "next":
      next();
      break;
    case "back":
      goToStep(state.step - 1);
      break;
    case "upload":
      $("#avatar-upload").click();
      break;
    case "download":
      void downloadKit();
      break;
    case "copy":
      try {
        void copyText(
          createKitFiles(state)["BRAIN.md"],
          "Brain copied. Ready for your employee project.",
        );
      } catch (error) {
        toast(error.message);
      }
      break;
    case "prompt":
      void copyText(avatarPrompt(state), "Avatar prompt copied.");
      break;
    case "import":
      $("#identity-import").click();
      break;
  }
});
document.addEventListener("input", (event) => {
  if (handleCreatorInput(event.target)) return;
  const { id, value } = event.target;
  if (Object.hasOwn(FIELD_LIMITS, id)) {
    state[id] = value.slice(0, FIELD_LIMITS[id]);
    renderPreview();
    scheduleSave();
  }
  if (["warmth", "detail", "energy"].includes(id)) {
    state[id] = Number(value);
    $(`#${id}-value`).textContent = value;
    event.target.style.setProperty("--range-value", `${value}%`);
    $("#voice-sample-text").textContent = voiceSample(state);
    scheduleSave();
  }
});
document.addEventListener("change", (event) => {
  if (handleCreatorChange(event.target)) return;
  if (event.target.id === "avatar-upload")
    void uploadAvatar(event.target.files[0]);
  if (event.target.id === "identity-import")
    void importIdentity(event.target.files[0]);
});
$("#reset-button").addEventListener("click", () => {
  $("#reset-dialog").returnValue = "";
  $("#reset-dialog").showModal();
});
$("#reset-dialog").addEventListener("close", () => {
  if ($("#reset-dialog").returnValue === "reset") {
    state = normalizeIdentity();
    appearanceHistory.clear();
    creatorUI.selectedPart = -1;
    save();
    render();
    toast("A fresh start. Let’s meet your next teammate.");
  }
});
$("#about-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("#about-dialog").showModal();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    clearTimeout(savingTimer);
    save();
  }
});
render();
$("#save-status").textContent = storageError
  ? "Draft not saved — download your kit"
  : "Saved on this device";

// Progressive enhancement for agent-enabled browsers. The normal UI works without it.
const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  const tool = {
    name: "configure_employee_identity",
    title: "Configure employee identity",
    description:
      "Update the identity draft in Identity Studio and show the review step. Does not download files or set up employee workflows.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 40 },
        role: { type: "string", minLength: 1, maxLength: 80 },
        purpose: { type: "string", minLength: 1, maxLength: 600 },
        traits: {
          type: "array",
          items: { type: "string", enum: TRAITS },
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
        },
      },
      required: ["name", "role", "purpose", "traits"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute(input) {
      if (
        !input ||
        typeof input !== "object" ||
        Object.keys(input).some(
          (k) => !["name", "role", "purpose", "traits"].includes(k),
        )
      )
        throw new Error("Provide only name, role, purpose, and traits.");
      for (const k of ["name", "role", "purpose"])
        if (
          typeof input[k] !== "string" ||
          !input[k].trim() ||
          input[k].length > FIELD_LIMITS[k]
        )
          throw new Error(`Invalid ${k}.`);
      if (
        !Array.isArray(input.traits) ||
        !input.traits.length ||
        input.traits.length > 5 ||
        input.traits.some((t) => !TRAITS.includes(t)) ||
        new Set(input.traits).size !== input.traits.length
      )
        throw new Error("Choose one to five distinct supported traits.");
      state = normalizeIdentity({ ...state, ...input, step: 4 });
      save();
      render();
      return {
        name: state.name,
        role: state.role,
        purpose: state.purpose,
        traits: state.traits,
        step: "review",
        saved: !storageError,
      };
    },
  };
  try {
    Promise.resolve(
      context.registerTool(tool, { signal: lifecycle.signal }),
    ).catch(() => {});
  } catch {
    /* Optional browser capability. */
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}

// Appearance editing is isolated from the employee's name, voice, and brain.
function appearanceSnapshot() {
  const {
    avatarMode,
    avatarDesign,
    avatarResolution,
    customAvatar,
    accent,
    collection,
    avatar,
  } = state;
  return structuredClone({
    avatarMode,
    avatarDesign,
    avatarResolution,
    customAvatar,
    accent,
    collection,
    avatar,
  });
}
function beginAppearance() {
  appearanceHistory.begin(appearanceSnapshot());
}
function finishAppearance() {
  appearanceHistory.commit(appearanceSnapshot());
  save();
  updateHistoryButtons();
}
function updateHistoryButtons() {
  const undo = $('[data-action="avatar-undo"]'),
    redo = $('[data-action="avatar-redo"]');
  if (undo) undo.disabled = !appearanceHistory.past.length;
  if (redo) redo.disabled = !appearanceHistory.future.length;
}
function renderCreator(focusSelector) {
  creatorUI.selectedPart = Math.min(
    creatorUI.selectedPart,
    state.avatarDesign.parts.length - 1,
  );
  const scroll = $(".inspector-content")?.scrollTop || 0;
  renderStep();
  renderPreview();
  if ($(".inspector-content")) $(".inspector-content").scrollTop = scroll;
  if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
}
function refreshAppearance() {
  if (state.step !== 0) {
    renderPreview();
    return;
  }
  const img = $("#builder-avatar");
  if (img && state.avatarMode === "builder")
    img.src = avatarDataURL(state.avatarDesign);
  const overlay = $("#avatar-handles");
  if (overlay)
    overlay.innerHTML = renderHandles(state.avatarDesign, {
      ...creatorUI,
      mode: state.avatarMode,
    });
  if ($("#stage-hint"))
    $("#stage-hint").textContent = stageHint(state, creatorUI);
  syncDesignControls();
}
function syncDesignControls() {
  document.querySelectorAll("[data-design]").forEach((input) => {
    if (
      input === document.activeElement &&
      (input.type === "number" || input.dataset.hex)
    )
      return;
    const value = getPath(state.avatarDesign, input.dataset.design);
    if (value === undefined) return;
    if (input.type === "checkbox") input.checked = value;
    else input.value = value;
  });
}
function editDesign(path, value) {
  const next = structuredClone(state.avatarDesign);
  setPath(next, path, value);
  const [side, key] = path.split(".");
  if (creatorUI.linkEyes && ["leftEye", "rightEye"].includes(side))
    setPath(
      next,
      `${side === "leftEye" ? "rightEye" : "leftEye"}.${key}`,
      ["x", "rotation"].includes(key) ? -value : value,
    );
  state.avatarDesign = normalizeAvatar(next);
}
function handleCreatorInput(input) {
  if (input.dataset.design) {
    if (input.dataset.hex && !isHexColor(input.value)) return true;
    if (input.value === "" && input.type === "number") return true;
    let value =
      input.type === "checkbox"
        ? input.checked
        : ["range", "number"].includes(input.type)
          ? Number(input.value)
          : input.value;
    if (typeof value === "number" && !Number.isFinite(value)) return true;
    beginAppearance();
    editDesign(input.dataset.design, value);
    refreshAppearance();
    scheduleSave();
    return true;
  }
  if (["card-accent", "card-accent-hex"].includes(input.id)) {
    if (isHexColor(input.value)) {
      beginAppearance();
      state.accent = input.value.toLowerCase();
      const other = $(
        input.id === "card-accent" ? "#card-accent-hex" : "#card-accent",
      );
      if (other) other.value = state.accent;
      scheduleSave();
    }
    return true;
  }
  return false;
}
function handleCreatorChange(input) {
  if (input.dataset.design) {
    if (input.dataset.hex && !isHexColor(input.value)) {
      input.value = getPath(state.avatarDesign, input.dataset.design);
      toast("Use a six-digit hex color, such as #a6c874.");
    }
    // Some controls (checkboxes/selects) can emit change without input in older browsers.
    if (input.type === "checkbox" || input.tagName === "SELECT")
      handleCreatorInput(input);
    input.value = getPath(state.avatarDesign, input.dataset.design);
    finishAppearance();
    if (input.dataset.design === "background")
      renderCreator('[data-design="background"]');
    return true;
  }
  if (["card-accent", "card-accent-hex"].includes(input.id)) {
    if (!isHexColor(input.value)) {
      input.value = state.accent;
      toast("Use a six-digit hex color.");
    }
    finishAppearance();
    return true;
  }
  if (input.id === "link-eyes") {
    creatorUI.linkEyes = input.checked;
    return true;
  }
  if (input.id === "avatar-resolution") {
    beginAppearance();
    state.avatarResolution = Number(input.value);
    finishAppearance();
    return true;
  }
  if (input.id === "design-import") {
    void importDesign(input.files[0]);
    return true;
  }
  return false;
}
function handleCreatorClick(button) {
  if (button.dataset.avatarMode) {
    beginAppearance();
    state.avatarMode =
      button.dataset.avatarMode === "upload" && state.customAvatar
        ? "upload"
        : "builder";
    finishAppearance();
    renderCreator();
    return true;
  }
  if (button.dataset.panel) {
    creatorUI.panel = button.dataset.panel;
    renderCreator();
    if ($(".inspector-content")) $(".inspector-content").scrollTop = 0;
    return true;
  }
  if (button.dataset.eyeSide) {
    creatorUI.eyeSide = button.dataset.eyeSide;
    renderCreator(`[data-eye-side="${creatorUI.eyeSide}"]`);
    return true;
  }
  if (button.hasAttribute("data-select-part")) {
    creatorUI.selectedPart = Number(button.dataset.selectPart);
    renderCreator(`[data-select-part="${creatorUI.selectedPart}"]`);
    return true;
  }
  if (button.dataset.lock) {
    const key = button.dataset.lock;
    if (creatorUI.locks.has(key)) creatorUI.locks.delete(key);
    else creatorUI.locks.add(key);
    renderCreator(`[data-lock="${key}"]`);
    return true;
  }
  if (button.dataset.designChoice) {
    beginAppearance();
    editDesign(button.dataset.designChoice, button.dataset.value);
    finishAppearance();
    renderCreator(
      `[data-design-choice="${button.dataset.designChoice}"][data-value="${button.dataset.value}"]`,
    );
    return true;
  }
  if (button.dataset.expression) {
    beginAppearance();
    state.avatarDesign = applyExpression(
      state.avatarDesign,
      button.dataset.expression,
    );
    finishAppearance();
    renderCreator(`[data-expression="${button.dataset.expression}"]`);
    return true;
  }
  const action = button.dataset.action;
  if (action === "avatar-undo" || action === "avatar-redo") {
    Object.assign(
      state,
      action === "avatar-undo"
        ? appearanceHistory.undo(appearanceSnapshot())
        : appearanceHistory.redo(appearanceSnapshot()),
    );
    save();
    renderCreator();
    return true;
  }
  if (action === "avatar-randomize") {
    if (creatorUI.locks.size === 4) {
      toast("Unlock a category to explore new combinations.");
      return true;
    }
    beginAppearance();
    state.avatarDesign = randomizeAvatar(
      state.avatarDesign,
      [...creatorUI.locks],
      crypto.getRandomValues(new Uint32Array(1))[0],
    );
    finishAppearance();
    renderCreator('[data-action="avatar-randomize"]');
    return true;
  }
  if (["add-piece", "duplicate-piece", "remove-piece"].includes(action)) {
    const parts = state.avatarDesign.parts;
    if (action !== "remove-piece" && parts.length >= 8) {
      toast("You can combine up to eight extra pieces.");
      return true;
    }
    beginAppearance();
    if (action === "add-piece") {
      parts.push({
        id: `piece-${parts.length + 1}`,
        shape: "orb",
        color: state.avatarDesign.bodyColor,
        x: -115,
        y: -85,
        width: 85,
        height: 85,
        rotation: 0,
        front: false,
      });
      creatorUI.selectedPart = parts.length - 1;
    }
    if (action === "duplicate-piece" && parts[creatorUI.selectedPart]) {
      const part = structuredClone(parts[creatorUI.selectedPart]);
      part.x = Math.max(-170, Math.min(170, -part.x));
      parts.push(part);
      creatorUI.selectedPart = parts.length - 1;
    }
    if (action === "remove-piece" && parts[creatorUI.selectedPart]) {
      parts.splice(creatorUI.selectedPart, 1);
      creatorUI.selectedPart = Math.min(
        creatorUI.selectedPart,
        parts.length - 1,
      );
    }
    state.avatarDesign = normalizeAvatar(state.avatarDesign);
    finishAppearance();
    renderCreator();
    return true;
  }
  if (["export-png", "export-svg", "export-design"].includes(action)) {
    void exportAvatar(action);
    return true;
  }
  if (action === "import-design") {
    $("#design-import").click();
    return true;
  }
  return false;
}
async function exportAvatar(kind) {
  const snapshot = structuredClone(state),
    name = safeSlug(snapshot.name);
  try {
    if (kind === "export-png")
      downloadBlob(await avatarBlob(snapshot), `${name}-avatar.png`);
    if (kind === "export-svg")
      downloadBlob(
        new Blob(
          [
            renderAvatarSVG(snapshot.avatarDesign, {
              size: snapshot.avatarResolution,
            }),
          ],
          { type: "image/svg+xml" },
        ),
        `${name}-avatar.svg`,
      );
    if (kind === "export-design")
      downloadBlob(
        new Blob(
          [
            JSON.stringify(
              {
                type: "taste-vault-avatar",
                version: 1,
                design: snapshot.avatarDesign,
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        `${name}.avatar.json`,
      );
    toast(
      kind === "export-design"
        ? "Editable design saved. Open it here anytime."
        : "Your avatar is ready. Check your downloads.",
    );
  } catch (error) {
    toast(error.message || "Could not export this avatar. Please try again.");
  }
}
async function importDesign(file) {
  if (!file) return;
  if (file.size > 250000) {
    toast("Choose an Identity Studio avatar design smaller than 250 KB.");
    return;
  }
  try {
    const value = JSON.parse(await file.text());
    if (
      value?.type !== "taste-vault-avatar" ||
      value.version !== 1 ||
      !value.design ||
      typeof value.design !== "object" ||
      Array.isArray(value.design)
    )
      throw new Error(
        "Choose an avatar-design.json or .avatar.json exported by Identity Studio.",
      );
    beginAppearance();
    state.avatarDesign = normalizeAvatar(value.design);
    state.avatarMode = "builder";
    creatorUI.selectedPart = -1;
    finishAppearance();
    renderCreator();
    toast("Your editable design is back.");
  } catch (error) {
    toast(
      error instanceof SyntaxError
        ? "That file is not valid JSON."
        : error.message,
    );
  }
}

let activeAvatarDrag = null;
function canvasPoint(event, svg) {
  const rect = svg.getBoundingClientRect(),
    x = ((event.clientX - rect.left) / rect.width) * 512 - 256,
    y = ((event.clientY - rect.top) / rect.height) * 512 - 268,
    angle = (-state.avatarDesign.rotation * Math.PI) / 180;
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}
document.addEventListener("pointerdown", (event) => {
  const target = event.target.closest(
    "[data-drag-part],[data-drag-eye],[data-contour]",
  );
  if (!target || state.step !== 0 || state.avatarMode !== "builder") return;
  event.preventDefault();
  target.focus({ preventScroll: true });
  const svg = $("#avatar-handles"),
    point = canvasPoint(event, svg);
  beginAppearance();
  if (target.dataset.dragEye && creatorUI.eyeSide !== target.dataset.dragEye) {
    creatorUI.eyeSide = target.dataset.dragEye;
    renderPreview();
  }
  activeAvatarDrag = {
    pointerId: event.pointerId,
    svg,
    start: point,
    initial: structuredClone(state.avatarDesign),
    part: target.dataset.dragPart,
    eye: target.dataset.dragEye,
    contour: target.dataset.contour,
  };
  svg.setPointerCapture(event.pointerId);
});
document.addEventListener("pointermove", (event) => {
  const drag = activeAvatarDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const point = canvasPoint(event, drag.svg),
    dx = point.x - drag.start.x,
    dy = point.y - drag.start.y,
    next = structuredClone(drag.initial);
  if (drag.part !== undefined) {
    next.parts[drag.part].x += dx;
    next.parts[drag.part].y += dy;
  }
  if (drag.eye) {
    next[drag.eye].x += dx;
    next[drag.eye].y += dy;
    if (creatorUI.linkEyes) {
      const other = drag.eye === "leftEye" ? "rightEye" : "leftEye";
      next[other].x = -next[drag.eye].x;
      next[other].y = next[drag.eye].y;
    }
  }
  if (drag.contour !== undefined) {
    const angle = (Number(drag.contour) / 12) * Math.PI * 2 - Math.PI / 2;
    const normalizedX = point.x / (next.width / 2),
      normalizedY = point.y / (next.height / 2);
    next.contour[Number(drag.contour)] =
      Math.cos(angle) * normalizedX + Math.sin(angle) * normalizedY;
  }
  state.avatarDesign = normalizeAvatar(next);
  refreshAppearance();
});
function endAvatarDrag(event) {
  if (!activeAvatarDrag || event.pointerId !== activeAvatarDrag.pointerId)
    return;
  const drag = activeAvatarDrag;
  activeAvatarDrag = null;
  refreshAppearance();
  finishAppearance();
  const selector =
    drag.part !== undefined
      ? `[data-drag-part="${drag.part}"]`
      : drag.eye
        ? `[data-drag-eye="${drag.eye}"]`
        : `[data-contour="${drag.contour}"]`;
  $(selector)?.focus({ preventScroll: true });
}
document.addEventListener("pointerup", endAvatarDrag);
document.addEventListener("pointercancel", (event) => {
  if (!activeAvatarDrag || event.pointerId !== activeAvatarDrag.pointerId)
    return;
  const before = appearanceHistory.cancel();
  if (before) Object.assign(state, before);
  activeAvatarDrag = null;
  refreshAppearance();
  save();
  updateHistoryButtons();
});
document.addEventListener("keydown", (event) => {
  if (state.step !== 0) return;
  const target = event.target.closest(
    "[data-drag-part],[data-drag-eye],[data-contour]",
  );
  if (
    target &&
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
  ) {
    event.preventDefault();
    beginAppearance();
    const amount = event.shiftKey ? 10 : 2,
      sign = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1,
      axis = ["ArrowLeft", "ArrowRight"].includes(event.key) ? "x" : "y";
    let selector;
    if (target.dataset.dragPart !== undefined) {
      const index = Number(target.dataset.dragPart);
      editDesign(
        `parts.${index}.${axis}`,
        state.avatarDesign.parts[index][axis] + sign * amount,
      );
      selector = `[data-drag-part="${index}"]`;
    }
    if (target.dataset.dragEye) {
      const side = target.dataset.dragEye;
      editDesign(
        `${side}.${axis}`,
        state.avatarDesign[side][axis] + sign * amount,
      );
      selector = `[data-drag-eye="${side}"]`;
    }
    if (target.dataset.contour !== undefined) {
      const index = Number(target.dataset.contour);
      state.avatarDesign.contour[index] +=
        (["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : -1) *
        (event.shiftKey ? 0.1 : 0.02);
      state.avatarDesign = normalizeAvatar(state.avatarDesign);
      selector = `[data-contour="${index}"]`;
    }
    refreshAppearance();
    finishAppearance();
    $(selector)?.focus({ preventScroll: true });
    return;
  }
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "z" &&
    !event.target.closest("input,textarea,select,[contenteditable]")
  ) {
    event.preventDefault();
    handleCreatorClick({
      dataset: { action: event.shiftKey ? "avatar-redo" : "avatar-undo" },
      hasAttribute: () => false,
    });
  }
});
