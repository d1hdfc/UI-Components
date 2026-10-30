# Two-Way Real-Time Auto-Sync System (Figma <-> Code)

This project features a complete bi-directional auto-sync system connecting Figma and local code (React, Flutter, HTML/CSS) with automated GitHub integration.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │              Figma Cloud              │
                      │  - Design Tokens / Variables          │
                      │  - Canvas Components & Variants       │
                      │  - Dev Resources & Webhooks           │
                      └──────────────┬────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
  [REST API & Webhooks]                               [WebSocket Bridge]
           │                                                   │
           ▼                                                   ▼
┌─────────────────────────┐                         ┌───────────────────────┐
│   Node.js Sync Server   │◄─── bi-directional ───►│  Figma Sync Plugin    │
│  (scripts/figma-sync-   │      real-time socket   │  (scripts/figma-      │
│   server.cjs :3055)     │                         │   plugin/manifest)    │
└────────────┬────────────┘                         └───────────────────────┘
             │
             ├─────────────────────────────────────────┐
             ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│     Code Generator      │               │     Code Watcher        │
│  - React (.tsx, .scss)  │               │  - Watches src/         │
│  - Flutter (.dart)      │               │    components/          │
│  - HTML & CSS (.html)   │               │  - Updates DevResources │
│  - src/components/index │               │  - Canvas delete/update │
└────────────┬────────────┘               └─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│    Git Auto-Committer   │
│  - auto-stage & commit  │
│  - git push origin main │
└─────────────────────────┘
```

---

## 1. Figma to Code Auto-Sync

When a component, button, or component set is added, modified, or removed in Figma:

1. **Detection**:
   - **Figma Webhook**: The server listens at `POST /api/webhook` for `FILE_UPDATE`, `FILE_VERSION_UPDATE`, and `LIBRARY_PUBLISH` events.
   - **REST API Polling**: Background poller checks Figma file versions every 30 seconds (configurable via `SYNC_POLL_INTERVAL_MS`).
   - **Figma Plugin**: Instant real-time push via WebSocket bridge from the Figma canvas.
2. **Multi-Framework Code Generation**:
   - For every component detected:
     - **React**: `<Component>.tsx`, `<Component>.types.ts`, `<Component>.scss`, and `index.ts`.
     - **Flutter**: `<component_name>.dart` (idiomatic `StatelessWidget` with typed variants and properties).
     - **HTML & CSS**: `<component-name>.html` and `<component-name>.css` (standalone semantic markup & styling).
   - Component additions and removals automatically update `src/components/index.ts`.
3. **Automated Git Integration**:
   - Changed files are automatically staged (`git add -A`), committed with a descriptive message and timestamp, and pushed directly to `origin main` (or `origin master`).

---

## 2. Code to Figma Auto-Sync

When a developer modifies or deletes a component in VS Code / Git:

1. **File Watcher (`src/components/`)**:
   - The watcher detects added, modified, or deleted component files with debounce protection.
2. **Figma Canvas Synchronization**:
   - **Component Deletion**: Dispatches `CODE_TO_FIGMA_DELETE` to the Figma Plugin, which finds the node on canvas and executes `node.remove()`.
   - **Component Modification**: Dispatches `CODE_TO_FIGMA_UPDATE` to the Figma Plugin, which dynamically updates background color, corner radius, padding, layout mode, and text on the canvas.
3. **Figma REST API Dev Resources**:
   - Attaches/updates Dev Resources on the Figma node linking directly to the source code file on GitHub (`https://github.com/d1hdfc/UI-Components/blob/main/src/components/...`).

---

## Quick Start & Commands

### Master Windows Batch Script (`sync.bat`)

| Command | Action |
|---|---|
| `sync.bat` | Run complete one-time bi-directional sync (tokens, components, code gen, git push) |
| `sync.bat --server` or `sync.bat --watch` | Start real-time background daemon (Webhooks + WebSocket bridge + file watcher) |
| `sync.bat --figma-to-code` | Run Figma to Code sync and push to GitHub |
| `sync.bat --code-to-figma` | Sync local code components back to Figma canvas & Dev Resources |
| `sync.bat --generate-all` | Generate Flutter & HTML/CSS for all existing components |
| `sync.bat --webhook-list` | List registered Figma webhooks |
| `sync.bat --webhook-create <url>` | Register a new Figma webhook endpoint |
| `sync.bat --help` | Show usage options |

### npm Scripts

```bash
# Start the real-time auto-sync daemon server
npm run sync:server

# Run complete one-time bi-directional sync
npm run sync:all

# Run Figma to Code sync
npm run sync:figma-to-code

# Run Code to Figma sync
npm run sync:code-to-figma

# Generate Flutter and HTML/CSS for all components
npm run sync:generate-all

# Manage Figma webhooks
npm run figma:webhook list
```

---

## Loading the Figma Plugin

To enable real-time canvas mutations (updates and deletions on the Figma canvas directly from VS Code):

1. Open **Figma Desktop** (or Figma in Chrome).
2. Go to `Plugins` -> `Development` -> `Import plugin from manifest...`.
3. Select `scripts/figma-plugin/manifest.json`.
4. Run the plugin **HDFC UI Components Two-Way Auto-Sync**.
5. The plugin connects to `ws://localhost:3055`. As you edit or delete component files in VS Code, the canvas updates in real time!
