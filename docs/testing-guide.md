# Step-by-Step Testing Guide — HDFC UI Components Bi-Directional Sync

## Prerequisites

Before testing, ensure:
1. `.env` file has valid `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY=CXxUbHl3oMzt9Bzv3SKv75`
2. Figma plugin "HDFC UI Components Two-Way Auto-Sync" is loaded (Plugins > Development > HDFC UI Components Two-Way Auto-Sync)
3. Dependencies installed: `npm install`

---

## SETUP: Start Both Servers

Open **2 separate CMD windows**:

### Terminal 1 — Sync Daemon Server
```cmd
cd "d:\HDFC\UI Components"
sync.bat --server
```
**Expected logs:**
```
[Server] Starting Two-Way Real-Time Auto-Sync Daemon Server...
[Server] - Figma Webhook listener on http://localhost:3055/api/webhook
[Server] - WebSocket Bridge on ws://localhost:3055
[Server] - Code file watcher on src/components/
[CodeWatcher] Watching for local component changes in: D:\HDFC\UI Components\src\components
[FigmaPoller] Polling Figma REST API every 30 seconds...
[FigmaPoller] Initialized Figma file version: <version_id>
```

### Terminal 2 — UI Docs Dev Server
```cmd
cd "d:\HDFC\UI Components"
npm run dev
```
**Expected:** Browser opens at `http://localhost:5173`

---

## TEST A: Code Edit → Figma Canvas Update

**Test:** Change `font-size` in `Button.scss` → verify Figma canvas updates

### Steps:
1. Open `src\components\button\Button.scss` in VS Code
2. Change `font-size: 14px` to `font-size: 35px`
3. Save the file (Ctrl+S)
4. Watch **Terminal 1** — you should see:
   ```
   [CodeWatcher] CHANGED: src/components/button/Button -> Syncing to Figma Canvas
   [FigmaSync] UPDATED: Component <Button> styles modified — fontSize=35px, cornerRadius=8px, bg=n/a
   ```
5. In Figma, open the plugin panel (Plugins > Development > HDFC UI Components Two-Way Auto-Sync)
6. Plugin log should show: `Received code update for: Button`
7. Select a Button frame on the Figma canvas
8. **Expected:** Font size of button text nodes updates to 35px

### Verify in Figma:
- Select any Button component on canvas
- Right panel > Design > Text layer > Font size = **35**
- If not applied: click "Sync Figma File to VS Code" in plugin, then re-save the SCSS file

---

## TEST B: Code Edit → Local UI Update (HMR)

**Test:** Change button background color → verify live preview in browser

### Steps:
1. Open `src\components\button\Button.scss`
2. Find `background-color` in a variant and change it (e.g., `#0c2340` → `#ff0000`)
3. Save the file
4. Browser at `http://localhost:5173/#button` should **instantly update** (no reload needed)
5. **Expected:** Button preview shows red background color

---

## TEST C: Figma Edit → Code Update

**Test:** Change a property in Figma → verify code files update

### Steps:
1. Make sure sync server is running (Terminal 1)
2. In Figma, select a Button component frame
3. Change its corner radius (e.g., 4px → 20px)
4. Wait 30 seconds for poller to detect version change, OR:
   - In plugin panel, click **"Sync Figma File to VS Code"** for immediate sync
5. Watch **Terminal 1** — you should see:
   ```
   [FigmaPoller] Detected new Figma file version: <new_id> (was <old_id>)
   [SyncServer] >>> Triggering Figma to Code Auto-Sync (Source: poller-version-change)
   [FigmaSync] UPDATED: Component <Button> styles modified
   ```
6. Check `src\components\button\Button.scss` — corner-radius should be updated
7. Browser at `http://localhost:5173/#button` — live preview should reflect new corner radius

---

## TEST D: Figma Delete → Code Deletion

**Test:** Delete a component variant in Figma → verify it's removed from code

### Steps:
1. In Figma, right-click a component variant (e.g., a size variant) and delete it
2. Trigger sync: click **"Sync Figma File to VS Code"** in the plugin OR wait 30s
3. Watch **Terminal 1**:
   ```
   [FigmaSync] DELETED: Variant <Button / XSmall> removed from src/components and UI pages
   ```
4. Check `src\components\button\` — deleted variant's code should be removed/deprecated
5. Check `http://localhost:5173/#button` — deleted variant should no longer appear

---

## TEST E: Code Delete → Figma Canvas Removal

**Test:** Delete a component folder → verify Figma canvas node is removed

### Steps:
1. Create a test component folder first: `mkdir "src\components\test-component"`
2. Create a dummy file: `echo // test > "src\components\test-component\TestComponent.tsx"`
3. Watch Terminal 1 detect it (ADDED log)
4. Now delete the folder:
   ```cmd
   rmdir /s /q "d:\HDFC\UI Components\src\components\test-component"
   ```
5. Watch **Terminal 1**:
   ```
   [FigmaSync] DELETED: Variant <TestComponent> removed from src/components and UI pages
   ```
6. In Figma canvas: the TestComponent node (if it existed) should be removed via `node.remove()`

---

## TEST F: Git Auto-Push Verification

**Test:** Run one-click sync → verify GitHub has new commit

### Steps:
1. Make a visible change (e.g., add a comment to `Button.scss`)
2. Run:
   ```cmd
   cd "d:\HDFC\UI Components"
   sync.bat
   ```
3. Watch terminal for:
   ```
   [AutoSync] Git: Adding all changes...
   [AutoSync] Git: Committing...
   [AutoSync] Git: Pushing to origin main...
   ```
4. Open `https://github.com/d1hdfc/UI-Components/commits/main`
5. **Expected:** New commit visible with timestamp

---

## TEST G: Build Verification

**Test:** Ensure TypeScript build passes with no errors

```cmd
cd "d:\HDFC\UI Components"
npm run build
```

**Expected output:**
```
✓ built in ~15s
dist/assets/index-xxxxx.js    ~330 kB
dist/assets/index-xxxxx.css   ~xx kB
```
No TypeScript errors.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Plugin shows "Disconnected" | Make sure `sync.bat --server` is running in Terminal 1 |
| Figma not updating after code change | Open plugin panel — it must be open to receive WebSocket messages |
| `font-size` not applied in Figma | Ensure the font (Inter) is available in Figma; plugin loads it async |
| Build error `TS1351` | Identifier starts with a number — check `src/components/index.ts` exports |
| `[FigmaPoller] Polling check failed` | Check `.env` — `FIGMA_ACCESS_TOKEN` may be expired |
| HMR not working | Check Vite dev server is running (`npm run dev`), not the build preview |
| Changes not in GitHub | Run `sync.bat` or manually: `git add -A && git commit -m "fix" && git push origin main` |

