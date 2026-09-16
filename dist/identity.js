import {
  DEFAULT_AVATAR,
  normalizeAvatar,
  isHexColor,
  renderAvatarSVG,
  describeAvatar,
} from "./avatar.js";

// Kept only so first-edition identity files retain their original image.
export const COLLECTIONS = {
  characters: {
    label: "Characters",
    note: "A friendly face. A little unexpected.",
    names: ["Mellow", "Orbit", "Sprout", "Sunny"],
    descriptions: [
      "Easygoing energy",
      "A curious spirit",
      "Fresh perspective",
      "The bright side",
    ],
  },
  objects: {
    label: "Objects",
    note: "A small symbol with a strong point of view.",
    names: ["Loop", "Mercury", "Spark", "Balance"],
    descriptions: [
      "Connected thinking",
      "Quiet precision",
      "Creative instinct",
      "A steady presence",
    ],
  },
  portraits: {
    label: "Portraits",
    note: "A human touch for your digital teammate.",
    names: ["The thinker", "The maker", "The explorer", "The guide"],
    descriptions: [
      "Thoughtful by nature",
      "Ideas into action",
      "Endlessly curious",
      "Calm and considered",
    ],
  },
};
export const TRAITS = [
  "Curious",
  "Thoughtful",
  "Resourceful",
  "Direct",
  "Playful",
  "Meticulous",
  "Encouraging",
  "Calm",
  "Bold",
  "Practical",
  "Imaginative",
  "Candid",
];
export const ACCENTS = [
  { name: "Lab rose", color: "#f7c6d0" },
  { name: "Citron", color: "#d7ed78" },
  { name: "Periwinkle", color: "#bdc9f2" },
  { name: "Apricot", color: "#f5c5a5" },
  { name: "Rose", color: "#e8bfce" },
  { name: "Cloud", color: "#deded8" },
];
export const DEFAULT_IDENTITY = {
  version: 2,
  avatarMode: "builder",
  avatarDesign: DEFAULT_AVATAR,
  avatarResolution: 1024,
  step: 0,
  collection: "characters",
  avatar: 0,
  accent: "#f7c6d0",
  customAvatar: "",
  name: "Milo",
  role: "Creative partner",
  pronouns: "they / them",
  traits: ["Curious", "Thoughtful", "Resourceful"],
  warmth: 70,
  detail: 35,
  energy: 45,
  purpose: "Help me turn half-formed ideas into thoughtful, useful work.",
  audience: "Me and my small team. We value clarity, craft, and momentum.",
  principles:
    "Ask when context is missing.\nOffer a clear recommendation and explain the tradeoffs.\nKeep things useful, human, and easy to act on.",
  boundaries:
    "Be honest about uncertainty.\nAsk before publishing, sending messages, or making commitments on my behalf.\nKeep private information private.",
};
export const FIELD_LIMITS = {
  name: 40,
  role: 80,
  pronouns: 30,
  purpose: 600,
  audience: 600,
  principles: 1200,
  boundaries: 1200,
};
export function normalizeIdentity(input = {}) {
  const d = structuredClone(DEFAULT_IDENTITY);
  if (!input || typeof input !== "object" || Array.isArray(input)) return d;
  for (const [key, limit] of Object.entries(FIELD_LIMITS))
    if (typeof input[key] === "string") d[key] = input[key].slice(0, limit);
  if (Object.hasOwn(COLLECTIONS, input.collection))
    d.collection = input.collection;
  if (Number.isInteger(input.avatar) && input.avatar >= 0 && input.avatar < 4)
    d.avatar = input.avatar;
  if (isHexColor(input.accent)) d.accent = input.accent.toLowerCase();
  d.avatarDesign = normalizeAvatar(input.avatarDesign);
  if ([512, 1024, 2048].includes(input.avatarResolution))
    d.avatarResolution = input.avatarResolution;
  if (Number.isInteger(input.step) && input.step >= 0 && input.step <= 4)
    d.step = input.step;
  for (const key of ["warmth", "detail", "energy"])
    if (Number.isFinite(input[key]))
      d[key] = Math.round(Math.max(0, Math.min(100, input[key])));
  if (Array.isArray(input.traits))
    d.traits = [
      ...new Set(input.traits.filter((x) => TRAITS.includes(x))),
    ].slice(0, 5);
  if (
    typeof input.customAvatar === "string" &&
    input.customAvatar.length < 1600000 &&
    /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(
      input.customAvatar,
    )
  )
    d.customAvatar = input.customAvatar;
  d.avatarMode = ["builder", "upload", "legacy"].includes(input.avatarMode)
    ? input.avatarMode
    : d.customAvatar
      ? "upload"
      : input.version === 1 && Object.hasOwn(COLLECTIONS, input.collection)
        ? "legacy"
        : "builder";
  if (d.avatarMode === "upload" && !d.customAvatar) d.avatarMode = "builder";
  return d;
}
export function safeSlug(name) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "my-employee"
  );
}
export function validateIdentity(d) {
  const errors = [];
  if (!d.name.trim())
    errors.push({ step: 1, message: "Give your employee a name." });
  if (!d.role.trim())
    errors.push({ step: 1, message: "Add a role for your employee." });
  if (d.traits.length < 1)
    errors.push({ step: 2, message: "Choose at least one personality trait." });
  if (!d.purpose.trim())
    errors.push({ step: 3, message: "Add a purpose for your employee." });
  return errors;
}
export function voiceDescription(d) {
  return [
    d.warmth >= 65
      ? "Warm and conversational"
      : d.warmth <= 35
        ? "Professional and composed"
        : "Friendly and balanced",
    d.detail >= 65
      ? "thorough explanations"
      : d.detail <= 35
        ? "concise answers"
        : "just enough detail",
    d.energy >= 65
      ? "expressive energy"
      : d.energy <= 35
        ? "a calm presence"
        : "steady enthusiasm",
  ].join(", ");
}
export function voiceSample(d) {
  const opening =
    d.warmth >= 65
      ? `Hey, I’m ${d.name || "your teammate"}.`
      : d.warmth <= 35
        ? `Hello. I’m ${d.name || "your teammate"}.`
        : `Hi, I’m ${d.name || "your teammate"}.`;
  const middle =
    d.energy >= 65
      ? "Let’s find the possibility in your next idea."
      : d.energy <= 35
        ? "We can take this one thoughtful step at a time."
        : "Let’s make a little progress on what matters.";
  return `${opening} ${middle}${d.detail > 35 ? " Share the context and the outcome you have in mind, and I’ll help you think through a useful next step." : "Where should we start?".replace(/^/, " ")}${d.traits.includes("Playful") ? " Half-baked ideas welcome." : ""}`;
}
export function avatarPrompt(d) {
  if (d.avatarMode === "builder")
    return `${describeAvatar(d.avatarDesign)} This is ${d.name}, an AI ${d.role}, with a ${d.traits.join(", ").toLowerCase()} personality. Preserve the chosen rendering style, individual features, colors, construction, and background treatment from the reference artwork. Keep it recognizable at small profile-picture sizes. No text, logos, watermark, or interface elements.`;
  const type =
    d.avatarMode === "builder"
      ? describeAvatar(d.avatarDesign)
      : d.avatarMode === "upload"
        ? "Use the supplied avatar.png as the identity reference."
        : `Create an original ${d.collection === "characters" ? "sculptural matte clay mascot with two expressive eyes" : d.collection === "objects" ? "sculptural abstract object with a strong, simple silhouette" : "stylized editorial 3D head-and-shoulders portrait of a fictional adult"}. Visual starting point: ${COLLECTIONS[d.collection].names[d.avatar]}.`;
  return `${type} This is ${d.name}, an AI ${d.role}. Convey ${d.traits.join(", ").toLowerCase()}. Square profile picture, centered composition, soft studio light, uncluttered warm neutral background, recognizable at 32 pixels. Accent color ${d.accent}. No text, watermark, logos, or interface elements. Keep future variations consistent with the selected character.`;
}
const lines = (value) =>
  value
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((v) => `- ${v.replace(/^[-*]\s*/, "")}`)
    .join("\n");
export function createKitFiles(input) {
  const d = normalizeIdentity(input),
    errors = validateIdentity(d);
  if (errors.length) throw new Error(errors[0].message);
  const profile = { ...d };
  delete profile.step;
  profile.avatarFile = "avatar.png";
  profile.avatarSource =
    d.avatarMode === "builder"
      ? "procedural-design"
      : d.avatarMode === "upload"
        ? "user-upload"
        : `${d.collection}/${d.avatar}`;
  const traitText = d.traits.join(", ");
  const files = {
    "START-HERE.md": `# Meet ${d.name}\n\nYour AI employee’s identity kit, made with Identity Studio.\n\n## What’s inside\n\n- IDENTITY.md — name, role, and personality\n- BRAIN.md — purpose, working context, principles, and boundaries\n- VOICE.md — tone and a sample introduction\n- avatar.png — a 512 × 512 profile picture\n- avatar-prompt.md — a prompt for future visual variations\n- identity.json — a portable profile (reimport into Identity Studio to keep editing)\n\n## Your next step\n\nGive these files to the coding agent or builder you use for your AI employee. Start with: “Read this identity kit and use it as the foundation for my AI employee. Ask me about its responsibilities and workflows before implementing anything.”\n\nThis kit defines identity and preferences. It does not configure tools, memory, permissions, autonomous actions, or integrations. BRAIN.md is written guidance, not an executable agent or enforcement layer.\n\nYour uploaded images remain subject to their existing rights. Built-in avatars are original AI-generated artwork.\n`,
    "IDENTITY.md": `# ${d.name}\n\n**Role:** ${d.role}\n**Pronouns:** ${d.pronouns || "Not specified"}\n**Personality:** ${traitText}\n**Accent color:** ${d.accent}\n**Profile picture:** avatar.png\n\n## Purpose\n\n${d.purpose}\n\nAn AI teammate with a consistent identity. Never imply that this persona is a human or claim real-world experiences it does not have.\n`,
    "BRAIN.md": `# ${d.name} — working identity\n\n## Purpose\n\n${d.purpose}\n\n## Who I work with\n\n${d.audience || "Ask the user about their team and context."}\n\n## How I approach work\n\n${lines(d.principles) || "- Ask the user how they prefer to work."}\n\n## Boundaries\n\n${lines(d.boundaries) || "- Clarify permissions before taking consequential actions."}\n\n## Personality\n\n${traitText}. ${voiceDescription(d)}.\n\n## Before the build\n\nThis file provides persona guidance only. Confirm the actual responsibilities, data access, approval rules, tools, and success criteria separately. It does not grant permissions or enforce controls.\n`,
    "VOICE.md": `# ${d.name} — voice\n\n${voiceDescription(d)}.\n\n- Warmth: ${d.warmth}/100 (composed → conversational)\n- Detail: ${d.detail}/100 (concise → thorough)\n- Energy: ${d.energy}/100 (calm → expressive)\n\n## Example introduction\n\n${voiceSample(d)}\n\nThis is a template-based tone illustration, not a generated conversation or a guarantee of model behavior.\n`,
    "avatar-prompt.md": `# Avatar direction\n\n${avatarPrompt(d)}\n`,
    "identity.json": JSON.stringify(profile, null, 2),
  };
  if (d.avatarMode === "builder") {
    files["avatar.svg"] = renderAvatarSVG(d.avatarDesign, {
      size: d.avatarResolution,
    });
    files["avatar-design.json"] = JSON.stringify(
      { type: "taste-vault-avatar", version: 1, design: d.avatarDesign },
      null,
      2,
    );
  }
  files["START-HERE.md"] = files["START-HERE.md"]
    .replace("512 × 512", `${d.avatarResolution} × ${d.avatarResolution}`)
    .replace(
      "Built-in avatars are original AI-generated artwork.",
      "Custom characters are rendered from your editable design. First-edition gallery artwork is retained only for older projects.",
    );
  if (d.avatarMode === "builder")
    files["START-HERE.md"] +=
      "\n## Keep creating\n\n- avatar.svg — scalable artwork matching the exported PNG\n- avatar-design.json — open with “Open a design” in Identity Studio to edit every shape, color, and facial feature\n\nThe full identity.json also preserves this construction.\n";
  return files;
}
// ZIP uses STORE entries: small, dependency-free, and readable by standard unzip tools.
const encoder = new TextEncoder();
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
export function zipFiles(files) {
  const parts = [],
    directory = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const filename = encoder.encode(name),
      data =
        typeof content === "string"
          ? encoder.encode(content)
          : new Uint8Array(content),
      crc = crc32(data);
    const header = new Uint8Array(30 + filename.length),
      h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x800, true);
    h.setUint16(12, 33, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true);
    h.setUint32(22, data.length, true);
    h.setUint16(26, filename.length, true);
    header.set(filename, 30);
    const central = new Uint8Array(46 + filename.length),
      c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x800, true);
    c.setUint16(14, 33, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, filename.length, true);
    c.setUint32(42, offset, true);
    central.set(filename, 46);
    parts.push(header, data);
    directory.push(central);
    offset += header.length + data.length;
  }
  const directorySize = directory.reduce((n, part) => n + part.length, 0),
    end = new Uint8Array(22),
    e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, directory.length, true);
  e.setUint16(10, directory.length, true);
  e.setUint32(12, directorySize, true);
  e.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: "application/zip" });
}
