# Design direction

Identity Studio is a working surface for AI Employee Lab members. Its visual direction comes from the community’s About imagery and classroom module covers: bold condensed black headlines, white backgrounds, pink-red edge glows, compact typewritten labels, and the lab flask mark. The activity opens immediately, with no marketing page before the editor.

- **Brand:** Identity Studio is presented as an AI Employee Lab tool. The community’s existing flask logo appears in the header, favicon, and identity card.
- **Palette:** white and neutral gray surfaces, near-black text, a pink-red accent (`#cc3154`), darker interaction text (`#ae2343`), and pale rose selection surfaces. Avatar colors remain entirely member-controlled.
- **Typography:** locally bundled Anton for condensed uppercase headings and names, DM Sans for readable controls and longer text, and system monospace for small lab labels. Anton follows the cover typography; it is an implementation choice, not a claimed source font identification.
- **Avatar studio:** a light dotted canvas with pink glows at opposite corners echoes the module covers. A dedicated inspector retains all body, face, style, and detail controls. Original procedural SVG renders the member’s editable construction.
- **Customization:** shape and expression choices are starting points, with continuous size, position, rotation, and color controls. Locked exploration preserves selected design groups.
- **Portability:** preview, SVG, and raster export share one renderer. Both the standalone avatar design and the full identity profile retain the construction. Original format identifiers and draft keys remain stable across the rename.
- **Identity card:** the member’s chosen card color, an uppercase name, and a small lab mark create a consistent employee badge.
- **Motion:** a short arrival transition; reduced-motion preferences are respected.
- **Flow:** appearance → name → personality and voice → brain → portable identity kit.

## References

- [AI Employee Lab About](https://www.skool.com/aiemployeelab/about) and [Classroom](https://www.skool.com/aiemployeelab/classroom): inspected the live pages on September 16, 2026. The Learn Claude Code, Claude Code Skills, AI Employee Templates, and H.I.R.E.D. Sales System covers establish the shared visual direction. The surrounding dark Skool interface is platform chrome; the covers supply Identity Studio’s white, black, and pink-red brand language.
- [Community logo asset](https://assets.skool.com/f/6f13fdb6015046f0967c82a5e1cf1898/3bfbc1c30d7546d29ea2095ea8cae5eaf2adf923ab6246d587a6af481e82f1a5.jpg): locally bundled without modification as `ai-employee-lab.jpg`.
- [Anton font source](https://github.com/google/fonts/tree/main/ofl/anton): SIL Open Font License, bundled in `ANTON-OFL.txt`.

- Kyle’s brief: OpenAI desktop subagent icons, Grokbot, and simple AI teammate identities.
- [Bible Strong Avatar Lab](https://avatars.bible-strong.app) and its [repository](https://github.com/smontlouis/bible-strong-avatar-lab): reviewed the local editor, data model, rendering, and interaction design. The important lesson was authoring a character through independently adjustable geometry and facial features. Identity Studio applies that approach with its own 2D SVG renderer, body pieces, contour sculpting, and independent eyes. No source or artwork was copied; this is not a port of its 3D controls or animation system.
- [Clay robot imagery on Pinterest](https://ro.pinterest.com/dianakovacs7330/clay-robots/): discovery reference for tactile character direction, not a source for shipped artwork.

The first-edition avatar sheets were generated specifically for this project. Their prompt briefs are preserved in [avatar-prompts.json](avatar-prompts.json). Those sheets remain only to preserve earlier identity files; the main studio now creates characters from editable data.

## Product boundary

The studio creates an identity. It does not claim to create an operational AI employee. The “brain” is plain-language guidance for a later implementation, and voice samples are deterministic templates. No runtime language model integration is implied.

## Repository presentation

The GitHub cover carries the same white, black, and pink-red palette, condensed headline, and geometric character direction. A separate screenshot shows the actual editor. The cover, social preview, and generation prompt are kept in [docs/images](images/README.md). The README prioritizes the release download and local setup; detailed usage and development notes have their own guides.
