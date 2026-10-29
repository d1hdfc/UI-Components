import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type FigmaNode = {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    width: number;
    height: number;
  };
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

type FigmaComponentEntry = {
  key: string;
  name: string;
  description: string;
  nodeId: string;
  thumbnailUrl: string;
};

type FigmaComponentCatalog = {
  fileKey: string;
  version: string;
  components: FigmaComponentEntry[];
};

const syncIntervalMs = 60_000;
const configPath = path.join(process.cwd(), '.mcp', 'config.json');
const outputPath = path.join(process.cwd(), 'src', 'figma', 'components.json');
const previewDirectory = path.join(process.cwd(), 'public', 'figma', 'components');

function getFileKey(): string {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as SyncConfig;
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
  const token = process.env.FIGMA_PERSONAL_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN is missing. Add it to the local .env file or shell environment.');
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

function summarizePage(page: FigmaNode): {
  componentCount: number;
  componentSetCount: number;
  previewNodeId: string;
} {
  let componentCount = 0;
  let componentSetCount = 0;
  let largestComponentNodeId = '';
  let largestComponentArea = 0;
  let largestComponentSetNodeId = '';
  let largestComponentSetArea = 0;

  const visit = (node: FigmaNode) => {
    if (node.type === 'INSTANCE') return;

    const area = (node.absoluteBoundingBox?.width ?? 0) * (node.absoluteBoundingBox?.height ?? 0);
    if (node.type === 'COMPONENT') {
      componentCount += 1;
      if (area > largestComponentArea) {
        largestComponentNodeId = node.id;
        largestComponentArea = area;
      }
    } else if (node.type === 'COMPONENT_SET') {
      componentSetCount += 1;
      if (area > largestComponentSetArea) {
        largestComponentSetNodeId = node.id;
        largestComponentSetArea = area;
      }
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  for (const child of page.children ?? []) {
    visit(child);
  }

  return {
    componentCount,
    componentSetCount,
    previewNodeId: largestComponentSetNodeId || largestComponentNodeId
  };
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
    component.thumbnailUrl.startsWith('/figma/components/')
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
    .map((page) => ({ page, summary: summarizePage(page) }))
    .filter(({ summary }) => summary.componentCount + summary.componentSetCount > 0);

  const previewNodeIds = components.map(({ summary }) => summary.previewNodeId).filter(Boolean);
  const previews = previewNodeIds.length > 0
    ? await fetchFigmaJson<FigmaImages>(
      `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${previewNodeIds.map(encodeURIComponent).join(',')}&format=png&scale=0.25`,
      token
    )
    : { images: {} };

  fs.mkdirSync(previewDirectory, { recursive: true });
  const entries = await Promise.all(components.map(async ({ page, summary }) => {
    const previewUrl = summary.previewNodeId ? previews.images?.[summary.previewNodeId] : undefined;
    const safeNodeId = page.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    let thumbnailUrl = '';

    if (previewUrl) {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error(`Figma preview download failed (${response.status} ${response.statusText}) for "${page.name}".`);
      }

      fs.writeFileSync(path.join(previewDirectory, `${safeNodeId}.png`), Buffer.from(await response.arrayBuffer()));
      thumbnailUrl = `/figma/components/${safeNodeId}.png`;
    }

    return {
      key: page.id,
      name: page.name,
      description: `${summary.componentCount} components · ${summary.componentSetCount} component sets`,
      nodeId: page.id,
      thumbnailUrl
    };
  }));

  const currentKeys = new Set(components.map(({ page }) => page.id));
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
  console.log(`Synced ${catalog.components.length} component pages from ${file.name} to ${outputPath}`);
}

async function main(): Promise<void> {
  const fileKey = getFileKey();
  const token = getToken();
  await syncComponents(fileKey, token, process.argv.includes('--force'));

  if (process.argv.includes('--watch')) {
    console.log(`Watching Figma file versions; checking every ${syncIntervalMs / 1000} seconds.`);
    let syncInProgress = false;
    setInterval(() => {
      if (syncInProgress) return;
      syncInProgress = true;
      void syncComponents(fileKey, token)
        .catch((error: unknown) => {
          console.error('Figma component sync failed:', error);
        })
        .finally(() => {
          syncInProgress = false;
        });
    }, syncIntervalMs);
  }
}

void main().catch((error: unknown) => {
  console.error('Figma component sync failed:', error);
  process.exitCode = 1;
});
