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
- `src/tokens/variables/` — generated SCSS variables consumed by the app
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

The package also exports the complete reusable set: `TextField`, `TextArea`,
`SearchBar`, `MPinInput`, `Chips`, `Badge`, `FocusRing`, `Avatar`, `Tag`,
`Checkbox`, `Radio`, `Switch`, `Rating`, `ProgressBar`, `Pagination`, `Tabs`,
`Separator`, `Toast`, `Snackbar`, `BottomSheet`, `Popover`, `Tooltip`, `Card`,
`StatusBar`, `BrowserBar`, and `Carousel` (plus its `useCarousel` hook).

Every push to `main` that changes library components or design tokens builds
and publishes a new `main` package version. To publish a stable version, update
the root `version` in `package.json`, push a matching `vX.Y.Z` tag, and publish a
GitHub release for that tag. Consumers can then install the stable version
without the `@main` suffix.

## Figma token sync

Set `FIGMA_PERSONAL_ACCESS_TOKEN` in a local `.env` file. `npm run dev` starts
the token watcher, which fetches Figma variables immediately and every 60
seconds, then writes the generated token SCSS directly to
`src/tokens/variables/`. Review and commit the changed files under
`src/tokens/variables/` so the changes are tracked in Git and included in the
next package build. `npm run tokens:build` regenerates SCSS from the checked-in
`src/tokens/tokens.json` without making a Figma API request.

## Figma component catalog

Set `FIGMA_PERSONAL_ACCESS_TOKEN` and optionally `FIGMA_FILE_KEY` (or
`FIGMA_DESIGN_FILE_KEY`) in `.env`. The configured Figma file key in
`.mcp/config.json` is used when neither file-key variable is set. `npm run dev`
syncs component page names, descriptions, and preview images into
`src/figma/components.json` on startup and every 60 seconds. This manifest sync
is separate from the MCP WebSocket connection status. Preview images are cached
locally under the ignored `public/figma/components/` directory; signed Figma
image URLs are not written into the source manifest.

The gallery is a Figma preview/catalog, not generated React source. Figma
changes do not create or delete files under `src/components`; update and review
those implementation files separately. Run `npm run figma:components:sync` for
a one-time version check, or `npm run figma:components:sync -- --force` to
refresh the catalog and previews regardless of the current file version.

The docs sidebar also provides a dedicated page for each exported React
component, with a live render from `src/components` beside its matching Figma
design and a usage snippet. The Button, Text field, and Text area pages retain
their detailed examples and include the same Figma/live-code comparison. Vite
hot reload updates these previews as component source or styles change.

## MCP integration

Edit `.mcp/config.json` and replace `<FIGMA_FILE_ID>` and `<FIGMA_PERSONAL_ACCESS_TOKEN>` with your values. Configure your MCP server to consume this file and map Figma variants/tokens to the TypeScript props.
