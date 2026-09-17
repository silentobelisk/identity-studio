# Security review — September 16, 2026

Reviewed Identity Studio's tracked application source, local HTTP server, imports/uploads, rendering and export paths, browser storage, optional WebMCP mutation, static assets, packaging, repository settings, and all four commits that existed before this review. Fixes are included in version 2.1.1.

## Findings and fixes

| Finding | Impact and preconditions | Resolution |
| --- | --- | --- |
| Static-file symlinks could escape `dist/` | If a symlink was placed inside the served folder, its target outside that folder could be retrieved from the local server. Confirmed using an isolated, harmless fixture. | Resolve canonical paths before reading, require containment within `dist/`, and reject hidden paths and unsupported file types. |
| Embedded identity images bypassed upload dimension limits | An imported identity could place a highly compressed, oversized raster directly into the page, causing excessive browser memory use. This requires importing the file or an existing saved draft containing it. | Share PNG/JPEG/WebP signature and dimension checks across uploads and identity normalization, before decoding/rendering. Reject invalid imported avatars before replacing the draft. |
| Local Host headers were unrestricted | The loopback listener accepted arbitrary hostnames, weakening the boundary against DNS rebinding. The server has no write API. | Accept only `localhost` and `127.0.0.1` with the active port. Keep the listener restricted to loopback. |
| Browser containment headers were absent | A future markup-injection mistake would have fewer browser-level barriers. No executable HTML injection was found in the reviewed input paths. | Add a restrictive CSP, no-referrer policy, and local-server framing/resource protections. Inline styles remain allowed for the editor; inline/evaluated scripts do not. |

## Validation

- All **26 automated checks** pass, including original identity and export regressions, hostile markup/prototype input, image signatures/dimensions, traversal and symlink fixtures, Host restrictions, HTTP method handling, and CSP consistency.
- **10 isolated Chrome checks** pass: escaped identity text, procedural SVG display, PNG export and revalidation, ZIP creation, blocked network calls, blocked inline and evaluated scripts, working inline styles, and working dialog forms.
- **Gitleaks 8.30.1**, downloaded from its official release and checksum-verified, found no secrets in the pre-review Git history. The final committed source and packaged download are scanned again before publishing.
- No credential-like file paths were found in Git history. The tracked hosting project identifier is an identifier, not a source credential. Download archives omit that project-specific configuration.
- GitHub secret scanning and push protection are enabled; the secret-scanning alert list was empty. Private vulnerability reporting is enabled and documented in `SECURITY.md`.
- There are no third-party runtime/development packages, lockfiles, executable Git hooks, submodules, or Actions workflows in this repository. Dependabot alerts are not enabled, so no Dependabot result is claimed.

## Limits

This is a source review and targeted regression/security testing, not a guarantee against every vulnerability. It does not audit Node.js, browser engines/extensions, image codecs, GitHub, or the hosting provider. No dependency audit result is claimed for these external runtimes.

The local server assumes its on-disk source tree is controlled by the user; it is not designed to resist a malicious local process racing filesystem changes. Header checks bound advertised raster dimensions; the browser still validates the complete media stream. Animation processing, malformed codec internals, full cross-browser testing, and the experimental WebMCP integration are outside the validated scope.

Existing hosted deployments are not changed by a GitHub commit. The HTML CSP travels with the source; `frame-ancestors`, `X-Frame-Options`, and other HTTP headers require host configuration. Browser drafts and downloaded kits remain unencrypted, and instructions exported for another AI system must be reviewed before use.

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) and [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors): directive behavior and header-only framing protection.
- [Node.js debugging security](https://nodejs.org/en/learn/getting-started/debugging): Host checks as an additional defense against DNS rebinding.
- [PNG specification](https://www.w3.org/TR/png-3/), [JPEG T.81](https://www.w3.org/Graphics/JPEG/itu-t81.pdf), and [WebP container specification](https://developers.google.com/speed/webp/docs/riff_container): raster header layouts.
- [Gitleaks v8.30.1](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1): secret-scanning tool and official release checksums.
