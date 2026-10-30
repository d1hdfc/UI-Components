'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
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

  // Ignore templates and internal tokens
  if (name.startsWith('@') || name.startsWith('_') || name.startsWith('rowAlpha') || name === 'Component') {
    return false;
  }

  // Must be a component or component set
  return node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';
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

  const versionsData = await figmaApi.getFileVersions(fileKey);
  const latestVersion = versionsData.versions?.[0]?.id || 'unknown';
  console.log(`[FigmaToCode] Latest Figma File Version: ${latestVersion}`);

  const syncState = loadSyncState();

  console.log('[FigmaToCode] Fetching top-level document structure from Figma REST API (depth=2)...');
  const fileData = await figmaApi.getFile(fileKey, 2);
  const document = fileData.document;

  if (!document || !Array.isArray(document.children)) {
    throw new Error('Figma API returned invalid document structure.');
  }

  // Collect UI components
  const currentFigmaComponents = new Map();

  for (const page of document.children) {
    if (page.type === 'CANVAS' && !IGNORED_PAGES.has(page.name)) {
      for (const child of page.children || []) {
        if (isUIComponent(child, page.name)) {
          currentFigmaComponents.set(child.id, {
            id: child.id,
            name: child.name,
            type: child.type,
            pageName: page.name,
            node: child
          });
        }
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

    if (!prev) {
      if (componentDirExists) {
        codeGenerator.generateComponentFiles(comp.node, { preserveExistingReact: true });
        syncState.components[id] = {
          id,
          name: comp.name,
          type: comp.type,
          pageName: comp.pageName,
          updatedAt: new Date().toISOString()
        };
      } else {
        console.log(`[FigmaToCode] ➕ New Component detected from Figma: "${comp.name}" (${id})`);
        codeGenerator.generateComponentFiles(comp.node);
        syncState.components[id] = {
          id,
          name: comp.name,
          type: comp.type,
          pageName: comp.pageName,
          updatedAt: new Date().toISOString()
        };
        createdCount++;
      }
    } else if (prev.name !== comp.name || options.force) {
      console.log(`[FigmaToCode] 🔄 Updated Component detected: "${comp.name}" (${id})`);
      codeGenerator.generateComponentFiles(comp.node);
      syncState.components[id] = {
        ...prev,
        name: comp.name,
        updatedAt: new Date().toISOString()
      };
      updatedCount++;
    }
  }

  // 2. Detect Deleted Components
  for (const [id, prev] of Object.entries(syncState.components)) {
    if (!currentFigmaComponents.has(id)) {
      console.log(`[FigmaToCode] ❌ Deleted Component in Figma: "${prev.name}" (${id})`);
      codeGenerator.deleteComponentFiles(prev.name);
      delete syncState.components[id];
      deletedCount++;
    }
  }

  syncState.version = latestVersion;
  syncState.lastSync = new Date().toISOString();
  saveSyncState(syncState);

  console.log(`[FigmaToCode] Summary: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted.`);

  // 3. Auto-commit and push to GitHub if changes occurred
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
    console.log(`[CodeToFigma] Batch attaching ${toCreate.length} new Dev Resources to Figma...`);
    // Batch in groups of 10 to respect payload limits
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10);
      try {
        const res = await figmaApi.createDevResources(fileKey, batch);
        attachedCount += res.links_created?.length || batch.length;
      } catch (devErr) {
        console.warn('[CodeToFigma] Batch Dev Resource warning:', devErr.message);
      }
    }
  }

  console.log(`[CodeToFigma] Completed: ${attachedCount} new Dev Resources attached, ${skippedCount} already linked.`);
}

/**
 * CLI Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--generate-existing')) {
    console.log('[CLI] Generating Flutter & HTML/CSS for all existing components...');
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
    console.log('[CLI] Step 1: Ensuring all components have React, Flutter, and HTML/CSS...');
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
  syncFigmaToCode,
  syncCodeToFigma
};
