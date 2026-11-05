import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WebSocket } = require('ws');

type FigmaNode = {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
};

type FigmaComponentEntry = {
  key: string;
  name: string;
  pageName: string;
  description: string;
  nodeId: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
  thumbnailUrl: string;
};

type FigmaFile = {
  name: string;
  document?: {
    children?: FigmaNode[];
  };
};

type FigmaFileVersions = {
  versions?: Array<{ id: string }>;
};

type FigmaImages = {
  images?: Record<string, string | null>;
};

type SyncConfig = {
  connection?: {
    defaultFileKey?: string;
  };
};

type FigmaComponentCatalog = {
  fileKey: string;
  version: string;
  components: FigmaComponentEntry[];
};

type FigmaComponentCandidate = Omit<FigmaComponentEntry, 'thumbnailUrl'>;

const syncIntervalMs = 60_000;
const configPath = path.join(process.cwd(), '.mcp', 'config.json');
const outputPath = path.join(process.cwd(), 'src', 'figma', 'components.json');
const previewDirectory = path.join(process.cwd(), 'public', 'figma', 'components');
const componentsDir = path.join(process.cwd(), 'src', 'components');
const tokenVariablesDir = path.join(process.cwd(), 'src', 'tokens', 'variables');
const imageBatchSize = 50;

let suppressForwarderUntil = 0;

function getFileKey(): string {
  const config = fs.existsSync(configPath)
    ? (JSON.parse(fs.readFileSync(configPath, 'utf8')) as SyncConfig)
    : {};
  const fileKey =
    process.env.FIGMA_FILE_KEY?.trim() ||
    process.env.FIGMA_DESIGN_FILE_KEY?.trim() ||
    config.connection?.defaultFileKey;

  if (!fileKey) {
    throw new Error('Figma file key is missing. Set FIGMA_FILE_KEY or FIGMA_DESIGN_FILE_KEY.');
  }

  return fileKey;
}

function getToken(): string {
  const token =
    process.env.FIGMA_PERSONAL_ACCESS_TOKEN?.trim() ||
    process.env.FIGMA_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_ACCESS_TOKEN is missing. Add a Figma token to the local .env file or shell environment.');
  }

  return token;
}

async function fetchFigmaJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Figma API failed (${response.status} ${response.statusText}): ${details}`);
  }

  return response.json() as Promise<T>;
}

function collectComponents(page: FigmaNode): FigmaComponentCandidate[] {
  const components: FigmaComponentCandidate[] = [];

  const visit = (node: FigmaNode) => {
    if (node.type === 'INSTANCE') return;

    if (node.type === 'COMPONENT_SET') {
      const variantCount = node.children?.filter((child) => child.type === 'COMPONENT').length ?? 0;
      components.push({
        key: node.id,
        name: node.name,
        pageName: page.name,
        description: `${variantCount} variants`,
        nodeId: node.id,
        type: 'COMPONENT_SET'
      });
      return;
    }

    if (node.type === 'COMPONENT') {
      components.push({
        key: node.id,
        name: node.name,
        pageName: page.name,
        description: 'Component',
        nodeId: node.id,
        type: 'COMPONENT'
      });
      return;
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  for (const child of page.children ?? []) {
    visit(child);
  }

  return components;
}

async function fetchPreviews(fileKey: string, nodeIds: string[], token: string): Promise<Record<string, string | null>> {
  const batches: string[][] = [];
  for (let index = 0; index < nodeIds.length; index += imageBatchSize) {
    batches.push(nodeIds.slice(index, index + imageBatchSize));
  }

  const responses = await Promise.all(batches.map((batch) =>
    fetchFigmaJson<FigmaImages>(
      `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${batch.map(encodeURIComponent).join(',')}&format=png&scale=0.5`,
      token
    )
  ));

  return Object.assign({}, ...responses.map((response) => response.images ?? {}));
}

async function syncComponents(fileKey: string, token: string, force = false): Promise<void> {
  const versions = await fetchFigmaJson<FigmaFileVersions>(
    `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/versions`,
    token
  );
  const latestVersion = versions.versions?.[0]?.id;
  if (!latestVersion) {
    throw new Error('Figma versions API returned no version for the configured file.');
  }

  const previousCatalog = fs.existsSync(outputPath)
    ? (JSON.parse(fs.readFileSync(outputPath, 'utf8')) as Partial<FigmaComponentCatalog>)
    : undefined;
  const previewsAreLocal = previousCatalog?.components?.every((component) =>
    component.thumbnailUrl.startsWith('/figma/components/') &&
    (component.type === 'COMPONENT' || component.type === 'COMPONENT_SET') &&
    typeof component.pageName === 'string'
  );
  if (
    !force &&
    previousCatalog?.fileKey === fileKey &&
    previousCatalog.version === latestVersion &&
    previewsAreLocal
  ) {
    return;
  }

  const file = await fetchFigmaJson<FigmaFile>(
    `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}`,
    token
  );
  const pages = file.document?.children;
  if (!Array.isArray(pages)) {
    throw new Error('Figma file API returned an invalid response: document.children is missing.');
  }

  const components = pages
    .filter((page) => page.type === 'CANVAS')
    .flatMap((page) => collectComponents(page));
  const previews = await fetchPreviews(fileKey, components.map((component) => component.nodeId), token);

  fs.mkdirSync(previewDirectory, { recursive: true });
  const entries = await Promise.all(components.map(async (component) => {
    const previewUrl = previews[component.nodeId];
    const safeNodeId = component.nodeId.replace(/[^a-zA-Z0-9_-]/g, '-');
    let thumbnailUrl = '';

    if (previewUrl) {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error(`Figma preview download failed (${response.status} ${response.statusText}) for "${component.name}".`);
      }

      fs.writeFileSync(path.join(previewDirectory, `${safeNodeId}.png`), Buffer.from(await response.arrayBuffer()));
      thumbnailUrl = `/figma/components/${safeNodeId}.png`;
    }

    return {
      ...component,
      thumbnailUrl
    };
  }));

  const currentKeys = new Set(components.map((component) => component.key));
  const previousComponents = previousCatalog?.components ?? [];
  for (const component of previousComponents) {
    if (!currentKeys.has(component.key) && component.thumbnailUrl.startsWith('/figma/components/')) {
      fs.rmSync(path.join(previewDirectory, path.basename(component.thumbnailUrl)), { force: true });
    }
  }

  const catalog: FigmaComponentCatalog = {
    fileKey,
    version: latestVersion,
    components: entries
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Synced ${catalog.components.length} components from ${file.name} to ${outputPath}`);
}

function postToSyncBridge(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  const req = http.request(
    {
      hostname: 'localhost',
      port: Number(process.env.PORT || 3055),
      path: '/api/ui-notify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    () => { /* ok */ }
  );
  req.on('error', () => { /* ignore if port 3055 not listening */ });
  req.write(body);
  req.end();
}

function setupLiveBiDirectionalBridge(): void {
  let lastFolder = 'button';

  const pushComponentUpdate = (folder: string) => {
    try {
      const codeParserPath = path.join(process.cwd(), 'scripts', 'code-parser.cjs');
      delete require.cache[require.resolve(codeParserPath)];
      const codeParser = require(codeParserPath);
      const compData = codeParser.parseComponentDir(folder);
      if (compData.isDeleted) {
        console.log(`[FigmaSync] DELETED: Variant <${compData.componentName}> removed from src/components and UI pages`);
        postToSyncBridge({
          event: 'CODE_TO_FIGMA_DELETE',
          componentName: compData.componentName,
          folder: compData.folder,
          nodeId: compData.nodeId
        });
        return;
      }
      console.log(`[CodeWatcher] CHANGED: src/components/${compData.folder}/${compData.componentName} -> Syncing to Figma Canvas`);
      console.log(`[FigmaSync] UPDATED: Component <${compData.componentName}> styles modified — fontSize=${compData.fontSize ?? 'n/a'}px, cornerRadius=${compData.cornerRadius ?? 'n/a'}px`);
      postToSyncBridge({
        event: 'CODE_TO_FIGMA_UPDATE',
        componentName: compData.componentName,
        folder: compData.folder,
        nodeId: compData.nodeId,
        fontSize: compData.fontSize,
        fontWeight: compData.fontWeight,
        letterSpacing: compData.letterSpacing,
        lineHeight: compData.lineHeight,
        cornerRadius: compData.cornerRadius,
        padding: compData.padding,
        width: compData.width,
        height: compData.height,
        gap: compData.gap,
        backgroundColor: compData.backgroundColor,
        textColor: compData.textColor,
        borderColor: compData.borderColor,
        opacity: compData.opacity,
        variants: compData.variants,
        sizes: compData.sizes,
        sizesMap: compData.sizesMap,
        variantsMap: compData.variantsMap
      });
    } catch (err) {
      console.warn('[CodeWatcher] Forwarder warning:', err);
    }
  };

  // Connect to ws://localhost:3055 to handle FIGMA_LIVE_SYNC_PAYLOAD & CODE_TO_FIGMA_SYNC_REQUEST
  const connectWsListener = () => {
    const port = Number(process.env.PORT || 3055);
    let ws: InstanceType<typeof WebSocket> | null = null;
    try {
      ws = new WebSocket(`ws://localhost:${port}`);
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'join', channel: 'figma-sync' }));
      });
      ws.on('message', (raw: Buffer) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === 'broadcast' && data.message) {
            const payload = data.message;
            if (payload.event === 'FIGMA_LIVE_SYNC_PAYLOAD') {
              suppressForwarderUntil = Date.now() + 3000;
              const serverModPath = path.join(process.cwd(), 'scripts', 'figma-sync-server.cjs');
              delete require.cache[require.resolve(serverModPath)];
              const { applyFigmaLivePayload } = require(serverModPath);
              const result = applyFigmaLivePayload(payload);
              postToSyncBridge({
                event: 'FIGMA_TO_CODE_COMPLETE',
                result,
                source: payload.reason || 'plugin-live'
              });
            } else if (payload.event === 'CODE_TO_FIGMA_SYNC_REQUEST') {
              pushComponentUpdate(payload.componentFolder || lastFolder || 'button');
            }
          }
        } catch {
          // Ignore malformed WS messages
        }
      });
      ws.on('close', () => {
        setTimeout(connectWsListener, 5000);
      });
      ws.on('error', () => {
        // Ignore; close handler will retry
      });
    } catch {
      setTimeout(connectWsListener, 5000);
    }
  };

  connectWsListener();

  if (fs.existsSync(componentsDir)) {
    const timers = new Map<string, NodeJS.Timeout>();
    fs.watch(componentsDir, { recursive: true }, (_event, filename) => {
      if (Date.now() < suppressForwarderUntil) return;
      if (!filename || filename.includes('.git') || filename.endsWith('.tmp')) return;
      const folder = filename.split(/[/\\]/)[0];
      if (!folder || folder === 'index.ts' || folder.includes('.')) return;
      lastFolder = folder;
      if (timers.has(folder)) clearTimeout(timers.get(folder)!);
      timers.set(
        folder,
        setTimeout(() => {
          timers.delete(folder);
          pushComponentUpdate(folder);
        }, 500)
      );
    });
  }

  if (fs.existsSync(tokenVariablesDir)) {
    let tokenTimer: NodeJS.Timeout | null = null;
    fs.watch(tokenVariablesDir, { recursive: false }, (_event, filename) => {
      if (Date.now() < suppressForwarderUntil) return;
      if (!filename || !filename.endsWith('.scss')) return;
      if (tokenTimer) clearTimeout(tokenTimer);
      tokenTimer = setTimeout(() => {
        tokenTimer = null;
        console.log(`[CodeWatcher] CHANGED: src/tokens/variables/${filename} -> Syncing resolved token values to Figma Canvas`);
        pushComponentUpdate(lastFolder || 'button');
      }, 500);
    });
  }

  setTimeout(() => pushComponentUpdate('button'), 1500);
}

async function main(): Promise<void> {
  const isWatch = process.argv.includes('--watch');
  try {
    const fileKey = getFileKey();
    const token = getToken();
    await syncComponents(fileKey, token, process.argv.includes('--force'));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[FigmaComponents] Using cached catalog (${outputPath}). Remote check skipped: ${msg.split('\n')[0]}`);
  }

  if (isWatch) {
    setupLiveBiDirectionalBridge();
    console.log(`[FigmaComponents] Watching Figma catalog & local code changes; checking every ${syncIntervalMs / 1000} seconds.`);
    let syncInProgress = false;
    setInterval(() => {
      if (syncInProgress) return;
      syncInProgress = true;
      try {
        const fileKey = getFileKey();
        const token = getToken();
        void syncComponents(fileKey, token)
          .catch(() => {
            // Keep using cached catalog silently during watch loop
          })
          .finally(() => {
            syncInProgress = false;
          });
      } catch {
        syncInProgress = false;
      }
    }, syncIntervalMs);
  }
}

void main().catch((error: unknown) => {
  console.warn('[FigmaComponents] Non-fatal error:', error);
});
