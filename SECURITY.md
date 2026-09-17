# Security

## Report a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/silentobelisk/identity-studio/security/advisories/new). Include the affected version, reproduction steps, and likely impact. Please keep exploit details and private identity files out of public issues.

Security fixes are shipped in the latest release. Use **2.1.1 or newer**; older downloads do not include the September 2026 hardening changes. Use a maintained Node.js release and browser with their current security updates.

## Security model

- The app is a static, local identity editor. It has no login, backend database, server-side uploads, AI API integration, or third-party runtime dependencies.
- The bundled server listens only on `127.0.0.1`. It accepts local Host headers and GET/HEAD requests, serves only recognized static files, and resolves paths to prevent symlinks from exposing files outside `dist/`.
- Imported JSON is size-limited and copied into a bounded, explicit schema. Avatar markup is generated from constrained values; identity text is escaped before appearing in HTML.
- Image uploads are limited to 10 MB. Embedded avatar data is limited to 1.6 million characters; raster headers are checked before rendering. Both paths limit image dimensions to 50 million pixels and 16,384 pixels per side. The browser remains responsible for complete image decoding and malformed-media handling.
- The app's Content Security Policy restricts scripts and fonts to the same origin and blocks outbound connection APIs, embedded documents, plugins, evaluated/inline JavaScript, and form submissions. Inline styles remain necessary for editable colors and geometry.
- The bundled server also sends framing, content-type, referrer, and cross-origin resource protections. The HTML carries the core CSP for static hosts; hosting-specific response headers must be configured separately.

## Keep identities private

Drafts live in this browser's `localStorage`; they are not encrypted or synchronized. Downloaded kits contain the identity and working context in plain text. Avoid putting passwords, API keys, or sensitive customer information in an identity. Browser extensions and other users of the same browser profile may be able to read drafts.

Review identity files from other people before importing them or giving them to a coding agent. A kit's written instructions do not grant access or override your approval rules. This app does not enforce permissions in the employee you build later.

See the [security review](docs/SECURITY-REVIEW.md) for scope, checks, findings, and limitations.
