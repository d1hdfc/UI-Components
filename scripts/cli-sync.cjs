'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const figmaApi = require('./figma-rest-api.cjs');
const codeGenerator = require('./code-generator.cjs');
const codeParser = require('./code-parser.cjs');
const gitSync = require('./git-sync.cjs');

const STATE_FILE = path.join(process.cwd(), '.sync-state.json');
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');

const IGNORED_PAGES = new Set([
  'Variables',
  'Thumbnail',
  'Get started',
  'Changelog',
  'Understanding the version',
  '-------------',
  '---------',
  '------',
  '----------',
  'Colors',
  'Spatial tokens',
  'Grid & Columns',
  'Typography',
  'Global Size',
  'Accessibility',
  'Border',
  'Radius',
  'Gradient',
  'Elevation',
  'derpicated items',
  'global_token_architecture'
]);

function loadSyncState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      // ignore
    }
  }
  return { version: null, components: {} };
}

function saveSyncState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function isUIComponent(node, pageName) {
  if (IGNORED_PAGES.has(pageName)) return false;
  if (!node.name) return false;
  const name = node.name.trim();

  if (name.startsWith('@') || name.startsWith('_') || name.startsWith('rowAlpha') || name === 'Component') {
    return false;
  }

  return node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';
}

function collectUIComponents(node, pageName, components) {
  if (node.type === 'INSTANCE') return;

  if (isUIComponent(node, pageName)) {
    components.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      pageName,
      node
    });
    return;
  }

  for (const child of node.children || []) {
    collectUIComponents(child, pageName, components);
  }
}

function getComponentSignature(node) {
  return createHash('sha256').update(JSON.stringify(node)).digest('hex');
}

function removeFromIndexTs(componentName) {
  const indexPath = path.join(process.cwd(), 'src', 'components', 'index.ts');
  if (!fs.existsSync(indexPath)) return;

  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    const kebab = componentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.includes(`/${kebab}/`) && !line.includes(`/${kebab}'`));
    if (filtered.length !== lines.length) {
      fs.writeFileSync(indexPath, filtered.join('\n'), 'utf8');
      console.log(`[FigmaToCode] Removed exports for "${componentName}" from index.ts`);
    }
  } catch (err) {
    console.warn('[FigmaToCode] Could not update index.ts:', err.message);
  }
}

async function notifyUIServer(event, data) {
  try {
    const http = require('node:http');
    const body = JSON.stringify({ event, ...data, timestamp: new Date().toISOString() });
    await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3055,
        path: '/api/ui-notify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, resolve);
      req.on('error', resolve);
      req.write(body);
      req.end();
    });
  } catch { /* server not running, ignore */ }
}

/**
 * Perform Figma to Code Sync
 */
async function syncFigmaToCode(options = {}) {
  console.log('\n=============================================');
  console.log('🔄  Starting Figma to Code Auto-Sync Pipeline');
  console.log('=============================================');

  const fileKey = figmaApi.getFileKey();
  console.log(`[FigmaToCode] Target File Key: ${fileKey}`);

  let versionsData;
  let fileData;
  try {
    versionsData = await figmaApi.getFileVersions(fileKey);
    const latestVersion = versionsData.versions?.[0]?.id || 'unknown';
    console.log(`[FigmaToCode] Latest Figma File Version: ${latestVersion}`);
    console.log('[FigmaToCode] Fetching document structure from Figma REST API...');
    fileData = await figmaApi.getFile(fileKey);
  } catch (apiErr) {
    console.warn(`[FigmaToCode] Remote Figma API skipped (${apiErr.message.split('\n')[0]}). Using local component state.`);
    if (options.commit) {
      console.log('[FigmaToCode] Staging local changes and committing to Git...');
      const result = gitSync.commitAndPush('auto-sync: local component & token updates');
      if (result.success) {
        console.log('[FigmaToCode] ✅ Successfully pushed to GitHub!');
      } else {
        console.log('[FigmaToCode] Git push status:', result.message || result.error);
      }
    }
    return { createdCount: 0, updatedCount: 0, deletedCount: 0 };
  }

  const latestVersion = versionsData.versions?.[0]?.id || 'unknown';
  const syncState = loadSyncState();
  const document = fileData.document;

  if (!document || !Array.isArray(document.children)) {
    throw new Error('Figma API returned invalid document structure.');
  }

  const currentFigmaComponents = new Map();

  for (const page of document.children) {
    if (page.type === 'CANVAS' && !IGNORED_PAGES.has(page.name)) {
      for (const child of page.children || []) {
        collectUIComponents(child, page.name, currentFigmaComponents);
      }
    }
  }

  console.log(`[FigmaToCode] Identified ${currentFigmaComponents.size} UI components in Figma file.`);

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  // 1. Detect Added and Updated Components
  for (const [id, comp] of currentFigmaComponents.entries()) {
    const prev = syncState.components[id];
    const kebab = codeGenerator.toKebabCase(comp.name);
    const componentDirExists = fs.existsSync(path.join(COMPONENTS_DIR, kebab));
    const signature = getComponentSignature(comp.node);

    if (!prev) {
      if (componentDirExists) {
        codeGenerator.generateComponentFiles(comp.node, { preserveExistingReact: true });
        syncState.components[id] = {
          id,
          name: comp.name,
          type: comp.type,
          pageName: comp.pageName,
          signature,
          generated: false,
          updatedAt: new Date().toISOString()
        };
      } else {
        console.log(`[FigmaSync] ADDED: Component <${comp.name}> in src/components/${kebab}`);
        codeGenerator.generateComponentFiles(comp.node);
        syncState.components[id] = {
          id,
          name: comp.name,
          type: comp.type,
          pageName: comp.pageName,
          signature,
          generated: true,
          updatedAt: new Date().toISOString()
        };
        createdCount++;
      }
    } else if (prev.name !== comp.name || (prev.signature && prev.signature !== signature) || options.force) {
      console.log(`[FigmaSync] UPDATED: Component <${comp.name}> styles modified`);
      codeGenerator.generateComponentFiles(comp.node, { preserveExistingReact: !prev.generated });
      syncState.components[id] = {
        ...prev,
        name: comp.name,
        type: comp.type,
        pageName: comp.pageName,
        signature,
        updatedAt: new Date().toISOString()
      };
      updatedCount++;
    } else if (!prev.signature) {
      codeGenerator.generateComponentFiles(comp.node, { preserveExistingReact: true });
      syncState.components[id] = {
        ...prev,
        type: comp.type,
        pageName: comp.pageName,
        signature,
        generated: false,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // 2. Detect Deleted Components
  for (const [id, prev] of Object.entries(syncState.components)) {
    if (!currentFigmaComponents.has(id)) {
      console.log(`[FigmaSync] DELETED: Variant <${prev.name}> removed from src/components and UI pages`);
      codeGenerator.deleteComponentFiles(prev.name);
      removeFromIndexTs(prev.name);
      await notifyUIServer('CODE_COMPONENT_DELETED', { componentName: prev.name, nodeId: id });
      delete syncState.components[id];
      deletedCount++;
    }
  }

  syncState.version = latestVersion;
  syncState.lastSync = new Date().toISOString();
  saveSyncState(syncState);

  console.log(`[FigmaToCode] Summary: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted.`);

  if (createdCount > 0 || updatedCount > 0 || deletedCount > 0 || options.commit) {
    console.log('[FigmaToCode] Staging changes and committing to Git...');
    const result = gitSync.commitAndPush(
      `auto-sync: Figma to Code (+${createdCount} ~${updatedCount} -${deletedCount})`
    );
    if (result.success) {
      console.log('[FigmaToCode] ✅ Successfully pushed to GitHub!');
    } else {
      console.log('[FigmaToCode] Git push result:', result.message || result.error);
    }
  } else {
    console.log('[FigmaToCode] All components are already up to date.');
  }

  return { createdCount, updatedCount, deletedCount };
}

/**
 * Perform Code to Figma Sync
 */
async function syncCodeToFigma(options = {}) {
  console.log('\n=============================================');
  console.log('🔄  Starting Code to Figma Auto-Sync Pipeline');
  console.log('=============================================');

  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.log('[CodeToFigma] Components directory not found.');
    return;
  }

  // Push live style update for primary components (e.g. button) over WebSocket to Figma plugin
  const targetFolder = options.componentFolder || 'button';
  if (fs.existsSync(path.join(COMPONENTS_DIR, targetFolder))) {
    const compData = codeParser.parseComponentDir(targetFolder);
    console.log(`[CodeWatcher] CHANGED: src/components/${compData.folder}/${compData.componentName} -> Syncing to Figma Canvas`);
    console.log(`[FigmaSync] UPDATED: Component <${compData.componentName}> styles modified — fontSize=${compData.fontSize ?? 'n/a'}px, cornerRadius=${compData.cornerRadius ?? 'n/a'}px`);
    await notifyUIServer('CODE_TO_FIGMA_UPDATE', {
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
  }

  const fileKey = figmaApi.getFileKey();
  let existingDevResources = [];
  try {
    const res = await figmaApi.getDevResources(fileKey);
    existingDevResources = res.dev_resources || [];
  } catch {
    // ignore
  }

  const existingMap = new Map();
  for (const r of existingDevResources) {
    existingMap.set(`${r.node_id}|${r.url}`, r.id);
  }

  const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  let attachedCount = 0;
  let skippedCount = 0;
  const toCreate = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;
    const folder = entry.name;
    const compData = codeParser.parseComponentDir(folder);

    if (compData.nodeId) {
      const repoUrl = `https://github.com/d1hdfc/UI-Components/blob/main/src/components/${folder}/${compData.componentName}.tsx`;
      const key = `${compData.nodeId}|${repoUrl}`;

      if (existingMap.has(key)) {
        skippedCount++;
        continue;
      }

      toCreate.push({
        name: `${compData.componentName} (Code Component)`,
        url: repoUrl,
        nodeId: compData.nodeId
      });
    }
  }

  if (toCreate.length > 0) {
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10);
      try {
        const res = await figmaApi.createDevResources(fileKey, batch);
        attachedCount += res.links_created?.length || batch.length;
      } catch {
        // Ignore when file is local copy
      }
    }
  }

  console.log(`[CodeToFigma] Completed: live canvas event broadcasted (${attachedCount} new Dev Resources attached, ${skippedCount} already linked).`);
}

/**
 * CLI Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--generate-existing')) {
    console.log('[CLI] Generating Flutter & HTML for all existing components...');
    codeGenerator.generateForExistingComponents();
    console.log('[CLI] ✅ Multi-framework code generation complete.');
    return;
  }

  if (args.includes('--code-to-figma')) {
    await syncCodeToFigma();
    return;
  }

  if (args.includes('--figma-to-code')) {
    await syncFigmaToCode({ commit: args.includes('--commit') });
    return;
  }

  if (args.includes('--all') || args.length === 0) {
    console.log('[CLI] Step 1: Ensuring all components have React, Flutter, and HTML...');
    codeGenerator.generateForExistingComponents();

    console.log('[CLI] Step 2: Running Code to Figma sync...');
    await syncCodeToFigma();

    console.log('[CLI] Step 3: Running Figma to Code sync...');
    await syncFigmaToCode({ commit: true });

    console.log('\n=============================================');
    console.log('🎉 Full Bi-Directional Auto-Sync Complete!');
    console.log('=============================================');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Auto-sync failed:', err);
    process.exit(1);
  });
}

module.exports = {
  getComponentSignature,
  syncFigmaToCode,
  syncCodeToFigma
};
