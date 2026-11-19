// ============================================================
// HDFC Some Components — Figma Plugin Sandbox (code.js)
// Full Bi-Directional Auto-Sync Engine: Figma ↔ VS Code
// Compatible with "documentAccess": "dynamic-page"
// ============================================================
figma.showUI(__html__, { width: 420, height: 560 });

const LOG_PREFIX = '[HDFC Plugin]';

const IGNORED_PAGES = new Set([
  'Variables', 'Thumbnail', 'Get started', 'Changelog',
  'Understanding the version', '-------------', '---------',
  '------', '----------', 'Colors', 'Spatial tokens',
  'Grid & Columns', 'Typography', 'Global Size', 'Accessibility',
  'Border', 'Radius', 'Gradient', 'Elevation',
  'derpicated items', 'global_token_architecture'
]);

let isApplyingCodeUpdate = false;
let lastVariablesHash = '';
let lastSelectionHash = '';
let lastPageComponentsHash = '';
let allPagesLoaded = false;
const knownCanvasComponents = new Map();

function isIgnoredPageName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return true;
  if (IGNORED_PAGES.has(trimmed)) return true;
  if (/^[-_=~\s]+$/.test(trimmed)) return true;
  return false;
}

function hasNestedComponentOrSet(node) {
  if (!node || !('children' in node) || !Array.isArray(node.children)) return false;
  for (const child of node.children) {
    if (child.type === 'COMPONENT' || child.type === 'COMPONENT_SET') return true;
    if (hasNestedComponentOrSet(child)) return true;
  }
  return false;
}

function isCandidateComponentNode(n, isTopLevel = false) {
  if (!n || !n.name || n.type === 'INSTANCE') return false;
  const clean = n.name.trim();
  if (!clean || clean.startsWith('@') || clean.startsWith('_') || clean.startsWith('.') || clean.startsWith('rowAlpha') || clean === 'Component') {
    return false;
  }
  if (clean.includes('=')) return false;

  if (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') {
    return true;
  }

  // Also allow top-level named FRAMEs that act as standalone components (excluding generic Frame/Group wrappers)
  if (isTopLevel && n.type === 'FRAME') {
    if (/^(frame|group|section|rectangle|ellipse|line|vector|image|autolayout|row|column|wrapper|container)\s*\d*$/i.test(clean)) {
      return false;
    }
    if (hasNestedComponentOrSet(n)) {
      return false;
    }
    return true;
  }

  return false;
}

// ── Logging & Naming Helpers ────────────────────────────────

function log(msg) {
  console.log(`${LOG_PREFIX} ${msg}`);
  figma.ui.postMessage({ type: 'LOG', message: msg });
}

function normalizeName(str) {
  return String(str || '').trim().toLowerCase().replace(/[-_\s]+/g, '');
}

function toKebabTokenName(str) {
  return String(str || '')
    .replace(/[\/\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getPageOfNode(node) {
  let curr = node;
  while (curr && curr.type !== 'PAGE') {
    curr = curr.parent;
  }
  return curr;
}

function rgbToHex(r, g, b) {
  const toByte = (c) => Math.round(Math.max(0, Math.min(1, c || 0)) * 255);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(toByte(r))}${toHex(toByte(g))}${toHex(toByte(b))}`.toUpperCase();
}

function parseVariantName(name) {
  const props = {};
  const parts = String(name || '').split(',');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const k = part.slice(0, eq).trim().toLowerCase();
      const v = part.slice(eq + 1).trim().toLowerCase();
      props[k] = v;
    }
  }
  return props;
}

function isNodeOrAncestorSelected(node, selectedIds) {
  let curr = node;
  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (selectedIds.has(curr.id)) return true;
    curr = curr.parent;
  }
  return false;
}

// ── Node Lookup (Async for dynamic-page) ────────────────────

async function ensureAllPagesLoaded() {
  if (allPagesLoaded) return;
  try {
    await figma.loadAllPagesAsync();
    allPagesLoaded = true;
  } catch (e) {
    log(`⚠ loadAllPagesAsync warning: ${e.message}`);
  }
}

async function findNode(nodeId, name) {
  // 1. Exact nodeId lookup
  if (nodeId) {
    try {
      const n = await figma.getNodeByIdAsync(nodeId);
      if (n && n.type !== 'DOCUMENT' && n.type !== 'PAGE') {
        return n;
      }
    } catch {
      // Ignore invalid nodeId
    }
  }

  const targetClean = normalizeName(name);
  if (!targetClean) return null;

  // 2. Check active selection first
  for (const sel of figma.currentPage.selection) {
    if (normalizeName(sel.name) === targetClean && sel.type !== 'TEXT') {
      return sel;
    }
    if (sel.parent && normalizeName(sel.parent.name) === targetClean && sel.parent.type === 'COMPONENT_SET') {
      return sel.parent;
    }
  }

  const searchContainer = (container) => {
    try {
      const compSet = container.findOne(
        n => n.type === 'COMPONENT_SET' && normalizeName(n.name) === targetClean
      );
      if (compSet) return compSet;

      const comp = container.findOne(
        n => n.type === 'COMPONENT' && normalizeName(n.name) === targetClean
      );
      if (comp) return comp;

      const frame = container.findOne(
        n => (n.type === 'FRAME' || n.type === 'INSTANCE') && normalizeName(n.name) === targetClean
      );
      if (frame) return frame;
    } catch {
      // Ignore search errors
    }
    return null;
  };

  // 3. Search current page
  const onCurrent = searchContainer(figma.currentPage);
  if (onCurrent) return onCurrent;

  // 4. Search across all pages
  await ensureAllPagesLoaded();
  for (const page of figma.root.children) {
    if (page.id === figma.currentPage.id) continue;
    const found = searchContainer(page);
    if (found) return found;
  }

  return null;
}

// ── Figma ➔ Code: Extract Local Variables & Collections ─────

async function extractFigmaVariablesPayload() {
  const tokenMap = {};
  const rawVariables = [];
  const rawCollections = [];

  try {
    if (!figma.variables || !figma.variables.getLocalVariablesAsync) {
      return { tokenMap, rawVariables, rawCollections };
    }

    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();

    const collectionById = new Map();
    for (const c of collections) {
      collectionById.set(c.id, c);
      rawCollections.push({
        id: c.id,
        name: c.name,
        defaultModeId: c.defaultModeId,
        modes: c.modes
      });
    }

    const idToCssName = new Map();

    for (const v of variables) {
      const col = collectionById.get(v.variableCollectionId);
      const colName = col ? col.name.toLowerCase() : '';
      let cssName = toKebabTokenName(v.name);
      if (colName === 'layout' && !cssName.startsWith('layout-')) {
        cssName = `layout-${cssName}`;
      } else if (colName === 'adaptive' && cssName.startsWith('responsive-')) {
        cssName = `global-${cssName.slice('responsive-'.length)}`;
      }
      idToCssName.set(v.id, cssName);
    }

    for (const v of variables) {
      const col = collectionById.get(v.variableCollectionId);
      const colName = col ? col.name.toLowerCase() : 'semantics';
      const defaultModeId = col?.defaultModeId || Object.keys(v.valuesByMode || {})[0];
      const rawVal = defaultModeId ? v.valuesByMode[defaultModeId] : undefined;
      const tokenKey = toKebabTokenName(v.name);

      let scssValue = null;
      if (rawVal && typeof rawVal === 'object' && rawVal.type === 'VARIABLE_ALIAS' && rawVal.id) {
        const refCssName = idToCssName.get(rawVal.id);
        if (refCssName) {
          scssValue = `var(--${refCssName})`;
        }
      } else if (rawVal && typeof rawVal === 'object' && typeof rawVal.r === 'number') {
        const a = typeof rawVal.a === 'number' ? rawVal.a : 1;
        if (a < 1) {
          scssValue = `rgba(${Math.round(rawVal.r * 255)}, ${Math.round(rawVal.g * 255)}, ${Math.round(rawVal.b * 255)}, ${Number(a.toFixed(4))})`;
        } else {
          scssValue = rgbToHex(rawVal.r, rawVal.g, rawVal.b);
        }
      } else if (typeof rawVal === 'number') {
        const needsPx = /height|width|padding|margin|radius|size|gap|spacing|top|bottom|left|right|font|line|border/i.test(tokenKey);
        scssValue = needsPx ? `${rawVal}px` : String(rawVal);
      } else if (typeof rawVal === 'string') {
        scssValue = rawVal.startsWith('var(') ? rawVal : JSON.stringify(rawVal);
      }

      if (scssValue !== null) {
        if (!tokenMap[colName]) tokenMap[colName] = {};
        tokenMap[colName][tokenKey] = scssValue;
      }

      rawVariables.push({
        id: v.id,
        name: v.name,
        collectionName: colName,
        resolvedType: v.resolvedType,
        scssKey: tokenKey,
        scssValue
      });
    }
  } catch (e) {
    log(`⚠ Could not read local variables: ${e.message}`);
  }

  return { tokenMap, rawVariables, rawCollections };
}

// ── Figma ➔ Code: Serialize Component / Selection Nodes ─────

function findAllTextChildren(node) {
  const results = [];
  function walk(n) {
    if (!n) return;
    if (n.type === 'TEXT') {
      results.push(n);
      return;
    }
    if ('children' in n && Array.isArray(n.children)) {
      for (const child of n.children) walk(child);
    }
  }
  walk(node);
  return results;
}

function extractFirstSolidColor(paints) {
  if (!Array.isArray(paints)) return null;
  const solid = paints.find(p => p && p.type === 'SOLID' && p.visible !== false && p.color);
  if (!solid) return null;
  return {
    r: solid.color.r,
    g: solid.color.g,
    b: solid.color.b,
    hex: rgbToHex(solid.color.r, solid.color.g, solid.color.b)
  };
}

function serializeSingleVariantNode(child, fallbackFontSize, selectedIds) {
  const childText = findAllTextChildren(child)[0] || null;
  const vProps = parseVariantName(child.name);
  let lineHeightPx = null;
  try {
    if (childText && childText.lineHeight && typeof childText.lineHeight === 'object' && childText.lineHeight.unit === 'PIXELS') {
      lineHeightPx = Math.round(childText.lineHeight.value);
    }
  } catch {}

  return {
    id: child.id,
    name: child.name,
    type: child.type,
    isSelected: selectedIds ? isNodeOrAncestorSelected(child, selectedIds) : false,
    variantProps: vProps,
    width: Math.round(child.width || 0),
    height: Math.round(child.height || 0),
    cornerRadius: ('cornerRadius' in child && typeof child.cornerRadius === 'number') ? Math.round(child.cornerRadius) : null,
    paddingLeft: 'paddingLeft' in child ? Math.round(child.paddingLeft) : null,
    paddingRight: 'paddingRight' in child ? Math.round(child.paddingRight) : null,
    paddingTop: 'paddingTop' in child ? Math.round(child.paddingTop) : null,
    paddingBottom: 'paddingBottom' in child ? Math.round(child.paddingBottom) : null,
    itemSpacing: 'itemSpacing' in child ? Math.round(child.itemSpacing) : null,
    fontSize: (childText && typeof childText.fontSize === 'number') ? Math.round(childText.fontSize) : fallbackFontSize,
    lineHeight: lineHeightPx,
    backgroundColor: ('fills' in child) ? extractFirstSolidColor(child.fills) : null,
    textColor: (childText && 'fills' in childText) ? extractFirstSolidColor(childText.fills) : null,
    borderColor: ('strokes' in child) ? extractFirstSolidColor(child.strokes) : null
  };
}

function serializeComponentNode(node, pageName, selectedIds = new Set()) {
  const sample = (node.type === 'COMPONENT_SET' && Array.isArray(node.children) && node.children[0])
    ? node.children[0]
    : node;
  const textNodes = findAllTextChildren(sample);
  const primaryText = textNodes[0] || null;

  const fontSize = (primaryText && typeof primaryText.fontSize === 'number') ? Math.round(primaryText.fontSize) : null;
  const textContent = primaryText ? primaryText.characters : null;
  const bgColor = ('fills' in sample) ? extractFirstSolidColor(sample.fills) : null;
  const strokeColor = ('strokes' in sample) ? extractFirstSolidColor(sample.strokes) : null;
  const textColor = (primaryText && 'fills' in primaryText) ? extractFirstSolidColor(primaryText.fills) : null;

  const childrenSummary = [];
  if (node.type === 'COMPONENT_SET' && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.type === 'COMPONENT') {
        childrenSummary.push(serializeSingleVariantNode(child, fontSize, selectedIds));
      }
    }
  }

  let compPropDefs = undefined;
  try {
    if (node.type === 'COMPONENT_SET' || (node.type === 'COMPONENT' && (!node.parent || node.parent.type !== 'COMPONENT_SET'))) {
      compPropDefs = node.componentPropertyDefinitions;
    }
  } catch {
    compPropDefs = undefined;
  }

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    isSelected: selectedIds.has(node.id),
    pageName: pageName || getPageOfNode(node)?.name || figma.currentPage.name,
    width: Math.round(sample.width || node.width || 0),
    height: Math.round(sample.height || node.height || 0),
    cornerRadius: ('cornerRadius' in sample && typeof sample.cornerRadius === 'number') ? Math.round(sample.cornerRadius) : 8,
    paddingLeft: 'paddingLeft' in sample ? Math.round(sample.paddingLeft) : 16,
    paddingRight: 'paddingRight' in sample ? Math.round(sample.paddingRight) : 16,
    paddingTop: 'paddingTop' in sample ? Math.round(sample.paddingTop) : 10,
    paddingBottom: 'paddingBottom' in sample ? Math.round(sample.paddingBottom) : 10,
    itemSpacing: 'itemSpacing' in sample ? Math.round(sample.itemSpacing) : 8,
    layoutMode: 'layoutMode' in sample ? sample.layoutMode : 'HORIZONTAL',
    fontSize,
    textContent,
    backgroundColor: bgColor,
    textColor,
    borderColor: strokeColor,
    description: typeof node.description === 'string' ? node.description : '',
    documentationLinks: Array.isArray(node.documentationLinks) ? node.documentationLinks : [],
    componentPropertyDefinitions: compPropDefs,
    children: childrenSummary
  };
}

async function exportFullFigmaState(reason = 'manual', options = {}) {
  const { tokenMap, rawVariables } = await extractFigmaVariablesPayload();
  const components = [];
  const selectedItems = [];
  const selectedIds = new Set(figma.currentPage.selection.map(s => s.id));

  for (const sel of figma.currentPage.selection) {
    // Capture both the exact selected node (e.g. a single variant child) and its parent COMPONENT_SET
    if (sel.parent && sel.parent.type === 'COMPONENT_SET') {
      const variantData = serializeSingleVariantNode(sel, null, selectedIds);
      variantData.parentComponentName = sel.parent.name;
      variantData.parentComponentId = sel.parent.id;
      selectedItems.push(variantData);
      selectedItems.push(serializeComponentNode(sel.parent, figma.currentPage.name, selectedIds));
    } else {
      selectedItems.push(serializeComponentNode(sel, figma.currentPage.name, selectedIds));
    }
  }

  const collectFromPage = (page) => {
    if (isIgnoredPageName(page.name)) return;
    const pageMap = new Map();
    const visit = (n, isTopLevel = false) => {
      if (!n || n.type === 'INSTANCE') return;
      if (isCandidateComponentNode(n, isTopLevel)) {
        const serialized = serializeComponentNode(n, page.name, selectedIds);
        const key = toKebabTokenName(String(serialized.name || '').replace(/^\d+[\.\s_-]+/, ''));
        const existing = pageMap.get(key);
        if (!existing || (serialized.type === 'COMPONENT_SET' && existing.type !== 'COMPONENT_SET')) {
          pageMap.set(key, serialized);
        }
        return;
      }
      if ('children' in n && Array.isArray(n.children)) {
        for (const c of n.children) visit(c, false);
      }
    };
    if ('children' in page && Array.isArray(page.children)) {
      for (const child of page.children) visit(child, true);
    }
    for (const comp of pageMap.values()) {
      components.push(comp);
    }
  };

  const isFullScan = (
    reason === 'manual' ||
    reason === 'github-sync' ||
    reason === 'auto-connect' ||
    reason === 'pre-sync-check'
  );

  if (isFullScan) {
    await ensureAllPagesLoaded();
    for (const page of figma.root.children) {
      collectFromPage(page);
    }
  } else {
    collectFromPage(figma.currentPage);
  }

  // Track deleted components explicitly across scans
  const deletedComponents = [];
  if (isFullScan) {
    const currentIds = new Set(components.map(c => c.id));
    for (const [prevId, prevMeta] of knownCanvasComponents.entries()) {
      if (!currentIds.has(prevId)) {
        deletedComponents.push(prevMeta);
        if (!options.isPreSyncCheck) {
          knownCanvasComponents.delete(prevId);
        }
      }
    }
    if (!options.isPreSyncCheck) {
      for (const comp of components) {
        knownCanvasComponents.set(comp.id, { id: comp.id, name: comp.name, pageName: comp.pageName });
      }
    }
  }

  const allPageNames = figma.root.children.map(p => p.name);
  const pushToGithub = Boolean(
    options.pushToGithub ||
    reason === 'github-sync'
  );

  figma.ui.postMessage({
    type: options.isPreSyncCheck ? 'PRE_SYNC_FIGMA_PAYLOAD' : 'FIGMA_LIVE_SYNC_PAYLOAD',
    payload: {
      reason,
      direction: options.direction || (pushToGithub ? 'figma-to-github' : 'figma-to-code'),
      isPreSyncCheck: Boolean(options.isPreSyncCheck),
      isFullScan,
      pushToGithub,
      allPageNames,
      fileKey: figma.fileKey || null,
      fileName: figma.root.name,
      currentPageName: figma.currentPage.name,
      tokenMap,
      variablesCount: rawVariables.length,
      components,
      deletedComponents,
      selectedItems,
      timestamp: new Date().toISOString()
    }
  });

  log(`📤 Exported ${rawVariables.length} variable(s) & ${components.length} component(s)${deletedComponents.length ? ` (-${deletedComponents.length} deleted)` : ''} to VS Code (${reason})`);
}

// ── Code ➔ Figma: Canvas & Variable Mutation Helpers ────────

function unbindVariable(node, field) {
  try {
    if ('boundVariables' in node && node.boundVariables && node.boundVariables[field]) {
      node.setBoundVariable(field, null);
    }
  } catch {
    // Ignore if field cannot be unbound
  }
}

async function loadTextNodeFonts(textNode) {
  if (textNode.fontName === figma.mixed) {
    const len = textNode.characters.length;
    if (len > 0) {
      const fonts = textNode.getRangeAllFontNames(0, len);
      for (const f of fonts) {
        await figma.loadFontAsync(f);
      }
    } else {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    }
  } else if (textNode.fontName) {
    await figma.loadFontAsync(textNode.fontName);
  }
}

async function applyFontSize(node, fontSize) {
  if (!fontSize || typeof fontSize !== 'number' || fontSize <= 0) return 0;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  let updatedCount = 0;

  for (const textNode of textNodes) {
    try {
      await loadTextNodeFonts(textNode);
      if (textNode.textStyleId && textNode.textStyleId !== '') {
        try { await textNode.setTextStyleIdAsync(''); } catch {}
      }
      unbindVariable(textNode, 'fontSize');
      textNode.fontSize = fontSize;
      updatedCount++;
    } catch (e) {
      log(`  ⚠ Could not set fontSize on "${textNode.name}": ${e.message}`);
    }
  }
  return updatedCount;
}

async function applyFontWeight(node, fontWeight) {
  if (fontWeight === null || fontWeight === undefined) return;
  const style = fontWeight === 700 || fontWeight === 'bold' ? 'Bold'
    : fontWeight === 600 || fontWeight === 'semibold' ? 'Semi Bold'
      : fontWeight === 500 || fontWeight === 'medium' ? 'Medium'
        : 'Regular';
  const fallbackStyle = style === 'Semi Bold' ? 'SemiBold' : style;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);

  for (const textNode of textNodes) {
    try {
      await loadTextNodeFonts(textNode);
      const family = textNode.fontName !== figma.mixed && textNode.fontName?.family
        ? textNode.fontName.family
        : 'Inter';
      if (textNode.textStyleId && textNode.textStyleId !== '') {
        try { await textNode.setTextStyleIdAsync(''); } catch {}
      }
      unbindVariable(textNode, 'fontWeight');
      unbindVariable(textNode, 'fontStyle');
      try {
        const newFont = { family, style };
        await figma.loadFontAsync(newFont);
        textNode.fontName = newFont;
      } catch {
        const altFont = { family, style: fallbackStyle };
        await figma.loadFontAsync(altFont);
        textNode.fontName = altFont;
      }
    } catch {}
  }
}

function applyFills(node, color) {
  if (!color || typeof color !== 'object') return;
  if ('fills' in node) {
    try {
      unbindVariable(node, 'fills');
      node.fills = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyStrokes(node, color) {
  if (!color || typeof color !== 'object') return;
  if ('strokes' in node) {
    try {
      unbindVariable(node, 'strokes');
      node.strokes = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyTextColor(node, color) {
  if (!color || typeof color !== 'object') return;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  for (const t of textNodes) {
    try {
      unbindVariable(t, 'fills');
      t.fills = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyCornerRadius(node, radius) {
  if (radius === undefined || radius === null || typeof radius !== 'number') return;
  if ('cornerRadius' in node) {
    try {
      unbindVariable(node, 'cornerRadius');
      unbindVariable(node, 'topLeftRadius');
      unbindVariable(node, 'topRightRadius');
      unbindVariable(node, 'bottomLeftRadius');
      unbindVariable(node, 'bottomRightRadius');
      node.cornerRadius = radius;
    } catch {}
  }
}

function applyPadding(node, padding) {
  if (!padding || typeof padding !== 'object') return;
  if ('paddingLeft' in node) {
    try {
      if (padding.left !== undefined) {
        unbindVariable(node, 'paddingLeft');
        node.paddingLeft = padding.left;
      }
      if (padding.right !== undefined) {
        unbindVariable(node, 'paddingRight');
        node.paddingRight = padding.right;
      }
      if (padding.top !== undefined) {
        unbindVariable(node, 'paddingTop');
        node.paddingTop = padding.top;
      }
      if (padding.bottom !== undefined) {
        unbindVariable(node, 'paddingBottom');
        node.paddingBottom = padding.bottom;
      }
    } catch {}
  }
}

function applyGap(node, gap) {
  if (gap === null || gap === undefined || typeof gap !== 'number') return;
  if ('itemSpacing' in node) {
    try {
      unbindVariable(node, 'itemSpacing');
      node.itemSpacing = gap;
    } catch {}
  }
}

function applyOpacity(node, opacity) {
  if (opacity === null || opacity === undefined || typeof opacity !== 'number') return;
  if ('opacity' in node) {
    try {
      unbindVariable(node, 'opacity');
      node.opacity = Math.max(0, Math.min(1, opacity));
    } catch {}
  }
}

function applyDimensions(node, width, height) {
  if (!('resize' in node)) return;
  try {
    const targetW = (width && typeof width === 'number' && width > 0) ? width : node.width;
    const targetH = (height && typeof height === 'number' && height > 0) ? height : node.height;
    if (height && typeof height === 'number' && height > 0) unbindVariable(node, 'height');
    if (width && typeof width === 'number' && width > 0) unbindVariable(node, 'width');
    if (targetW !== node.width || targetH !== node.height) {
      node.resize(targetW, targetH);
    }
  } catch {}
}

// ── Main Message Handler (WebSocket Bridge ↔ Figma) ─────────

figma.ui.onmessage = async (msg) => {
  if (!msg?.type) return;

  switch (msg.type) {

    // ── File Info Request ────────────────────────────────────
    case 'REQUEST_FILE_INFO': {
      figma.ui.postMessage({
        type: 'FILE_INFO',
        fileKey: figma.fileKey || null,
        fileName: figma.root.name,
        currentPageName: figma.currentPage.name
      });
      break;
    }

    // ── Native Toast Feedback from GitHub Sync ───────────────
    case 'NOTIFY_GITHUB_SYNC': {
      if (msg.message) {
        figma.notify(msg.message, { error: !msg.success });
      }
      break;
    }

    // ── Pre-Sync Check Export (Figma <-> Code Diff Scan) ─────
    case 'REQUEST_PRE_SYNC_EXPORT': {
      await exportFullFigmaState('pre-sync-check', {
        isPreSyncCheck: true,
        direction: msg.direction || 'figma-to-code',
        pushToGithub: Boolean(msg.pushToGithub)
      });
      break;
    }

    // ── Full Export Request (Figma ➔ VS Code / GitHub) ──────
    case 'REQUEST_FULL_FIGMA_EXPORT': {
      await exportFullFigmaState(msg.reason || 'manual', { pushToGithub: Boolean(msg.pushToGithub) });
      break;
    }

    // ── DELETE component & dedicated page from canvas (Code ➔ Figma)
    case 'ACTION_DELETE_COMPONENT': {
      isApplyingCodeUpdate = true;
      try {
        await ensureAllPagesLoaded();
        const { nodeId, componentName, folder, figmaPageName, summary } = msg.payload || {};
        const targetNorm = normalizeName(componentName || folder);
        const folderNorm = normalizeName(folder || componentName);
        let removedNodeCount = 0;
        let removedPageName = null;

        // 1. Find and remove the primary target node (and any duplicate/wrapper frame with the same component name)
        const node = await findNode(nodeId, componentName || folder);
        const hostPage = node ? getPageOfNode(node) : null;

        if (node) {
          const parentNode = node.parent;
          knownCanvasComponents.delete(node.id);
          node.remove();
          removedNodeCount++;

          // If the parent was a wrapper frame/group that is now empty or had the exact same name, clean it up
          if (parentNode && parentNode.type !== 'PAGE' && parentNode.type !== 'DOCUMENT') {
            if (('children' in parentNode && parentNode.children.length === 0) ||
                normalizeName(parentNode.name) === targetNorm ||
                normalizeName(parentNode.name) === folderNorm) {
              try {
                knownCanvasComponents.delete(parentNode.id);
                parentNode.remove();
              } catch {}
            }
          }
        }

        // 2. Also sweep all pages for any remaining top-level component/frame matching this deleted component
        for (const page of figma.root.children) {
          if (isIgnoredPageName(page.name)) continue;
          const matches = page.findAll(n =>
            (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT' || (n.parent === page && n.type === 'FRAME')) &&
            (normalizeName(n.name) === targetNorm || normalizeName(n.name) === folderNorm)
          );
          for (const m of matches) {
            try {
              knownCanvasComponents.delete(m.id);
              m.remove();
              removedNodeCount++;
            } catch {}
          }
        }

        // 3. If a dedicated Figma Page exists for this component (e.g., page "button01") or hostPage is now empty, remove the page too
        if (figma.root.children.length > 1) {
          const candidatePages = figma.root.children.filter(p => {
            const pNorm = normalizeName(p.name);
            const matchesName = pNorm === targetNorm || pNorm === folderNorm || (figmaPageName && pNorm === normalizeName(figmaPageName));
            if (!matchesName && (!hostPage || p.id !== hostPage.id)) return false;
            // Only remove the page if its name matches the deleted component OR it has 0 remaining components
            const hasRemainingComponents = p.findOne(n => isCandidateComponentNode(n, n.parent === p));
            return matchesName || !hasRemainingComponents;
          });

          for (const pageToDelete of candidatePages) {
            if (figma.root.children.length <= 1) break;
            // If pageToDelete still has other unrelated components and doesn't match the deleted component's name, keep it
            const pNorm = normalizeName(pageToDelete.name);
            const isDedicatedNamedPage = (pNorm === targetNorm || pNorm === folderNorm);
            const remainingComp = pageToDelete.findOne(n =>
              isCandidateComponentNode(n, n.parent === pageToDelete) &&
              normalizeName(n.name) !== targetNorm &&
              normalizeName(n.name) !== folderNorm
            );
            if (remainingComp && !isDedicatedNamedPage) continue;

            if (figma.currentPage.id === pageToDelete.id) {
              const fallbackPage = figma.root.children.find(p => p.id !== pageToDelete.id);
              if (fallbackPage) {
                await figma.setCurrentPageAsync(fallbackPage);
              }
            }
            removedPageName = pageToDelete.name;
            pageToDelete.remove();
          }
        }

        const displayTarget = folder || componentName;
        const humanSummary = summary ||
          `${displayTarget}: removed from Figma${removedPageName ? ` (including page "${removedPageName}")` : ''} because it was deleted in code`;

        if (removedNodeCount > 0 || removedPageName) {
          figma.notify(`🗑️ ${humanSummary}`);
          log(`DELETED: ${humanSummary}`);
        } else {
          figma.notify(`ℹ️ "${displayTarget}" was already removed from Figma canvas`);
          log(`DELETE: "${displayTarget}" not found on canvas (already clean)`);
        }

        figma.ui.postMessage({
          type: 'CANVAS_ACTION_SUMMARY',
          item: {
            slug: folder || toKebabTokenName(componentName),
            componentName: displayTarget,
            action: 'deleted',
            direction: 'code-to-figma',
            summary: humanSummary,
            timestamp: new Date().toISOString()
          }
        });
      } finally {
        setTimeout(() => { isApplyingCodeUpdate = false; }, 1500);
      }
      break;
    }

    // ── UPDATE / CREATE component on canvas (Code ➔ Figma) ──
    case 'ACTION_UPDATE_COMPONENT': {
      isApplyingCodeUpdate = true;
      try {
        const {
          nodeId, componentName, folder, isNewComponent, summary: incomingSummary,
          fontSize, fontWeight,
          cornerRadius, padding, backgroundColor, textColor, borderColor,
          opacity, width, height, gap,
          sizesMap, variantsMap, variantProperties,
        } = msg.payload || {};

        let node = await findNode(nodeId, componentName || folder);

        if (!node && isNewComponent) {
          // Create new component on Figma canvas when added in local code
          const comp = figma.createComponent();
          comp.name = componentName || folder || 'NewComponent';
          comp.layoutMode = 'HORIZONTAL';
          comp.primaryAxisAlignItems = 'CENTER';
          comp.counterAxisAlignItems = 'CENTER';
          comp.paddingLeft = padding?.left ?? 16;
          comp.paddingRight = padding?.right ?? 16;
          comp.paddingTop = padding?.top ?? 10;
          comp.paddingBottom = padding?.bottom ?? 10;
          comp.itemSpacing = gap ?? 8;
          comp.cornerRadius = cornerRadius ?? 8;
          if (backgroundColor) {
            comp.fills = [{ type: 'SOLID', color: { r: backgroundColor.r ?? 0.05, g: backgroundColor.g ?? 0.14, b: backgroundColor.b ?? 0.25 } }];
          }
          await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
          const label = figma.createText();
          label.fontName = { family: 'Inter', style: 'Medium' };
          label.characters = componentName || folder || 'Component';
          label.fontSize = fontSize || 16;
          if (textColor) {
            label.fills = [{ type: 'SOLID', color: { r: textColor.r ?? 1, g: textColor.g ?? 1, b: textColor.b ?? 1 } }];
          }
          comp.appendChild(label);
          figma.currentPage.appendChild(comp);
          node = comp;
          knownCanvasComponents.set(node.id, { id: node.id, name: node.name, pageName: figma.currentPage.name });
        }

        if (!node) {
          log(`SKIPPED: "${componentName}" not found on canvas`);
          break;
        }

        const nodePage = getPageOfNode(node);
        if (nodePage && nodePage.id !== figma.currentPage.id) {
          try {
            await figma.setCurrentPageAsync(nodePage);
            log(`Switched to page "${nodePage.name}" for "${node.name}"`);
          } catch {}
        }
        log(`UPDATING: "${node.name}" (${node.type}, id=${node.id})`);

        if (node.type === 'INSTANCE' && variantProperties && typeof variantProperties === 'object') {
          try {
            node.setProperties(variantProperties);
            log(`Switched INSTANCE "${node.name}" properties: ${JSON.stringify(variantProperties)}`);
          } catch (e) {
            log(`⚠ Could not setProperties on INSTANCE: ${e.message}`);
          }
        }

        let updatedVariants = 0;
        let updatedTexts = 0;

        if (node.type === 'COMPONENT_SET' && 'children' in node) {
          const variantChildren = node.children.filter(c => c.type === 'COMPONENT');
          log(`Updating ${variantChildren.length} variant(s) inside COMPONENT_SET "${node.name}"...`);

          for (const variantNode of variantChildren) {
            const vProps = parseVariantName(variantNode.name);
            const sizeKey = vProps.size || vProps.sizes || '';
            const styleKey = vProps.style || vProps.variant || '';
            const stateKey = vProps.state || 'default';
            const typeKey = vProps.type || 'default';

            const sizeSpec = (sizesMap && sizeKey && sizesMap[sizeKey]) ? sizesMap[sizeKey] : null;
            const variantSpec = (variantsMap && styleKey && variantsMap[styleKey]) ? variantsMap[styleKey] : null;

            const vHeight = sizeSpec?.heightPx ?? height;
            const vRadius = sizeSpec?.radiusPx ?? cornerRadius;
            const vGap    = sizeSpec?.gapPx ?? gap;
            const vPadX   = sizeSpec?.paddingPx ?? padding?.left;
            const vFontSz = sizeSpec?.['font-sizePx'] ?? fontSize;

            if (vRadius !== null && vRadius !== undefined) {
              applyCornerRadius(variantNode, vRadius);
            }
            if (vPadX !== null && vPadX !== undefined && typeKey !== 'icon') {
              applyPadding(variantNode, {
                left: vPadX,
                right: vPadX,
                top: variantNode.paddingTop,
                bottom: variantNode.paddingBottom,
              });
            }
            if (vGap !== null && vGap !== undefined) {
              applyGap(variantNode, vGap);
            }
            if (vHeight !== null && vHeight !== undefined) {
              applyDimensions(variantNode, typeKey === 'icon' ? vHeight : null, vHeight);
            }

            if (variantSpec && typeKey === 'default') {
              let bgRgb = variantSpec.backgroundRgb || variantSpec['background-colorRgb'];
              let fgRgb = variantSpec.foregroundRgb || variantSpec.colorRgb;
              let bdRgb = variantSpec.borderRgb || variantSpec['border-colorRgb'];

              if (stateKey === 'hover') {
                bgRgb = variantSpec['hover-backgroundRgb'] || bgRgb;
                fgRgb = variantSpec['hover-foregroundRgb'] || fgRgb;
                bdRgb = variantSpec['hover-borderRgb'] || bdRgb;
              } else if (stateKey === 'pressed' || stateKey === 'active') {
                bgRgb = variantSpec['active-backgroundRgb'] || bgRgb;
                fgRgb = variantSpec['active-foregroundRgb'] || fgRgb;
                bdRgb = variantSpec['active-borderRgb'] || bdRgb;
              } else if (stateKey === 'disabled') {
                bgRgb = variantSpec['disabled-backgroundRgb'] || bgRgb;
                fgRgb = variantSpec['disabled-foregroundRgb'] || fgRgb;
                bdRgb = variantSpec['disabled-borderRgb'] || bdRgb;
              }

              if (bgRgb) applyFills(variantNode, bgRgb);
              if (fgRgb) applyTextColor(variantNode, fgRgb);
              if (bdRgb) applyStrokes(variantNode, bdRgb);
            }

            if (vFontSz) {
              updatedTexts += await applyFontSize(variantNode, vFontSz);
            }
            if (fontWeight) {
              await applyFontWeight(variantNode, fontWeight);
            }

            updatedVariants++;
          }
        } else {
          applyCornerRadius(node, cornerRadius);
          applyPadding(node, padding);
          if (backgroundColor) applyFills(node, backgroundColor);
          if (textColor) applyTextColor(node, textColor);
          if (borderColor) applyStrokes(node, borderColor);
          applyOpacity(node, opacity);
          applyDimensions(node, width, height);
          applyGap(node, gap);

          if (fontSize) {
            updatedTexts += await applyFontSize(node, fontSize);
          }
          if (fontWeight) {
            await applyFontWeight(node, fontWeight);
          }
          updatedVariants = 1;
        }

        for (const sel of figma.currentPage.selection) {
          if (sel.id !== node.id && (!node.children || !node.children.some(c => c.id === sel.id))) {
            if (fontSize) {
              updatedTexts += await applyFontSize(sel, fontSize);
            }
          }
        }

        try {
          figma.viewport.scrollAndZoomIntoView([node]);
        } catch {}

        const humanSummary = incomingSummary ||
          `${folder || node.name}: updated styles on Figma canvas (${updatedVariants} variant${updatedVariants === 1 ? '' : 's'})`;
        figma.notify(`✅ ${humanSummary}`);
        log(`UPDATED: ${humanSummary}`);

        figma.ui.postMessage({
          type: 'CANVAS_ACTION_SUMMARY',
          item: {
            slug: folder || toKebabTokenName(node.name),
            componentName: node.name,
            action: isNewComponent ? 'added' : 'updated',
            direction: 'code-to-figma',
            summary: humanSummary,
            timestamp: new Date().toISOString()
          }
        });
      } finally {
        setTimeout(() => { isApplyingCodeUpdate = false; }, 1500);
      }
      break;
    }

    // ── CAPTURE / PUSH current selection to VS Code ─────────
    case 'CAPTURE_SELECTION':
    case 'PUSH_SELECTION_TO_CODE': {
      await exportFullFigmaState('selection-push');
      figma.notify('📤 Synced Figma selection & variables to VS Code');
      break;
    }

    default:
      log(`Unknown message type: ${msg.type}`);
      break;
  }
};

log('Ready in Manual Button-Triggered Sync Mode (background canvas watchers disabled).');
