# CLI Commands Reference — HDFC UI Components

## Quick Start

```cmd
cd "d:\HDFC\UI Components"
sync.bat --server
```

---

## sync.bat Commands

| Command | Description |
|---------|-------------|
| `sync.bat --server` | Start the Two-Way Auto-Sync Daemon (WebSocket + Figma poller + Code watcher) |
| `sync.bat` | One-click: Figma → Code sync + Git auto-push |
| `sync.bat --figma-to-code` | Pull latest from Figma → generate/update component files |
| `sync.bat --code-to-figma` | Push local code changes → Figma canvas (via WebSocket) |
| `sync.bat --generate-all` | Regenerate all component files and docs pages from scratch |
| `sync.bat --help` | Show all available commands |

---

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Vite dev server (localhost:5173) with HMR |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | Run ESLint on source files |
| Sync server | `npm run sync:server` | Alias for `sync.bat --server` |

---

## Direct Node.js Scripts

### Start the Sync Server
```cmd
node scripts/figma-sync-server.cjs
```

### Run Figma to Code Sync
```cmd
node scripts/cli-sync.cjs --figma-to-code
```

### Run Code Parser (Debug)
```cmd
node -e "const p=require('./scripts/code-parser.cjs'); console.log(JSON.stringify(p.parseComponentDir('button'), null, 2));"
```

### Regenerate App Pages
```cmd
node scripts/app-page-generator.cjs
```

### Check WebSocket Server Status
```cmd
curl http://localhost:3055/api/sync/status
```

### Trigger Manual Figma Sync via API
```cmd
curl -X POST http://localhost:3055/api/sync/figma-to-code
```

### List Registered Webhook Endpoints
```cmd
curl http://localhost:3055/api/webhook-list
```

---

## Environment Setup

### Install all dependencies
```cmd
cd "d:\HDFC\UI Components"
npm install
```

### Set up .env file
```cmd
copy .env.example .env
```
Then edit `.env`:
```
FIGMA_ACCESS_TOKEN=figd_your_token_here
FIGMA_FILE_KEY=CXxUbHl3oMzt9Bzv3SKv75
PORT=3055
AUTO_GIT_PUSH=true
SYNC_POLL_INTERVAL_MS=30000
```

---

## Git Commands

### Check status
```cmd
cd "d:\HDFC\UI Components"
git status
git log --oneline -10
```

### Manual commit and push
```cmd
git add -A
git commit -m "feat: your commit message"
git push origin main
```

---

## Health Check URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3055/api/sync/status` | Server status & last sync time |
| `ws://localhost:3055` | WebSocket endpoint for Figma plugin |
| `http://localhost:3055/api/webhook` | Figma webhook receiver endpoint |
| `http://localhost:5173` | UI documentation dev server |

