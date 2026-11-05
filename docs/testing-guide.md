# Step-by-Step Testing Guide — HDFC UI Components Bi-Directional Sync

## Prerequisites

Before testing, ensure:
1. `.env` file has valid `FIGMA_PERSONAL_ACCESS_TOKEN` / `FIGMA_ACCESS_TOKEN`, `FIGMA_FILE_KEY=CXxUbHl3oMzt9Bzv3SKv75`, and `PORT=3055`
2. Figma plugin **"HDFC UI Components Two-Way Auto-Sync"** is loaded (`Plugins > Development > HDFC UI Components Two-Way Auto-Sync`)
3. Dependencies installed: `npm install`

---

## SETUP: Start Both Servers

Open **2 separate terminal windows**:

### Terminal 1 — Sync Daemon Server
```cmd
cd "d:\HDFC\UI Components"
sync.bat --server
```
**Expected logs:**
```
🚀 HDFC Two-Way Real-Time Auto-Sync Server Running
📡 HTTP & Webhook Endpoint: http://localhost:3055/api/webhook
🔌 Figma Plugin Bridge WebSocket: ws://localhost:3055
🩺 Health & Status Check: http://localhost:3055/api/sync/status
[CodeWatcher] Watching for local component changes in: d:\HDFC\UI Components\src\components
[CodeWatcher] Watching for token variable changes in: d:\HDFC\UI Components\src\tokens\variables
[FigmaPoller] Polling Figma REST API every 30 seconds...
```

### Terminal 2 — UI Docs Dev Server
```cmd
cd "d:\HDFC\UI Components"
npm run dev
```
**Expected:** Vite dev server ready at `http://localhost:5173/` (gracefully falls back to local tokens/catalog if remote Figma REST API returns 404 on a copied file).

---

## TEST A: Code Edit (SCSS / Token Variables) ➔ Figma Canvas Update

**Test:** Change `font-size`, `padding`, `border-radius`, or a token variable in VS Code ➔ verify Figma canvas updates live.

### Steps:
1. Open `src\components\button\Button.scss` or `src\tokens\variables\semantics.scss` in VS Code
2. Change a property or token variable and save (`Ctrl+S`), or click **"Sync VS Code ➔ Figma Canvas"** in the Figma plugin
3. Watch **Terminal 1** — you should see:
   ```
   [CodeWatcher] CHANGED: src/components/button/Button -> Syncing to Figma Canvas
   [FigmaSync] UPDATED: Component <Button> styles modified — fontSize=..., cornerRadius=...
   ```
4. In Figma, the plugin receives `CODE_TO_FIGMA_UPDATE` over `ws://localhost:3055` and updates all matching variants inside the `Button` `COMPONENT_SET` (and any active selection) live on the canvas.

---

## TEST B: Code Edit ➔ Local UI Update (Vite HMR)

**Test:** Change button token/style ➔ verify live preview in browser.

### Steps:
1. Open `src\components\button\Button.scss` or `src\tokens\variables\semantics.scss`
2. Update a button variant token reference and save
3. Browser at `http://localhost:5173/#button` updates immediately via Vite HMR

---

## TEST C: Figma Edit (Variables & Components) ➔ VS Code & Live UI

**Test:** Change a local Variable (e.g., `Semantics ➔ button ➔ primary ➔ background-color`) or component property in Figma ➔ verify code files and UI update.

### Steps:
1. In Figma, open the plugin (`Plugins > Development > HDFC UI Components Two-Way Auto-Sync`)
2. Edit any Variable in Figma or modify/add/delete a component on the Figma canvas
3. Wait 3 seconds (auto-detected) OR click **"Sync Figma File ➔ VS Code (Variables & Components)"**
4. Watch **Terminal 1**:
   ```
   [Bridge] Received live Figma payload from "Foundations Dhenu"
   [FigmaSync] TOKEN UPDATED: "button-primary-background-color-default": ... -> var(--...) in semantics.scss
   [FigmaSync] ADDED / UPDATED / DELETED: Component <...>
   ```
5. Check `src/tokens/variables/*.scss` and `src/components/<component>/` — updated automatically
6. Browser at `http://localhost:5173/#button` reflects the new styles immediately

---

## TEST D: Component Deletion Sync (Both Directions)

- **Figma ➔ Code:** Deleting a generated component in Figma and syncing removes its folder from `src/components/` and cleans up `src/components/index.ts`.
- **Code ➔ Figma:** Deleting a component folder in `src/components/` broadcasts `CODE_TO_FIGMA_DELETE` over WebSocket and calls `node.remove()` on the Figma canvas.

---

## TEST E: One-Click Sync & Git Auto-Push

```cmd
cd "d:\HDFC\UI Components"
sync.bat
```

---

## TEST F: Build & Sync Unit Test Verification

```cmd
cd "d:\HDFC\UI Components"
npm run test:sync
npm run build
```
