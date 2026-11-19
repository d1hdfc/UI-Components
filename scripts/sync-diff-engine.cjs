'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const codeGenerator = require('./code-generator.cjs');
const codeParser = require('./code-parser.cjs');
const docsGenerator = require('./docs-generator.cjs');

const getComponentsDir = () => path.join(process.cwd(), 'src', 'components');
const getPagesDir = () => path.join(process.cwd(), 'src', 'app', 'pages');
const getTokensVariablesDir = () => path.join(process.cwd(), 'src', 'tokens', 'variables');
const getStateFile = () => path.join(process.cwd(), '.sync-state.json');
const getHistoryFile = () => path.join(process.cwd(), 'src', 'figma', 'syncHistory.json');

function hashString(str) {
  return crypto.createHash('sha1').update(String(str || ''), 'utf8').digest('hex').slice(0, 12);
}

function rgbObjToHex(rgb) {
  if (!rgb || typeof rgb.r !== 'number') return null;
  const toByte = (c) => Math.round(Math.max(0, Math.min(1, c || 0)) * 255);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(toByte(rgb.r))}${toHex(toByte(rgb.g))}${toHex(toByte(rgb.b))}`.toUpperCase();
}

function colorsAreDifferent(hexA, hexB) {
  if (!hexA || !hexB) return false;
  const cleanA = hexA.replace('#', '').toUpperCase();
  const cleanB = hexB.replace('#', '').toUpperCase();
  if (cleanA === cleanB) return false;
  const rA = parseInt(cleanA.slice(0, 2), 16);
  const gA = parseInt(cleanA.slice(2, 4), 16);
  const bA = parseInt(cleanA.slice(4, 6), 16);
  const rB = parseInt(cleanB.slice(0, 2), 16);
  const gB = parseInt(cleanB.slice(2, 4), 16);
  const bB = parseInt(cleanB.slice(4, 6), 16);
  return Math.abs(rA - rB) > 2 || Math.abs(gA - gB) > 2 || Math.abs(bA - bB) > 2;
}

function loadSyncState() {
  const sf = getStateFile();
  if (fs.existsSync(sf)) {
    try {
      return JSON.parse(fs.readFileSync(sf, 'utf8'));
    } catch { /* ignore */ }
  }
  return { version: null, components: {} };
}

function saveSyncState(state) {
  try {
    fs.writeFileSync(getStateFile(), JSON.stringify(state, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function loadSyncHistory() {
  const hf = getHistoryFile();
  if (fs.existsSync(hf)) {
    try {
      return JSON.parse(fs.readFileSync(hf, 'utf8'));
    } catch { /* ignore */ }
  }
  return { lastUpdated: new Date().toISOString(), entries: [] };
}

function saveSyncHistory(history) {
  const hf = getHistoryFile();
  try {
    fs.mkdirSync(path.dirname(hf), { recursive: true });
    fs.writeFileSync(hf, JSON.stringify(history, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function appendSyncHistoryEntries(newEntries) {
  if (!Array.isArray(newEntries) || newEntries.length === 0) return loadSyncHistory();
  const history = loadSyncHistory();
  const existing = Array.isArray(history.entries) ? history.entries : [];
  history.lastUpdated = new Date().toISOString();
  history.entries = [...newEntries, ...existing].slice(0, 40);
  saveSyncHistory(history);
  return history;
}

/**
 * Read the 5 files of a component + its page file from disk
 */
function readComponentBundleSnapshot(kebab) {
  const compDir = path.join(getComponentsDir(), kebab);
  const pascal = codeGenerator.toPascalCase(kebab);
  const pageName = `${pascal}Page`;
  const pageDir = path.join(getPagesDir(), pageName);

  const readSafe = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
  const tsx = readSafe(path.join(compDir, `${kebab}.tsx`));
  const types = readSafe(path.join(compDir, `${kebab}.types.ts`));
  const scss = readSafe(path.join(compDir, `${kebab}.scss`));
  const dart = readSafe(path.join(compDir, `${kebab}.dart`));
  const md = readSafe(path.join(compDir, `${kebab}.md`));
  const pageTsx = readSafe(path.join(pageDir, `${pageName}.tsx`));

  const combinedHash = hashString(`${tsx}\n---\n${types}\n---\n${scss}\n---\n${dart}`);
  return {
    kebab,
    pascal,
    pageName,
    exists: fs.existsSync(compDir) && Boolean(tsx),
    pageExists: fs.existsSync(pageDir) && Boolean(pageTsx),
    combinedHash,
    hashes: {
      tsx: hashString(tsx),
      types: hashString(types),
      scss: hashString(scss),
      dart: hashString(dart),
      md: hashString(md)
    },
    files: { tsx, types, scss, dart, md, pageTsx }
  };
}

/**
 * Compute a concise unified line diff between two file strings
 */
function computeConciseDiff(beforeText, afterText, maxLines = 18) {
  const beforeLines = String(beforeText || '').replace(/\r\n/g, '\n').split('\n');
  const afterLines = String(afterText || '').replace(/\r\n/g, '\n').split('\n');

  if (!beforeText && afterText) {
    return afterLines
      .filter((l) => l.trim().length > 0)
      .slice(0, maxLines)
      .map((l) => `+ ${l}`)
      .join('\n');
  }
  if (beforeText && !afterText) {
    return beforeLines
      .filter((l) => l.trim().length > 0)
      .slice(0, maxLines)
      .map((l) => `- ${l}`)
      .join('\n');
  }

  const beforeSet = new Set(beforeLines.map((l) => l.trim()));
  const afterSet = new Set(afterLines.map((l) => l.trim()));

  const diffOut = [];
  for (const line of beforeLines) {
    const t = line.trim();
    if (t && !t.startsWith('//') && !t.startsWith('> Last updated:') && !afterSet.has(t)) {
      diffOut.push(`- ${line}`);
    }
  }
  for (const line of afterLines) {
    const t = line.trim();
    if (t && !t.startsWith('//') && !t.startsWith('> Last updated:') && !beforeSet.has(t)) {
      diffOut.push(`+ ${line}`);
    }
  }

  return diffOut.slice(0, maxLines).join('\n');
}

function parseVariantString(name) {
  const props = {};
  for (const part of String(name || '').split(',')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      props[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim().toLowerCase();
    }
  }
  return props;
}

/**
 * Dry-run check of what properties changed on a Figma component compared to local code
 */
function inspectFigmaVsCodeComponentChanges(compNode, fallbackPageName = '') {
  if (!compNode) return [];
  let rawName = compNode.parentComponentName || compNode.name;
  if (!rawName) return [];
  if (rawName.includes('=')) {
    rawName = compNode.pageName || fallbackPageName || 'button';
  }

  const kebab = codeGenerator.toKebabCase(rawName);
  const compDir = path.join(getComponentsDir(), kebab);
  if (!fs.existsSync(compDir)) return [];

  const currentParsed = codeParser.parseComponentDir(kebab);
  const changes = [];

  const variantNodes = [];
  const topVariantProps = (compNode.variantProps && Object.keys(compNode.variantProps).length > 0)
    ? compNode.variantProps
    : (compNode.name && compNode.name.includes('=') ? parseVariantString(compNode.name) : {});

  if (Object.keys(topVariantProps).length > 0) {
    variantNodes.push({
      ...compNode,
      variantProps: topVariantProps,
      isSelected: Boolean(compNode.isSelected)
    });
  }

  if (Array.isArray(compNode.children) && compNode.children.length > 0) {
    const hydratedChildren = compNode.children.map((c) => ({
      ...c,
      variantProps: (c.variantProps && Object.keys(c.variantProps).length > 0)
        ? c.variantProps
        : parseVariantString(c.name)
    }));
    const selectedChildren = hydratedChildren.filter((c) => c.isSelected);
    const otherChildren = hydratedChildren.filter((c) => !c.isSelected);
    variantNodes.push(...selectedChildren, ...otherChildren);
  }

  if (variantNodes.length > 0) {
    const checkedSizes = new Set();
    const checkedVariantStates = new Set();

    for (const vNode of variantNodes) {
      const vProps = vNode.variantProps || {};
      const sizeKey = (vProps.size || vProps.sizes || '').toLowerCase();
      const styleKey = (vProps.style || vProps.variant || '').toLowerCase();
      const stateKey = (vProps.state || 'default').toLowerCase();
      const typeKey = (vProps.type || 'default').toLowerCase();

      const isCanonicalSizeVariant = !styleKey || styleKey === 'primary';
      if (sizeKey && currentParsed.sizesMap?.[sizeKey] && (vNode.isSelected || (isCanonicalSizeVariant && stateKey === 'default' && typeKey === 'default'))) {
        const sizeSpec = currentParsed.sizesMap[sizeKey];

        if (typeof vNode.fontSize === 'number' && vNode.fontSize > 0 && !checkedSizes.has(`${sizeKey}:font-size`)) {
          checkedSizes.add(`${sizeKey}:font-size`);
          if (sizeSpec['font-sizePx'] !== undefined && Math.round(vNode.fontSize) !== Math.round(sizeSpec['font-sizePx'])) {
            changes.push(`${sizeKey} font-size (${Math.round(sizeSpec['font-sizePx'])}px → ${Math.round(vNode.fontSize)}px)`);
          }
        }

        if (typeof vNode.height === 'number' && vNode.height > 0 && !checkedSizes.has(`${sizeKey}:height`)) {
          checkedSizes.add(`${sizeKey}:height`);
          if (sizeSpec.heightPx !== undefined && Math.round(vNode.height) !== Math.round(sizeSpec.heightPx)) {
            changes.push(`${sizeKey} height (${Math.round(sizeSpec.heightPx)}px → ${Math.round(vNode.height)}px)`);
          }
        }

        if (typeof vNode.paddingLeft === 'number' && vNode.paddingLeft >= 0 && typeKey !== 'icon' && !checkedSizes.has(`${sizeKey}:padding`)) {
          checkedSizes.add(`${sizeKey}:padding`);
          if (sizeSpec.paddingPx !== undefined && Math.round(vNode.paddingLeft) !== Math.round(sizeSpec.paddingPx)) {
            changes.push(`${sizeKey} horizontal padding (${Math.round(sizeSpec.paddingPx)}px → ${Math.round(vNode.paddingLeft)}px)`);
          }
        }

        if (typeof vNode.cornerRadius === 'number' && vNode.cornerRadius >= 0 && !checkedSizes.has(`${sizeKey}:radius`)) {
          checkedSizes.add(`${sizeKey}:radius`);
          if (sizeSpec.radiusPx !== undefined && Math.round(vNode.cornerRadius) !== Math.round(sizeSpec.radiusPx)) {
            changes.push(`${sizeKey} corner radius (${Math.round(sizeSpec.radiusPx)}px → ${Math.round(vNode.cornerRadius)}px)`);
          }
        }

        if (typeof vNode.itemSpacing === 'number' && vNode.itemSpacing >= 0 && !checkedSizes.has(`${sizeKey}:gap`)) {
          checkedSizes.add(`${sizeKey}:gap`);
          if (sizeSpec.gapPx !== undefined && Math.round(vNode.itemSpacing) !== Math.round(sizeSpec.gapPx)) {
            changes.push(`${sizeKey} gap (${Math.round(sizeSpec.gapPx)}px → ${Math.round(vNode.itemSpacing)}px)`);
          }
        }
      }

      const isCanonicalColorVariant = !sizeKey || sizeKey === 'large';
      if (styleKey && currentParsed.variantsMap?.[styleKey] && (vNode.isSelected || (isCanonicalColorVariant && typeKey === 'default'))) {
        const variantSpec = currentParsed.variantsMap[styleKey];
        const statePrefix = stateKey === 'hover' ? 'hover-'
          : (stateKey === 'pressed' || stateKey === 'active') ? 'active-'
            : stateKey === 'disabled' ? 'disabled-'
              : '';

        const bgPropName = `${statePrefix}background`;
        const currentBgRgb = variantSpec[`${bgPropName}Rgb`] || (statePrefix === '' ? variantSpec['background-colorRgb'] : null);
        const currentBgHex = rgbObjToHex(currentBgRgb);
        const incomingBgHex = vNode.backgroundColor?.hex;

        if (incomingBgHex && !checkedVariantStates.has(`${styleKey}:${bgPropName}`)) {
          checkedVariantStates.add(`${styleKey}:${bgPropName}`);
          if (currentBgHex && colorsAreDifferent(incomingBgHex, currentBgHex)) {
            changes.push(`${styleKey} ${stateKey !== 'default' ? `${stateKey} ` : ''}background color (${currentBgHex} → ${incomingBgHex})`);
          }
        }
      }
    }
  } else {
    if (
      typeof compNode.fontSize === 'number' &&
      compNode.fontSize > 0 &&
      currentParsed.fontSize &&
      Math.round(compNode.fontSize) !== Math.round(currentParsed.fontSize)
    ) {
      changes.push(`font-size (${Math.round(currentParsed.fontSize)}px → ${Math.round(compNode.fontSize)}px)`);
    }
  }

  return changes;
}

/**
 * Dry-run check of what token values in payload.tokenMap differ from local src/tokens/variables/*.scss
 */
function inspectTokenMapChanges(tokenMap) {
  if (!tokenMap || typeof tokenMap !== 'object') return [];
  const tokensVarsDir = getTokensVariablesDir();
  const changedTokens = [];

  const checkFile = (filePath, incomingMap) => {
    if (!fs.existsSync(filePath) || !incomingMap || typeof incomingMap !== 'object') return;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const [rawKey, newVal] of Object.entries(incomingMap)) {
      if (!newVal || typeof newVal !== 'string') continue;
      const escapedKey = rawKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const entryRegex = new RegExp(`(["']${escapedKey}["']\\s*:\\s*)((?:var\\([^)]*\\)|rgba?\\([^)]*\\)|[^,\\r\\n()])+)`);
      const m = content.match(entryRegex);
      if (m) {
        const cleanOld = m[2].trim();
        const cleanNew = newVal.trim();
        if (cleanOld !== cleanNew && !(cleanOld.startsWith('var(--') && !cleanNew.startsWith('var(--'))) {
          changedTokens.push(`--${rawKey} (${cleanOld} → ${cleanNew})`);
        }
      }
    }
  };

  if (tokenMap.semantics) checkFile(path.join(tokensVarsDir, 'semantics.scss'), tokenMap.semantics);
  if (tokenMap.alias) checkFile(path.join(tokensVarsDir, 'alias.scss'), tokenMap.alias);
  if (tokenMap.layout) checkFile(path.join(tokensVarsDir, 'layout.scss'), tokenMap.layout);

  return changedTokens;
}

/**
 * Compute granular Pre-Sync Diff for FIGMA -> CODE (or FIGMA -> GITHUB)
 * Only returns components/tokens that actually have additions, edits, or deletions.
 */
function computeFigmaToCodeDiff(payload) {
  const pendingChanges = [];
  const componentsDir = getComponentsDir();
  const pagesDir = getPagesDir();
  const syncState = loadSyncState();

  codeParser.invalidateTokenCache();

  // 1. Check Token Variable Changes
  const changedTokens = inspectTokenMapChanges(payload?.tokenMap);
  if (changedTokens.length > 0) {
    pendingChanges.push({
      id: 'tokens:variables',
      slug: 'tokens',
      componentName: 'Design Tokens',
      pageName: 'semantics.scss',
      action: 'update',
      direction: 'figma-to-code',
      title: `Update Design Tokens (${changedTokens.length})`,
      summary: `tokens: updated ${changedTokens.slice(0, 3).join(', ')}${changedTokens.length > 3 ? ` (+${changedTokens.length - 3} more)` : ''}`,
      details: changedTokens.slice(0, 10),
      files: ['src/tokens/variables/semantics.scss', 'src/tokens/variables/alias.scss', 'src/tokens/variables/layout.scss']
    });
  }

  // 2. Deduplicate incoming Figma components by kebab name
  const dedupedByKebab = new Map();
  if (Array.isArray(payload?.components)) {
    for (const comp of payload.components) {
      if (!comp || !comp.id || !comp.name) continue;
      const kebab = codeGenerator.toKebabCase(comp.name);
      if (!kebab || kebab === 'assets') continue;
      const existing = dedupedByKebab.get(kebab);
      if (!existing || (comp.type === 'COMPONENT_SET' && existing.type !== 'COMPONENT_SET')) {
        dedupedByKebab.set(kebab, comp);
      }
    }
  }

  // Merge selectedItems property edits into dedupedByKebab
  const selectedEditsByKebab = new Map();
  if (Array.isArray(payload?.selectedItems)) {
    for (const item of payload.selectedItems) {
      const resolvedName = (item.parentComponentName || item.name || '').includes('=')
        ? (item.pageName || payload.currentPageName || 'button')
        : (item.parentComponentName || item.name);
      if (!resolvedName) continue;
      const kebab = codeGenerator.toKebabCase(resolvedName);
      const itemChanges = inspectFigmaVsCodeComponentChanges(item, payload.currentPageName);
      if (itemChanges.length > 0) {
        const prev = selectedEditsByKebab.get(kebab) || [];
        selectedEditsByKebab.set(kebab, Array.from(new Set([...prev, ...itemChanges])));
      }
    }
  }

  const seenKebabs = new Set();
  for (const [kebab, comp] of dedupedByKebab.entries()) {
    seenKebabs.add(kebab);
    const pascal = codeGenerator.toPascalCase(kebab);
    const pageName = `${pascal}Page`;
    const compDir = path.join(componentsDir, kebab);
    const pageDir = path.join(pagesDir, pageName);

    const hasAllFiveFiles =
      fs.existsSync(compDir) &&
      fs.existsSync(path.join(compDir, `${kebab}.tsx`)) &&
      fs.existsSync(path.join(compDir, `${kebab}.types.ts`)) &&
      fs.existsSync(path.join(compDir, `${kebab}.scss`)) &&
      fs.existsSync(path.join(compDir, `${kebab}.dart`)) &&
      fs.existsSync(path.join(compDir, `${kebab}.md`));
    const hasPage = kebab === 'button'
      ? fs.existsSync(path.join(pagesDir, 'ButtonPage', 'ButtonPage.tsx'))
      : fs.existsSync(path.join(pageDir, `${pageName}.tsx`));

    if (!hasAllFiveFiles || !hasPage) {
      pendingChanges.push({
        id: comp.id,
        slug: kebab,
        componentName: pascal,
        pageName,
        action: 'add',
        direction: 'figma-to-code',
        title: `Add Component & Page: ${kebab} (${pageName})`,
        summary: `${kebab}: scaffold 5-file bundle in src/components/${kebab}/ & register ${pageName} in portal sidebar`,
        details: [
          `Create src/components/${kebab}/${kebab}.tsx, .types.ts, .scss, .dart, .md`,
          `Create src/app/pages/${pageName}/${pageName}.tsx, .ts, .scss & register route #${kebab}`
        ],
        files: [
          `src/components/${kebab}/${kebab}.tsx`,
          `src/components/${kebab}/${kebab}.types.ts`,
          `src/components/${kebab}/${kebab}.scss`,
          `src/components/${kebab}/${kebab}.dart`,
          `src/components/${kebab}/${kebab}.md`,
          `src/app/pages/${pageName}/${pageName}.tsx`
        ]
      });
    } else {
      // Check if this specific component has style/token/property changes in Figma
      const styleChanges = [
        ...(selectedEditsByKebab.get(kebab) || []),
        ...inspectFigmaVsCodeComponentChanges(comp, payload?.currentPageName)
      ];
      const uniqueStyleChanges = Array.from(new Set(styleChanges));

      // Also check if Figma metadata / variant specs / description changed in docs state
      let docChanges = [];
      try {
        const docsStateFile = path.join(process.cwd(), '.figma-docs-state.json');
        if (fs.existsSync(docsStateFile)) {
          const docsState = JSON.parse(fs.readFileSync(docsStateFile, 'utf8'));
          const prevDocSnap = docsState[kebab]?.snapshot;
          if (prevDocSnap) {
            const nextDocSnap = docsGenerator.buildSnapshot(comp);
            docChanges = docsGenerator.diffSnapshots(prevDocSnap, nextDocSnap);
          }
        }
      } catch { /* ignore */ }

      const allCompChanges = Array.from(new Set([...uniqueStyleChanges, ...docChanges]));
      if (allCompChanges.length > 0) {
        const shortList = allCompChanges.slice(0, 2).map((s) => s.replace(/`/g, '')).join('; ');
        const extra = allCompChanges.length > 2 ? ` (+${allCompChanges.length - 2} more)` : '';
        pendingChanges.push({
          id: comp.id,
          slug: kebab,
          componentName: pascal,
          pageName,
          action: 'update',
          direction: 'figma-to-code',
          title: `Update: ${kebab} (.scss, .md)`,
          summary: `${kebab}: updated ${shortList}${extra}`,
          details: allCompChanges.map((s) => s.replace(/`/g, '')),
          files: uniqueStyleChanges.length > 0
            ? [`src/components/${kebab}/${kebab}.scss`, `src/components/${kebab}/${kebab}.md`, 'src/tokens/variables/semantics.scss']
            : [`src/components/${kebab}/${kebab}.md`]
        });
      }
    }
  }

  // 3. Check for components deleted in Figma (present locally in src/components/ but removed from Figma canvas)
  const isFullScan = Boolean(payload?.isFullScan);
  const explicitDeletedKebabs = new Set(
    (Array.isArray(payload?.deletedComponents) ? payload.deletedComponents : [])
      .map((d) => codeGenerator.toKebabCase(typeof d === 'string' ? d : d?.name || ''))
      .filter(Boolean)
  );

  if (fs.existsSync(componentsDir)) {
    const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'assets') continue;
      const folderKebab = entry.name;
      if (seenKebabs.has(folderKebab)) continue;

      if (isFullScan || explicitDeletedKebabs.has(folderKebab)) {
        const pascal = codeGenerator.toPascalCase(folderKebab);
        const pageName = `${pascal}Page`;
        pendingChanges.push({
          id: `delete:${folderKebab}`,
          slug: folderKebab,
          componentName: pascal,
          pageName,
          action: 'delete',
          direction: 'figma-to-code',
          title: `Delete in Code: ${folderKebab} & ${pageName}`,
          summary: `${folderKebab}: remove src/components/${folderKebab}/ & ${pageName} because it was deleted in Figma`,
          details: [
            `Delete folder src/components/${folderKebab}/ and remove export from src/components/index.ts`,
            `Delete portal page src/app/pages/${pageName}/ and remove from sidebar`
          ],
          files: [
            `src/components/${folderKebab}/`,
            `src/app/pages/${pageName}/`,
            'src/components/index.ts'
          ]
        });
      }
    }
  }

  return pendingChanges;
}

/**
 * Compare parsed local code metrics & files against live Figma canvas component + last synced snapshot
 */
function inspectCodeVsFigmaComponentChanges(kebab, parsedCode, canvasComp, syncStateEntry) {
  const changes = [];
  const changedFiles = new Set();

  // 1. Check file hashes against last synced code snapshot in .sync-state.json
  const bundle = readComponentBundleSnapshot(kebab);
  const prevHashes = syncStateEntry?.codeHashes || null;
  const prevFiles = syncStateEntry?.codeFilesSnapshot || null;

  if (prevHashes) {
    if (prevHashes.scss && prevHashes.scss !== bundle.hashes.scss) {
      changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
    }
    if (prevHashes.tsx && prevHashes.tsx !== bundle.hashes.tsx) {
      changedFiles.add(`src/components/${kebab}/${kebab}.tsx`);
    }
    if (prevHashes.types && prevHashes.types !== bundle.hashes.types) {
      changedFiles.add(`src/components/${kebab}/${kebab}.types.ts`);
    }
    if (prevHashes.dart && prevHashes.dart !== bundle.hashes.dart) {
      changedFiles.add(`src/components/${kebab}/${kebab}.dart`);
    }
  }

  // 2. Compare resolved code style metrics against the Figma canvas node metrics
  if (canvasComp) {
    const variantNodes = [];
    if (Array.isArray(canvasComp.children) && canvasComp.children.length > 0) {
      for (const c of canvasComp.children) {
        variantNodes.push({
          ...c,
          variantProps: (c.variantProps && Object.keys(c.variantProps).length > 0)
            ? c.variantProps
            : parseVariantString(c.name)
        });
      }
    }

    if (variantNodes.length > 0) {
      const checkedSizes = new Set();
      const checkedVariants = new Set();

      for (const vNode of variantNodes) {
        const vProps = vNode.variantProps || {};
        const sizeKey = (vProps.size || vProps.sizes || '').toLowerCase();
        const styleKey = (vProps.style || vProps.variant || '').toLowerCase();
        const stateKey = (vProps.state || 'default').toLowerCase();
        const typeKey = (vProps.type || 'default').toLowerCase();

        const isCanonicalSizeVariant = !styleKey || styleKey === 'primary';
        if (sizeKey && parsedCode.sizesMap?.[sizeKey] && isCanonicalSizeVariant && stateKey === 'default' && typeKey === 'default') {
          const sizeSpec = parsedCode.sizesMap[sizeKey];

          if (sizeSpec['font-sizePx'] !== undefined && typeof vNode.fontSize === 'number' && !checkedSizes.has(`${sizeKey}:font-size`)) {
            checkedSizes.add(`${sizeKey}:font-size`);
            if (Math.round(sizeSpec['font-sizePx']) !== Math.round(vNode.fontSize)) {
              changes.push(`${sizeKey} font-size (${Math.round(vNode.fontSize)}px → ${Math.round(sizeSpec['font-sizePx'])}px)`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }

          if (sizeSpec.heightPx !== undefined && typeof vNode.height === 'number' && !checkedSizes.has(`${sizeKey}:height`)) {
            checkedSizes.add(`${sizeKey}:height`);
            if (Math.round(sizeSpec.heightPx) !== Math.round(vNode.height)) {
              changes.push(`${sizeKey} height (${Math.round(vNode.height)}px → ${Math.round(sizeSpec.heightPx)}px)`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }

          if (sizeSpec.paddingPx !== undefined && typeof vNode.paddingLeft === 'number' && typeKey !== 'icon' && !checkedSizes.has(`${sizeKey}:padding`)) {
            checkedSizes.add(`${sizeKey}:padding`);
            if (Math.round(sizeSpec.paddingPx) !== Math.round(vNode.paddingLeft)) {
              changes.push(`${sizeKey} padding (${Math.round(vNode.paddingLeft)}px → ${Math.round(sizeSpec.paddingPx)}px)`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }

          if (sizeSpec.radiusPx !== undefined && typeof vNode.cornerRadius === 'number' && !checkedSizes.has(`${sizeKey}:radius`)) {
            checkedSizes.add(`${sizeKey}:radius`);
            if (Math.round(sizeSpec.radiusPx) !== Math.round(vNode.cornerRadius)) {
              changes.push(`${sizeKey} corner radius (${Math.round(vNode.cornerRadius)}px → ${Math.round(sizeSpec.radiusPx)}px)`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }

          if (sizeSpec.gapPx !== undefined && typeof vNode.itemSpacing === 'number' && !checkedSizes.has(`${sizeKey}:gap`)) {
            checkedSizes.add(`${sizeKey}:gap`);
            if (Math.round(sizeSpec.gapPx) !== Math.round(vNode.itemSpacing)) {
              changes.push(`${sizeKey} gap (${Math.round(vNode.itemSpacing)}px → ${Math.round(sizeSpec.gapPx)}px)`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }
        }

        const isCanonicalColorVariant = !sizeKey || sizeKey === 'large';
        if (styleKey && parsedCode.variantsMap?.[styleKey] && isCanonicalColorVariant && typeKey === 'default' && stateKey === 'default') {
          const variantSpec = parsedCode.variantsMap[styleKey];
          const codeBgRgb = variantSpec.backgroundRgb || variantSpec['background-colorRgb'];
          const codeBgHex = rgbObjToHex(codeBgRgb);
          const figmaBgHex = vNode.backgroundColor?.hex;

          if (codeBgHex && figmaBgHex && !checkedVariants.has(`${styleKey}:bg`)) {
            checkedVariants.add(`${styleKey}:bg`);
            if (colorsAreDifferent(codeBgHex, figmaBgHex)) {
              changes.push(`${styleKey} background (${figmaBgHex} → ${codeBgHex})`);
              changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
            }
          }
        }
      }
    } else {
      if (parsedCode.fontSize && typeof canvasComp.fontSize === 'number' && Math.round(parsedCode.fontSize) !== Math.round(canvasComp.fontSize)) {
        changes.push(`font-size (${Math.round(canvasComp.fontSize)}px → ${Math.round(parsedCode.fontSize)}px)`);
        changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
      }
      if (parsedCode.cornerRadius !== null && typeof canvasComp.cornerRadius === 'number' && Math.round(parsedCode.cornerRadius) !== Math.round(canvasComp.cornerRadius)) {
        changes.push(`corner radius (${Math.round(canvasComp.cornerRadius)}px → ${Math.round(parsedCode.cornerRadius)}px)`);
        changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
      }
      if (parsedCode.height && typeof canvasComp.height === 'number' && Math.round(parsedCode.height) !== Math.round(canvasComp.height)) {
        changes.push(`height (${Math.round(canvasComp.height)}px → ${Math.round(parsedCode.height)}px)`);
        changedFiles.add(`src/components/${kebab}/${kebab}.scss`);
      }
    }
  }

  // 3. If file hash changed (e.g. developer edited .tsx, .scss, or .types.ts) even if canvas metric numbers look similar
  if (changes.length === 0 && changedFiles.size > 0) {
    for (const fileRel of changedFiles) {
      const ext = path.extname(fileRel).replace('.', '');
      if (prevFiles && prevFiles[ext]) {
        const diffSnippet = computeConciseDiff(prevFiles[ext], bundle.files[ext], 4);
        if (diffSnippet) {
          changes.push(`modified ${path.basename(fileRel)}`);
        }
      } else {
        changes.push(`modified ${path.basename(fileRel)}`);
      }
    }
  }

  return {
    changes,
    changedFiles: Array.from(changedFiles)
  };
}

/**
 * Compute granular Pre-Sync Diff for CODE -> FIGMA
 * Detects:
 * 1. Components deleted in local code (src/components/<kebab> or <Pascal>Page removed) -> Delete on Figma
 * 2. Components modified in local code (.scss / .tsx / .types.ts / token variables) -> Update on Figma
 * 3. New components created in local code -> Create on Figma
 */
function computeCodeToFigmaDiff(payload = {}) {
  const pendingChanges = [];
  const componentsDir = getComponentsDir();
  const pagesDir = getPagesDir();
  const syncState = loadSyncState();

  codeParser.invalidateTokenCache();

  // Map incoming Figma canvas components by kebab name
  const canvasByKebab = new Map();
  if (Array.isArray(payload.components)) {
    for (const comp of payload.components) {
      if (!comp || !comp.name) continue;
      const kebab = codeGenerator.toKebabCase(comp.name);
      if (!kebab || kebab === 'assets') continue;
      const existing = canvasByKebab.get(kebab);
      if (!existing || (comp.type === 'COMPONENT_SET' && existing.type !== 'COMPONENT_SET')) {
        canvasByKebab.set(kebab, comp);
      }
    }
  }

  // Map syncState entries by kebab name
  const stateByKebab = new Map();
  for (const [id, entry] of Object.entries(syncState.components || {})) {
    if (!entry) continue;
    const kebab = entry.kebab || codeGenerator.toKebabCase(entry.name || '');
    if (!kebab) continue;
    if (!stateByKebab.has(kebab) || !String(id).startsWith('local:')) {
      stateByKebab.set(kebab, { ...entry, id });
    }
  }

  // Gather currently existing local component folders
  const localFolders = new Set();
  if (fs.existsSync(componentsDir)) {
    for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'assets') continue;
      const kebab = codeGenerator.toKebabCase(entry.name);
      const compDir = path.join(componentsDir, entry.name);
      const hasTsx = fs.readdirSync(compDir).some((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
      if (hasTsx) {
        localFolders.add(kebab);
      }
    }
  }

  // 1. Check for DELETED components in local code:
  // Any component that exists on the Figma canvas (or in .sync-state.json)
  // whose src/components/<kebab> folder was deleted (or whose <Pascal>Page was deleted after being synced)
  const candidateKnownKebabs = new Set([
    ...canvasByKebab.keys(),
    ...stateByKebab.keys()
  ]);

  for (const kebab of candidateKnownKebabs) {
    const pascal = codeGenerator.toPascalCase(kebab);
    const pageName = `${pascal}Page`;
    const pageExists = kebab === 'button'
      ? fs.existsSync(path.join(pagesDir, 'ButtonPage'))
      : fs.existsSync(path.join(pagesDir, pageName));
    const compFolderExists = localFolders.has(kebab);
    const wasTrackedInState = stateByKebab.has(kebab);

    // A component is considered deleted in local code if:
    // - its src/components/<kebab> folder is gone, OR
    // - it was tracked in .sync-state.json and its src/app/pages/<Pascal>Page folder was deleted by the user
    if (!compFolderExists || (wasTrackedInState && !pageExists)) {
      const canvasComp = canvasByKebab.get(kebab);
      const stateEntry = stateByKebab.get(kebab);
      const targetNodeId = canvasComp?.id || (stateEntry && !String(stateEntry.id).startsWith('local:') ? stateEntry.id : null);
      const displayCompName = canvasComp?.name || stateEntry?.name || kebab;
      const figmaPageName = canvasComp?.pageName || stateEntry?.pageName || null;

      pendingChanges.push({
        id: targetNodeId || `delete:${kebab}`,
        slug: kebab,
        componentName: displayCompName,
        nodeId: targetNodeId,
        figmaPageName,
        pageName,
        action: 'delete',
        direction: 'code-to-figma',
        title: `Delete on Figma: ${displayCompName}`,
        summary: `${kebab}: remove from Figma canvas${figmaPageName ? ` (page "${figmaPageName}")` : ''} because it was deleted in local code`,
        details: [
          `Remove "${displayCompName}" component/frame${figmaPageName ? ` & page "${figmaPageName}"` : ''} from Figma canvas`,
          `Clean up any remaining references in src/components/index.ts & src/app/pages/${pageName}`
        ],
        files: [
          `src/components/${kebab}/`,
          `src/app/pages/${pageName}/`,
          'src/components/index.ts'
        ]
      });
    }
  }

  // 2. Check for ADDED or UPDATED components in local code
  for (const kebab of localFolders) {
    // Skip if already queued for deletion
    if (pendingChanges.some((p) => p.slug === kebab)) continue;

    const pascal = codeGenerator.toPascalCase(kebab);
    const pageName = `${pascal}Page`;
    const canvasComp = canvasByKebab.get(kebab);
    const stateEntry = stateByKebab.get(kebab);
    const parsedCode = codeParser.parseComponentDir(kebab);

    // If canvas payload was provided and this component does not exist on the Figma canvas yet
    if (Array.isArray(payload.components) && payload.components.length > 0 && !canvasComp) {
      pendingChanges.push({
        id: `create:${kebab}`,
        slug: kebab,
        componentName: pascal,
        nodeId: null,
        pageName,
        action: 'add',
        direction: 'code-to-figma',
        title: `Create on Figma: ${pascal}`,
        summary: `${kebab}: create new component on Figma canvas from local code (src/components/${kebab})`,
        details: [
          `Create "${pascal}" component on Figma canvas with styles from src/components/${kebab}/${kebab}.scss`
        ],
        files: [
          `src/components/${kebab}/${kebab}.tsx`,
          `src/components/${kebab}/${kebab}.scss`
        ]
      });
      continue;
    }

    // Otherwise check if this component's code or resolved tokens changed compared to Figma / last snapshot
    const { changes, changedFiles } = inspectCodeVsFigmaComponentChanges(kebab, parsedCode, canvasComp, stateEntry);
    if (changes.length > 0) {
      const shortList = changes.slice(0, 2).join('; ');
      const extra = changes.length > 2 ? ` (+${changes.length - 2} more)` : '';
      pendingChanges.push({
        id: canvasComp?.id || parsedCode.nodeId || `update:${kebab}`,
        slug: kebab,
        componentName: canvasComp?.name || parsedCode.componentName || pascal,
        nodeId: canvasComp?.id || parsedCode.nodeId || null,
        pageName,
        action: 'update',
        direction: 'code-to-figma',
        title: `Update on Figma: ${kebab} (${changedFiles.map((f) => path.basename(f)).join(', ') || `${kebab}.scss`})`,
        summary: `${kebab}: update ${shortList}${extra} on Figma canvas`,
        details: changes,
        files: changedFiles.length > 0 ? changedFiles : [`src/components/${kebab}/${kebab}.scss`]
      });
    }
  }

  return pendingChanges;
}

/**
 * Snapshot a component's current local code hashes & file contents into .sync-state.json
 * so subsequent diffs can detect single-file edits and generate exact code diffs.
 */
function recordComponentCodeSnapshotInState(syncState, kebab, figmaMeta = {}) {
  if (!syncState || !kebab) return;
  syncState.components = syncState.components || {};
  const bundle = readComponentBundleSnapshot(kebab);
  if (!bundle.exists) return;

  let targetKey = figmaMeta.id || null;
  if (!targetKey) {
    for (const [id, entry] of Object.entries(syncState.components)) {
      if ((entry?.kebab || codeGenerator.toKebabCase(entry?.name || '')) === kebab) {
        targetKey = id;
        break;
      }
    }
  }
  if (!targetKey) targetKey = `local:${kebab}`;

  const existing = syncState.components[targetKey] || {};
  syncState.components[targetKey] = {
    ...existing,
    id: targetKey,
    name: figmaMeta.name || existing.name || bundle.pascal,
    kebab,
    type: figmaMeta.type || existing.type || 'COMPONENT_SET',
    pageName: figmaMeta.pageName || existing.pageName || 'Canvas',
    generated: true,
    updatedAt: new Date().toISOString(),
    codeCombinedHash: bundle.combinedHash,
    codeHashes: bundle.hashes,
    codeFilesSnapshot: {
      tsx: bundle.files.tsx,
      types: bundle.files.types,
      scss: bundle.files.scss,
      dart: bundle.files.dart
    }
  };
}

module.exports = {
  hashString,
  loadSyncState,
  saveSyncState,
  loadSyncHistory,
  saveSyncHistory,
  appendSyncHistoryEntries,
  readComponentBundleSnapshot,
  computeConciseDiff,
  inspectFigmaVsCodeComponentChanges,
  inspectTokenMapChanges,
  computeFigmaToCodeDiff,
  computeCodeToFigmaDiff,
  recordComponentCodeSnapshotInState
};
