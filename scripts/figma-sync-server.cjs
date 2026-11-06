'use strict';

require('dotenv').config();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocket, WebSocketServer } = require('ws');
const figmaApi = require('./figma-rest-api.cjs');
const cliSync = require('./cli-sync.cjs');
const codeGenerator = require('./code-generator.cjs');
const codeParser = require('./code-parser.cjs');
const appPageGenerator = require('./app-page-generator.cjs');

const PORT = Number(process.env.PORT || 3055);
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL_MS = Number(process.env.SYNC_POLL_INTERVAL_MS || 30_000);
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const PAGES_DIR = path.join(process.cwd(), 'src', 'app', 'pages');
const TOKENS_VARIABLES_DIR = path.join(process.cwd(), 'src', 'tokens', 'variables');
const STATE_FILE = path.join(process.cwd(), '.sync-state.json');

const channels = new Map();
const joinedChannels = new WeakMap();

let isFigmaSyncing = false;
let lastKnownVersion = null;
let lastFigmaSyncTime = null;
let lastModifiedComponentFolder = 'button';
let suppressWatcherUntil = 0;

// ==========================================
// State & Color/Scale Token Helpers
// ==========================================

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
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // ignore
  }
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

/**
 * Convert any numeric px value into a valid token variable from src/tokens/variables/
 * (Never returns a raw px value; registers a new scale in primitives.scss if needed).
 */
function pxToTokenVar(pxValue, propertyContext = '') {
  const num = Math.round(Number(pxValue));
  if (isNaN(num)) return 'var(--global-scale-0)';

  if (propertyContext === 'font-size') {
    const fontSizeMap = {
      11: 'var(--font-size-paragraph-2xs)',
      12: 'var(--font-size-paragraph-xsm)',
      13: 'var(--font-size-paragraph-xs)',
      14: 'var(--font-size-paragraph-sm)',
      16: 'var(--font-size-paragraph-md)',
      18: 'var(--font-size-paragraph-lg)',
      20: 'var(--font-size-heading-h5)',
      24: 'var(--font-size-heading-h4)',
      28: 'var(--font-size-heading-h3)',
      32: 'var(--font-size-heading-h2)',
      36: 'var(--font-size-heading-h1)',
      40: 'var(--font-size-display-sm)',
      44: 'var(--font-size-display-md)',
      48: 'var(--font-size-display-lg)'
    };
    if (fontSizeMap[num]) return fontSizeMap[num];
  }

  if (propertyContext === 'radius') {
    const radiusMap = {
      0: 'var(--layout-radius-3xs)',
      4: 'var(--layout-radius-2xs)',
      6: 'var(--layout-radius-xs)',
      8: 'var(--layout-radius-sm)',
      12: 'var(--layout-radius-md)',
      16: 'var(--layout-radius-lg)',
      20: 'var(--layout-radius-xl)',
      24: 'var(--layout-radius-2xl)',
      1440: 'var(--layout-radius-full)'
    };
    if (radiusMap[num]) return radiusMap[num];
  }

  if (propertyContext === 'padding' || propertyContext === 'gap') {
    const spacingMap = {
      0: 'var(--global-scale-0)',
      2: 'var(--layout-spacing-2xs)',
      4: 'var(--layout-spacing-xs)',
      8: 'var(--layout-spacing-sm)',
      12: 'var(--layout-spacing-md)',
      16: 'var(--layout-spacing-lg)',
      20: 'var(--layout-spacing-xl)',
      24: 'var(--layout-spacing-2xl)',
      28: 'var(--layout-spacing-3xl)',
      32: 'var(--layout-spacing-4xl)',
      40: 'var(--layout-spacing-5xl)',
      48: 'var(--layout-spacing-6xl)',
      64: 'var(--layout-spacing-7xl)',
      80: 'var(--layout-spacing-8xl)'
    };
    if (spacingMap[num]) return spacingMap[num];
  }

  const primitivesPath = path.join(TOKENS_VARIABLES_DIR, 'primitives.scss');
  if (fs.existsSync(primitivesPath)) {
    let primContent = fs.readFileSync(primitivesPath, 'utf8');
    const scalesBlockMatch = primContent.match(/\$scales:\s*\(([\s\S]*?)\);/);
    if (scalesBlockMatch) {
      const entryRe = /["']([a-zA-Z0-9_-]+)["']\s*:\s*(-?\d+(?:\.\d+)?)/g;
      let m;
      while ((m = entryRe.exec(scalesBlockMatch[1])) !== null) {
        if (Math.round( parseFloat(m[2]) ) === num) {
          return `var(--global-scale-${m[1]})`;
        }
      }
      // Register new scale token in primitives.scss so no raw px is ever used
      const newScaleKey = String(Math.round(num * 12.5));
      const updatedBlock = scalesBlockMatch[0].replace(
        /\n\);$/,
        `,\n  "${newScaleKey}": ${num}\n);`
      );
      primContent = primContent.replace(scalesBlockMatch[0], updatedBlock);
      suppressWatcherUntil = Date.now() + 2500;
      fs.writeFileSync(primitivesPath, primContent, 'utf8');
      codeParser.invalidateTokenCache();
      console.log(`[FigmaSync] Registered new scale token --global-scale-${newScaleKey}: ${num}px in primitives.scss`);
      return `var(--global-scale-${newScaleKey})`;
    }
  }

  return 'var(--global-scale-200)';
}

/**
 * Convert any #HEX color into a valid token variable from src/tokens/variables/
 * (Never returns a raw #hex value; registers a custom palette token in primitives.scss if needed).
 */
function hexToTokenVar(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return 'var(--surface-primary-base)';
  const targetHex = hexColor.trim().toUpperCase();
  if (!targetHex.startsWith('#')) return targetHex;

  const tokens = codeParser.loadTokenValues(true);
  // 1. Prefer global-colors-* or surface-* token matching this exact hex
  let bestGlobalMatch = null;
  for (const [tokenName, rawVal] of Object.entries(tokens)) {
    const resolved = codeParser.resolveTokenValue(`var(--${tokenName})`).trim().toUpperCase();
    if (resolved === targetHex) {
      if (tokenName.startsWith('global-colors-')) return `var(--${tokenName})`;
      if (tokenName.startsWith('surface-') && !bestGlobalMatch) {
        bestGlobalMatch = `var(--${tokenName})`;
      }
    }
  }
  if (bestGlobalMatch) return bestGlobalMatch;

  // 2. Check nearest color in global-colors-* within small RGB tolerance (<= 6)
  const rT = parseInt(targetHex.slice(1, 3), 16);
  const gT = parseInt(targetHex.slice(3, 5), 16);
  const bT = parseInt(targetHex.slice(5, 7), 16);
  for (const [tokenName, rawVal] of Object.entries(tokens)) {
    if (!tokenName.startsWith('global-colors-')) continue;
    const resolved = String(rawVal).trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(resolved)) {
      const r = parseInt(resolved.slice(1, 3), 16);
      const g = parseInt(resolved.slice(3, 5), 16);
      const b = parseInt(resolved.slice(5, 7), 16);
      if (Math.abs(r - rT) <= 6 && Math.abs(g - gT) <= 6 && Math.abs(b - bT) <= 6) {
        return `var(--${tokenName})`;
      }
    }
  }

  // 3. Register in primitives.scss $color-palette so zero raw hex is ever used in components/semantics
  const cleanHexSlug = targetHex.slice(1).toLowerCase();
  const customKey = `canvas-${cleanHexSlug}`;
  const primitivesPath = path.join(TOKENS_VARIABLES_DIR, 'primitives.scss');
  if (fs.existsSync(primitivesPath)) {
    let primContent = fs.readFileSync(primitivesPath, 'utf8');
    if (!primContent.includes(`"${customKey}"`)) {
      primContent = primContent.replace(
        /"identity-hdfc-red":\s*#[0-9a-fA-F]+/,
        (match) => `${match},\n  "${customKey}": ${targetHex}`
      );
      suppressWatcherUntil = Date.now() + 2500;
      fs.writeFileSync(primitivesPath, primContent, 'utf8');
      codeParser.invalidateTokenCache();
      console.log(`[FigmaSync] Registered new color token --global-colors-${customKey}: ${targetHex} in primitives.scss`);
    }
    return `var(--global-colors-${customKey})`;
  }

  return 'var(--surface-primary-base)';
}

// ==========================================
// Live Figma Plugin Payload Processor (Figma ➔ Code)
// ==========================================

function touchMainStylesheet() {
  const now = new Date();
  const mainScss = path.join(process.cwd(), 'src', 'app', 'main.scss');
  const libScss = path.join(COMPONENTS_DIR, 'library.scss');
  try { if (fs.existsSync(libScss)) fs.utimesSync(libScss, now, now); } catch {}
  try { if (fs.existsSync(mainScss)) fs.utimesSync(mainScss, now, now); } catch {}
}

function setTokenInScssFile(filePath, tokenKey, newTokenVarValue) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf8');
  const escapedKey = tokenKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entryRegex = new RegExp(`(["']${escapedKey}["']\\s*:\\s*)((?:var\\([^)]*\\)|rgba?\\([^)]*\\)|[^,\\r\\n()])+)`, 'g');
  let changed = false;
  content = content.replace(entryRegex, (fullMatch, prefix, oldVal) => {
    const cleanOld = oldVal.trim();
    const cleanNew = newTokenVarValue.trim();
    if (cleanOld === cleanNew) return fullMatch;
    changed = true;
    return `${prefix}${cleanNew}`;
  });
  if (changed) {
    suppressWatcherUntil = Date.now() + 2500;
    fs.writeFileSync(filePath, content, 'utf8');
    codeParser.invalidateTokenCache();
    touchMainStylesheet();
  }
  return changed;
}

function updateScssTokenMapFile(filePath, incomingMap) {
  if (!fs.existsSync(filePath) || !incomingMap || typeof incomingMap !== 'object') return 0;
  let content = fs.readFileSync(filePath, 'utf8');
  let updatedCount = 0;

  const sanitized = content.replace(/^(\s*["'][a-zA-Z0-9_-]+["']\s*:\s*var\(--[a-zA-Z0-9_-]+\))\)+(\s*,?\s*)$/gm, '$1$2');
  if (sanitized !== content) {
    content = sanitized;
    updatedCount++;
  }

  for (const [rawKey, newVal] of Object.entries(incomingMap)) {
    if (!newVal || typeof newVal !== 'string') continue;
    const escapedKey = rawKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryRegex = new RegExp(`(["']${escapedKey}["']\\s*:\\s*)((?:var\\([^)]*\\)|rgba?\\([^)]*\\)|[^,\\r\\n()])+)`, 'g');
    content = content.replace(entryRegex, (fullMatch, prefix, oldVal) => {
      const cleanOld = oldVal.trim();
      const cleanNew = newVal.trim();
      if (cleanOld === cleanNew) return fullMatch;
      if (cleanOld.startsWith('var(--') && !cleanNew.startsWith('var(--')) {
        return fullMatch;
      }
      updatedCount++;
      console.log(`[FigmaSync] TOKEN UPDATED: "${rawKey}": ${cleanOld} -> ${cleanNew} in ${path.basename(filePath)}`);
      return `${prefix}${cleanNew}`;
    });
  }

  if (updatedCount > 0) {
    suppressWatcherUntil = Date.now() + 2500;
    fs.writeFileSync(filePath, content, 'utf8');
    codeParser.invalidateTokenCache();
    touchMainStylesheet();
  }
  return updatedCount;
}

function updateComponentScssMapProperty(scssPath, sizeOrVariantKey, propName, newTokenVar) {
  if (!fs.existsSync(scssPath)) return false;
  let content = fs.readFileSync(scssPath, 'utf8');
  const blockRe = new RegExp(`(\\b${sizeOrVariantKey}\\s*:\\s*\\([\\s\\S]*?\\b${propName}\\s*:\\s*)((?:var\\([^)]*\\)|rgba?\\([^)]*\\)|[^,\\r\\n()])+)`, 'i');
  const match = content.match(blockRe);
  if (!match) return false;
  const currentVal = match[2].trim();
  // If the component SCSS map points to a semantic variable like var(--button-size-large-font-size),
  // update that semantic variable in semantics.scss so the semantic architecture stays intact!
  const semMatch = currentVal.match(/^var\(--([a-zA-Z0-9_-]+)\)$/);
  const semanticsPath = path.join(TOKENS_VARIABLES_DIR, 'semantics.scss');
  if (semMatch && fs.existsSync(semanticsPath)) {
    const semKey = semMatch[1];
    const semContent = fs.readFileSync(semanticsPath, 'utf8');
    if (semContent.includes(`"${semKey}"`)) {
      const updatedSem = setTokenInScssFile(semanticsPath, semKey, newTokenVar);
      if (updatedSem) {
        // Touch component SCSS file mtime so Vite HMR reloads component styles immediately
        const now = new Date();
        try { fs.utimesSync(scssPath, now, now); } catch {}
        return true;
      }
    }
  }

  const parts = currentVal.split(/\s+/).filter(Boolean);
  const replacementVal = (propName === 'padding' && parts.length === 2)
    ? `${parts[0]} ${newTokenVar}`
    : newTokenVar;

  if (currentVal === replacementVal) return false;
  content = content.replace(blockRe, (_, prefix) => `${prefix}${replacementVal}`);
  suppressWatcherUntil = Date.now() + 2500;
  fs.writeFileSync(scssPath, content, 'utf8');
  return true;
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

function applyCanvasComponentEditsToCode(compNode, semanticsPath, fallbackPageName = '') {
  if (!compNode) return 0;
  let rawName = compNode.parentComponentName || compNode.name;
  if (!rawName) return 0;
  if (rawName.includes('=')) {
    rawName = compNode.pageName || fallbackPageName || 'button';
  }

  const kebab = codeGenerator.toKebabCase(rawName);
  const compDir = path.join(COMPONENTS_DIR, kebab);
  if (!fs.existsSync(compDir)) return 0;

  const scssPath = path.join(compDir, `${kebab}.scss`);
  if (!fs.existsSync(scssPath)) return 0;

  const currentParsed = codeParser.parseComponentDir(kebab);
  let propUpdates = 0;

  // Gather candidate variant nodes to inspect
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
    const selectedChildren = hydratedChildren.filter(c => c.isSelected);
    const otherChildren = hydratedChildren.filter(c => !c.isSelected);
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

      // 1. Check size metrics on primary default variant (or explicitly selected variant)
      const isCanonicalSizeVariant = !styleKey || styleKey === 'primary';
      if (sizeKey && currentParsed.sizesMap?.[sizeKey] && (vNode.isSelected || (isCanonicalSizeVariant && stateKey === 'default' && typeKey === 'default'))) {
        const sizeSpec = currentParsed.sizesMap[sizeKey];

        // Font size check
        if (typeof vNode.fontSize === 'number' && vNode.fontSize > 0 && !checkedSizes.has(`${sizeKey}:font-size`)) {
          checkedSizes.add(`${sizeKey}:font-size`);
          if (sizeSpec['font-sizePx'] !== undefined && Math.round(vNode.fontSize) !== Math.round(sizeSpec['font-sizePx'])) {
            const tokenVar = pxToTokenVar(vNode.fontSize, 'font-size');
            if (updateComponentScssMapProperty(scssPath, sizeKey, 'font-size', tokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${sizeKey}): font-size -> ${tokenVar} (${vNode.fontSize}px)`);
            }
          }
        }

        // Height check
        if (typeof vNode.height === 'number' && vNode.height > 0 && !checkedSizes.has(`${sizeKey}:height`)) {
          checkedSizes.add(`${sizeKey}:height`);
          if (sizeSpec.heightPx !== undefined && Math.round(vNode.height) !== Math.round(sizeSpec.heightPx)) {
            const tokenVar = pxToTokenVar(vNode.height, 'height');
            if (updateComponentScssMapProperty(scssPath, sizeKey, 'height', tokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${sizeKey}): height -> ${tokenVar} (${vNode.height}px)`);
            }
          }
        }

        // Padding check
        if (typeof vNode.paddingLeft === 'number' && vNode.paddingLeft >= 0 && typeKey !== 'icon' && !checkedSizes.has(`${sizeKey}:padding`)) {
          checkedSizes.add(`${sizeKey}:padding`);
          if (sizeSpec.paddingPx !== undefined && Math.round(vNode.paddingLeft) !== Math.round(sizeSpec.paddingPx)) {
            const tokenVar = pxToTokenVar(vNode.paddingLeft, 'padding');
            if (updateComponentScssMapProperty(scssPath, sizeKey, 'padding', tokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${sizeKey}): padding -> ${tokenVar} (${vNode.paddingLeft}px)`);
            }
          }
        }

        // Corner radius check
        if (typeof vNode.cornerRadius === 'number' && vNode.cornerRadius >= 0 && !checkedSizes.has(`${sizeKey}:radius`)) {
          checkedSizes.add(`${sizeKey}:radius`);
          if (sizeSpec.radiusPx !== undefined && Math.round(vNode.cornerRadius) !== Math.round(sizeSpec.radiusPx)) {
            const tokenVar = pxToTokenVar(vNode.cornerRadius, 'radius');
            if (updateComponentScssMapProperty(scssPath, sizeKey, 'radius', tokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${sizeKey}): radius -> ${tokenVar} (${vNode.cornerRadius}px)`);
            }
          }
        }

        // Gap (itemSpacing) check
        if (typeof vNode.itemSpacing === 'number' && vNode.itemSpacing >= 0 && !checkedSizes.has(`${sizeKey}:gap`)) {
          checkedSizes.add(`${sizeKey}:gap`);
          if (sizeSpec.gapPx !== undefined && Math.round(vNode.itemSpacing) !== Math.round(sizeSpec.gapPx)) {
            const tokenVar = pxToTokenVar(vNode.itemSpacing, 'gap');
            if (updateComponentScssMapProperty(scssPath, sizeKey, 'gap', tokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${sizeKey}): gap -> ${tokenVar} (${vNode.itemSpacing}px)`);
            }
          }
        }
      }

      // 2. Check variant colors (background, foreground/text, border)
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
            const colorTokenVar = hexToTokenVar(incomingBgHex);
            const propKeyInMap = variantSpec[bgPropName] !== undefined ? bgPropName : 'background-color';
            if (updateComponentScssMapProperty(scssPath, styleKey, propKeyInMap, colorTokenVar)) {
              propUpdates++;
              console.log(`[FigmaSync] Updated "${kebab}" (${styleKey}/${stateKey}): ${propKeyInMap} -> ${colorTokenVar} (${incomingBgHex})`);
            }
          }
        }
      }
    }
  } else {
    // Single component node (non-COMPONENT_SET)
    if (
      typeof compNode.fontSize === 'number' &&
      compNode.fontSize > 0 &&
      currentParsed.fontSize &&
      Math.round(compNode.fontSize) !== Math.round(currentParsed.fontSize)
    ) {
      const tokenVar = pxToTokenVar(compNode.fontSize, 'font-size');
      if (updateComponentScssMapProperty(scssPath, 'medium', 'font-size', tokenVar)) {
        propUpdates++;
        console.log(`[FigmaSync] Updated "${kebab}": font-size -> ${tokenVar} (${compNode.fontSize}px)`);
      }
    }
  }

  return propUpdates;
}

function applyFigmaLivePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { createdCount: 0, updatedCount: 0, deletedCount: 0, tokensUpdated: 0 };
  }

  let tokensUpdated = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  const semanticsPath = path.join(TOKENS_VARIABLES_DIR, 'semantics.scss');

  // 1. Apply Figma Local Variables (Semantics, Alias, Layout) -> src/tokens/variables/*.scss
  if (payload.tokenMap && typeof payload.tokenMap === 'object') {
    if (payload.tokenMap.semantics) {
      tokensUpdated += updateScssTokenMapFile(
        semanticsPath,
        payload.tokenMap.semantics
      );
    }
    if (payload.tokenMap.alias) {
      tokensUpdated += updateScssTokenMapFile(
        path.join(TOKENS_VARIABLES_DIR, 'alias.scss'),
        payload.tokenMap.alias
      );
    }
    if (payload.tokenMap.layout) {
      tokensUpdated += updateScssTokenMapFile(
        path.join(TOKENS_VARIABLES_DIR, 'layout.scss'),
        payload.tokenMap.layout
      );
    }
  }

  // 2. Apply Selected Component Direct Edits on Canvas -> Token Variables & Component SCSS
  codeParser.invalidateTokenCache();
  const processedComponentNames = new Set();
  if (Array.isArray(payload.selectedItems) && payload.selectedItems.length > 0) {
    for (const item of payload.selectedItems) {
      const edits = applyCanvasComponentEditsToCode(item, semanticsPath, payload.currentPageName);
      if (edits > 0) updatedCount += edits;
      const resolvedName = (item.parentComponentName || item.name || '').includes('=')
        ? (item.pageName || payload.currentPageName || 'button')
        : (item.parentComponentName || item.name);
      if (resolvedName) {
        processedComponentNames.add(codeGenerator.toKebabCase(resolvedName));
      }
    }
  }

  // 3. Apply Component Additions, Canvas Property Edits & Deletions
  if (Array.isArray(payload.components)) {
    const syncState = loadSyncState();
    const seenIds = new Set();
    const seenKebabs = new Set();
    const protectedKebabs = new Set(['button', 'text-field', 'text-area', 'header', 'card', 'badge', 'chips', 'avatar', 'checkbox', 'radio', 'switch', 'tabs', 'tooltip', 'toast', 'snackbar']);

    for (const comp of payload.components) {
      if (!comp || !comp.id || !comp.name) continue;
      seenIds.add(comp.id);
      const kebab = codeGenerator.toKebabCase(comp.name);
      seenKebabs.add(kebab);
      const compDir = path.join(COMPONENTS_DIR, kebab);
      const hasAllFourFiles =
        fs.existsSync(compDir) &&
        fs.existsSync(path.join(compDir, `${kebab}.tsx`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.types.ts`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.scss`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.dart`));

      if (!hasAllFourFiles) {
        suppressWatcherUntil = Date.now() + 3000;
        console.log(`[FigmaSync] ADDED: Component <${comp.name}> -> created 4 files in src/components/${kebab} & page in src/app/pages/`);
        codeGenerator.generateComponentFiles(comp);
        applyCanvasComponentEditsToCode(comp, semanticsPath);
        touchMainStylesheet();
        syncState.components[comp.id] = {
          id: comp.id,
          name: comp.name,
          kebab,
          type: comp.type || 'COMPONENT',
          pageName: comp.pageName || 'Canvas',
          generated: true,
          updatedAt: new Date().toISOString()
        };
        createdCount++;
      } else {
        const isOnActivePage = Boolean(payload.currentPageName && comp.pageName === payload.currentPageName);
        if (!processedComponentNames.has(kebab) && (comp.isSelected || isOnActivePage)) {
          const edits = applyCanvasComponentEditsToCode(comp, semanticsPath);
          if (edits > 0) updatedCount += edits;
        }
        if (!syncState.components[comp.id]) {
          syncState.components[comp.id] = {
            id: comp.id,
            name: comp.name,
            kebab,
            type: comp.type || 'COMPONENT',
            pageName: comp.pageName || 'Canvas',
            generated: true,
            updatedAt: new Date().toISOString()
          };
        }
      }
    }

    // Check for deleted components when a full scan or canvas lifecycle scan was performed
    const isLifecycleScan = Boolean(payload.isFullScan);

    if (isLifecycleScan && payload.components.length > 0) {
      for (const [id, prev] of Object.entries(syncState.components)) {
        if (!prev || !prev.name) continue;
        // If the scan only covered the active page, only delete components that belonged to that page
        if (payload.currentPageName && prev.pageName && prev.pageName !== 'Canvas' && prev.pageName !== payload.currentPageName) {
          continue;
        }
        const prevKebab = prev.kebab || codeGenerator.toKebabCase(prev.name);
        if (!seenIds.has(id) && !seenKebabs.has(prevKebab) && !protectedKebabs.has(prevKebab)) {
          suppressWatcherUntil = Date.now() + 3000;
          console.log(`[FigmaSync] DELETED: Component <${prev.name}> removed from src/components/${prevKebab}, src/components/index.ts, and src/app/pages/`);
          codeGenerator.deleteComponentFiles(prev.name);
          touchMainStylesheet();
          delete syncState.components[id];
          deletedCount++;
        }
      }
    }

    syncState.lastSync = new Date().toISOString();
    saveSyncState(syncState);
  }

  // Ensure all documentation pages in src/app/pages/ follow the strict 3-file structure
  appPageGenerator.syncAppComponentPages();

  if (createdCount > 0 || updatedCount > 0 || deletedCount > 0 || tokensUpdated > 0) {
    touchMainStylesheet();
    console.log(`[FigmaSync] Sync Summary: ${tokensUpdated} token(s) updated, ${updatedCount} component property change(s), ${createdCount} added, ${deletedCount} deleted.`);
  } else {
    console.log(`[FigmaSync] Checked ${payload.components?.length || 0} component(s) & ${payload.variablesCount || 0} variable(s) — all values in sync.`);
  }

  return { createdCount, updatedCount, deletedCount, tokensUpdated };
}

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

    // 1. Live payload pushed directly from Figma Plugin (Variables + Components)
    if (payload?.event === 'FIGMA_LIVE_SYNC_PAYLOAD') {
      console.log(`\n[Bridge] Received live Figma payload from "${payload.fileName || 'Figma'}" (reason: ${payload.reason || 'sync'})`);
      const result = applyFigmaLivePayload(payload);
      broadcastToChannel(channelName, {
        event: 'FIGMA_TO_CODE_COMPLETE',
        result,
        source: payload.reason || 'plugin-live'
      });
      return;
    }

    // 2. Legacy / REST Figma sync request
    if (payload?.event === 'FIGMA_SYNC_REQUEST' || payload?.event === 'FIGMA_SELECTION_PUSH') {
      console.log(`[Bridge] Figma sync requested${payload.event === 'FIGMA_SELECTION_PUSH' ? ` for ${payload.items?.length || 0} selected item(s)` : ''}`);
      triggerFigmaToCodeSync(payload.event === 'FIGMA_SYNC_REQUEST' ? 'plugin-request' : 'plugin-selection');
      return;
    }

    // 3. Manual / Auto Code -> Figma sync request from Plugin UI
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
    console.warn('[SyncServer] Figma REST sync skipped:', error.message);
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
    appPageGenerator.syncAppComponentPages();
    broadcastToChannel('figma-sync', {
      event: 'CODE_TO_FIGMA_DELETE',
      componentName: compData.componentName,
      folder: compData.folder,
      nodeId: compData.nodeId
    });
    return;
  }

  console.log(`[CodeWatcher] CHANGED: src/components/${compData.folder}/${compData.folder}.scss -> Syncing to Figma Canvas`);
  console.log(`[FigmaSync] UPDATED: Component <${compData.componentName}> styles modified — fontSize=${compData.fontSize ?? 'n/a'}px, cornerRadius=${compData.cornerRadius ?? 'n/a'}px, height=${compData.height ?? 'n/a'}px`);

  broadcastToChannel('figma-sync', {
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

  if (compData.nodeId) {
    try {
      const fileKey = figmaApi.getFileKey();
      const repoUrl = `https://github.com/d1hdfc/UI-Components/blob/main/src/components/${compData.folder}/${compData.folder}.tsx`;
      await figmaApi.createDevResources(fileKey, [
        {
          name: `${compData.componentName} (Code Component)`,
          url: repoUrl,
          nodeId: compData.nodeId
        }
      ]);
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
    if (Date.now() < suppressWatcherUntil) return;
    if (!filename) return;

    if (filename.includes('.git') || filename.includes('node_modules') || filename.endsWith('.tmp') || filename.endsWith('.__tmp__')) {
      return;
    }

    const parts = filename.split(/[/\\]/);
    const componentFolder = parts[0];

    if (componentFolder === 'index.ts' || componentFolder === 'assets' || componentFolder.includes('.')) return;

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
      }, 600)
    );
  });

  if (fs.existsSync(TOKENS_VARIABLES_DIR)) {
    console.log(`[CodeWatcher] Watching for token variable changes in: ${TOKENS_VARIABLES_DIR}`);
    let tokenTimer = null;
    fs.watch(TOKENS_VARIABLES_DIR, { recursive: false }, (eventType, filename) => {
      if (Date.now() < suppressWatcherUntil) return;
      if (!filename || !filename.endsWith('.scss')) return;
      if (tokenTimer) clearTimeout(tokenTimer);
      tokenTimer = setTimeout(() => {
        tokenTimer = null;
        console.log(`[CodeWatcher] CHANGED: src/tokens/variables/${filename} -> Re-evaluating token variables & syncing to Figma`);
        codeParser.invalidateTokenCache();
        triggerCodeToFigmaSync(lastModifiedComponentFolder || 'button', 'update');
      }, 600);
    });
  }

  if (fs.existsSync(PAGES_DIR)) {
    console.log(`[CodeWatcher] Watching for page changes in: ${PAGES_DIR}`);
    let pageTimer = null;
    fs.watch(PAGES_DIR, { recursive: true }, (eventType, filename) => {
      if (Date.now() < suppressWatcherUntil) return;
      if (!filename || filename.endsWith('.tmp')) return;
      const pageFolder = filename.split(/[/\\]/)[0];
      if (!pageFolder || !pageFolder.endsWith('Page')) return;
      const slug = codeGenerator.toKebabCase(pageFolder.replace(/Page$/, ''));
      if (pageTimer) clearTimeout(pageTimer);
      pageTimer = setTimeout(() => {
        pageTimer = null;
        if (fs.existsSync(path.join(COMPONENTS_DIR, slug))) {
          triggerCodeToFigmaSync(slug, 'update');
        }
      }, 600);
    });
  }
}

// ==========================================
// Background Poller (Figma REST API fallback)
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
      // Silently skip when working on local copy or offline; WebSocket bridge handles live sync
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
      if (body.length > 25 * 1024 * 1024) {
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

if (require.main === module) {
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
}

module.exports = { applyFigmaLivePayload, pxToTokenVar, hexToTokenVar };
