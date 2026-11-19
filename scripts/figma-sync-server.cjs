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
const gitSync = require('./git-sync.cjs');
const syncDiffEngine = require('./sync-diff-engine.cjs');

const PORT = Number(process.env.PORT || 3055);
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL_MS = Number(process.env.SYNC_POLL_INTERVAL_MS || 30_000);
// When "false", Figma edits on existing components only refresh <component>.md docs and
// never rewrite component code (.scss / .tsx / .types.ts / .dart). New components are still scaffolded.
const SYNC_CODE_UPDATES = String(process.env.SYNC_CODE_UPDATES ?? 'true').toLowerCase() !== 'false';

const getComponentsDir = () => path.join(process.cwd(), 'src', 'components');
const getPagesDir = () => path.join(process.cwd(), 'src', 'app', 'pages');
const getTokensVariablesDir = () => path.join(process.cwd(), 'src', 'tokens', 'variables');
const getStateFile = () => path.join(process.cwd(), '.sync-state.json');

const PROJECT_REGISTRY = [
  {
    id: 'some-components',
    fileKey: 'NhsXzdYzA1O9TPQlRL3wC4',
    namePattern: /some[\s-_]*components/i,
    projectDir: 'D:\\HDFC\\Some Components',
    repoUrl: 'https://github.com/d1hdfc/Some-Components.git',
    repoName: 'd1hdfc/Some-Components'
  },
  {
    id: 'ui-components',
    fileKey: 'CXxUbHl3oMzt9Bzv3SKv75',
    namePattern: /ui[\s-_]*components|foundations/i,
    projectDir: 'D:\\HDFC\\UI Components',
    repoUrl: 'https://github.com/d1hdfc/UI-Components.git',
    repoName: 'd1hdfc/UI-Components'
  }
];

function resolveProjectContext(payload = {}) {
  const fileKey = String(payload.fileKey || '').trim();
  const fileName = String(payload.fileName || '').trim();

  for (const entry of PROJECT_REGISTRY) {
    const keyMatch = fileKey && entry.fileKey === fileKey;
    const nameMatch = fileName && entry.namePattern.test(fileName);
    if ((keyMatch || nameMatch) && fs.existsSync(entry.projectDir)) {
      if (process.cwd().toLowerCase() !== entry.projectDir.toLowerCase()) {
        process.chdir(entry.projectDir);
        codeParser.invalidateTokenCache();
        console.log(`[MultiProject] Switched active workspace -> ${entry.projectDir} (${entry.repoName})`);
      }
      return entry;
    }
  }

  const cwd = process.cwd();
  const matchedByCwd = PROJECT_REGISTRY.find(e => e.projectDir.toLowerCase() === cwd.toLowerCase());
  if (matchedByCwd) return matchedByCwd;

  return {
    id: 'default',
    fileKey: fileKey || figmaApi.getFileKey(),
    projectDir: cwd,
    repoUrl: 'https://github.com/d1hdfc/Some-Components.git',
    repoName: 'd1hdfc/Some-Components'
  };
}

const channels = new Map();
const joinedChannels = new WeakMap();

let isFigmaSyncing = false;
let lastKnownVersion = null;
let lastFigmaSyncTime = null;
let lastModifiedComponentFolder = 'button';
let suppressWatcherUntil = 0;
let lastCanvasPayload = null;
let lastPendingDiff = { direction: null, items: [], payload: null };

// ==========================================
// State & Color/Scale Token Helpers
// ==========================================

function loadSyncState() {
  const sf = getStateFile();
  if (fs.existsSync(sf)) {
    try {
      return JSON.parse(fs.readFileSync(sf, 'utf8'));
    } catch {
      // ignore
    }
  }
  return { version: null, components: {} };
}

function saveSyncState(state) {
  try {
    fs.writeFileSync(getStateFile(), JSON.stringify(state, null, 2), 'utf8');
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

  const primitivesPath = path.join(getTokensVariablesDir(), 'primitives.scss');
  if (fs.existsSync(primitivesPath)) {
    let primContent = fs.readFileSync(primitivesPath, 'utf8');
    const scalesBlockMatch = primContent.match(/\$scales:\s*\(([\s\S]*?)\);/);
    if (scalesBlockMatch) {
      const entryRe = /["']([a-zA-Z0-9_-]+)["']\s*:\s*(-?\d+(?:\.\d+)?)/g;
      let m;
      while ((m = entryRe.exec(scalesBlockMatch[1])) !== null) {
        if (Math.round(parseFloat(m[2])) === num) {
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
  const primitivesPath = path.join(getTokensVariablesDir(), 'primitives.scss');
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
  const libScss = path.join(getComponentsDir(), 'library.scss');
  try { if (fs.existsSync(libScss)) fs.utimesSync(libScss, now, now); } catch { }
  try { if (fs.existsSync(mainScss)) fs.utimesSync(mainScss, now, now); } catch { }
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
  const semanticsPath = path.join(getTokensVariablesDir(), 'semantics.scss');
  if (semMatch && fs.existsSync(semanticsPath)) {
    const semKey = semMatch[1];
    const semContent = fs.readFileSync(semanticsPath, 'utf8');
    if (semContent.includes(`"${semKey}"`)) {
      const updatedSem = setTokenInScssFile(semanticsPath, semKey, newTokenVar);
      if (updatedSem) {
        // Touch component SCSS file mtime so Vite HMR reloads component styles immediately
        const now = new Date();
        try { fs.utimesSync(scssPath, now, now); } catch { }
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
  const compDir = path.join(getComponentsDir(), kebab);
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

function buildFileDiffObjects(kebab, pageName, beforeBundle, afterBundle, action = 'updated') {
  const files = [];
  const pairs = [
    { rel: `src/components/${kebab}/${kebab}.tsx`, ext: 'tsx', key: 'tsx' },
    { rel: `src/components/${kebab}/${kebab}.types.ts`, ext: 'ts', key: 'types' },
    { rel: `src/components/${kebab}/${kebab}.scss`, ext: 'scss', key: 'scss' },
    { rel: `src/components/${kebab}/${kebab}.dart`, ext: 'dart', key: 'dart' },
    { rel: `src/components/${kebab}/${kebab}.md`, ext: 'md', key: 'md' },
    { rel: `src/app/pages/${pageName}/${pageName}.tsx`, ext: 'tsx', key: 'pageTsx' }
  ];

  for (const p of pairs) {
    const beforeContent = beforeBundle?.files?.[p.key] || '';
    const afterContent = afterBundle?.files?.[p.key] || '';
    if (action === 'added' && afterContent) {
      files.push({
        path: p.rel,
        ext: p.ext,
        action: 'added',
        diff: syncDiffEngine.computeConciseDiff('', afterContent, 14)
      });
    } else if (action === 'deleted' && beforeContent) {
      files.push({
        path: p.rel,
        ext: p.ext,
        action: 'deleted',
        diff: syncDiffEngine.computeConciseDiff(beforeContent, '', 14)
      });
    } else if (beforeContent !== afterContent) {
      const diff = syncDiffEngine.computeConciseDiff(beforeContent, afterContent, 16);
      if (diff) {
        files.push({
          path: p.rel,
          ext: p.ext,
          action: 'updated',
          diff
        });
      }
    }
  }
  return files;
}

function applyFigmaLivePayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      createdCount: 0,
      updatedCount: 0,
      deletedCount: 0,
      tokensUpdated: 0,
      docsUpdated: 0,
      updatesList: [],
      historyEntries: []
    };
  }

  resolveProjectContext(payload);
  lastCanvasPayload = payload;

  const targetSlugs = options.targetSlugs instanceof Set ? options.targetSlugs : null;
  const pendingDiffMap = new Map(
    (Array.isArray(options.pendingChanges) ? options.pendingChanges : []).map((item) => [item.slug, item])
  );

  let tokensUpdated = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  const addedComponents = [];
  const updatedComponents = [];
  const removedComponents = [];
  const updatesList = [];
  const historyEntries = [];
  const nowIso = new Date().toISOString();

  const tokensVarsDir = getTokensVariablesDir();
  const componentsDir = getComponentsDir();
  const semanticsPath = path.join(tokensVarsDir, 'semantics.scss');

  // 1. Apply Figma Local Variables (Semantics, Alias, Layout) -> src/tokens/variables/*.scss
  const shouldSyncTokens = !targetSlugs || targetSlugs.has('tokens');
  if (shouldSyncTokens && payload.tokenMap && typeof payload.tokenMap === 'object') {
    const tokenChangeDescriptions = syncDiffEngine.inspectTokenMapChanges(payload.tokenMap);
    if (payload.tokenMap.semantics) {
      tokensUpdated += updateScssTokenMapFile(semanticsPath, payload.tokenMap.semantics);
    }
    if (payload.tokenMap.alias) {
      tokensUpdated += updateScssTokenMapFile(path.join(tokensVarsDir, 'alias.scss'), payload.tokenMap.alias);
    }
    if (payload.tokenMap.layout) {
      tokensUpdated += updateScssTokenMapFile(path.join(tokensVarsDir, 'layout.scss'), payload.tokenMap.layout);
    }
    if (tokensUpdated > 0) {
      const tokenSummary = tokenChangeDescriptions.length > 0
        ? `tokens: updated ${tokenChangeDescriptions.slice(0, 3).join(', ')}${tokenChangeDescriptions.length > 3 ? ` (+${tokenChangeDescriptions.length - 3} more)` : ''}`
        : `tokens: updated ${tokensUpdated} token variable(s) in src/tokens/variables/`;
      updatesList.push({
        slug: 'tokens',
        componentName: 'Design Tokens',
        pageName: 'semantics.scss',
        action: 'updated',
        direction: 'figma-to-code',
        summary: tokenSummary,
        timestamp: nowIso
      });
      historyEntries.push({
        id: `sync-tokens-${Date.now()}`,
        timestamp: nowIso,
        direction: 'figma-to-code',
        action: 'updated',
        slug: 'tokens',
        componentName: 'Design Tokens',
        pageName: 'semantics.scss',
        summary: tokenSummary,
        details: tokenChangeDescriptions.slice(0, 12),
        files: [
          {
            path: 'src/tokens/variables/semantics.scss',
            ext: 'scss',
            action: 'updated',
            diff: tokenChangeDescriptions.slice(0, 10).map((t) => `+ ${t}`).join('\n')
          }
        ]
      });
    }
  }

  // 2. Apply Selected Component Direct Edits on Canvas -> Token Variables & Component SCSS
  codeParser.invalidateTokenCache();
  const processedComponentNames = new Set();
  const beforeBundlesByKebab = new Map();

  const getBeforeBundle = (kebab) => {
    if (!beforeBundlesByKebab.has(kebab)) {
      beforeBundlesByKebab.set(kebab, syncDiffEngine.readComponentBundleSnapshot(kebab));
    }
    return beforeBundlesByKebab.get(kebab);
  };

  if (Array.isArray(payload.selectedItems) && payload.selectedItems.length > 0) {
    for (const item of payload.selectedItems) {
      const resolvedName = (item.parentComponentName || item.name || '').includes('=')
        ? (item.pageName || payload.currentPageName || 'button')
        : (item.parentComponentName || item.name);
      if (!resolvedName) continue;
      const kebab = codeGenerator.toKebabCase(resolvedName);
      if (targetSlugs && !targetSlugs.has(kebab)) continue;

      getBeforeBundle(kebab);
      const edits = SYNC_CODE_UPDATES ? applyCanvasComponentEditsToCode(item, semanticsPath, payload.currentPageName) : 0;
      if (edits > 0) {
        updatedCount += edits;
        if (!updatedComponents.includes(kebab)) updatedComponents.push(kebab);
      }
      processedComponentNames.add(kebab);
    }
  }

  // 3. Apply Universal Component Additions, Canvas Property Edits & Surgical Deletions
  if (Array.isArray(payload.components)) {
    const syncState = loadSyncState();
    const seenIds = new Set();
    const seenKebabs = new Set();

    // Deduplicate incoming components by kebab name (preferring COMPONENT_SET over COMPONENT)
    const dedupedByKebab = new Map();
    for (const comp of payload.components) {
      if (!comp || !comp.id || !comp.name) continue;
      const kebab = codeGenerator.toKebabCase(comp.name);
      if (!kebab || kebab === 'assets') continue;
      const existing = dedupedByKebab.get(kebab);
      if (!existing || (comp.type === 'COMPONENT_SET' && existing.type !== 'COMPONENT_SET')) {
        dedupedByKebab.set(kebab, comp);
      }
    }

    for (const comp of dedupedByKebab.values()) {
      const kebab = codeGenerator.toKebabCase(comp.name);
      const pascal = codeGenerator.toPascalCase(kebab);
      const pageName = `${pascal}Page`;
      seenIds.add(comp.id);
      seenKebabs.add(kebab);

      // If targeted single-component sync is active, skip components not in targetSlugs
      if (targetSlugs && !targetSlugs.has(kebab)) {
        continue;
      }

      const compDir = path.join(componentsDir, kebab);
      const hasAllFiveFiles =
        fs.existsSync(compDir) &&
        fs.existsSync(path.join(compDir, `${kebab}.tsx`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.types.ts`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.scss`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.dart`)) &&
        fs.existsSync(path.join(compDir, `${kebab}.md`));

      if (!hasAllFiveFiles) {
        suppressWatcherUntil = Date.now() + 3000;
        const beforeBundle = getBeforeBundle(kebab);
        console.log(`[FigmaSync] ➕ ADDED: Component <${comp.name}> -> created 5-file bundle + ${pageName} in src/components/${kebab}`);
        codeGenerator.generateComponentFiles(comp);
        applyCanvasComponentEditsToCode(comp, semanticsPath);
        touchMainStylesheet();

        syncDiffEngine.recordComponentCodeSnapshotInState(syncState, kebab, {
          id: comp.id,
          name: comp.name,
          type: comp.type || 'COMPONENT',
          pageName: comp.pageName || payload.currentPageName || 'Canvas'
        });

        createdCount++;
        addedComponents.push(kebab);

        const afterBundle = syncDiffEngine.readComponentBundleSnapshot(kebab);
        const summary = pendingDiffMap.get(kebab)?.summary ||
          `${kebab}: created 5 component files (.tsx, .types.ts, .scss, .dart, .md) & ${pageName} in portal`;
        updatesList.push({
          slug: kebab,
          componentName: pascal,
          pageName,
          action: 'added',
          direction: 'figma-to-code',
          summary,
          timestamp: nowIso
        });
        historyEntries.push({
          id: `sync-add-${kebab}-${Date.now()}`,
          timestamp: nowIso,
          direction: 'figma-to-code',
          action: 'added',
          slug: kebab,
          componentName: pascal,
          pageName,
          summary,
          details: pendingDiffMap.get(kebab)?.details || [
            `Scaffolded src/components/${kebab}/${kebab}.tsx, .types.ts, .scss, .dart, .md`,
            `Scaffolded portal page src/app/pages/${pageName}/${pageName}.tsx and registered in sidebar`
          ],
          files: buildFileDiffObjects(kebab, pageName, beforeBundle, afterBundle, 'added')
        });
      } else {
        const beforeBundle = getBeforeBundle(kebab);
        const inspectedChanges = syncDiffEngine.inspectFigmaVsCodeComponentChanges(comp, payload.currentPageName);
        let edits = 0;
        if (SYNC_CODE_UPDATES && !processedComponentNames.has(kebab)) {
          edits = applyCanvasComponentEditsToCode(comp, semanticsPath);
          if (edits > 0) {
            updatedCount += edits;
            if (!updatedComponents.includes(kebab)) updatedComponents.push(kebab);
            console.log(`[FigmaSync] ✏️ UPDATED: Component <${comp.name}> (${edits} token/style update(s)) in src/components/${kebab}`);
          }
        }

        // Write/update markdown docs for this targeted component
        const docRes = codeGenerator.writeComponentDocs(comp);
        const wasUpdated = edits > 0 || updatedComponents.includes(kebab) || (docRes?.changes?.length > 0);

        // Remove any synthetic local:<kebab> record once the real Figma node ID is synced
        const syntheticKey = `local:${kebab}`;
        if (syncState.components[syntheticKey] && comp.id !== syntheticKey) {
          delete syncState.components[syntheticKey];
        }
        syncDiffEngine.recordComponentCodeSnapshotInState(syncState, kebab, {
          id: comp.id,
          name: comp.name,
          type: comp.type || 'COMPONENT',
          pageName: comp.pageName || payload.currentPageName || 'Canvas'
        });

        if (wasUpdated) {
          if (!updatedComponents.includes(kebab)) {
            updatedComponents.push(kebab);
            if (edits === 0) updatedCount++;
          }
          const afterBundle = syncDiffEngine.readComponentBundleSnapshot(kebab);
          const allDetails = Array.from(new Set([
            ...(pendingDiffMap.get(kebab)?.details || []),
            ...inspectedChanges,
            ...((docRes?.changes || []).map((c) => c.replace(/`/g, '')))
          ]));
          const summary = pendingDiffMap.get(kebab)?.summary ||
            (allDetails.length > 0
              ? `${kebab}: updated ${allDetails.slice(0, 2).join('; ')}`
              : `${kebab}: synced updated Figma styles & documentation`);
          updatesList.push({
            slug: kebab,
            componentName: pascal,
            pageName,
            action: 'updated',
            direction: 'figma-to-code',
            summary,
            timestamp: nowIso
          });
          historyEntries.push({
            id: `sync-upd-${kebab}-${Date.now()}`,
            timestamp: nowIso,
            direction: 'figma-to-code',
            action: 'updated',
            slug: kebab,
            componentName: pascal,
            pageName,
            summary,
            details: allDetails.length > 0 ? allDetails : ['Updated component styles and documentation from Figma'],
            files: buildFileDiffObjects(kebab, pageName, beforeBundle, afterBundle, 'updated')
          });
        }
      }
    }

    // Handle deletions (only for targeted slugs if targetSlugs is provided)
    const candidateDeletions = new Set();
    if (Array.isArray(payload.deletedComponents)) {
      for (const delItem of payload.deletedComponents) {
        const delName = typeof delItem === 'string' ? delItem : delItem?.name;
        if (delName) candidateDeletions.add(codeGenerator.toKebabCase(delName));
      }
    }

    const isFullDocumentScan = Boolean(payload.isFullScan);
    if (isFullDocumentScan && fs.existsSync(componentsDir)) {
      for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== 'assets' && !seenKebabs.has(entry.name)) {
          candidateDeletions.add(entry.name);
        }
      }
    }

    for (const delKebab of candidateDeletions) {
      if (seenKebabs.has(delKebab)) continue;
      if (targetSlugs && !targetSlugs.has(delKebab)) continue;

      const pascal = codeGenerator.toPascalCase(delKebab);
      const pageName = `${pascal}Page`;
      const beforeBundle = getBeforeBundle(delKebab);

      suppressWatcherUntil = Date.now() + 3000;
      if (codeGenerator.deleteComponentFiles(delKebab)) {
        console.log(`[FigmaSync] 🗑️ AUTO-DELETED: Component <${delKebab}> surgically removed from src/components/${delKebab} and ${pageName}`);
        touchMainStylesheet();
        deletedCount++;
        removedComponents.push(delKebab);

        const summary = pendingDiffMap.get(delKebab)?.summary ||
          `${delKebab}: removed from src/components/${delKebab} & deleted ${pageName} because it was deleted in Figma`;
        updatesList.push({
          slug: delKebab,
          componentName: pascal,
          pageName,
          action: 'deleted',
          direction: 'figma-to-code',
          summary,
          timestamp: nowIso
        });
        historyEntries.push({
          id: `sync-del-${delKebab}-${Date.now()}`,
          timestamp: nowIso,
          direction: 'figma-to-code',
          action: 'deleted',
          slug: delKebab,
          componentName: pascal,
          pageName,
          summary,
          details: [
            `Removed folder src/components/${delKebab}/ and cleaned export in src/components/index.ts`,
            `Removed portal page src/app/pages/${pageName}/`
          ],
          files: buildFileDiffObjects(delKebab, pageName, beforeBundle, null, 'deleted')
        });
      }

      for (const [sid, srec] of Object.entries(syncState.components)) {
        if ((srec?.kebab || codeGenerator.toKebabCase(srec?.name || '')) === delKebab) {
          delete syncState.components[sid];
        }
      }
    }

    syncState.lastSync = nowIso;
    saveSyncState(syncState);
  }

  // 4. Create / update <component-name>.md docs for non-targeted scans
  const docsUpdated = targetSlugs ? updatesList.length : syncComponentDocs(payload);

  // Ensure all documentation pages and component index are sanitized
  codeGenerator.sanitizeComponentIndex();
  appPageGenerator.syncAppComponentPages();
  appPageGenerator.touchHmrEntryPoints();

  if (historyEntries.length > 0) {
    syncDiffEngine.appendSyncHistoryEntries(historyEntries);
  }

  if (createdCount > 0 || updatedCount > 0 || deletedCount > 0 || tokensUpdated > 0) {
    touchMainStylesheet();
    console.log(`[FigmaSync] Sync Summary: ${tokensUpdated} token(s) updated, ${updatedCount} component property change(s), ${createdCount} added, ${deletedCount} deleted.`);
  } else {
    console.log(`[FigmaSync] Checked ${payload.components?.length || 0} component(s) & ${payload.variablesCount || 0} variable(s) — all values in sync.`);
  }

  return {
    createdCount,
    updatedCount,
    deletedCount,
    tokensUpdated,
    docsUpdated,
    addedComponents,
    updatedComponents,
    removedComponents,
    updatesList,
    historyEntries
  };
}

/**
 * Write src/components/<kebab>/<kebab>.md for every component in the payload.
 * Selected COMPONENT_SET / COMPONENT nodes take precedence over the page scan copy.
 * Writes only when Figma-derived content changed; never modifies component code files.
 */
function syncComponentDocs(payload) {
  const byKebab = new Map();
  const collect = (node) => {
    if (!node || !node.name || String(node.name).includes('=')) return;
    if (node.type && node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET' && node.type !== 'FRAME') return;
    const kebab = codeGenerator.toKebabCase(node.name);
    if (!kebab || kebab === 'assets') return;
    // Skip unhydrated state records that have no serialized layout/variant properties
    const isHydrated = typeof node.width === 'number' || typeof node.height === 'number' || Array.isArray(node.children) || Boolean(node.componentPropertyDefinitions);
    if (!isHydrated) return;
    const existing = byKebab.get(kebab);
    if (!existing || (node.type === 'COMPONENT_SET' && existing.type !== 'COMPONENT_SET')) {
      byKebab.set(kebab, node);
    }
  };
  if (Array.isArray(payload.components)) payload.components.forEach(collect);
  if (Array.isArray(payload.selectedItems)) payload.selectedItems.forEach(collect);

  let written = 0;
  for (const [kebab, node] of byKebab) {
    suppressWatcherUntil = Math.max(suppressWatcherUntil, Date.now() + 1500);
    const { result, changes } = codeGenerator.writeComponentDocs(node);
    if (changes.length > 0) {
      console.log(`[DocsSync] FIGMA DIFF <${node.name}>: ${changes.length} change(s)`);
      for (const change of changes) console.log(`           • ${change.replace(/`/g, '')}`);
    }
    if (result) {
      written++;
      console.log(`[DocsSync] ${result.toUpperCase()}: src/components/${kebab}/${kebab}.md (${changes.length > 0 ? `${changes.length} change(s) logged` : 'Nothing changed'})`);
    }
  }
  return written;
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

    // 0. Portal-initiated Pre-Sync Request -> ask plugin for canvas snapshot or compute from cached/local state
    if (payload?.event === 'PORTAL_REQUEST_PRE_SYNC') {
      const direction = payload.direction || 'code-to-figma';
      resolveProjectContext(payload);
      // Ask connected Figma plugin to send PRE_SYNC_CHECK with fresh canvas state
      broadcastToChannel(channelName, {
        event: 'PLUGIN_EXPORT_FOR_DIFF',
        direction
      });
      // If direction is code-to-figma and we can already compute against lastCanvasPayload / syncState,
      // send an immediate fallback diff if the plugin doesn't respond within 1.2s
      setTimeout(() => {
        if (lastPendingDiff.direction === direction && lastPendingDiff.timestamp && Date.now() - lastPendingDiff.timestamp < 1100) {
          return;
        }
        const sourcePayload = lastCanvasPayload || {};
        const pendingChanges = direction === 'code-to-figma'
          ? syncDiffEngine.computeCodeToFigmaDiff(sourcePayload)
          : syncDiffEngine.computeFigmaToCodeDiff(sourcePayload);
        lastPendingDiff = {
          direction,
          items: pendingChanges,
          payload: sourcePayload,
          timestamp: Date.now()
        };
        broadcastToChannel(channelName, {
          event: 'PRE_SYNC_DIFF_RESULT',
          direction,
          pendingChanges,
          fileName: sourcePayload.fileName || 'Some Components',
          fileKey: sourcePayload.fileKey || figmaApi.getFileKey()
        });
      }, 1200);
      return;
    }

    // 1. Pre-Sync Diff Check (Scans only changed components/pages/tokens before asking user for "Yes" confirmation)
    if (payload?.event === 'PRE_SYNC_CHECK') {
      const project = resolveProjectContext(payload);
      const direction = payload.direction || (payload.pushToGithub ? 'figma-to-github' : 'figma-to-code');
      lastCanvasPayload = payload;

      const pendingChanges = direction === 'code-to-figma'
        ? syncDiffEngine.computeCodeToFigmaDiff(payload)
        : syncDiffEngine.computeFigmaToCodeDiff(payload);

      lastPendingDiff = {
        direction,
        items: pendingChanges,
        payload,
        timestamp: Date.now()
      };

      console.log(`\n[PreSyncCheck] 🔍 Scanned (${direction}): ${pendingChanges.length} pending change(s) detected.`);
      for (const item of pendingChanges) {
        console.log(`  • [${item.action.toUpperCase()}] ${item.summary}`);
      }

      broadcastToChannel(channelName, {
        event: 'PRE_SYNC_DIFF_RESULT',
        direction,
        pendingChanges,
        projectDir: project.projectDir,
        repoName: project.repoName,
        repoUrl: project.repoUrl,
        fileName: payload.fileName,
        fileKey: payload.fileKey || project.fileKey
      });
      return;
    }

    // 2. Confirmed Sync Execution (Triggered ONLY after user clicks "Yes" in confirmation popup)
    if (payload?.event === 'CONFIRM_SYNC_EXECUTION') {
      const direction = payload.direction || lastPendingDiff.direction || 'figma-to-code';
      const sourcePayload = payload.canvasPayload || lastPendingDiff.payload || lastCanvasPayload || payload;
      const project = resolveProjectContext(sourcePayload);

      const pendingItems = Array.isArray(payload.pendingChanges) && payload.pendingChanges.length > 0
        ? payload.pendingChanges
        : (Array.isArray(lastPendingDiff.items) ? lastPendingDiff.items : []);

      const confirmedSlugsArray = Array.isArray(payload.confirmedSlugs) && payload.confirmedSlugs.length > 0
        ? payload.confirmedSlugs
        : pendingItems.map((i) => i.slug);
      const confirmedSlugsSet = new Set(confirmedSlugsArray);

      console.log(`\n[Bridge] ✅ User Confirmed "YES" for ${direction.toUpperCase()} — Executing surgical sync for ${confirmedSlugsSet.size} targeted item(s): [${Array.from(confirmedSlugsSet).join(', ')}]`);

      if (direction === 'code-to-figma') {
        const result = executeSurgicalCodeToFigmaSync(pendingItems.filter((i) => confirmedSlugsSet.has(i.slug)), project);
        broadcastToChannel(channelName, {
          event: 'CODE_TO_FIGMA_COMPLETE',
          result,
          updatesList: result.updatesList,
          historyEntries: result.historyEntries,
          projectDir: project.projectDir,
          repoName: project.repoName
        });
        return;
      }

      const isGithubPushRequest = direction === 'figma-to-github' || Boolean(payload.pushToGithub);
      const result = applyFigmaLivePayload(sourcePayload, {
        targetSlugs: confirmedSlugsSet,
        pendingChanges: pendingItems
      });

      let gitResult = null;
      if (isGithubPushRequest) {
        const parts = [];
        if (result.createdCount > 0) parts.push(`+${result.createdCount} added (${result.addedComponents.join(', ')})`);
        if (result.updatedCount > 0) parts.push(`~${result.updatedCount} updated`);
        if (result.deletedCount > 0) parts.push(`-${result.deletedCount} deleted (${result.removedComponents.join(', ')})`);
        if (result.tokensUpdated > 0) parts.push(`${result.tokensUpdated} tokens`);
        const commitMsg = parts.length > 0
          ? `sync(${project.id}): ${parts.join(', ')}`
          : `sync(${project.id}): manual Figma to GitHub sync`;

        gitResult = gitSync.commitAndPush(commitMsg, {
          cwd: project.projectDir,
          repoUrl: project.repoUrl
        });
      }

      broadcastToChannel(channelName, {
        event: isGithubPushRequest ? 'FIGMA_TO_GITHUB_COMPLETE' : 'FIGMA_TO_CODE_COMPLETE',
        result,
        updatesList: result.updatesList || [],
        historyEntries: result.historyEntries || [],
        git: gitResult,
        projectDir: project.projectDir,
        repoName: project.repoName,
        repoUrl: project.repoUrl,
        fileName: sourcePayload.fileName,
        fileKey: sourcePayload.fileKey || project.fileKey,
        source: 'confirmed-manual'
      });
      return;
    }

    // 3. Direct On-Demand Sync (Ignore any legacy unconfirmed background watcher payloads)
    if (payload?.event === 'FIGMA_LIVE_SYNC_PAYLOAD' || payload?.event === 'FIGMA_TO_GITHUB_SYNC') {
      const legacyAutoReasons = new Set([
        'documentchange',
        'canvas-poll',
        'variables-poll',
        'selectionchange',
        'currentpagechange',
        'auto-connect'
      ]);
      if (payload.reason && legacyAutoReasons.has(payload.reason)) {
        return;
      }
      const project = resolveProjectContext(payload);
      const isGithubPushRequest = Boolean(
        payload.event === 'FIGMA_TO_GITHUB_SYNC' ||
        payload.pushToGithub === true ||
        payload.reason === 'github-sync'
      );

      console.log(`\n[Bridge] 🖲️ Manual Button Action (${isGithubPushRequest ? '🚀 Figma to GitHub Sync' : 'Sync Figma File -> VS Code'}) from "${payload.fileName || 'Figma'}" -> Target: ${project.projectDir}`);
      const pendingChanges = syncDiffEngine.computeFigmaToCodeDiff(payload);
      const targetSlugs = new Set(pendingChanges.map((p) => p.slug));
      const result = applyFigmaLivePayload(payload, {
        targetSlugs,
        pendingChanges
      });

      let gitResult = null;
      if (isGithubPushRequest) {
        const parts = [];
        if (result.createdCount > 0) parts.push(`+${result.createdCount} added (${result.addedComponents.join(', ')})`);
        if (result.updatedCount > 0) parts.push(`~${result.updatedCount} updated`);
        if (result.deletedCount > 0) parts.push(`-${result.deletedCount} deleted (${result.removedComponents.join(', ')})`);
        if (result.tokensUpdated > 0) parts.push(`${result.tokensUpdated} tokens`);
        const commitMsg = parts.length > 0
          ? `sync(${project.id}): ${parts.join(', ')}`
          : `sync(${project.id}): manual Figma to GitHub sync`;

        gitResult = gitSync.commitAndPush(commitMsg, {
          cwd: project.projectDir,
          repoUrl: project.repoUrl
        });
      }

      broadcastToChannel(channelName, {
        event: isGithubPushRequest ? 'FIGMA_TO_GITHUB_COMPLETE' : 'FIGMA_TO_CODE_COMPLETE',
        result,
        updatesList: result.updatesList || [],
        historyEntries: result.historyEntries || [],
        git: gitResult,
        projectDir: project.projectDir,
        repoName: project.repoName,
        repoUrl: project.repoUrl,
        fileName: payload.fileName,
        fileKey: payload.fileKey || project.fileKey,
        source: payload.reason || 'manual'
      });
      return;
    }

    // 4. Legacy / REST Figma sync request
    if (payload?.event === 'FIGMA_SYNC_REQUEST' || payload?.event === 'FIGMA_SELECTION_PUSH') {
      console.log(`[Bridge] Figma sync requested${payload.event === 'FIGMA_SELECTION_PUSH' ? ` for ${payload.items?.length || 0} selected item(s)` : ''}`);
      triggerFigmaToCodeSync(payload.event === 'FIGMA_SYNC_REQUEST' ? 'plugin-request' : 'plugin-selection');
      return;
    }

    // 5. Direct Code -> Figma sync request (evaluates targeted diff and applies only changed/deleted components)
    if (payload?.event === 'CODE_TO_FIGMA_SYNC_REQUEST') {
      const project = resolveProjectContext(payload);
      const pendingChanges = syncDiffEngine.computeCodeToFigmaDiff(payload.canvasPayload || lastCanvasPayload || {});
      const result = executeSurgicalCodeToFigmaSync(pendingChanges, project);
      broadcastToChannel(channelName, {
        event: 'CODE_TO_FIGMA_COMPLETE',
        result,
        updatesList: result.updatesList,
        historyEntries: result.historyEntries,
        projectDir: project.projectDir,
        repoName: project.repoName
      });
      return;
    }

    // 6. Auto-sync any locally-created components to Figma when plugin connects
    if (payload?.event === 'CODE_TO_FIGMA_SYNC_ALL_LOCAL') {
      resolveProjectContext(payload);
      const componentsDir = getComponentsDir();
      codeGenerator.generateForExistingComponents();
      const syncState = loadSyncState();
      for (const entry of Object.values(syncState.components)) {
        if (entry?.source === 'code' && entry.kebab && fs.existsSync(path.join(componentsDir, entry.kebab))) {
          console.log(`[Bridge] Auto-pushing locally created component <${entry.kebab}> to Figma canvas`);
          triggerCodeToFigmaSync(entry.kebab, 'create');
        }
      }
      return;
    }

    broadcastToChannel(channelName, payload);
    return;
  }
}

/**
 * Execute surgical Code -> Figma sync for ONLY the confirmed pending changes
 */
function executeSurgicalCodeToFigmaSync(confirmedItems, project) {
  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  const updatesList = [];
  const historyEntries = [];
  const nowIso = new Date().toISOString();
  const syncState = loadSyncState();

  for (const item of confirmedItems) {
    const kebab = item.slug;
    const pascal = codeGenerator.toPascalCase(kebab);
    const pageName = item.pageName || `${pascal}Page`;

    if (item.action === 'delete') {
      // Capture any previous code snapshot before deleting
      let prevEntry = null;
      for (const [id, entry] of Object.entries(syncState.components || {})) {
        if ((entry?.kebab || codeGenerator.toKebabCase(entry?.name || '')) === kebab) {
          prevEntry = entry;
          delete syncState.components[id];
        }
      }
      saveSyncState(syncState);

      suppressWatcherUntil = Date.now() + 2500;
      codeGenerator.deleteComponentFiles(kebab);

      broadcastToChannel('figma-sync', {
        event: 'CODE_TO_FIGMA_DELETE',
        componentName: item.componentName || pascal,
        folder: kebab,
        nodeId: item.nodeId || null,
        figmaPageName: item.figmaPageName || null,
        summary: item.summary
      });

      deletedCount++;
      const summary = item.summary || `${kebab}: removed from Figma because it was deleted in local code`;
      updatesList.push({
        slug: kebab,
        componentName: item.componentName || pascal,
        pageName,
        action: 'deleted',
        direction: 'code-to-figma',
        summary,
        timestamp: nowIso
      });

      const deletedFiles = [];
      if (prevEntry?.codeFilesSnapshot) {
        for (const [extKey, content] of Object.entries(prevEntry.codeFilesSnapshot)) {
          if (content) {
            const extName = extKey === 'types' ? 'types.ts' : extKey;
            deletedFiles.push({
              path: `src/components/${kebab}/${kebab}.${extName}`,
              ext: extKey === 'types' ? 'ts' : extKey,
              action: 'deleted',
              diff: syncDiffEngine.computeConciseDiff(content, '', 10)
            });
          }
        }
      } else {
        deletedFiles.push({
          path: `src/components/${kebab}/`,
          ext: 'tsx',
          action: 'deleted',
          diff: `- Deleted component folder src/components/${kebab}/ and page src/app/pages/${pageName}/`
        });
      }

      historyEntries.push({
        id: `c2f-del-${kebab}-${Date.now()}`,
        timestamp: nowIso,
        direction: 'code-to-figma',
        action: 'deleted',
        slug: kebab,
        componentName: item.componentName || pascal,
        pageName,
        summary,
        details: item.details || [
          `Removed "${item.componentName || kebab}" component & page from Figma canvas`,
          `Cleaned up local exports in src/components/index.ts & ${pageName}`
        ],
        files: deletedFiles
      });
    } else {
      // 'update' or 'add'
      let prevEntry = null;
      for (const [, entry] of Object.entries(syncState.components || {})) {
        if ((entry?.kebab || codeGenerator.toKebabCase(entry?.name || '')) === kebab) {
          prevEntry = entry;
          break;
        }
      }
      const prevBundle = prevEntry?.codeFilesSnapshot ? { files: prevEntry.codeFilesSnapshot } : null;

      triggerCodeToFigmaSync(
        kebab,
        item.action === 'add' ? 'create' : 'update',
        project?.projectDir || process.cwd(),
        {
          targetNodeId: item.nodeId,
          targetComponentName: item.componentName,
          summary: item.summary
        }
      );

      const currentBundle = syncDiffEngine.readComponentBundleSnapshot(kebab);
      const refreshedState = loadSyncState();
      syncDiffEngine.recordComponentCodeSnapshotInState(refreshedState, kebab, {
        id: item.nodeId,
        name: item.componentName || pascal
      });
      saveSyncState(refreshedState);

      if (item.action === 'add') createdCount++;
      else updatedCount++;

      const actionLabel = item.action === 'add' ? 'added' : 'updated';
      const summary = item.summary || `${kebab}: ${actionLabel} on Figma canvas from local code`;
      updatesList.push({
        slug: kebab,
        componentName: item.componentName || pascal,
        pageName,
        action: actionLabel,
        direction: 'code-to-figma',
        summary,
        timestamp: nowIso
      });

      const fileDiffs = buildFileDiffObjects(kebab, pageName, prevBundle, currentBundle, actionLabel);
      if (fileDiffs.length === 0 && currentBundle.files.scss) {
        fileDiffs.push({
          path: `src/components/${kebab}/${kebab}.scss`,
          ext: 'scss',
          action: actionLabel,
          diff: (item.details || [summary]).map((d) => `+ ${d}`).join('\n')
        });
      }

      historyEntries.push({
        id: `c2f-${actionLabel}-${kebab}-${Date.now()}`,
        timestamp: nowIso,
        direction: 'code-to-figma',
        action: actionLabel,
        slug: kebab,
        componentName: item.componentName || pascal,
        pageName,
        summary,
        details: item.details || [summary],
        files: fileDiffs
      });
    }
  }

  if (historyEntries.length > 0) {
    syncDiffEngine.appendSyncHistoryEntries(historyEntries);
  }

  return {
    createdCount,
    updatedCount,
    deletedCount,
    updatesList,
    historyEntries
  };
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

async function triggerCodeToFigmaSync(componentFolder, action = 'update', projectDir = null, options = {}) {
  if (projectDir && fs.existsSync(projectDir) && process.cwd().toLowerCase() !== projectDir.toLowerCase()) {
    process.chdir(projectDir);
    codeParser.invalidateTokenCache();
  }
  const componentsDir = getComponentsDir();
  let effectiveFolder = componentFolder;
  const rawFolderPath = path.join(componentsDir, componentFolder);

  if (action !== 'delete' && fs.existsSync(rawFolderPath)) {
    suppressWatcherUntil = Date.now() + 2000;
    const normalized = codeGenerator.normalizeSingleComponentFolder(componentFolder);
    if (normalized) effectiveFolder = normalized;
  } else if (action === 'delete') {
    effectiveFolder = codeGenerator.toKebabCase(componentFolder);
  }

  lastModifiedComponentFolder = effectiveFolder;
  console.log(`\n[SyncServer] >>> Triggering Code to Figma Surgical Sync (${action}: ${effectiveFolder})`);

  const compData = codeParser.parseComponentDir(effectiveFolder);
  const resolvedNodeId = options.targetNodeId || compData.nodeId || null;
  const resolvedComponentName = options.targetComponentName || compData.componentName;

  if (action === 'delete' || compData.isDeleted) {
    console.log(`\n[FigmaSync] 🗑️ AUTO-DELETED: Component <${resolvedComponentName}> removed from src/components and UI pages`);
    suppressWatcherUntil = Date.now() + 2500;
    codeGenerator.deleteComponentFiles(effectiveFolder);
    const syncState = loadSyncState();
    for (const [id, entry] of Object.entries(syncState.components)) {
      if ((entry.kebab || codeGenerator.toKebabCase(entry.name || '')) === effectiveFolder) {
        delete syncState.components[id];
      }
    }
    saveSyncState(syncState);
    appPageGenerator.syncAppComponentPages();
    broadcastToChannel('figma-sync', {
      event: 'CODE_TO_FIGMA_DELETE',
      componentName: resolvedComponentName,
      folder: compData.folder,
      nodeId: resolvedNodeId,
      summary: options.summary || `${effectiveFolder}: removed from Figma because it was deleted in local code`
    });
    return;
  }

  // Register newly created code component in .sync-state.json so it is tracked across lifecycle scans
  const syncState = loadSyncState();
  syncDiffEngine.recordComponentCodeSnapshotInState(syncState, compData.folder, {
    id: resolvedNodeId,
    name: resolvedComponentName
  });
  saveSyncState(syncState);

  console.log(`[CodeSync] Targeted update: src/components/${compData.folder}/${compData.folder}.scss -> Syncing to Figma Canvas`);

  broadcastToChannel('figma-sync', {
    event: 'CODE_TO_FIGMA_UPDATE',
    action,
    isNewComponent: action === 'create',
    summary: options.summary || `${compData.folder}: updated styles on Figma canvas`,
    componentName: resolvedComponentName,
    folder: compData.folder,
    nodeId: resolvedNodeId,
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
      const repoUrl = `https://github.com/d1hdfc/Some-Components/blob/main/src/components/${compData.folder}/${compData.folder}.tsx`;
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

function setupCodeWatcherForProject(projectDir) {
  const componentsDir = path.join(projectDir, 'src', 'components');
  const tokensVariablesDir = path.join(projectDir, 'src', 'tokens', 'variables');
  const pagesDir = path.join(projectDir, 'src', 'app', 'pages');

  if (!fs.existsSync(componentsDir)) return;

  console.log(`[CodeWatcher] Watching for local component changes in: ${componentsDir}`);

  const debounceTimers = new Map();
  let knownComponentFolders = new Set(
    fs.readdirSync(componentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'assets')
      .map(d => d.name)
  );

  // Also scan every 1.5s for pasted/renamed/deleted folders (since Windows fs.watch misses copy-pasted folder trees)
  setInterval(() => {
    if (Date.now() < suppressWatcherUntil) return;
    if (!fs.existsSync(componentsDir)) return;

    const currentRawFolders = fs.readdirSync(componentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'assets')
      .map(d => d.name);

    const currentSet = new Set(currentRawFolders);

    // 1. Detect newly added or renamed folders (e.g. "button copy")
    for (const rawFolder of currentRawFolders) {
      if (!knownComponentFolders.has(rawFolder)) {
        suppressWatcherUntil = Date.now() + 2500;
        process.chdir(projectDir);
        const normalized = codeGenerator.normalizeSingleComponentFolder(rawFolder) || rawFolder;
        knownComponentFolders.delete(rawFolder);
        knownComponentFolders.add(normalized);
        console.log(`[CodeWatcher] ADDED: New component folder "${rawFolder}" -> normalized to "src/components/${normalized}" & syncing to Figma`);
        triggerCodeToFigmaSync(normalized, 'create', projectDir);
      }
    }

    // 2. Detect deleted folders
    for (const prevFolder of Array.from(knownComponentFolders)) {
      if (!currentSet.has(prevFolder) && !fs.existsSync(path.join(componentsDir, prevFolder))) {
        knownComponentFolders.delete(prevFolder);
        console.log(`[CodeWatcher] DELETED: Component folder "src/components/${prevFolder}" removed locally -> syncing deletion to Figma`);
        triggerCodeToFigmaSync(prevFolder, 'delete', projectDir);
      }
    }
  }, 1500);

  fs.watch(componentsDir, { recursive: true }, (eventType, filename) => {
    if (Date.now() < suppressWatcherUntil) return;
    if (!filename) return;

    if (filename.includes('.git') || filename.includes('node_modules') || filename.endsWith('.tmp') || filename.endsWith('.__tmp__') || filename.endsWith('.md')) {
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
        process.chdir(projectDir);

        const folderPath = path.join(componentsDir, componentFolder);
        const exists = fs.existsSync(folderPath);

        if (!exists) {
          knownComponentFolders.delete(componentFolder);
          triggerCodeToFigmaSync(componentFolder, 'delete', projectDir);
        } else {
          const isNew = !knownComponentFolders.has(componentFolder);
          const normalized = codeGenerator.normalizeSingleComponentFolder(componentFolder) || componentFolder;
          knownComponentFolders.delete(componentFolder);
          knownComponentFolders.add(normalized);
          triggerCodeToFigmaSync(normalized, isNew ? 'create' : 'update', projectDir);
        }
      }, 600)
    );
  });

  if (fs.existsSync(tokensVariablesDir)) {
    console.log(`[CodeWatcher] Watching for token variable changes in: ${tokensVariablesDir}`);
    let tokenTimer = null;
    fs.watch(tokensVariablesDir, { recursive: false }, (eventType, filename) => {
      if (Date.now() < suppressWatcherUntil) return;
      if (!filename || !filename.endsWith('.scss')) return;
      if (tokenTimer) clearTimeout(tokenTimer);
      tokenTimer = setTimeout(() => {
        tokenTimer = null;
        process.chdir(projectDir);
        console.log(`[CodeWatcher] CHANGED: src/tokens/variables/${filename} -> Re-evaluating token variables & syncing to Figma`);
        codeParser.invalidateTokenCache();
        triggerCodeToFigmaSync(lastModifiedComponentFolder || 'button', 'update', projectDir);
      }, 600);
    });
  }

  if (fs.existsSync(pagesDir)) {
    console.log(`[CodeWatcher] Watching for page changes in: ${pagesDir}`);
    let pageTimer = null;
    fs.watch(pagesDir, { recursive: true }, (eventType, filename) => {
      if (Date.now() < suppressWatcherUntil) return;
      if (!filename || filename.endsWith('.tmp')) return;
      const pageFolder = filename.split(/[/\\]/)[0];
      if (!pageFolder || !pageFolder.endsWith('Page')) return;
      const slug = codeGenerator.toKebabCase(pageFolder.replace(/Page$/, ''));
      if (pageTimer) clearTimeout(pageTimer);
      pageTimer = setTimeout(() => {
        pageTimer = null;
        if (fs.existsSync(path.join(componentsDir, slug))) {
          triggerCodeToFigmaSync(slug, 'update', projectDir);
        }
      }, 600);
    });
  }
}

function setupCodeWatcher() {
  setupCodeWatcherForProject(process.cwd());
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

  if (req.method === 'GET' && pathname === '/api/sync/history') {
    const history = syncDiffEngine.loadSyncHistory();
    const componentsDir = getComponentsDir();
    const activeBundles = [];
    if (fs.existsSync(componentsDir)) {
      for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === 'assets') continue;
        const b = syncDiffEngine.readComponentBundleSnapshot(entry.name);
        if (b.exists) {
          activeBundles.push({
            slug: b.kebab,
            componentName: b.pascal,
            pageName: b.pageName,
            files: b.files
          });
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...history, activeBundles }));
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
    console.log(`🚀 HDFC On-Demand Sync & GitHub Server Running`);
    console.log(`🖲️  Mode: Manual Button-Triggered Only (No Background Watchers)`);
    console.log(`🔌 Figma Plugin Bridge WebSocket: ws://localhost:${PORT}`);
    console.log(`🩺 Health & Status Check: http://localhost:${PORT}/api/sync/status`);
    console.log('====================================================');

    codeGenerator.generateForExistingComponents();
    try {
      const state = loadSyncState();
      const compDir = getComponentsDir();
      if (fs.existsSync(compDir)) {
        for (const entry of fs.readdirSync(compDir, { withFileTypes: true })) {
          if (entry.isDirectory() && entry.name !== 'assets') {
            const hasBaseline = Object.values(state.components || {}).some(
              (c) => (c?.kebab || codeGenerator.toKebabCase(c?.name || '')) === entry.name && c?.codeHashes
            );
            if (!hasBaseline) {
              syncDiffEngine.recordComponentCodeSnapshotInState(state, entry.name);
            }
          }
        }
        saveSyncState(state);
      }
    } catch { /* ignore */ }
  });

  process.on('SIGINT', () => {
    console.log('\n[SyncServer] Shutting down gracefully...');
    wss.close();
    server.close(() => process.exit(0));
  });
}

module.exports = { applyFigmaLivePayload, triggerCodeToFigmaSync, pxToTokenVar, hexToTokenVar };
