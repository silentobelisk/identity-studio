# Validation

## Automated checks

`npm test` checks JavaScript syntax and runs seven regression checks:

- Imported settings are bounded and unknown values are rejected.
- Missing required identity fields prevent export with actionable errors.
- JSON export/import preserves user-authored text, choices, and uploaded avatar data.
- Voice settings produce a different sample and appear in the exported guidance.
- Download filenames cannot contain paths and support a non-Latin fallback.
- A standard system unzip validates archive integrity, Unicode text, and binary entries.
- Local HTML/CSS assets and square, evenly divisible avatar sheets are present.

The local HTTP server returned 200 and the studio was opened successfully in the browser. A read-only source review covered user-input escaping, upload/import handling, reset cancellation, export behavior, and supporting text contrast. The reset dialog clears its return value before opening so Escape cannot repeat a previous confirmation.

## Limits

Full browser interaction, screen-reader, mobile-device, and visual screenshot testing have not been performed. The optional WebMCP registration and execution require a supported browser context; that capability was not available for verification in this build. It does not affect the standard UI.

The ZIP test validates binary entry integrity using a small fixture; image decoding, canvas rasterization, and actual browser downloads still merit manual cross-browser checking before a wide course launch.

## Suggested manual release check

Complete all five steps, download and unzip a kit, then import its identity.json. Repeat with a custom avatar. Check keyboard navigation, range controls, empty required fields, and reset cancellation. Verify the layout at narrow widths and 200% zoom. Test with browser storage and clipboard access blocked to confirm that fallback messages remain useful.
