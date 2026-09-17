# Validation

## Automated checks

`npm test` checks JavaScript syntax and runs 17 regression checks covering:

- Bounded identity and avatar imports, invalid inputs, required identity fields, and safe filenames.
- Complete identity round trips, including arbitrary colors, independent eyes, body pieces, contour data, export resolution, and uploaded pictures.
- Migration of first-edition gallery identities without changing their selected artwork.
- Deterministic, finite SVG rendering across all 12 body shapes and four rendering styles.
- Seeded exploration, locks, and preservation of locked body-piece geometry.
- Grouped appearance undo/redo, cancellation restoration, and expression changes that preserve body construction.
- Transparent backgrounds and consistency between the editable design and exported SVG.
- Tone guidance, portable ZIP integrity with system unzip, Unicode text, binary entries, and local assets.

## Browser checks

In desktop Chrome, verified adding a body piece, moving it with arrow keys, and undoing both operations. Changed one eye’s height while confirming the other eye remained unchanged, then restored the draft. Downloaded a PNG through the interface and verified it was 1024 × 1024 with an alpha channel. Downloaded the full identity kit, checked all nine entries and archive integrity, verified its PNG dimensions, and confirmed the avatar design exactly matches the profile’s construction. Inspected the studio layout and confirmed the editor loads from the local HTTP server.

A separate source review found no remaining blockers in editor state handling, normalized designs, or PNG/SVG export paths. Existing import, upload, escaping, and reset handling were also reviewed during the first build.

## Branding update

Identity Studio uses the community logo and a bundled Anton font. The original storage key and avatar-design type are retained to preserve existing drafts and imports. The established 17-test suite remains the regression check for this visual update.

## Limits

Full cross-browser, screen-reader, mobile-device, and 200% zoom testing has not been performed. The optional WebMCP registration and execution require a supported browser context and have not been verified. That capability does not affect the standard UI.

Automated tests verify JSON round trips, and the actual browser PNG and full-kit downloads were inspected separately. Reimport through the file picker still merits a manual release check before a wide course launch.

## Suggested manual release check

Create a sculpted character with extra pieces, distinct eyes, and a transparent background. Finish all five steps, download and unzip a kit, then import its identity.json. Reopen avatar-design.json independently and verify continued editing. Repeat with an uploaded picture. Check touch dragging, keyboard navigation, range controls, empty required fields, reset cancellation, and narrow layouts. Test with browser storage and clipboard access blocked to confirm useful fallback messages.

## Repository presentation and download package

On September 16, 2026, checked the README banner and actual studio screenshot, verified relative documentation and image links, and built the release ZIP from the committed source. The ZIP passes archive integrity checks and all 17 regression tests after extraction, with no dependency installation. The package omits this repository's project-specific `.openai` hosting configuration.
