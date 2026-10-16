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
- `src/tokens/tokens.json` — synced Figma token source
- `src/tokens/build/` — generated SCSS variables consumed by the app
- `src/main.tsx` — Vite application entry point

MCP integration

Edit `.mcp/config.json` and replace `<FIGMA_FILE_ID>` and `<FIGMA_PERSONAL_ACCESS_TOKEN>` with your values. Configure your MCP server to consume this file and map Figma variants/tokens to the TypeScript props.
