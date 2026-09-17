# Using Identity Studio

[← Back to the README](../README.md)

## Inside the studio

1. **The look** — Create a character in the avatar studio. Sculpt a silhouette, assemble body pieces, adjust each eye, and choose your colors, rendering style, patterns, and accessories. You can also upload your own PNG, JPEG, or WebP, cropped to a centered square.
2. **The name** — Set a name, role, and optional pronouns.
3. **The personality** — Choose up to five traits and adjust warmth, detail, and energy. A template-based introduction previews the tone.
4. **The brain** — Describe purpose, working context, principles, and boundaries.
5. **The identity kit** — Download everything as a ZIP. Copy the brain or avatar prompt separately if useful.

The live ID card follows your choices. You can revisit any step.

## Make it your own

- **Body:** start with a geometric or organic shape, change its proportions, or drag the 12 contour handles in **Sculpt your own**. Add up to eight pieces for ears, limbs, or your own construction; position, size, rotate, recolor, duplicate, and layer each piece.
- **Face:** edit either eye’s shape, width, height, angle, and position independently. Link the eyes for mirrored editing, move the whole face, and adjust the mouth and blush.
- **Style:** switch between soft volume, flat graphic, sticker, and pixel treatments. Use any hex colors, patterns, and transparent, solid, gradient, or circular backgrounds.
- **Details:** add glasses, antennae, sprouts, horns, crowns, or a beanie. Build other details from pieces.
- **Explore:** create new combinations while keeping your chosen body, face, style/colors, or extra pieces locked. Undo and redo appearance edits. Canvas handles also support arrow keys; hold Shift for larger steps.
- **Keep editing:** save and reopen the avatar design, or carry it with the full identity kit. Export PNG at 512, 1024, or 2048 pixels and SVG for scalable artwork.

Shapes and expression shortcuts are editable starting points. The studio renders your construction immediately in the browser; it does not require a generation service or API key.

## What you download

```text
milo-identity-kit.zip
├── START-HERE.md       Next-step instructions
├── IDENTITY.md         Name, role, pronouns, and personality
├── BRAIN.md            Purpose, context, principles, and boundaries
├── VOICE.md            Tone settings and a sample introduction
├── avatar.png          Profile picture at your selected size
├── avatar.svg          Scalable character artwork
├── avatar-design.json  Editable character construction
├── avatar-prompt.md    A prompt for future visual variations
└── identity.json       Portable profile for continued editing
```

Give the kit to your AI employee’s project or coding agent. For example:

> Read this identity kit and use it as the foundation for my AI employee. Ask me about its responsibilities and workflows before implementing anything.

`BRAIN.md` is written guidance, not a running agent, memory system, or permission enforcement layer. Exported traits and settings express preferences; actual model behavior depends on the employee you build next.

To resume an earlier identity, open **The identity kit → Import identity.json**. Import replaces the current browser draft. Download the current kit first if you want to keep both. Uploaded avatars are embedded in the JSON so they survive a round trip.

SVG and avatar-design files are included for characters built in the studio. Uploaded pictures and first-edition gallery projects retain their image-based exports. Older identity files remain importable. Identity Studio retains the original draft-storage key and saved-design format identifiers for compatibility. Earlier projects may call the app Taste Vault. Their drafts and imports remain compatible with Identity Studio.

## Your data

- One current draft is saved in this browser’s `localStorage`, including your processed uploaded image.
- No identity data or images are sent to a server. Avatar processing and ZIP creation run on your device.
- Fonts and built-in images are included locally; the app does not call a font CDN, analytics service, or AI provider.
- Drafts do not sync across browsers, devices, or separate hosted URLs. Clearing browser data removes the draft; download a kit to keep it.
- Local and hosted versions have separate drafts. Use `identity.json` to move between them.
- Custom characters are rendered from editable design data. There is no text-to-image service in this build. The exported avatar prompt describes your design for use in an external image tool. First-edition generated artwork is retained only for older projects.
