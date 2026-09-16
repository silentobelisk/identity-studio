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
function avatarMarkup(
  collection = state.collection,
  index = state.avatar,
  custom = state.customAvatar,
) {
  if (custom)
    return `<span class="avatar-image custom-avatar" style="background-image:url('${escapeHTML(custom)}')" role="img" aria-label="Your uploaded avatar"></span>`;
  return `<span class="avatar-image" style="background-image:url('/assets/${collection}.png');background-position:${index % 2 ? "100%" : "0%"} ${index > 1 ? "100%" : "0%"}" role="img" aria-label="${escapeHTML(COLLECTIONS[collection].names[index])} avatar"></span>`;
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
  const name = escapeHTML(state.name || "Your teammate");
  $("#employee-preview").innerHTML =
    `<article class="identity-card" style="--card-accent:${state.accent}"><div class="card-top"><span>TEAM MEMBER<br><strong>IDENTITY CARD</strong></span><span class="card-emblem" aria-hidden="true">✳</span></div><div class="card-portrait">${avatarMarkup()}</div><div class="card-info"><span class="card-hello">HELLO, I’M</span><h2>${name}<span class="name-dot">.</span></h2><p>${escapeHTML(state.role || "Your next AI employee")}</p></div><div class="card-traits">${
      state.traits
        .slice(0, 3)
        .map((t) => `<span>${escapeHTML(t)}</span>`)
        .join("") || "<span>A personality in progress</span>"
    }</div><div class="card-bottom"><span>AI EMPLOYEE</span><span>EST. ${new Date().getFullYear()}</span><span class="barcode" aria-hidden="true"></span></div></article><div class="in-the-wild"><div class="tiny-avatar" style="background:${state.accent}">${avatarMarkup()}</div><div><strong>${name} <span>in your workspace</span></strong><p>${escapeHTML(state.role || "Your next AI employee")} · AI teammate</p></div><span class="workspace-star" aria-hidden="true">✧</span></div>`;
}
function renderLook() {
  const collection = COLLECTIONS[state.collection];
  return (
    heading(
      "01 / THE LOOK",
      "A face you’ll<br><em>look forward to.</em>",
      "Pick a little character for your next big idea.",
    ) +
    `<div class="collection-tabs" role="group" aria-label="Avatar collection">${Object.entries(
      COLLECTIONS,
    )
      .map(
        ([id, c]) =>
          `<button data-collection="${id}" aria-pressed="${state.collection === id}" class="${state.collection === id ? "selected" : ""}">${c.label}<span>04</span></button>`,
      )
      .join(
        "",
      )}</div><div class="collection-caption"><p>${collection.note}</p><button class="icon-button" data-action="surprise" aria-label="Choose a different avatar" title="Surprise me">${icon("shuffle")}</button></div><div class="avatar-grid">${collection.names.map((name, i) => `<button class="avatar-option ${state.avatar === i && !state.customAvatar ? "selected" : ""}" data-avatar="${i}" aria-pressed="${state.avatar === i && !state.customAvatar}" aria-label="Choose ${escapeHTML(name)}"><span class="avatar-art">${avatarMarkup(state.collection, i, "")}</span><span class="avatar-caption"><span><strong>${name}</strong><small>${collection.descriptions[i]}</small></span><span class="selection-check">${icon("check")}</span></span></button>`).join("")}</div><div class="custom-row"><span>Already have a face in mind?</span><button class="text-link" data-action="upload">${icon("upload")} Upload your own</button><input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" hidden /></div>${state.customAvatar ? `<div class="upload-notice">Your uploaded avatar is selected.<button class="text-link" data-action="remove-upload">Use a collection avatar</button></div>` : ""}<div class="accent-row"><span>Make it your color</span><div class="color-options" role="group" aria-label="Identity card color">${ACCENTS.map((a) => `<button class="color-swatch ${state.accent === a.color ? "selected" : ""}" style="--swatch:${a.color}" data-accent="${a.color}" aria-label="${a.name}" aria-pressed="${state.accent === a.color}" title="${a.name}">${state.accent === a.color ? icon("check") : ""}</button>`).join("")}</div></div>`
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
    ["avatar.png", "A 512 × 512 profile picture"],
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
    identity.customAvatar || `/assets/${identity.collection}.png`,
  );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Your browser could not create the profile picture.");
  ctx.fillStyle = identity.accent;
  ctx.fillRect(0, 0, 512, 512);
  if (identity.customAvatar) {
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
      512,
      512,
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
    state.customAvatar = processedAvatar;
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
      data.version !== 1 ||
      typeof data.name !== "string" ||
      typeof data.role !== "string"
    )
      throw new Error("That isn’t a supported Taste Vault identity file.");
    state = normalizeIdentity(data);
    state.step = 4;
    save();
    render();
    toast(`${state.name || "Your identity"} is back in the studio.`);
  } catch (error) {
    toast(
      error instanceof SyntaxError
        ? "That file isn’t valid JSON. Choose identity.json from a Taste Vault kit."
        : error.message,
    );
  }
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-step"))
    return goToStep(Number(button.dataset.step));
  if (button.dataset.collection) {
    state.collection = button.dataset.collection;
    rerenderKeepingFocus(`[data-collection="${state.collection}"]`);
    return;
  }
  if (button.hasAttribute("data-avatar")) {
    state.avatar = Number(button.dataset.avatar);
    state.customAvatar = "";
    rerenderKeepingFocus(`[data-avatar="${state.avatar}"]`);
    return;
  }
  if (button.dataset.accent) {
    state.accent = button.dataset.accent;
    rerenderKeepingFocus(`[data-accent="${state.accent}"]`);
    return;
  }
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
    case "surprise":
      state.avatar = (state.avatar + 1 + Math.floor(Math.random() * 3)) % 4;
      state.customAvatar = "";
      rerenderKeepingFocus('[data-action="surprise"]');
      break;
    case "upload":
      $("#avatar-upload").click();
      break;
    case "remove-upload":
      state.customAvatar = "";
      rerenderKeepingFocus('[data-action="upload"]');
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
      "Update the identity draft in Taste Vault and show the review step. Does not download files or set up employee workflows.",
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
