# Architecture — HDFC UI Components Bi-Directional Sync

## Overview

This document describes the full architecture of the **Two-Way Auto-Sync Engine** that keeps Figma design tokens, the local codebase (`src/components/`), and the live UI documentation site (`src/app/pages/`) in perfect sync.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HDFC UI Components                           │
│                    Bi-Directional Sync Engine                       │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐      Webhook / REST Polling       ┌──────────────────┐
  │  Figma   │ ──────────────────────────────►  │  figma-sync-     │
  │  Canvas  │ ◄──────────────────────────────  │  server.cjs      │
  └──────────┘      WebSocket (ws://3055)        │  (Port 3055)     │
       ▲                                         └────────┬─────────┘
       │                                                  │
       │  Figma Plugin                          ┌─────────▼─────────┐
       │  (code.js + ui.html)                   │  code-parser.cjs  │
       │  Applies canvas updates                │  Parses SCSS/TSX  │
       │                                        └─────────┬─────────┘
       │                                                  │
       └──────────────────────────────────────────────────┘
                                                          │
                                              ┌───────────▼──────────┐
                                              │  src/components/     │
                                              │  ├── button/         │
                                              │  │   ├── Button.tsx  │
                                              │  │   ├── Button.scss │
                                              │  │   └── Button.     │
                                              │  │       types.ts    │
                                              │  └── ...             │
                                              └───────────┬──────────┘
                                                          │
                                              ┌───────────▼──────────┐
                                              │  src/app/pages/      │
                                              │  Live UI Docs Site   │
                                              │  (Vite HMR)          │
                                              └──────────────────────┘
```

---

## Sync Directions

### Direction 1: Figma ➔ Code (figma-to-code)

| Step | File | Action |
|------|------|--------|
| 1 | `figma-sync-server.cjs` | Polls Figma REST API every 30s OR receives webhook |
| 2 | `cli-sync.cjs` | Calls `syncFigmaToCode()` — fetches component tree from Figma |
| 3 | `code-generator.cjs` | Generates/updates `.tsx`, `.types.ts`, `.scss`, `.dart`, `.html` |
| 4 | `src/components/index.ts` | Auto-exports updated via `app-page-generator.cjs` |
| 5 | `src/app/pages/` | Vite HMR detects file changes → docs site updates live |

**Deletion Handling (Figma → Code):**
- If a component is removed in Figma, `cli-sync.cjs` detects it is absent from the API response
- `code-generator.cjs` removes or marks deprecated the corresponding files in `src/components/`
- `src/components/index.ts` export is removed
- Vite HMR removes the stale component from the docs site automatically

**Log format:**
```
[FigmaSync] ADDED: Component <Button / Large> in src/components/button
[FigmaSync] UPDATED: Component <Button / Primary> styles modified
[FigmaSync] DELETED: Variant <Button / Large> removed from src/components and UI pages
```

---

### Direction 2: Code ➔ Figma (code-to-figma)

| Step | File | Action |
|------|------|--------|
| 1 | `figma-sync-server.cjs` | `fs.watch` detects file change in `src/components/` |
| 2 | `code-parser.cjs` | Parses SCSS/TSX to extract style tokens |
| 3 | `figma-sync-server.cjs` | Broadcasts `CODE_TO_FIGMA_UPDATE` via WebSocket |
| 4 | `scripts/figma-plugin/ui.html` | Receives WS message, forwards to plugin sandbox |
| 5 | `scripts/figma-plugin/code.js` | Applies changes to Figma canvas nodes |

**What code-parser.cjs extracts:**

| Token | Source | SCSS Example |
|-------|--------|--------------|
| `fontSize` | `.btn { font-size: 14px }` or Sass map | `$buttonSizes: (large: (fontSize: 16px))` |
| `fontWeight` | `.btn { font-weight: 600 }` | — |
| `letterSpacing` | `letter-spacing: 0.5px` | — |
| `lineHeight` | `line-height: 1.5` | — |
| `cornerRadius` | `border-radius: 8px` | `$buttonSizes: (large: (cornerRadius: 8px))` |
| `padding` | `padding: 8px 16px` | 2-value or 4-value shorthand |
| `backgroundColor` | `background-color: #fff` or color var | — |
| `textColor` | `color: #333` | — |
| `borderColor` | `border-color: #ccc` | — |
| `width` / `height` | `width: 200px` | — |
| `gap` | `gap: 8px` | — |
| `opacity` | `opacity: 0.5` | — |
| `sizesMap` | Sass `$buttonSizes` map | Multiple sizes with all tokens |
| `variantsMap` | Sass `$buttonVariants` map | Multiple variants with all tokens |

**What code.js applies to Figma canvas:**

| Token | Figma API call |
|-------|---------------|
| `fontSize` | `figma.loadFontAsync()` + `node.fontSize = value` |
| `fontWeight` | `node.fontName = { family: 'Inter', style: 'SemiBold' }` |
| `cornerRadius` | `node.cornerRadius = value` |
| `padding` | `node.paddingTop/Right/Bottom/Left = value` |
| `backgroundColor` | `node.fills = [{ type: 'SOLID', color: { r, g, b } }]` |
| `textColor` | Applied to all TEXT child nodes |
| `width` / `height` | `node.resize(width, height)` |
| `gap` | `node.itemSpacing = value` |
| `opacity` | `node.opacity = value` |

**Deletion Handling (Code → Figma):**
- `fs.watch` detects folder deletion → triggers `triggerCodeToFigmaSync(folder, 'delete')`
- Broadcasts `CODE_TO_FIGMA_DELETE` event with `nodeId`
- `code.js` calls `node.remove()` to delete the node from Figma canvas

**Log format:**
```
[CodeWatcher] CHANGED: src/components/button/Button -> Syncing to Figma Canvas
[FigmaSync] UPDATED: Component <Button> styles modified — fontSize=35px, cornerRadius=8px
[FigmaSync] DELETED: Variant <Button> removed from src/components and UI pages
```

---

## Event Types

| Event | Direction | Trigger |
|-------|-----------|---------|
| `FIGMA_SYNC_REQUEST` | UI → Server | Manual sync button in plugin |
| `FIGMA_TO_CODE_COMPLETE` | Server → UI | Figma poll detects new version |
| `FIGMA_TO_CODE_ERROR` | Server → UI | Sync failed |
| `CODE_TO_FIGMA_UPDATE` | Server → Plugin | File saved in `src/components/` |
| `CODE_TO_FIGMA_DELETE` | Server → Plugin | Folder deleted in `src/components/` |
| `FIGMA_DOCUMENT_CHANGED` | Plugin → Server | User edits Figma document |
| `FIGMA_SELECTION_PUSH` | Plugin → Server | Capture Selection button clicked |

---

## File Map

```
d:\HDFC\UI Components\
├── scripts/
│   ├── figma-sync-server.cjs     ← Main sync server (WebSocket + HTTP + watcher)
│   ├── cli-sync.cjs              ← Figma REST API sync logic
│   ├── code-generator.cjs        ← Generates component files from Figma data
│   ├── code-parser.cjs           ← Parses SCSS/TSX → style tokens
│   ├── figma-rest-api.cjs        ← Figma REST API client
│   ├── app-page-generator.cjs    ← Generates src/app/pages/ from components
│   └── figma-plugin/
│       ├── code.js               ← Figma plugin sandbox (applies canvas changes)
│       ├── ui.html               ← Plugin UI (WebSocket bridge)
│       └── manifest.json         ← Plugin manifest
├── src/
│   ├── components/               ← Component library (source of truth)
│   │   ├── button/               ← Example component folder
│   │   │   ├── Button.tsx
│   │   │   ├── Button.scss
│   │   │   └── Button.types.ts
│   │   └── index.ts              ← Auto-generated barrel exports
│   └── app/
│       └── pages/                ← UI Documentation site pages
│           └── ButtonPage.tsx    ← Auto-generated + manually extended
├── docs/
│   ├── architecture.md           ← This file
│   ├── cli-commands.md           ← All CLI commands reference
│   ├── testing-guide.md          ← Step-by-step test guide
│   └── FIGMA_AUTO_SYNC.md        ← Full Figma sync documentation
├── sync.bat                      ← Entry point for all sync operations
└── .env                          ← FIGMA_ACCESS_TOKEN, FIGMA_FILE_KEY
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIGMA_ACCESS_TOKEN` | Personal access token from Figma | `figd_xxxx` |
| `FIGMA_FILE_KEY` | Figma file key from the URL | `CXxUbHl3oMzt9Bzv3SKv75` |
| `PORT` | WebSocket server port (default 3055) | `3055` |
| `SYNC_POLL_INTERVAL_MS` | Figma polling interval (default 30000) | `30000` |
| `AUTO_GIT_PUSH` | Enable auto git push after sync | `true` |

