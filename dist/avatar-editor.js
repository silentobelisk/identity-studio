import {
  SHAPES,
  PART_SHAPES,
  STYLES,
  EYES,
  MOUTHS,
  PATTERNS,
  HEADWEAR,
  GLASSES,
  BACKGROUNDS,
  AVATAR_LIMITS,
  EYE_LIMITS,
  PART_LIMITS,
  avatarDataURL,
  contourPoints,
} from "./avatar.js";

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const getPath = (obj, path) =>
  path.split(".").reduce((value, key) => value?.[key], obj);
export function setPath(obj, path, value) {
  const keys = path.split(".");
  if (keys.some((k) => ["__proto__", "prototype", "constructor"].includes(k)))
    return;
  const last = keys.pop();
  let target = obj;
  for (const key of keys) {
    if (!target || !Object.hasOwn(target, key)) return;
    target = target[key];
  }
  if (target && Object.hasOwn(target, last)) target[last] = value;
}
const title = (text, hint = "") =>
  `<div class="inspector-heading"><h3>${text}</h3>${hint ? `<p>${hint}</p>` : ""}</div>`;
function range(d, path, label, min, max, step = 1) {
  const value = getPath(d, path),
    id = "design-" + path.replaceAll(".", "-");
  return `<div class="design-field"><div><label for="${id}">${label}</label><input class="precise-number" type="number" data-design="${path}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label} exact value" /></div><input id="${id}" type="range" data-design="${path}" min="${min}" max="${max}" step="${step}" value="${value}" /></div>`;
}
function select(d, path, label, options) {
  const id = "design-" + path.replaceAll(".", "-");
  return `<div class="design-select"><label for="${id}">${label}</label><select id="${id}" data-design="${path}">${Object.entries(
    options,
  )
    .map(
      ([key, value]) =>
        `<option value="${key}" ${getPath(d, path) === key ? "selected" : ""}>${value}</option>`,
    )
    .join("")}</select></div>`;
}
function color(d, path, label) {
  const id = "design-" + path.replaceAll(".", "-"),
    value = getPath(d, path);
  return `<div class="design-color"><label for="${id}">${label}</label><span><input id="${id}" type="color" data-design="${path}" value="${value}" /><input class="hex-color" aria-label="${label} hex code" data-design="${path}" data-hex="true" value="${value}" maxlength="7" pattern="#[a-fA-F0-9]{6}" /></span></div>`;
}
function choices(d, path, options) {
  return `<div class="design-choices" role="group" aria-label="${path}">${Object.entries(
    options,
  )
    .map(
      ([key, value]) =>
        `<button data-design-choice="${path}" data-value="${key}" class="${getPath(d, path) === key ? "selected" : ""}" aria-pressed="${getPath(d, path) === key}">${value}</button>`,
    )
    .join("")}</div>`;
}

export function renderHandles(design, ui) {
  if (ui.mode !== "builder") return "";
  const d = design,
    trans = `translate(256 268) rotate(${d.rotation})`;
  if (ui.panel === "body" && ui.selectedPart >= 0 && d.parts[ui.selectedPart]) {
    const p = d.parts[ui.selectedPart];
    return `<g transform="${trans}"><g transform="translate(${p.x} ${p.y}) rotate(${p.rotation})"><rect data-drag-part="${ui.selectedPart}" role="button" tabindex="0" aria-label="Move selected body piece with arrow keys" x="${-p.width / 2 - 10}" y="${-p.height / 2 - 10}" width="${p.width + 20}" height="${p.height + 20}" rx="9" class="part-selection"/><circle cx="0" cy="0" r="7" class="center-handle" pointer-events="none"/></g></g>`;
  }
  if (ui.panel === "body" && d.shape === "sculpt")
    return `<g transform="${trans}">${contourPoints(d)
      .map(
        (p, i) =>
          `<circle cx="${p.x}" cy="${p.y}" r="7" class="sculpt-handle" data-contour="${i}" role="slider" tabindex="0" aria-label="Outline point ${i + 1}" aria-valuemin="50" aria-valuemax="115" aria-valuenow="${Math.round(d.contour[i] * 100)}"/>`,
      )
      .join("")}</g>`;
  if (ui.panel === "face")
    return `<g transform="${trans}"><g transform="translate(${d.faceX} ${d.faceY})">${[
      "leftEye",
      "rightEye",
    ]
      .map((side) => {
        const e = d[side];
        return `<rect x="${e.x - e.width / 2 - 12}" y="${e.y - e.height / 2 - 12}" width="${e.width + 24}" height="${e.height + 24}" rx="8" class="eye-selection ${ui.eyeSide === side ? "active" : ""}" data-drag-eye="${side}" role="button" tabindex="0" aria-label="Move ${side === "leftEye" ? "left" : "right"} eye with arrow keys"/>`;
      })
      .join("")}</g></g>`;
  return "";
}
export function renderBuilderStage(state, ui, history) {
  const d = state.avatarDesign,
    mode = state.avatarMode;
  const legacy =
    mode === "legacy"
      ? `<span class="avatar-image legacy-stage-image" style="background-image:url('/assets/${state.collection}.png');background-position:${state.avatar % 2 ? "100%" : "0%"} ${state.avatar > 1 ? "100%" : "0%"}"></span>`
      : "";
  const image = mode === "builder" ? avatarDataURL(d) : state.customAvatar;
  const stageImage =
    legacy ||
    `<img id="builder-avatar" src="${esc(image)}" alt="Your custom AI employee avatar" draggable="false" />`;
  return `<div class="creator-toolbar"><div class="creator-modes" role="group" aria-label="Avatar source"><button data-avatar-mode="builder" aria-pressed="${mode === "builder"}" class="${mode === "builder" ? "selected" : ""}">Create a character</button><button data-action="upload" class="${mode === "upload" ? "selected" : ""}">Upload an image</button>${state.customAvatar && mode !== "upload" ? '<button data-avatar-mode="upload">Use saved image</button>' : ""}${mode === "legacy" ? "<span>Earlier saved avatar</span>" : ""}</div><div class="history-actions"><button data-action="avatar-undo" aria-label="Undo appearance change" title="Undo appearance change" ${history.past.length ? "" : "disabled"}>↶</button><button data-action="avatar-redo" aria-label="Redo appearance change" title="Redo appearance change" ${history.future.length ? "" : "disabled"}>↷</button></div></div><div class="avatar-stage"><div class="stage-topline"><span>${mode === "builder" ? "YOUR ORIGINAL, IN THE MAKING" : "YOUR SAVED IMAGE"}</span><span>LIVE CANVAS</span></div><div class="avatar-canvas">${stageImage}<svg id="avatar-handles" viewBox="0 0 512 512" aria-label="Avatar editing handles">${renderHandles(d, { ...ui, mode })}</svg></div><div class="stage-bottomline"><span id="stage-hint">${stageHint(state, ui)}</span><span>512 × 512 VIEW</span></div></div><div class="creator-caption"><div><strong>${esc(state.name || "Your next teammate")}</strong><span>Every detail is yours to change.</span></div><button class="secondary-button randomize-button" data-action="avatar-randomize" ${mode === "builder" ? "" : "disabled"}>↝ Explore a new combination</button></div><div class="random-locks"><span>Keep when exploring:</span>${[
    ["body", "Body"],
    ["face", "Face"],
    ["colors", "Style & colors"],
    ["extras", "Extra pieces"],
  ]
    .map(
      ([id, label]) =>
        `<button data-lock="${id}" class="${ui.locks.has(id) ? "locked" : ""}" aria-pressed="${ui.locks.has(id)}" aria-label="Keep ${label.toLowerCase()} when exploring">${ui.locks.has(id) ? "●" : "○"} ${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="creator-export"><div class="export-size"><label for="avatar-resolution">Export size</label><select id="avatar-resolution"><option value="512" ${state.avatarResolution === 512 ? "selected" : ""}>512 px</option><option value="1024" ${state.avatarResolution === 1024 ? "selected" : ""}>1024 px</option><option value="2048" ${state.avatarResolution === 2048 ? "selected" : ""}>2048 px</option></select></div><button class="text-link" data-action="export-png">↓ PNG</button>${mode === "builder" ? '<button class="text-link" data-action="export-svg">↓ SVG</button><button class="text-link" data-action="export-design">Save editable design</button>' : ""}<button class="text-link" data-action="import-design">Open a design</button></div><input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" hidden/><input id="design-import" type="file" accept=".json,application/json" hidden/><p class="creator-note">Change the body, build it from pieces, and shape the expression. Your editable design travels with the identity kit.</p>`;
}
export function stageHint(state, ui) {
  if (state.avatarMode !== "builder")
    return "Your image is preserved. Switch to Create a character to build a new look.";
  if (ui.panel === "face")
    return "Drag either eye. Arrow keys work on selected handles, too.";
  if (ui.panel === "body" && ui.selectedPart >= 0)
    return "Drag the outlined piece to position it. Fine-tune it in the inspector.";
  if (ui.panel === "body" && state.avatarDesign.shape === "sculpt")
    return "Drag the 12 outline points to sculpt your own silhouette.";
  return "Build a silhouette. Give it an expression. Make it yours.";
}
export function renderInspector(state, ui) {
  const d = state.avatarDesign;
  if (state.avatarMode !== "builder")
    return `<div class="avatar-inspector"><div class="inspector-heading"><h3>${state.avatarMode === "upload" ? "Your uploaded artwork" : "Your earlier avatar"}</h3><p>This image stays available in your saved identity. Build a custom character whenever you’re ready.</p></div><button class="primary-button" data-avatar-mode="builder">Create a character →</button><div class="inspector-section">${cardColor(state)}</div></div>`;
  let content = "";
  if (ui.panel === "body") {
    const part = d.parts[ui.selectedPart];
    content =
      title(
        "Build their silhouette",
        "Start with a shape. Add pieces for ears, limbs, or something entirely your own.",
      ) +
      `<div class="body-piece-list"><button data-select-part="-1" aria-pressed="${ui.selectedPart === -1}" class="${ui.selectedPart === -1 ? "selected" : ""}">Main body <small>Carries the face</small></button>${d.parts.map((p, i) => `<button data-select-part="${i}" aria-pressed="${ui.selectedPart === i}" class="${ui.selectedPart === i ? "selected" : ""}">Piece ${i + 1}<small>${SHAPES[p.shape]}</small></button>`).join("")}</div><div class="piece-actions"><button data-action="add-piece" ${d.parts.length >= 8 ? "disabled" : ""}>+ Add a piece</button>${part ? '<button data-action="duplicate-piece">Duplicate</button><button data-action="remove-piece">Remove</button>' : ""}<small>${d.parts.length} / 8 pieces</small></div>`;
    if (part) {
      const base = `parts.${ui.selectedPart}`;
      content += `<div class="inspector-section">${select(d, base + ".shape", "Piece shape", PART_SHAPES)}${color(d, base + ".color", "Piece color")}${Object.entries(
        PART_LIMITS,
      )
        .filter(
          ([key]) =>
            key !== "roundness" ||
            ["squircle", "capsule", "diamond"].includes(part.shape),
        )
        .map(([key, limits]) =>
          range(
            d,
            base + "." + key,
            {
              x: "Horizontal position",
              y: "Vertical position",
              width: "Piece width",
              height: "Piece height",
              rotation: "Piece rotation",
              roundness: "Piece roundness",
              asymmetry: "Piece lean",
            }[key],
            ...limits,
          ),
        )
        .join(
          "",
        )}<label class="design-toggle"><input type="checkbox" data-design="${base}.front" ${part.front ? "checked" : ""}/> Place in front of the main body</label></div>`;
    } else
      content += `<div class="inspector-section">${choices(d, "shape", SHAPES)}${range(d, "width", "Body width", ...AVATAR_LIMITS.width)}${range(d, "height", "Body height", ...AVATAR_LIMITS.height)}${range(d, "rotation", "Body tilt", ...AVATAR_LIMITS.rotation)}${["squircle", "capsule", "diamond"].includes(d.shape) ? range(d, "roundness", "Roundness", ...AVATAR_LIMITS.roundness) : ""}${d.shape !== "sculpt" ? range(d, "asymmetry", "Lean", ...AVATAR_LIMITS.asymmetry) : ""}${d.shape === "sculpt" ? '<p class="inspector-tip">Drag the outline points on the canvas. Keyboard: Tab to a point, then use the arrow keys.</p>' : ""}</div>`;
  }
  if (ui.panel === "face") {
    const side = ui.eyeSide;
    content =
      title(
        "A look with character",
        "Each eye has its own shape, size, position, and angle.",
      ) +
      `<div class="expression-shortcuts"><span>Try an expression</span><div>${["neutral", "happy", "curious", "focused", "surprised", "sleepy"].map((e) => `<button data-expression="${e}">${e[0].toUpperCase() + e.slice(1)}</button>`).join("")}</div></div><div class="eye-side-switch" role="group" aria-label="Eye to edit"><button data-eye-side="leftEye" aria-pressed="${side === "leftEye"}" class="${side === "leftEye" ? "selected" : ""}">Left eye</button><button data-eye-side="rightEye" aria-pressed="${side === "rightEye"}" class="${side === "rightEye" ? "selected" : ""}">Right eye</button></div><label class="design-toggle"><input id="link-eyes" type="checkbox" ${ui.linkEyes ? "checked" : ""}/> Link eyes while editing <span>Mirror size, placement & angle</span></label><div class="inspector-section">${select(d, side + ".style", "Eye shape", EYES)}${Object.entries(
        EYE_LIMITS,
      )
        .map(([key, limits]) =>
          range(
            d,
            side + "." + key,
            {
              x: "Horizontal position",
              y: "Vertical position",
              width: "Eye width",
              height: "Eye height",
              rotation: "Eye rotation",
            }[key],
            ...limits,
          ),
        )
        .join(
          "",
        )}</div><div class="inspector-section">${range(d, "faceX", "Move the whole face left / right", ...AVATAR_LIMITS.faceX)}${range(d, "faceY", "Move the whole face up / down", ...AVATAR_LIMITS.faceY)}${select(d, "mouth", "Mouth", MOUTHS)}${range(d, "mouthSize", "Mouth size", ...AVATAR_LIMITS.mouthSize)}${range(d, "mouthY", "Mouth position", ...AVATAR_LIMITS.mouthY)}${range(d, "blush", "Blush", ...AVATAR_LIMITS.blush)}</div>`;
  }
  if (ui.panel === "style")
    content =
      title(
        "Find your visual language",
        "A whole different look from the same construction.",
      ) +
      choices(d, "style", STYLES) +
      `<div class="inspector-section">${color(d, "bodyColor", "Body")}${color(d, "secondaryColor", "Second color")}${color(d, "eyeColor", "Eyes & mouth")}${color(d, "detailColor", "Details & accessories")}${select(d, "pattern", "Body pattern", PATTERNS)}</div><div class="inspector-section">${select(d, "background", "Image background", BACKGROUNDS)}${d.background !== "transparent" ? color(d, "backgroundColor", "Background color") : ""}${d.background === "gradient" ? color(d, "backgroundEnd", "Gradient end") : ""}<p class="inspector-tip">Transparent backgrounds stay transparent in PNG and SVG exports.</p></div><div class="inspector-section">${cardColor(state)}</div>`;
  if (ui.panel === "details")
    content =
      title(
        "The finishing touches",
        "Mix these with your own body pieces to make a distinctive character.",
      ) +
      `<div class="inspector-section">${select(d, "headwear", "On top", HEADWEAR)}${select(d, "glasses", "Glasses", GLASSES)}${color(d, "detailColor", "Accessory color")}${color(d, "secondaryColor", "Second accessory color")}</div><div class="inspector-callout"><strong>Go beyond accessories.</strong><p>Add and move independent shapes in the Body tab. A pair of stretched orbs can become ears; a rotated diamond can become a fin.</p><button class="text-link" data-panel="body">Build with pieces →</button></div>`;
  return `<div class="avatar-inspector"><div class="inspector-tabs" role="group" aria-label="Avatar controls">${[
    ["body", "Body"],
    ["face", "Face"],
    ["style", "Style"],
    ["details", "Details"],
  ]
    .map(
      ([key, label]) =>
        `<button data-panel="${key}" class="${ui.panel === key ? "selected" : ""}" aria-pressed="${ui.panel === key}">${label}</button>`,
    )
    .join("")}</div><div class="inspector-content">${content}</div></div>`;
}
function cardColor(state) {
  return `<div class="design-color"><label for="card-accent">Identity card color</label><span><input id="card-accent" type="color" value="${state.accent}"/><input class="hex-color" id="card-accent-hex" aria-label="Identity card hex code" value="${state.accent}" maxlength="7" pattern="#[a-fA-F0-9]{6}"/></span></div>`;
}
