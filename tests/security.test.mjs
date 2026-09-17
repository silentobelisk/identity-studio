import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request } from "node:http";
import { once } from "node:events";
import { createStudioServer, CONTENT_SECURITY_POLICY } from "../scripts/serve.mjs";
import { validateRasterImage, isSafeAvatarDataURL } from "../dist/image-validation.js";
import { normalizeIdentity, createKitFiles } from "../dist/identity.js";
import { renderBuilderStage, renderInspector, setPath } from "../dist/avatar-editor.js";
import { AppearanceHistory } from "../dist/avatar.js";
import { PNG_DATA_URL } from "./fixtures.mjs";

const png = Buffer.from(PNG_DATA_URL.split(",")[1], "base64");

test("embedded images require a raster signature, valid dimensions, and bounded data", () => {
  assert.equal(isSafeAvatarDataURL(PNG_DATA_URL), true);
  const huge = Buffer.from(png);
  huge.writeUInt32BE(10000, 16);
  huge.writeUInt32BE(6000, 20);
  for (const value of [
    "https://example.invalid/tracker.png",
    "data:image/svg+xml;base64," + Buffer.from('<svg onload="alert(1)"/>').toString("base64"),
    "data:image/png;base64," + Buffer.from('<svg onload="alert(1)"/>').toString("base64"),
    "data:image/png;base64," + huge.toString("base64"),
    "data:image/jpeg;base64," + png.toString("base64"),
    "data:image/png;base64,abc===",
    "data:image/png;base64," + "A".repeat(1600000),
  ]) {
    assert.equal(isSafeAvatarDataURL(value), false);
    const restored = normalizeIdentity({ avatarMode: "upload", customAvatar: value });
    assert.equal(restored.customAvatar, "");
    assert.equal(restored.avatarMode, "builder");
  }
  assert.throws(() => validateRasterImage(huge, "image/png"), /50 megapixels/);
  const zero = Buffer.from(png);
  zero.writeUInt32BE(0, 16);
  assert.throws(() => validateRasterImage(zero, "image/png"), /invalid dimensions/);
});

test("real PNG/JPEG assets and all three WebP header layouts retain their dimensions", async () => {
  assert.deepEqual(validateRasterImage(png, "image/png"), { width: 2, height: 2 });
  const logo = await readFile(new URL("../dist/assets/ai-employee-lab.jpg", import.meta.url));
  assert.deepEqual(validateRasterImage(logo, "image/jpeg"), { width: 128, height: 128 });
  const sheet = await readFile(new URL("../dist/assets/characters.png", import.meta.url));
  assert.deepEqual(validateRasterImage(sheet, "image/png"), { width: sheet.readUInt32BE(16), height: sheet.readUInt32BE(20) });
  const lossy = Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "base64");
  assert.deepEqual(validateRasterImage(lossy, "image/webp"), { width: 1, height: 1 });
  for (const kind of ["VP8L", "VP8X"]) {
    const header = Buffer.alloc(30);
    header.write("RIFF", 0); header.writeUInt32LE(22, 4);
    header.write("WEBP" + kind, 8); header.writeUInt32LE(kind === "VP8X" ? 10 : 5, 16);
    if (kind === "VP8L") {
      header[20] = 0x2f;
      header.writeUInt32LE(639 | (479 << 14), 21);
    } else {
      header.writeUIntLE(639, 24, 3); header.writeUIntLE(479, 27, 3);
    }
    assert.deepEqual(validateRasterImage(header, "image/webp"), { width: 640, height: 480 });
  }
  for (const type of ["image/png", "image/jpeg", "image/webp"])
    for (const bytes of [Buffer.alloc(0), Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]), Buffer.from("not an image")])
      assert.throws(() => validateRasterImage(bytes, type), /valid PNG/);
});

test("hostile identity text and prototype keys cannot create HTML or alter shared objects", () => {
  const d = normalizeIdentity(JSON.parse('{"name":"<img src=x onerror=alert(1)>","__proto__":{"polluted":true},"avatarDesign":{"__proto__":{"polluted":true},"bodyColor":"red; background:url(https://example.invalid)","parts":[{"shape":"__proto__","color":"\\\" onload=alert(1)"}]}}'));
  const ui = { panel: "body", selectedPart: -1, eyeSide: "leftEye", locks: new Set() };
  const html = renderBuilderStage(d, ui, new AppearanceHistory()) + renderInspector(d, ui);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x|background:url\(https|color="" onload/);
  assert.equal({}.polluted, undefined);
  for (const path of ["__proto__.polluted", "constructor.prototype.polluted", "leftEye.__proto__.polluted"])
    setPath(d.avatarDesign, path, true);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(Object.keys(createKitFiles(d)).sort(), ["START-HERE.md", "IDENTITY.md", "BRAIN.md", "VOICE.md", "avatar-prompt.md", "identity.json", "avatar.svg", "avatar-design.json"].sort());
});

test("the local server enforces its filesystem and browser security boundaries", async (t) => {
  const folder = await mkdtemp(join(tmpdir(), "identity-security-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const root = join(folder, "dist");
  await mkdir(join(root, ".private"), { recursive: true });
  await writeFile(join(root, "index.html"), "<!doctype html><title>Fixture</title>");
  await writeFile(join(root, "app.js"), "export const ok = true;");
  await writeFile(join(root, ".env"), "fixture-secret");
  await writeFile(join(root, ".private", "note.txt"), "fixture-secret");
  await writeFile(join(folder, "outside.txt"), "fixture-outside");
  let symlinksAvailable = true;
  try {
    await symlink(join(folder, "outside.txt"), join(root, "escape.txt"));
    await symlink(folder, join(root, "escape-dir"), "dir");
    await symlink(join(root, ".private", "note.txt"), join(root, "hidden-alias.txt"));
  } catch (error) {
    if (process.platform !== "win32" || !["EPERM", "EACCES"].includes(error.code)) throw error;
    symlinksAvailable = false;
  }
  const server = await createStudioServer(root);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  const get = (path, options = {}) => new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, ...options }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject); req.end();
  });
  try {
    await t.test("ordinary GET and HEAD still work with security headers", async () => {
      for (const host of [`localhost:${port}`, `127.0.0.1:${port}`]) {
        const res = await get("/", { headers: { Host: host } });
        assert.equal(res.status, 200);
        assert.match(res.body, /Fixture/);
        assert.equal(res.headers["content-security-policy"], CONTENT_SECURITY_POLICY + "; frame-ancestors 'none'");
        assert.equal(res.headers["x-frame-options"], "DENY");
        assert.equal(res.headers["cross-origin-resource-policy"], "same-origin");
        assert.equal(res.headers["x-content-type-options"], "nosniff");
      }
      const head = await get("/app.js", { method: "HEAD" });
      assert.equal(head.status, 200); assert.equal(head.body, "");
      assert.match(head.headers["content-type"], /javascript/);
    });
    await t.test("traversal and dotfiles cannot expose outside or hidden files", async () => {
      for (const path of ["/.env", "/%2eprivate/note.txt", "/../outside.txt", "/%2e%2e%2foutside.txt", "/..%5coutside.txt", "/%00", "/%zz", "/.private/note.txt"]) {
        const res = await get(path);
        assert.equal(res.status, 404, path);
        assert.doesNotMatch(res.body, /fixture-secret|fixture-outside/);
      }
    });
    await t.test("symlinks cannot expose outside or hidden files", { skip: !symlinksAvailable && "Windows requires permission to create symlink fixtures" }, async () => {
      for (const path of ["/escape.txt", "/escape-dir/outside.txt", "/hidden-alias.txt"]) {
        const res = await get(path);
        assert.equal(res.status, 404, path);
        assert.doesNotMatch(res.body, /fixture-secret|fixture-outside/);
      }
    });
    await t.test("non-loopback Host headers and write requests are rejected", async () => {
      for (const host of [`untrusted.example:${port}`, `localhost.evil:${port}`, `127.0.0.1:${port + 1}`])
        assert.equal((await get("/", { headers: { Host: host } })).status, 403);
      for (const method of ["POST", "PUT", "DELETE", "OPTIONS"])
        assert.equal((await get("/app.js", { method })).status, 405);
      assert.equal((await get("//untrusted.example/app.js")).status, 400);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("static hosts receive the same core CSP as the local server", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.equal(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1], CONTENT_SECURITY_POLICY);
  assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf('<script '));
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self';/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /script-src[^;]*(unsafe-inline|unsafe-eval|https:|data:)/);
});
