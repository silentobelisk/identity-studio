import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function createStudioServer(directory = resolve(import.meta.dirname, "../dist")) {
  const root = await realpath(directory);
  return createServer(async (req, res) => {
    const headers = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": `${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`,
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    };
    const reply = (status, message, extra = {}) => {
      res.writeHead(status, { ...headers, ...extra });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    // Binding to loopback alone does not reject DNS-rebinding Host headers.
    const port = req.socket.localPort;
    const hosts = [`localhost:${port}`, `127.0.0.1:${port}`];
    if (port === 80) hosts.push("localhost", "127.0.0.1");
    if (!hosts.includes(req.headers.host?.toLowerCase()))
      return reply(403, "Use the localhost URL printed by Identity Studio.");
    if (!["GET", "HEAD"].includes(req.method))
      return reply(405, "Method not allowed", { Allow: "GET, HEAD" });
    try {
      if (!req.url.startsWith("/") || req.url.startsWith("//"))
        return reply(400, "Invalid request target");
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").some((p) => p.startsWith(".")))
        return reply(404, "Not found");
      const candidate = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!candidate.startsWith(root + sep) || !Object.hasOwn(mime, extname(candidate)))
        return reply(404, "Not found");
      const file = await realpath(candidate);
      if (
        !file.startsWith(root + sep) ||
        relative(root, file).split(sep).some((p) => p.startsWith(".")) ||
        !(await stat(file)).isFile()
      ) return reply(404, "Not found");
      const body = req.method === "HEAD" ? undefined : await readFile(file);
      reply(200, body, { "Content-Type": mime[extname(candidate)] });
    } catch {
      reply(404, "Not found");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer from 1 to 65535.");
  const server = await createStudioServer();
  server.listen(port, "127.0.0.1", () =>
    console.log(`Identity Studio is ready at http://localhost:${port}`),
  );
}
