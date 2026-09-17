# Development

[← Back to the README](../README.md)

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
  avatar.js            Editable character model and SVG renderer
  avatar-editor.js     Canvas handles and customization controls
  avatar-editor.css    Avatar studio layout and controls
  styles.css           Responsive visual system
  assets/              Community logo, local fonts, legacy avatars
scripts/serve.mjs      Small dependency-free local server
tests/                 Identity/export and asset checks
docs/                  Design notes and font licenses
```

Edit `dist/` directly. It is the source here, not disposable generated output. The local server does not hot reload; refresh after edits. Set `PORT` to use a different local port.

## Using another port

On macOS or Linux:

```sh
PORT=4174 npm start
```

In Windows PowerShell:

```powershell
$env:PORT = "4174"
npm start
```

Then open `http://localhost:4174`. The browser treats each port as a separate origin, so use `identity.json` to transfer a draft from another port.

## Hosting

Any static host can serve the contents of `dist/` at the root of a domain. No build command is needed. Asset paths are root-relative, so subdirectory hosting needs a path adjustment. In a Git clone, `.openai/hosting.json` describes this project’s Sites deployment; if you fork the repo to create your own Sites project, remove its `project_id` before registering your own site. Download archives omit this project-specific hosting configuration.

An optional, feature-detected WebMCP tool can configure a draft in supported agent-enabled browsers. The ordinary UI is independent of this capability. See [validation notes](VALIDATION.md) for test coverage and limits.
