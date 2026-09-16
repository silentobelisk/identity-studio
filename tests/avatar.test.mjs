import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAvatar,
  DEFAULT_AVATAR,
  randomizeAvatar,
  renderAvatarSVG,
  applyExpression,
  AppearanceHistory,
  SHAPES,
  STYLES,
} from "../dist/avatar.js";
import { normalizeIdentity, createKitFiles } from "../dist/identity.js";

test("new identities use editable construction, without changing older saved artwork", () => {
  assert.equal(normalizeIdentity().avatarMode, "builder");
  const old = normalizeIdentity({
    version: 1,
    collection: "portraits",
    avatar: 3,
    name: "Ada",
  });
  assert.equal(old.version, 2);
  assert.equal(old.avatarMode, "legacy");
  assert.equal(old.avatar, 3);
  assert.equal(old.name, "Ada");
  assert.equal(normalizeIdentity(old).avatarMode, "legacy");
  const upload = normalizeIdentity({
    version: 1,
    collection: "characters",
    customAvatar: "data:image/png;base64,YWJj",
  });
  assert.equal(upload.avatarMode, "upload");
  assert.equal(upload.customAvatar, "data:image/png;base64,YWJj");
});
test("unsafe and oversized avatar designs are bounded before rendering", () => {
  const d = normalizeAvatar({
    shape: "__proto__",
    style: "<script>",
    bodyColor: 'red" onload="x',
    width: Infinity,
    height: 5000,
    leftEye: { rotation: -200, width: NaN },
    parts: Array.from({ length: 80 }, () => ({
      shape: "bad",
      x: 999,
      color: "url(https://evil.test)",
    })),
    contour: Array(12).fill(900),
  });
  assert.equal(d.shape, "squircle");
  assert.equal(d.bodyColor, DEFAULT_AVATAR.bodyColor);
  assert.equal(d.height, 320);
  assert.equal(d.leftEye.rotation, -60);
  assert.equal(d.parts.length, 8);
  assert.equal(d.parts[0].x, 170);
  assert.equal(d.contour[0], 1.15);
  const svg = renderAvatarSVG(d);
  assert.doesNotMatch(svg, /<script|onload|https:\/\/evil|NaN|Infinity/);
});
test("arbitrary colors, independent eyes and all pieces survive the full kit round trip", () => {
  const identity = normalizeIdentity({
    avatarMode: "builder",
    accent: "#123abc",
    avatarResolution: 2048,
    avatarDesign: {
      shape: "sculpt",
      contour: [0.6, 0.7, 0.8, 0.9, 1, 1.1, 0.7, 0.8, 1, 0.8, 0.9, 1],
      style: "sticker",
      bodyColor: "#ff0088",
      background: "gradient",
      leftEye: { style: "cross", width: 36, height: 26, rotation: 25 },
      rightEye: { style: "happy", width: 16, height: 43, rotation: -12 },
      parts: [
        {
          shape: "capsule",
          width: 40,
          height: 105,
          x: -120,
          y: -70,
          color: "#abcdef",
          front: true,
          rotation: 40,
        },
      ],
    },
  });
  const files = createKitFiles(identity),
    restored = normalizeIdentity(JSON.parse(files["identity.json"]));
  assert.deepEqual(restored, identity);
  assert.deepEqual(
    JSON.parse(files["avatar-design.json"]).design,
    identity.avatarDesign,
  );
  assert.equal(
    files["avatar.svg"],
    renderAvatarSVG(identity.avatarDesign, { size: 2048 }),
  );
  assert.match(files["avatar.svg"], /width="2048"/);
  assert.match(files["START-HERE.md"], /2048 × 2048/);
});
test("rendering is deterministic and each shape/style generates finite standalone artwork", () => {
  for (const shape of Object.keys(SHAPES))
    for (const style of Object.keys(STYLES)) {
      const config = normalizeAvatar({ shape, style });
      const svg = renderAvatarSVG(config);
      assert.equal(svg, renderAvatarSVG(config));
      assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
      assert.match(svg, /<svg xmlns=/);
      assert.match(svg, /<\/svg>$/);
    }
});
test("exploring creates varied designs and respects category locks", () => {
  const d = normalizeAvatar();
  assert.deepEqual(
    randomizeAvatar(d, ["body", "face", "colors", "extras"], 42),
    d,
  );
  const faceLocked = randomizeAvatar(d, ["face"], 7);
  assert.deepEqual(faceLocked.leftEye, d.leftEye);
  assert.deepEqual(faceLocked.rightEye, d.rightEye);
  assert.equal(faceLocked.mouth, d.mouth);
  assert.equal(
    new Set(
      Array.from({ length: 30 }, (_, i) =>
        JSON.stringify(randomizeAvatar(d, [], i)),
      ),
    ).size,
    30,
  );
  assert.deepEqual(randomizeAvatar(d, [], 42), randomizeAvatar(d, [], 42));
});
test("locked body pieces retain their rendered geometry when the main body changes", () => {
  const d = normalizeAvatar({
    parts: [
      {
        shape: "squircle",
        x: -100,
        y: 0,
        width: 80,
        height: 60,
        rotation: 0,
        roundness: 45,
        asymmetry: 10,
      },
    ],
  });
  const varied = randomizeAvatar(d, ["face", "colors", "extras"], 12);
  const piecePath = (svg) =>
    svg.match(/translate\(-100 0\) rotate\(0\)"><path d="([^"]+)"/)[1];
  assert.equal(
    piecePath(renderAvatarSVG(d)),
    piecePath(renderAvatarSVG(varied)),
  );
});
test("cancelled appearance transactions restore the original without adding history", () => {
  const history = new AppearanceHistory(),
    before = { avatarDesign: normalizeAvatar() };
  history.begin(before);
  assert.deepEqual(history.cancel(), before);
  assert.equal(history.past.length, 0);
  assert.equal(history.pending, null);
});
test("history groups slider changes, restores exact construction, and discards abandoned redo", () => {
  const history = new AppearanceHistory(3),
    a = { avatarDesign: normalizeAvatar() },
    b = { avatarDesign: normalizeAvatar({ width: 180 }) },
    c = { avatarDesign: normalizeAvatar({ width: 290 }) };
  history.begin(a);
  history.begin(b);
  history.commit(c);
  assert.equal(history.past.length, 1);
  assert.deepEqual(history.undo(c), a);
  assert.deepEqual(history.redo(a), c);
  assert.deepEqual(history.undo(c), a);
  history.begin(a);
  history.commit(b);
  assert.equal(history.future.length, 0);
  assert.deepEqual(history.undo(b), a);
});
test("expression shortcuts change facial geometry while preserving identity construction", () => {
  const d = normalizeAvatar({
    shape: "star",
    bodyColor: "#12abef",
    width: 300,
    parts: [{ shape: "orb", x: 130, y: 0, color: "#123abc" }],
  });
  const happy = applyExpression(d, "happy");
  assert.equal(happy.leftEye.style, "happy");
  assert.equal(happy.mouth, "smile");
  assert.equal(happy.bodyColor, d.bodyColor);
  assert.equal(happy.shape, d.shape);
  assert.deepEqual(happy.parts, d.parts);
});
test("transparent SVGs have no background paint and first-edition kits do not invent editable geometry", () => {
  const transparent = renderAvatarSVG(
    normalizeAvatar({ background: "transparent" }),
  );
  assert.doesNotMatch(transparent, /<rect width="512" height="512"/);
  assert.match(
    renderAvatarSVG(normalizeAvatar({ background: "solid" })),
    /<rect width="512" height="512"/,
  );
  const legacy = createKitFiles(
    normalizeIdentity({ version: 1, collection: "characters", avatar: 2 }),
  );
  assert.equal(legacy["avatar.svg"], undefined);
  assert.equal(legacy["avatar-design.json"], undefined);
});
