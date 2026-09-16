# Design direction

An editorial workshop for making an AI employee feel like a familiar teammate. The activity opens immediately; there is no marketing page between the user and their identity.

- **Signature object:** a gently tilted, color-customizable employee ID card that reflects every choice.
- **Palette:** warm paper, ink, olive, and a crisp citron accent. The user can change the identity card accent without changing the interface.
- **Typography:** Instrument Serif for expressive moments, DM Sans for controls. Font files are bundled so the app runs without a CDN.
- **Avatars:** 12 original generated assets in three 2×2 sprite sheets. Characters favor simple silhouettes and expressive eyes. Objects provide a more abstract identity. Portraits offer fictional adult faces.
- **Motion:** a short arrival transition; reduced-motion preferences are respected.
- **Flow:** appearance → name → personality and voice → brain → portable identity kit.

## References

- Kyle’s brief: OpenAI desktop subagent icons, Grokbot, and simple AI teammate identities.
- [Bible Strong Avatar Lab](https://avatars.bible-strong.app) and its [repository](https://github.com/smontlouis/bible-strong-avatar-lab): reviewed the local reference and character ensemble. Transferable ideas were clear silhouettes, minimal expressive faces, and a consistent employee color. Its bundled document includes an avatar named “Grok bot.” No source or artwork was copied.
- [Clay robot imagery on Pinterest](https://ro.pinterest.com/dianakovacs7330/clay-robots/): discovery reference for tactile character direction, not a source for shipped artwork.

The avatar sheets were generated specifically for this project. Prompt briefs are preserved in [avatar-prompts.json](avatar-prompts.json). Their transparent backgrounds let the same asset work on the selection tiles, employee card, small workspace badge, and exported profile picture.

## Product boundary

The studio creates an identity. It does not claim to create an operational AI employee. The “brain” is plain-language guidance for a later implementation, and voice samples are deterministic templates. No runtime language model integration is implied.
