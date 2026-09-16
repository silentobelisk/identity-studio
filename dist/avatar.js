/** Original procedural avatar authoring model. All renderers consume this same data. */
export const SHAPES = {
  orb: "Orb",
  squircle: "Soft square",
  bean: "Bean",
  capsule: "Capsule",
  cloud: "Cloud",
  star: "Star",
  flower: "Flower",
  diamond: "Diamond",
  droplet: "Droplet",
  pebble: "Pebble",
  ghost: "Ghost",
  sculpt: "Sculpt your own",
};
export const PART_SHAPES = Object.fromEntries(
  Object.entries(SHAPES).filter(([key]) => key !== "sculpt"),
);
export const STYLES = {
  soft: "Soft volume",
  flat: "Flat graphic",
  sticker: "Sticker",
  pixel: "Pixel",
};
export const EYES = {
  pill: "Pill",
  round: "Round",
  curious: "With pupils",
  happy: "Happy arc",
  sleepy: "Sleepy",
  cross: "Cross",
};
export const MOUTHS = {
  none: "None",
  smile: "Smile",
  grin: "Grin",
  oh: "Surprised",
  smirk: "Smirk",
  calm: "Straight",
  cat: "Little cat",
};
export const PATTERNS = {
  none: "Solid",
  dots: "Spots",
  stripes: "Stripes",
  split: "Two-tone",
  freckles: "Freckles",
};
export const HEADWEAR = {
  none: "None",
  antenna: "Antenna",
  sprout: "Sprout",
  horns: "Horns",
  crown: "Crown",
  beanie: "Beanie",
};
export const GLASSES = {
  none: "None",
  round: "Round frames",
  square: "Square frames",
  shades: "Sunglasses",
};
export const BACKGROUNDS = {
  transparent: "Transparent",
  solid: "Solid",
  gradient: "Gradient",
  halo: "Circle",
};
export const AVATAR_LIMITS = {
  width: [150, 320],
  height: [150, 320],
  rotation: [-35, 35],
  roundness: [0, 100],
  asymmetry: [-50, 50],
  faceX: [-45, 45],
  faceY: [-55, 55],
  mouthSize: [10, 70],
  mouthY: [12, 95],
  blush: [0, 100],
};
export const EYE_LIMITS = {
  x: [-100, 100],
  y: [-65, 65],
  width: [8, 65],
  height: [5, 85],
  rotation: [-60, 60],
};
export const PART_LIMITS = {
  x: [-170, 170],
  y: [-175, 175],
  width: [20, 180],
  height: [20, 180],
  rotation: [-180, 180],
  roundness: [0, 100],
  asymmetry: [-50, 50],
};
export const COLOR_KEYS = [
  "bodyColor",
  "secondaryColor",
  "eyeColor",
  "detailColor",
  "backgroundColor",
  "backgroundEnd",
];
export const DEFAULT_AVATAR = {
  shape: "squircle",
  style: "soft",
  width: 255,
  height: 250,
  rotation: -5,
  roundness: 70,
  asymmetry: 0,
  bodyColor: "#a6c874",
  secondaryColor: "#54763e",
  eyeColor: "#20281e",
  detailColor: "#ef9a72",
  background: "transparent",
  backgroundColor: "#e9eadf",
  backgroundEnd: "#b6c5e5",
  pattern: "none",
  faceX: 0,
  faceY: 0,
  leftEye: { style: "pill", x: -40, y: 0, width: 20, height: 42, rotation: -4 },
  rightEye: { style: "pill", x: 40, y: -4, width: 20, height: 36, rotation: 4 },
  mouth: "none",
  mouthSize: 38,
  mouthY: 55,
  blush: 0,
  glasses: "none",
  headwear: "none",
  contour: [1, 0.91, 1, 0.95, 0.88, 1, 0.9, 1, 0.93, 1, 0.92, 1],
  parts: [],
};
const clamp = (v, min, max, fallback) =>
  Number.isFinite(v)
    ? Math.max(min, Math.min(max, Math.round(v * 100) / 100))
    : fallback;
export const isHexColor = (value) =>
  typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);
function choice(value, options, fallback) {
  return typeof value === "string" && Object.hasOwn(options, value)
    ? value
    : fallback;
}
export function normalizeAvatar(input = {}) {
  const d = structuredClone(DEFAULT_AVATAR);
  if (!input || typeof input !== "object" || Array.isArray(input)) return d;
  for (const [key, limits] of Object.entries(AVATAR_LIMITS))
    d[key] = clamp(input[key], ...limits, d[key]);
  for (const key of COLOR_KEYS)
    if (isHexColor(input[key])) d[key] = input[key].toLowerCase();
  for (const [key, options] of Object.entries({
    shape: SHAPES,
    style: STYLES,
    mouth: MOUTHS,
    pattern: PATTERNS,
    headwear: HEADWEAR,
    glasses: GLASSES,
    background: BACKGROUNDS,
  }))
    d[key] = choice(input[key], options, d[key]);
  for (const side of ["leftEye", "rightEye"]) {
    const eye = input[side];
    if (!eye || typeof eye !== "object") continue;
    d[side].style = choice(eye.style, EYES, d[side].style);
    for (const [key, limits] of Object.entries(EYE_LIMITS))
      d[side][key] = clamp(eye[key], ...limits, d[side][key]);
  }
  if (Array.isArray(input.contour) && input.contour.length === 12)
    d.contour = input.contour.map((r, i) => clamp(r, 0.5, 1.15, d.contour[i]));
  if (Array.isArray(input.parts))
    d.parts = input.parts
      .slice(0, 8)
      .filter((p) => p && typeof p === "object")
      .map((p, i) => {
        const part = {
          id: `piece-${i + 1}`,
          shape: choice(p.shape, PART_SHAPES, "orb"),
          color: isHexColor(p.color) ? p.color.toLowerCase() : d.bodyColor,
          front: p.front === true,
        };
        for (const [key, limits] of Object.entries(PART_LIMITS))
          part[key] = clamp(
            p[key],
            ...limits,
            {
              x: 0,
              y: 0,
              width: 75,
              height: 75,
              rotation: 0,
              roundness: 70,
              asymmetry: 0,
            }[key],
          );
        return part;
      });
  return d;
}
export function seededRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hslHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}
export function randomizeAvatar(input, locks = [], seed = 1) {
  const d = normalizeAvatar(input),
    rand = seededRandom(seed),
    pick = (arr) => arr[Math.floor(rand() * arr.length)],
    num = (min, max) => Math.round(min + rand() * (max - min));
  if (!locks.includes("body"))
    Object.assign(d, {
      shape: pick(Object.keys(SHAPES)),
      width: num(180, 305),
      height: num(185, 295),
      rotation: num(-20, 20),
      roundness: num(25, 95),
      asymmetry: num(-25, 25),
      contour: d.contour.map(() => num(65, 110) / 100),
    });
  if (!locks.includes("face")) {
    const style = pick(Object.keys(EYES)),
      size = num(16, 32),
      height = num(22, 60),
      gap = num(25, 55);
    d.leftEye = {
      style,
      x: -gap,
      y: num(-9, 9),
      width: size,
      height,
      rotation: num(-15, 15),
    };
    d.rightEye = {
      style,
      x: gap,
      y: num(-9, 9),
      width: size,
      height: num(20, 60),
      rotation: num(-15, 15),
    };
    Object.assign(d, {
      mouth: pick(Object.keys(MOUTHS)),
      mouthSize: num(20, 50),
      faceX: num(-12, 12),
      faceY: num(-15, 15),
      mouthY: num(40, 65),
      blush: num(0, 60),
    });
  }
  if (!locks.includes("colors")) {
    const hue = num(0, 359);
    Object.assign(d, {
      bodyColor: hslHex(hue, 0.65, 0.65),
      secondaryColor: hslHex((hue + 70) % 360, 0.6, 0.42),
      eyeColor: rand() > 0.85 ? "#fff8e9" : "#20252b",
      detailColor: hslHex((hue + 180) % 360, 0.7, 0.6),
      backgroundColor: hslHex((hue + 30) % 360, 0.25, 0.91),
      backgroundEnd: hslHex((hue + 210) % 360, 0.4, 0.78),
      style: pick(Object.keys(STYLES)),
      pattern: pick(["none", "none", "dots", "stripes", "split", "freckles"]),
    });
  }
  if (!locks.includes("extras")) {
    d.headwear = pick(Object.keys(HEADWEAR));
    d.glasses = pick(["none", "none", "round", "square", "shades"]);
    d.parts = [];
    if (rand() > 0.55) {
      const color = d.bodyColor;
      d.parts = [
        {
          id: "piece-1",
          shape: "capsule",
          color,
          x: -110,
          y: -65,
          width: 50,
          height: 100,
          rotation: -35,
          front: false,
        },
        {
          id: "piece-2",
          shape: "capsule",
          color,
          x: 110,
          y: -65,
          width: 50,
          height: 100,
          rotation: 35,
          front: false,
        },
      ];
    }
  }
  return normalizeAvatar(d);
}
export function applyExpression(input, expression) {
  const d = normalizeAvatar(input);
  const changes = {
    neutral: { height: 40, rotation: 0, mouth: "none" },
    happy: { height: 22, rotation: 0, mouth: "smile", style: "happy" },
    curious: { height: 46, rotation: -12, mouth: "smirk" },
    focused: { height: 25, rotation: 15, mouth: "calm" },
    surprised: { height: 58, rotation: 0, mouth: "oh", style: "round" },
    sleepy: { height: 16, rotation: 0, mouth: "none", style: "sleepy" },
  }[expression];
  if (!changes) return d;
  for (const [i, side] of ["leftEye", "rightEye"].entries())
    Object.assign(d[side], {
      height: changes.height,
      rotation: changes.rotation * (i ? -1 : 1),
      style: changes.style || "pill",
    });
  if (expression === "curious") d.rightEye.height = 28;
  d.mouth = changes.mouth;
  return d;
}
export class AppearanceHistory {
  constructor(limit = 40) {
    this.limit = limit;
    this.past = [];
    this.future = [];
    this.pending = null;
  }
  begin(value) {
    if (!this.pending) this.pending = structuredClone(value);
  }
  commit(value) {
    if (
      this.pending &&
      JSON.stringify(this.pending) !== JSON.stringify(value)
    ) {
      this.past.push(this.pending);
      if (this.past.length > this.limit) this.past.shift();
      this.future = [];
    }
    this.pending = null;
  }
  undo(value) {
    this.commit(value);
    if (!this.past.length) return value;
    this.future.push(structuredClone(value));
    return this.past.pop();
  }
  redo(value) {
    if (!this.future.length) return value;
    this.past.push(structuredClone(value));
    return this.future.pop();
  }
  cancel() {
    const previous = this.pending;
    this.pending = null;
    return previous;
  }
  clear() {
    this.past = [];
    this.future = [];
    this.pending = null;
  }
}
const n = (value) => Math.round(value * 100) / 100;
export function contourPoints(config) {
  const d = normalizeAvatar(config);
  return d.contour.map((radius, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return {
      x: ((Math.cos(a) * d.width) / 2) * radius,
      y: ((Math.sin(a) * d.height) / 2) * radius,
    };
  });
}
function smoothPath(points, softness = 1) {
  let path = `M${n(points[0].x)} ${n(points[0].y)}`;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length],
      p1 = points[i],
      p2 = points[(i + 1) % points.length],
      p3 = points[(i + 2) % points.length];
    path += `C${n(p1.x + ((p2.x - p0.x) / 6) * softness)} ${n(p1.y + ((p2.y - p0.y) / 6) * softness)} ${n(p2.x - ((p3.x - p1.x) / 6) * softness)} ${n(p2.y - ((p3.y - p1.y) / 6) * softness)} ${n(p2.x)} ${n(p2.y)}`;
  }
  return path + "Z";
}
export function shapePoints(
  shape,
  width,
  height,
  roundness = 70,
  asymmetry = 0,
  contour = DEFAULT_AVATAR.contour,
) {
  if (shape === "sculpt")
    return contour.map((radius, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return {
        x: ((Math.cos(a) * width) / 2) * radius,
        y: ((Math.sin(a) * height) / 2) * radius,
      };
    });
  const points = [];
  const exponent = 2 + (100 - roundness) / 13;
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2,
      cos = Math.cos(a),
      sin = Math.sin(a);
    let x = cos,
      y = sin,
      r = 1;
    if (shape === "squircle" || shape === "capsule") {
      const exp = shape === "capsule" ? 2.1 + (100 - roundness) / 70 : exponent;
      x = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / exp);
      y = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / exp);
    }
    if (shape === "bean") {
      r = 0.87 + 0.15 * Math.sin(a * 2 + 0.6) + 0.1 * Math.sin(a * 3);
      x = cos * r + 0.1 * sin;
      y = sin * r;
    }
    if (shape === "pebble") {
      r = 0.86 + 0.11 * Math.cos(a * 3 + 0.9);
      x = cos * r + 0.16 * sin;
      y = sin * r;
    }
    if (shape === "cloud") {
      r = 0.83 + 0.1 * Math.cos(a * 5) + 0.05 * Math.sin(a * 3);
      x = cos * r;
      y = sin * r * 0.84;
    }
    if (shape === "flower") {
      r = 0.79 + 0.2 * Math.cos(a * 6);
      x = cos * r;
      y = sin * r;
    }
    if (shape === "star") {
      r = 0.76 + 0.23 * Math.cos(5 * (a + Math.PI / 2));
      x = cos * r;
      y = sin * r;
    }
    if (shape === "diamond") {
      r = 1 / (Math.abs(cos) + Math.abs(sin));
      r = r * (1 - roundness / 250) + roundness / 250;
      x = cos * r;
      y = sin * r;
    }
    if (shape === "droplet") {
      x = cos * (0.78 + 0.26 * sin);
      y = sin;
    }
    if (shape === "ghost") {
      x = cos;
      y = sin;
      if (sin > 0.55) y = 0.78 + 0.12 * Math.cos(x * Math.PI * 4);
    }
    x += (asymmetry / 180) * sin;
    points.push({ x: (x * width) / 2, y: (y * height) / 2 });
  }
  return points;
}
function pathFor(d, part) {
  const p = part || d,
    points = shapePoints(
      p.shape,
      p.width,
      p.height,
      part ? p.roundness : d.roundness,
      part ? p.asymmetry : d.asymmetry,
      part ? DEFAULT_AVATAR.contour : d.contour,
    );
  if (d.style === "pixel")
    return (
      points
        .map(
          (p, i) =>
            `${i ? "L" : "M"}${Math.round(p.x / 12) * 12} ${Math.round(p.y / 12) * 12}`,
        )
        .join("") + "Z"
    );
  return smoothPath(points, p.shape === "sculpt" ? 0.9 : 1);
}
function mix(hex, target, amount) {
  const a = hex.match(/[a-f0-9]{2}/gi).map((v) => parseInt(v, 16)),
    b = target.match(/[a-f0-9]{2}/gi).map((v) => parseInt(v, 16));
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v * (1 - amount) + b[i] * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
/** Only validated enums, colors and numbers enter this SVG; never arbitrary user markup. */
export function renderAvatarSVG(input, options = {}) {
  const d = normalizeAvatar(input),
    size = [128, 256, 512, 1024, 2048].includes(options.size)
      ? options.size
      : 512;
  const bg = options.transparent ? "transparent" : d.background,
    soft = d.style === "soft",
    sticker = d.style === "sticker",
    pixel = d.style === "pixel";
  const stroke = sticker
    ? ` stroke="${d.eyeColor}" stroke-width="7" stroke-linejoin="round"`
    : "";
  const bodyPath = pathFor(d),
    defs = [];
  const gradient = (id, color) => {
    defs.push(
      `<radialGradient id="${id}" cx="28%" cy="20%" r="85%"><stop offset="0" stop-color="${mix(color, "#ffffff", 0.48)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, "#172015", 0.27)}"/></radialGradient>`,
    );
    return `url(#${id})`;
  };
  const bodyFill = soft ? gradient("body", d.bodyColor) : d.bodyColor;
  defs.push(
    `<clipPath id="body-clip"><path d="${bodyPath}"/></clipPath><linearGradient id="background" x2="1" y2="1"><stop stop-color="${d.backgroundColor}"/><stop offset="1" stop-color="${d.backgroundEnd}"/></linearGradient>`,
  );
  let behind = "",
    front = "";
  d.parts.forEach((part, i) => {
    const fill = soft ? gradient(`piece-${i}`, part.color) : part.color;
    const markup = `<g transform="translate(${part.x} ${part.y}) rotate(${part.rotation})"><path d="${pathFor(d, part)}" fill="${fill}"${stroke}/></g>`;
    if (part.front) front += markup;
    else behind += markup;
  });
  let pattern = "";
  if (d.pattern === "split")
    pattern = `<rect x="0" y="-200" width="220" height="420" fill="${d.secondaryColor}" opacity=".85"/>`;
  if (d.pattern === "stripes")
    for (let i = -400; i <= 400; i += 42)
      pattern += `<path d="M${i} -200l160 400" stroke="${d.secondaryColor}" stroke-width="16" opacity=".6"/>`;
  if (d.pattern === "dots")
    for (let x = -160; x < 170; x += 43)
      for (let y = -180; y < 185; y += 43)
        pattern += `<circle cx="${x + (Math.abs(y) % 2) * 15}" cy="${y}" r="8" fill="${d.secondaryColor}" opacity=".6"/>`;
  let top = "";
  const topY = -d.height / 2;
  if (d.headwear === "antenna")
    top = `<path d="M0 ${topY + 12}Q-8 ${topY - 18} 12 ${topY - 36}" fill="none" stroke="${d.eyeColor}" stroke-width="8" stroke-linecap="round"/><circle cx="12" cy="${topY - 38}" r="15" fill="${d.detailColor}"${stroke}/>`;
  if (d.headwear === "sprout")
    top = `<path d="M0 ${topY + 14}Q0 ${topY - 23} 16 ${topY - 32}" fill="none" stroke="${d.secondaryColor}" stroke-width="7"/><path d="M5 ${topY - 9}Q-55 ${topY - 5} -47 ${topY - 44}Q-2 ${topY - 52} 5 ${topY - 9}M8 ${topY - 13}Q55 ${topY - 8} 56 ${topY - 45}Q20 ${topY - 53} 8 ${topY - 13}" fill="${d.secondaryColor}"${stroke}/>`;
  if (d.headwear === "horns")
    top = `<path d="M-90 ${topY + 42}Q-128 ${topY - 13} -75 ${topY - 36}Q-87 ${topY + 1} -48 ${topY + 20}M90 ${topY + 42}Q128 ${topY - 13} 75 ${topY - 36}Q87 ${topY + 1} 48 ${topY + 20}" fill="${d.detailColor}"${stroke}/>`;
  if (d.headwear === "crown")
    top = `<path d="M-67 ${topY + 24}l-13-62 43 28 37-41 37 41 43-28-13 62Z" fill="${d.detailColor}"${stroke}/>`;
  if (d.headwear === "beanie")
    top = `<path d="M-100 ${topY + 50}Q-102 ${topY - 38} 0 ${topY - 32}Q102 ${topY - 38} 100 ${topY + 50}Z" fill="${d.secondaryColor}"${stroke}/><rect x="-109" y="${topY + 24}" width="218" height="35" rx="13" fill="${d.detailColor}"${stroke}/><circle cx="0" cy="${topY - 39}" r="19" fill="${d.detailColor}"/>`;
  const eye = (e) => {
    const w = e.width,
      h = e.height,
      c = d.eyeColor;
    let shape = "";
    if (e.style === "pill")
      shape = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${pixel ? 0 : w / 2}" fill="${c}"/>`;
    if (e.style === "round")
      shape = `<ellipse rx="${w / 1.6}" ry="${h / 2}" fill="${c}"/>`;
    if (e.style === "curious")
      shape = `<ellipse rx="${w}" ry="${h / 1.6}" fill="#fffdf4"/><ellipse cx="${d.faceX / 6}" cy="${d.faceY / 6}" rx="${w / 2}" ry="${h / 2.3}" fill="${c}"/>`;
    if (e.style === "happy")
      shape = `<path d="M${-w / 1.4} 4Q0 ${-h} ${w / 1.4} 4" fill="none" stroke="${c}" stroke-width="${Math.max(6, w / 3)}" stroke-linecap="round"/>`;
    if (e.style === "sleepy")
      shape = `<path d="M${-w} -3Q0 ${h * 0.9} ${w} -3" fill="none" stroke="${c}" stroke-width="${Math.max(6, w / 3)}" stroke-linecap="round"/>`;
    if (e.style === "cross")
      shape = `<path d="M${-w / 2} ${-h / 2}L${w / 2} ${h / 2}M${w / 2} ${-h / 2}L${-w / 2} ${h / 2}" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`;
    if (soft && ["pill", "round"].includes(e.style))
      shape += `<ellipse cx="${-w / 6}" cy="${-h / 4}" rx="${w / 6}" ry="${Math.max(2, h / 10)}" fill="#fff" opacity=".25"/>`;
    return `<g transform="translate(${e.x} ${e.y}) rotate(${e.rotation})">${shape}</g>`;
  };
  const m = d.mouthSize;
  let mouth = "";
  if (d.mouth === "smile")
    mouth = `<path d="M${-m / 2} 0Q0 ${m * 0.7} ${m / 2} 0"/>`;
  if (d.mouth === "smirk")
    mouth = `<path d="M${-m / 2} 5Q${m / 4} 12 ${m / 2} -7"/>`;
  if (d.mouth === "calm") mouth = `<path d="M${-m / 2} 0H${m / 2}"/>`;
  if (d.mouth === "cat")
    mouth = `<path d="M${-m / 2} 0Q${-m / 4} ${m * 0.5} 0 0Q${m / 4} ${m * 0.5} ${m / 2} 0"/>`;
  if (d.mouth === "oh")
    mouth = `<ellipse rx="${m / 3}" ry="${m / 2}" fill="${d.eyeColor}"/>`;
  if (d.mouth === "grin")
    mouth = `<path d="M${-m * 0.65} -7Q0 ${m} ${m * 0.65} -7Z" fill="${d.eyeColor}"/><path d="M${-m * 0.45} -2H${m * 0.45}" stroke="#fffdf4" stroke-width="6"/>`;
  let glasses = "";
  if (d.glasses !== "none") {
    for (const e of [d.leftEye, d.rightEye])
      glasses +=
        d.glasses === "round"
          ? `<circle cx="${e.x}" cy="${e.y}" r="${e.width + 13}"/>`
          : `<rect x="${e.x - e.width - 12}" y="${e.y - e.height / 2 - 9}" width="${e.width * 2 + 24}" height="${e.height + 18}" rx="${pixel ? 0 : 8}"/>`;
    glasses = `<g fill="${d.glasses === "shades" ? d.eyeColor : "none"}" stroke="${d.detailColor}" stroke-width="7">${glasses}<path d="M${d.leftEye.x + d.leftEye.width + 13} ${d.leftEye.y}Q0 -12 ${d.rightEye.x - d.rightEye.width - 13} ${d.rightEye.y}" fill="none"/></g>`;
  }
  let cheeks = "";
  if (d.blush > 0)
    for (const x of [-72, 72])
      cheeks += `<ellipse cx="${x}" cy="37" rx="24" ry="12" fill="${d.detailColor}" opacity="${d.blush / 130}"/>`;
  if (d.pattern === "freckles")
    for (const sign of [-1, 1])
      for (let i = 0; i < 3; i++)
        cheeks += `<circle cx="${sign * (55 + i * 12)}" cy="${31 + (i % 2) * 8}" r="3.5" fill="${d.secondaryColor}"/>`;
  const background =
    bg === "transparent"
      ? ""
      : bg === "halo"
        ? `<circle cx="256" cy="256" r="232" fill="${d.backgroundColor}"/>`
        : `<rect width="512" height="512" fill="${bg === "gradient" ? "url(#background)" : d.backgroundColor}"/>`;
  const shadow = soft
    ? `<ellipse cx="256" cy="443" rx="${Math.min(120, d.width * 0.43)}" ry="12" fill="#111827" opacity=".12"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"${pixel ? ' shape-rendering="crispEdges"' : ""}><defs>${defs.join("")}</defs>${background}${shadow}<g transform="translate(256 268) rotate(${d.rotation})">${behind}<path d="${bodyPath}" fill="${bodyFill}"${stroke}/><g clip-path="url(#body-clip)">${pattern}</g>${front}${top}<g transform="translate(${d.faceX} ${d.faceY})">${cheeks}${eye(d.leftEye)}${eye(d.rightEye)}<g transform="translate(0 ${d.mouthY})" fill="none" stroke="${d.eyeColor}" stroke-width="6" stroke-linecap="round">${mouth}</g>${glasses}</g></g></svg>`;
}
export const avatarDataURL = (config, options) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(renderAvatarSVG(config, options));
export function describeAvatar(input) {
  const d = normalizeAvatar(input);
  return `${STYLES[d.style]} ${SHAPES[d.shape].toLowerCase()} character; body ${d.bodyColor}, secondary color ${d.secondaryColor}, eyes ${d.eyeColor}. Proportions ${d.width} by ${d.height}, tilt ${d.rotation} degrees. Left eye: ${EYES[d.leftEye.style]}, ${d.leftEye.width} × ${d.leftEye.height}, angle ${d.leftEye.rotation}. Right eye: ${EYES[d.rightEye.style]}, ${d.rightEye.width} × ${d.rightEye.height}, angle ${d.rightEye.rotation}. Mouth: ${MOUTHS[d.mouth]}. Surface: ${PATTERNS[d.pattern]}. Headwear: ${HEADWEAR[d.headwear]}. Glasses: ${GLASSES[d.glasses]}. ${d.parts.length} additional body pieces. Background: ${BACKGROUNDS[d.background]}${d.background === "transparent" ? "" : ` (${d.backgroundColor}${d.background === "gradient" ? " to " + d.backgroundEnd : ""})`}. Use avatar.svg or avatar.png as the exact visual reference; avatar-design.json preserves the editable construction.`;
}
