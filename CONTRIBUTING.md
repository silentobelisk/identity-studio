# Contributing to Identity Studio

Help make the studio clearer, more expressive, and easier to use.

## Report a bug or suggest an idea

Use the [issue templates](https://github.com/silentobelisk/identity-studio/issues/new/choose). For bugs, include the steps to reproduce, what you expected, what happened, and your browser and operating system. A screenshot or a small sample design helps; remove private employee or business details before sharing.

## Make a change

1. Fork the repository and create a branch for your change.
2. Use Node.js 22 or newer and run `npm start`. No dependency installation is needed.
3. Edit the files in `dist/` directly; they are the source. Refresh your browser to see changes.
4. Run `npm test` and check the behavior you changed in the browser.
5. Open a pull request with the problem, your change, and how you checked it. Include a screenshot for visual changes.

Keep changes focused. Preserve existing drafts and identity imports, accessible labels and keyboard controls, and the app's ability to work without external services. Add regression coverage when changing data handling or exports; documentation-only changes need working links and accurate instructions.

See the [development guide](docs/DEVELOPMENT.md), [design direction](docs/DESIGN.md), and [validation notes](docs/VALIDATION.md) for context.
