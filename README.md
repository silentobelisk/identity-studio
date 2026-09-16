# Taste Vault

**Give your AI employee a name, a face, and a point of view.**

Taste Vault is a small, thoughtfully designed identity studio for the AI employee you’ve already decided to build. Pick a look, make an introduction, shape a personality, and download a complete identity kit.

This is the groundwork before the build. It defines identity and preferences; it does not set up workflows, tools, integrations, or autonomous behavior.

## Get started

1. Download this repository with **Code → Download ZIP**, then unzip it. Or clone it:

   ```sh
   git clone https://github.com/silentobelisk/taste-vault.git
   cd taste-vault
   ```

2. Install [Node.js 22 or newer](https://nodejs.org/) if you don’t already have it.
3. Open a terminal in the project folder and run:

   ```sh
   npm start
   ```

4. Open **http://localhost:4173**.

No `npm install`, account, API key, or paid service is needed. Keep the terminal open while using the studio. Press `Ctrl+C` to stop it. Don’t open `index.html` directly: browser modules need a local web server.

## Inside the studio

1. **The look** — Choose from 12 original avatars across Characters, Objects, and Portraits. Pick a card accent color or upload your own PNG, JPEG, or WebP. Uploaded images are cropped to a centered square.
2. **The name** — Set a name, role, and optional pronouns.
3. **The personality** — Choose up to five traits and adjust warmth, detail, and energy. A template-based introduction previews the tone.
4. **The brain** — Describe purpose, working context, principles, and boundaries.
5. **The identity kit** — Download everything as a ZIP. Copy the brain or avatar prompt separately if useful.

The live ID card follows your choices. You can revisit any step.

## What you download

```text
milo-identity-kit.zip
├── START-HERE.md       Next-step instructions
├── IDENTITY.md         Name, role, pronouns, and personality
├── BRAIN.md            Purpose, context, principles, and boundaries
├── VOICE.md            Tone settings and a sample introduction
├── avatar.png          512 × 512 profile picture
├── avatar-prompt.md    A prompt for future visual variations
└── identity.json       Portable profile for continued editing
```

Give the kit to your AI employee’s project or coding agent. For example:

> Read this identity kit and use it as the foundation for my AI employee. Ask me about its responsibilities and workflows before implementing anything.

`BRAIN.md` is written guidance, not a running agent, memory system, or permission enforcement layer. Exported traits and settings express preferences; actual model behavior depends on the employee you build next.

To resume an earlier identity, open **The identity kit → Import identity.json**. Import replaces the current browser draft. Download the current kit first if you want to keep both. Uploaded avatars are embedded in the JSON so they survive a round trip.

## Your data

- One current draft is saved in this browser’s `localStorage`, including your processed uploaded image.
- No identity data or images are sent to a server. Avatar processing and ZIP creation run on your device.
- Fonts and built-in images are included locally; the app does not call a font CDN, analytics service, or AI provider.
- Drafts do not sync across browsers, devices, or separate hosted URLs. Clearing browser data removes the draft; download a kit to keep it.
- Local and hosted versions have separate drafts. Use `identity.json` to move between them.
- The built-in art is original AI-generated imagery. The app does not generate new images at runtime; it exports a prompt you can use in your preferred image tool.

## Development

Plain semantic HTML, CSS, and browser JavaScript. No framework or runtime dependencies.

```sh
npm start   # Local server on 127.0.0.1:4173
npm test    # Syntax, data/export regression tests, and asset checks
```

The archive interoperability test uses the system `unzip` command when available (included on macOS and most Linux systems). You can also run `npm run check`.

```text
dist/                  Authored static site, checked into Git
  index.html           Studio shell and accessible dialogs
  app.js               UI, draft storage, image processing, download
  identity.js          Identity model, validation, copy, ZIP writer
  styles.css           Responsive visual system
  assets/              Original avatars, fonts, favicon
scripts/serve.mjs      Small dependency-free local server
tests/                 Identity/export and asset checks
docs/                  Design notes and font licenses
```

Edit `dist/` directly. It is the source here, not disposable generated output. The local server does not hot reload; refresh after edits. Set `PORT` to use a different local port.

## Hosting

Any static host can serve the contents of `dist/` at the root of a domain. No build command is needed. Asset paths are root-relative, so subdirectory hosting needs a path adjustment. `.openai/hosting.json` describes this project’s Sites deployment; if you fork the repo to create your own Sites project, remove its `project_id` before registering your own site.

An optional, feature-detected WebMCP tool can configure a draft in supported agent-enabled browsers. The ordinary UI is independent of this capability. See [validation notes](docs/VALIDATION.md) for test coverage and limits.

## Design and credits

Taste Vault pairs editorial typography and a quiet workspace with a collectible employee ID card. See [design notes and references](docs/DESIGN.md).

Code is licensed under MIT. Bundled fonts, DM Sans and Instrument Serif, use the SIL Open Font License; license files are in `docs/`. No source code or artwork from Bible Strong Avatar Lab is included.
