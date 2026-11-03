'use strict';

require('dotenv').config();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocket, WebSocketServer } = require('ws');
const figmaApi = require('./figma-rest-api.cjs');
const cliSync = require('./cli-sync.cjs');
const codeParser = require('./code-parser.cjs');

const PORT = Number(process.env.PORT || 3055);
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL_MS = Number(process.env.SYNC_POLL_INTERVAL_MS || 30_000);
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const TOKENS_VARIABLES_DIR = path.join(process.cwd(), 'src', 'tokens', 'variables');

const channels = new Map();
const joinedChannels = new WeakMap();

let isFigmaSyncing = false;
let lastKnownVersion = null;
let lastFigmaSyncTime = null;
let lastModifiedComponentFolder = 'button';

// ==========================================
// WebSocket & Messaging Helpers
// ==========================================

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcastToChannel(channelName, message) {
  const clients = channels.get(channelName);
  if (!clients) return;
  for (const client of clients) {
    send(client, {
      type: 'broadcast',
      channel: channelName,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

function leaveAllChannels(socket) {
  for (const channelName of joinedChannels.get(socket) || []) {
    const clients = channels.get(channelName);
    if (!clients) continue;
    clients.delete(socket);
    if (clients.size === 0) channels.delete(channelName);
  }
  joinedChannels.delete(socket);
}

function handleSocketMessage(socket, rawMessage) {
  let data;
  try {
    data = JSON.parse(rawMessage.toString());
  } catch {
    send(socket, { type: 'error', message: 'Invalid JSON payload' });
    return;
  }

  if (data.type === 'join') {
    const channelName = data.channel || 'figma-sync';
    let clients = channels.get(channelName);
    if (!clients) {
      clients = new Set();
      channels.set(channelName, clients);
    }
    clients.add(socket);

    let membership = joinedChannels.get(socket);
    if (!membership) {
      membership = new Set();
      joinedChannels.set(socket, membership);
    }
    membership.add(channelName);

    send(socket, {
      type: 'system',
      message: `Joined channel: ${channelName}`,
      channel: channelName
    });
    return;
  }

  if (data.type === 'message') {
    const channelName = data.channel || 'figma-sync';
    const payload = data.message;

    if (payload?.event === 'FIGMA_SYNC_REQUEST' || payload?.event === 'FIGMA_SELECTION_PUSH') {
      console.log(`[Bridge] Figma sync requested${payload.event === 'FIGMA_SELECTION_PUSH' ? ` for ${payload.items?.length || 0} selected item(s)` : ''}`);
      triggerFigmaToCodeSync(payload.event === 'FIGMA_SYNC_REQUEST' ? 'plugin-request' : 'plugin-selection');
      return;
    }

    if (payload?.event === 'CODE_TO_FIGMA_SYNC_REQUEST') {
      const targetFolder = payload.componentFolder || lastModifiedComponentFolder || 'button';
      console.log(`[Bridge] Code -> Figma sync requested from plugin for "${targetFolder}"`);
      triggerCodeToFigmaSync(targetFolder, 'update');
      if (targetFolder !== 'button' && fs.existsSync(path.join(COMPONENTS_DIR, 'button'))) {
        triggerCodeToFigmaSync('button', 'update');
      }
      return;
    }

    broadcastToChannel(channelName, payload);
    return;
  }
}

// ==========================================
// Core Sync Actions
// ==========================================

async function triggerFigmaToCodeSync(triggerSource = 'manual') {
  if (isFigmaSyncing) {
    console.log(`[SyncServer] Sync already in progress, skipping (${triggerSource})`);
    return;
  }

  isFigmaSyncing = true;
  console.log(`\n[SyncServer] >>> Triggering Figma to Code Auto-Sync (Source: ${triggerSource})`);

  try {
    const result = await cliSync.syncFigmaToCode({ commit: true });
    lastFigmaSyncTime = new Date().toISOString();

    broadcastToChannel('figma-sync', {
      event: 'FIGMA_TO_CODE_COMPLETE',
      result,
      source: triggerSource
    });
  } catch (error) {
    console.error('[SyncServer] Figma to Code sync failed:', error.message);
    broadcastToChannel('figma-sync', {
      event: 'FIGMA_TO_CODE_ERROR',
      error: error.message
    });
  } finally {
    isFigmaSyncing = false;
  }
}

async function triggerCodeToFigmaSync(componentFolder, action = 'update') {
  lastModifiedComponentFolder = componentFolder;
  console.log(`\n[SyncServer] >>> Triggering Code to Figma Auto-Sync (${action}: ${componentFolder})`);

  const compData = codeParser.parseComponentDir(componentFolder);

  if (action === 'delete' || compData.isDeleted) {
    console.log(`\n[FigmaSync] DELETED: Variant <${compData.componentName}> removed from src/components and UI pages`);
    broadcastToChannel('figma-sync', {
      event: 'CODE_TO_FIGMA_DELETE',
      componentName: compData.componentName,
      folder: compData.folder,
      nodeId: compData.nodeId
    });
    return;
  }

  console.log(`[CodeWatcher] CHANGED: src/components/${compData.folder}/${compData.componentName} -> Syncing to Figma Canvas`);
  console.log(`[FigmaSync] UPDATED: Component <${compData.componentName}> styles modified — fontSize=${compData.fontSize ?? 'n/a'}px, cornerRadius=${compData.cornerRadius ?? 'n/a'}px, height=${compData.height ?? 'n/a'}px`);

  broadcastToChannel('figma-sync', {
    event: 'CODE_TO_FIGMA_UPDATE',
    componentName: compData.componentName,
    folder: compData.folder,
    nodeId: compData.nodeId,
    // Typography
    fontSize: compData.fontSize,
    fontWeight: compData.fontWeight,
    letterSpacing: compData.letterSpacing,
    lineHeight: compData.lineHeight,
    // Geometry
    cornerRadius: compData.cornerRadius,
    padding: compData.padding,
    width: compData.width,
    height: compData.height,
    gap: compData.gap,
    // Colors
    backgroundColor: compData.backgroundColor,
    textColor: compData.textColor,
    borderColor: compData.borderColor,
    opacity: compData.opacity,
    // Variants & Sizes maps
    variants: compData.variants,
    sizes: compData.sizes,
    sizesMap: compData.sizesMap,
    variantsMap: compData.variantsMap
  });

  // Also update Dev Resources via Figma REST API (best effort)
  if (compData.nodeId) {
    try {
      const fileKey = figmaApi.getFileKey();
      const repoUrl = `https://github.com/d1hdfc/UI-Components/blob/main/src/components/${compData.folder}/${compData.componentName}.tsx`;
      await figmaApi.createDevResource(fileKey, {
        name: `${compData.componentName} (Code Component)`,
        url: repoUrl,
        nodeId: compData.nodeId
      });
    } catch {
      // Ignore if dev resource exists or file unavailable on REST API
    }
  }
}

// ==========================================
// Code Watcher (Code to Figma)
// ==========================================

function setupCodeWatcher() {
  if (!fs.existsSync(COMPONENTS_DIR)) return;

  console.log(`[CodeWatcher] Watching for local component changes in: ${COMPONENTS_DIR}`);

  const debounceTimers = new Map();

  fs.watch(COMPONENTS_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    if (filename.includes('.git') || filename.includes('node_modules') || filename.endsWith('.tmp')) {
      return;
    }

    const parts = filename.split(/[/\\]/);
    const componentFolder = parts[0];

    if (componentFolder === 'index.ts' || componentFolder.includes('.')) return;

    if (debounceTimers.has(componentFolder)) {
      clearTimeout(debounceTimers.get(componentFolder));
    }

    debounceTimers.set(
      componentFolder,
      setTimeout(() => {
        debounceTimers.delete(componentFolder);

        const folderPath = path.join(COMPONENTS_DIR, componentFolder);
        const exists = fs.existsSync(folderPath);

        if (!exists) {
          triggerCodeToFigmaSync(componentFolder, 'delete');
        } else {
          triggerCodeToFigmaSync(componentFolder, 'update');
        }
      }, 800)
    );
  });

  // Also watch src/tokens/variables/ so changing token SCSS variables immediately syncs to Figma
  if (fs.existsSync(TOKENS_VARIABLES_DIR)) {
    console.log(`[CodeWatcher] Watching for token variable changes in: ${TOKENS_VARIABLES_DIR}`);
    let tokenTimer = null;
    fs.watch(TOKENS_VARIABLES_DIR, { recursive: false }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.scss')) return;
      if (tokenTimer) clearTimeout(tokenTimer);
      tokenTimer = setTimeout(() => {
        tokenTimer = null;
        console.log(`[CodeWatcher] CHANGED: src/tokens/variables/${filename} -> Re-evaluating token variables & syncing to Figma`);
        codeParser.invalidateTokenCache();
        triggerCodeToFigmaSync(lastModifiedComponentFolder || 'button', 'update');
      }, 800);
    });
  }
}

// ==========================================
// Background Poller (Figma to Code)
// ==========================================

function setupFigmaPoller() {
  console.log(`[FigmaPoller] Polling Figma REST API every ${POLL_INTERVAL_MS / 1000} seconds...`);

  async function checkFigmaVersion() {
    if (isFigmaSyncing) return;
    try {
      const fileKey = figmaApi.getFileKey();
      const versions = await figmaApi.getFileVersions(fileKey);
      const latest = versions.versions?.[0]?.id;

      if (!latest) return;

      if (lastKnownVersion === null) {
        lastKnownVersion = latest;
        console.log(`[FigmaPoller] Initialized Figma file version: ${latest}`);
        return;
      }

      if (latest !== lastKnownVersion) {
        console.log(`[FigmaPoller] Detected new Figma file version: ${latest} (was ${lastKnownVersion})`);
        lastKnownVersion = latest;
        await triggerFigmaToCodeSync('poller-version-change');
      }
    } catch {
      // Silently skip when working on local copy or offline
    }
  }

  checkFigmaVersion();
  setInterval(checkFigmaVersion, POLL_INTERVAL_MS);
}

// ==========================================
// HTTP Server (Webhook Receiver & API)
// ==========================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(body);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Figma-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/sync/status') {
    const clientsCount = channels.get('figma-sync')?.size || 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'running',
        port: PORT,
        fileKey: figmaApi.getFileKey(),
        lastKnownVersion,
        lastFigmaSyncTime,
        isFigmaSyncing,
        connectedBridgeClients: clientsCount
      })
    );
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sync/figma-to-code') {
    triggerFigmaToCodeSync('http-api');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Figma to Code sync triggered' }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sync/code-to-figma') {
    const body = await parseBody(req);
    const folder = body.componentFolder || lastModifiedComponentFolder || 'button';
    triggerCodeToFigmaSync(folder, 'update');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Code to Figma sync triggered for ${folder}` }));
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/webhook' || pathname === '/api/figma-webhook')) {
    try {
      const payload = await parseBody(req);
      console.log(`[Webhook] Received Figma Webhook event: ${payload.event_type || 'UNKNOWN'}`);

      if (payload.event_type === 'PING') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'pong', timestamp: new Date().toISOString() }));
        return;
      }

      if (payload.event_type === 'FILE_UPDATE' || payload.event_type === 'LIBRARY_PUBLISH') {
        triggerFigmaToCodeSync(`webhook-${payload.event_type}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'received' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/ui-notify') {
    try {
      const payload = await parseBody(req);
      broadcastToChannel('figma-sync', payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'broadcasted' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// ==========================================
// WebSocket Server Attachment
// ==========================================

const wss = new WebSocketServer({ server });

wss.on('connection', socket => {
  send(socket, {
    type: 'system',
    message: 'Connected to HDFC Two-Way Auto-Sync Bridge'
  });

  socket.on('message', msg => handleSocketMessage(socket, msg));
  socket.on('close', () => leaveAllChannels(socket));
  socket.on('error', err => console.error('[WebSocket] Error:', err.message));
});

// ==========================================
// Server Start
// ==========================================

let startupErrorLogged = false;
function handleStartupError(error) {
  if (startupErrorLogged) return;
  startupErrorLogged = true;

  if (error.code === 'EADDRINUSE') {
    console.error(
      `[SyncServer] Port ${PORT} is already in use. The sync server may already be running. ` +
      `Check http://localhost:${PORT}/health before starting another instance.`
    );
  } else {
    console.error(`[SyncServer] Failed to start: ${error.message}`);
  }
  process.exitCode = 1;
}

wss.once('error', handleStartupError);
server.once('error', handleStartupError);

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`🚀 HDFC Two-Way Real-Time Auto-Sync Server Running`);
  console.log(`📡 HTTP & Webhook Endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`🔌 Figma Plugin Bridge WebSocket: ws://localhost:${PORT}`);
  console.log(`🩺 Health & Status Check: http://localhost:${PORT}/api/sync/status`);
  console.log('====================================================');

  setupCodeWatcher();
  setupFigmaPoller();
});

process.on('SIGINT', () => {
  console.log('\n[SyncServer] Shutting down gracefully...');
  wss.close();
  server.close(() => process.exit(0));
});
