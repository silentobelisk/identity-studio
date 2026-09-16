import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  normalizeIdentity,
  createKitFiles,
  zipFiles,
  validateIdentity,
  voiceSample,
  safeSlug,
} from "../dist/identity.js";

test("untrusted imported settings are bounded without altering defaults", () => {
  const d = normalizeIdentity({
    name: "A".repeat(100),
    collection: "__proto__",
    avatar: -1,
    warmth: 150,
    detail: -40,
    energy: Infinity,
    traits: ["Curious", "Curious", "unknown"],
    customAvatar: 'data:image/svg+xml,<svg onload="alert(1)">',
  });
  assert.equal(d.name.length, 40);
  assert.equal(d.collection, "characters");
  assert.equal(d.avatar, 0);
  assert.equal(d.warmth, 100);
  assert.equal(d.detail, 0);
  assert.equal(d.energy, 45);
  assert.deepEqual(d.traits, ["Curious"]);
  assert.equal(d.customAvatar, "");
  d.traits.push("Bold");
  assert.deepEqual(normalizeIdentity().traits, [
    "Curious",
    "Thoughtful",
    "Resourceful",
  ]);
});

test("missing required identity details are actionable and block export", () => {
  const d = normalizeIdentity({ name: " ", role: "", purpose: "", traits: [] });
  assert.deepEqual(
    validateIdentity(d).map((e) => e.step),
    [1, 1, 2, 3],
  );
  assert.throws(() => createKitFiles(d), /name/);
});

test("an uploaded avatar and authored identity survive JSON export and reimport", () => {
  const d = normalizeIdentity({
    name: "Amélie",
    role: "Research partner",
    customAvatar: "data:image/png;base64,aGVsbG8=",
    accent: "#e8bfce",
    purpose: "Help my team decide what to read.",
    traits: ["Candid", "Curious"],
    principles: "Name the evidence.\nExplain uncertainty.",
    boundaries: "Ask before sharing notes.",
  });
  const files = createKitFiles(d),
    restored = normalizeIdentity(JSON.parse(files["identity.json"]));
  assert.deepEqual(restored, d);
  assert.match(files["BRAIN.md"], /Name the evidence/);
  assert.match(files["BRAIN.md"], /Ask before sharing notes/);
  assert.match(files["IDENTITY.md"], /Amélie/);
  assert.match(files["START-HERE.md"], /does not configure tools/);
});

test("voice controls change the sample and are documented in the kit", () => {
  const calm = normalizeIdentity({ warmth: 0, detail: 0, energy: 0 });
  const bright = normalizeIdentity({
    warmth: 100,
    detail: 100,
    energy: 100,
    traits: ["Playful"],
  });
  assert.notEqual(voiceSample(calm), voiceSample(bright));
  assert.match(voiceSample(bright), /Half-baked ideas welcome/);
  assert.match(createKitFiles(bright)["VOICE.md"], /Warmth: 100\/100/);
});

test("download filenames cannot escape a folder and have non-Latin fallbacks", () => {
  assert.equal(safeSlug("../../Amélie <script>"), "amelie-script");
  assert.equal(safeSlug("助理"), "my-employee");
});

test("ZIP is readable by a standard unzip tool with intact Unicode and binary entries", async (t) => {
  if (spawnSync("unzip", ["-v"]).error)
    return t.skip("System unzip is unavailable");
  const folder = await mkdtemp(join(tmpdir(), "taste-vault-test-"));
  try {
    const d = normalizeIdentity({ name: "Amélie" }),
      files = createKitFiles(d),
      binary = Uint8Array.from([137, 80, 78, 71, 0, 1, 255, 128]);
    files["avatar.png"] = binary;
    const archive = join(folder, "kit.zip");
    await writeFile(archive, Buffer.from(await zipFiles(files).arrayBuffer()));
    const integrity = spawnSync("unzip", ["-t", archive], { encoding: "utf8" });
    assert.equal(integrity.status, 0, integrity.stdout + integrity.stderr);
    const identity = spawnSync("unzip", ["-p", archive, "identity.json"], {
      encoding: "utf8",
    });
    assert.equal(JSON.parse(identity.stdout).name, "Amélie");
    assert.deepEqual(
      spawnSync("unzip", ["-p", archive, "avatar.png"]).stdout,
      Buffer.from(binary),
    );
    assert.equal(Object.keys(files).length, 9);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("all static HTML, CSS, and avatar asset references exist", async () => {
  const root = new URL("../dist/", import.meta.url);
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("styles.css", root), "utf8");
  const paths = [
    ...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g),
    ...css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g),
  ].map((m) => m[1]);
  for (const path of paths)
    assert.ok((await readFile(new URL(path.slice(1), root))).length, path);
  for (const collection of ["characters", "objects", "portraits"]) {
    const png = await readFile(new URL(`assets/${collection}.png`, root));
    assert.equal(
      png.readUInt32BE(16),
      png.readUInt32BE(20),
      "Avatar sheets must be square for 2×2 slicing",
    );
    assert.equal(
      png.readUInt32BE(16) % 2,
      0,
      "Each quadrant must have an integer pixel size",
    );
  }
});
