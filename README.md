# UI Components — UI-like Design System Starter

This repo is a starter UI component library inspired by Razorpay UI, with a simple MCP configuration to map Figma tokens & components to TypeScript.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the MCP server (configure credentials in `.mcp/config.json`):

```bash
# Run your MCP server. Example placeholder:
npm run mcp:start
```

3. Run Vite dev server:

```bash
npm run dev
```

Project structure

- `.mcp/` — MCP mapping configuration for Figma
- `src/app/` — Vite app shell, docs pages, and docs-only components
- `src/components/` — reusable UI components, grouped by component
- `src/library.ts` — public entry point for the installable package
- `src/tokens/tokens.json` — synced Figma token source
- `src/tokens/build/` — generated SCSS variables consumed by the app
- `src/main.tsx` — Vite application entry point

## Install the component library

The library is published privately to GitHub Packages as `@d1hdfc/ui-components`.
Consumers need access to the `d1hdfc/UI-Components` repository/package and a
GitHub personal access token with `read:packages` permission.

Configure npm to use GitHub Packages for the `@d1hdfc` scope. Keep the token in
an environment variable; do not commit it:

```ini
# .npmrc
@d1hdfc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Install the latest build from `main`:

```bash
npm install @d1hdfc/ui-components@main
```

Use the component and import its styles:

```tsx
import { Button } from '@d1hdfc/ui-components';
import '@d1hdfc/ui-components/style.css';

export function Example() {
  return <Button variant="primary">Continue</Button>;
}
```

Every push to `main` that changes library components or design tokens builds
and publishes a new `main` package version. To publish a stable version, update
the root `version` in `package.json`, push a matching `vX.Y.Z` tag, and publish a
GitHub release for that tag. Consumers can then install the stable version
without the `@main` suffix.

## Figma token sync

Set `FIGMA_PERSONAL_ACCESS_TOKEN` in a local `.env` file. `npm run dev` starts
the token watcher, which fetches Figma variables immediately and every 60
seconds, then regenerates the token SCSS used by both the app and package.
Review and commit the changed files under `src/tokens/` so the changes are
tracked in Git and included in the next package build. `npm run tokens:build`
regenerates SCSS from the checked-in `src/tokens/tokens.json` without making a
Figma API request.

## MCP integration

Edit `.mcp/config.json` and replace `<FIGMA_FILE_ID>` and `<FIGMA_PERSONAL_ACCESS_TOKEN>` with your values. Configure your MCP server to consume this file and map Figma variants/tokens to the TypeScript props.
