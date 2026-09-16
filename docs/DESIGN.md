# Design direction

An editorial workshop for making an AI employee feel like a familiar teammate. The activity opens immediately; there is no marketing page between the user and their identity.

- **Signature object:** a gently tilted, color-customizable employee ID card that reflects every choice.
- **Palette:** warm paper, ink, olive, and a crisp citron accent. The user can change the identity card accent without changing the interface.
- **Typography:** Instrument Serif for expressive moments, DM Sans for controls. Font files are bundled so the app runs without a CDN.
- **Avatar studio:** a dark drawing surface with a dedicated inspector. Original procedural SVG creates the artwork from editable data. Members can combine shapes, sculpt a contour, build extra pieces, and adjust facial features independently.
- **Customization:** body, face, style, and details have their own controls. Expression shortcuts and shape choices are starting points, with continuous size, position, rotation, and color controls. Locked exploration preserves selected design groups.
- **Portability:** preview, SVG, and raster export share one renderer. Both the standalone avatar design and the full identity profile retain the construction, so exports can be reopened and edited.
- **Motion:** a short arrival transition; reduced-motion preferences are respected.
- **Flow:** appearance → name → personality and voice → brain → portable identity kit.

## References

- Kyle’s brief: OpenAI desktop subagent icons, Grokbot, and simple AI teammate identities.
- [Bible Strong Avatar Lab](https://avatars.bible-strong.app) and its [repository](https://github.com/smontlouis/bible-strong-avatar-lab): reviewed the local editor, data model, rendering, and interaction design. The important lesson was authoring a character through independently adjustable geometry and facial features. Taste Vault applies that approach with its own 2D SVG renderer, body pieces, contour sculpting, and independent eyes. No source or artwork was copied; this is not a port of its 3D controls or animation system.
- [Clay robot imagery on Pinterest](https://ro.pinterest.com/dianakovacs7330/clay-robots/): discovery reference for tactile character direction, not a source for shipped artwork.

The first-edition avatar sheets were generated specifically for this project. Their prompt briefs are preserved in [avatar-prompts.json](avatar-prompts.json). Those sheets remain only to preserve earlier identity files; the main studio now creates characters from editable data.

## Product boundary

The studio creates an identity. It does not claim to create an operational AI employee. The “brain” is plain-language guidance for a later implementation, and voice samples are deterministic templates. No runtime language model integration is implied.
