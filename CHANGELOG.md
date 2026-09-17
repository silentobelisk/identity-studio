# Release notes

## 2.1.1 — Security hardening · 2026-09-16

- Prevent local static-file symlinks from exposing files outside `dist/`; reject hidden paths, unexpected Host headers, and unsupported file types.
- Validate PNG/JPEG/WebP signatures and dimensions before decoding uploads or rendering embedded identity images. Unsupported or oversized embedded avatars no longer replace the current draft.
- Add browser Content Security Policy and local-server response headers while preserving avatar editing and exports.
- Add security regression coverage and private vulnerability reporting. All 26 automated checks and 10 isolated Chrome checks pass; see the [security review](docs/SECURITY-REVIEW.md).

## 2.1.0 — Identity Studio · 2026-09-16

Identity Studio brings AI Employee Lab's visual identity to the avatar and employee identity workspace.

- White surfaces, pink-red accents, condensed headlines, local fonts, and the lab mark.
- Editable avatars with sculptable contours, independent eyes, body pieces, accessories, and four rendering styles.
- A five-step path through appearance, name, personality, brain, and the downloadable identity kit.
- PNG and SVG exports, portable identity JSON, and editable avatar designs.
- A branded repository cover, real studio screenshot, user guide, and direct release download.

This is the first packaged GitHub release. It includes the existing avatar editor and branding work, plus the repository presentation refresh.

### Compatibility

Earlier Taste Vault drafts and identity files remain supported. Storage keys and format identifiers are unchanged. The repository is now `silentobelisk/identity-studio`.

### Requirements and validation

Node.js 22 or newer, plus a modern browser. No account, API key, or dependency installation is required. All 17 automated regression checks pass. See [validation notes](docs/VALIDATION.md) for browser coverage and remaining testing limits.
